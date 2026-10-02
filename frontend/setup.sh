#!/bin/bash
set -e

echo "🚀 Setting up LyraLytics Frontend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "✅ Dependencies installed successfully"

# Create environment file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "🔧 Creating .env.local from .env.example..."
    cp .env.example .env.local
    echo "✅ .env.local created — edit it to add real platform credentials (optional)"
else
    echo "✅ .env.local already exists"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "To start the development server:"
echo "  npm run dev"
echo ""
echo "To build for production:"
echo "  npm run build"
echo ""
echo "The app will be available at: http://localhost:3000"
echo "Every page works out of the box with demo data — no API keys required."
echo ""
echo "Happy coding! 🚀"
