// change URL for backend
let url = "127.0.0.1:8000";
let userURL = `http://${url}/api/tree-info/`;

// authentication token
var authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

var isLoggedIn = true;
// authentication checking
if (authToken){
  isLoggedIn = true;
} else {
  isLoggedIn = false;
}
// User buttons checking if user is logged in (logged in = icon, else = login/signup buttons)
if (isLoggedIn){
  document.getElementById('user-buttons').classList.remove('invis');
  document.getElementById('mobile-login').classList.add('invis');
  document.getElementById('user-buttons').classList.add('mobile-visible');
} else {
  document.getElementById('auth-buttons').classList.remove('invis');
  document.getElementById('mobile-login').classList.remove('invis');
  document.getElementById('user-buttons').classList.remove('mobile-visible');
}

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
  // Add your profile viewing logic here
  // console.log("View Profile clicked");
  document.getElementById("user-dropdown").classList.add("hidden");
}

// Log Out Function
function logOut() {
  localStorage.setItem('authToken', '');
  sessionStorage.setItem('authToken', '');

  location.reload();
}


var treeLib = $.ajax({
  url: userURL,
  dataType: "json",
      headers: { 
      'ngrok-skip-browser-warning': 'true' 
  },
  // success: console.log("PH geojson data successfully loaded."),
  error: function (xhr) {
      alert(xhr.statusText)
  }
  })

  const treeGrid = document.getElementById("tree-grid");


  $.when(treeLib).done(function () {
    bound = treeLib.responseJSON
    console.log(bound)
    // bound.sort((a, b) => b.user_points - a.user_points); // Sort in descending order
    bound.forEach((data, index) => {
      const row = document.createElement("div");
      row.className = "tree-container flex md:flex-col-reverse md:w-56 overflow-x-auto"
      row.innerHTML = `
        <div class="flex flex-col justify-center detail-container w-full h-32">
          <div class="text-xl font-bold" style="color:black"><p>${data.tree_name}</p></div>
          <div class="text-sm"><p><b>Scientific Name: </b><i>${data.scientific_name}</i></p></div>
          <div class="text-sm"><p><b>Family Name: </b><i>${data.family_name}</i></p></div>
        </div>

        <div class="flex-shrink">
          <img src="${data.tree_image}" class="w-full h-48 object-cover">
        </div>
      </div>
      `;
      treeGrid.appendChild(row);
    });
  });