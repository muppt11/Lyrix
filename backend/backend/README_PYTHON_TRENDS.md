# Google Trends Python Data Collector

A comprehensive Python script that fetches Google Trends data every 3 minutes using the `pytrends` library, with automated cron job scheduling and detailed analytics.

## 🚀 Features

- **Real-time Data Collection**: Fetches top 10 Google trending searches every 3 minutes
- **Automated Scheduling**: Cron job configuration for continuous data collection
- **Rich Analytics**: Categorization, viral potential scoring, and trend analysis
- **Error Handling**: Robust error handling and logging
- **Data Storage**: JSON format with timestamps for easy analysis
- **Monitoring Tools**: Built-in monitoring and status checking

## 📋 Requirements

- Python 3.6 or higher
- `pytrends` library
- Internet connection for Google Trends API access

## 🛠️ Installation

### Quick Setup (Recommended)

Run the automated setup script:

```bash
./setup_python_trends.sh
```

This script will:
- Check Python version compatibility
- Create a virtual environment
- Install all dependencies
- Test the script
- Set up cron job scheduling
- Create monitoring tools

### Manual Installation

1. **Install Python dependencies:**
   ```bash
   pip install pytrends pandas requests
   ```

2. **Make the script executable:**
   ```bash
   chmod +x google_trends_python.py
   ```

3. **Create necessary directories:**
   ```bash
   mkdir -p trends_data logs data_analysis
   ```

## 🎯 Usage

### Basic Usage

Run the script manually:

```bash
python3 google_trends_python.py
```

### Automated Collection

Set up cron job to run every 3 minutes:

```bash
crontab -e
```

Add this line:
```bash
*/3 * * * * cd /path/to/your/project && /usr/bin/python3 google_trends_python.py >> /path/to/your/project/logs/google_trends.log 2>&1
```

### Monitoring

Check the status of your data collection:

```bash
./monitor_trends.sh
```

## 📊 Data Output

### File Structure

```
project/
├── google_trends_python.py    # Main collection script
├── requirements.txt           # Python dependencies
├── crontab_config.txt        # Cron job examples
├── setup_python_trends.sh    # Automated setup script
├── monitor_trends.sh         # Monitoring script
├── trends_data/              # Generated JSON files
├── logs/                     # Log files
└── data_analysis/            # Analysis scripts
```

### Data Format

Each collection generates a JSON file: `google_trends_YYYYMMDD_HHMMSS.json`

```json
{
  "collection_timestamp": "2024-01-15T14:30:00.000000",
  "collection_date": "2024-01-15",
  "collection_time": "14:30:00",
  "timezone": "US/Central",
  "country": "US",
  "total_trends": 10,
  "trends": [
    {
      "rank": 1,
      "search_term": "Breaking News",
      "normalized_term": "breaking_news",
      "category": "general",
      "viral_potential": 8
    }
  ]
}
```

## 🔍 Analytics Features

### Trend Categorization

The script automatically categorizes trends into:
- 🎬 **Entertainment**: Movies, shows, celebrities
- ⚽ **Sports**: Games, players, teams
- 💻 **Technology**: Tech, apps, gadgets
- 🗳️ **Politics**: Elections, government
- 💼 **Business**: Stocks, companies, economy
- 🏥 **Health**: Medical, healthcare
- 📚 **Education**: Schools, learning
- 📰 **General**: Other topics

### Viral Potential Scoring

Each trend gets a viral potential score (1-10) based on:
- Keywords like "viral", "trending", "breaking"
- Question words like "how", "what", "why"
- Positive words like "best", "amazing"
- Term length (shorter terms tend to be more viral)

## ⚙️ Configuration

### Environment Variables

You can customize the behavior by modifying the script:

```python
# Change collection frequency
trending_searches = self.fetch_trending_searches(country='US', limit=15)

# Change output directory
collector = GoogleTrendsCollector(output_dir="custom_directory")

# Modify categories
categories = {
    'custom_category': ['keyword1', 'keyword2']
}
```

### Cron Job Scheduling

Different scheduling options:

```bash
# Every 3 minutes (default)
*/3 * * * * command

# Every 5 minutes
*/5 * * * * command

# Every hour
0 * * * * command

# Every 2 hours
0 */2 * * * command

# Weekdays at 9 AM
0 9 * * 1-5 command
```

## 📈 Monitoring and Maintenance

### Check Collection Status

```bash
# View recent logs
tail -f logs/google_trends.log

# Check data files
ls -la trends_data/

# Monitor script
./monitor_trends.sh
```

### Cron Job Management

```bash
# View all cron jobs
crontab -l

# Edit cron jobs
crontab -e

# Remove all cron jobs
crontab -r
```

### Data Analysis

The collected data can be analyzed using:

```python
import json
import pandas as pd

# Load recent data
with open('trends_data/google_trends_20240115_143000.json', 'r') as f:
    data = json.load(f)

# Convert to DataFrame
df = pd.DataFrame(data['trends'])

# Analyze trends
print(df.groupby('category').count())
print(df['viral_potential'].mean())
```

## 🛡️ Error Handling

The script includes comprehensive error handling:

- **API Failures**: Graceful handling of Google Trends API errors
- **Network Issues**: Retry mechanisms and timeout handling
- **Data Validation**: Ensures data integrity before saving
- **Logging**: Detailed error logging for debugging

## 🔧 Troubleshooting

### Common Issues

1. **Import Error: pytrends not found**
   ```bash
   pip install pytrends
   ```

2. **Permission Denied**
   ```bash
   chmod +x google_trends_python.py
   chmod +x setup_python_trends.sh
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

4. **API Rate Limits**
   - Reduce collection frequency
   - Add delays between requests
   - Use proxy rotation (advanced)

### Debug Mode

Run with verbose output:

```bash
python3 -u google_trends_python.py 2>&1 | tee debug.log
```

## 📚 API Documentation

### GoogleTrendsCollector Class

#### Methods

- `fetch_trending_searches(country='US', limit=10)`: Fetch trending searches
- `get_trend_details(search_term)`: Get detailed trend information
- `format_trend_data(trending_searches)`: Format data with metadata
- `categorize_trend(search_term)`: Categorize search terms
- `calculate_viral_potential(search_term)`: Calculate viral potential score
- `save_trend_data(trend_data, filename=None)`: Save data to JSON
- `print_trends(trend_data)`: Print formatted trends
- `run_collection()`: Run complete collection process

#### Properties

- `output_dir`: Directory for data storage
- `timestamp`: Collection timestamp
- `pytrends`: pytrends API connection

## 🤝 Integration

### With Node.js System

This Python script complements the existing Node.js trending system:

```bash
# Run both systems
npm run cron-start  # Node.js system
./setup_python_trends.sh  # Python system
```

### Data Integration

Combine Python and Node.js data:

```python
import json
import requests

# Load Python data
with open('trends_data/google_trends_20240115_143000.json', 'r') as f:
    python_data = json.load(f)

# Load Node.js data
with open('reports/real-time-trending-2024-01-15-14-30.json', 'r') as f:
    nodejs_data = json.load(f)

# Combine and analyze
combined_trends = {
    'python_google_trends': python_data,
    'nodejs_multi_platform': nodejs_data
}
```

## 📄 License

This project is part of the LyraLytics platform and follows the same licensing terms.

## 🆘 Support

For issues and questions:

1. Check the troubleshooting section
2. Review the logs in `logs/` directory
3. Run the monitoring script: `./monitor_trends.sh`
4. Check the usage guide: `cat USAGE.md`

## 🔄 Updates

To update the script:

```bash
# Backup current data
cp -r trends_data trends_data_backup

# Update script
git pull origin main

# Re-run setup if needed
./setup_python_trends.sh
```

---

**Note**: This Python script is designed to work alongside the existing Node.js trending system, providing additional Google Trends data collection capabilities with Python's rich ecosystem for data analysis and machine learning. 