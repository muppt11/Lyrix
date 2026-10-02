#!/usr/bin/env python3
"""
Fetch Trends Script
==================

This script fetches trending data from multiple platforms:
1. Google Trends - Top 10 trending searches in the US
2. YouTube Data API - Top 10 most popular videos in the US
3. TikTok - Trending hashtags (placeholder implementation)

The script includes comprehensive error handling, logging, and detailed comments
explaining each part of the process.

Requirements:
- pytrends library: pip install pytrends
- requests library: pip install requests
- Python 3.6+

Environment Variables:
- YOUTUBE_API_KEY: YouTube Data API key
- TIKTOK_API_KEY: TikTok API key (if available)

Author: LyraLytics Team
Date: 2024
"""

import os
import sys
import json
import time
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path

# Import external libraries with error handling
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
def setup_logging():
    """
    Set up logging configuration for the script.
    
    This function:
    1. Creates logs directory if it doesn't exist
    2. Configures logging format with timestamps
    3. Sets up both file and console logging
    4. Returns the logger instance
    """
    # Create logs directory if it doesn't exist
    Path("logs").mkdir(exist_ok=True)
    
    # Configure logging format
    log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    # Set up logging configuration
    logging.basicConfig(
        level=logging.INFO,
        format=log_format,
        handlers=[
            # File handler for persistent logging
            logging.FileHandler('logs/fetch_trends.log'),
            # Console handler for immediate output
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    return logging.getLogger(__name__)

# Initialize logger
logger = setup_logging()


class GoogleTrendsFetcher:
    """
    Fetches trending searches from Google Trends using the pytrends library.
    
    This class handles:
    - Connection to Google Trends API
    - Fetching trending searches for specific countries
    - Error handling and retry logic
    - Data formatting and validation
    """
    
    def __init__(self):
        """
        Initialize the Google Trends fetcher.
        
        This method:
        1. Creates a pytrends TrendReq instance
        2. Sets up connection parameters (language, timezone)
        3. Initializes the session for better reliability
        """
        try:
            # Initialize pytrends with US settings
            # hl='en-US': English language
            # tz=360: US Central timezone (UTC-6)
            self.pytrends = TrendReq(hl='en-US', tz=360)
            
            # Initialize session by building a payload
            # This helps establish a stable connection
            self.pytrends.build_payload(kw_list=['trending'])
            
            logger.info("✅ Google Trends connection established")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Google Trends: {e}")
            raise
    
    def fetch_trending_searches(self, country: str = 'US', limit: int = 10) -> List[Dict[str, Any]]:
        """
        Fetch trending searches from Google Trends.
        
        Args:
            country (str): Country code for trending searches (default: 'US')
            limit (int): Number of trending searches to fetch (default: 10)
            
        Returns:
            List[Dict[str, Any]]: List of trending search data with metadata
            
        Raises:
            Exception: If fetching fails after retries
        """
        try:
            logger.info(f"🔍 Fetching top {limit} Google Trends for {country}...")
            
            # Get trending searches for the specified country
            # pytrends.trending_searches() returns a pandas DataFrame
            trending_searches = self.pytrends.trending_searches(pn=country)
            
            # Convert DataFrame to list and limit results
            trending_list = trending_searches[0].tolist()[:limit]
            
            # Format the data with additional metadata
            formatted_trends = []
            for index, search_term in enumerate(trending_list, 1):
                trend_data = {
                    'rank': index,
                    'search_term': search_term,
                    'normalized_term': search_term.lower().replace(' ', '_'),
                    'category': self._categorize_trend(search_term),
                    'viral_potential': self._calculate_viral_potential(search_term),
                    'platform': 'google_trends',
                    'country': country,
                    'fetched_at': datetime.now().isoformat()
                }
                formatted_trends.append(trend_data)
            
            logger.info(f"✅ Successfully fetched {len(formatted_trends)} Google Trends")
            return formatted_trends
            
        except Exception as e:
            logger.error(f"❌ Google Trends fetch failed: {e}")
            return []
    
    def _categorize_trend(self, search_term: str) -> str:
        """
        Categorize a search term based on its content.
        
        This method analyzes the search term and assigns it to a category
        based on keywords and patterns found in the text.
        
        Args:
            search_term (str): The search term to categorize
            
        Returns:
            str: Category name (entertainment, sports, technology, etc.)
        """
        term_lower = search_term.lower()
        
        # Define category keywords and their associated terms
        categories = {
            'entertainment': ['movie', 'show', 'celebrity', 'actor', 'actress', 'film', 'tv', 'series', 'trailer'],
            'sports': ['game', 'match', 'player', 'team', 'sport', 'championship', 'league', 'tournament'],
            'technology': ['tech', 'app', 'software', 'gadget', 'phone', 'computer', 'ai', 'robot', 'update'],
            'politics': ['election', 'president', 'vote', 'government', 'policy', 'law', 'congress'],
            'business': ['stock', 'market', 'company', 'business', 'economy', 'finance', 'earnings'],
            'health': ['covid', 'vaccine', 'health', 'medical', 'doctor', 'hospital', 'disease'],
            'education': ['school', 'university', 'student', 'education', 'learn', 'study', 'course']
        }
        
        # Check which category the term belongs to
        for category, keywords in categories.items():
            if any(keyword in term_lower for keyword in keywords):
                return category
        
        # Default category for terms that don't match specific categories
        return 'general'
    
    def _calculate_viral_potential(self, search_term: str) -> int:
        """
        Calculate viral potential score for a search term.
        
        This method analyzes various factors that contribute to viral potential:
        - Presence of viral keywords
        - Question words that indicate curiosity
        - Positive/engaging words
        - Term length (shorter terms tend to be more viral)
        
        Args:
            search_term (str): The search term to analyze
            
        Returns:
            int: Viral potential score from 1 to 10
        """
        score = 5  # Base score
        
        term_lower = search_term.lower()
        
        # Factors that increase viral potential
        viral_keywords = ['viral', 'trending', 'breaking', 'news', 'shocking', 'amazing']
        if any(word in term_lower for word in viral_keywords):
            score += 2
        
        # Question words indicate curiosity and engagement
        question_words = ['how', 'what', 'why', 'when', 'where', 'who']
        if any(word in term_lower for word in question_words):
            score += 1
        
        # Positive/engaging words
        positive_words = ['best', 'top', 'amazing', 'incredible', 'awesome', 'perfect']
        if any(word in term_lower for word in positive_words):
            score += 1
        
        # Shorter terms tend to be more viral and memorable
        if len(search_term.split()) <= 3:
            score += 1
        
        # Cap the score at 10
        return min(score, 10)


class YouTubeTrendingFetcher:
    """
    Fetches trending videos from YouTube using the YouTube Data API v3.
    
    This class handles:
    - YouTube Data API authentication
    - Fetching most popular videos
    - Video metadata extraction
    - Rate limiting and error handling
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the YouTube trending fetcher.
        
        Args:
            api_key (Optional[str]): YouTube Data API key. If not provided,
                                   will try to get from environment variable.
        """
        # Get API key from parameter or environment variable
        self.api_key = api_key or os.getenv('YOUTUBE_API_KEY')
        
        if not self.api_key:
            logger.warning("⚠️ No YouTube API key provided. YouTube trending will be skipped.")
            self.api_key = None
            return
        
        # Set up base URL for YouTube Data API v3
        self.base_url = "https://www.googleapis.com/youtube/v3"
        
        # Configure requests session with retry strategy
        self.session = requests.Session()
        retry_strategy = Retry(
            total=3,  # Maximum 3 retries
            backoff_factor=1,  # Exponential backoff
            status_forcelist=[429, 500, 502, 503, 504]  # Retry on these status codes
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        
        logger.info("✅ YouTube API client initialized")
    
    def fetch_trending_videos(self, region_code: str = 'US', max_results: int = 10) -> List[Dict[str, Any]]:
        """
        Fetch trending videos from YouTube Data API.
        
        Args:
            region_code (str): Region code for trending videos (default: 'US')
            max_results (int): Maximum number of videos to fetch (default: 10)
            
        Returns:
            List[Dict[str, Any]]: List of trending video data with metadata
            
        Raises:
            Exception: If API key is missing or API call fails
        """
        if not self.api_key:
            logger.warning("⚠️ YouTube API key not available. Skipping YouTube trending.")
            return []
        
        try:
            logger.info(f"📺 Fetching top {max_results} YouTube trending videos for {region_code}...")
            
            # Prepare API request parameters
            params = {
                'part': 'snippet,statistics',  # Get snippet and statistics data
                'chart': 'mostPopular',  # Get most popular videos
                'regionCode': region_code,  # Region-specific trending
                'maxResults': max_results,  # Number of results
                'key': self.api_key  # API key for authentication
            }
            
            # Make API request
            response = self.session.get(
                f"{self.base_url}/videos",
                params=params,
                timeout=30  # 30 second timeout
            )
            response.raise_for_status()  # Raise exception for bad status codes
            
            # Parse response data
            data = response.json()
            videos_data = []
            
            # Process each video in the response
            for item in data.get('items', []):
                snippet = item.get('snippet', {})
                statistics = item.get('statistics', {})
                
                # Extract and format video data
                video_data = {
                    'video_id': item['id'],
                    'title': snippet.get('title', ''),
                    'channel_title': snippet.get('channelTitle', ''),
                    'channel_id': snippet.get('channelId', ''),
                    'description': snippet.get('description', ''),
                    'published_at': snippet.get('publishedAt', ''),
                    'thumbnails': snippet.get('thumbnails', {}),
                    'tags': snippet.get('tags', []),
                    'category_id': snippet.get('categoryId', ''),
                    'view_count': int(statistics.get('viewCount', 0)),
                    'like_count': int(statistics.get('likeCount', 0)),
                    'comment_count': int(statistics.get('commentCount', 0)),
                    'category': self._categorize_video(snippet.get('title', '')),
                    'platform': 'youtube',
                    'region_code': region_code,
                    'fetched_at': datetime.now().isoformat()
                }
                videos_data.append(video_data)
            
            logger.info(f"✅ Successfully fetched {len(videos_data)} YouTube trending videos")
            return videos_data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ YouTube API request failed: {e}")
            return []
        except KeyError as e:
            logger.error(f"❌ YouTube API response parsing failed: {e}")
            return []
        except Exception as e:
            logger.error(f"❌ YouTube trending fetch failed: {e}")
            return []
    
    def _categorize_video(self, title: str) -> str:
        """
        Categorize a video based on its title.
        
        This method analyzes the video title and assigns it to a category
        based on keywords and patterns commonly found in video titles.
        
        Args:
            title (str): The video title to categorize
            
        Returns:
            str: Category name (entertainment, music, gaming, etc.)
        """
        title_lower = title.lower()
        
        # Define category keywords and their associated terms
        categories = {
            'entertainment': ['movie', 'show', 'celebrity', 'actor', 'actress', 'film', 'tv', 'series', 'trailer', 'comedy'],
            'music': ['song', 'music', 'album', 'artist', 'singer', 'band', 'concert', 'performance', 'lyrics'],
            'gaming': ['game', 'gaming', 'playthrough', 'walkthrough', 'stream', 'esports', 'minecraft', 'fortnite'],
            'education': ['tutorial', 'how to', 'learn', 'education', 'course', 'lesson', 'explained', 'guide'],
            'news': ['news', 'breaking', 'update', 'report', 'coverage', 'latest', 'today'],
            'sports': ['sport', 'game', 'match', 'player', 'team', 'championship', 'highlights'],
            'technology': ['tech', 'review', 'unboxing', 'gadget', 'phone', 'computer', 'laptop', 'software']
        }
        
        # Check which category the title belongs to
        for category, keywords in categories.items():
            if any(keyword in title_lower for keyword in keywords):
                return category
        
        # Default category for titles that don't match specific categories
        return 'general'


class TikTokTrendingFetcher:
    """
    Placeholder class for fetching TikTok trending hashtags.
    
    Note: This is a placeholder implementation since TikTok doesn't provide
    a public API for trending hashtags. In a real implementation, you would
    need to use web scraping or third-party services.
    
    TODO: Implement real TikTok scraping functionality
    """
    
    def __init__(self):
        """
        Initialize the TikTok trending fetcher.
        
        This is currently a placeholder implementation that generates mock data.
        In a production environment, you would implement actual TikTok scraping.
        """
        logger.info("📱 TikTok fetcher initialized (placeholder implementation)")
    
    def fetch_trending_hashtags(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Fetch trending hashtags from TikTok (placeholder implementation).
        
        This method currently returns mock data. In a real implementation,
        you would need to:
        1. Use web scraping tools like Selenium or Playwright
        2. Navigate to TikTok's trending page
        3. Extract hashtag data from the page
        4. Handle rate limiting and anti-bot measures
        5. Implement proper error handling
        
        Args:
            limit (int): Number of hashtags to fetch (default: 10)
            
        Returns:
            List[Dict[str, Any]]: List of trending hashtag data (mock data)
        """
        try:
            logger.info(f"📱 Fetching top {limit} TikTok trending hashtags (mock data)...")
            
            # Mock data for demonstration purposes
            # In a real implementation, this would be scraped from TikTok
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
            
            # Format the mock data with additional metadata
            formatted_hashtags = []
            for index, hashtag_data in enumerate(mock_hashtags[:limit], 1):
                formatted_hashtag = {
                    'rank': index,
                    'hashtag': hashtag_data['hashtag'],
                    'view_count': hashtag_data['view_count'],
                    'video_count': hashtag_data['video_count'],
                    'trend_score': hashtag_data['trend_score'],
                    'category': hashtag_data['category'],
                    'platform': 'tiktok',
                    'fetched_at': datetime.now().isoformat()
                }
                formatted_hashtags.append(formatted_hashtag)
            
            logger.info(f"✅ Successfully fetched {len(formatted_hashtags)} TikTok trending hashtags (mock data)")
            return formatted_hashtags
            
        except Exception as e:
            logger.error(f"❌ TikTok trending fetch failed: {e}")
            return []
    
    def _scrape_tiktok_trending(self) -> List[Dict[str, Any]]:
        """
        Placeholder for actual TikTok scraping implementation.
        
        In a real implementation, you would:
        1. Use Selenium or Playwright to automate browser
        2. Navigate to TikTok's trending page
        3. Extract hashtag data from the page
        4. Handle rate limiting and anti-bot measures
        5. Implement proper error handling and retry logic
        
        Example implementation structure:
        
        from selenium import webdriver
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        
        def scrape_tiktok_trending(self):
            driver = webdriver.Chrome()
            try:
                driver.get("https://www.tiktok.com/trending")
                # Wait for page to load
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.CLASS_NAME, "trending-hashtags"))
                )
                # Extract hashtag elements
                hashtag_elements = driver.find_elements(By.CLASS_NAME, "hashtag-item")
                # Process and return data
                return self._process_hashtag_elements(hashtag_elements)
            finally:
                driver.quit()
        
        Returns:
            List[Dict[str, Any]]: List of scraped hashtag data
        """
        # This is where you would implement actual scraping
        # For now, return empty list
        return []


class TrendsDataManager:
    """
    Manages and formats all fetched trending data.
    
    This class handles:
    - Data aggregation from all platforms
    - Data formatting and presentation
    - Timestamp management
    - Output generation
    """
    
    def __init__(self):
        """
        Initialize the trends data manager.
        
        This method sets up the data manager and initializes
        the collection timestamp for this run.
        """
        self.collection_timestamp = datetime.now()
        self.all_trends = {
            'google_trends': [],
            'youtube': [],
            'tiktok': []
        }
    
    def add_platform_data(self, platform: str, data: List[Dict[str, Any]]):
        """
        Add data from a specific platform to the collection.
        
        Args:
            platform (str): Platform name (google_trends, youtube, tiktok)
            data (List[Dict[str, Any]]): Platform-specific trending data
        """
        self.all_trends[platform] = data
        logger.info(f"📊 Added {len(data)} items from {platform}")
    
    def get_summary(self) -> Dict[str, Any]:
        """
        Generate a summary of all collected trending data.
        
        Returns:
            Dict[str, Any]: Summary statistics and metadata
        """
        total_items = sum(len(data) for data in self.all_trends.values())
        
        summary = {
            'collection_timestamp': self.collection_timestamp.isoformat(),
            'collection_date': self.collection_timestamp.strftime('%Y-%m-%d'),
            'collection_time': self.collection_timestamp.strftime('%H:%M:%S'),
            'timezone': 'US/Central',
            'total_platforms': len(self.all_trends),
            'total_items': total_items,
            'platforms': {}
        }
        
        # Add platform-specific summaries
        for platform, data in self.all_trends.items():
            summary['platforms'][platform] = {
                'item_count': len(data),
                'status': 'success' if data else 'no_data'
            }
        
        return summary
    
    def print_all_trends(self):
        """
        Print all fetched trending data in a formatted way.
        
        This method displays the collected data in a user-friendly format
        with clear separation between platforms and detailed information
        for each trending item.
        """
        print("\n" + "="*80)
        print(f"🔥 TRENDING DATA COLLECTION - {self.collection_timestamp.strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*80)
        
        # Print Google Trends
        if self.all_trends['google_trends']:
            print("\n🔍 GOOGLE TRENDS:")
            print("-" * 40)
            for trend in self.all_trends['google_trends']:
                rank_emoji = "🥇" if trend['rank'] == 1 else "🥈" if trend['rank'] == 2 else "🥉" if trend['rank'] == 3 else f"#{trend['rank']}"
                viral_stars = "⭐" * trend['viral_potential']
                print(f"{rank_emoji} {trend['search_term']}")
                print(f"   📊 Category: {trend['category'].title()}")
                print(f"   {viral_stars} Viral Potential: {trend['viral_potential']}/10")
                print()
        
        # Print YouTube trending
        if self.all_trends['youtube']:
            print("\n📺 YOUTUBE TRENDING:")
            print("-" * 40)
            for video in self.all_trends['youtube']:
                rank_emoji = "🥇" if video.get('rank', 0) == 1 else "🥈" if video.get('rank', 0) == 2 else "🥉" if video.get('rank', 0) == 3 else f"#{video.get('rank', 'N/A')}"
                print(f"{rank_emoji} {video['title']}")
                print(f"   📺 Channel: {video['channel_title']}")
                print(f"   👀 Views: {video['view_count']:,}")
                print(f"   👍 Likes: {video['like_count']:,}")
                print(f"   📊 Category: {video['category'].title()}")
                print()
        
        # Print TikTok trending
        if self.all_trends['tiktok']:
            print("\n📱 TIKTOK TRENDING:")
            print("-" * 40)
            for hashtag in self.all_trends['tiktok']:
                rank_emoji = "🥇" if hashtag['rank'] == 1 else "🥈" if hashtag['rank'] == 2 else "🥉" if hashtag['rank'] == 3 else f"#{hashtag['rank']}"
                print(f"{rank_emoji} {hashtag['hashtag']}")
                print(f"   👀 Views: {hashtag['view_count']:,}")
                print(f"   📹 Videos: {hashtag['video_count']:,}")
                print(f"   📊 Trend Score: {hashtag['trend_score']:.1f}/10")
                print(f"   🏷️  Category: {hashtag['category'].title()}")
                print()
        
        # Print summary
        summary = self.get_summary()
        print("\n📈 COLLECTION SUMMARY:")
        print("-" * 40)
        print(f"🕐 Collection Time: {summary['collection_time']}")
        print(f"📊 Total Items: {summary['total_items']}")
        print(f"🌍 Platforms: {summary['total_platforms']}")
        
        for platform, info in summary['platforms'].items():
            status_emoji = "✅" if info['status'] == 'success' else "⚠️"
            print(f"   {status_emoji} {platform.title()}: {info['item_count']} items")
        
        print("\n" + "="*80)


def main():
    """
    Main function that orchestrates the entire trending data collection process.
    
    This function:
    1. Initializes all fetchers (Google Trends, YouTube, TikTok)
    2. Fetches data from each platform
    3. Aggregates and formats the data
    4. Prints the results with timestamps
    5. Handles errors gracefully
    6. Provides detailed logging throughout the process
    """
    start_time = time.time()
    
    try:
        logger.info("🚀 Starting trending data collection...")
        
        # Initialize data manager
        data_manager = TrendsDataManager()
        
        # Initialize fetchers
        google_fetcher = GoogleTrendsFetcher()
        youtube_fetcher = YouTubeTrendingFetcher()
        tiktok_fetcher = TikTokTrendingFetcher()
        
        # Fetch Google Trends data
        try:
            google_trends = google_fetcher.fetch_trending_searches(country='US', limit=10)
            data_manager.add_platform_data('google_trends', google_trends)
        except Exception as e:
            logger.error(f"❌ Google Trends collection failed: {e}")
            data_manager.add_platform_data('google_trends', [])
        
        # Fetch YouTube trending data
        try:
            youtube_trends = youtube_fetcher.fetch_trending_videos(region_code='US', max_results=10)
            data_manager.add_platform_data('youtube', youtube_trends)
        except Exception as e:
            logger.error(f"❌ YouTube trending collection failed: {e}")
            data_manager.add_platform_data('youtube', [])
        
        # Fetch TikTok trending data
        try:
            tiktok_trends = tiktok_fetcher.fetch_trending_hashtags(limit=10)
            data_manager.add_platform_data('tiktok', tiktok_trends)
        except Exception as e:
            logger.error(f"❌ TikTok trending collection failed: {e}")
            data_manager.add_platform_data('tiktok', [])
        
        # Print all collected data
        data_manager.print_all_trends()
        
        # Calculate execution time
        execution_time = time.time() - start_time
        logger.info(f"✅ Collection completed in {execution_time:.2f} seconds")
        
        # Exit with success code
        sys.exit(0)
        
    except KeyboardInterrupt:
        logger.info("⚠️ Collection interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Unexpected error during collection: {e}")
        sys.exit(1)


if __name__ == "__main__":
    """
    Entry point for the script.
    
    This block ensures the script only runs when executed directly
    (not when imported as a module). It calls the main function
    which orchestrates the entire trending data collection process.
    """
    main() 