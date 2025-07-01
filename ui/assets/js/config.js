let url = "punla.up.edu.ph";
let http = "https";
let usertreeURL = `${http}://${url}/api/user-tree-info/`;
let username = localStorage.getItem('username') || sessionStorage.getItem('username');
let editUserURL = `${http}://${url}/api/user-info/${username}/`;
let treeLibURL = `${http}://${url}/api/tree-info/`;
let identifyTreeURL = `${http}://${url}/api/identify-tree-info/`;
let treeArchiveURL = `${http}://${url}/api/archive-tree-info/`;
let loginURL = `${http}://${url}/auth/token/login/`;
let signupURL = `${http}://${url}/auth/users/`;
let userURL = `${http}://${url}/api/user-info/`;
let treeUrl = `${http}://${url}/api/tree-info/`;
let userTreeURL  = `${http}://${url}/api/user-tree-info/`;
let passwordChangeURL = `${http}://${url}/auth/users/set_password/`;
let resetPassUrl = `${http}://${url}/auth/users/reset_password/`;

var authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

var isLoggedIn = true;
// authentication checking
if (authToken){
  isLoggedIn = true;
} else {
  isLoggedIn = false;
}
// User buttons checking if user is logged in (logged in = icon, else = login/signup buttons)
if (isLoggedIn) {
  document.getElementById('user-buttons')?.classList.remove('invis');
  document.getElementById('mobile-login')?.classList.add('invis');
  document.getElementById('user-buttons')?.classList.add('mobile-visible');
  document.getElementById('profileMenu')?.classList.remove('invis');
  document.getElementById('notLoggedIn')?.classList.add('invis');
} else {
  document.getElementById('auth-buttons')?.classList.remove('invis');
  document.getElementById('mobile-login')?.classList.remove('invis');
  document.getElementById('user-buttons')?.classList.remove('mobile-visible');
  document.getElementById('notLoggedIn')?.classList.remove('invis');
  document.getElementById('profileMenu')?.classList.add('invis');
}
// View Profile Function
function viewProfile() {
    document.getElementById("user-dropdown").classList.add("invis");
}

// Log Out Function
function logOut() {
  localStorage.removeItem('authToken');
  sessionStorage.removeItem('authToken');
  localStorage.removeItem('username');
  sessionStorage.removeItem('username');
  location.reload();
}


const toggleBtn = document.getElementById('user-dropdown-toggle');
if (toggleBtn) {
  toggleBtn.addEventListener('click', function () {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) {
      dropdown.classList.toggle('invis');
    }
  });
}

// Toggle dropdown when clicking outside
document.addEventListener('click', function(event) {
  const dropdown = document.getElementById("user-dropdown");
  if (!event.target.closest('#user-dropdown') && !event.target.closest('#user-dropdown-toggle')) {
    if (dropdown) {
      dropdown.classList.add("invis");
    }
  }
});

const loadingOverlay = document.getElementById('loading-overlay');

function showLoading() {
  loadingOverlay.style.display = 'flex';
}

function hideLoading() {
  loadingOverlay.style.display = 'none';
}


// USER DROPDOWN
function dropdownHandler(element) {
    let single = element.getElementsByTagName("ul")[0];
    single.classList.toggle("hidden");
}
function MenuHandler(el, val) {
    let MainList = el.parentElement.parentElement.getElementsByTagName("ul")[0];
    let closeIcon = el.parentElement.parentElement.getElementsByClassName("close-m-menu")[0];
    let showIcon = el.parentElement.parentElement.getElementsByClassName("show-m-menu")[0];
    if (val) {
        MainList.classList.remove("hidden");
        el.classList.add("hidden");
        closeIcon.classList.remove("hidden");
    } else {
        showIcon.classList.remove("hidden");
        MainList.classList.add("hidden");
        el.classList.add("hidden");
    }
}
// ------------------------------------------------------

let cross = document.getElementById("cross");
const sidebarHandler = (check) => {
    if (check) {

        cross.classList.remove("hidden");
    } else {

        cross.classList.add("hidden");
    }
};
let list = document.getElementById("list");
let chevrondown = document.getElementById("chevrondown");
let chevronup = document.getElementById("chevronup");
const listHandler = (check) => {
    if (check) {
        list.classList.remove("hidden");
        chevrondown.classList.remove("hidden");
        chevronup.classList.add("hidden");
    } else {
        list.classList.add("hidden");
        chevrondown.classList.add("hidden");
        chevronup.classList.remove("hidden");
    }
};

function pleaseLogin() {
  alert("Please log in first");
  console.log("Please log in first");
}