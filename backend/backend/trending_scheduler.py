#!/usr/bin/env python3
"""
Backend Trending Data Scheduler
===============================

This script runs every 3 minutes to fetch trending data from multiple platforms:
- Google Trends (using pytrends)
- YouTube API (most popular videos)
- TikTok trending hashtags (placeholder scraping)

All data is stored in a database for analysis and retrieval.

Requirements:
- pytrends library: pip install pytrends
- requests library: pip install requests
- sqlite3 (built-in) or other database
- Python 3.6+

Author: LyraLytics Team
Date: 2024
"""

import json
import os
import sys
import sqlite3
import time
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
import threading
import queue

# Import external libraries
try:
    from pytrends.request import TrendReq
    import requests
    from requests.adapters import HTTPAdapter
    from urllib3.util.retry import Retry
except ImportError as e:
    print(f"❌ Error: Missing required library - {e}")
    print("Please install required libraries: pip install pytrends requests")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/trending_scheduler.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


class DatabaseManager:
    """
    Manages database operations for storing trending data.
    
    This class handles:
    - Database initialization and schema creation
    - Data insertion and retrieval
    - Connection management and error handling
    - Data cleanup and maintenance
    """
    
    def __init__(self, db_path: str = "trending_data.db"):
        """
        Initialize database manager.
        
        Args:
            db_path (str): Path to SQLite database file
        """
        self.db_path = db_path
        self.connection = None
        self.init_database()
    
    def init_database(self):
        """Initialize database and create tables if they don't exist."""
        try:
            self.connection = sqlite3.connect(self.db_path, check_same_thread=False)
            self.connection.row_factory = sqlite3.Row  # Enable column access by name
            
            # Create tables
            self._create_tables()
            logger.info(f"✅ Database initialized: {self.db_path}")
            
        except Exception as e:
            logger.error(f"❌ Database initialization failed: {e}")
            raise
    
    def _create_tables(self):
        """Create database tables for storing trending data."""
        cursor = self.connection.cursor()
        
        # Google Trends table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS google_trends (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                search_term TEXT NOT NULL,
                rank INTEGER NOT NULL,
                category TEXT,
                viral_potential INTEGER,
                collection_timestamp DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # YouTube trending videos table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS youtube_trending (
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
            )
        ''')
        
        # TikTok trending hashtags table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tiktok_trending (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                hashtag TEXT NOT NULL,
                view_count INTEGER,
                video_count INTEGER,
                trend_score REAL,
                category TEXT,
                collection_timestamp DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Collection logs table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS collection_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                platform TEXT NOT NULL,
                status TEXT NOT NULL,
                items_collected INTEGER,
                error_message TEXT,
                collection_timestamp DATETIME NOT NULL,
                execution_time REAL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create indexes for better performance
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_google_trends_timestamp ON google_trends(collection_timestamp)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_youtube_trending_timestamp ON youtube_trending(collection_timestamp)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_tiktok_trending_timestamp ON tiktok_trending(collection_timestamp)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_collection_logs_timestamp ON collection_logs(collection_timestamp)')
        
        self.connection.commit()
        logger.info("✅ Database tables created successfully")
    
    def insert_google_trends(self, trends_data: List[Dict]) -> bool:
        """
        Insert Google Trends data into database.
        
        Args:
            trends_data (List[Dict]): List of trend dictionaries
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            cursor = self.connection.cursor()
            timestamp = datetime.now()
            
            for trend in trends_data:
                cursor.execute('''
                    INSERT INTO google_trends 
                    (search_term, rank, category, viral_potential, collection_timestamp)
                    VALUES (?, ?, ?, ?, ?)
                ''', (
                    trend['search_term'],
                    trend['rank'],
                    trend.get('category', 'general'),
                    trend.get('viral_potential', 5),
                    timestamp
                ))
            
            self.connection.commit()
            logger.info(f"✅ Inserted {len(trends_data)} Google Trends records")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to insert Google Trends data: {e}")
            self.connection.rollback()
            return False
    
    def insert_youtube_trending(self, videos_data: List[Dict]) -> bool:
        """
        Insert YouTube trending videos data into database.
        
        Args:
            videos_data (List[Dict]): List of video dictionaries
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            cursor = self.connection.cursor()
            timestamp = datetime.now()
            
            for video in videos_data:
                cursor.execute('''
                    INSERT OR REPLACE INTO youtube_trending 
                    (video_id, title, channel_title, view_count, like_count, 
                     comment_count, published_at, category, tags, collection_timestamp)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    video['video_id'],
                    video['title'],
                    video.get('channel_title', ''),
                    video.get('view_count', 0),
                    video.get('like_count', 0),
                    video.get('comment_count', 0),
                    video.get('published_at'),
                    video.get('category', 'general'),
                    json.dumps(video.get('tags', [])),
                    timestamp
                ))
            
            self.connection.commit()
            logger.info(f"✅ Inserted {len(videos_data)} YouTube trending records")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to insert YouTube trending data: {e}")
            self.connection.rollback()
            return False
    
    def insert_tiktok_trending(self, hashtags_data: List[Dict]) -> bool:
        """
        Insert TikTok trending hashtags data into database.
        
        Args:
            hashtags_data (List[Dict]): List of hashtag dictionaries
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            cursor = self.connection.cursor()
            timestamp = datetime.now()
            
            for hashtag in hashtags_data:
                cursor.execute('''
                    INSERT INTO tiktok_trending 
                    (hashtag, view_count, video_count, trend_score, category, collection_timestamp)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    hashtag['hashtag'],
                    hashtag.get('view_count', 0),
                    hashtag.get('video_count', 0),
                    hashtag.get('trend_score', 0.0),
                    hashtag.get('category', 'general'),
                    timestamp
                ))
            
            self.connection.commit()
            logger.info(f"✅ Inserted {len(hashtags_data)} TikTok trending records")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to insert TikTok trending data: {e}")
            self.connection.rollback()
            return False
    
    def log_collection(self, platform: str, status: str, items_collected: int, 
                      error_message: str = None, execution_time: float = 0.0):
        """
        Log collection results to database.
        
        Args:
            platform (str): Platform name (google_trends, youtube, tiktok)
            status (str): Collection status (success, error, partial)
            items_collected (int): Number of items collected
            error_message (str): Error message if any
            execution_time (float): Execution time in seconds
        """
        try:
            cursor = self.connection.cursor()
            cursor.execute('''
                INSERT INTO collection_logs 
                (platform, status, items_collected, error_message, collection_timestamp, execution_time)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                platform,
                status,
                items_collected,
                error_message,
                datetime.now(),
                execution_time
            ))
            
            self.connection.commit()
            
        except Exception as e:
            logger.error(f"❌ Failed to log collection: {e}")
    
    def get_recent_trends(self, platform: str, hours: int = 24) -> List[Dict]:
        """
        Get recent trending data from database.
        
        Args:
            platform (str): Platform name (google_trends, youtube, tiktok)
            hours (int): Number of hours to look back
            
        Returns:
            List[Dict]: List of trending data
        """
        try:
            cursor = self.connection.cursor()
            since_time = datetime.now() - timedelta(hours=hours)
            
            if platform == 'google_trends':
                cursor.execute('''
                    SELECT * FROM google_trends 
                    WHERE collection_timestamp >= ? 
                    ORDER BY collection_timestamp DESC, rank ASC
                ''', (since_time,))
            elif platform == 'youtube':
                cursor.execute('''
                    SELECT * FROM youtube_trending 
                    WHERE collection_timestamp >= ? 
                    ORDER BY collection_timestamp DESC, view_count DESC
                ''', (since_time,))
            elif platform == 'tiktok':
                cursor.execute('''
                    SELECT * FROM tiktok_trending 
                    WHERE collection_timestamp >= ? 
                    ORDER BY collection_timestamp DESC, trend_score DESC
                ''', (since_time,))
            else:
                return []
            
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
            
        except Exception as e:
            logger.error(f"❌ Failed to get recent trends: {e}")
            return []
    
    def cleanup_old_data(self, days: int = 30):
        """
        Clean up old data from database.
        
        Args:
            days (int): Number of days to keep data
        """
        try:
            cursor = self.connection.cursor()
            cutoff_date = datetime.now() - timedelta(days=days)
            
            # Delete old data from all tables
            cursor.execute('DELETE FROM google_trends WHERE collection_timestamp < ?', (cutoff_date,))
            cursor.execute('DELETE FROM youtube_trending WHERE collection_timestamp < ?', (cutoff_date,))
            cursor.execute('DELETE FROM tiktok_trending WHERE collection_timestamp < ?', (cutoff_date,))
            cursor.execute('DELETE FROM collection_logs WHERE collection_timestamp < ?', (cutoff_date,))
            
            self.connection.commit()
            logger.info(f"✅ Cleaned up data older than {days} days")
            
        except Exception as e:
            logger.error(f"❌ Failed to cleanup old data: {e}")
    
    def close(self):
        """Close database connection."""
        if self.connection:
            self.connection.close()
            logger.info("✅ Database connection closed")


class GoogleTrendsCollector:
    """
    Collects trending data from Google Trends using pytrends.
    """
    
    def __init__(self):
        """Initialize Google Trends collector."""
        self.pytrends = TrendReq(hl='en-US', tz=360)
        self.pytrends.build_payload(kw_list=['trending'])  # Initialize session
    
    def fetch_trending_searches(self, country: str = 'US', limit: int = 10) -> List[Dict]:
        """
        Fetch trending searches from Google Trends.
        
        Args:
            country (str): Country code for trending searches
            limit (int): Number of trending searches to fetch
            
        Returns:
            List[Dict]: List of trending search data
        """
        try:
            logger.info(f"📊 Fetching Google Trends for {country}...")
            
            # Get trending searches
            trending_searches = self.pytrends.trending_searches(pn=country)
            trending_list = trending_searches[0].tolist()[:limit]
            
            # Format data
            trends_data = []
            for index, search_term in enumerate(trending_list, 1):
                trend_entry = {
                    'search_term': search_term,
                    'rank': index,
                    'normalized_term': search_term.lower().replace(' ', '_'),
                    'category': self._categorize_trend(search_term),
                    'viral_potential': self._calculate_viral_potential(search_term)
                }
                trends_data.append(trend_entry)
            
            logger.info(f"✅ Fetched {len(trends_data)} Google Trends")
            return trends_data
            
        except Exception as e:
            logger.error(f"❌ Google Trends collection failed: {e}")
            return []
    
    def _categorize_trend(self, search_term: str) -> str:
        """Categorize a search term based on its content."""
        term_lower = search_term.lower()
        
        categories = {
            'entertainment': ['movie', 'show', 'celebrity', 'actor', 'actress', 'film', 'tv', 'series'],
            'sports': ['game', 'match', 'player', 'team', 'sport', 'championship', 'league'],
            'technology': ['tech', 'app', 'software', 'gadget', 'phone', 'computer', 'ai', 'robot'],
            'politics': ['election', 'president', 'vote', 'government', 'policy', 'law'],
            'business': ['stock', 'market', 'company', 'business', 'economy', 'finance'],
            'health': ['covid', 'vaccine', 'health', 'medical', 'doctor', 'hospital'],
            'education': ['school', 'university', 'student', 'education', 'learn', 'study']
        }
        
        for category, keywords in categories.items():
            if any(keyword in term_lower for keyword in keywords):
                return category
        
        return 'general'
    
    def _calculate_viral_potential(self, search_term: str) -> int:
        """Calculate viral potential score for a search term."""
        score = 5  # Base score
        term_lower = search_term.lower()
        
        if any(word in term_lower for word in ['viral', 'trending', 'breaking', 'news']):
            score += 2
        if any(word in term_lower for word in ['how', 'what', 'why', 'when']):
            score += 1
        if any(word in term_lower for word in ['best', 'top', 'amazing', 'incredible']):
            score += 1
        if len(search_term.split()) <= 3:
            score += 1
        
        return min(score, 10)


class YouTubeTrendingCollector:
    """
    Collects trending videos from YouTube API.
    """
    
    def __init__(self, api_key: str):
        """
        Initialize YouTube collector.
        
        Args:
            api_key (str): YouTube Data API key
        """
        self.api_key = api_key
        self.base_url = "https://www.googleapis.com/youtube/v3"
        
        # Configure requests session with retry strategy
        self.session = requests.Session()
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
    
    def fetch_trending_videos(self, region_code: str = 'US', max_results: int = 10) -> List[Dict]:
        """
        Fetch trending videos from YouTube API.
        
        Args:
            region_code (str): Region code for trending videos
            max_results (int): Maximum number of videos to fetch
            
        Returns:
            List[Dict]: List of trending video data
        """
        try:
            logger.info(f"📺 Fetching YouTube trending videos for {region_code}...")
            
            # Get trending videos
            url = f"{self.base_url}/videos"
            params = {
                'part': 'snippet,statistics',
                'chart': 'mostPopular',
                'regionCode': region_code,
                'maxResults': max_results,
                'key': self.api_key
            }
            
            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            videos_data = []
            
            for item in data.get('items', []):
                snippet = item.get('snippet', {})
                statistics = item.get('statistics', {})
                
                video_entry = {
                    'video_id': item['id'],
                    'title': snippet.get('title', ''),
                    'channel_title': snippet.get('channelTitle', ''),
                    'view_count': int(statistics.get('viewCount', 0)),
                    'like_count': int(statistics.get('likeCount', 0)),
                    'comment_count': int(statistics.get('commentCount', 0)),
                    'published_at': snippet.get('publishedAt'),
                    'category': self._categorize_video(snippet.get('title', '')),
                    'tags': snippet.get('tags', [])
                }
                videos_data.append(video_entry)
            
            logger.info(f"✅ Fetched {len(videos_data)} YouTube trending videos")
            return videos_data
            
        except Exception as e:
            logger.error(f"❌ YouTube trending collection failed: {e}")
            return []
    
    def _categorize_video(self, title: str) -> str:
        """Categorize a video based on its title."""
        title_lower = title.lower()
        
        categories = {
            'entertainment': ['movie', 'show', 'celebrity', 'actor', 'actress', 'film', 'tv', 'series', 'trailer'],
            'music': ['song', 'music', 'album', 'artist', 'singer', 'band', 'concert', 'performance'],
            'gaming': ['game', 'gaming', 'playthrough', 'walkthrough', 'stream', 'esports'],
            'education': ['tutorial', 'how to', 'learn', 'education', 'course', 'lesson'],
            'news': ['news', 'breaking', 'update', 'report', 'coverage'],
            'sports': ['sport', 'game', 'match', 'player', 'team', 'championship'],
            'technology': ['tech', 'review', 'unboxing', 'gadget', 'phone', 'computer']
        }
        
        for category, keywords in categories.items():
            if any(keyword in title_lower for keyword in keywords):
                return category
        
        return 'general'


class TikTokTrendingCollector:
    """
    Collects trending hashtags from TikTok (placeholder implementation).
    
    Note: This is a placeholder implementation since TikTok doesn't provide
    a public API for trending hashtags. In a real implementation, you would
    need to use web scraping or third-party services.
    """
    
    def __init__(self):
        """Initialize TikTok collector."""
        self.session = requests.Session()
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
    
    def fetch_trending_hashtags(self, limit: int = 10) -> List[Dict]:
        """
        Fetch trending hashtags from TikTok (placeholder).
        
        Args:
            limit (int): Number of hashtags to fetch
            
        Returns:
            List[Dict]: List of trending hashtag data
        """
        try:
            logger.info("📱 Fetching TikTok trending hashtags...")
            
            # Placeholder implementation - in reality, you would:
            # 1. Scrape TikTok's trending page
            # 2. Use a third-party API service
            # 3. Use browser automation with Selenium
            
            # For now, return mock data
            mock_hashtags = [
                {'hashtag': '#viral', 'view_count': 1000000, 'video_count': 50000, 'trend_score': 9.5, 'category': 'entertainment'},
                {'hashtag': '#trending', 'view_count': 800000, 'video_count': 40000, 'trend_score': 8.8, 'category': 'general'},
                {'hashtag': '#dance', 'view_count': 600000, 'video_count': 30000, 'trend_score': 8.2, 'category': 'entertainment'},
                {'hashtag': '#comedy', 'view_count': 500000, 'video_count': 25000, 'trend_score': 7.9, 'category': 'entertainment'},
                {'hashtag': '#food', 'view_count': 400000, 'video_count': 20000, 'trend_score': 7.5, 'category': 'lifestyle'},
                {'hashtag': '#fashion', 'view_count': 350000, 'video_count': 18000, 'trend_score': 7.2, 'category': 'lifestyle'},
                {'hashtag': '#fitness', 'view_count': 300000, 'video_count': 15000, 'trend_score': 6.8, 'category': 'health'},
                {'hashtag': '#travel', 'view_count': 250000, 'video_count': 12000, 'trend_score': 6.5, 'category': 'lifestyle'},
                {'hashtag': '#beauty', 'view_count': 200000, 'video_count': 10000, 'trend_score': 6.2, 'category': 'lifestyle'},
                {'hashtag': '#pets', 'view_count': 150000, 'video_count': 8000, 'trend_score': 5.8, 'category': 'lifestyle'}
            ]
            
            # Return limited results
            hashtags_data = mock_hashtags[:limit]
            
            logger.info(f"✅ Fetched {len(hashtags_data)} TikTok trending hashtags (mock data)")
            return hashtags_data
            
        except Exception as e:
            logger.error(f"❌ TikTok trending collection failed: {e}")
            return []
    
    def _scrape_tiktok_trending(self) -> List[Dict]:
        """
        Placeholder for actual TikTok scraping implementation.
        
        In a real implementation, you would:
        1. Use Selenium or Playwright to automate browser
        2. Navigate to TikTok's trending page
        3. Extract hashtag data from the page
        4. Handle rate limiting and anti-bot measures
        
        Returns:
            List[Dict]: List of scraped hashtag data
        """
        # This is where you would implement actual scraping
        # For now, return empty list
        return []


class TrendingScheduler:
    """
    Main scheduler that coordinates data collection from all platforms.
    """
    
    def __init__(self, youtube_api_key: str = None):
        """
        Initialize the trending scheduler.
        
        Args:
            youtube_api_key (str): YouTube Data API key (optional)
        """
        self.db_manager = DatabaseManager()
        self.google_collector = GoogleTrendsCollector()
        self.youtube_collector = YouTubeTrendingCollector(youtube_api_key) if youtube_api_key else None
        self.tiktok_collector = TikTokTrendingCollector()
        
        # Create necessary directories
        Path("logs").mkdir(exist_ok=True)
        Path("data_exports").mkdir(exist_ok=True)
        
        logger.info("🚀 Trending Scheduler initialized")
    
    def collect_all_trends(self) -> Dict[str, Any]:
        """
        Collect trending data from all platforms.
        
        Returns:
            Dict[str, Any]: Collection results summary
        """
        start_time = time.time()
        results = {
            'google_trends': {'status': 'pending', 'count': 0, 'error': None},
            'youtube': {'status': 'pending', 'count': 0, 'error': None},
            'tiktok': {'status': 'pending', 'count': 0, 'error': None}
        }
        
        logger.info("🔄 Starting trending data collection...")
        
        # Collect Google Trends
        try:
            google_start = time.time()
            google_data = self.google_collector.fetch_trending_searches()
            if google_data:
                success = self.db_manager.insert_google_trends(google_data)
                execution_time = time.time() - google_start
                
                if success:
                    results['google_trends'] = {
                        'status': 'success',
                        'count': len(google_data),
                        'error': None
                    }
                    self.db_manager.log_collection('google_trends', 'success', len(google_data), execution_time=execution_time)
                else:
                    results['google_trends'] = {
                        'status': 'error',
                        'count': 0,
                        'error': 'Database insertion failed'
                    }
                    self.db_manager.log_collection('google_trends', 'error', 0, 'Database insertion failed', execution_time)
            else:
                results['google_trends'] = {
                    'status': 'error',
                    'count': 0,
                    'error': 'No data fetched'
                }
                self.db_manager.log_collection('google_trends', 'error', 0, 'No data fetched')
        except Exception as e:
            results['google_trends'] = {
                'status': 'error',
                'count': 0,
                'error': str(e)
            }
            self.db_manager.log_collection('google_trends', 'error', 0, str(e))
        
        # Collect YouTube trending (if API key is available)
        if self.youtube_collector:
            try:
                youtube_start = time.time()
                youtube_data = self.youtube_collector.fetch_trending_videos()
                if youtube_data:
                    success = self.db_manager.insert_youtube_trending(youtube_data)
                    execution_time = time.time() - youtube_start
                    
                    if success:
                        results['youtube'] = {
                            'status': 'success',
                            'count': len(youtube_data),
                            'error': None
                        }
                        self.db_manager.log_collection('youtube', 'success', len(youtube_data), execution_time=execution_time)
                    else:
                        results['youtube'] = {
                            'status': 'error',
                            'count': 0,
                            'error': 'Database insertion failed'
                        }
                        self.db_manager.log_collection('youtube', 'error', 0, 'Database insertion failed', execution_time)
                else:
                    results['youtube'] = {
                        'status': 'error',
                        'count': 0,
                        'error': 'No data fetched'
                    }
                    self.db_manager.log_collection('youtube', 'error', 0, 'No data fetched')
            except Exception as e:
                results['youtube'] = {
                    'status': 'error',
                    'count': 0,
                    'error': str(e)
                }
                self.db_manager.log_collection('youtube', 'error', 0, str(e))
        else:
            results['youtube'] = {
                'status': 'skipped',
                'count': 0,
                'error': 'No YouTube API key provided'
            }
            self.db_manager.log_collection('youtube', 'skipped', 0, 'No YouTube API key provided')
        
        # Collect TikTok trending
        try:
            tiktok_start = time.time()
            tiktok_data = self.tiktok_collector.fetch_trending_hashtags()
            if tiktok_data:
                success = self.db_manager.insert_tiktok_trending(tiktok_data)
                execution_time = time.time() - tiktok_start
                
                if success:
                    results['tiktok'] = {
                        'status': 'success',
                        'count': len(tiktok_data),
                        'error': None
                    }
                    self.db_manager.log_collection('tiktok', 'success', len(tiktok_data), execution_time=execution_time)
                else:
                    results['tiktok'] = {
                        'status': 'error',
                        'count': 0,
                        'error': 'Database insertion failed'
                    }
                    self.db_manager.log_collection('tiktok', 'error', 0, 'Database insertion failed', execution_time)
            else:
                results['tiktok'] = {
                    'status': 'error',
                    'count': 0,
                    'error': 'No data fetched'
                }
                self.db_manager.log_collection('tiktok', 'error', 0, 'No data fetched')
        except Exception as e:
            results['tiktok'] = {
                'status': 'error',
                'count': 0,
                'error': str(e)
            }
            self.db_manager.log_collection('tiktok', 'error', 0, str(e))
        
        # Calculate total execution time
        total_time = time.time() - start_time
        
        # Log summary
        successful_collections = sum(1 for r in results.values() if r['status'] == 'success')
        total_items = sum(r['count'] for r in results.values())
        
        logger.info(f"✅ Collection completed in {total_time:.2f}s")
        logger.info(f"📊 Results: {successful_collections}/3 platforms successful, {total_items} total items")
        
        # Print detailed results
        self._print_collection_results(results)
        
        return results
    
    def _print_collection_results(self, results: Dict[str, Any]):
        """Print formatted collection results."""
        print("\n" + "="*60)
        print(f"🔥 TRENDING DATA COLLECTION - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*60)
        
        for platform, result in results.items():
            status_emoji = "✅" if result['status'] == 'success' else "❌" if result['status'] == 'error' else "⚠️"
            platform_emoji = {
                'google_trends': '🔍',
                'youtube': '📺',
                'tiktok': '📱'
            }.get(platform, '📊')
            
            print(f"{platform_emoji} {platform.upper()}: {status_emoji} {result['status'].upper()}")
            print(f"   📈 Items collected: {result['count']}")
            if result['error']:
                print(f"   ⚠️  Error: {result['error']}")
            print()
    
    def export_recent_data(self, hours: int = 24) -> str:
        """
        Export recent trending data to JSON file.
        
        Args:
            hours (int): Number of hours to export
            
        Returns:
            str: Path to exported file
        """
        try:
            export_data = {
                'export_timestamp': datetime.now().isoformat(),
                'hours_back': hours,
                'google_trends': self.db_manager.get_recent_trends('google_trends', hours),
                'youtube': self.db_manager.get_recent_trends('youtube', hours),
                'tiktok': self.db_manager.get_recent_trends('tiktok', hours)
            }
            
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"data_exports/trending_export_{timestamp}.json"
            
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(export_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"✅ Data exported to: {filename}")
            return filename
            
        except Exception as e:
            logger.error(f"❌ Data export failed: {e}")
            return None
    
    def cleanup_old_data(self, days: int = 30):
        """Clean up old data from database."""
        self.db_manager.cleanup_old_data(days)
    
    def close(self):
        """Clean up resources."""
        self.db_manager.close()
        logger.info("✅ Scheduler resources cleaned up")


def main():
    """
    Main function to run the trending scheduler.
    
    This function:
    1. Initializes the scheduler
    2. Collects trending data from all platforms
    3. Exports recent data
    4. Cleans up old data
    5. Handles errors gracefully
    """
    try:
        # Get YouTube API key from environment (optional)
        youtube_api_key = os.getenv('YOUTUBE_API_KEY')
        
        # Initialize scheduler
        scheduler = TrendingScheduler(youtube_api_key)
        
        # Collect trending data
        results = scheduler.collect_all_trends()
        
        # Export recent data
        export_file = scheduler.export_recent_data()
        if export_file:
            print(f"📁 Data exported to: {export_file}")
        
        # Clean up old data (keep last 30 days)
        scheduler.cleanup_old_data(30)
        
        # Close scheduler
        scheduler.close()
        
        # Exit with appropriate code
        successful_collections = sum(1 for r in results.values() if r['status'] == 'success')
        sys.exit(0 if successful_collections > 0 else 1)
        
    except KeyboardInterrupt:
        logger.info("⚠️ Collection interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    # This block ensures the script only runs when executed directly
    # (not when imported as a module)
    main() 