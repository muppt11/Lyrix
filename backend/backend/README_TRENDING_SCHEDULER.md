# Backend Trending Data Scheduler

A comprehensive Python backend scheduler that automatically collects trending data from multiple platforms every 3 minutes and stores it in a database for analysis.

## 🚀 Features

- **Multi-Platform Data Collection**: Google Trends, YouTube API, TikTok trending hashtags
- **Automated Scheduling**: Runs every 3 minutes via cron job
- **Database Storage**: SQLite database with structured schema
- **Real-time Analytics**: Categorization, viral potential scoring, trend analysis
- **Error Handling**: Robust error handling and logging
- **Data Export**: JSON exports for external analysis
- **Monitoring Tools**: Built-in monitoring and health checks
- **Data Cleanup**: Automatic cleanup of old data

## 📋 Requirements

- Python 3.6 or higher
- `pytrends` library for Google Trends
- `requests` library for API calls
- `pandas` for data analysis
- YouTube Data API key (optional)
- Internet connection for data collection

## 🛠️ Installation

### Quick Setup (Recommended)

Run the automated setup script:

```bash
./setup_scheduler.sh
```

This script will:
- Check Python version compatibility
- Create a virtual environment
- Install all dependencies
- Set up environment variables
- Test the scheduler
- Configure cron job scheduling
- Create monitoring and analysis tools

### Manual Installation

1. **Install Python dependencies:**
   ```bash
   pip install pytrends requests pandas matplotlib seaborn
   ```

2. **Make scripts executable:**
   ```bash
   chmod +x trending_scheduler.py
   chmod +x setup_scheduler.sh
   ```

3. **Create necessary directories:**
   ```bash
   mkdir -p logs data_exports backups config
   ```

## 🎯 Usage

### Basic Usage

Run the scheduler manually:

```bash
python3 trending_scheduler.py
```

### Automated Collection

Set up cron job to run every 3 minutes:

```bash
crontab -e
```

Add this line:
```bash
*/3 * * * * cd /path/to/your/project && /usr/bin/python3 trending_scheduler.py >> /path/to/your/project/logs/scheduler.log 2>&1
```

### Monitoring

Check the status of your data collection:

```bash
./monitor_scheduler.sh
```

### Data Analysis

Analyze collected data:

```bash
python3 analyze_trends.py
```

## 📊 Data Collection

### Google Trends

**Features:**
- Fetches top 10 trending searches
- Automatic categorization (Entertainment, Sports, Technology, etc.)
- Viral potential scoring (1-10)
- Country-specific data collection

**Data Structure:**
```json
{
  "search_term": "Breaking News",
  "rank": 1,
  "category": "general",
  "viral_potential": 8,
  "collection_timestamp": "2024-01-15T14:30:00"
}
```

### YouTube Trending

**Features:**
- Fetches most popular videos
- Video metadata (title, channel, views, likes, comments)
- Content categorization
- Region-specific trending

**Data Structure:**
```json
{
  "video_id": "dQw4w9WgXcQ",
  "title": "Video Title",
  "channel_title": "Channel Name",
  "view_count": 1000000,
  "like_count": 50000,
  "comment_count": 1000,
  "category": "entertainment",
  "collection_timestamp": "2024-01-15T14:30:00"
}
```

### TikTok Trending

**Features:**
- Trending hashtags collection (placeholder implementation)
- Mock data for demonstration
- Extensible for real scraping implementation

**Data Structure:**
```json
{
  "hashtag": "#viral",
  "view_count": 1000000,
  "video_count": 50000,
  "trend_score": 9.5,
  "category": "entertainment",
  "collection_timestamp": "2024-01-15T14:30:00"
}
```

## 🗄️ Database Schema

### Google Trends Table
```sql
CREATE TABLE google_trends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    search_term TEXT NOT NULL,
    rank INTEGER NOT NULL,
    category TEXT,
    viral_potential INTEGER,
    collection_timestamp DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### YouTube Trending Table
```sql
CREATE TABLE youtube_trending (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    channel_title TEXT,
    view_count INTEGER,
    like_count INTEGER,
    comment_count INTEGER,
    published_at DATETIME,
    category TEXT,
    tags TEXT,
    collection_timestamp DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### TikTok Trending Table
```sql
CREATE TABLE tiktok_trending (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hashtag TEXT NOT NULL,
    view_count INTEGER,
    video_count INTEGER,
    trend_score REAL,
    category TEXT,
    collection_timestamp DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Collection Logs Table
```sql
CREATE TABLE collection_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform TEXT NOT NULL,
    status TEXT NOT NULL,
    items_collected INTEGER,
    error_message TEXT,
    collection_timestamp DATETIME NOT NULL,
    execution_time REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 📁 File Structure

```
project/
├── trending_scheduler.py      # Main scheduler script
├── scheduler_crontab.txt      # Cron job configuration
├── setup_scheduler.sh         # Automated setup script
├── monitor_scheduler.sh       # Monitoring script
├── analyze_trends.py          # Data analysis script
├── .env                       # Environment variables
├── trending_data.db           # SQLite database
├── logs/                      # Log files
│   ├── scheduler.log          # Scheduler logs
│   ├── google_trends.log      # Google Trends logs
│   └── health_check.log       # Health check logs
├── data_exports/              # Exported data files
├── backups/                   # Database backups
└── config/                    # Configuration files
```

## ⚙️ Configuration

### Environment Variables (.env)

```bash
# YouTube Data API Configuration (optional)
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
```

### Cron Job Scheduling

**Primary Configuration (every 3 minutes):**
```bash
*/3 * * * * cd /path/to/your/project && /usr/bin/python3 trending_scheduler.py >> /path/to/your/project/logs/scheduler.log 2>&1
```

**Alternative Schedules:**
- Every 5 minutes: `*/5 * * * *`
- Every 10 minutes: `*/10 * * * *`
- Every hour: `0 * * * *`
- Every 2 hours: `0 */2 * * *`

**Advanced Cron Jobs:**
```bash
# Data cleanup (daily at 2 AM)
0 2 * * * cd /path/to/your/project && /usr/bin/python3 -c "from trending_scheduler import TrendingScheduler; s = TrendingScheduler(); s.cleanup_old_data(30); s.close()" >> /path/to/your/project/logs/cleanup.log 2>&1

# Export data daily (at 6 AM)
0 6 * * * cd /path/to/your/project && /usr/bin/python3 -c "from trending_scheduler import TrendingScheduler; s = TrendingScheduler(); s.export_recent_data(24); s.close()" >> /path/to/your/project/logs/export.log 2>&1

# Health check (every 15 minutes)
*/15 * * * * cd /path/to/your/project && /usr/bin/python3 -c "import sqlite3; conn = sqlite3.connect('trending_data.db'); cursor = conn.cursor(); cursor.execute('SELECT COUNT(*) FROM collection_logs WHERE collection_timestamp > datetime(\"now\", \"-1 hour\")'); count = cursor.fetchone()[0]; print(f'Hourly collections: {count}'); conn.close()" >> /path/to/your/project/logs/health_check.log 2>&1
```

## 📈 Analytics Features

### Trend Categorization

**Google Trends Categories:**
- 🎬 Entertainment (movies, shows, celebrities)
- ⚽ Sports (games, players, teams)
- 💻 Technology (tech, apps, gadgets)
- 🗳️ Politics (elections, government)
- 💼 Business (stocks, companies, economy)
- 🏥 Health (medical, healthcare)
- 📚 Education (schools, learning)
- 📰 General (other topics)

**YouTube Categories:**
- 🎬 Entertainment (movies, shows, trailers)
- 🎵 Music (songs, albums, artists)
- 🎮 Gaming (games, playthroughs, streams)
- 📚 Education (tutorials, courses)
- 📰 News (breaking news, updates)
- ⚽ Sports (sports content)
- 💻 Technology (reviews, tech content)

### Viral Potential Scoring

**Google Trends Scoring (1-10):**
- Keywords like "viral", "trending", "breaking" (+2 points)
- Question words like "how", "what", "why" (+1 point)
- Positive words like "best", "amazing" (+1 point)
- Short terms (≤3 words) (+1 point)

**TikTok Scoring (0.0-10.0):**
- Based on view count and video count
- Normalized trend score calculation
- Category-based weighting

## 🔧 Technical Implementation

### Core Classes

**TrendingScheduler:**
- Main coordinator class
- Manages all collectors
- Handles data storage and export
- Provides monitoring and cleanup

**DatabaseManager:**
- SQLite database operations
- Table creation and management
- Data insertion and retrieval
- Connection handling and error recovery

**GoogleTrendsCollector:**
- pytrends integration
- Trending searches collection
- Categorization and scoring
- Error handling and retry logic

**YouTubeTrendingCollector:**
- YouTube Data API v3 integration
- Trending videos collection
- Video metadata extraction
- Rate limiting and quota management

**TikTokTrendingCollector:**
- Placeholder implementation
- Mock data generation
- Extensible for real scraping
- Category classification

### Error Handling

**Comprehensive Error Handling:**
- API failures and timeouts
- Network connectivity issues
- Database connection problems
- Data validation errors
- Rate limiting and quota exceeded

**Retry Mechanisms:**
- Exponential backoff
- Configurable retry attempts
- Platform-specific error handling
- Graceful degradation

**Logging System:**
- Structured logging with timestamps
- Error categorization and severity
- Performance metrics tracking
- Collection success/failure tracking

## 📊 Monitoring and Maintenance

### Health Monitoring

**Built-in Monitoring:**
```bash
./monitor_scheduler.sh
```

**Manual Health Checks:**
```bash
# Check recent collections
python3 -c "import sqlite3; conn = sqlite3.connect('trending_data.db'); cursor = conn.cursor(); cursor.execute('SELECT COUNT(*) FROM collection_logs WHERE collection_timestamp > datetime(\"now\", \"-1 hour\")'); print(f'Collections in last hour: {cursor.fetchone()[0]}'); conn.close()"

# Check database size
ls -lh trending_data.db

# Check log files
tail -f logs/scheduler.log
```

### Data Maintenance

**Automatic Cleanup:**
- Configurable data retention (default: 30 days)
- Automatic cleanup of old records
- Database optimization and vacuuming
- Log file rotation

**Manual Maintenance:**
```bash
# Clean up old data
python3 -c "from trending_scheduler import TrendingScheduler; s = TrendingScheduler(); s.cleanup_old_data(30); s.close()"

# Export recent data
python3 -c "from trending_scheduler import TrendingScheduler; s = TrendingScheduler(); s.export_recent_data(24); s.close()"

# Backup database
cp trending_data.db backups/trending_data_$(date +%Y%m%d).db
```

## 🔄 Integration

### With Existing Systems

**Node.js Integration:**
```python
# Combine with Node.js trending system
import json
import requests

# Load Python data
with open('data_exports/trending_export_20240115_143000.json', 'r') as f:
    python_data = json.load(f)

# Load Node.js data
with open('reports/real-time-trending-2024-01-15-14-30.json', 'r') as f:
    nodejs_data = json.load(f)

# Combine data
combined_trends = {
    'python_scheduler': python_data,
    'nodejs_system': nodejs_data
}
```

**API Integration:**
```python
# Expose data via REST API
from flask import Flask, jsonify
from trending_scheduler import TrendingScheduler

app = Flask(__name__)
scheduler = TrendingScheduler()

@app.route('/api/trends/recent')
def get_recent_trends():
    google_trends = scheduler.db_manager.get_recent_trends('google_trends', 24)
    youtube_trends = scheduler.db_manager.get_recent_trends('youtube', 24)
    tiktok_trends = scheduler.db_manager.get_recent_trends('tiktok', 24)
    
    return jsonify({
        'google_trends': google_trends,
        'youtube_trends': youtube_trends,
        'tiktok_trends': tiktok_trends
    })
```

## 🛡️ Security and Best Practices

### Security Considerations

**API Key Management:**
- Store API keys in environment variables
- Never commit API keys to version control
- Use separate API keys for development/production
- Regularly rotate API keys

**Database Security:**
- Use SQLite with proper file permissions
- Implement database encryption if needed
- Regular backups and disaster recovery
- Access control and user management

**Network Security:**
- Use HTTPS for API calls
- Implement rate limiting
- Monitor for suspicious activity
- Regular security updates

### Performance Optimization

**Database Optimization:**
- Proper indexing on frequently queried columns
- Regular database maintenance
- Query optimization and caching
- Connection pooling for high-traffic scenarios

**Resource Management:**
- Memory-efficient data processing
- Configurable collection limits
- Automatic cleanup of old data
- Monitoring of resource usage

## 🔧 Troubleshooting

### Common Issues

1. **Import Error: pytrends not found**
   ```bash
   pip install pytrends
   ```

2. **Permission Denied**
   ```bash
   chmod +x trending_scheduler.py
   chmod +x setup_scheduler.sh
   ```

3. **Cron Job Not Running**
   ```bash
   # Check cron service
   sudo service cron status
   
   # Check cron logs
   tail -f /var/log/cron
   
   # Verify cron job
   crontab -l
   ```

4. **Database Issues**
   ```bash
   # Check database file
   ls -la trending_data.db
   
   # Test database connection
   python3 -c "import sqlite3; sqlite3.connect('trending_data.db')"
   
   # Check database integrity
   python3 -c "import sqlite3; conn = sqlite3.connect('trending_data.db'); conn.execute('PRAGMA integrity_check'); conn.close()"
   ```

5. **API Rate Limits**
   - Reduce collection frequency
   - Implement exponential backoff
   - Use multiple API keys
   - Monitor quota usage

### Debug Mode

Run with verbose output:

```bash
python3 -u trending_scheduler.py 2>&1 | tee debug.log
```

### Log Analysis

```bash
# Check for errors
grep "ERROR" logs/scheduler.log

# Check collection success rate
grep "success" logs/scheduler.log | wc -l

# Check execution times
grep "execution_time" logs/scheduler.log
```

## 📚 API Documentation

### TrendingScheduler Class

#### Methods

- `collect_all_trends()`: Collect data from all platforms
- `export_recent_data(hours=24)`: Export recent data to JSON
- `cleanup_old_data(days=30)`: Clean up old data
- `close()`: Clean up resources

#### Properties

- `db_manager`: Database manager instance
- `google_collector`: Google Trends collector
- `youtube_collector`: YouTube collector
- `tiktok_collector`: TikTok collector

### DatabaseManager Class

#### Methods

- `insert_google_trends(trends_data)`: Insert Google Trends data
- `insert_youtube_trending(videos_data)`: Insert YouTube data
- `insert_tiktok_trending(hashtags_data)`: Insert TikTok data
- `get_recent_trends(platform, hours)`: Get recent trends
- `log_collection(platform, status, items, error, time)`: Log collection results
- `cleanup_old_data(days)`: Clean up old data

## 🆘 Support

For issues and questions:

1. Check the troubleshooting section
2. Review the logs in `logs/` directory
3. Run the monitoring script: `./monitor_scheduler.sh`
4. Check the usage guide: `cat SCHEDULER_USAGE.md`
5. Test individual components manually

## 🔄 Updates

To update the scheduler:

```bash
# Backup current data
cp -r data_exports data_exports_backup
cp trending_data.db trending_data_backup.db

# Update script
git pull origin main

# Re-run setup if needed
./setup_scheduler.sh
```

## 📄 License

This project is part of the LyraLytics platform and follows the same licensing terms.

---

**Note**: This backend scheduler provides a robust, scalable solution for collecting trending data from multiple platforms. It's designed to work alongside existing systems and can be easily extended for additional platforms and analytics features. 