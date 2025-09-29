function loadUserProfile() {
  showLoading();
  // If no username or authToken, redirect to login
  if (!username || username === 'undefined' || !authToken) {
      window.location.href = 'login.html';
      return;
  }


  fetch(editUserURL, {
      method: 'GET',
      headers: {
          'Authorization': `Token ${authToken}`,
      }
  })
  .then(response => {
      if (!response.ok) {
          // If not authorized, redirect
          if (response.status === 401 || response.status === 403) {
              window.location.href = 'login.html';
              throw new Error('Unauthorized');
          }
          throw new Error('Network response was not ok');
      }
      return response.json();
  })
  .then(userData => {


    const treesPlantedEl = document.getElementById('trees-planted');
      treesPlantedEl.innerText = `Trees Planted: ${userData.tree_count}`;

      // Make it look clickable
      treesPlantedEl.style.cursor = "pointer";
      treesPlantedEl.style.color = "#15803d"; // link-like color
      treesPlantedEl.style.textDecoration = "underline";

      document.getElementById('profile-name').innerText = `${userData.first_name} ${userData.last_name}`;
      document.getElementById('username').innerText = `@${userData.user}`;
      document.getElementById('user-points').innerText = `Points: ${userData.user_points}`;
      document.getElementById('trees-planted').innerText = `Trees Planted: ${userData.tree_count}`;

      document.getElementById('edit-first-name').value = userData.first_name;
      document.getElementById('edit-last-name').value = userData.last_name;

      document.getElementById('trees-planted').addEventListener('click', () => {
        loadUserTrees();
      });

  })
  .catch(error => {
      console.error('Error fetching user info:', error);
  })
  .finally(() => {
      hideLoading();
  });
}


// load user profile when page is ready
document.addEventListener('DOMContentLoaded', loadUserProfile);

// show edit Profile Form
function showEditProfile() {

  document.getElementById('edit-profile-form').classList.remove('hidden');
  document.getElementById('change-password-form').classList.add('hidden');
}

// show change Password Form
function showChangePassword() {
  document.getElementById('change-password-form').classList.remove('hidden');
  document.getElementById('edit-profile-form').classList.add('hidden');
}

// cancel edit on both forms
function cancelEdit() {
  document.getElementById('edit-profile-form').classList.add('hidden');
  document.getElementById('change-password-form').classList.add('hidden');
}

// submit profile edit
function submitEditProfile() {
  var firstName = document.getElementById('edit-first-name').value;
  var lastName = document.getElementById('edit-last-name').value;
  
  var username = localStorage.getItem('username') || sessionStorage.getItem('username');
  var authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

  showLoading()
  fetch(editUserURL, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${authToken}`,
    },
    body: JSON.stringify({
      first_name: firstName,
      last_name: lastName,
    })
  })
  .then(response => {
    if (response.ok) {
      hideLoading()
      alert('Profile updated successfully!');
      location.reload();
    } else {
      return response.json().then(data => { throw data; });
    }
  })
  .catch(error => {
    console.error(error);
    hideLoading()
    alert('Failed to update profile.');
  });
}

function submitEditPassword() {
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  showLoading()
  // check if the new password and confirm password match
  if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      hideLoading();
      return;
  }

  fetch(passwordChangeURL, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${authToken}`,
      },
      body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
      }),
  })
  .then(response => {
      hideLoading()

      if (response.ok) {
          alert('Password changed successfully!');
          location.reload();
      } else {
          return response.json().then(data => { throw data; });
      }
  })
  .catch(error => {

      hideLoading()

      // check if the error is related to the new password validation
      if (error.new_password) {
        // display the specific validation error messages (if any)
        alert(error.new_password.join(', '));
      } else if (error.current_password) {
        // handle error if current password is incorrect
        alert(`Incorrect current password.`);
      } else {
        alert('Failed to change password. Please try again.');
      }
  });
}


function openDeleteModal() {
  document.getElementById('deleteAccountModal').style.display = 'flex';
}

function closeDeleteModal() {
  document.getElementById('deleteAccountModal').style.display = 'none';
}


function handleDeleteAccount() {
  const pw1 = document.getElementById('confirmPassword1').value.trim();
  const pw2 = document.getElementById('confirmPassword2').value.trim();

  if (!pw1 || !pw2) {
    alert("Please fill in both password fields.");
    return;
  }

  if (pw1 !== pw2) {
    alert("Passwords do not match.");
    return;
  }

  // Ask for final confirmation
  const confirmed = confirm("Are you sure you want to permanently delete your account? This cannot be undone.");
  if (!confirmed) return;

  // Proceed with request
  fetch(deleteAccount, {
    method: 'DELETE',
    headers: {
      'Authorization': `Token ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password: pw1 })
  })
  .then(response => {
    if (response.status === 204) {
      alert("Account deleted successfully.");
      (async () => await logOut())();
    } else {
      return response.json().then(data => {
        throw new Error(data.detail || "Failed to delete account.");
      });
    }
  })
  .catch(err => {
    alert("Error: " + err.message);
  });
}



let allUserTrees = [];  // store all fetched trees
let currentFilter = 'All'; // default tab

function renderTrees(filter = 'All') {
  const treesList = document.getElementById('treesList');
  treesList.innerHTML = '';

  // Clone and sort by date planted (descending)
  let filteredTrees = allUserTrees.slice().sort((a, b) => {
    const dateA = new Date(a.planted_on);
    const dateB = new Date(b.planted_on);
    return dateB - dateA;
  });

  // Then filter by action if needed
  if (filter !== 'All') {
    filteredTrees = filteredTrees.filter(tree => tree.action === filter);
  }

  if (filteredTrees.length === 0) {
    treesList.innerHTML = `<p class="text-gray-500">No trees found for "${filter}".</p>`;
  } else {
    filteredTrees.forEach(tree => {
      const treeItem = document.createElement('div');
      treeItem.classList.add('flex', 'items-center', 'gap-3', 'p-3', 'border', 'rounded', 'bg-green-50');

      treeItem.innerHTML = `
        <a href="map.html?focus=${tree.reference_id}&type=view" class="flex items-center gap-3">
          <img src="${tree.image}" alt="${tree.tree_name || 'Tree'}"
              class="w-24 h-24 object-cover rounded-md border" />
          <div>
            <p class="font-semibold">${tree.tree_name || 'Unnamed Tree'}</p>
            <p class="text-sm text-gray-600">${tree.action} on: ${tree.planted_on || 'Unknown date'}</p>
            <p class="text-xs text-gray-500 italic">${tree.scientific_name || ''}</p>
            <p class="text-sm text-gray-600">Action: ${tree.action || 'Unknown action'}</p>
          </div>
        </a>
      `;

      treesList.appendChild(treeItem);
    });
  }
}

function setupTabs() {
  const tabs = document.querySelectorAll('#treeTabs > div');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active style from all tabs
      tabs.forEach(t => {
        t.style.fontWeight = 'normal';
        t.style.borderBottom = 'none';
        t.style.color = 'gray';
      });

      // Add active style to clicked tab
      tab.style.fontWeight = 'bold';
      tab.style.borderBottom = '2px solid #388E3C';
      tab.style.color = '#388E3C';

      // Update filter and rerender
      currentFilter = tab.dataset.filter;
      renderTrees(currentFilter);
    });
  });
}

function loadUserTrees() {
  showLoading();

  if (!username || username === 'undefined' || !authToken) {
    window.location.href = 'login.html';
    return;
  }

  fetch(`${usertreeURL}?owning_user__user=${username}`, {
    method: 'GET',
    headers: {
      'Authorization': `Token ${authToken}`,
    }
  })
  .then(response => {
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        window.location.href = 'login.html';
        throw new Error('Unauthorized');
      }
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(userTrees => {
    allUserTrees = userTrees;
    renderTrees(currentFilter);
    setupTabs();
    openTreesModal();
  })
  .catch(error => {
    console.error('Error fetching user info:', error);
  })
  .finally(() => {
    hideLoading();
  });
}


function openTreesModal() {
  document.getElementById('treesModal').classList.remove('hidden');
}

function closeTreesModal() {
  document.getElementById('treesModal').classList.add('hidden');
}


document.addEventListener("click", function (event) {
  const deleteModal = document.getElementById("deleteAccountModal");
  const treesModal = document.getElementById("treesModal");

  if (!deleteModal.classList.contains("hidden") && event.target === deleteModal) {
    closeDeleteModal();
  }

    if (!treesModal.classList.contains("hidden") && event.target === treesModal) {
    closeTreesModal();
  }

});