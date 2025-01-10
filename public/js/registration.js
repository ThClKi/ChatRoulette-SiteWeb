document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registration-form');
    const errorMessage = document.getElementById('error-message');

    // Check if user is already registered and redirect if true
    const currentUser = localStorage.getItem('nickname');
    if (currentUser) {
        window.location.href = 'chatrooms.html';
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const nickname = document.getElementById('nickname').value.trim();
        
        // Validate nickname
        if (nickname.length < 3) {
            errorMessage.textContent = 'Nickname must be at least 3 characters long';
            return;
        }

        if (nickname.length > 15) {
            errorMessage.textContent = 'Nickname must not exceed 15 characters';
            return;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(nickname)) {
            errorMessage.textContent = 'Nickname can only contain letters, numbers, and underscores';
            return;
        }

        // Save to localStorage
        localStorage.setItem('nickname', nickname);
        
        // Redirect to chat rooms
        window.location.href = 'chatrooms.html';
    });
});