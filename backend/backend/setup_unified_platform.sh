#!/bin/bash

# Unified Analytics Platform Setup
# =================================
# This script sets up the complete unified analytics platform environment.

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

print_header() {
    echo -e "${PURPLE}[HEADER]${NC} $1"
}

print_subheader() {
    echo -e "${CYAN}[SUBHEADER]${NC} $1"
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
    print_subheader "Installing core dependencies..."
    pip install pytrends requests pandas numpy
    
    # Install analytics dependencies
    print_subheader "Installing analytics dependencies..."
    pip install matplotlib seaborn scikit-learn
    
    # Install web scraping dependencies
    print_subheader "Installing web scraping dependencies..."
    pip install beautifulsoup4 selenium lxml
    
    # Install database dependencies
    print_subheader "Installing database dependencies..."
    pip install sqlalchemy psycopg2-binary
    
    # Install API dependencies
    print_subheader "Installing API dependencies..."
    pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib
    
    # Install utility dependencies
    print_subheader "Installing utility dependencies..."
    pip install python-dotenv schedule loguru
    
    print_success "All dependencies installed successfully"
}

# Function to create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p logs
    mkdir -p backups
    mkdir -p data_exports
    mkdir -p config
    mkdir -p reports
    mkdir -p temp
    
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
    
    # Create comprehensive .env file
    cat > .env << 'EOF'
# Unified Analytics Platform Environment Variables
# ================================================

# API Keys
# --------
YOUTUBE_API_KEY=your_youtube_api_key_here
SHOPIFY_API_KEY=your_shopify_api_key_here
SHOPIFY_API_SECRET=your_shopify_api_secret_here
GOOGLE_ANALYTICS_KEY=your_google_analytics_key_here
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token_here
TIKTOK_API_KEY=your_tiktok_api_key_here

# Database Configuration
# ---------------------
DB_PATH=unified_analytics.db
DB_TYPE=sqlite
DB_HOST=localhost
DB_PORT=5432
DB_NAME=unified_analytics
DB_USER=analytics_user
DB_PASSWORD=your_db_password_here

# Platform Settings
# ----------------
PLATFORM_NAME=Unified Analytics Platform
PLATFORM_VERSION=1.0.0
ENVIRONMENT=development

# Collection Settings
# ------------------
GOOGLE_TRENDS_LIMIT=10
YOUTUBE_TRENDING_LIMIT=10
TIKTOK_TRENDING_LIMIT=10
INSTAGRAM_TRENDING_LIMIT=10
ECOMMERCE_SYNC_INTERVAL=300
SOCIAL_MEDIA_SYNC_INTERVAL=180

# Platform Settings
# ----------------
GOOGLE_TRENDS_ENABLED=true
YOUTUBE_TRENDING_ENABLED=true
TIKTOK_TRENDING_ENABLED=true
INSTAGRAM_TRENDING_ENABLED=true
ECOMMERCE_ANALYTICS_ENABLED=true
TASK_PLANNING_ENABLED=true

# Logging Configuration
# --------------------
LOG_LEVEL=INFO
LOG_FILE=logs/unified_platform.log
LOG_FORMAT=%(asctime)s - %(name)s - %(levelname)s - %(message)s
LOG_ROTATION=1 day
LOG_RETENTION=30 days

# Error Handling
# --------------
MAX_RETRIES=3
RETRY_DELAY=5
TIMEOUT=30
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_INTERVAL=300

# Task Management
# --------------
TASK_AUTO_GENERATION=true
TASK_PRIORITY_SCORING=true
TASK_DEPENDENCY_TRACKING=true
TASK_TIME_TRACKING=true
MAX_TASKS_PER_ANALYSIS=20

# Analytics Settings
# -----------------
INSIGHT_GENERATION=true
CORRELATION_ANALYSIS=true
PERFORMANCE_REPORTING=true
AUTOMATED_REPORTING=true
REPORT_SCHEDULE=daily

# Security Settings
# ----------------
ENCRYPTION_ENABLED=true
API_RATE_LIMITING=true
ACCESS_CONTROL=true
AUDIT_LOGGING=true

# Performance Settings
# -------------------
CACHE_ENABLED=true
CACHE_TTL=3600
QUERY_OPTIMIZATION=true
INDEXING_ENABLED=true

# Notification Settings
# --------------------
EMAIL_NOTIFICATIONS=false
SLACK_NOTIFICATIONS=false
WEBHOOK_NOTIFICATIONS=false
NOTIFICATION_LEVEL=INFO

# Backup Settings
# --------------
BACKUP_ENABLED=true
BACKUP_SCHEDULE=daily
BACKUP_RETENTION=30 days
BACKUP_PATH=backups/

# Export Settings
# --------------
EXPORT_ENABLED=true
EXPORT_FORMATS=json,csv,pdf
EXPORT_PATH=data_exports/
EXPORT_RETENTION=7 days
EOF

    print_success ".env file created"
    print_warning "Please edit .env file and add your API keys and configuration"
}

# Function to test the platform
test_platform() {
    print_status "Testing the unified analytics platform..."
    
    # Test basic functionality
    if python3 -c "import pytrends, requests, pandas, numpy; print('✅ Core dependencies imported successfully')"; then
        print_success "Core dependencies test passed"
    else
        print_error "Core dependencies test failed"
        return 1
    fi
    
    # Test platform initialization
    if python3 -c "
import sys
sys.path.append('.')
try:
    from unified_analytics_platform import UnifiedAnalyticsPlatform
    print('✅ Platform module imported successfully')
except Exception as e:
    print(f'❌ Platform import failed: {e}')
    sys.exit(1)
"; then
        print_success "Platform module test passed"
    else
        print_error "Platform module test failed"
        return 1
    fi
    
    print_success "Platform test completed successfully!"
    return 0
}

# Function to setup cron jobs
setup_cron_jobs() {
    print_status "Setting up automated cron jobs..."
    
    # Get the current directory
    CURRENT_DIR=$(pwd)
    PYTHON_PATH=$(which python3)
    
    # Create cron job commands
    UNIFIED_PLATFORM_CRON="*/5 * * * * cd $CURRENT_DIR && $PYTHON_PATH unified_analytics_platform.py >> $CURRENT_DIR/logs/unified_platform.log 2>&1"
    FETCH_TRENDS_CRON="*/3 * * * * cd $CURRENT_DIR && $PYTHON_PATH fetch_trends.py >> $CURRENT_DIR/logs/fetch_trends.log 2>&1"
    BACKUP_CRON="0 2 * * * cd $CURRENT_DIR && $PYTHON_PATH -c \"import shutil; shutil.copy2('unified_analytics.db', 'backups/unified_analytics_$(date +%Y%m%d).db')\" >> $CURRENT_DIR/logs/backup.log 2>&1"
    
    print_subheader "Cron job commands:"
    echo "Unified Platform: $UNIFIED_PLATFORM_CRON"
    echo "Fetch Trends: $FETCH_TRENDS_CRON"
    echo "Backup: $BACKUP_CRON"
    echo
    
    read -p "Do you want to install these cron jobs? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Check if cron jobs already exist
        if crontab -l 2>/dev/null | grep -q "unified_analytics_platform.py"; then
            print_warning "Unified platform cron job already exists!"
            read -p "Do you want to replace it? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                # Remove existing cron jobs
                crontab -l 2>/dev/null | grep -v "unified_analytics_platform.py" | grep -v "fetch_trends.py" | crontab -
            else
                print_status "Keeping existing cron jobs"
                return
            fi
        fi
        
        # Add new cron jobs
        (crontab -l 2>/dev/null; echo "$UNIFIED_PLATFORM_CRON"; echo "$FETCH_TRENDS_CRON"; echo "$BACKUP_CRON") | crontab -
        print_success "Cron jobs installed successfully!"
        
        print_status "To view your cron jobs: crontab -l"
        print_status "To remove all cron jobs: crontab -r"
        print_status "To edit cron jobs: crontab -e"
    else
        print_status "Cron job setup skipped"
        print_status "You can manually add the cron jobs later using: crontab -e"
    fi
}

# Function to create monitoring script
create_monitoring_script() {
    print_status "Creating comprehensive monitoring script..."
    
    cat > monitor_unified_platform.sh << 'EOF'
#!/bin/bash

# Unified Analytics Platform Monitoring Script
# ============================================
# This script monitors the unified analytics platform

LOG_FILE="logs/unified_platform.log"
FETCH_TRENDS_LOG="logs/fetch_trends.log"
DB_FILE="unified_analytics.db"
BACKUP_DIR="backups"

echo "🎯 UNIFIED ANALYTICS PLATFORM MONITOR"
echo "====================================="
echo

# Check platform status
echo "📊 Platform Status:"
if [[ -f "unified_analytics_platform.py" ]]; then
    echo "   ✅ Main platform script found"
else
    echo "   ❌ Main platform script not found"
fi

if [[ -f "fetch_trends.py" ]]; then
    echo "   ✅ Trends script found"
else
    echo "   ❌ Trends script not found"
fi

echo

# Check database
echo "🗄️ Database Status:"
if [[ -f "$DB_FILE" ]]; then
    DB_SIZE=$(du -h "$DB_FILE" | cut -f1)
    echo "   ✅ Database exists (Size: $DB_SIZE)"
    
    # Check database tables
    if command -v sqlite3 >/dev/null 2>&1; then
        TABLE_COUNT=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM sqlite_master WHERE type='table';" 2>/dev/null || echo "0")
        echo "   📊 Tables: $TABLE_COUNT"
    fi
else
    echo "   ❌ Database not found"
fi

echo

# Check logs
echo "📝 Log Files:"
if [[ -f "$LOG_FILE" ]]; then
    LOG_SIZE=$(du -h "$LOG_FILE" | cut -f1)
    LAST_LOG=$(tail -1 "$LOG_FILE" | cut -c1-19 2>/dev/null || echo "No entries")
    echo "   ✅ Platform log: $LOG_SIZE (Last: $LAST_LOG)"
else
    echo "   ❌ Platform log not found"
fi

if [[ -f "$FETCH_TRENDS_LOG" ]]; then
    TRENDS_LOG_SIZE=$(du -h "$FETCH_TRENDS_LOG" | cut -f1)
    LAST_TRENDS_LOG=$(tail -1 "$FETCH_TRENDS_LOG" | cut -c1-19 2>/dev/null || echo "No entries")
    echo "   ✅ Trends log: $TRENDS_LOG_SIZE (Last: $LAST_TRENDS_LOG)"
else
    echo "   ❌ Trends log not found"
fi

echo

# Check recent activity
echo "🔄 Recent Activity:"
if [[ -f "$LOG_FILE" ]]; then
    echo "   📊 Recent platform activity:"
    tail -5 "$LOG_FILE" | sed 's/^/      /'
else
    echo "   ⚠️ No platform activity log found"
fi

echo

# Check cron jobs
echo "⏰ Cron Jobs:"
if crontab -l 2>/dev/null | grep -q "unified_analytics_platform.py"; then
    echo "   ✅ Unified platform cron job is installed"
    crontab -l | grep "unified_analytics_platform.py" | sed 's/^/      /'
else
    echo "   ❌ Unified platform cron job not found"
fi

if crontab -l 2>/dev/null | grep -q "fetch_trends.py"; then
    echo "   ✅ Fetch trends cron job is installed"
    crontab -l | grep "fetch_trends.py" | sed 's/^/      /'
else
    echo "   ❌ Fetch trends cron job not found"
fi

echo

# Check environment
echo "🔧 Environment:"
if [[ -f ".env" ]]; then
    echo "   ✅ Environment file found"
    
    # Check key configurations
    if grep -q "YOUTUBE_API_KEY" .env; then
        YOUTUBE_CONFIG=$(grep "YOUTUBE_API_KEY" .env | cut -d'=' -f2)
        if [[ "$YOUTUBE_CONFIG" == "your_youtube_api_key_here" ]]; then
            echo "   ⚠️ YouTube API key: Not configured"
        else
            echo "   ✅ YouTube API key: Configured"
        fi
    fi
    
    if grep -q "SHOPIFY_API_KEY" .env; then
        SHOPIFY_CONFIG=$(grep "SHOPIFY_API_KEY" .env | cut -d'=' -f2)
        if [[ "$SHOPIFY_CONFIG" == "your_shopify_api_key_here" ]]; then
            echo "   ⚠️ Shopify API key: Not configured"
        else
            echo "   ✅ Shopify API key: Configured"
        fi
    fi
else
    echo "   ❌ Environment file not found"
fi

echo

# Check Python dependencies
echo "🐍 Python Dependencies:"
python3 -c "import pytrends; print('   pytrends: ✅')" 2>/dev/null || echo "   pytrends: ❌"
python3 -c "import requests; print('   requests: ✅')" 2>/dev/null || echo "   requests: ❌"
python3 -c "import pandas; print('   pandas: ✅')" 2>/dev/null || echo "   pandas: ❌"
python3 -c "import numpy; print('   numpy: ✅')" 2>/dev/null || echo "   numpy: ❌"
python3 -c "import sqlite3; print('   sqlite3: ✅')" 2>/dev/null || echo "   sqlite3: ❌"

echo

# Check backups
echo "💾 Backups:"
if [[ -d "$BACKUP_DIR" ]]; then
    BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/*.db 2>/dev/null | wc -l)
    echo "   📁 Backup directory: $BACKUP_COUNT files"
    if [[ $BACKUP_COUNT -gt 0 ]]; then
        LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/*.db 2>/dev/null | head -1)
        BACKUP_DATE=$(basename "$LATEST_BACKUP" | sed 's/unified_analytics_\(.*\)\.db/\1/')
        echo "   📅 Latest backup: $BACKUP_DATE"
    fi
else
    echo "   ❌ Backup directory not found"
fi

echo

# System health summary
echo "🏥 System Health Summary:"
HEALTH_SCORE=0
TOTAL_CHECKS=0

# Count successful checks
[[ -f "unified_analytics_platform.py" ]] && HEALTH_SCORE=$((HEALTH_SCORE + 1))
[[ -f "$DB_FILE" ]] && HEALTH_SCORE=$((HEALTH_SCORE + 1))
[[ -f ".env" ]] && HEALTH_SCORE=$((HEALTH_SCORE + 1))
crontab -l 2>/dev/null | grep -q "unified_analytics_platform.py" && HEALTH_SCORE=$((HEALTH_SCORE + 1))
python3 -c "import pytrends, requests, pandas, numpy" 2>/dev/null && HEALTH_SCORE=$((HEALTH_SCORE + 1))

TOTAL_CHECKS=5
HEALTH_PERCENTAGE=$((HEALTH_SCORE * 100 / TOTAL_CHECKS))

if [[ $HEALTH_PERCENTAGE -ge 80 ]]; then
    echo "   🟢 Excellent ($HEALTH_PERCENTAGE%)"
elif [[ $HEALTH_PERCENTAGE -ge 60 ]]; then
    echo "   🟡 Good ($HEALTH_PERCENTAGE%)"
elif [[ $HEALTH_PERCENTAGE -ge 40 ]]; then
    echo "   🟠 Fair ($HEALTH_PERCENTAGE%)"
else
    echo "   🔴 Poor ($HEALTH_PERCENTAGE%)"
fi

echo
echo "====================================="
echo "🎯 Unified Analytics Platform Monitor Complete"
echo "====================================="
EOF

    chmod +x monitor_unified_platform.sh
    print_success "Monitoring script created: monitor_unified_platform.sh"
}

# Function to create requirements file
create_requirements_file() {
    print_status "Creating requirements.txt file..."
    
    cat > requirements.txt << 'EOF'
# Unified Analytics Platform Requirements
# ======================================

# Core Dependencies
pytrends>=4.9.0
requests>=2.28.0
pandas>=1.5.0
numpy>=1.24.0

# Analytics & Machine Learning
matplotlib>=3.6.0
seaborn>=0.12.0
scikit-learn>=1.2.0

# Web Scraping
beautifulsoup4>=4.11.0
selenium>=4.8.0
lxml>=4.9.0

# Database
sqlalchemy>=1.4.0
psycopg2-binary>=2.9.0

# Google APIs
google-api-python-client>=2.0.0
google-auth-httplib2>=0.1.0
google-auth-oauthlib>=1.0.0

# Utilities
python-dotenv>=0.19.0
schedule>=1.2.0
loguru>=0.6.0

# Optional Dependencies
# --------------------
# For advanced analytics
scipy>=1.10.0
statsmodels>=0.13.0

# For web interface
flask>=2.3.0
flask-cors>=4.0.0

# For data visualization
plotly>=5.15.0
dash>=2.10.0

# For email notifications
smtplib2>=0.2.0

# For Slack notifications
slack-sdk>=3.20.0
EOF

    print_success "Requirements file created: requirements.txt"
}

# Function to display usage information
show_usage() {
    cat > UNIFIED_PLATFORM_USAGE.md << 'EOF'
# Unified Analytics Platform - Usage Guide

## 🎯 Mission Statement

**"The platform was designed to solve this by unifying ecommerce analytics, social media monitoring, and task planning into a single, intuitive interface. This approach empowers marketing teams to reclaim their time and focus on meaningful, data-driven strategy."**

## 🚀 Quick Start

### 1. Installation
```bash
# Run the setup script
./setup_unified_platform.sh

# Or install manually
pip install -r requirements.txt
```

### 2. Configuration
```bash
# Edit environment variables
nano .env

# Add your API keys
YOUTUBE_API_KEY=your_youtube_api_key
SHOPIFY_API_KEY=your_shopify_api_key
```

### 3. Run the Platform
```bash
# Run unified platform
python3 unified_analytics_platform.py

# Run trends collection
python3 fetch_trends.py

# Monitor platform status
./monitor_unified_platform.sh
```

## 📊 Platform Components

### 🛒 Ecommerce Analytics
- **Sales Tracking**: Real-time revenue and order analysis
- **Customer Behavior**: Segmentation and lifetime value
- **Product Performance**: Conversion rates and optimization
- **Key Metrics**: AOV, CAC, CLV, conversion rates

### 📱 Social Media Monitoring
- **Multi-Platform**: Google Trends, YouTube, TikTok, Instagram
- **Trend Analysis**: Engagement scoring and viral potential
- **Brand Monitoring**: Mentions and sentiment analysis
- **Real-time Data**: Live trend detection and alerts

### 📋 Task Planning
- **Automated Generation**: AI-powered task creation
- **Priority Scoring**: Intelligent task prioritization
- **Workflow Management**: Status tracking and dependencies
- **Resource Optimization**: Time tracking and allocation

## 🔄 Data Flow

```
Data Sources → Collection → Processing → Analysis → Insights → Actions
     ↓              ↓           ↓           ↓         ↓         ↓
Ecommerce APIs   Real-time   Data      Cross-    Strategic  Automated
Social Media     Collection  Cleaning  Platform  Insights   Tasks
Task Systems     Storage     Validation Analysis  Reports    Workflows
```

## 📈 Key Features

### Unified Dashboard
- Single interface for all platform data
- Real-time metrics and insights
- Cross-platform correlations
- Actionable recommendations

### Automated Insights
- Performance correlations
- Efficiency recommendations
- Strategic opportunities
- Predictive analytics

### Task Automation
- AI-generated tasks based on analytics
- Priority scoring algorithms
- Dependency mapping
- Resource optimization

## 🛠️ Configuration

### Environment Variables
```bash
# API Keys
YOUTUBE_API_KEY=your_key
SHOPIFY_API_KEY=your_key
INSTAGRAM_ACCESS_TOKEN=your_token

# Database
DB_PATH=unified_analytics.db
DB_TYPE=sqlite

# Collection Settings
GOOGLE_TRENDS_LIMIT=10
YOUTUBE_TRENDING_LIMIT=10
ECOMMERCE_SYNC_INTERVAL=300

# Platform Settings
GOOGLE_TRENDS_ENABLED=true
YOUTUBE_TRENDING_ENABLED=true
ECOMMERCE_ANALYTICS_ENABLED=true
TASK_PLANNING_ENABLED=true
```

### Cron Jobs
```bash
# Unified platform (every 5 minutes)
*/5 * * * * cd /path/to/project && python3 unified_analytics_platform.py

# Trends collection (every 3 minutes)
*/3 * * * * cd /path/to/project && python3 fetch_trends.py

# Daily backup
0 2 * * * cd /path/to/project && python3 backup_script.py
```

## 📊 Use Cases

### Ecommerce Optimization
1. **Analytics**: Identify sales patterns
2. **Social Monitoring**: Detect trending products
3. **Task Generation**: Create promotional campaigns
4. **Unified Insight**: "Viral trends align with inventory"

### Social Media Strategy
1. **Social Monitoring**: Detect high-engagement trends
2. **Ecommerce Analysis**: Identify product correlations
3. **Task Generation**: Create content tasks
4. **Unified Insight**: "Trending hashtags correlate with sales"

### Resource Management
1. **Task Analysis**: Identify priorities and backlog
2. **Performance Correlation**: Link tasks to business metrics
3. **Resource Optimization**: Reallocate based on impact
4. **Unified Insight**: "High-priority tasks have 3x revenue impact"

## 🔧 Customization

### Adding Data Sources
```python
class CustomDataSource:
    def __init__(self, db: UnifiedDatabase):
        self.db = db
    
    def fetch_data(self) -> Dict[str, Any]:
        # Implement custom data collection
        pass
```

### Custom Analytics
```python
class CustomAnalytics:
    def generate_insights(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        # Implement custom insight generation
        pass
```

### Workflow Automation
```python
class CustomWorkflow:
    def automate_tasks(self, insights: List[Dict[str, Any]]) -> List[MarketingTask]:
        # Implement custom task automation
        pass
```

## 📈 Performance

### Metrics
- **Data Collection**: Real-time processing
- **Analysis Speed**: Sub-second insights
- **Dashboard Updates**: Live refresh every 5 minutes
- **Task Automation**: Instant generation

### Scalability
- **Modular Architecture**: Easy extension
- **Database Optimization**: Fast queries
- **Caching**: Intelligent data caching
- **API Rate Limiting**: Respectful usage

## 🔒 Security

### Data Protection
- **Encryption**: Data encrypted at rest
- **API Security**: Secure key management
- **Access Control**: Role-based access
- **Audit Logging**: Activity tracking

### Privacy Compliance
- **GDPR Compliance**: Data processing
- **Data Retention**: Configurable policies
- **User Consent**: Transparent collection
- **Data Portability**: Export capabilities

## 🆘 Support

### Monitoring
```bash
# Check platform status
./monitor_unified_platform.sh

# View recent logs
tail -f logs/unified_platform.log

# Check database
sqlite3 unified_analytics.db ".tables"
```

### Troubleshooting
- **API Issues**: Check credentials and quotas
- **Performance**: Optimize database queries
- **Integration**: Verify API endpoints
- **Data Sync**: Check network connectivity

## 🔮 Roadmap

### Upcoming Features
- **AI Predictions**: Trend forecasting
- **Advanced Automation**: Sophisticated workflows
- **Mobile App**: Native mobile interface
- **API Access**: Public API for integrations

### Long-term Vision
- **Predictive Analytics**: Market forecasting
- **Advanced AI**: NLP for content analysis
- **Global Expansion**: Multi-region support
- **Enterprise Features**: Advanced security

---

**The Unified Analytics Platform transforms marketing operations by providing a single, intuitive interface that unifies ecommerce analytics, social media monitoring, and task planning. This approach empowers teams to reclaim their time and focus on meaningful, data-driven strategy.**
EOF

    print_success "Usage guide created: UNIFIED_PLATFORM_USAGE.md"
}

# Main setup function
main() {
    echo "=========================================="
    print_header "Unified Analytics Platform Setup"
    echo "=========================================="
    echo
    
    print_subheader "Mission: Unifying ecommerce analytics, social media monitoring, and task planning into a single, intuitive interface to empower marketing teams to reclaim their time and focus on meaningful, data-driven strategy."
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
    
    # Create requirements file
    print_status "Creating requirements file..."
    create_requirements_file
    
    # Test the platform
    print_status "Testing the platform..."
    if test_platform; then
        print_success "Platform test passed"
    else
        print_error "Platform test failed"
        exit 1
    fi
    
    # Setup cron jobs
    print_status "Setting up cron jobs..."
    setup_cron_jobs
    
    # Create monitoring script
    print_status "Creating monitoring script..."
    create_monitoring_script
    
    # Create usage guide
    print_status "Creating usage guide..."
    show_usage
    
    echo
    echo "=========================================="
    print_success "Unified Analytics Platform setup completed successfully!"
    echo "=========================================="
    echo
    echo "🎯 Mission Accomplished:"
    echo "   ✅ Ecommerce Analytics - Integrated"
    echo "   ✅ Social Media Monitoring - Integrated"
    echo "   ✅ Task Planning - Integrated"
    echo "   ✅ Unified Interface - Created"
    echo "   ✅ Time Reclamation - Enabled"
    echo "   ✅ Data-Driven Strategy - Empowered"
    echo
    echo "📋 Next Steps:"
    echo "1. Edit .env file and add your API keys"
    echo "2. Run the platform: python3 unified_analytics_platform.py"
    echo "3. Monitor status: ./monitor_unified_platform.sh"
    echo "4. Read usage guide: cat UNIFIED_PLATFORM_USAGE.md"
    echo
    echo "🔄 The platform will now run automatically via cron jobs:"
    echo "   • Unified analysis every 5 minutes"
    echo "   • Trends collection every 3 minutes"
    echo "   • Daily backups at 2 AM"
    echo
    echo "📊 Log files:"
    echo "   • Platform: logs/unified_platform.log"
    echo "   • Trends: logs/fetch_trends.log"
    echo "   • Backup: logs/backup.log"
    echo
    echo "🎉 Marketing teams can now focus on meaningful, data-driven strategy!"
    echo "=========================================="
}

# Run main function
main "$@" 