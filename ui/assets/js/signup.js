

const formReg = document.getElementById('register-form');

if (isLoggedIn == true) {

  window.location.href = 'profile.html';

}


  formReg.addEventListener('submit', (e) => {
    e.preventDefault();
    showLoading(); 

    const newPassword = document.querySelector('input[name="psw"]').value;
    const retypePassword = document.querySelector('input[name="psw_again"]').value;

    if (newPassword !== retypePassword) {
      alert("Passwords do not match!");
      hideLoading()
      return;
    }
    
    const userData = {
      "email": document.getElementsByName('email')[0].value,
      "username": document.getElementsByName('uname')[0].value,
      "password": document.getElementsByName('psw')[0].value
    };

    const userInfo = {
      "user": null,
      "first_name": document.getElementsByName('fname')[0].value,
      "last_name": document.getElementsByName('lname')[0].value,
      "email": document.getElementsByName('email')[0].value,
      "contact": document.getElementsByName('cnum')[0].value,
      "profile_picture": "",
      "user_points": 0
    };

    fetch(signupURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })
    .then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json();
        let errorMessages = '';
        for (const messages of Object.values(errorData)) {
          messages.forEach(msg => {
            errorMessages += `• ${msg}\n`;
          });
        }
        hideLoading();
        alert(errorMessages || 'An unexpected error occurred.');
        throw new Error('Validation failed');
      }

      const data = await response.json();
      userInfo.user = data.id;

      return fetch(userURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userInfo)
      });
    })
    .then(async (res) => {
      hideLoading(); // Hide loading before alert

      if (!res.ok) {
        const responseData = await res.json();
        console.error("Error from /api/user-info/:", responseData);
        alert('Failed to create user info');
        return;
      }

      alert('User registered successfully');
      window.location.href = 'login.html';
    })
    .catch(error => {
      hideLoading();
      console.error('Error:', error);
      alert('An error occurred during registration.');
    });
  });

  // Prevent enter when loading
formReg.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && loadingOverlay.style.display === 'flex') {
    e.preventDefault(); // prevent the form from being submitted
  }
});
