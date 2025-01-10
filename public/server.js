const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

const BOT_TOKEN = 'none';
const CHANNEL_ID = 'none';
const ADMIN_ROLE_ID = 'none';

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Send messages
app.post('/api/send-message', async (req, res) => {
    const { username, message } = req.body;
    console.log('Received message request:', { username, message });

    if (!message || !username) {
        return res.status(400).json({ error: 'Username and message are required.' });
    }

    try {
        const response = await axios.post(
            `https://discord.com/api/v9/channels/${CHANNEL_ID}/messages`,
            {
                content: `${username}: ${message}`
            },
            {
                headers: {
                    Authorization: `Bot ${BOT_TOKEN}`,
                    'Content-Type': 'application/json',
                }
            }
        );

        console.log('Discord API response:', response.data);
        res.status(200).json({ success: true, data: response.data });
    } catch (error) {
        console.error('Discord API Error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        res.status(500).json({ 
            error: 'Error sending message to Discord',
            details: error.response?.data || error.message
        });
    }
});

// Функция для получения информации о пользователе
async function getMemberRoles(guildId, userId) {
    try {
        const response = await axios.get(
            `https://discord.com/api/v9/guilds/${guildId}/members/${userId}`,
            {
                headers: {
                    Authorization: `Bot ${BOT_TOKEN}`
                }
            }
        );
        console.log('Member data:', response.data);
        return response.data.roles || [];
    } catch (error) {
        console.error('Error getting member roles:', error.response?.data || error.message);
        return [];
    }
}

// Get messages
app.get('/api/messages', async (req, res) => {
    try {
        // Get messages from the channel
        const messagesResponse = await axios.get(
            `https://discord.com/api/v9/channels/${CHANNEL_ID}/messages?limit=50`,
            {
                headers: {
                    Authorization: `Bot ${BOT_TOKEN}`
                }
            }
        );

        console.log('First message data:', messagesResponse.data[0]);

        // Process messages
        const messages = [];
        for (const msg of messagesResponse.data) {
            // Debug log
            console.log('Processing message:', {
                id: msg.id,
                author: msg.author,
                member: msg.member,
                content: msg.content
            });

            if (msg.content.includes(':')) {
                // Message from our web interface
                const colonIndex = msg.content.indexOf(':');
                messages.push({
                    id: msg.id,
                    username: msg.content.substring(0, colonIndex).trim(),
                    content: msg.content.substring(colonIndex + 1).trim(),
                    timestamp: msg.timestamp,
                    isAdmin: false
                });
            } else if (msg.author && !msg.author.bot) {
                // Get user's roles if the member object is not included
                let roles = msg.member?.roles;
                if (!roles && msg.guild_id) {
                    roles = await getMemberRoles(msg.guild_id, msg.author.id);
                }

                // Debug log
                console.log('User roles:', roles);

                const isAdmin = roles?.includes(ADMIN_ROLE_ID);
                if (isAdmin) {
                    messages.push({
                        id: msg.id,
                        username: 'Admin',
                        content: msg.content,
                        timestamp: msg.timestamp,
                        isAdmin: true
                    });
                }
            }
        }

        // Send reverse chronological order
        res.json(messages.reverse());
    } catch (error) {
        console.error('Error getting messages:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to get messages' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});