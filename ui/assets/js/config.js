let url = "punla.up.edu.ph";
let http = "https";
let usertreeURL = `${http}://${url}/api/user-tree-info/`;
let username = localStorage.getItem('username') || sessionStorage.getItem('username');
let editUserURL = `${http}://${url}/api/user-info/${username}/`;
let treeLibURL = `${http}://${url}/api/tree-info/`;
let identifyTreeURL = `${http}://${url}/api/identify-tree-info/`;
let treeArchiveURL = `${http}://${url}/api/archive-tree-info/`;
let loginURL = `${http}://${url}/auth/token/login/`;
let signupURL = `${http}://${url}/hcaptcha-register/`;
// let signupURL = `${http}://${url}/auth/users/`;
let userURL = `${http}://${url}/api/user-info/`;
let treeUrl = `${http}://${url}/api/tree-info/`;
let userTreeURL  = `${http}://${url}/api/user-tree-info/`;
let passwordChangeURL = `${http}://${url}/auth/users/set_password/`;
let resetPassUrl = `${http}://${url}/auth/users/reset_password/`;
let passToExpert = `${http}://${url}/api/tree-help/pass`;
let validateImage = `${http}://${url}/api/validate-image/`;

// api/tree-help/pass/${treeId
var authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
const userType = localStorage.getItem('userType') || sessionStorage.getItem('userType');
const currentPath = window.location.pathname;
const treeMarkers = {};

// Dropdown toggles

const bellBtn = document.getElementById('notification-bell');
const userDropdown = document.getElementById('user-dropdown');
const notifDropdown = document.getElementById('notification-dropdown');
const notifCount = document.getElementById('notification-count');

const loadingOverlay = document.getElementById('loading-overlay');

function showLoading() {
  loadingOverlay.style.display = 'flex';
}

function hideLoading() {
  loadingOverlay.style.display = 'none';
}

  
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
async function logOut() {
  try {
    
    showLoading(); // Show loading overlay

    await unsubscribeUserFromPush(); // Ensure proper unsubscribe

    // Clear all tokens and user info
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    localStorage.removeItem('username');
    sessionStorage.removeItem('username');
    localStorage.removeItem('userType');
    sessionStorage.removeItem('userType');

    location.reload(); // Or redirect to login if you prefer
  } catch (error) {
    
  } finally {
    hideLoading(); // Always hide loading overlay
  }
}


// USER DROPDOWN
function dropdownHandler(event, element) {
    event.stopPropagation();  // Prevent the window click listener from firing
    let single = element.getElementsByTagName("ul")[0];
    single.classList.toggle("hidden");
    notifDropdown.classList.add('hidden');
    // notifDropdown.classList.toggle('show');
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
    window.location.href = 'login.html';
}


function togglePassword(inputId, buttonEl) {
  const input = document.getElementById(inputId);
  const isHidden = input.type === 'password';

  input.type = isHidden ? 'text' : 'password';

  const eye = buttonEl.querySelector('.eye');
  const eyeSlash = buttonEl.querySelector('.eye-off');

  if (isHidden) {
    eye.classList.add('hidden');
    eyeSlash.classList.remove('hidden');
  } else {
    eye.classList.remove('hidden');
    eyeSlash.classList.add('hidden');
  }
}