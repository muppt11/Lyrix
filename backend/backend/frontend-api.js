const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// JWT Secret (in production, use a secure secret)
const JWT_SECRET = process.env.JWT_SECRET || 'lyralytics-secret-key';

// Mock user database (in production, use a real database)
const users = new Map();

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'LyraLytics API is running' });
});

// Google OAuth callback
app.post('/api/auth/google', async (req, res) => {
  try {
    const { access_token } = req.body;
    
    if (!access_token) {
      return res.status(400).json({ error: 'Access token required' });
    }

    // Get user info from Google
    const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const userInfo = response.data;
    
    // Create or update user
    const user = {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.given_name || userInfo.name,
      picture: userInfo.picture,
      googleConnected: true
    };

    users.set(user.id, user);

    // Generate JWT token
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      user,
      token,
      message: 'Google account connected successfully'
    });

  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Failed to authenticate with Google' });
  }
});

// Instagram OAuth callback
app.post('/api/auth/instagram', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    // Exchange code for access token
    const tokenResponse = await axios.post('https://api.instagram.com/oauth/access_token', {
      client_id: process.env.INSTAGRAM_CLIENT_ID,
      client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: `${req.protocol}://${req.get('host')}/api/auth/instagram/callback`,
      code
    });

    const { access_token, user_id } = tokenResponse.data;

    // Get user info
    const userResponse = await axios.get(`https://graph.instagram.com/me?fields=id,username,account_type&access_token=${access_token}`);
    const userInfo = userResponse.data;

    // Create or update user
    const user = {
      id: user_id,
      username: userInfo.username,
      accountType: userInfo.account_type,
      instagramConnected: true
    };

    users.set(user.id, user);

    // Generate JWT token
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      user,
      token,
      message: 'Instagram account connected successfully'
    });

  } catch (error) {
    console.error('Instagram auth error:', error);
    res.status(500).json({ error: 'Failed to authenticate with Instagram' });
  }
});

// Twitter OAuth callback
app.post('/api/auth/twitter', async (req, res) => {
  try {
    const { code, code_verifier } = req.body;
    
    if (!code || !code_verifier) {
      return res.status(400).json({ error: 'Authorization code and verifier required' });
    }

    // Exchange code for access token
    const tokenResponse = await axios.post('https://api.twitter.com/2/oauth2/token', {
      grant_type: 'authorization_code',
      code,
      code_verifier,
      client_id: process.env.TWITTER_CLIENT_ID,
      redirect_uri: `${req.protocol}://${req.get('host')}/api/auth/twitter/callback`
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString('base64')}`
      }
    });

    const { access_token } = tokenResponse.data;

    // Get user info
    const userResponse = await axios.get('https://api.twitter.com/2/users/me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const userInfo = userResponse.data.data;

    // Create or update user
    const user = {
      id: userInfo.id,
      username: userInfo.username,
      name: userInfo.name,
      twitterConnected: true
    };

    users.set(user.id, user);

    // Generate JWT token
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      user,
      token,
      message: 'Twitter account connected successfully'
    });

  } catch (error) {
    console.error('Twitter auth error:', error);
    res.status(500).json({ error: 'Failed to authenticate with Twitter' });
  }
});

// Get user profile
app.get('/api/user/profile', authenticateToken, (req, res) => {
  const user = users.get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user });
});

// Get analytics data
app.get('/api/analytics', authenticateToken, async (req, res) => {
  try {
    // Mock analytics data (in production, fetch from real APIs)
    const analyticsData = {
      totalFollowers: 125000,
      totalViews: 2500000,
      totalLikes: 450000,
      totalComments: 12500,
      growthRate: 12.5,
      engagementRate: 8.2,
      platforms: {
        youtube: {
          followers: 75000,
          views: 1500000,
          growth: 15.2,
          recentVideos: [
            { title: 'How to Grow on YouTube', views: 150000, likes: 8500 },
            { title: 'Content Creation Tips', views: 120000, likes: 7200 },
            { title: 'Social Media Strategy', views: 95000, likes: 5800 }
          ]
        },
        instagram: {
          followers: 35000,
          views: 800000,
          growth: 8.5,
          recentPosts: [
            { caption: 'Behind the scenes!', likes: 2500, comments: 180 },
            { caption: 'New video coming soon', likes: 2200, comments: 150 },
            { caption: 'Thank you for 35k!', likes: 3100, comments: 220 }
          ]
        },
        twitter: {
          followers: 15000,
          views: 200000,
          growth: 5.8,
          recentTweets: [
            { text: 'Just uploaded a new video!', retweets: 45, likes: 320 },
            { text: 'Great feedback from the community', retweets: 32, likes: 280 },
            { text: 'Working on something exciting', retweets: 28, likes: 240 }
          ]
        }
      },
      engagement: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Likes',
            data: [1200, 1900, 3000, 5000, 2000, 3000, 4000],
          },
          {
            label: 'Comments',
            data: [300, 500, 800, 1200, 400, 600, 800],
          },
          {
            label: 'Shares',
            data: [100, 200, 300, 500, 150, 250, 350],
          }
        ]
      },
      audience: {
        labels: ['18-24', '25-34', '35-44', '45-54', '55+'],
        datasets: [{
          data: [30, 35, 20, 10, 5],
        }]
      },
      performance: {
        labels: ['Content Quality', 'Engagement', 'Reach', 'Growth', 'Consistency', 'Timing'],
        datasets: [{
          label: 'Performance Score',
          data: [85, 78, 92, 88, 75, 82],
        }]
      }
    };

    res.json(analyticsData);

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// Get platform-specific data
app.get('/api/analytics/:platform', authenticateToken, async (req, res) => {
  try {
    const { platform } = req.params;
    const { timeRange = '30d' } = req.query;

    // Mock platform-specific data
    const platformData = {
      youtube: {
        subscribers: 75000,
        totalViews: 1500000,
        averageViewDuration: '8:45',
        uploadFrequency: '3 videos/week',
        topVideos: [
          { title: 'How to Grow on YouTube', views: 150000, likes: 8500, published: '2024-01-15' },
          { title: 'Content Creation Tips', views: 120000, likes: 7200, published: '2024-01-10' },
          { title: 'Social Media Strategy', views: 95000, likes: 5800, published: '2024-01-05' }
        ]
      },
      instagram: {
        followers: 35000,
        posts: 245,
        averageLikes: 2800,
        averageComments: 180,
        topPosts: [
          { caption: 'Behind the scenes!', likes: 2500, comments: 180, posted: '2024-01-15' },
          { caption: 'New video coming soon', likes: 2200, comments: 150, posted: '2024-01-12' },
          { caption: 'Thank you for 35k!', likes: 3100, comments: 220, posted: '2024-01-10' }
        ]
      },
      twitter: {
        followers: 15000,
        tweets: 1250,
        averageRetweets: 35,
        averageLikes: 280,
        topTweets: [
          { text: 'Just uploaded a new video!', retweets: 45, likes: 320, tweeted: '2024-01-15' },
          { text: 'Great feedback from the community', retweets: 32, likes: 280, tweeted: '2024-01-12' },
          { text: 'Working on something exciting', retweets: 28, likes: 240, tweeted: '2024-01-10' }
        ]
      }
    };

    if (!platformData[platform]) {
      return res.status(404).json({ error: 'Platform not found' });
    }

    res.json(platformData[platform]);

  } catch (error) {
    console.error('Platform analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch platform data' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 LyraLytics API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Frontend should connect to: http://localhost:${PORT}`);
});

module.exports = app; 