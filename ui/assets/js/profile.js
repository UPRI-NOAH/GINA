// change URL for backend
let url = "punla.up.edu.ph";
let userURL = `https://${url}/api/user-info/`;
let userTreeURL  = `https://${url}/api/user-tree-info/`;
let passwordChangeURL = `https://${url}/auth/users/set_password/`;

const loadingOverlay = document.getElementById('loading-overlay');

function showLoading() {
  loadingOverlay.style.display = 'flex';
}

function hideLoading() {
  loadingOverlay.style.display = 'none';
}



// authentication token
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
  document.getElementById("user-dropdown").classList.add("hidden");
}

// Log Out Function
function logOut() {
  localStorage.setItem('authToken', '');
  sessionStorage.setItem('authToken', '');
  localStorage.setItem('username', '');
  sessionStorage.setItem('username', '');
  location.reload();
}


function loadUserProfile() {
    showLoading()
    var username = localStorage.getItem('username') || sessionStorage.getItem('username');
    console.log(sessionStorage.getItem('username'))

    if (!username) {
      
        window.location.href = 'login.html';

        return;
    }

    if (username == 'undefined') {
      
      window.location.href = 'login.html';

      return;
    }


    let userInfoURL = `${userURL}${username}/`; // URL to fetch user info
    let userTreeInfoURL = `${userTreeURL}?owning_user__user=${username}`; // URL to fetch user's trees

    fetch(userInfoURL, {
        method: 'GET',
        headers: {
            'Authorization': `Token ${authToken}`,
        }
    })
    .then(response => response.json())
    .then(userData => {
        
        document.getElementById('profile-name').innerText = `${userData.first_name} ${userData.last_name}`;
        document.getElementById('username').innerText = `@${userData.user}`;
        document.getElementById('user-points').innerText = `Points: ${userData.user_points}`;

        document.getElementById('edit-first-name').value = userData.first_name;
        document.getElementById('edit-last-name').value = userData.last_name;

        // fetch user's trees count
        fetch(userTreeInfoURL, {
            method: 'GET',
            headers: {
                'Authorization': `Token ${authToken}`,
            }
        })
        .then(response => response.json())
        .then(treesData => {
            hideLoading()

            const treesPlanted = treesData.length;
            document.getElementById('trees-planted').innerText = `Trees Planted: ${treesPlanted}`;
        })
        .catch(error => console.error('Error fetching user trees:', error));
        hideLoading()

    })
    .catch(error => console.error('Error fetching user info:', error));
        hideLoading()

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
  var userInfoURL = `${userURL}${username}/`;

  showLoading()
  fetch(userInfoURL, {
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