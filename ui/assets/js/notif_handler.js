(function () {
    let isNotifOpen = false;

    function init() {
        // Bell button click event
        bellBtns.forEach(bellBtn => {
            if (bellBtn) {
                bellBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    userDropdown.classList.add('hidden');

                    const isMobile = window.innerWidth < 768; // Tailwind md breakpoint

                    if (isMobile) {
                        // Move notification list to modal
                        const notifList = document.getElementById('notification-list');
                        const mobileList = document.getElementById('mobile-notification-list');
                        if (notifList && mobileList) {
                            mobileList.innerHTML = '';
                            mobileList.append(...notifList.children);
                        }

                        document.getElementById('mobile-notification-modal').classList.remove('hidden');
                        document.body.style.overflow = 'hidden';
                        isNotifOpen = true;
                    } else {
                        // Desktop behavior
                        notifDropdown.classList.toggle('hidden');
                        notifDropdown.classList.toggle('show');
                        isNotifOpen = notifDropdown.classList.contains('show');
                    }

                    // Mark as seen if dropdown/modal is open
                    if (authToken && isNotifOpen) {
                        await markAllNotificationsSeen();
                        document.querySelectorAll("#notification-list li.font-bold, #mobile-notification-list li.font-bold")
                            .forEach(item => item.classList.remove("font-bold"));
                    }
                });
            }
        });

        // Hide dropdowns when clicking outside
        window.addEventListener('click', () => {
            if (userDropdown) userDropdown.classList.add('hidden');
            if (notifDropdown) {
                notifDropdown.classList.add('hidden');
                notifDropdown.classList.remove('show');
                isNotifOpen = false;
            }
        });

        // Notifications permission
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                } else if (permission === 'denied') {
                    console.warn("Notification permission denied");
                } else {
                    console.warn("Notification permission dismissed");
                }
            });
        } else {
            console.warn("This browser does not support notifications.");
        }

        // WebSocket setup
        const wsScheme = location.protocol === "https:" ? "wss" : "ws";
        const socket = new WebSocket(`${wsScheme}://${url}/ws/tree-notifications/`);

        socket.onmessage = async (e) => {
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

                if (!isNotifOpen) {
                  incrementBadge();
                } else {
                  document.querySelectorAll("#notification-list li.font-bold, #mobile-notification-list li.font-bold")
                    .forEach(item => item.classList.remove("font-bold"));
                  await markAllNotificationsSeen();  //  mark as seen server-side too
                }

                if (isAppInFocus() && !isNotifOpen && data.message !== "Connected to WebSocket") {
                    showInAppBanner(data.message, data.notif_type, data.tree_id);
                }
            }
        };

        // Fetch notifications if logged in
        if (authToken) {
            fetch(`${http}://${url}/api/notifications/`, {
                headers: { 'Authorization': `Token ${authToken}` }
            })
                .then(res => res.ok ? res.json() : null)
                .then(notifs => {
                    if (!notifs) return;
                    let unseenCount = 0;
                    for (let notif of notifs) {
                        addNotificationToList(notif.message, !notif.is_seen, notif.created_at, notif.related_tree, notif.tree_name, notif.notif_type, notif.is_passed);
                        if (!notif.is_seen) unseenCount++;
                    }
                    updateBadge(unseenCount);
                })
                .catch(() => { });
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();


function isAppInFocus() {
  return document.visibilityState === "visible";
}

function showInAppBanner(message, notifType, treeId) {
  const banner = document.getElementById("in-app-banner");
  if (!banner) return;

  banner.textContent = message;
  banner.dataset.refid = treeId;        // Set it for click handler
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


let unreadCount = 0;

function addNotificationToList(message, isUnseen = false, timestamp = null, treeId = null, treeName, notifType = null, isPassed) {
  const desktopList = document.getElementById("notification-list");
  const mobileList = document.getElementById("mobile-notification-list");

  // Create the notification item
  const createItem = () => {
    const item = document.createElement("li");
    item.className = "py-2 border-b border-gray-200";
    if (isUnseen) item.classList.add("font-bold");
    item.dataset.timestamp = timestamp;

    const datePart = timestamp ? `<br><small class="text-gray-500">${new Date(timestamp).toLocaleString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</small>` : "";

    item.innerHTML = `
      <div class="flex justify-between items-start relative">
        <div class="flex-1 cursor-pointer">${message} ${datePart}</div>
      </div>
    `;

    if (treeId && notifType) {
      item.querySelector(".flex-1").addEventListener("click", (e) => {
        e.stopPropagation();
        const params = new URLSearchParams({ focus: treeId, type: notifType });
        if (!currentPath.includes("map.html")) {
          window.location.href = `/map.html?${params.toString()}`;
          return;
        }
        focusOnTree(treeId, notifType);
        markAllNotificationsSeen();
      });
    }

    // Add "Pass" button for tree help notifications
    if (notifType === "tree_help") {
      const passBtn = document.createElement("button");
      passBtn.className = "pass-btn text-sm";
      const actuallyPassed = isPassed === true || isPassed === "true";

      if (actuallyPassed) {
        passBtn.textContent = "Status: You passed it to another expert";
        passBtn.classList.add("text-gray-500");
        passBtn.disabled = true;
      } else if (treeName !== "TBD") {
        passBtn.textContent = "Status: Tree already identified";
        passBtn.disabled = true;
      } else {
        passBtn.textContent = "Pass";
        passBtn.classList.add("bg-green-700", "text-white", "px-2", "py-1", "rounded", "hover:opacity-90", "absolute", "bottom-0", "right-0");
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
              passBtn.className = "text-gray-500";
              passBtn.disabled = true;
            } else {
              return res.json().then((data) => {
                passBtn.textContent = data?.detail || "Failed to pass";
                passBtn.classList.add("text-red-500");
              });
            }
          })
          .catch(() => {
            passBtn.textContent = "Error";
            passBtn.classList.add("text-red-500");
          });
        });
      }
      item.querySelector(".flex-1").appendChild(passBtn);
    }

    return item;
  };

  const itemDesktop = createItem();
  const itemMobile = createItem();

  // Remove "no notifications" placeholder
  desktopList?.querySelector("li.text-gray-400")?.remove();
  mobileList?.querySelector("li.text-gray-400")?.remove();

  // Append to both
  if (desktopList) desktopList.appendChild(itemDesktop);
  if (mobileList) mobileList.appendChild(itemMobile);

  // Sort both lists
  [desktopList, mobileList].forEach(list => {
    if (!list) return;
    const items = [...list.children];
    items.sort((a, b) => new Date(b.dataset.timestamp) - new Date(a.dataset.timestamp));
    items.forEach(i => list.appendChild(i));
    if (list.children.length > 50) list.removeChild(list.lastChild);
  });
}




function updateBadge(count) {
  document.querySelectorAll('.notification-count').forEach(badge => {
    badge.textContent = count > 0 ? count : "";
    badge.classList.toggle('hidden', count === 0);
  });
}


function incrementBadge() {
  let current = 0;
  const firstBadge = document.querySelector('.notification-count');
  if (firstBadge) {
    current = parseInt(firstBadge.textContent || "0");
  }
  updateBadge(current + 1);
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

const modal = document.getElementById('mobile-notification-modal');
if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeMobileNotif();
        }
    });
}

function closeMobileNotif() {
    modal.classList.add('hidden');
    document.body.style.overflow = '';

    // Move notifications back to desktop dropdown
    const notifList = document.getElementById('notification-list');
    const mobileList = document.getElementById('mobile-notification-list');
    if (notifList && mobileList) {
        notifList.innerHTML = '';
        notifList.append(...mobileList.children);
    }
}