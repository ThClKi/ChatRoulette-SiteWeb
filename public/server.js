const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

require('dotenv').config()

const BOT_TOKEN = process.env.BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const ADMIN_ROLE_ID = process.env.ADMIN_ROLE_ID;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));


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

// Get message
app.get('/api/messages', async (req, res) => {
    const { channel_id, timestamp } = req.query;

    if (!channel_id) {
        return res.status(400).json({ error: 'channel_id is required' });
    }

    if (!timestamp) {
        return res.status(400).json({ error: 'timestamp is required' });
    }

    try {
        const sinceTimestamp = new Date(timestamp).getTime() / 1000;

        const messagesResponse = await axios.get(
            `https://discord.com/api/v9/channels/${channel_id}/messages?limit=50`,
            {
                headers: {
                    Authorization: `Bot ${BOT_TOKEN}`
                }
            }
        );

        console.log('First message data:', messagesResponse.data[0]);

        const messages = [];
        for (const msg of messagesResponse.data) {
            console.log('Processing message:', {
                id: msg.id,
                author: msg.author,
                member: msg.member,
                content: msg.content
            });

            const messageTimestamp = new Date(msg.timestamp).getTime() / 1000;
            if (messageTimestamp >= sinceTimestamp) {

                if (msg.content.includes(':')) {
                    const colonIndex = msg.content.indexOf(':');
                    messages.push({
                        id: msg.id,
                        username: msg.content.substring(0, colonIndex).trim(),
                        content: msg.content.substring(colonIndex + 1).trim(),
                        timestamp: msg.timestamp,
                        isAdmin: false
                    });
                } else if (msg.author && !msg.author.bot) {
                    let roles = msg.member?.roles;
                    if (!roles && msg.guild_id) {
                        roles = await getMemberRoles(msg.guild_id, msg.author.id);
                    }

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
        }

        res.json(messages.reverse());
    } catch (error) {
        console.error('Error getting messages:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to get messages' });
    }
});


// Get channels
app.get('/api/get-channels', async (req, res) => {
    try {
        const channelsResponse = await axios.get(
            `https://discord.com/api/v9/guilds/${GUILD_ID}/channels`,
            {
                headers: {
                    Authorization: `Bot ${BOT_TOKEN}`
                }
            }
        );

        const categoryChannels = channelsResponse.data.filter(channel => channel.parent_id === '1327978962642538627');

        const result = categoryChannels.map(channel => ({
            id: channel.id,
            name: channel.name
        }));

        res.json(result);
    } catch (error) {
        console.error('Error :', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed' });
    }
});

// Create a new channel
app.post('/api/create-channel', async (req, res) => {
    const { channel_name, channel_creator } = req.body;

    if (!channel_name || !channel_creator) {
        return res.status(400).json({ error: 'Channel name and creator are required.' });
    }

    try {
        const response = await axios.post(
            `https://discord.com/api/v9/guilds/${GUILD_ID}/channels`,
            {
                name: channel_name,
                parent_id: '1327978962642538627',
                type: 0,
                topic: `Created by ${channel_creator}`,
            },
            {
                headers: {
                    Authorization: `Bot ${BOT_TOKEN}`,
                    'Content-Type': 'application/json',
                }
            }
        );

        res.status(201).json({
            success: true,
            message: 'Channel created successfully',
            channel: {
                id: response.data.id,
                name: response.data.name,
                topic: response.data.topic,
            },
        });
    } catch (error) {
        console.error('Error creating channel:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Failed to create channel', 
            details: error.response?.data || error.message 
        });
    }
});



const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});