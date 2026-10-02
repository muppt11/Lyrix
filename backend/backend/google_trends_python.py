#!/usr/bin/env python3
"""
Google Trends Data Collector
============================

This script fetches the top 10 Google trending searches in the United States
using the pytrends library and saves the data with timestamps.

Requirements:
- pytrends library: pip install pytrends
- Python 3.6+

Author: LyraLytics Team
Date: 2024
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path

# Import pytrends library for Google Trends API
try:
    from pytrends.request import TrendReq
except ImportError:
    print("❌ Error: pytrends library not found!")
    print("Please install it using: pip install pytrends")
    sys.exit(1)


class GoogleTrendsCollector:
    """
    A class to collect and manage Google Trends data.
    
    This class handles:
    - Connection to Google Trends API
    - Fetching trending searches
    - Data formatting and storage
    - Error handling and logging
    """
    
    def __init__(self, output_dir="trends_data"):
        """
        Initialize the Google Trends collector.
        
        Args:
            output_dir (str): Directory to store trend data files
        """
        self.output_dir = Path(output_dir)
        self.timestamp = datetime.now()
        
        # Create output directory if it doesn't exist
        self.output_dir.mkdir(exist_ok=True)
        
        # Initialize pytrends connection
        # pytrends uses a session to maintain connection to Google Trends
        print("🔗 Initializing Google Trends connection...")
        self.pytrends = TrendReq(hl='en-US', tz=360)  # US timezone (UTC-6)
        
        # Set up session parameters for better reliability
        self.pytrends.build_payload(kw_list=['trending'])  # Initialize session
        
        print("✅ Google Trends connection established")
    
    def fetch_trending_searches(self, country='US', limit=10):
        """
        Fetch trending searches from Google Trends.
        
        Args:
            country (str): Country code for trending searches (default: 'US')
            limit (int): Number of trending searches to fetch (default: 10)
            
        Returns:
            list: List of trending search terms
        """
        try:
            print(f"📊 Fetching top {limit} trending searches for {country}...")
            
            # Get trending searches for the specified country
            # trending_searches() returns a list of trending search terms
            trending_searches = self.pytrends.trending_searches(pn=country)
            
            # Convert to list and limit results
            trending_list = trending_searches[0].tolist()[:limit]
            
            print(f"✅ Successfully fetched {len(trending_list)} trending searches")
            return trending_list
            
        except Exception as e:
            print(f"❌ Error fetching trending searches: {str(e)}")
            return []
    
    def get_trend_details(self, search_term):
        """
        Get detailed information about a specific search term.
        
        Args:
            search_term (str): The search term to get details for
            
        Returns:
            dict: Dictionary containing trend details
        """
        try:
            # Build payload for the specific search term
            self.pytrends.build_payload(kw_list=[search_term], timeframe='now 1-d')
            
            # Get interest over time data
            interest_data = self.pytrends.interest_over_time()
            
            # Get related topics
            related_topics = self.pytrends.related_topics()
            
            # Get related queries
            related_queries = self.pytrends.related_queries()
            
            return {
                'search_term': search_term,
                'interest_data': interest_data.to_dict() if not interest_data.empty else {},
                'related_topics': related_topics,
                'related_queries': related_queries
            }
            
        except Exception as e:
            print(f"❌ Error getting details for '{search_term}': {str(e)}")
            return {'search_term': search_term, 'error': str(e)}
    
    def format_trend_data(self, trending_searches):
        """
        Format trending searches data with additional metadata.
        
        Args:
            trending_searches (list): List of trending search terms
            
        Returns:
            dict: Formatted trend data with metadata
        """
        # Create the main data structure
        trend_data = {
            'collection_timestamp': self.timestamp.isoformat(),
            'collection_date': self.timestamp.strftime('%Y-%m-%d'),
            'collection_time': self.timestamp.strftime('%H:%M:%S'),
            'timezone': 'US/Central',
            'country': 'US',
            'total_trends': len(trending_searches),
            'trends': []
        }
        
        # Add each trending search with its rank
        for index, search_term in enumerate(trending_searches, 1):
            trend_entry = {
                'rank': index,
                'search_term': search_term,
                'normalized_term': search_term.lower().replace(' ', '_'),
                'category': self.categorize_trend(search_term),
                'viral_potential': self.calculate_viral_potential(search_term)
            }
            trend_data['trends'].append(trend_entry)
        
        return trend_data
    
    def categorize_trend(self, search_term):
        """
        Categorize a search term based on its content.
        
        Args:
            search_term (str): The search term to categorize
            
        Returns:
            str: Category of the search term
        """
        term_lower = search_term.lower()
        
        # Define category keywords
        categories = {
            'entertainment': ['movie', 'show', 'celebrity', 'actor', 'actress', 'film', 'tv', 'series'],
            'sports': ['game', 'match', 'player', 'team', 'sport', 'championship', 'league'],
            'technology': ['tech', 'app', 'software', 'gadget', 'phone', 'computer', 'ai', 'robot'],
            'politics': ['election', 'president', 'vote', 'government', 'policy', 'law'],
            'business': ['stock', 'market', 'company', 'business', 'economy', 'finance'],
            'health': ['covid', 'vaccine', 'health', 'medical', 'doctor', 'hospital'],
            'education': ['school', 'university', 'student', 'education', 'learn', 'study']
        }
        
        # Check which category the term belongs to
        for category, keywords in categories.items():
            if any(keyword in term_lower for keyword in keywords):
                return category
        
        return 'general'
    
    def calculate_viral_potential(self, search_term):
        """
        Calculate viral potential score for a search term.
        
        Args:
            search_term (str): The search term to analyze
            
        Returns:
            int: Viral potential score (1-10)
        """
        score = 5  # Base score
        
        term_lower = search_term.lower()
        
        # Factors that increase viral potential
        if any(word in term_lower for word in ['viral', 'trending', 'breaking', 'news']):
            score += 2
        if any(word in term_lower for word in ['how', 'what', 'why', 'when']):
            score += 1
        if any(word in term_lower for word in ['best', 'top', 'amazing', 'incredible']):
            score += 1
        if len(search_term.split()) <= 3:  # Short terms tend to be more viral
            score += 1
        
        # Cap the score at 10
        return min(score, 10)
    
    def save_trend_data(self, trend_data, filename=None):
        """
        Save trend data to a JSON file.
        
        Args:
            trend_data (dict): The trend data to save
            filename (str, optional): Custom filename. If None, auto-generates one.
            
        Returns:
            str: Path to the saved file
        """
        try:
            # Generate filename if not provided
            if filename is None:
                timestamp_str = self.timestamp.strftime('%Y%m%d_%H%M%S')
                filename = f"google_trends_{timestamp_str}.json"
            
            # Create full file path
            file_path = self.output_dir / filename
            
            # Save data to JSON file with pretty formatting
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(trend_data, f, indent=2, ensure_ascii=False)
            
            print(f"💾 Trend data saved to: {file_path}")
            return str(file_path)
            
        except Exception as e:
            print(f"❌ Error saving trend data: {str(e)}")
            return None
    
    def print_trends(self, trend_data):
        """
        Print trending searches in a formatted way.
        
        Args:
            trend_data (dict): The trend data to print
        """
        print("\n" + "="*60)
        print(f"🔥 GOOGLE TRENDS - {trend_data['collection_date']} {trend_data['collection_time']}")
        print("="*60)
        
        for trend in trend_data['trends']:
            rank_emoji = "🥇" if trend['rank'] == 1 else "🥈" if trend['rank'] == 2 else "🥉" if trend['rank'] == 3 else f"#{trend['rank']}"
            category_emoji = {
                'entertainment': '🎬',
                'sports': '⚽',
                'technology': '💻',
                'politics': '🗳️',
                'business': '💼',
                'health': '🏥',
                'education': '📚',
                'general': '📰'
            }.get(trend['category'], '📰')
            
            viral_stars = "⭐" * trend['viral_potential']
            
            print(f"{rank_emoji} {trend['search_term']}")
            print(f"   {category_emoji} Category: {trend['category'].title()}")
            print(f"   {viral_stars} Viral Potential: {trend['viral_potential']}/10")
            print()
    
    def run_collection(self):
        """
        Main method to run the complete trend collection process.
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            print(f"🚀 Starting Google Trends collection at {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}")
            
            # Step 1: Fetch trending searches
            trending_searches = self.fetch_trending_searches(country='US', limit=10)
            
            if not trending_searches:
                print("❌ No trending searches found. Exiting.")
                return False
            
            # Step 2: Format the data
            trend_data = self.format_trend_data(trending_searches)
            
            # Step 3: Print the trends
            self.print_trends(trend_data)
            
            # Step 4: Save the data
            saved_file = self.save_trend_data(trend_data)
            
            if saved_file:
                print(f"✅ Collection completed successfully!")
                print(f"📊 Total trends collected: {len(trending_searches)}")
                print(f"💾 Data saved to: {saved_file}")
                return True
            else:
                print("❌ Failed to save trend data.")
                return False
                
        except Exception as e:
            print(f"❌ Error during collection: {str(e)}")
            return False


def main():
    """
    Main function to run the Google Trends collector.
    
    This function:
    1. Creates a GoogleTrendsCollector instance
    2. Runs the collection process
    3. Handles any errors and exits appropriately
    """
    try:
        # Create collector instance
        collector = GoogleTrendsCollector()
        
        # Run the collection
        success = collector.run_collection()
        
        # Exit with appropriate code
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("\n⚠️ Collection interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    # This block ensures the script only runs when executed directly
    # (not when imported as a module)
    main() 