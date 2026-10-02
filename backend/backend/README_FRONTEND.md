# LyraLytics Frontend - Social Media Analytics Platform

🎉 **Welcome to LyraLytics!** A modern, bubbly social media analytics platform with AI-powered insights.

## ✨ Features

### 🎨 **Bubbly Welcome Experience**
- **Smart Name Detection**: Automatically detects and displays the user's name from Google account or other sources
- **Animated Welcome Screen**: Beautiful floating bubbles and smooth animations
- **Glass Morphism Design**: Modern UI with translucent effects and gradients
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile

### 🔗 **Social Media Integration**
- **Google/YouTube OAuth**: Connect your Google account for personalized analytics
- **Instagram Basic Display API**: Track your Instagram engagement and growth
- **Twitter OAuth 2.0**: Monitor your Twitter analytics and audience insights
- **Secure Authentication**: Industry-standard OAuth 2.0 with JWT tokens

### 📊 **Analytics Dashboard**
- **Real-time Data**: Live analytics from all connected platforms
- **Interactive Charts**: Beautiful visualizations with Chart.js
- **Platform Comparison**: Compare performance across different social media platforms
- **Growth Tracking**: Monitor follower growth, engagement rates, and trends

### 🧠 **AI-Powered Insights**
- **Performance Analysis**: Get detailed insights about your content performance
- **Audience Demographics**: Understand your audience better
- **Optimization Recommendations**: AI-powered suggestions to improve your content
- **Trend Analysis**: Identify trending topics and opportunities

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Social media developer accounts (Google, Instagram, Twitter)

### 1. Setup Frontend
```bash
# Run the automated setup script
npm run setup-frontend

# Or manually:
cd frontend
npm install
```

### 2. Configure API Keys
Create a `.env` file in the `frontend` directory:
```env
# Google/YouTube OAuth
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here

# Instagram Basic Display API
REACT_APP_INSTAGRAM_CLIENT_ID=your_instagram_client_id_here

# Twitter OAuth 2.0
REACT_APP_TWITTER_CLIENT_ID=your_twitter_client_id_here

# Backend API URL
REACT_APP_API_URL=http://localhost:3001
```

### 3. Start the Application
```bash
# Start everything (backend + frontend + API)
npm run dev-full

# Or start individually:
npm run dev              # Main backend
npm run frontend-api     # Frontend API server
npm run frontend         # React frontend
```

### 4. Open Your Browser
Navigate to `http://localhost:3000` to see the beautiful welcome screen!

## 🔧 API Setup Guide

### Google/YouTube Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials
5. Add `http://localhost:3000` to authorized origins
6. Copy the Client ID to your `.env` file

### Instagram Setup
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Instagram Basic Display product
4. Configure OAuth redirect URI: `http://localhost:3000/auth/instagram/callback`
5. Get your app ID and add to `.env` file

### Twitter Setup
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app
3. Enable OAuth 2.0
4. Configure callback URL: `http://localhost:3000/auth/twitter/callback`
5. Get your client ID and add to `.env` file

## 📱 User Experience Flow

### 1. Welcome Screen
- **Bubbly Animation**: Floating bubbles create an engaging first impression
- **Name Detection**: The app automatically detects your name from Google account
- **Feature Showcase**: Beautiful cards highlighting key features
- **Get Started**: Smooth transition to account connection

### 2. Social Media Connection
- **Platform Cards**: Visual cards for each social media platform
- **Connection Status**: Real-time feedback on connection progress
- **Security Notice**: Clear information about data security
- **Progress Tracking**: Visual progress bar showing connection status

### 3. Dashboard
- **Overview Stats**: Key metrics at a glance
- **Interactive Charts**: Beautiful data visualizations
- **Platform Performance**: Detailed breakdown by platform
- **Real-time Updates**: Live data from connected accounts

### 4. Analytics
- **Detailed Insights**: Deep dive into your performance
- **Audience Demographics**: Understanding your followers
- **Performance Radar**: Multi-dimensional performance analysis
- **Export Options**: Download your data for further analysis

## 🎨 Design System

### Colors
- **Primary**: Blue gradient (`#0ea5e9` to `#0284c7`)
- **Secondary**: Purple gradient (`#d946ef` to `#c026d3`)
- **Accent**: Orange gradient (`#f97316` to `#ea580c`)
- **Background**: Purple gradient (`#667eea` to `#764ba2`)

### Typography
- **Bubble Font**: Comic Sans MS for playful elements
- **Modern Font**: Inter for clean, professional text
- **Responsive**: Scales beautifully across all devices

### Animations
- **Framer Motion**: Smooth, performant animations
- **Floating Bubbles**: Continuous background animation
- **Hover Effects**: Interactive feedback on all elements
- **Page Transitions**: Smooth navigation between screens

## 🔐 Security Features

- **OAuth 2.0**: Industry-standard authentication
- **JWT Tokens**: Secure session management
- **HTTPS Ready**: Production-ready security
- **No Password Storage**: Your passwords are never stored
- **Revocable Access**: You can disconnect accounts anytime

## 📊 Analytics Features

### Real-time Metrics
- **Follower Count**: Total followers across all platforms
- **View Count**: Total views on your content
- **Engagement Rate**: Likes, comments, and shares
- **Growth Rate**: Month-over-month growth percentage

### Platform-specific Data
- **YouTube**: Subscribers, views, watch time, top videos
- **Instagram**: Followers, posts, engagement, top posts
- **Twitter**: Followers, tweets, retweets, top tweets

### Advanced Analytics
- **Audience Demographics**: Age, location, interests
- **Performance Radar**: Multi-dimensional scoring
- **Trend Analysis**: Growth patterns and predictions
- **Content Insights**: Best performing content types

## 🛠️ Technical Stack

### Frontend
- **React 18**: Modern React with hooks
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations
- **Chart.js**: Beautiful data visualizations
- **Lucide React**: Beautiful icons
- **React Query**: Data fetching and caching

### Backend
- **Express.js**: Fast, unopinionated web framework
- **JWT**: Secure authentication
- **Axios**: HTTP client for API calls
- **CORS**: Cross-origin resource sharing

### Development
- **Create React App**: Zero-config React setup
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixing
- **ESLint**: Code quality
- **Prettier**: Code formatting

## 📁 Project Structure

```
LyraLytics/
├── frontend/                 # React frontend application
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── WelcomeScreen.js
│   │   │   ├── SocialConnect.js
│   │   │   ├── Dashboard.js
│   │   │   └── Analytics.js
│   │   ├── contexts/        # React contexts
│   │   │   └── AuthContext.js
│   │   ├── App.js           # Main app component
│   │   ├── index.js         # Entry point
│   │   └── index.css        # Global styles
│   ├── package.json         # Frontend dependencies
│   ├── tailwind.config.js   # Tailwind configuration
│   └── postcss.config.js    # PostCSS configuration
├── frontend-api.js          # Express API server
├── setup_frontend.sh        # Frontend setup script
├── package.json             # Main project dependencies
└── README_FRONTEND.md       # This file
```

## 🚀 Deployment

### Development
```bash
npm run dev-full
```

### Production
```bash
# Build frontend
cd frontend
npm run build

# Start production server
npm run frontend-api
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](../../issues) page
2. Read the [Documentation](frontend/README.md)
3. Check your API keys are correctly configured
4. Ensure all dependencies are installed

## 🎯 Roadmap

- [ ] Real-time notifications
- [ ] Advanced content scheduling
- [ ] Competitor analysis
- [ ] AI-powered content recommendations
- [ ] Mobile app (React Native)
- [ ] Team collaboration features
- [ ] Advanced reporting
- [ ] Integration with more platforms

---

**Made with ❤️ for content creators everywhere!** 