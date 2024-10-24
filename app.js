document.addEventListener('DOMContentLoaded', () => {
    fetch('/current-user')
        .then(response => response.json())
        .then(data => {
            const navRight = document.getElementById('navRight');
            const signinLink = document.getElementById('signinLink');

            if (data.user) {
                signinLink.textContent = data.user;  // Replace "Sign In" with the user's name
                signinLink.href = "#";  // No need to redirect to sign-in page

                // Add a logout option
                const logoutLink = document.createElement('a');
                logoutLink.textContent = 'Logout';
                logoutLink.href = '/logout';
                logoutLink.onclick = (e) => {
                    e.preventDefault();
                    fetch('/logout', { method: 'POST' })
                        .then(() => {
                            window.location.href = '/';  // Redirect to home after logout
                        });
                };
                navRight.appendChild(logoutLink);
            }
        })
        .catch(error => console.error('Error fetching current user:', error));
});