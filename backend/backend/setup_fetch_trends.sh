#!/bin/bash

# Fetch Trends Script Setup
# =========================
# This script sets up the environment for the fetch_trends.py script.

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get Python version
get_python_version() {
    python3 --version 2>/dev/null | cut -d' ' -f2 || echo "not found"
}

# Function to check Python version
check_python_version() {
    local version=$(get_python_version)
    if [[ "$version" == "not found" ]]; then
        print_error "Python 3 is not installed!"
        print_status "Please install Python 3.6 or higher and try again."
        exit 1
    fi
    
    # Extract major and minor version numbers
    local major=$(echo $version | cut -d'.' -f1)
    local minor=$(echo $version | cut -d'.' -f2)
    
    if [[ $major -lt 3 ]] || [[ $major -eq 3 && $minor -lt 6 ]]; then
        print_error "Python version $version is too old!"
        print_status "Please install Python 3.6 or higher and try again."
        exit 1
    fi
    
    print_success "Python $version is compatible"
}

# Function to create virtual environment
create_virtual_env() {
    if [[ -d "venv" ]]; then
        print_warning "Virtual environment 'venv' already exists"
        read -p "Do you want to recreate it? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Removing existing virtual environment..."
            rm -rf venv
        else
            print_status "Using existing virtual environment"
            return
        fi
    fi
    
    print_status "Creating virtual environment..."
    python3 -m venv venv
    print_success "Virtual environment created"
}

# Function to activate virtual environment
activate_virtual_env() {
    print_status "Activating virtual environment..."
    source venv/bin/activate
    print_success "Virtual environment activated"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing Python dependencies..."
    
    # Upgrade pip first
    pip install --upgrade pip
    
    # Install core dependencies
    pip install pytrends requests
    
    # Install optional dependencies
    print_status "Installing optional dependencies..."
    pip install pandas matplotlib seaborn
    
    print_success "All dependencies installed successfully"
}

# Function to create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p logs
    mkdir -p backups
    
    print_success "Directories created"
}

# Function to setup environment variables
setup_environment() {
    print_status "Setting up environment variables..."
    
    # Check if .env file exists
    if [[ -f ".env" ]]; then
        print_warning ".env file already exists"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Overwriting .env file..."
        else
            print_status "Keeping existing .env file"
            return
        fi
    fi
    
    # Create .env file
    cat > .env << 'EOF'
# Fetch Trends Script Environment Variables
# ========================================

# YouTube Data API Configuration (optional but recommended)
# Get your API key from: https://console.developers.google.com/
YOUTUBE_API_KEY=your_youtube_api_key_here

# TikTok API Configuration (if available)
TIKTOK_API_KEY=your_tiktok_api_key_here

# Logging Configuration
LOG_LEVEL=INFO
LOG_FILE=logs/fetch_trends.log

# Collection Settings
GOOGLE_TRENDS_LIMIT=10
YOUTUBE_TRENDING_LIMIT=10
TIKTOK_TRENDING_LIMIT=10

# Platform Settings
GOOGLE_TRENDS_ENABLED=true
YOUTUBE_TRENDING_ENABLED=true
TIKTOK_TRENDING_ENABLED=true

# Error Handling
MAX_RETRIES=3
RETRY_DELAY=5
EOF

    print_success ".env file created"
    print_warning "Please edit .env file and add your API keys if needed"
}

# Function to test the script
test_script() {
    print_status "Testing the fetch_trends.py script..."
    
    # Run the script once to test
    if python3 fetch_trends.py; then
        print_success "Script test completed successfully!"
    else
        print_error "Script test failed!"
        print_status "Please check the error messages above and try again."
        exit 1
    fi
}

# Function to setup cron job
setup_cron_job() {
    print_status "Setting up cron job..."
    
    # Get the current directory
    CURRENT_DIR=$(pwd)
    PYTHON_PATH=$(which python3)
    
    # Create the cron job command
    CRON_COMMAND="*/3 * * * * cd $CURRENT_DIR && $PYTHON_PATH fetch_trends.py >> $CURRENT_DIR/logs/fetch_trends.log 2>&1"
    
    print_status "Cron job command:"
    echo "$CRON_COMMAND"
    echo
    
    read -p "Do you want to install this cron job? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Check if cron job already exists
        if crontab -l 2>/dev/null | grep -q "fetch_trends.py"; then
            print_warning "Cron job already exists!"
            read -p "Do you want to replace it? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                # Remove existing cron job
                crontab -l 2>/dev/null | grep -v "fetch_trends.py" | crontab -
            else
                print_status "Keeping existing cron job"
                return
            fi
        fi
        
        # Add new cron job
        (crontab -l 2>/dev/null; echo "$CRON_COMMAND") | crontab -
        print_success "Cron job installed successfully!"
        
        print_status "To view your cron jobs: crontab -l"
        print_status "To remove all cron jobs: crontab -r"
        print_status "To edit cron jobs: crontab -e"
    else
        print_status "Cron job setup skipped"
        print_status "You can manually add the cron job later using: crontab -e"
    fi
}

# Function to create monitoring script
create_monitoring_script() {
    print_status "Creating monitoring script..."
    
    cat > monitor_fetch_trends.sh << 'EOF'
#!/bin/bash

# Fetch Trends Monitoring Script
# ==============================
# This script monitors the fetch_trends.py process

LOG_FILE="logs/fetch_trends.log"

echo "=== Fetch Trends Monitor ==="
echo "Log file: $LOG_FILE"
echo

# Check if log file exists
if [[ -f "$LOG_FILE" ]]; then
    echo "📊 Recent log entries:"
    tail -10 "$LOG_FILE"
else
    echo "⚠️  Log file not found. The script may not have run yet."
fi

echo

# Check script file
if [[ -f "fetch_trends.py" ]]; then
    echo "✅ Script file found"
else
    echo "❌ Script file not found"
fi

echo

# Check cron job status
echo "⏰ Cron job status:"
if crontab -l 2>/dev/null | grep -q "fetch_trends.py"; then
    echo "✅ Cron job is installed"
    crontab -l | grep "fetch_trends.py"
else
    echo "❌ Cron job not found"
fi

echo

# Check environment variables
if [[ -f ".env" ]]; then
    echo "✅ Environment file found"
    if grep -q "YOUTUBE_API_KEY" .env; then
        echo "   YouTube API key: Configured"
    else
        echo "   YouTube API key: Not configured"
    fi
else
    echo "⚠️  Environment file not found"
fi

echo

# Check Python dependencies
echo "🐍 Python dependencies:"
python3 -c "import pytrends; print('   pytrends: ✅')" 2>/dev/null || echo "   pytrends: ❌"
python3 -c "import requests; print('   requests: ✅')" 2>/dev/null || echo "   requests: ❌"
EOF

    chmod +x monitor_fetch_trends.sh
    print_success "Monitoring script created: monitor_fetch_trends.sh"
}

# Function to display usage information
show_usage() {
    cat > FETCH_TRENDS_USAGE.md << 'EOF'
# Fetch Trends Script - Usage Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   pip install pytrends requests
   ```

2. **Run the script:**
   ```bash
   python3 fetch_trends.py
   ```

3. **Set up cron job (every 3 minutes):**
   ```bash
   crontab -e
   # Add this line:
   */3 * * * * cd /path/to/your/project && /usr/bin/python3 fetch_trends.py >> /path/to/your/project/logs/fetch_trends.log 2>&1
   ```

## File Structure

```
project/
├── fetch_trends.py           # Main script
├── fetch_trends_crontab.txt  # Cron job examples
├── setup_fetch_trends.sh     # Setup script
├── monitor_fetch_trends.sh   # Monitoring script
├── .env                      # Environment variables
├── logs/                     # Log files
└── backups/                  # Backup files
```

## Features

### Google Trends
- Fetches top 10 trending searches in the US
- Automatic categorization (Entertainment, Sports, Technology, etc.)
- Viral potential scoring (1-10)
- Detailed metadata and timestamps

### YouTube Trending
- Fetches top 10 most popular videos in the US
- Video metadata (title, channel, views, likes, comments)
- Content categorization
- Requires YouTube Data API key

### TikTok Trending
- Placeholder implementation with mock data
- Extensible for real scraping implementation
- Trending hashtags with view counts and scores

## Environment Variables

Configure the script in `.env`:
- YOUTUBE_API_KEY: YouTube Data API key
- TIKTOK_API_KEY: TikTok API key (if available)
- LOG_LEVEL: Logging level (INFO, DEBUG, etc.)

## Monitoring

Use the monitoring script to check the status:
```bash
./monitor_fetch_trends.sh
```

## Troubleshooting

1. **Installation issues:**
   ```bash
   pip install --upgrade pip
   pip install pytrends requests
   ```

2. **Permission issues:**
   ```bash
   chmod +x fetch_trends.py
   chmod +x setup_fetch_trends.sh
   ```

3. **Cron job not running:**
   - Check if cron service is running: `sudo service cron status`
   - Check cron logs: `tail -f /var/log/cron`
   - Verify cron job: `crontab -l`

4. **API key issues:**
   - Ensure environment variables are set correctly
   - Check API key validity and quotas
   - Verify API key permissions

## API Limits

- Google Trends: No official limits, but be respectful
- YouTube API: 10,000 units per day (quota)
- TikTok: No public API (placeholder implementation)

## Customization

- Modify collection limits in the script
- Add new platforms by extending the fetcher classes
- Customize categorization and scoring algorithms
- Add custom analytics and reporting
EOF

    print_success "Usage guide created: FETCH_TRENDS_USAGE.md"
}

# Main setup function
main() {
    echo "=========================================="
    echo "Fetch Trends Script Setup"
    echo "=========================================="
    echo
    
    # Check Python installation
    print_status "Checking Python installation..."
    check_python_version
    
    # Create virtual environment
    print_status "Setting up virtual environment..."
    create_virtual_env
    
    # Activate virtual environment
    activate_virtual_env
    
    # Install dependencies
    print_status "Installing dependencies..."
    install_dependencies
    
    # Create directories
    print_status "Creating directories..."
    create_directories
    
    # Setup environment variables
    print_status "Setting up environment variables..."
    setup_environment
    
    # Test the script
    print_status "Testing the script..."
    test_script
    
    # Setup cron job
    print_status "Setting up cron job..."
    setup_cron_job
    
    # Create monitoring script
    print_status "Creating monitoring script..."
    create_monitoring_script
    
    # Create usage guide
    print_status "Creating usage guide..."
    show_usage
    
    echo
    echo "=========================================="
    print_success "Setup completed successfully!"
    echo "=========================================="
    echo
    echo "Next steps:"
    echo "1. Edit .env file and add your API keys if needed"
    echo "2. Monitor the script: ./monitor_fetch_trends.sh"
    echo "3. Check logs: tail -f logs/fetch_trends.log"
    echo "4. Read usage guide: cat FETCH_TRENDS_USAGE.md"
    echo
    echo "The script will now run every 3 minutes via cron job."
    echo "You can modify the schedule by editing: crontab -e"
    echo
    echo "Log file: logs/fetch_trends.log"
}

# Run main function
main "$@" 