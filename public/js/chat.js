class ChatManager {
    constructor() {
        this.nickname = localStorage.getItem('nickname');
        this.currentRoomId = localStorage.getItem('currentRoomId');
        this.messages = [];
        this.API_URL = 'http://localhost:3000/api';

        // Initialize UI elements
        this.messagesContainer = document.getElementById('messages');
        this.messageForm = document.getElementById('message-form');
        this.messageInput = document.getElementById('message');
        this.roomNameElement = document.getElementById('room-name');
        this.usersCountElement = document.getElementById('users-count');
        this.userNicknameElement = document.getElementById('user-nickname');
        this.backButton = document.getElementById('back-button');

        this.init();
    }

    async init() {
        // Check authentication
        if (!this.nickname || !this.currentRoomId) {
            window.location.href = 'index.html';
            return;
        }

        // Update UI
        this.userNicknameElement.textContent = this.nickname;
        
        // Add event listeners
        this.messageForm.addEventListener('submit', (e) => this.sendMessage(e));
        this.backButton.addEventListener('click', () => this.leaveRoom());

        // Load initial messages
        await this.loadMessages();

        // Set up auto-refresh
        setInterval(() => this.loadMessages(), 3000);
    }

    async loadMessages() {
        try {
            const response = await fetch(`${this.API_URL}/get-messages/${this.currentRoomId}`);
            const messages = await response.json();
            
            if (JSON.stringify(messages) !== JSON.stringify(this.messages)) {
                this.messages = messages;
                this.displayMessages();
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    displayMessages() {
        this.messagesContainer.innerHTML = '';
        
        this.messages.forEach(msg => {
            const messageElement = document.createElement('div');
            messageElement.className = 'message';
            
            messageElement.innerHTML = `
                <strong>${this.escapeHtml(msg.username)}:</strong>
                <span>${this.escapeHtml(msg.content)}</span>
                <small class="message-time">${new Date(msg.timestamp).toLocaleTimeString()}</small>
            `;
            
            this.messagesContainer.appendChild(messageElement);
        });
        
        this.scrollToBottom();
    }

    async sendMessage(e) {
        e.preventDefault();
        
        const content = this.messageInput.value.trim();
        if (!content) return;

        try {
            const response = await fetch(`${this.API_URL}/send-message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: this.nickname,
                    message: content,
                    roomId: this.currentRoomId
                })
            });

            if (response.ok) {
                this.messageInput.value = '';
                await this.loadMessages();
            } else {
                console.error('Error sending message:', await response.text());
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    leaveRoom() {
        localStorage.removeItem('currentRoomId');
        window.location.href = 'chatrooms.html';
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chatManager = new ChatManager();
});