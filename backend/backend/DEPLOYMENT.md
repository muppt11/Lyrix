# LyraLytics Deployment Guide

## 🚀 Quick Deployment Fix

The Chart.js dependency conflict has been resolved. Here's how to deploy successfully:

### 1. **Local Testing**
```bash
# Run the deployment preparation script
./deploy.sh

# Or manually:
npm install --legacy-peer-deps
cd frontend && npm install --legacy-peer-deps && npm run build && cd ..
```

### 2. **Vercel Deployment**
```bash
# Deploy to Vercel
vercel --prod
```

## 🔧 What Was Fixed

### **Chart.js Version Conflict**
- **Problem**: Chart.js v4 was conflicting with chartjs-node-canvas which requires v3
- **Solution**: Pinned Chart.js to version 3.9.1 across all packages
- **Added**: `.npmrc` files with `legacy-peer-deps=true`

### **Dependency Resolution**
- **Main package.json**: Chart.js 3.9.1 (exact version)
- **Frontend package.json**: Chart.js 3.9.1 + react-chartjs-2 4.3.1
- **Resolutions**: Force Chart.js 3.9.1 across all dependencies
- **Overrides**: Ensure consistent Chart.js version

### **Build Configuration**
- **Vercel.json**: Configured for proper build process
- **NPM Flags**: `--legacy-peer-deps` for dependency resolution
- **Build Scripts**: Added vercel-build script for frontend

## 📋 Files Modified

1. **package.json** - Updated Chart.js to 3.9.1, added resolutions
2. **frontend/package.json** - Updated Chart.js and react-chartjs-2 versions
3. **.npmrc** - Added legacy peer deps configuration
4. **frontend/.npmrc** - Frontend-specific npm configuration
5. **vercel.json** - Vercel deployment configuration
6. **deploy.sh** - Automated deployment script

## 🎯 Next Steps

1. **Commit Changes**:
   ```bash
   git add .
   git commit -m "Fix Chart.js dependency conflicts for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

3. **Verify Deployment**:
   - Check that the build completes successfully
   - Test the application functionality
   - Verify Chart.js components work correctly

## 🐛 Troubleshooting

### If you still get dependency errors:
```bash
# Clean everything and reinstall
rm -rf node_modules package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json
npm install --legacy-peer-deps
cd frontend && npm install --legacy-peer-deps && cd ..
```

### If Vercel build fails:
1. Check the build logs for specific errors
2. Ensure all environment variables are set in Vercel
3. Verify the vercel.json configuration is correct

## ✅ Success Indicators

- ✅ No Chart.js version conflicts
- ✅ Frontend builds successfully
- ✅ Charts render correctly in the browser
- ✅ All social media integrations work
- ✅ Analytics data displays properly

---

**The dependency conflicts have been resolved! Your LyraLytics frontend should now deploy successfully to Vercel.** 