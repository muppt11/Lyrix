#!/bin/bash

# Trending Scheduler Setup Script
# ===============================
# This script sets up the backend trending scheduler that collects data
# from Google Trends, YouTube, and TikTok every 3 minutes.

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
    pip install pytrends requests pandas
    
    # Install optional dependencies
    print_status "Installing optional dependencies..."
    pip install matplotlib seaborn beautifulsoup4 selenium numpy scipy loguru schedule
    
    print_success "All dependencies installed successfully"
}

# Function to create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p logs
    mkdir -p data_exports
    mkdir -p backups
    mkdir -p config
    
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
# Trending Scheduler Environment Variables
# =======================================

# YouTube Data API Configuration (optional)
# Get your API key from: https://console.developers.google.com/
YOUTUBE_API_KEY=your_youtube_api_key_here

# Database Configuration
DB_PATH=trending_data.db

# Collection Settings
GOOGLE_TRENDS_LIMIT=10
YOUTUBE_TRENDING_LIMIT=10
TIKTOK_TRENDING_LIMIT=10

# Collection Frequency (in minutes)
COLLECTION_INTERVAL=3

# Data Retention (in days)
DATA_RETENTION_DAYS=30

# Logging Configuration
LOG_LEVEL=INFO
LOG_FILE=logs/scheduler.log

# Export Settings
EXPORT_ENABLED=true
EXPORT_HOURS=24

# Platform Settings
GOOGLE_TRENDS_ENABLED=true
YOUTUBE_TRENDING_ENABLED=true
TIKTOK_TRENDING_ENABLED=true

# Error Handling
MAX_RETRIES=3
RETRY_DELAY=5

# Monitoring
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_INTERVAL=15
EOF

    print_success ".env file created"
    print_warning "Please edit .env file and add your YouTube API key if needed"
}

# Function to test the scheduler
test_scheduler() {
    print_status "Testing the trending scheduler..."
    
    # Run the scheduler once to test
    if python3 trending_scheduler.py; then
        print_success "Scheduler test completed successfully!"
    else
        print_error "Scheduler test failed!"
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
    CRON_COMMAND="*/3 * * * * cd $CURRENT_DIR && $PYTHON_PATH trending_scheduler.py >> $CURRENT_DIR/logs/scheduler.log 2>&1"
    
    print_status "Cron job command:"
    echo "$CRON_COMMAND"
    echo
    
    read -p "Do you want to install this cron job? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Check if cron job already exists
        if crontab -l 2>/dev/null | grep -q "trending_scheduler.py"; then
            print_warning "Cron job already exists!"
            read -p "Do you want to replace it? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                # Remove existing cron job
                crontab -l 2>/dev/null | grep -v "trending_scheduler.py" | crontab -
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
    
    cat > monitor_scheduler.sh << 'EOF'
#!/bin/bash

# Trending Scheduler Monitoring Script
# ====================================
# This script monitors the trending scheduler process

LOG_FILE="logs/scheduler.log"
DB_FILE="trending_data.db"
DATA_DIR="data_exports"

echo "=== Trending Scheduler Monitor ==="
echo "Log file: $LOG_FILE"
echo "Database: $DB_FILE"
echo "Data exports: $DATA_DIR"
echo

# Check if log file exists
if [[ -f "$LOG_FILE" ]]; then
    echo "📊 Recent log entries:"
    tail -10 "$LOG_FILE"
else
    echo "⚠️  Log file not found. The scheduler may not have run yet."
fi

echo

# Check database
if [[ -f "$DB_FILE" ]]; then
    echo "🗄️  Database status:"
    python3 -c "
import sqlite3
try:
    conn = sqlite3.connect('$DB_FILE')
    cursor = conn.cursor()
    
    # Check table counts
    cursor.execute('SELECT COUNT(*) FROM google_trends')
    google_count = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM youtube_trending')
    youtube_count = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM tiktok_trending')
    tiktok_count = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM collection_logs WHERE collection_timestamp > datetime(\"now\", \"-1 hour\")')
    recent_collections = cursor.fetchone()[0]
    
    print(f'   Google Trends records: {google_count}')
    print(f'   YouTube trending records: {youtube_count}')
    print(f'   TikTok trending records: {tiktok_count}')
    print(f'   Collections in last hour: {recent_collections}')
    
    conn.close()
except Exception as e:
    print(f'   Error: {e}')
"
else
    echo "⚠️  Database not found."
fi

echo

# Check data export files
if [[ -d "$DATA_DIR" ]]; then
    echo "📁 Recent data exports:"
    ls -la "$DATA_DIR"/*.json 2>/dev/null | tail -5 || echo "No export files found yet."
else
    echo "⚠️  Data exports directory not found."
fi

echo

# Check cron job status
echo "⏰ Cron job status:"
if crontab -l 2>/dev/null | grep -q "trending_scheduler.py"; then
    echo "✅ Cron job is installed"
    crontab -l | grep "trending_scheduler.py"
else
    echo "❌ Cron job not found"
fi

echo

# Check Python script
if [[ -f "trending_scheduler.py" ]]; then
    echo "✅ Scheduler script found"
else
    echo "❌ Scheduler script not found"
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
EOF

    chmod +x monitor_scheduler.sh
    print_success "Monitoring script created: monitor_scheduler.sh"
}

# Function to create data analysis script
create_analysis_script() {
    print_status "Creating data analysis script..."
    
    cat > analyze_trends.py << 'EOF'
#!/usr/bin/env python3
"""
Trending Data Analysis Script
=============================

This script analyzes the collected trending data and generates insights.
"""

import json
import sqlite3
import pandas as pd
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import seaborn as sns

def analyze_trends(hours_back=24):
    """Analyze trending data from the database."""
    
    # Connect to database
    conn = sqlite3.connect('trending_data.db')
    
    # Get recent data
    since_time = datetime.now() - timedelta(hours=hours_back)
    
    # Google Trends analysis
    google_df = pd.read_sql_query('''
        SELECT * FROM google_trends 
        WHERE collection_timestamp >= ? 
        ORDER BY collection_timestamp DESC
    ''', conn, params=(since_time,))
    
    # YouTube analysis
    youtube_df = pd.read_sql_query('''
        SELECT * FROM youtube_trending 
        WHERE collection_timestamp >= ? 
        ORDER BY collection_timestamp DESC
    ''', conn, params=(since_time,))
    
    # TikTok analysis
    tiktok_df = pd.read_sql_query('''
        SELECT * FROM tiktok_trending 
        WHERE collection_timestamp >= ? 
        ORDER BY collection_timestamp DESC
    ''', conn, params=(since_time,))
    
    conn.close()
    
    # Print summary
    print("=== Trending Data Analysis ===")
    print(f"Time period: Last {hours_back} hours")
    print(f"Google Trends records: {len(google_df)}")
    print(f"YouTube trending records: {len(youtube_df)}")
    print(f"TikTok trending records: {len(tiktok_df)}")
    print()
    
    # Google Trends insights
    if not google_df.empty:
        print("🔍 Google Trends Insights:")
        print(f"   Top categories: {google_df['category'].value_counts().head(3).to_dict()}")
        print(f"   Average viral potential: {google_df['viral_potential'].mean():.2f}")
        print(f"   Top trending terms: {google_df['search_term'].value_counts().head(5).to_dict()}")
        print()
    
    # YouTube insights
    if not youtube_df.empty:
        print("📺 YouTube Insights:")
        print(f"   Top categories: {youtube_df['category'].value_counts().head(3).to_dict()}")
        print(f"   Average views: {youtube_df['view_count'].mean():,.0f}")
        print(f"   Average likes: {youtube_df['like_count'].mean():,.0f}")
        print()
    
    # TikTok insights
    if not tiktok_df.empty:
        print("📱 TikTok Insights:")
        print(f"   Top categories: {tiktok_df['category'].value_counts().head(3).to_dict()}")
        print(f"   Average trend score: {tiktok_df['trend_score'].mean():.2f}")
        print(f"   Top hashtags: {tiktok_df['hashtag'].value_counts().head(5).to_dict()}")
        print()

if __name__ == "__main__":
    analyze_trends(24)  # Analyze last 24 hours
EOF

    chmod +x analyze_trends.py
    print_success "Analysis script created: analyze_trends.py"
}

# Function to display usage information
show_usage() {
    cat > SCHEDULER_USAGE.md << 'EOF'
# Trending Scheduler - Usage Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   pip install pytrends requests pandas
   ```

2. **Run the scheduler:**
   ```bash
   python3 trending_scheduler.py
   ```

3. **Set up cron job (every 3 minutes):**
   ```bash
   crontab -e
   # Add this line:
   */3 * * * * cd /path/to/your/project && /usr/bin/python3 trending_scheduler.py >> /path/to/your/project/logs/scheduler.log 2>&1
   ```

## File Structure

```
project/
├── trending_scheduler.py      # Main scheduler script
├── scheduler_crontab.txt      # Cron job examples
├── setup_scheduler.sh         # Setup script
├── monitor_scheduler.sh       # Monitoring script
├── analyze_trends.py          # Data analysis script
├── .env                       # Environment variables
├── trending_data.db           # SQLite database
├── logs/                      # Log files
├── data_exports/              # Exported data files
└── backups/                   # Database backups
```

## Database Schema

### Google Trends Table
- search_term: Trending search term
- rank: Ranking position
- category: Content category
- viral_potential: Viral potential score (1-10)
- collection_timestamp: When data was collected

### YouTube Trending Table
- video_id: YouTube video ID
- title: Video title
- channel_title: Channel name
- view_count: Number of views
- like_count: Number of likes
- comment_count: Number of comments
- category: Content category
- collection_timestamp: When data was collected

### TikTok Trending Table
- hashtag: Trending hashtag
- view_count: Number of views
- video_count: Number of videos
- trend_score: Trend popularity score
- category: Content category
- collection_timestamp: When data was collected

## Monitoring

Use the monitoring script to check the status:
```bash
./monitor_scheduler.sh
```

## Data Analysis

Analyze collected data:
```bash
python3 analyze_trends.py
```

## Environment Variables

Configure the scheduler in `.env`:
- YOUTUBE_API_KEY: YouTube Data API key
- DB_PATH: Database file path
- COLLECTION_INTERVAL: Collection frequency
- DATA_RETENTION_DAYS: How long to keep data

## Troubleshooting

1. **Installation issues:**
   ```bash
   pip install --upgrade pip
   pip install pytrends requests pandas
   ```

2. **Permission issues:**
   ```bash
   chmod +x trending_scheduler.py
   chmod +x setup_scheduler.sh
   ```

3. **Cron job not running:**
   - Check if cron service is running: `sudo service cron status`
   - Check cron logs: `tail -f /var/log/cron`
   - Verify cron job: `crontab -l`

4. **Database issues:**
   - Check database file: `ls -la trending_data.db`
   - Test database connection: `python3 -c "import sqlite3; sqlite3.connect('trending_data.db')"`

## API Limits

- Google Trends: No official limits, but be respectful
- YouTube API: 10,000 units per day (quota)
- TikTok: No public API (placeholder implementation)

## Customization

- Modify collection limits in `.env`
- Add new platforms by extending the collector classes
- Customize data retention and cleanup schedules
- Add custom analytics and reporting
EOF

    print_success "Usage guide created: SCHEDULER_USAGE.md"
}

# Main setup function
main() {
    echo "=========================================="
    echo "Trending Scheduler Setup"
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
    
    # Test the scheduler
    print_status "Testing the scheduler..."
    test_scheduler
    
    # Setup cron job
    print_status "Setting up cron job..."
    setup_cron_job
    
    # Create monitoring script
    print_status "Creating monitoring script..."
    create_monitoring_script
    
    # Create analysis script
    print_status "Creating analysis script..."
    create_analysis_script
    
    # Create usage guide
    print_status "Creating usage guide..."
    show_usage
    
    echo
    echo "=========================================="
    print_success "Scheduler setup completed successfully!"
    echo "=========================================="
    echo
    echo "Next steps:"
    echo "1. Edit .env file and add your YouTube API key (optional)"
    echo "2. Monitor the scheduler: ./monitor_scheduler.sh"
    echo "3. Analyze data: python3 analyze_trends.py"
    echo "4. Check logs: tail -f logs/scheduler.log"
    echo "5. Read usage guide: cat SCHEDULER_USAGE.md"
    echo
    echo "The scheduler will now run every 3 minutes via cron job."
    echo "You can modify the schedule by editing: crontab -e"
    echo
    echo "Database file: trending_data.db"
    echo "Log file: logs/scheduler.log"
}

# Run main function
main "$@" 