document.addEventListener('DOMContentLoaded', () => {
  const formReg = document.getElementById('register-form');

  if (isLoggedIn === true) {
    window.location.href = 'profile.html';
    return;
  }

  formReg.addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading();

    const newPassword = document.querySelector('input[name="psw"]').value;
    const retypePassword = document.querySelector('input[name="psw_again"]').value;

    if (newPassword !== retypePassword) {
      alert("Passwords do not match!");
      hideLoading();
      return;
    }

    const userType = document.getElementsByName('user_type')[0].value;
    if (!userType) {
      alert("Please select a user type.");
      hideLoading();
      return;
    }

    // Check hCaptcha
    const captchaResponse = hcaptcha.getResponse();
    if (!captchaResponse) {
      alert("Please complete the captcha.");
      hideLoading();
      return;
    }

    const userData = {
      email: document.getElementsByName('email')[0].value,
      username: document.getElementsByName('uname')[0].value,
      password: document.getElementsByName('psw')[0].value,
      hcaptcha_token: captchaResponse 
    };

    const userInfo = {
      user: null,
      first_name: document.getElementsByName('fname')[0].value,
      last_name: document.getElementsByName('lname')[0].value,
      email: document.getElementsByName('email')[0].value,
      contact: document.getElementsByName('cnum')[0].value,
      user_type: userType,
      profile_picture: "",
      user_points: 0
    };

    try {
      const response = await fetch(signupURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessages = '';
        for (const messages of Object.values(errorData)) {
          if (Array.isArray(messages)) {
            messages.forEach(msg => {
              errorMessages += `• ${msg}\n`;
            });
          } else {
            errorMessages += `• ${messages}\n`;  // handle string case
          }
        }
        alert(errorMessages || 'An unexpected error occurred.');
        throw new Error('Validation failed');
      }

      const data = await response.json();
      userInfo.user = data.id;

      const userResponse = await fetch(userURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userInfo)
      });

      hideLoading();

      if (!userResponse.ok) {
        const responseData = await userResponse.json();
        console.error("Error from /api/user-info/:", responseData);
        alert('Failed to create user info');
        return;
      }

      alert('User registered successfully');
      window.location.href = 'login.html';
    } catch (error) {
      hideLoading();
      console.error('Error:', error);
      alert('An error occurred during registration.');
    } finally {
      // Clear hCaptcha after submit attempt
      if (window.hcaptcha) {
          hcaptcha.reset();
        }
    }
  });

  // Prevent Enter key when loading
  formReg.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && loadingOverlay.style.display === 'flex') {
      e.preventDefault();
    }
  });
});
