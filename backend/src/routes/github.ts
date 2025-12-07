import express from 'express';
import axios from 'axios';
import User from '../models/user';
import { protect as auth } from '../middlewares/auth';

const router = express.Router();

// Exchange code for access token
// Exchange code for access token
router.get('/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send('No code provided');
    }

    // Simply redirect the code to the frontend.
    // The frontend will then call the protected /connect endpoint with this code.
    // This avoids the issue of consuming the one-time code here.
    return res.redirect(`http://localhost:5173/?github_code=${code}`);
});

// Protected route to link GitHub account
router.post('/connect', auth, async (req: any, res) => {
    const { code } = req.body;
    console.log('Received connect request with code:', code);

    try {
        console.log('Exchanging code for token...');
        // Exchange code for token
        const response = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code,
        }, {
            headers: { Accept: 'application/json' }
        });

        const { access_token } = response.data;
        console.log('Token exchange response:', response.data);

        if (!access_token) {
            console.error('No access token in response');
            return res.status(400).json({ message: 'Failed to obtain access token from GitHub' });
        }

        console.log('Fetching GitHub user profile...');
        // Get Profile
        const userResponse = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const { login, id } = userResponse.data;
        console.log('GitHub user:', login, id);

        // Update User
        // req.user is already the user document from the auth middleware
        const user = req.user;

        if (!user) {
            console.error('User not found in request context');
            return res.status(404).json({ message: 'User not found' });
        }

        user.integrations.github = {
            accessTokenEncrypted: access_token, // In a real app, encrypt this!
            username: login,
            id: String(id),
            connectedAt: new Date()
        };

        await user.save();
        console.log('User updated with GitHub integration');

        res.json({ message: 'GitHub connected successfully', username: login });

    } catch (error: any) {
        console.error('GitHub Connect Error:', error.response?.data || error.message);
        res.status(500).json({ message: 'Failed to connect GitHub account' });
    }
});

// Fetch GitHub Activity
router.get('/activity', auth, async (req: any, res) => {
    try {
        // req.user is already populated by the auth middleware
        const user = req.user;

        if (!user || !user.integrations?.github?.accessTokenEncrypted) {
            return res.status(400).json({ message: 'GitHub not connected' });
        }

        const token = user.integrations.github.accessTokenEncrypted;
        const username = user.integrations.github.username;

        // Fetch events (commits, PRs, etc.)
        const { data } = await axios.get(`https://api.github.com/users/${username}/events`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { per_page: 10 }
        });

        // Process events to simple format
        const events = data.map((event: any) => ({
            id: event.id,
            type: event.type,
            repo: event.repo.name,
            createdAt: event.created_at,
            payload: event.payload // simplified
        }));

        res.json(events);

    } catch (error) {
        console.error('GitHub Activity Error:', error);
        res.status(500).json({ message: 'Failed to fetch GitHub activity' });
    }
});

export default router;
