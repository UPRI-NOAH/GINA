var markers = L.markerClusterGroup();

const addtree_button = document.getElementById('addTree');
const identify_button = document.getElementById('idenTree');
const mobileAddtree_button = document.getElementById('mobile-addTree');
const mobileIden_button = document.getElementById('mobile-idenTree');
const displayAddTreeButton = document.getElementById('notLoggedInAdd');
const displayIdentifyButton = document.getElementById('notLoggedInIden');

let rememberMe = sessionStorage.getItem('rememberMe');


if (isLoggedIn) {
  document.getElementById('user-buttons').classList.remove('invis');
  document.getElementById('user-buttons').classList.add('mobile-visible');
  addtree_button.classList.remove('invis');
  identify_button.classList.remove('invis');
  mobileAddtree_button.classList.remove('invis');
  mobileIden_button.classList.remove('invis');
  document.getElementById('mobile-login').classList.add('invis');
  document.getElementById('notLoggedInAdd').classList.add('invis');
  document.getElementById('notLoggedInIden').classList.add('invis');
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
  mobileAddtree_button.classList.add('invis');
  mobileIden_button.classList.add('invis');


  //document.getElementById('auth-buttons').classList.remove('invis');
  document.getElementById("overlay").classList.add("invis");
  document.getElementById("uploadoverlay").classList.add("invis");
  document.getElementById("map").classList.remove("map-blurred");
  document.getElementById('mobile-login').classList.remove('invis');
  // document.getElementById('user-buttons').classList.remove('mobile-visible');
}


var map = L.map('map').setView([12.8797, 121.7740], 5);

window.onload = function () {
  loadTreeMarkers()
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


function showError(error) {
  console.error("Geolocation error:", error);
}


L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

function setAttributionPosition() {
  if (window.innerWidth <= 768) {
    // Mobile screen: place at top right
    map.attributionControl.setPosition('topright');

  } else {
    // Large screen: place at bottom right
    map.attributionControl.setPosition('bottomright');
  }
}

// Run on initial load
setAttributionPosition();

// Optional: Update on resize
window.addEventListener('resize', setAttributionPosition);


var treeIcon = L.icon({
  iconUrl: "./assets/img/marker.png", // file path of image
  iconSize: [40, 55], // set size of icon
});

var owntreeIcon = L.icon({
  iconUrl: "./assets/img/marker2.png", // file path of image
  iconSize: [40, 55], // set size of icon
});


function showComments(refId) {
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
  const expertDynamicSelect = document.getElementById('expert-plant-name');

  // Clear previous options
  dynamicSelect.innerHTML = '';
  editDynamicSelect.innerHTML = '';
  expertDynamicSelect.innerHTML = '';

  const basicOption = { value: '', text: 'Select species' };

  // Function to initialize a select element
  function initializeSelect(select, includeAskExpert = false) {
  // "Select species" as default, disabled option
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Select species';
  defaultOption.disabled = true;
  defaultOption.selected = true;
  select.appendChild(defaultOption);

  // Optionally add "Ask an expert" with bold style
  if (includeAskExpert) {
    const expertOption = document.createElement('option');
    expertOption.value = 'TBD';
    expertOption.textContent = 'Ask an expert';
    expertOption.style.fontWeight = 'bold';
    select.appendChild(expertOption);
  }
}

  initializeSelect(dynamicSelect, true);      // adds "Ask an expert"
  initializeSelect(editDynamicSelect);        // removes
  initializeSelect(expertDynamicSelect);      // removes

  // Add dynamic options to all selects
  const selects = [dynamicSelect, editDynamicSelect, expertDynamicSelect];
  treeJSON.forEach(item => {
    selects.forEach(select => {
      const option = document.createElement('option');
      option.value = item.tree_name;
      option.textContent = item.tree_name;
      select.appendChild(option);
    });
  });

});

function loadTreeMarkers(){
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
  const latlng = L.latLng(feature.latitude, feature.longitude);
  const icon = (username === feature.owning_user) ? owntreeIcon : treeIcon;
  const marker = L.marker(latlng, { icon });
  marker.feature = feature;
  treeMarkers[feature.reference_id] = marker;

  const popupContent = buildPopupContent(feature, username);
  marker.bindPopup(popupContent);

  markers.addLayer(marker);
});
map.addLayer(markers);
window._resolveMarkersLoaded();

});
}
// L.Control.geocoder().addTo(map);

let mark;


function expertEditClick(refId, name, user, treeType, action) {
    const modalTitle = document.getElementById('modalEditTitle');
    const modalDesc = document.getElementById('modalEditDesc');
    modalTitle.innerHTML = "Expert: Identify Tree"
    modalDesc.innerHTML = "Please fill in the details of the tree you want to edit."
    document.getElementById("expertoverlay").classList.remove("invis");
    document.getElementById("map").classList.add("map-blurred");

    document.getElementById('expert-ref-id').value = refId
    document.getElementById('expert-plant-name').value = name
    document.getElementById('expert-tree-type').value = treeType

}



function editTreeClick(refId, name, user, treeType, treeDescription, plantDate, action, uploadStatus) {
  if (user == username) {
    const modalTitle = document.getElementById('modalEditTitle');
    const modalDesc = document.getElementById('modalEditDesc');
    let selectElement = document.getElementById('edit-plant-name');

    modalTitle.innerHTML = "Edit The Tree You Planted"
    if (action == "Identified") {
      modalTitle.innerHTML = "Edit the tree you identified"
    }
    modalDesc.innerHTML = "Please fill in the details of the tree you want to edit"
    document.getElementById("editoverlay").classList.remove("invis");
    document.getElementById("map").classList.add("map-blurred");

    if (name === 'Ask an expert' || name === 'TBD') {
      selectElement.value = '';
    } else {
      selectElement.value = name;
    }
    document.getElementById('edit-action').value = action
    document.getElementById('edit-ref-id').value = refId
    document.getElementById('edit-description').value = treeDescription
    document.getElementById('edit-tree-type').value = treeType
    document.getElementById('edit-date').value = plantDate
    if (uploadStatus === "oneHour") {
      document.getElementById("edit-upload-block").classList.add("invis");
      document.getElementById("edit-photo-title").classList.add("invis");
    }
    else if (uploadStatus === "monthly") {
      document.getElementById("edit-upload-block").classList.remove("invis");
      document.getElementById("edit-photo-title").classList.remove("invis");
    }
  }

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


let uploadStatus = ''

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

function pleaseLoginAddtree() {
  alert("Please log in to add a tree.");
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
  document.getElementById("expertoverlay").classList.add("invis");
  const emptyGallery = document.getElementById("empty");
  const editEmptyGallery = document.getElementById("edit-empty");

    // Clear upload gallery
  document.getElementById("gallery").innerHTML = "";
  if (emptyGallery) {
    emptyGallery.classList.remove("hidden");
  }
  document.getElementById("tree-photo").value = "";

  // Clear edit gallery
  document.getElementById("edit-gallery").innerHTML = "";
  if (editEmptyGallery) {
    editEmptyGallery.classList.remove("hidden");
  }
  document.getElementById("edit-tree-photo").value = "";

  // Reset FILES array
  FILES = [];
  EDIT_FILES = [];

}


function buildPopupContent(feature, username) {
  let {
    reference_id: refId,
    tree_name: name,
    owning_user: user,
    tree_type: treeTypeRaw,
    tree_description: treeDescription,
    planted_on: plantDateStr,
    latest_tree_update: latestDateStr,
    edited_by: editedBy,
    action,
    image: photoUrl,
    version
  } = feature;

  const treeType = treeTypeRaw || "N/A";
  const plantDate = new Date(plantDateStr);
  const latestDate = new Date(latestDateStr);
  const now = new Date();
  const oneHourAfterPlanting = new Date(plantDate.getTime() + 60 * 60 * 1000);
  const oneHourAfterLastUpdate = new Date(latestDate.getTime() + 60 * 60 * 1000);

  const oneMonthLater = new Date(latestDate);
  oneMonthLater.setDate(oneMonthLater.getDate() + 30);

  const threeYearsLater = new Date(plantDate);
  threeYearsLater.setDate(threeYearsLater.getDate() + 1095);

  const sixMonthsLater = new Date(latestDate);
  sixMonthsLater.setDate(sixMonthsLater.getDate() + 180);

  // Determine edit icon URL
  const canEdit = (now <= oneHourAfterPlanting || now <= oneHourAfterLastUpdate || userType === "Expert");
  const isBlueEdit = canEdit;
  const editIconUrl = isBlueEdit
    ? "https://cdn-icons-png.flaticon.com/128/481/481874.png"
    : "https://cdn-icons-png.flaticon.com/128/992/992651.png";

  const popupContent = document.createElement("div");
  popupContent.style.position = "relative";

  const versionDisplay = editedBy ? `${version}.1` : version;

  // Info Div
  const infoDiv = document.createElement("div");
  const photoId = `tree-photo-${refId}`;
  infoDiv.innerHTML = `
    <img id="${photoId}" data-name="${name}" data-ref-id="${refId}" src="${photoUrl}" class="w-full h-56 object-cover" />
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div><b>Species:</b> ${name}</div>
      <div id="edit-inline-container"></div>
    </div>
    <b>Description:</b> ${treeDescription}<br>
    <b>Tree Type:</b> ${treeType}<br>
    <b>Date Planted:</b> ${plantDateStr}<br>
    <b>${action} by:</b> ${user}<br>
    ${editedBy ? `<b>Verified by:</b> ${editedBy}<br>` : ""}
    <b>Version:</b> ${versionDisplay}<br>
    <hr style="height: 1px; background-color: #0095ff; border: none;">
    <button onclick="showComments('${refId}')" class="text-blue-600 text-sm hover:underline mt-2">View Discussion 💬</button>
  `;

  const inlineContainer = infoDiv.querySelector("#edit-inline-container");

  const editButton = document.createElement("button");
  editButton.id = "popup-button";
  editButton.innerHTML = `<img src="${editIconUrl}" style="width: 15px; height: 15px;">`;

  editButton.style.cssText = `
    background-color: #0095ff;
    border: none;
    padding: 5px;
    border-radius: 10px;
    cursor: pointer;
    vertical-align: middle;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  `;

  // Control visibility
  if (username !== user) {
    editButton.style.display = 'none';
    if (userType === "Expert" && name === "TBD") {
      editButton.style.display = 'inline-block';
    }
  }

  editButton.addEventListener("click", (event) => {
    event.stopPropagation();

    if (userType === "Expert" && name === "TBD" && user !== username) {
      expertEditClick(refId, name, user, treeType, action);
      return;
    }

    if (action !== "Identified") {  
      if (now <= oneHourAfterPlanting || now <= oneHourAfterLastUpdate) {
        uploadStatus = 'oneHour';
        editTreeClick(refId, name, user, treeType, treeDescription, plantDateStr, action, uploadStatus);
        return;
      }

      if (now >= oneMonthLater && now < threeYearsLater) {
        uploadStatus = 'monthly';
        editTreeClick(refId, name, user, treeType, treeDescription, plantDateStr, action, uploadStatus);
        return;
      }

      if (now >= threeYearsLater) {
        if (now >= sixMonthsLater) {
          uploadStatus = 'monthly';
          editTreeClick(refId, name, user, treeType, treeDescription, plantDateStr, action, uploadStatus);
          return;
        } else {
          alert("After 3 years, you can only edit this tree every 180 days.");
          return;
        }
      }

      alert("Tree edits are locked. You can only edit it within 1 hour of planting or update after 30 days.");
    } else {
      uploadStatus = 'oneHour';
      editTreeClick(refId, name, user, treeType, treeDescription, plantDateStr, action, uploadStatus);
    }
  });


  if (action === "Identified" && now > oneHourAfterPlanting && userType !== "Expert") {
  // Do not append the button
  }
  // Placement logic
  else if (isBlueEdit) {
    inlineContainer.appendChild(editButton); // Inline beside species
  } else {
    // Gray lock icon stays top-left corner
    editButton.style.position = 'absolute';
    editButton.style.top = '5px';
    editButton.style.left = '5px';
    editButton.style.backgroundColor = '#0095ff';
    editButton.style.borderRadius = '10px';
    editButton.style.padding = '5px';
    popupContent.appendChild(editButton);
  }

  popupContent.appendChild(infoDiv);
  return popupContent;
}


map.on("popupopen", function (e) {
  const popupEl = e.popup.getElement();
  if (!popupEl) return;

  const img = popupEl.querySelector("img[id^='tree-photo-']");
  if (img) {
    const refId = img.dataset.refId;
    const name = img.dataset.name;

    img.addEventListener("click", function (event) {
      event.stopPropagation();
      clickTreeImg(name, refId);
    });
  }
});

window.markersLoaded = new Promise((resolve) => {
  window._resolveMarkersLoaded = resolve;
});

// window.addEventListener('DOMContentLoaded', () => {
window.addEventListener('load', async () => {
  const params = new URLSearchParams(window.location.search);
  const treeId = params.get('focus');
  const notifType = params.get('type');

  if (treeId) {
    showLoading();

    await window.markersLoaded;
    await focusOnTree(treeId, notifType);
    await markAllNotificationsSeen();

    hideLoading();
  }
});

// Hide and show the legend
 document.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.getElementById("legendToggle");
    const closeBtn = document.getElementById("legendClose");
    const legendContent = document.getElementById("legendContent");

    closeBtn.addEventListener("click", () => {
      legendContent.classList.add("hidden");
      toggleBtn.classList.remove("hidden");
    });

    toggleBtn.addEventListener("click", () => {
      legendContent.classList.remove("hidden");
      toggleBtn.classList.add("hidden");
    });
  });
