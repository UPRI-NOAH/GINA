// change URL for backend
let url = "punla.up.edu.ph";
let usertreeURL = `https://${url}/api/user-tree-info/`;
var username = localStorage.getItem('username') || sessionStorage.getItem('username');
let editUserURL = `https://${url}/api/user-info/${username}/?format=json`;
// console.log(editUserURL);
var markers = L.markerClusterGroup();

const addtree_button = document.getElementById('addTree');
var authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
var isLoggedIn = true;

if (authToken) {
  isLoggedIn = true;
} else {
  isLoggedIn = false;
}

let rememberMe = sessionStorage.getItem('rememberMe');

const loadingOverlay = document.getElementById('loading-overlay');

function showLoading() {
  loadingOverlay.style.display = 'flex';
}

function hideLoading() {
  loadingOverlay.style.display = 'none';
}


if (isLoggedIn) {
  document.getElementById('user-buttons').classList.remove('invis');
  document.getElementById('user-buttons').classList.add('mobile-visible');
  addtree_button.classList.remove('invis');
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
  document.getElementById('auth-buttons').classList.remove('invis');
  document.getElementById("overlay").classList.add("invis");
  document.getElementById("uploadoverlay").classList.add("invis");
  document.getElementById("map").classList.remove("map-blurred");
  document.getElementById('mobile-login').classList.remove('invis');
  document.getElementById('user-buttons').classList.remove('mobile-visible');
}

var map = L.map('map').setView([14.655156528354416, 121.07045364296518], 13);

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
      var name = feature.model_tree;
      var user = feature.owning_user;
      var plant_date = feature.planted_on;
      
      var photoImg = '<img src="'+ feature.image+ '" class="w-full h-56 object-cover"/>';
      console.log(feature.image);
      console.log(photoImg);
      // create popup for marker
      L.popup()
        .setLatLng(e.latlng)
        .setContent(photoImg + '<b>User:</b> ' + user + '<br> <b>Date Planted:</b> ' + plant_date)
        .openOn(map);
    });

    markers.addLayer(marker);

  });
    map.addLayer(markers);

});

L.Control.geocoder().addTo(map);

let mark;

map.on('click', (e) => {
  if (mark) {
    map.removeLayer(mark);
  }
  mark = L.marker(e.latlng).addTo(map);
});

// User Dropdown Toggle
document.getElementById('user-dropdown-toggle').addEventListener('click', function() {
  var dropdown = document.getElementById('user-dropdown');
  dropdown.classList.toggle('invis');
});

// Toggle dropdown when clicking outside
document.addEventListener('click', function(event) {
  if (!event.target.closest('#user-dropdown') && !event.target.closest('#user-dropdown-toggle')) {
    document.getElementById("user-dropdown").classList.add("invis");
  }
});

// View Profile Function
function viewProfile() {
  document.getElementById("user-dropdown").classList.add("invis");
}

// Log Out Function
function logOut() {
  localStorage.setItem('authToken', '');
  sessionStorage.setItem('authToken', '');
  localStorage.setItem('username', '');
  sessionStorage.setItem('username', '');
  location.reload();
}

/* Note: Should be disabled when user is not logged in */
function nextStep() {
  if (document.getElementById('remember-me').checked) {
    sessionStorage.setItem('rememberMe', 'true');
  }
  document.getElementById("overlay").classList.add("invis");
  document.getElementById("map").classList.remove("map-blurred");
}

/* This is what happens when user presses Add Tree Button on the lower right */
/* Note: Should be disabled when user is not logged in */
function addTreeClick() {
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

function uploadTree() {
  const plantName = document.getElementById('plant-name').value;
  const description = document.getElementById('description').value;
  const plantedOn = document.getElementById('planted-on').value;
  const image = document.getElementById('tree-photo').files[0]; // Image file
  const latitude = Number(document.getElementById('latitude').value).toFixed(6);
  const longitude = Number(document.getElementById('longitude').value).toFixed(6);
  var username = localStorage.getItem('username') || sessionStorage.getItem('username');

  showLoading()
  
  // Check if required fields are empty
  if (!plantName || !description || !plantedOn || !image) {
    hideLoading();
    alert("Please fill in all fields and upload a photo before submitting.");
    return;  // Prevent form submission if fields are empty
  }

  // Prepare the form data to be sent
  var formData = new FormData();
  formData.append('planted_on', plantedOn);
  formData.append('longitude', longitude);
  formData.append('latitude', latitude);
  formData.append('quantity', 1);
  formData.append('status', "PLT");
  formData.append('image', image);
  formData.append('owning_user', username);

  // Debug log to check the values
  for (const value of formData.values()) {
    console.log(value);
  }

  // Make the API request to upload the tree information
  fetch(usertreeURL, {
    method: 'POST',
    contentType: false,
    processData: false,
    body: formData
  })
  .then(response => {
    console.log(response.statusText);
    if (!response.ok) {
      throw new Error('Failed to upload tree data.');
    }
    return response.json();
  })
  .then(data => {
    // Get current user points and update the user's points
    fetch(editUserURL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      const currentUserPoints = data.user_points;
      const newPoints = currentUserPoints + 1;

      // Update user points
      fetch(editUserURL, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "user_points": newPoints
        })
      })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        document.getElementById("map").classList.remove("map-blurred");
        document.getElementById("uploadoverlay").classList.add("invis");
        hideLoading()
        location.reload(); // reload the page after the PATCH request is complete
      })
      .catch(error => console.error('Error:', error));
    })
    .catch(error => console.error('Error:', error));
  })
  .catch(error => {
    console.error('Error:', error);
    hideLoading();
    alert("An error occurred while uploading the tree. Please try again.");
  });
}

/* For users who just wants to see the map and not upload a new tree */
function skip() {
  document.getElementById("map").classList.remove("map-blurred");
  document.getElementById("uploadoverlay").classList.add("invis");
}

document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('planted-on').setAttribute('max', today);
});