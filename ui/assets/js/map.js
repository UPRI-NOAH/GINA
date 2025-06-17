var markers = L.markerClusterGroup();

const addtree_button = document.getElementById('addTree');
const identify_button = document.getElementById('idenTree');

let rememberMe = sessionStorage.getItem('rememberMe');


if (isLoggedIn) {
  document.getElementById('user-buttons').classList.remove('invis');
  document.getElementById('user-buttons').classList.add('mobile-visible');
  addtree_button.classList.remove('invis');
  identify_button.classList.remove('invis');
  document.getElementById('mobile-login').classList.add('invis');
  if (rememberMe === 'true') {
    document.getElementById("overlay").classList.add("invis");
    document.getElementById("map").classList.remove("map-blurred");
  } else {
    document.getElementById("overlay").classList.remove("invis");
    document.getElementById("map").classList.add("map-blurred");
  }
} else {
  addtree_button.classList.add('invis');
  identify_button.classList.add('invis');
  //document.getElementById('auth-buttons').classList.remove('invis');
  document.getElementById("overlay").classList.add("invis");
  document.getElementById("uploadoverlay").classList.add("invis");
  document.getElementById("map").classList.remove("map-blurred");
  document.getElementById('mobile-login').classList.remove('invis');
 // document.getElementById('user-buttons').classList.remove('mobile-visible');
}


var map = L.map('map').setView([12.8797, 121.7740], 5);

window.onload = function () {
  if (!navigator.geolocation || !navigator.permissions) {
    alert("Geolocation or Permissions API not supported.");
    return;
  }

  navigator.permissions.query({ name: 'geolocation' }).then(function (result) {
    if (result.state === 'granted') {
      // Permission already granted — get location silently
      navigator.geolocation.getCurrentPosition(showPosition);
    } else if (result.state === 'prompt') {
      // Ask for permission
      navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
      // Denied
      alert("Location permission was denied. Please enable it in your browser settings.");
    }
  });
};

function showPosition(position) {
  const personIcon = L.icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="blue" viewBox="0 0 24 24">
        <path d="M12 2a2 2 0 110 4 2 2 0 010-4zm-4 5h8l1 3v5h-2v7h-2v-5h-2v5H9v-7H7V10l1-3z"/>
      </svg>
    `),
    iconSize: [40, 40],
    iconAnchor: [12, 12]
  });
  
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;
  map.setView([lat, lon], 13);
  L.marker([lat, lon], { icon: personIcon }).addTo(map);

}


const legend = L.control({ position: 'bottomleft' });

legend.onAdd = function (map) {
  const div = L.DomUtil.create('div', 'info legend');
  
  div.innerHTML += `
<div style="background: white; padding: 10px; border-radius: 8px; box-shadow: 0 0 5px rgba(0,0,0,0.3); font-size: 14px;">
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <img src="./assets/img/gina_marker2.png" style="height: 24px;" />
        <span style="margin-left: 8px;">My planted/identified tree</span>
      </div>
      <div style="display: flex; align-items: center;">
        <img src="./assets/img/gina_marker.png" style="height: 24px;" />
        <span style="margin-left: 8px;">Community-planted tree</span>
      </div>
    </div>
  `;
  
  return div;
};

legend.addTo(map);


function showError(error) {
  console.error("Geolocation error:", error);
}


L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 25,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var treeIcon = L.icon({
  iconUrl: "./assets/img/gina_marker.png", // file path of image
  iconSize: [29, 39], // set size of icon
});

var owntreeIcon = L.icon({
  iconUrl: "./assets/img/gina_marker2.png", // file path of image
  iconSize: [29, 39], // set size of icon
});


function showComments(refId){
  document.getElementById("identifyoverlay").classList.remove("invis");
  document.getElementById("map").classList.add("map-blurred");
  document.getElementById('identify-ref-id').value = refId
  // alert(refId)
  $.ajax({
    url: `${identifyTreeURL}?tree_identifier__reference_id=${refId}`,
    method: "GET",
    dataType: "json",
    headers: {
      'ngrok-skip-browser-warning': 'true'
    },
    success: function (data) {
      const commentContainer = document.getElementById('comment-section');
      commentContainer.innerHTML = '';  // Clear previous comments
      if (data.length > 0) {
        data.slice(0, 5).forEach(renderComment);  // Show only first 5 initially
  
        // Show "View More" button if more than 5
        if (data.length > 5) {
          const viewMoreBtn = document.createElement('button');
          viewMoreBtn.textContent = 'View More Comments';
          viewMoreBtn.className = 'text-blue-600 font-semibold my-2';
          viewMoreBtn.onclick = function () {
            const currentCount = commentContainer.querySelectorAll('.comment-card').length;
            data.slice(currentCount, currentCount + 5).forEach(renderComment);
            if (currentCount + 5 >= data.length) viewMoreBtn.remove();
          };
          commentContainer.appendChild(viewMoreBtn);
        }
  
        // Apply fixed height styling
        const modal = document.getElementById('identify-modal');
        modal.classList.add('h-3/4');
        modal.classList.remove('max-h-[75vh]');
      } else {
        // Shrink modal if no comments
        const modal = document.getElementById('identify-modal');
        modal.classList.remove('h-3/4');
        modal.classList.add('max-h-[75vh]');
      }
    },
    error: function (xhr) {
      alert(`Failed to fetch comments: ${xhr.statusText}`);
    }
  });
}


function renderComment(comment) {
  const commentCard = document.createElement('div');
  commentCard.className = 'comment-card border rounded-md p-3 ml-3 my-3';
  const date = new Date(comment.identified_on);
  const formattedDate = date.toLocaleString();
  const currentUser = localStorage.getItem('username') || sessionStorage.getItem('username');
  const canDelete = currentUser === comment.identified_by;
  const edited = comment.edited_on !== null; 

  commentCard.innerHTML = `
    <div class="flex gap-3 items-center justify-between">
      <div class="flex gap-3 items-center">
        <h3 class="font-bold">${comment.identified_by || 'Anonymous'}</h3>
        <span class="text-sm text-gray-500">${formattedDate}</span>
        ${edited ? `<span class="text-xs italic text-gray-400">(Edited)</span>` : ''}
      </div>
      ${canDelete ? `
        <div class="flex gap-2">
          <button onclick="editComment(${comment.id}, '${comment.tree_identifier}', this)" class="text-green-500 text-sm hover:underline">Edit</button>  
          <button onclick="deleteComment(${comment.id}, '${comment.tree_identifier}')" class="text-red-500 font-bold hover:text-red-700">&times;</button>
        </div>
      ` : ''}
    </div>
    <p class="text-gray-600 mt-2">${comment.tree_comment}</p>
  `;

  document.getElementById('comment-section').appendChild(commentCard);

}



var treeList = $.ajax({
  url: treeLibURL,
  dataType: "json",
  headers: {
    'ngrok-skip-browser-warning': 'true'
  },
  error: function (xhr) {
    alert(xhr.statusText);
  }
});

$.when(treeList).done(function () {
  treeJSON = treeList.responseJSON;
  const dynamicSelect = document.getElementById('plant-name');
  const editDynamicSelect = document.getElementById('edit-plant-name');
  dynamicSelect.innerHTML = '<option value="">Select a specie</option>';
  editDynamicSelect.innerHTML = '<option value="">Select a specie</option>';
  treeJSON.forEach(item => {
    const selects = [dynamicSelect, editDynamicSelect];
      selects.forEach(select => {
        const option = document.createElement('option');
        option.value = item.tree_name;
        option.textContent = item.tree_name;
        select.appendChild(option);
    });
    
  });
  

});


var ph = $.ajax({
  url: usertreeURL,
  dataType: "json",
  headers: {
    'ngrok-skip-browser-warning': 'true'
  },
  error: function (xhr) {
    alert(xhr.statusText);
  }
});

$.when(ph).done(function () {
  bound = ph.responseJSON;
  bound.forEach(function(feature) {
    var latlng = L.latLng(feature.latitude, feature.longitude);
    
    var icon = (username === feature.owning_user) ? owntreeIcon : treeIcon;
    var marker = L.marker(latlng, { icon: icon })
    marker.feature = feature; // add feature property to marker

    marker.on('click', function(e) {
      var refId = feature.reference_id;
      var name = feature.tree_name;
      var user = feature.owning_user;
      var treeType = feature.tree_type || "N/A";
      var treeDescription = feature.tree_description;
      var plantDate = feature.planted_on;
      var latestDate = feature.latest_tree_update;
      var action = feature.action;
      var photoUrl = feature.image;
      var version = feature.version;
      var lat = feature.latitude;
      var lng = feature.longitude;
      
      let editIconUrl = "https://cdn-icons-png.flaticon.com/128/481/481874.png"


      let latestPlantedOnDate = new Date(latestDate); // assuming ISO string
      const plantedOnDate = new Date(plantDate); // assuming ISO string
      // const now = new Date("2028-11-10T00:00:00.000Z");  // Dummy future date
      // const now = new Date("2028-11-07T00:00:00.000Z");  // Dummy future date
      // const now = new Date("2028-05-08T00:00:00.000Z");  // Dummy future date to trigger 3 years 6 months logic
      // const now = new Date("2025-06-09T00:00:00.000Z");  // Dummy future date
      const now = new Date();

      const oneHourAfterPlanting = new Date(plantedOnDate.getTime() + 60 * 60 * 1000); // 1 hour in ms
      const oneHourAfterLastUpdate = new Date(latestPlantedOnDate.getTime() + 60 * 60 * 1000);

      const oneMonthLater = new Date(latestPlantedOnDate);
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

      const threeYearsAfterPlanting = new Date(plantedOnDate);
      threeYearsAfterPlanting.setFullYear(plantedOnDate.getFullYear() + 3);

      const sixMonthsAfterLastUpdate = new Date(latestPlantedOnDate);
      sixMonthsAfterLastUpdate.setMonth(latestPlantedOnDate.getMonth() + 6);

      if (now <= oneHourAfterPlanting || now <= oneHourAfterLastUpdate) {
        editIconUrl = "https://cdn-icons-png.flaticon.com/128/481/481874.png"; // unlocked/edit icon
      } else {
        editIconUrl = "https://cdn-icons-png.flaticon.com/128/992/992651.png"; // locked icon
      }
      // var editIconUrl = (username === user)
      //   ? "https://cdn-icons-png.flaticon.com/128/481/481874.png"
      //   : "https://cdn-icons-png.flaticon.com/512/149/149852.png";

      // Create popup DOM elements
      const popupContent = document.createElement("div");
      popupContent.className = "relative bg-white p-3 rounded-xl text-xs w-full";
    
      const button = document.createElement("button");

      const isOneMonth = now >= oneMonthLater
      // const isThreeYrs = now >= threeYearsAfterPlanting


      button.id = "popup-button";
      button.style.position = "absolute";
      button.style.top = "5px";
      button.style.left = "5px";
      button.style.zIndex = "1000";
      button.style.backgroundColor = "#0095ff";
      button.style.color = "white";
      button.style.border = "none";
      button.style.padding = "5px 5px";
      button.style.cursor = "pointer";
      button.style.fontSize = "10px";
      button.style.borderRadius = "10px";
      button.innerHTML = `<img src="${editIconUrl}" style="width: 15px; height: 15px;">`;
      if (username != user) {
        button.style.display = 'none';
      }
      // latestPlantedOnDate = new Date("2028-05-08T00:00:00.000Z");  // Dummy future date
      button.addEventListener("click", function(event) {
        event.stopPropagation();
        // if (!isOneMonth) {
        //   alert("You can only edit this tree within 1 month of planting.");
        //   return;
        // }
        if (action != "Identified"){
        if (now <= oneHourAfterPlanting || now <= oneHourAfterLastUpdate) {
          editTreeClick(refId, name, user, treeType, treeDescription, plantDate, action);
          return;
        }
        
        if (now >= oneMonthLater && now < threeYearsAfterPlanting) {
          // pag may 6 below yung now pasok dito
          editTreeClick(refId, name, user, treeType, treeDescription, plantDate, action);
          
        }

        // Case 2: After 3 years — only allow updates after 6 months
        else if (now >= threeYearsAfterPlanting) {
          
          if (now >= sixMonthsAfterLastUpdate) {
            
            // Editing allowed after 6 months post 3 years"
            editTreeClick(refId, name, user, treeType, treeDescription, plantDate, action);
            return;
          } else {
            
            alert("After 3 years, you can only edit this tree every 6 months.");
            return;
          }
        }

        // Case 3: Less than 1 month after planting — block edits
        else if (now < oneMonthLater) {
          alert("Tree edits are locked. You can only edit it within 1 hour of planting or update after 1 month.");
          return;
        }

        else {
          alert("Editing is not yet allowed at this time.");
          return;
        }
      } else{
          
        editTreeClick(refId, name, user, treeType, treeDescription, plantDate, action);

      }


      });
      const infoDiv = document.createElement("div");
      const photoId = `tree-photo-${refId}`;

      infoDiv.innerHTML = `
        <div class="flex flex-col md:flex-row gap-3 h-full p-2 box-border">
          <div class="w-full md:w-[40%]">
            <div class="w-full md:h-[220px]">
              <img 
                id="${photoId}" 
                src="${photoUrl}" 
                alt="Tree photo" 
                class="h-full w-full object-cover rounded-md"
              />
            </div>
          </div>
          <div class="w-full md:w-[70%] text-xs text-gray-800 leading-none flex flex-col justify-between">
            <div>
              <p><span class="font-semibold">Name:</span> ${name.trim()}</p>
              <p><span class="font-semibold">Description:</span> ${treeDescription}</p>
              <p><span class="font-semibold">Tree Type:</span> ${treeType}</p>
              <p><span class="font-semibold">Date Planted:</span> ${plantDate}</p>
              <p><span class="font-semibold">Planted by:</span> ${user}</p>
              <p><span class="font-semibold">Version:</span> ${version}</p>
            </div>
            <div class="mt-2 text-right">
              <button onclick="showComments('${refId}')" 
                class="bg-green-500 text-white px-4 py-1.5 rounded-md hover:bg-green-600 transition-all text-xs shadow-sm">
                View Discussion
              </button>
            </div>
          </div>
        </div>
      `;


popupContent.className = "relative bg-white p-3 rounded-xl text-xs w-full max-w-[52rem] min-h-[12rem]";

 
      // Add button and info to popup
      popupContent.appendChild(button);
      popupContent.appendChild(infoDiv);
    

      setTimeout(() => {
        const img = document.getElementById(photoId);
        if (img) {
          img.addEventListener("click", function(event) {
            
            event.stopPropagation();
            clickTreeImg(name, refId)
            
          });
        }
      }, 0);


      // Open popup with full DOM content
      L.popup()
        .setLatLng(e.latlng)
        .setContent(popupContent) // not a string — a DOM node!
        .openOn(map);

      setTimeout(() => {
        const wrapper = document.querySelector(".leaflet-popup-content-wrapper");
        const content = document.querySelector(".leaflet-popup-content");

        // Mobile: < 768px
        const isMobile = window.innerWidth < 768;

        const width = isMobile ? "140px" : "420px";
        const height = isMobile ? "80px" : "240px";

        if (wrapper) {
          wrapper.style.setProperty("max-width", "none", "important");
          wrapper.style.setProperty("width", "420px", "important");
          wrapper.style.setProperty("height", "240px", "important");
        }

        if (content) {
          content.style.setProperty("width", "100%", "important");
          content.style.setProperty("height", "100%", "important");
          content.style.setProperty("margin", "0", "important");
          content.style.setProperty("padding", "0", "important");
        }
      }, 0);

    });

    markers.addLayer(marker);

  });
    map.addLayer(markers);

});

L.Control.geocoder().addTo(map);

let mark;


function editTreeClick(refId, name, user, treeType, treeDescription, plantDate, action) {
  if (user == username){
    const modalTitle = document.getElementById('modalEditTitle');
    const modalDesc = document.getElementById('modalEditDesc');
    modalTitle.innerHTML = "Edit the tree you planted"
    if(action == "Identified"){
      modalTitle.innerHTML = "Edit the tree you identified"
    }
    modalDesc.innerHTML = "Please fill in the details of the tree you want to edit"
    document.getElementById("editoverlay").classList.remove("invis");
    document.getElementById("map").classList.add("map-blurred");

    document.getElementById('edit-action').value = action
    document.getElementById('edit-ref-id').value = refId
    document.getElementById('edit-plant-name').value = name
    document.getElementById('edit-description').value = treeDescription
    document.getElementById('edit-tree-type').value = treeType
    document.getElementById('edit-date').value = plantDate

  }
  
}


function clickTreeImg(name, refId) {
  showLoading()
  document.getElementById("treeArchiveTitleOverlay").classList.remove("invis");
  document.getElementById("map").classList.add("map-blurred");
  document.getElementById('treeTitle').innerText = name; // similar, browser-dependent

  var treeGall = $.ajax({
    url: `${treeArchiveURL}?reference_id__reference_id=${refId}`,
    dataType: "json",
    headers: {
      'ngrok-skip-browser-warning': 'true'
    },
    error: function (xhr) {
      alert(xhr.statusText);
    }
  });

  $.when(treeGall).done(function () {
    const treeGallJSON = treeGall.responseJSON;
    hideLoading()
    let indicatorsContainer = document.getElementById('carouselIndicators');

    if (!indicatorsContainer) {
      indicatorsContainer = document.createElement('div');
      indicatorsContainer.id = 'carouselIndicators';
      indicatorsContainer.className = 'absolute bottom-0 left-0 right-0 z-[2] mx-[15%] mb-4 flex list-none justify-center p-0';
      indicatorsContainer.setAttribute('data-twe-carousel-indicators', '');
      document.getElementById('carouselExampleCaptions')?.appendChild(indicatorsContainer);
    }

    indicatorsContainer.innerHTML = ''; // clear it
    $('#carouselItems').empty();

    // Dynamically inject carousel indicators and items
    treeGallJSON.forEach((tree, index) => {
      // Create indicator buttons
      const indicatorButton = document.createElement('button');
      indicatorButton.type = 'button';
      indicatorButton.setAttribute('data-twe-target', '#carouselExampleCaptions');
      indicatorButton.setAttribute('data-twe-slide-to', index);
      indicatorButton.classList.add(
        'mx-1',         // less horizontal spacing
        'h-2',          // smaller height
        'w-2',          // smaller width
        'rounded-full', // circular shape
        'bg-green-600', // green color
        'opacity-50',
        'border',
        'border-white',
        'z-50',
      );

      if (index === 0) {
        indicatorButton.classList.add('opacity-100'); // active indicator
      }
      // indicatorButton.textContent = index + 1;  // make them visible with numbers
      document.getElementById('carouselIndicators')?.appendChild(indicatorButton);
      document.getElementById('carouselIndicators').style.bottom = '-10px'; // Moves it further down

      // Create carousel items
      const carouselItem = document.createElement('div');
      carouselItem.classList.add(
        'relative', 'float-left', '-mr-[100%]', 'w-60',
        'transition-transform', 'duration-[600ms]', 'ease-in-out', 'hidden' // <-- hidden by default
      );
      carouselItem.setAttribute('data-twe-carousel-item', '');
      carouselItem.innerHTML = `
        <img src="${tree.image}" class="block w-full h-80 object-cover mx-auto" alt="${tree.tree_name}" />

      <div class="absolute inset-x-[15%] bottom-0 py-5 px-4 text-left text-white md:block rounded">
        <p class="bg-green-600 bg-opacity-50 px-1.5">Updated on: ${tree.planted_on}</p>
      </div>
      `;
      document.getElementById('carouselItems')?.appendChild(carouselItem);
    });

    // Get all indicators and items
    const indicators = document.querySelectorAll('#carouselIndicators button');
    const items = document.querySelectorAll('#carouselItems .relative');

    let currentIndex = 0;

    // Initialize first visible item
    if (items.length && indicators.length) {
      items[0].classList.remove('hidden');
      indicators[0].classList.add('opacity-100');
      indicators[0].classList.remove('opacity-50');
    } else {
      
    }

    // Move to a specific slide
    function moveToSlide(index) {
      
      if (
        items[currentIndex] &&
        items[index] &&
        indicators[currentIndex] &&
        indicators[index]
      ) {
        items[currentIndex].classList.add('hidden');
        indicators[currentIndex].classList.remove('opacity-100');
        indicators[currentIndex].classList.add('opacity-50');

        items[index].classList.remove('hidden');
        indicators[index].classList.add('opacity-100');
        indicators[index].classList.remove('opacity-50');

        currentIndex = index;
      } else {
        console.error('Invalid carousel index or element missing:', {
          currentIndex,
          requestedIndex: index
        });
      }
    }

    // Indicator button click
    indicators.forEach((button, index) => {
      button.addEventListener('click', () => moveToSlide(index));
    });

    // Previous/Next button click
    const prevButton = document.querySelector('[data-twe-slide="prev"]');
    const nextButton = document.querySelector('[data-twe-slide="next"]');
    
    nextButton?.querySelector('svg')?.classList.add('text-green-500');
    prevButton?.querySelector('svg')?.classList.add('text-green-500');

    
    if (prevButton && nextButton) {
      nextButton.classList.add(
        'bg-yellow-300',
        'w-10',
        'h-10',
        'flex',
        'items-center',
        'justify-center',
        'rounded-md',
        'absolute',
        'top-1/2',
        'right-0',
        '-translate-y-[52%]'
      );
      prevButton.classList.add(
        'bg-yellow-300',
        'w-10',
        'h-10',
        'flex',
        'items-center',
        'justify-center',
        'rounded-md',
        'absolute',
        'top-1/2',
        'right-0',
        '-translate-y-[52%]'
      );

      prevButton.addEventListener('click', () => {
        const newIndex = (currentIndex - 1 + items.length) % items.length;
        moveToSlide(newIndex);
      });

      nextButton.addEventListener('click', () => {
        const newIndex = (currentIndex + 1) % items.length;
        moveToSlide(newIndex);
      });
    } else {
      
    }
  });
}




map.on('click', (e) => {
  if (mark) {
    map.removeLayer(mark);
  }
  mark = L.marker(e.latlng).addTo(map);
});


function nextStep() {
  if (document.getElementById('remember-me').checked) {
    sessionStorage.setItem('rememberMe', 'true');
  }
  document.getElementById("overlay").classList.add("invis");
  document.getElementById("map").classList.remove("map-blurred");
}

let picAction = ''

function addTreeClick() {
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');
  modalTitle.innerHTML = "Plant Your Tree"
  modalDesc.innerHTML = "Please fill in the details of the tree you want to plant"
  
  picAction = "Planted"
  
  if (mark) {
    const lat = mark.getLatLng().lat;
    const lng = mark.getLatLng().lng;
    document.getElementById("uploadoverlay").classList.remove("invis");
    document.getElementById("map").classList.add("map-blurred");
    document.getElementById("latitude").value = lat;
    document.getElementById("longitude").value = lng;
  } else {
    alert("Please place a marker on the map first!");
  }
}

function identifyTreeClick() {
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');
  modalTitle.innerHTML = "Identify Tree"
  modalDesc.innerHTML = "Please fill in the details of the tree you want to identify"
  
  picAction = "Identified"
  
  if (mark) {
    const lat = mark.getLatLng().lat;
    const lng = mark.getLatLng().lng;
    document.getElementById("uploadoverlay").classList.remove("invis");
    document.getElementById("map").classList.add("map-blurred");
    document.getElementById("latitude").value = lat;
    document.getElementById("longitude").value = lng;
  } else {
    alert("Please place a marker on the map first!");
  }
}

/* For users who just wants to see the map and not upload a new tree */
function skip() {
  document.getElementById("map").classList.remove("map-blurred");
  document.getElementById("uploadoverlay").classList.add("invis");
  document.getElementById("editoverlay").classList.add("invis");
  document.getElementById("identifyoverlay").classList.add("invis");
  document.getElementById("treeArchiveTitleOverlay").classList.add("invis");
}
