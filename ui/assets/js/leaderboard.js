// change URL for backend
let url = "202.92.141.153";
let userURL = `http://${url}/api/user-info/`;

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
// updating leaderboard content
const leaderboardBody = document.getElementById("leaderboard-body");

var ph = $.ajax({
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
    $.when(ph).done(function () {
      bound = ph.responseJSON
      bound.sort((a, b) => b.user_points - a.user_points); // Sort in descending order
      bound.forEach((data, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
        <td class="px-4 py-2">${index+1}</td>
        <td class="px-4 py-2"><img src="${data.profile_picture}" alt="${data.user}'s profile picture"></td>
        <td class="px-4 py-2">${data.user}</td>
        <td class="px-4 py-2">${data.user_points}</td>
        `;
        leaderboardBody.appendChild(row);
      });
    });