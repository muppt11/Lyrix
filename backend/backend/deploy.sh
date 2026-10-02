#!/bin/bash

echo "🚀 Deploying LyraLytics to Vercel..."

# Clean up any existing node_modules and lock files
echo "🧹 Cleaning up..."
rm -rf node_modules package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json

# Install dependencies with legacy peer deps
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install --legacy-peer-deps
cd ..

# Build frontend
echo "🔨 Building frontend..."
cd frontend
npm run build
cd ..

echo "✅ Deployment preparation completed!"
echo "📋 Next steps:"
echo "1. Commit your changes: git add . && git commit -m 'Fix Chart.js dependency conflicts'"
echo "2. Push to GitHub: git push origin main"
echo "3. Deploy to Vercel: vercel --prod" 