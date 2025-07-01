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
const currentPath = window.location.pathname;

const loadingOverlay = document.getElementById('loading-overlay');

function showLoading() {
  loadingOverlay.style.display = 'flex';
}

function hideLoading() {
  loadingOverlay.style.display = 'none';
}

const treeMarkers = {};

 // Dropdown toggles

  const bellBtn = document.getElementById('notification-bell');
  const userDropdown = document.getElementById('user-dropdown');
  const notifDropdown = document.getElementById('notification-dropdown');
  const notifCount = document.getElementById('notification-count');
  if (bellBtn) {

  bellBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    userDropdown.classList.add('hidden');
    notifDropdown.classList.toggle('hidden');
    notifDropdown.classList.toggle('show');
    // ✅ Fetch latest notifications from backend
    if (authToken && notifDropdown.classList.contains('show')) {
      try {
        const res = await fetch(`${http}://${url}/api/notifications/`, {
          headers: {
            'Authorization': `Token ${authToken}`
          }
        });

        const notifications = await res.json();
        const list = document.getElementById("notification-list");

        // Always clear the list (except placeholder)
        list.querySelectorAll("li:not(.text-gray-400)").forEach(el => el.remove());

        let placeholder = list.querySelector("li.text-gray-400");

        // If no placeholder exists, create it
        if (!placeholder) {
          placeholder = document.createElement("li");
          placeholder.className = "text-gray-400 italic text-center py-2";
          placeholder.textContent = "No notifications";
          list.appendChild(placeholder);
        }
        if (!list) {
          return;
        }
        // Handle empty or non-empty notifications
        if (!notifications || notifications.length === 0) {
          placeholder.classList.remove("hidden");
          placeholder.textContent = "No notifications";
        } else {
          placeholder.classList.add("hidden");
          notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

          notifications.forEach(n => {
            const item = document.createElement("li");
            item.className = "py-2 border-b border-gray-200 cursor-pointer";
            if (!n.is_seen) item.classList.add("font-bold");
            
            item.innerHTML = `
              ${n.message}<br>
              <small class="text-gray-500">${new Date(n.created_at).toLocaleString()}</small>
            `;
            const treeId = n.related_tree;
            const notifType = n.notif_type;
            const marker = treeMarkers[treeId];
            item.addEventListener("click", () => {
                const params = new URLSearchParams({
                  focus: treeId,
                  type: notifType,
                });

                if (!currentPath.includes('map.html')) {
                  window.location.href = `/map.html?${params.toString()}`;
                  return;
                }
                
              focusOnTree(treeId, notifType);
            });

            list.appendChild(item);
          
          });
        }

        await markAllNotificationsSeen();

      } catch (err) {
      }
    }
  });
}

  // Hide both dropdowns when clicking outside
  window.addEventListener('click', () => {
    if (userDropdown) {
    userDropdown.classList.add('hidden');
  }
  if (notifDropdown) {
    notifDropdown.classList.add('hidden');
  }
  });

window.addEventListener('DOMContentLoaded', async () => {
  
if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Optionally: trigger push subscription setup here
    } else if (permission === 'denied') {
      console.warn("Notification permission denied");
    } else {
      console.warn("Notification permission dismissed");
    }
  } else {
    console.warn("This browser does not support notifications.");
  }

    // Setup WebSocket connection
  const wsScheme = location.protocol === "https:" ? "wss" : "ws";
  const socket = new WebSocket(`${wsScheme}://${url}/ws/tree-notifications/`);


  socket.onmessage = (e) => {
    if (!authToken) return;
    const data = JSON.parse(e.data);

    // 👇 Modified logic: allow reminders to pass
    
    if ((data.user && data.user !== username) || data.notif_type === "reminder") {
      
      addNotificationToList(data.message, true, data.timestamp, data.tree_id, data.notif_type);

      if (!notifDropdown.classList.contains('show')) {
        incrementBadge(); // ✅ Fixes your issue
      }

      if (isAppInFocus() && !notifDropdown.classList.contains('show')) {
        showInAppBanner(data.message, data.notif_type, data.tree_id);
      } else {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification("🌳 Tree Reminder", {
            body: data.message,
            icon: '/icon.png',
          });
        });
      }
    }
  };

  
  if (authToken) {
      try {
        const res = await fetch(`${http}://${url}/api/notifications/`, {
          headers: {
            'Authorization': `Token ${authToken}`
          }
        });

        if (res.ok) {
          const notifs = await res.json();
          let unseenCount = 0;
          for (let notif of notifs) {
            addNotificationToList(notif.message, !notif.is_seen, notif.created_at, notif.related_tree, notif.notif_type);
            
            if (!notif.is_seen) unseenCount++;
          }
          updateBadge(unseenCount);
        } 
      } catch (err) {
        
      }
    }

});

function isAppInFocus() {
  return document.visibilityState === "visible";
}

function showInAppBanner(message, notifType, treeId) {
  const banner = document.getElementById("in-app-banner");
  if (!banner) return;

  banner.textContent = message;
  banner.dataset.refid = treeId;        // 👈 Set it for click handler
  banner.dataset.notifType = notifType;

  banner.classList.remove("hidden");
  setTimeout(() => {
    banner.classList.remove("opacity-0");
    banner.classList.add("opacity-100");
  }, 10);

  // Click to focus on tree
  banner.onclick = async () => {
    const params = new URLSearchParams({
      focus: treeId,
      type: notifType,
    });

    if (!currentPath.includes('map.html')) {
      window.location.href = `/map.html?${params.toString()}`;
      return;
    }

    // Already on map.html
    focusOnTree(treeId, notifType);
    await markAllNotificationsSeen();
      banner.classList.add("hidden");

  };

  setTimeout(() => {
    banner.classList.remove("opacity-100");
    banner.classList.add("opacity-0");
    setTimeout(() => {
      banner.classList.add("hidden");
    }, 500);
  }, 4000);
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

    location.reload(); // Or redirect to login if you prefer
  } catch (error) {
    
  } finally {
    hideLoading(); // Always hide loading overlay
  }
}


let unreadCount = 0;

function addNotificationToList(message, isUnseen = false, timestamp = null, treeId = null, notifType = null) {
  const list = document.getElementById("notification-list");

  const placeholder = list.querySelector("li.text-gray-400");
  if (placeholder) placeholder.remove();

  const item = document.createElement("li");
  item.className = "py-2 border-b border-gray-200 cursor-pointer";
  if (isUnseen) item.classList.add("font-bold");

  let datePart = timestamp ? `<br><small class="text-gray-500">${new Date(timestamp).toLocaleString()}</small>` : "";

  item.innerHTML = `${message} ${datePart}`;

  // 👇 Make item clickable if treeId and notifType are provided
  if (treeId && notifType) {
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      const params = new URLSearchParams({
        focus: treeId,
        type: notifType,
      });

      if (!currentPath.includes('map.html')) {
        window.location.href = `/map.html?${params.toString()}`;
        return;
      }

      focusOnTree(treeId, notifType);
      markAllNotificationsSeen();
    });
  }

  list.prepend(item);
}

function updateBadge(count) {
  const badge = document.getElementById("notification-count");
  if (!badge) return;

  if (count > 0) {
    badge.textContent = count;
    badge.classList.remove("hidden");
  } else {
    badge.textContent = "";
    badge.classList.add("hidden");
  }
}

function incrementBadge() {
  const badge = document.getElementById("notification-count");
  let current = parseInt(badge.textContent || "0");
  updateBadge(current + 1);
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


function focusOnTree(treeId, notifType, retries = 5) {
  const marker = treeMarkers?.[treeId];
  if (!marker) {
    if (retries > 0) {
      return setTimeout(() => focusOnTree(treeId, notifType, retries - 1), 300);
    } else {
      return;
    }
  }

  const latlng = marker.getLatLng();

  // Close any existing popup
  // map.closePopup();

  // Add a one-time moveend event to trigger popup after map settles
  const onMoveEnd = () => {
    map.off("moveend", onMoveEnd); // remove listener after it fires once
    marker.openPopup();
    if(notifType == "comment"){
    showComments(treeId)
    }
  };
  map.on("moveend", onMoveEnd);

  // Start animated pan+zoom
  map.setView(marker.getLatLng(), 20, {
    animate: true
  });
  
  // map.flyTo(marker.getLatLng(), 18);

}

function hideLoading() {
  loadingOverlay.style.display = 'none';
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
  alert("Please log in first");
  console.log("Please log in first");
}


async function markAllNotificationsSeen() {
  try {
    
    const response = await fetch(`${http}://${url}/notifications/mark_all_seen/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${authToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    updateBadge(0);
  } catch (err) {
  }
}