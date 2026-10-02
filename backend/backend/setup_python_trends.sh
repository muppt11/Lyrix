#!/bin/bash

# Google Trends Python Setup Script
# =================================
# This script sets up the Python environment and dependencies
# for the Google Trends data collector.

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
    pip install pytrends pandas requests
    
    # Install optional dependencies
    print_status "Installing optional dependencies..."
    pip install matplotlib seaborn beautifulsoup4 selenium numpy scipy loguru schedule
    
    print_success "All dependencies installed successfully"
}

# Function to create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p trends_data
    mkdir -p logs
    mkdir -p data_analysis
    
    print_success "Directories created"
}

# Function to test the script
test_script() {
    print_status "Testing the Google Trends script..."
    
    # Run the script once to test
    if python3 google_trends_python.py; then
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
    CRON_COMMAND="*/3 * * * * cd $CURRENT_DIR && $PYTHON_PATH google_trends_python.py >> $CURRENT_DIR/logs/google_trends.log 2>&1"
    
    print_status "Cron job command:"
    echo "$CRON_COMMAND"
    echo
    
    read -p "Do you want to install this cron job? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Check if cron job already exists
        if crontab -l 2>/dev/null | grep -q "google_trends_python.py"; then
            print_warning "Cron job already exists!"
            read -p "Do you want to replace it? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                # Remove existing cron job
                crontab -l 2>/dev/null | grep -v "google_trends_python.py" | crontab -
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

# Function to create a simple monitoring script
create_monitoring_script() {
    print_status "Creating monitoring script..."
    
    cat > monitor_trends.sh << 'EOF'
#!/bin/bash

# Google Trends Monitoring Script
# ===============================
# This script monitors the Google Trends collection process

LOG_FILE="logs/google_trends.log"
DATA_DIR="trends_data"

echo "=== Google Trends Collection Monitor ==="
echo "Log file: $LOG_FILE"
echo "Data directory: $DATA_DIR"
echo

# Check if log file exists
if [[ -f "$LOG_FILE" ]]; then
    echo "📊 Recent log entries:"
    tail -10 "$LOG_FILE"
else
    echo "⚠️  Log file not found. The script may not have run yet."
fi

echo

# Check data files
if [[ -d "$DATA_DIR" ]]; then
    echo "📁 Recent data files:"
    ls -la "$DATA_DIR"/*.json 2>/dev/null | tail -5 || echo "No data files found yet."
else
    echo "⚠️  Data directory not found."
fi

echo

# Check cron job status
echo "⏰ Cron job status:"
if crontab -l 2>/dev/null | grep -q "google_trends_python.py"; then
    echo "✅ Cron job is installed"
    crontab -l | grep "google_trends_python.py"
else
    echo "❌ Cron job not found"
fi

echo

# Check Python script
if [[ -f "google_trends_python.py" ]]; then
    echo "✅ Python script found"
else
    echo "❌ Python script not found"
fi
EOF

    chmod +x monitor_trends.sh
    print_success "Monitoring script created: monitor_trends.sh"
}

# Function to display usage information
show_usage() {
    cat > USAGE.md << 'EOF'
# Google Trends Python Collector - Usage Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   pip install pytrends pandas requests
   ```

2. **Run the script:**
   ```bash
   python3 google_trends_python.py
   ```

3. **Set up cron job (every 3 minutes):**
   ```bash
   crontab -e
   # Add this line:
   */3 * * * * cd /path/to/your/project && /usr/bin/python3 google_trends_python.py >> /path/to/your/project/logs/google_trends.log 2>&1
   ```

## File Structure

```
project/
├── google_trends_python.py    # Main script
├── requirements.txt           # Python dependencies
├── crontab_config.txt        # Cron job examples
├── setup_python_trends.sh    # Setup script
├── monitor_trends.sh         # Monitoring script
├── trends_data/              # Generated data files
├── logs/                     # Log files
└── data_analysis/            # Analysis scripts
```

## Data Output

The script generates JSON files in the `trends_data/` directory with the format:
- `google_trends_YYYYMMDD_HHMMSS.json`

Each file contains:
- Collection timestamp
- Top 10 trending searches
- Categories and viral potential scores
- Metadata

## Monitoring

Use the monitoring script to check the status:
```bash
./monitor_trends.sh
```

## Troubleshooting

1. **Installation issues:**
   ```bash
   pip install --upgrade pip
   pip install pytrends
   ```

2. **Permission issues:**
   ```bash
   chmod +x google_trends_python.py
   chmod +x setup_python_trends.sh
   ```

3. **Cron job not running:**
   - Check if cron service is running: `sudo service cron status`
   - Check cron logs: `tail -f /var/log/cron`
   - Verify cron job: `crontab -l`

## API Limits

- Google Trends has rate limits
- The script includes error handling for API failures
- Consider adjusting the collection frequency if needed

## Customization

- Modify `fetch_trending_searches()` to change the number of trends
- Adjust `categorize_trend()` to add new categories
- Update `calculate_viral_potential()` to change scoring algorithm
EOF

    print_success "Usage guide created: USAGE.md"
}

# Main setup function
main() {
    echo "=========================================="
    echo "Google Trends Python Collector Setup"
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
    echo "1. Monitor the collection: ./monitor_trends.sh"
    echo "2. View collected data: ls trends_data/"
    echo "3. Check logs: tail -f logs/google_trends.log"
    echo "4. Read usage guide: cat USAGE.md"
    echo
    echo "The script will now run every 3 minutes via cron job."
    echo "You can modify the schedule by editing: crontab -e"
}

# Run main function
main "$@" 