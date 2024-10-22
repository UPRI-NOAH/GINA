// change URL for backend
let url = "202.92.141.153";
let signupURL = `http://${url}/auth/users/`;
let userURL = `http://${url}/api/user-info/`;

const form = document.getElementById('register-form');

        form.addEventListener('submit', (e) => {
          e.preventDefault();

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
          console.log(userData);
          console.log(userInfo);

          // Register user
          fetch(signupURL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
          })
          .then(response => response.json())
          .then(data => {
            console.log('User registered:', data);
            // Get the user ID from the response
            const userId = data.id;
            userInfo.user = userId;
            console.log(userInfo.user)
            // Register user info
            fetch(userURL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(userInfo)
            })
            .then(response => response.json())
            .then(data => {
              console.log('User info registered:', data);
              // Redirect to login.html after successful registration
              window.location.href = 'login.html';
            })
            .catch(error => console.error('Error registering user info:', error));
          })
          .catch(error => console.error('Error registering user:', error));
        });