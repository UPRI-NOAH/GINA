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
      document.getElementById('profile-name').innerText = `${userData.first_name} ${userData.last_name}`;
      document.getElementById('username').innerText = `@${userData.user}`;
      document.getElementById('user-points').innerText = `Points: ${userData.user_points}`;
      document.getElementById('trees-planted').innerText = `Trees Planted: ${userData.tree_count}`;

      document.getElementById('edit-first-name').value = userData.first_name;
      document.getElementById('edit-last-name').value = userData.last_name;
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