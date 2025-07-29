let url = "3b0347f92d14.ngrok-free.app";
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

// const bellBtn = document.getElementById('notification-bell');
const bellBtns = document.querySelectorAll('.notification-bell');
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

let isLoggedIn = !!authToken;


const mobileNav = document.getElementById('mobile-nav');
// const alertsButton = document.getElementById('mobile-alerts');

if (isLoggedIn) {
    document.getElementById('user-buttons')?.classList.remove('invis');
    document.getElementById('mobile-login')?.classList.add('invis');
    document.getElementById('profileMenu')?.classList.remove('invis');
    document.getElementById('notLoggedIn')?.classList.add('invis');

    // Add Alerts button visually
    // alertsButton?.classList.remove('hidden');

    // Change grid to 6 columns
    // mobileNav?.classList.remove('grid-cols-5');
    // mobileNav?.classList.add('grid-cols-6');

} else {
    document.getElementById('auth-buttons')?.classList.remove('invis');
    document.getElementById('mobile-login')?.classList.remove('invis');
    document.getElementById('user-buttons')?.classList.add('invis');
    document.getElementById('profileMenu')?.classList.add('invis');
    document.getElementById('notLoggedIn')?.classList.remove('invis');

    // Remove Alerts button
    // alertsButton?.classList.add('hidden');

    // Change grid back to 5 columns
    mobileNav?.classList.remove('grid-cols-6');
    mobileNav?.classList.add('grid-cols-5');
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

    // Broadcast logout to other tabs
    localStorage.setItem('isLoggedIn', 'false');

    // Small delay so storage event propagates before reload
    setTimeout(() => {
      location.reload(); // Or redirect to login.html
    }, 100);
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    hideLoading();
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


async function unsubscribeUserFromPush() {
  try {
    
    // Get the service worker registration (no waiting for .ready)
    const registration = await navigator.serviceWorker.getRegistration();
    // const registration = await navigator.serviceWorker.getRegistration('/assets/js/');

    if (!registration) {
      return;
    }

    if (!registration.pushManager) {
      return;
    }

    // Get current push subscription
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      
      return;
    }


    // Unsubscribe the subscription in the browser
    const unsubscribed = await subscription.unsubscribe();

    // Send unsubscribe request to server
    const res = await fetch(`${http}://${url}/unsubscribe/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': await getCookie('csrftoken'),
        'Authorization': `Token ${authToken}`,
      },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });

    if (!res.ok) {
      throw new Error(`Server responded with status ${res.status}`);
    }

    const data = await res.json();
  } catch (err) {
  }
}

window.addEventListener('storage', function (event) {
  if (event.key === 'isLoggedIn') {
    if (event.newValue === 'false') {
      // Logged out from another tab
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
      localStorage.removeItem('username');
      sessionStorage.removeItem('username');
      localStorage.removeItem('userType');
      sessionStorage.removeItem('userType');
      location.reload(); // Or redirect to login.html
    } else if (event.newValue === 'true') {
      location.reload(); // Optional: refresh UI on login from another tab
    }
  }
});

  document.addEventListener('click', function (event) {
  const profileButton = document.getElementById('profileMenu');
    if (!profileButton) return; // Avoid error if element doesn't exist

    const dropdown = profileButton.querySelector('ul');
    if (!dropdown) return;

    // If the click is outside the profile button and its dropdown
    if (!profileButton.contains(event.target)) {
      dropdown.classList.add('hidden');
    }
  });