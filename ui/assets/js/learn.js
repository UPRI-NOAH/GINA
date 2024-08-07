// change URL for backend
let url = "akza1d6qzb8z.share.zrok.io";
let userURL = `https://${url}/api/user-info/`;


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