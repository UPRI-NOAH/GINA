document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const loadingOverlay = document.getElementById('loading-overlay');

    const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const rememberMe = localStorage.getItem('authToken') !== null;

    if (authToken && rememberMe) {
        window.location.href = 'index.html';
        return;
    }

      if (isLoggedIn === true) {
        window.location.href = 'profile.html';
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading();

        const username = document.querySelector('input[name="uname"]').value;
        const password = document.querySelector('input[name="psw"]').value;
        const remember = document.querySelector('input[name="remember"]').checked;
        const captchaToken = hcaptcha.getResponse();

        if (!captchaToken) {
            hideLoading();
            alert("Please complete the hCaptcha.");
            return;
        }

        try {
            const response = await fetch(loginURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    password,
                    hcaptcha_token: captchaToken,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                const authToken = data.auth_token;
                const userType = data.user_type;
                const actualUsername = data.username;

                // Store token
                if (rememberMe) {
                    // Remember me is checked, store the auth token in local storage
                    localStorage.setItem('authToken', authToken);
                    localStorage.setItem('username', actualUsername);
                    localStorage.setItem('userType', userType); 
                } else {
                    // Remember me is not checked, store the auth token in session storage
                    localStorage.setItem('authToken', authToken);
                    localStorage.setItem('username', actualUsername);
                    localStorage.setItem('userType', userType); 
                    sessionStorage.setItem('authToken', authToken);
                    sessionStorage.setItem('username', actualUsername);
                    sessionStorage.setItem('userType', userType);
                }

                hideLoading();
                localStorage.setItem('isLoggedIn', 'true');

                window.location.href = 'index.html';
            } else {
                let errorMessage = 'An unexpected error occurred.';

                // Custom throttle message with retry_after
                if (data.error) {
                    errorMessage = data.error;
                    if (data.retry_after) {
                        errorMessage += ` Try again in ${data.retry_after} seconds.`;
                    }
                } else if (data.detail) {
                    errorMessage = data.detail;
                } else if (data.non_field_errors) {
                    errorMessage = data.non_field_errors.join(', ');
                } else {
                    errorMessage = JSON.stringify(data);
                }

                hideLoading();
                alert(errorMessage);
                resetCaptcha();  // reset after failed login
            }
        } catch (err) {
            hideLoading();
            console.error('Network or fetch error:', err);
            resetCaptcha();
        }
    });

    form.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && loadingOverlay.style.display === 'flex') {
            e.preventDefault();
        }
    });

    function showLoading() {
        loadingOverlay.style.display = 'flex';
    }

    function hideLoading() {
        loadingOverlay.style.display = 'none';
    }

    function resetCaptcha() {
        if (window.hcaptcha) {
            hcaptcha.reset();
        }
    }
});
