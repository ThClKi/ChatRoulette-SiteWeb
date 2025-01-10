class ChatRoomManager {
    constructor() {
        this.nickname = localStorage.getItem('nickname');
        this.API_URL = 'http://localhost:3000/api';
        
        // Initialize UI elements
        this.roomsList = document.getElementById('rooms-list');
        this.createRoomBtn = document.getElementById('create-room');
        this.logoutBtn = document.getElementById('logout');
        this.userNicknameSpan = document.getElementById('user-nickname');
        
        this.init();
    }

    init() {
        // Check authentication
        if (!this.nickname) {
            window.location.href = 'index.html';
            return;
        }

        // Display nickname
        this.userNicknameSpan.textContent = this.nickname;

        // Add event listeners
        this.createRoomBtn.addEventListener('click', () => this.createRoom());
        this.logoutBtn.addEventListener('click', () => this.logout());

        // Initial room display
        this.loadRooms();

        // Refresh rooms periodically
        setInterval(() => this.loadRooms(), 5000);
    }

    async loadRooms() {
        try {
            const response = await fetch(`${this.API_URL}/rooms`);
            const rooms = await response.json();
            this.displayRooms(rooms);
        } catch (error) {
            console.error('Error loading rooms:', error);
        }
    }

    displayRooms(rooms) {
        this.roomsList.innerHTML = '';
        
        rooms.forEach(room => {
            const roomCard = document.createElement('div');
            roomCard.className = 'room-card';
            
            roomCard.innerHTML = `
                <h3>${room.name}</h3>
                <p>Users: ${room.users}/${room.maxUsers}</p>
                ${room.users < room.maxUsers ? 
                    `<button onclick="chatRoomManager.joinRoom(${room.id})" class="btn-primary">Join Room</button>` :
                    `<button disabled class="btn-primary btn-disabled">Room Full</button>`
                }
            `;
            
            this.roomsList.appendChild(roomCard);
        });
    }

    joinRoom(roomId) {
        localStorage.setItem('currentRoomId', roomId);
        window.location.href = 'chat.html';
    }

    logout() {
        localStorage.removeItem('nickname');
        localStorage.removeItem('currentRoomId');
        window.location.href = 'index.html';
    }
}

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chatRoomManager = new ChatRoomManager();
});