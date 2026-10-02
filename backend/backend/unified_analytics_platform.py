#!/usr/bin/env python3
"""
Unified Analytics Platform
==========================

This platform unifies ecommerce analytics, social media monitoring, and task planning
into a single, intuitive interface. It empowers marketing teams to reclaim their time
and focus on meaningful, data-driven strategy.

The platform integrates:
1. Ecommerce Analytics - Sales data, customer behavior, product performance
2. Social Media Monitoring - Trending data from Google, YouTube, TikTok, Instagram
3. Task Planning - Automated task generation, priority scoring, workflow management

Requirements:
- Python 3.6+
- Various API integrations (Google Analytics, Shopify, social media APIs)
- Database for unified data storage
- Web interface for intuitive access

Author: LyraLytics Team
Date: 2024
"""

import os
import sys
import json
import time
import logging
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from pathlib import Path
from dataclasses import dataclass, asdict
from enum import Enum
import threading
import queue

# Import external libraries
try:
    from pytrends.request import TrendReq
    import requests
    from requests.adapters import HTTPAdapter
    from urllib3.util.retry import Retry
    import pandas as pd
    import numpy as np
except ImportError as e:
    print(f"❌ Error: Missing required library - {e}")
    print("Please install required libraries: pip install pytrends requests pandas numpy")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/unified_platform.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


class TaskPriority(Enum):
    """Task priority levels for automated task planning."""
    CRITICAL = 1
    HIGH = 2
    MEDIUM = 3
    LOW = 4


class TaskStatus(Enum):
    """Task status for workflow management."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


@dataclass
class EcommerceMetric:
    """Ecommerce analytics data structure."""
    metric_name: str
    value: float
    previous_value: float
    change_percentage: float
    date: datetime
    category: str
    source: str


@dataclass
class SocialMediaTrend:
    """Social media trending data structure."""
    platform: str
    content: str
    engagement_score: float
    viral_potential: int
    category: str
    timestamp: datetime
    reach_estimate: int


@dataclass
class MarketingTask:
    """Marketing task data structure."""
    task_id: str
    title: str
    description: str
    priority: TaskPriority
    status: TaskStatus
    assigned_to: str
    due_date: datetime
    created_date: datetime
    category: str
    estimated_hours: float
    dependencies: List[str]
    tags: List[str]


class UnifiedDatabase:
    """
    Unified database for storing ecommerce, social media, and task data.
    
    This class provides a single interface for all platform data,
    enabling cross-platform analytics and insights.
    """
    
    def __init__(self, db_path: str = "unified_analytics.db"):
        """Initialize unified database."""
        self.db_path = db_path
        self.connection = None
        self.init_database()
    
    def init_database(self):
        """Initialize database and create all necessary tables."""
        try:
            self.connection = sqlite3.connect(self.db_path, check_same_thread=False)
            self.connection.row_factory = sqlite3.Row
            
            # Create tables for all platform components
            self._create_ecommerce_tables()
            self._create_social_media_tables()
            self._create_task_management_tables()
            self._create_analytics_tables()
            
            logger.info(f"✅ Unified database initialized: {self.db_path}")
            
        except Exception as e:
            logger.error(f"❌ Database initialization failed: {e}")
            raise
    
    def _create_ecommerce_tables(self):
        """Create ecommerce analytics tables."""
        cursor = self.connection.cursor()
        
        # Sales data
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS ecommerce_sales (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id TEXT UNIQUE,
                product_id TEXT,
                product_name TEXT,
                category TEXT,
                quantity INTEGER,
                revenue REAL,
                cost REAL,
                profit REAL,
                customer_id TEXT,
                order_date DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Customer behavior
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS ecommerce_customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id TEXT UNIQUE,
                email TEXT,
                first_purchase_date DATETIME,
                last_purchase_date DATETIME,
                total_orders INTEGER,
                total_revenue REAL,
                average_order_value REAL,
                customer_lifetime_value REAL,
                segment TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Product performance
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS ecommerce_products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id TEXT UNIQUE,
                product_name TEXT,
                category TEXT,
                price REAL,
                cost REAL,
                inventory INTEGER,
                units_sold INTEGER,
                revenue REAL,
                profit_margin REAL,
                conversion_rate REAL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Metrics tracking
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS ecommerce_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                metric_name TEXT,
                value REAL,
                previous_value REAL,
                change_percentage REAL,
                date DATE,
                category TEXT,
                source TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
    
    def _create_social_media_tables(self):
        """Create social media monitoring tables."""
        cursor = self.connection.cursor()
        
        # Social media trends
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS social_trends (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                platform TEXT,
                content TEXT,
                engagement_score REAL,
                viral_potential INTEGER,
                category TEXT,
                reach_estimate INTEGER,
                timestamp DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Platform-specific data
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS social_platform_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                platform TEXT,
                content_id TEXT,
                title TEXT,
                description TEXT,
                views INTEGER,
                likes INTEGER,
                comments INTEGER,
                shares INTEGER,
                engagement_rate REAL,
                timestamp DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Brand mentions and sentiment
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS social_mentions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                platform TEXT,
                content TEXT,
                author TEXT,
                sentiment_score REAL,
                sentiment_label TEXT,
                reach INTEGER,
                timestamp DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
    
    def _create_task_management_tables(self):
        """Create task planning and management tables."""
        cursor = self.connection.cursor()
        
        # Marketing tasks
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS marketing_tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id TEXT UNIQUE,
                title TEXT,
                description TEXT,
                priority INTEGER,
                status TEXT,
                assigned_to TEXT,
                due_date DATETIME,
                created_date DATETIME,
                category TEXT,
                estimated_hours REAL,
                dependencies TEXT,
                tags TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Task dependencies
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS task_dependencies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id TEXT,
                dependency_id TEXT,
                dependency_type TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Task time tracking
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS task_time_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id TEXT,
                user_id TEXT,
                start_time DATETIME,
                end_time DATETIME,
                duration_minutes INTEGER,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
    
    def _create_analytics_tables(self):
        """Create unified analytics and insights tables."""
        cursor = self.connection.cursor()
        
        # Cross-platform insights
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS unified_insights (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                insight_type TEXT,
                title TEXT,
                description TEXT,
                data_source TEXT,
                confidence_score REAL,
                impact_score REAL,
                recommendation TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Performance metrics
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS performance_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                metric_name TEXT,
                value REAL,
                target REAL,
                actual REAL,
                variance REAL,
                date DATE,
                category TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Automated reports
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS automated_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_name TEXT,
                report_type TEXT,
                data_sources TEXT,
                schedule TEXT,
                last_generated DATETIME,
                next_generation DATETIME,
                recipients TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create indexes for better performance
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_sales_date ON ecommerce_sales(order_date)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_trends_timestamp ON social_trends(timestamp)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON marketing_tasks(due_date)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_metrics_date ON ecommerce_metrics(date)')
        
        self.connection.commit()
        logger.info("✅ All database tables created successfully")


class EcommerceAnalytics:
    """
    Ecommerce analytics module for tracking sales, customers, and product performance.
    
    This module provides comprehensive ecommerce insights including:
    - Sales tracking and analysis
    - Customer behavior and segmentation
    - Product performance optimization
    - Revenue and profit analysis
    """
    
    def __init__(self, db: UnifiedDatabase):
        """Initialize ecommerce analytics module."""
        self.db = db
        logger.info("✅ Ecommerce Analytics module initialized")
    
    def track_sale(self, order_data: Dict[str, Any]) -> bool:
        """
        Track a new sale in the system.
        
        Args:
            order_data: Dictionary containing order information
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            cursor = self.db.connection.cursor()
            
            cursor.execute('''
                INSERT OR REPLACE INTO ecommerce_sales 
                (order_id, product_id, product_name, category, quantity, 
                 revenue, cost, profit, customer_id, order_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                order_data.get('order_id'),
                order_data.get('product_id'),
                order_data.get('product_name'),
                order_data.get('category'),
                order_data.get('quantity', 1),
                order_data.get('revenue', 0.0),
                order_data.get('cost', 0.0),
                order_data.get('profit', 0.0),
                order_data.get('customer_id'),
                order_data.get('order_date', datetime.now())
            ))
            
            self.db.connection.commit()
            logger.info(f"✅ Sale tracked: {order_data.get('order_id')}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to track sale: {e}")
            return False
    
    def get_sales_metrics(self, days: int = 30) -> Dict[str, Any]:
        """
        Get comprehensive sales metrics for the specified period.
        
        Args:
            days: Number of days to analyze
            
        Returns:
            Dict containing sales metrics
        """
        try:
            cursor = self.db.connection.cursor()
            start_date = datetime.now() - timedelta(days=days)
            
            # Total revenue
            cursor.execute('''
                SELECT SUM(revenue) as total_revenue 
                FROM ecommerce_sales 
                WHERE order_date >= ?
            ''', (start_date,))
            total_revenue = cursor.fetchone()[0] or 0.0
            
            # Total orders
            cursor.execute('''
                SELECT COUNT(DISTINCT order_id) as total_orders 
                FROM ecommerce_sales 
                WHERE order_date >= ?
            ''', (start_date,))
            total_orders = cursor.fetchone()[0] or 0
            
            # Average order value
            avg_order_value = total_revenue / total_orders if total_orders > 0 else 0.0
            
            # Top performing categories
            cursor.execute('''
                SELECT category, SUM(revenue) as category_revenue 
                FROM ecommerce_sales 
                WHERE order_date >= ? 
                GROUP BY category 
                ORDER BY category_revenue DESC 
                LIMIT 5
            ''', (start_date,))
            top_categories = [dict(row) for row in cursor.fetchall()]
            
            # Customer acquisition
            cursor.execute('''
                SELECT COUNT(DISTINCT customer_id) as new_customers 
                FROM ecommerce_sales 
                WHERE order_date >= ? 
                AND customer_id NOT IN (
                    SELECT DISTINCT customer_id 
                    FROM ecommerce_sales 
                    WHERE order_date < ?
                )
            ''', (start_date, start_date))
            new_customers = cursor.fetchone()[0] or 0
            
            return {
                'total_revenue': total_revenue,
                'total_orders': total_orders,
                'average_order_value': avg_order_value,
                'new_customers': new_customers,
                'top_categories': top_categories,
                'period_days': days
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to get sales metrics: {e}")
            return {}
    
    def analyze_customer_behavior(self) -> Dict[str, Any]:
        """
        Analyze customer behavior patterns and segmentation.
        
        Returns:
            Dict containing customer behavior insights
        """
        try:
            cursor = self.db.connection.cursor()
            
            # Customer segments
            cursor.execute('''
                SELECT 
                    CASE 
                        WHEN total_revenue >= 1000 THEN 'VIP'
                        WHEN total_revenue >= 500 THEN 'Premium'
                        WHEN total_revenue >= 100 THEN 'Regular'
                        ELSE 'New'
                    END as segment,
                    COUNT(*) as customer_count,
                    AVG(total_revenue) as avg_revenue
                FROM ecommerce_customers 
                GROUP BY segment
            ''')
            segments = [dict(row) for row in cursor.fetchall()]
            
            # Purchase frequency
            cursor.execute('''
                SELECT 
                    AVG(total_orders) as avg_orders_per_customer,
                    AVG(average_order_value) as avg_order_value,
                    AVG(customer_lifetime_value) as avg_clv
                FROM ecommerce_customers
            ''')
            behavior_metrics = dict(cursor.fetchone())
            
            return {
                'customer_segments': segments,
                'behavior_metrics': behavior_metrics
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to analyze customer behavior: {e}")
            return {}


class SocialMediaMonitor:
    """
    Social media monitoring module for tracking trends and engagement.
    
    This module provides comprehensive social media insights including:
    - Multi-platform trend tracking
    - Engagement analysis
    - Viral potential scoring
    - Brand mention monitoring
    """
    
    def __init__(self, db: UnifiedDatabase):
        """Initialize social media monitoring module."""
        self.db = db
        self.google_trends = TrendReq(hl='en-US', tz=360)
        self.google_trends.build_payload(kw_list=['trending'])
        logger.info("✅ Social Media Monitor initialized")
    
    def fetch_all_trends(self) -> Dict[str, List[SocialMediaTrend]]:
        """
        Fetch trending data from all social media platforms.
        
        Returns:
            Dict containing trends from all platforms
        """
        trends = {
            'google_trends': self._fetch_google_trends(),
            'youtube': self._fetch_youtube_trends(),
            'tiktok': self._fetch_tiktok_trends(),
            'instagram': self._fetch_instagram_trends()
        }
        
        # Store trends in database
        for platform, platform_trends in trends.items():
            for trend in platform_trends:
                self._store_trend(trend)
        
        return trends
    
    def _fetch_google_trends(self) -> List[SocialMediaTrend]:
        """Fetch Google Trends data."""
        try:
            trending_searches = self.google_trends.trending_searches(pn='US')
            trends = []
            
            for index, search_term in enumerate(trending_searches[0].tolist()[:10], 1):
                trend = SocialMediaTrend(
                    platform='google_trends',
                    content=search_term,
                    engagement_score=self._calculate_engagement_score(search_term),
                    viral_potential=self._calculate_viral_potential(search_term),
                    category=self._categorize_content(search_term),
                    timestamp=datetime.now(),
                    reach_estimate=1000000 - (index * 50000)  # Mock reach data
                )
                trends.append(trend)
            
            logger.info(f"✅ Fetched {len(trends)} Google Trends")
            return trends
            
        except Exception as e:
            logger.error(f"❌ Failed to fetch Google Trends: {e}")
            return []
    
    def _fetch_youtube_trends(self) -> List[SocialMediaTrend]:
        """Fetch YouTube trending data (placeholder)."""
        # Placeholder implementation - would integrate with YouTube Data API
        mock_trends = [
            SocialMediaTrend(
                platform='youtube',
                content='Viral Video Title',
                engagement_score=8.5,
                viral_potential=9,
                category='entertainment',
                timestamp=datetime.now(),
                reach_estimate=500000
            )
        ]
        return mock_trends
    
    def _fetch_tiktok_trends(self) -> List[SocialMediaTrend]:
        """Fetch TikTok trending data (placeholder)."""
        # Placeholder implementation - would integrate with TikTok API
        mock_trends = [
            SocialMediaTrend(
                platform='tiktok',
                content='#viral',
                engagement_score=9.0,
                viral_potential=10,
                category='entertainment',
                timestamp=datetime.now(),
                reach_estimate=1000000
            )
        ]
        return mock_trends
    
    def _fetch_instagram_trends(self) -> List[SocialMediaTrend]:
        """Fetch Instagram trending data (placeholder)."""
        # Placeholder implementation - would integrate with Instagram Graph API
        mock_trends = [
            SocialMediaTrend(
                platform='instagram',
                content='Trending Hashtag',
                engagement_score=7.5,
                viral_potential=8,
                category='lifestyle',
                timestamp=datetime.now(),
                reach_estimate=750000
            )
        ]
        return mock_trends
    
    def _store_trend(self, trend: SocialMediaTrend):
        """Store trend data in database."""
        try:
            cursor = self.db.connection.cursor()
            cursor.execute('''
                INSERT INTO social_trends 
                (platform, content, engagement_score, viral_potential, 
                 category, reach_estimate, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                trend.platform,
                trend.content,
                trend.engagement_score,
                trend.viral_potential,
                trend.category,
                trend.reach_estimate,
                trend.timestamp
            ))
            self.db.connection.commit()
            
        except Exception as e:
            logger.error(f"❌ Failed to store trend: {e}")
    
    def _calculate_engagement_score(self, content: str) -> float:
        """Calculate engagement score for content."""
        # Mock implementation - would use real engagement metrics
        base_score = 5.0
        if any(word in content.lower() for word in ['viral', 'trending', 'breaking']):
            base_score += 2.0
        if len(content.split()) <= 3:
            base_score += 1.0
        return min(base_score, 10.0)
    
    def _calculate_viral_potential(self, content: str) -> int:
        """Calculate viral potential score."""
        score = 5
        if any(word in content.lower() for word in ['viral', 'trending', 'breaking']):
            score += 2
        if any(word in content.lower() for word in ['how', 'what', 'why']):
            score += 1
        return min(score, 10)
    
    def _categorize_content(self, content: str) -> str:
        """Categorize content based on keywords."""
        content_lower = content.lower()
        categories = {
            'entertainment': ['movie', 'show', 'celebrity', 'actor'],
            'sports': ['game', 'match', 'player', 'team'],
            'technology': ['tech', 'app', 'software', 'gadget'],
            'politics': ['election', 'president', 'vote', 'government'],
            'business': ['stock', 'market', 'company', 'business']
        }
        
        for category, keywords in categories.items():
            if any(keyword in content_lower for keyword in keywords):
                return category
        return 'general'


class TaskPlanner:
    """
    Task planning and management module for marketing teams.
    
    This module provides intelligent task planning including:
    - Automated task generation based on analytics
    - Priority scoring and workflow management
    - Resource allocation and time tracking
    - Cross-platform task dependencies
    """
    
    def __init__(self, db: UnifiedDatabase):
        """Initialize task planning module."""
        self.db = db
        logger.info("✅ Task Planner initialized")
    
    def generate_tasks_from_analytics(self, ecommerce_data: Dict, social_data: Dict) -> List[MarketingTask]:
        """
        Automatically generate marketing tasks based on analytics data.
        
        Args:
            ecommerce_data: Ecommerce analytics data
            social_data: Social media monitoring data
            
        Returns:
            List of generated marketing tasks
        """
        tasks = []
        
        # Generate tasks based on ecommerce performance
        if ecommerce_data.get('total_revenue', 0) < 10000:
            tasks.append(self._create_task(
                title="Increase Revenue Campaign",
                description="Revenue is below target. Implement promotional campaigns.",
                priority=TaskPriority.HIGH,
                category="revenue_optimization",
                estimated_hours=8.0
            ))
        
        # Generate tasks based on social media trends
        high_engagement_trends = [
            trend for trend in social_data.get('google_trends', [])
            if trend.engagement_score > 8.0
        ]
        
        if high_engagement_trends:
            tasks.append(self._create_task(
                title="Capitalize on Trending Topics",
                description=f"High engagement trends detected: {', '.join([t.content for t in high_engagement_trends[:3]])}",
                priority=TaskPriority.MEDIUM,
                category="content_creation",
                estimated_hours=4.0
            ))
        
        # Generate tasks based on customer behavior
        if ecommerce_data.get('new_customers', 0) < 50:
            tasks.append(self._create_task(
                title="Customer Acquisition Campaign",
                description="New customer acquisition is low. Implement lead generation strategies.",
                priority=TaskPriority.HIGH,
                category="customer_acquisition",
                estimated_hours=6.0
            ))
        
        # Store tasks in database
        for task in tasks:
            self._store_task(task)
        
        return tasks
    
    def _create_task(self, title: str, description: str, priority: TaskPriority, 
                    category: str, estimated_hours: float) -> MarketingTask:
        """Create a new marketing task."""
        return MarketingTask(
            task_id=f"task_{int(time.time())}_{len(title.split())}",
            title=title,
            description=description,
            priority=priority,
            status=TaskStatus.PENDING,
            assigned_to="",
            due_date=datetime.now() + timedelta(days=7),
            created_date=datetime.now(),
            category=category,
            estimated_hours=estimated_hours,
            dependencies=[],
            tags=[category, "auto_generated"]
        )
    
    def _store_task(self, task: MarketingTask):
        """Store task in database."""
        try:
            cursor = self.db.connection.cursor()
            cursor.execute('''
                INSERT INTO marketing_tasks 
                (task_id, title, description, priority, status, assigned_to,
                 due_date, created_date, category, estimated_hours, dependencies, tags)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                task.task_id,
                task.title,
                task.description,
                task.priority.value,
                task.status.value,
                task.assigned_to,
                task.due_date,
                task.created_date,
                task.category,
                task.estimated_hours,
                json.dumps(task.dependencies),
                json.dumps(task.tags)
            ))
            self.db.connection.commit()
            
        except Exception as e:
            logger.error(f"❌ Failed to store task: {e}")
    
    def get_task_workload(self) -> Dict[str, Any]:
        """
        Get current task workload and resource allocation.
        
        Returns:
            Dict containing workload analysis
        """
        try:
            cursor = self.db.connection.cursor()
            
            # Task status distribution
            cursor.execute('''
                SELECT status, COUNT(*) as count 
                FROM marketing_tasks 
                GROUP BY status
            ''')
            status_distribution = [dict(row) for row in cursor.fetchall()]
            
            # Priority distribution
            cursor.execute('''
                SELECT priority, COUNT(*) as count 
                FROM marketing_tasks 
                GROUP BY priority
            ''')
            priority_distribution = [dict(row) for row in cursor.fetchall()]
            
            # Category workload
            cursor.execute('''
                SELECT category, COUNT(*) as task_count, 
                       SUM(estimated_hours) as total_hours 
                FROM marketing_tasks 
                WHERE status != 'completed' 
                GROUP BY category
            ''')
            category_workload = [dict(row) for row in cursor.fetchall()]
            
            return {
                'status_distribution': status_distribution,
                'priority_distribution': priority_distribution,
                'category_workload': category_workload
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to get task workload: {e}")
            return {}


class UnifiedAnalytics:
    """
    Unified analytics engine that combines all platform data.
    
    This module provides cross-platform insights and recommendations:
    - Correlation analysis between ecommerce and social media
    - Performance optimization recommendations
    - Automated reporting and alerts
    - Strategic insights for marketing teams
    """
    
    def __init__(self, db: UnifiedDatabase):
        """Initialize unified analytics engine."""
        self.db = db
        logger.info("✅ Unified Analytics engine initialized")
    
    def generate_unified_insights(self, ecommerce_data: Dict, social_data: Dict, 
                                task_data: Dict) -> List[Dict[str, Any]]:
        """
        Generate unified insights across all platform data.
        
        Args:
            ecommerce_data: Ecommerce analytics data
            social_data: Social media monitoring data
            task_data: Task planning data
            
        Returns:
            List of unified insights
        """
        insights = []
        
        # Revenue vs Social Media Correlation
        if ecommerce_data.get('total_revenue', 0) > 0:
            high_engagement_count = len([
                trend for trend in social_data.get('google_trends', [])
                if trend.engagement_score > 7.0
            ])
            
            if high_engagement_count > 5:
                insights.append({
                    'type': 'correlation',
                    'title': 'High Social Engagement Correlates with Revenue',
                    'description': f'Found {high_engagement_count} high-engagement trends during period of ${ecommerce_data["total_revenue"]:,.2f} revenue',
                    'confidence_score': 0.85,
                    'impact_score': 0.8,
                    'recommendation': 'Increase social media content creation during high-trending periods'
                })
        
        # Task Efficiency Analysis
        pending_tasks = len([task for task in task_data.get('status_distribution', []) 
                           if task.get('status') == 'pending'])
        
        if pending_tasks > 10:
            insights.append({
                'type': 'efficiency',
                'title': 'High Task Backlog Detected',
                'description': f'{pending_tasks} tasks are pending, indicating potential resource constraints',
                'confidence_score': 0.9,
                'impact_score': 0.7,
                'recommendation': 'Review task priorities and consider resource reallocation'
            })
        
        # Customer Acquisition Opportunity
        if ecommerce_data.get('new_customers', 0) < 50:
            viral_trends = [
                trend for trend in social_data.get('google_trends', [])
                if trend.viral_potential > 8
            ]
            
            if viral_trends:
                insights.append({
                    'type': 'opportunity',
                    'title': 'Viral Trends Present Customer Acquisition Opportunity',
                    'description': f'Found {len(viral_trends)} viral trends that could be leveraged for customer acquisition',
                    'confidence_score': 0.75,
                    'impact_score': 0.9,
                    'recommendation': 'Create content around viral trends to attract new customers'
                })
        
        # Store insights in database
        for insight in insights:
            self._store_insight(insight)
        
        return insights
    
    def _store_insight(self, insight: Dict[str, Any]):
        """Store insight in database."""
        try:
            cursor = self.db.connection.cursor()
            cursor.execute('''
                INSERT INTO unified_insights 
                (insight_type, title, description, data_source, 
                 confidence_score, impact_score, recommendation)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                insight['type'],
                insight['title'],
                insight['description'],
                'unified_analytics',
                insight['confidence_score'],
                insight['impact_score'],
                insight['recommendation']
            ))
            self.db.connection.commit()
            
        except Exception as e:
            logger.error(f"❌ Failed to store insight: {e}")
    
    def generate_performance_report(self) -> Dict[str, Any]:
        """
        Generate comprehensive performance report.
        
        Returns:
            Dict containing unified performance metrics
        """
        try:
            cursor = self.db.connection.cursor()
            
            # Get latest metrics
            cursor.execute('''
                SELECT metric_name, value, target, actual, variance 
                FROM performance_metrics 
                ORDER BY date DESC 
                LIMIT 20
            ''')
            metrics = [dict(row) for row in cursor.fetchall()]
            
            # Get recent insights
            cursor.execute('''
                SELECT title, description, confidence_score, impact_score 
                FROM unified_insights 
                ORDER BY created_at DESC 
                LIMIT 10
            ''')
            insights = [dict(row) for row in cursor.fetchall()]
            
            return {
                'performance_metrics': metrics,
                'recent_insights': insights,
                'report_generated': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to generate performance report: {e}")
            return {}


class UnifiedAnalyticsPlatform:
    """
    Main unified analytics platform that orchestrates all components.
    
    This platform provides a single, intuitive interface for:
    - Ecommerce analytics and optimization
    - Social media monitoring and trend analysis
    - Task planning and workflow management
    - Cross-platform insights and recommendations
    """
    
    def __init__(self):
        """Initialize the unified analytics platform."""
        self.db = UnifiedDatabase()
        self.ecommerce = EcommerceAnalytics(self.db)
        self.social_media = SocialMediaMonitor(self.db)
        self.task_planner = TaskPlanner(self.db)
        self.analytics = UnifiedAnalytics(self.db)
        
        logger.info("🚀 Unified Analytics Platform initialized")
    
    def run_full_analysis(self) -> Dict[str, Any]:
        """
        Run comprehensive analysis across all platform components.
        
        Returns:
            Dict containing unified analysis results
        """
        logger.info("🔄 Starting unified platform analysis...")
        
        # Collect ecommerce data
        ecommerce_data = self.ecommerce.get_sales_metrics()
        customer_behavior = self.ecommerce.analyze_customer_behavior()
        
        # Collect social media data
        social_data = self.social_media.fetch_all_trends()
        
        # Generate tasks based on analytics
        tasks = self.task_planner.generate_tasks_from_analytics(ecommerce_data, social_data)
        task_workload = self.task_planner.get_task_workload()
        
        # Generate unified insights
        insights = self.analytics.generate_unified_insights(
            ecommerce_data, social_data, task_workload
        )
        
        # Generate performance report
        performance_report = self.analytics.generate_performance_report()
        
        # Compile unified results
        results = {
            'ecommerce': {
                'sales_metrics': ecommerce_data,
                'customer_behavior': customer_behavior
            },
            'social_media': {
                'trends': social_data,
                'platforms': list(social_data.keys())
            },
            'task_management': {
                'generated_tasks': len(tasks),
                'workload': task_workload
            },
            'unified_insights': {
                'insights': insights,
                'performance_report': performance_report
            },
            'analysis_timestamp': datetime.now().isoformat()
        }
        
        logger.info("✅ Unified platform analysis completed")
        return results
    
    def print_unified_dashboard(self, results: Dict[str, Any]):
        """
        Print unified dashboard with all platform data.
        
        Args:
            results: Unified analysis results
        """
        print("\n" + "="*100)
        print("🎯 UNIFIED ANALYTICS PLATFORM DASHBOARD")
        print("="*100)
        print(f"📅 Analysis Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        
        # Ecommerce Section
        print("🛒 ECOMMERCE ANALYTICS")
        print("-" * 50)
        ecommerce = results.get('ecommerce', {})
        sales_metrics = ecommerce.get('sales_metrics', {})
        
        print(f"💰 Total Revenue: ${sales_metrics.get('total_revenue', 0):,.2f}")
        print(f"📦 Total Orders: {sales_metrics.get('total_orders', 0):,}")
        print(f"🛍️  Average Order Value: ${sales_metrics.get('average_order_value', 0):,.2f}")
        print(f"👥 New Customers: {sales_metrics.get('new_customers', 0):,}")
        print()
        
        # Social Media Section
        print("📱 SOCIAL MEDIA MONITORING")
        print("-" * 50)
        social_media = results.get('social_media', {})
        trends = social_media.get('trends', {})
        
        for platform, platform_trends in trends.items():
            if platform_trends:
                print(f"📊 {platform.upper()}: {len(platform_trends)} trending items")
                for trend in platform_trends[:3]:  # Show top 3
                    print(f"   • {trend.content} (Score: {trend.engagement_score:.1f})")
        print()
        
        # Task Management Section
        print("📋 TASK PLANNING & MANAGEMENT")
        print("-" * 50)
        task_management = results.get('task_management', {})
        workload = task_management.get('workload', {})
        
        print(f"✅ Generated Tasks: {task_management.get('generated_tasks', 0)}")
        if workload.get('status_distribution'):
            for status in workload['status_distribution']:
                print(f"   📌 {status['status']}: {status['count']} tasks")
        print()
        
        # Unified Insights Section
        print("🧠 UNIFIED INSIGHTS & RECOMMENDATIONS")
        print("-" * 50)
        insights = results.get('unified_insights', {}).get('insights', [])
        
        for insight in insights[:5]:  # Show top 5 insights
            print(f"💡 {insight['title']}")
            print(f"   📝 {insight['description']}")
            print(f"   🎯 Recommendation: {insight['recommendation']}")
            print(f"   📊 Confidence: {insight['confidence_score']:.1%}")
            print()
        
        print("="*100)
        print("🎉 Platform analysis complete! Marketing teams can now focus on data-driven strategy.")
        print("="*100)


def main():
    """
    Main function to run the unified analytics platform.
    
    This function demonstrates the platform's ability to unify ecommerce analytics,
    social media monitoring, and task planning into a single, intuitive interface.
    """
    try:
        logger.info("🚀 Starting Unified Analytics Platform...")
        
        # Initialize platform
        platform = UnifiedAnalyticsPlatform()
        
        # Run comprehensive analysis
        results = platform.run_full_analysis()
        
        # Display unified dashboard
        platform.print_unified_dashboard(results)
        
        logger.info("✅ Unified Analytics Platform completed successfully")
        
    except KeyboardInterrupt:
        logger.info("⚠️ Platform analysis interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Platform analysis failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    """
    Entry point for the Unified Analytics Platform.
    
    This platform unifies ecommerce analytics, social media monitoring, and task planning
    into a single, intuitive interface, empowering marketing teams to reclaim their time
    and focus on meaningful, data-driven strategy.
    """
    main() 