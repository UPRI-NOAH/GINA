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
        const captchaToken = document.querySelector('[name="h-captcha-response"]').value;

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

                // Store token
                if (remember) {
                    localStorage.setItem('authToken', authToken);
                    localStorage.setItem('username', username);
                    localStorage.setItem('userType', userType);
                } else {
                    sessionStorage.setItem('authToken', authToken);
                    sessionStorage.setItem('username', username);
                    sessionStorage.setItem('userType', userType);
                }

                hideLoading();
                window.location.href = 'index.html';
            } else {
                let errorMessage = 'An unexpected error occurred.';
                if (data.error) errorMessage = data.error;
                else if (data.detail) errorMessage = data.detail;
                else if (data.non_field_errors) errorMessage = data.non_field_errors.join(', ');
                else errorMessage = JSON.stringify(data);

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
