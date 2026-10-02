#!/bin/bash

echo "🚀 Setting up LyraLytics Frontend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ is required. Current version: $(node -v)"
    echo "Please upgrade Node.js to version 16 or higher."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Navigate to frontend directory
cd frontend

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Social Media API Keys
# Get these from the respective developer portals

# Google/YouTube OAuth
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here

# Instagram Basic Display API
REACT_APP_INSTAGRAM_CLIENT_ID=your_instagram_client_id_here

# Twitter OAuth 2.0
REACT_APP_TWITTER_CLIENT_ID=your_twitter_client_id_here

# Backend API URL (if different from default)
REACT_APP_API_URL=http://localhost:3001
EOF
    echo "✅ .env file created"
    echo "⚠️  Please update the .env file with your actual API keys"
else
    echo "✅ .env file already exists"
fi

# Build the project to check for errors
echo "🔨 Building project..."
npm run build --legacy-peer-deps

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check for errors above."
    exit 1
fi

echo "✅ Build successful"

echo ""
echo "🎉 Frontend setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update the .env file with your API keys:"
echo "   - Google Client ID: https://console.cloud.google.com/"
echo "   - Instagram Client ID: https://developers.facebook.com/"
echo "   - Twitter Client ID: https://developer.twitter.com/"
echo ""
echo "2. Start the development server:"
echo "   cd frontend && npm start"
echo ""
echo "3. Open your browser to: http://localhost:3000"
echo ""
echo "🔗 Useful links:"
echo "- Google Cloud Console: https://console.cloud.google.com/"
echo "- Facebook Developers: https://developers.facebook.com/"
echo "- Twitter Developer Portal: https://developer.twitter.com/"
echo ""
echo "📚 Documentation: frontend/README.md" 