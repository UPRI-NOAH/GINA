
document.addEventListener('DOMContentLoaded', () => {
    const element = document.getElementById('some-id');
    if (element) {
      element.classList.add('some-class');
    }
  });

if (isLoggedIn == true) {

  window.location.href = 'profile.html';

}

const form = document.querySelector('form');


if (authToken && rememberMe) {
    // User has an authToken saved, automatically log them in
    window.location.href = 'index.html';
} else {
    // User doesn't have an authToken saved, show the login form

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading(); 

        const username = document.querySelector('input[name="uname"]').value;
        const password = document.querySelector('input[name="psw"]').value;
        const rememberMe = document.querySelector('input[name="remember"]').checked;

        const response = await fetch(loginURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                password,
            }),
        });

        const data = await response.json();

        if (response.ok) {
            // Login successful, save the auth token
            const authToken = data.auth_token;
            const userType = data.user_type;
            if (rememberMe) {
                // Remember me is checked, store the auth token in local storage
                localStorage.setItem('authToken', authToken);
                localStorage.setItem('username', username);
                localStorage.setItem('userType', userType); 
            } else {
                // Remember me is not checked, store the auth token in session storage
                localStorage.setItem('authToken', authToken);
                localStorage.setItem('username', username);
                localStorage.setItem('userType', userType); 
                sessionStorage.setItem('authToken', authToken);
                sessionStorage.setItem('username', username);
                sessionStorage.setItem('userType', userType);
            }
            hideLoading(); 

            // Redirect to the home page
            window.location.href = 'index.html';
        } else {
            // Login failed, handle the error
            console.error(data);
            let errorMessage = 'An unexpected error occurred.';
            
            // Check if there are error messages from the backend
            if (data && data.detail) {
                errorMessage = data.detail;  // If a specific message is returned from the backend
            } else if (data.non_field_errors) {
                errorMessage = data.non_field_errors.join(', ');  // If multiple errors are present (e.g., incorrect credentials)
            }
            hideLoading(); 

            // Display the error message in an alert box
            alert(errorMessage);
        }
    });
}

  // Prevent enter when loading
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && loadingOverlay.style.display === 'flex') {
      e.preventDefault(); // prevent the form from being submitted
    }
  });
  