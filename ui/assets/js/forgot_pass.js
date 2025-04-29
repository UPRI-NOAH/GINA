// change URL    backend

let url = "punla.up.edu.ph";
let resetPassUrl = `https://${url}/auth/users/reset_password/`;


const form = document.querySelector('form');

const loadingOverlay = document.getElementById('loading-overlay');

function showLoading() {
  loadingOverlay.style.display = 'flex';
}

function hideLoading() {
  loadingOverlay.style.display = 'none';
}


form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementsByName('email')[0].value;

    if (!email) {
        alert("Please enter your email address.");
          hideLoading()

        return;
    }

    showLoading();

    try {
        const response = await fetch(resetPassUrl, {  // Update the URL as needed
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        hideLoading();

        // Check if the response is okay (status code 200-299)
        if (response.ok) {
            // Only try to parse JSON if the response contains a body
            const data = response.status === 204 ? {} : await response.json();

            alert("A password reset link has been sent!");
            form.reset(); // Clear form after success
        } else {
            const data = await response.json();
            if (data.email) {
                alert(data.email.join('\n'));
            } else {
                alert("An error occurred. Please try again.");
            }
        }
    } catch (error) {
        hideLoading();
        console.error('Error:', error);
        alert("An error occurred. Please try again later.");
    }
});


  // Prevent enter when loading
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && loadingOverlay.style.display === 'flex') {
      e.preventDefault(); // prevent the form from being submitted
    }
  });
  