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
let passToExpert = `${http}://${url}/api/tree-help/pass`;

// api/tree-help/pass/${treeId
var authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
const userType = localStorage.getItem('userType') || sessionStorage.getItem('userType');
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
              addNotificationToList(
                n.message,
                !n.is_seen,
                n.created_at,
                n.related_tree,
                n.tree_name,
                n.notif_type,
                n.is_passed,
              );
              
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
    const isTreeOwner = (data.tree_owner === username);
    const isUserExpert = (userType === "Expert");
    const isCommentForMe = data.notif_type === "comment" && isTreeOwner;
    const isReminderForMe = data.notif_type === "reminder" && isTreeOwner;
    const isTreeHelpForExpert = data.notif_type === "tree_help" && isUserExpert && !isTreeOwner;
    const isRecipient = data.recipient === username;

    if ((isCommentForMe) || (isReminderForMe) || (isTreeHelpForExpert && isRecipient)) {
    
      addNotificationToList(data.message, true, data.timestamp, data.tree_id, data.tree_name, data.notif_type, data.is_passed);
      if (!notifDropdown.classList.contains('show')) {
        incrementBadge(); 
      }

      if (isAppInFocus() && !notifDropdown.classList.contains('show')) {
        if(data.message != "Connected to WebSocket"){
        showInAppBanner(data.message, data.notif_type, data.tree_id);
        }
      } else {
        // navigator.serviceWorker.ready.then(registration => {
        //   registration.showNotification("🌳 Tree Reminder", {
        //     body: data.message,
        //     icon: '/icon.png',
        //   });
        // });
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
            
            addNotificationToList(notif.message, !notif.is_seen, notif.created_at, notif.related_tree, notif.tree_name, notif.notif_type, notif.is_passed);
            
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

function addNotificationToList(message, isUnseen = false, timestamp = null, treeId = null, treeName, notifType = null, isPassed) {
  
  const list = document.getElementById("notification-list");

  const placeholder = list.querySelector("li.text-gray-400");
  if (placeholder) placeholder.remove();

  const item = document.createElement("li");
  item.className = "py-2 border-b border-gray-200";

  if (isUnseen) item.classList.add("font-bold");

  let datePart = timestamp
    ? `<br><small class="text-gray-500">${new Date(timestamp).toLocaleString()}</small>`
    : "";

  // Message HTML
  item.innerHTML = `
  <div class="flex justify-between items-start relative">
    <div class="flex-1 cursor-pointer">
      ${message} ${datePart}
    </div>
  </div>
  `;

  // Handle click on notification (to focus tree)
  if (treeId && notifType) {
    item.querySelector(".flex-1").addEventListener("click", (e) => {
      e.stopPropagation();
      const params = new URLSearchParams({
        focus: treeId,
        type: notifType,
      });

      if (!currentPath.includes("map.html")) {
        window.location.href = `/map.html?${params.toString()}`;
        return;
      }

      focusOnTree(treeId, notifType);
      markAllNotificationsSeen();
    });
  }

  // Handle Pass button
  if (notifType === "tree_help") {
  const passBtn = document.createElement("button");
  passBtn.className = "pass-btn text-sm";
  const actuallyPassed = isPassed === true || isPassed === "true";
  
  if (actuallyPassed) {
    passBtn.textContent = "Status: You passed it to another expert";
    passBtn.classList.add("text-gray-500");
    passBtn.disabled = true;
  } 
  else if (treeName != "TBD"){
    passBtn.textContent = "Status: Tree already identified";
    passBtn.disabled = true;
  }
  else {
    passBtn.textContent = "Pass";
    passBtn.classList.add(
      "bg-green-700", "text-white", "px-2", "py-1", "rounded", 
      "hover:opacity-90", "absolute", "bottom-0", "right-0"
    );

    passBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      passBtn.disabled = true;
      passBtn.textContent = "Passing...";

      const csrfToken = await getCookie("csrftoken");

      fetch(`${passToExpert}/${treeId}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
          "Authorization": `Token ${authToken}`,
        },
      })
        .then((res) => {
          if (res.ok) {
            passBtn.textContent = "Status: You passed it to another expert";
            passBtn.classList.remove(
              "bg-green-700", "text-white", "px-2", "py-1", "rounded", 
              "hover:opacity-90", "absolute", "bottom-0", "right-0"
            );
            passBtn.classList.add("text-gray-500");
            passBtn.disabled = true;
          } else {
            return res.json().then((data) => {
              passBtn.textContent = data?.detail || "Failed to pass";
              passBtn.classList.add("text-red-500");
            });
          }
        })
        .catch((err) => {
          passBtn.textContent = "Error";
          passBtn.classList.add("text-red-500");
        });
    });
  }

  item.querySelector(".flex-1").appendChild(passBtn); // <== Append it inside the inner div
}

    const itemTime = new Date(timestamp).getTime();
  const children = Array.from(list.children);
  let inserted = false;

  for (const child of children) {
    const childTimestamp = child.getAttribute("data-timestamp");
    if (!childTimestamp) continue;

    const childTime = new Date(childTimestamp).getTime();
    if (itemTime >= childTime) {
      list.insertBefore(item, child);
      inserted = true;
      break;
    }
  }

  if (!inserted) {
    list.appendChild(item); // oldest at bottom
  }
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

async function focusOnTree(treeId, notifType, retries = 10) {
  await window.markersLoaded;

  // Wait until the specific treeId is available
  const waitForMarker = async (triesLeft = retries) => {
    const marker = treeMarkers?.[treeId];

    if (marker) return marker;

    if (triesLeft <= 0) return null;

    // Wait 300ms before trying again
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(waitForMarker(triesLeft - 1));
      }, 300);
    });
  };

  let marker = await waitForMarker();
if (!marker) {
    try {
      const res = await fetch(`${usertreeURL}${treeId}/`, {
        headers: {
          "Authorization": `Token ${authToken}`,
        },
      });

      if (!res.ok) throw new Error("Tree not found");

      const feature = await res.json();

      // Remove old one just in case
      if (treeMarkers[treeId]) {
        markers.removeLayer(treeMarkers[treeId]);
        delete treeMarkers[treeId];
      }

      const latlng = L.latLng(feature.latitude, feature.longitude);
      const icon = (username === feature.owning_user) ? owntreeIcon : treeIcon;
      marker = L.marker(latlng, { icon });
      marker.feature = feature;
      treeMarkers[treeId] = marker;

      const popupContent = buildPopupContent(feature, username);
      marker.bindPopup(popupContent);
      markers.addLayer(marker);

    } catch (err) {
      console.warn("Marker fetch failed for treeId:", treeId, err);
      return;
    }
  }

  const latlng = marker.getLatLng();

  const onMoveEnd = () => {
    map.off("moveend", onMoveEnd);
    marker.openPopup();
    if (notifType === "comment") {
      showComments(treeId);
    }
  };

  map.on("moveend", onMoveEnd);
  map.setView(latlng, 20, { animate: true });
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