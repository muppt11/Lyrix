const { google } = require('googleapis');
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const moment = require('moment');
const _ = require('lodash');
require('dotenv').config();

class YouTubeTrending {
  constructor() {
    this.youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY
    });
    
    this.regions = {
      US: 'US',
      GB: 'GB',
      CA: 'CA',
      AU: 'AU',
      IN: 'IN',
      BR: 'BR',
      DE: 'DE',
      FR: 'FR',
      JP: 'JP',
      KR: 'KR'
    };
    
    this.categories = {
      '1': 'Film & Animation',
      '2': 'Autos & Vehicles',
      '10': 'Music',
      '15': 'Pets & Animals',
      '17': 'Sports',
      '19': 'Travel & Events',
      '20': 'Gaming',
      '22': 'People & Blogs',
      '23': 'Comedy',
      '24': 'Entertainment',
      '25': 'News & Politics',
      '26': 'Howto & Style',
      '27': 'Education',
      '28': 'Science & Technology',
      '29': 'Nonprofits & Activism'
    };
    
    this.browser = null;
  }

  async initialize() {
    console.log('🎬 Initializing YouTube Trending Videos...');
    try {
      // Initialize browser for scraping
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      console.log('✅ YouTube Trending initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing YouTube Trending:', error);
    }
  }

  async getTrendingVideos(region = 'US', category = null, maxResults = 50) {
    console.log(`📈 Fetching trending videos for region: ${region}`);
    
    try {
      // Try API first
      const apiResults = await this.getTrendingViaAPI(region, category, maxResults);
      if (apiResults && apiResults.length > 0) {
        return {
          source: 'api',
          region,
          category,
          count: apiResults.length,
          videos: apiResults,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.log('⚠️ API failed, trying web scraping...');
    }

    // Fallback to web scraping
    try {
      const scrapeResults = await this.getTrendingViaScraping(region, category, maxResults);
      return {
        source: 'scraping',
        region,
        category,
        count: scrapeResults.length,
        videos: scrapeResults,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to fetch trending videos: ${error.message}`);
    }
  }

  async getTrendingViaAPI(region = 'US', category = null, maxResults = 50) {
    const params = {
      part: 'snippet,statistics,contentDetails',
      chart: 'mostPopular',
      regionCode: region,
      maxResults: Math.min(maxResults, 50), // API limit
      videoCategoryId: category || undefined
    };

    try {
      const response = await this.youtube.videos.list(params);
      
      if (!response.data.items) {
        throw new Error('No trending videos found via API');
      }

      return response.data.items.map(video => this.formatVideoData(video));
    } catch (error) {
      console.error('API Error:', error.message);
      throw error;
    }
  }

  async getTrendingViaScraping(region = 'US', category = null, maxResults = 50) {
    if (!this.browser) {
      throw new Error('Browser not initialized for scraping');
    }

    const page = await this.browser.newPage();
    
    try {
      // Set user agent to avoid detection
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Navigate to YouTube trending page
      const url = this.getTrendingURL(region, category);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for content to load
      await page.waitForSelector('#content', { timeout: 10000 });
      
      // Extract trending videos
      const videos = await page.evaluate((maxResults) => {
        const videoElements = document.querySelectorAll('#content ytd-video-renderer, #content ytd-rich-grid-media');
        const videos = [];
        
        for (let i = 0; i < Math.min(videoElements.length, maxResults); i++) {
          const element = videoElements[i];
          
          try {
            // Extract video data
            const titleElement = element.querySelector('#video-title, #video-title-link');
            const channelElement = element.querySelector('#channel-name, #channel-name a');
            const viewsElement = element.querySelector('#metadata-line, #metadata');
            const thumbnailElement = element.querySelector('#thumbnail img, #img');
            const durationElement = element.querySelector('#text, .ytd-thumbnail-overlay-time-status-renderer');
            const linkElement = element.querySelector('#video-title-link, a#thumbnail');
            
            if (titleElement && channelElement) {
              const title = titleElement.textContent.trim();
              const channel = channelElement.textContent.trim();
              const views = viewsElement ? viewsElement.textContent.trim() : 'Unknown views';
              const thumbnail = thumbnailElement ? thumbnailElement.src : '';
              const duration = durationElement ? durationElement.textContent.trim() : '';
              const videoId = linkElement ? this.extractVideoId(linkElement.href) : '';
              
              videos.push({
                id: videoId,
                title,
                channelTitle: channel,
                viewCount: views,
                thumbnail: thumbnail,
                duration,
                publishedAt: new Date().toISOString(), // Approximate
                description: '',
                tags: [],
                categoryId: '0',
                defaultLanguage: 'en',
                defaultAudioLanguage: 'en',
                liveBroadcastContent: 'none',
                trending: true
              });
            }
          } catch (error) {
            console.log('Error extracting video data:', error);
          }
        }
        
        return videos;
      }, maxResults);
      
      return videos;
    } catch (error) {
      console.error('Scraping Error:', error.message);
      throw error;
    } finally {
      await page.close();
    }
  }

  getTrendingURL(region, category) {
    let url = 'https://www.youtube.com/feed/trending';
    
    if (region && region !== 'US') {
      url += `?gl=${region}`;
    }
    
    if (category) {
      url += url.includes('?') ? '&' : '?';
      url += `category=${category}`;
    }
    
    return url;
  }

  extractVideoId(url) {
    if (!url) return '';
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : '';
  }

  formatVideoData(video) {
    return {
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      channelTitle: video.snippet.channelTitle,
      channelId: video.snippet.channelId,
      publishedAt: video.snippet.publishedAt,
      thumbnails: video.snippet.thumbnails,
      tags: video.snippet.tags || [],
      categoryId: video.snippet.categoryId,
      defaultLanguage: video.snippet.defaultLanguage,
      defaultAudioLanguage: video.snippet.defaultAudioLanguage,
      liveBroadcastContent: video.snippet.liveBroadcastContent,
      viewCount: video.statistics?.viewCount || '0',
      likeCount: video.statistics?.likeCount || '0',
      commentCount: video.statistics?.commentCount || '0',
      duration: video.contentDetails?.duration || '',
      trending: true,
      trendingScore: this.calculateTrendingScore(video)
    };
  }

  calculateTrendingScore(video) {
    let score = 0;
    
    // View count weight
    const views = parseInt(video.statistics?.viewCount || 0);
    score += Math.log10(views + 1) * 10;
    
    // Like count weight
    const likes = parseInt(video.statistics?.likeCount || 0);
    score += Math.log10(likes + 1) * 5;
    
    // Comment count weight
    const comments = parseInt(video.statistics?.commentCount || 0);
    score += Math.log10(comments + 1) * 3;
    
    // Recency weight (newer videos get higher scores)
    const publishedAt = new Date(video.snippet.publishedAt);
    const now = new Date();
    const hoursSincePublished = (now - publishedAt) / (1000 * 60 * 60);
    score += Math.max(0, 24 - hoursSincePublished) * 2;
    
    return Math.round(score);
  }

  async getTrendingByCategory(categoryId, region = 'US', maxResults = 20) {
    console.log(`📊 Fetching trending videos for category: ${this.categories[categoryId] || categoryId}`);
    
    try {
      const videos = await this.getTrendingVideos(region, categoryId, maxResults);
      
      // Add category analysis
      const categoryAnalysis = this.analyzeCategoryTrends(videos.videos, categoryId);
      
      return {
        ...videos,
        category: this.categories[categoryId] || categoryId,
        analysis: categoryAnalysis
      };
    } catch (error) {
      throw new Error(`Failed to fetch trending videos for category ${categoryId}: ${error.message}`);
    }
  }

  async getTrendingByRegion(region, maxResults = 30) {
    console.log(`🌍 Fetching trending videos for region: ${region}`);
    
    try {
      const videos = await this.getTrendingVideos(region, null, maxResults);
      
      // Add regional analysis
      const regionalAnalysis = this.analyzeRegionalTrends(videos.videos, region);
      
      return {
        ...videos,
        regionalAnalysis
      };
    } catch (error) {
      throw new Error(`Failed to fetch trending videos for region ${region}: ${error.message}`);
    }
  }

  async getGlobalTrending(maxResults = 100) {
    console.log('🌐 Fetching global trending videos');
    
    try {
      const regions = Object.keys(this.regions);
      const allVideos = [];
      
      // Fetch trending videos from multiple regions
      for (const region of regions.slice(0, 5)) { // Limit to 5 regions to avoid rate limits
        try {
          const regionVideos = await this.getTrendingVideos(region, null, Math.ceil(maxResults / 5));
          allVideos.push(...regionVideos.videos);
        } catch (error) {
          console.log(`Failed to fetch trending for region ${region}:`, error.message);
        }
      }
      
      // Remove duplicates and sort by trending score
      const uniqueVideos = this.removeDuplicateVideos(allVideos);
      const sortedVideos = uniqueVideos.sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0));
      
      const globalAnalysis = this.analyzeGlobalTrends(sortedVideos.slice(0, maxResults));
      
      return {
        source: 'global',
        count: sortedVideos.length,
        videos: sortedVideos.slice(0, maxResults),
        analysis: globalAnalysis,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to fetch global trending videos: ${error.message}`);
    }
  }

  removeDuplicateVideos(videos) {
    const seen = new Set();
    return videos.filter(video => {
      const duplicate = seen.has(video.id);
      seen.add(video.id);
      return !duplicate;
    });
  }

  analyzeCategoryTrends(videos, categoryId) {
    const analysis = {
      category: this.categories[categoryId] || categoryId,
      totalVideos: videos.length,
      averageViews: 0,
      averageLikes: 0,
      averageComments: 0,
      topChannels: [],
      commonThemes: [],
      averageDuration: '',
      trendingPatterns: []
    };

    if (videos.length === 0) return analysis;

    // Calculate averages
    const totalViews = videos.reduce((sum, video) => sum + parseInt(video.viewCount || 0), 0);
    const totalLikes = videos.reduce((sum, video) => sum + parseInt(video.likeCount || 0), 0);
    const totalComments = videos.reduce((sum, video) => sum + parseInt(video.commentCount || 0), 0);

    analysis.averageViews = Math.round(totalViews / videos.length);
    analysis.averageLikes = Math.round(totalLikes / videos.length);
    analysis.averageComments = Math.round(totalComments / videos.length);

    // Find top channels
    const channelCounts = {};
    videos.forEach(video => {
      const channel = video.channelTitle;
      channelCounts[channel] = (channelCounts[channel] || 0) + 1;
    });

    analysis.topChannels = Object.entries(channelCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([channel, count]) => ({ channel, videos: count }));

    // Extract common themes from titles
    const words = videos.flatMap(video => 
      video.title.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3)
    );

    const wordCounts = {};
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    analysis.commonThemes = Object.entries(wordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    return analysis;
  }

  analyzeRegionalTrends(videos, region) {
    const analysis = {
      region,
      totalVideos: videos.length,
      averageViews: 0,
      averageLikes: 0,
      averageComments: 0,
      topCategories: [],
      languageDistribution: {},
      uploadTimePatterns: []
    };

    if (videos.length === 0) return analysis;

    // Calculate averages
    const totalViews = videos.reduce((sum, video) => sum + parseInt(video.viewCount || 0), 0);
    const totalLikes = videos.reduce((sum, video) => sum + parseInt(video.likeCount || 0), 0);
    const totalComments = videos.reduce((sum, video) => sum + parseInt(video.commentCount || 0), 0);

    analysis.averageViews = Math.round(totalViews / videos.length);
    analysis.averageLikes = Math.round(totalLikes / videos.length);
    analysis.averageComments = Math.round(totalComments / videos.length);

    // Analyze categories
    const categoryCounts = {};
    videos.forEach(video => {
      const category = this.categories[video.categoryId] || 'Unknown';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    analysis.topCategories = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, videos: count }));

    // Analyze languages
    videos.forEach(video => {
      const language = video.defaultLanguage || video.defaultAudioLanguage || 'Unknown';
      analysis.languageDistribution[language] = (analysis.languageDistribution[language] || 0) + 1;
    });

    return analysis;
  }

  analyzeGlobalTrends(videos) {
    const analysis = {
      totalVideos: videos.length,
      regions: new Set(),
      categories: new Set(),
      averageViews: 0,
      averageLikes: 0,
      averageComments: 0,
      topGlobalChannels: [],
      crossRegionalTrends: [],
      viralContent: []
    };

    if (videos.length === 0) return analysis;

    // Calculate averages
    const totalViews = videos.reduce((sum, video) => sum + parseInt(video.viewCount || 0), 0);
    const totalLikes = videos.reduce((sum, video) => sum + parseInt(video.likeCount || 0), 0);
    const totalComments = videos.reduce((sum, video) => sum + parseInt(video.commentCount || 0), 0);

    analysis.averageViews = Math.round(totalViews / videos.length);
    analysis.averageLikes = Math.round(totalLikes / videos.length);
    analysis.averageComments = Math.round(totalComments / videos.length);

    // Find top global channels
    const channelCounts = {};
    videos.forEach(video => {
      const channel = video.channelTitle;
      channelCounts[channel] = (channelCounts[channel] || 0) + 1;
    });

    analysis.topGlobalChannels = Object.entries(channelCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([channel, count]) => ({ channel, videos: count }));

    // Identify viral content (high engagement)
    analysis.viralContent = videos
      .filter(video => {
        const views = parseInt(video.viewCount || 0);
        const likes = parseInt(video.likeCount || 0);
        return views > 1000000 && likes > 100000; // 1M+ views, 100K+ likes
      })
      .slice(0, 10)
      .map(video => ({
        id: video.id,
        title: video.title,
        channelTitle: video.channelTitle,
        viewCount: video.viewCount,
        likeCount: video.likeCount,
        trendingScore: video.trendingScore
      }));

    return analysis;
  }

  async getTrendingInsights(region = 'US', category = null) {
    console.log('🧠 Generating trending insights...');
    
    try {
      const trendingData = await this.getTrendingVideos(region, category, 50);
      const insights = {
        summary: this.generateTrendingSummary(trendingData.videos),
        opportunities: this.identifyOpportunities(trendingData.videos),
        recommendations: this.generateRecommendations(trendingData.videos),
        trends: this.identifyTrends(trendingData.videos),
        timestamp: new Date().toISOString()
      };

      return {
        ...trendingData,
        insights
      };
    } catch (error) {
      throw new Error(`Failed to generate trending insights: ${error.message}`);
    }
  }

  generateTrendingSummary(videos) {
    if (videos.length === 0) return 'No trending videos available.';

    const totalViews = videos.reduce((sum, video) => sum + parseInt(video.viewCount || 0), 0);
    const avgViews = Math.round(totalViews / videos.length);
    const topVideo = videos.reduce((max, video) => 
      parseInt(video.viewCount || 0) > parseInt(max.viewCount || 0) ? video : max
    );

    return {
      totalVideos: videos.length,
      averageViews: avgViews,
      totalViews: totalViews,
      topPerformingVideo: {
        title: topVideo.title,
        channel: topVideo.channelTitle,
        views: topVideo.viewCount,
        trendingScore: topVideo.trendingScore
      },
      categoryDistribution: this.getCategoryDistribution(videos),
      engagementMetrics: this.calculateEngagementMetrics(videos)
    };
  }

  identifyOpportunities(videos) {
    const opportunities = [];

    // High engagement opportunities
    const highEngagementVideos = videos.filter(video => {
      const views = parseInt(video.viewCount || 0);
      const likes = parseInt(video.likeCount || 0);
      return likes > views * 0.05; // 5%+ like rate
    });

    if (highEngagementVideos.length > 0) {
      opportunities.push({
        type: 'high_engagement',
        description: 'Videos with exceptional engagement rates',
        count: highEngagementVideos.length,
        examples: highEngagementVideos.slice(0, 3).map(v => ({
          title: v.title,
          engagement: Math.round((parseInt(v.likeCount || 0) / parseInt(v.viewCount || 1)) * 10000) / 100
        }))
      });
    }

    // Emerging trends
    const recentVideos = videos.filter(video => {
      const published = new Date(video.publishedAt);
      const now = new Date();
      return (now - published) < 24 * 60 * 60 * 1000; // Last 24 hours
    });

    if (recentVideos.length > 0) {
      opportunities.push({
        type: 'emerging_trends',
        description: 'Recently published trending content',
        count: recentVideos.length,
        examples: recentVideos.slice(0, 3).map(v => ({
          title: v.title,
          publishedAt: v.publishedAt
        }))
      });
    }

    // Underserved categories
    const categoryCounts = {};
    videos.forEach(video => {
      const category = this.categories[video.categoryId] || 'Unknown';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    const avgCategoryCount = Object.values(categoryCounts).reduce((a, b) => a + b, 0) / Object.keys(categoryCounts).length;
    const underservedCategories = Object.entries(categoryCounts)
      .filter(([, count]) => count < avgCategoryCount * 0.5)
      .map(([category]) => category);

    if (underservedCategories.length > 0) {
      opportunities.push({
        type: 'underserved_categories',
        description: 'Categories with fewer trending videos',
        categories: underservedCategories,
        opportunity: 'Less competition in these categories'
      });
    }

    return opportunities;
  }

  generateRecommendations(videos) {
    const recommendations = [];

    // Content type recommendations
    const successfulFormats = this.analyzeSuccessfulFormats(videos);
    if (successfulFormats.length > 0) {
      recommendations.push({
        type: 'content_format',
        title: 'Successful Content Formats',
        suggestions: successfulFormats
      });
    }

    // Timing recommendations
    const timingInsights = this.analyzeTimingPatterns(videos);
    if (timingInsights.length > 0) {
      recommendations.push({
        type: 'timing',
        title: 'Optimal Publishing Times',
        suggestions: timingInsights
      });
    }

    // Topic recommendations
    const trendingTopics = this.extractTrendingTopics(videos);
    if (trendingTopics.length > 0) {
      recommendations.push({
        type: 'topics',
        title: 'Trending Topics to Explore',
        suggestions: trendingTopics
      });
    }

    return recommendations;
  }

  identifyTrends(videos) {
    const trends = [];

    // Viral content patterns
    const viralPatterns = this.analyzeViralPatterns(videos);
    if (viralPatterns.length > 0) {
      trends.push({
        type: 'viral_patterns',
        description: 'Common elements in viral content',
        patterns: viralPatterns
      });
    }

    // Category trends
    const categoryTrends = this.analyzeCategoryTrends(videos);
    if (categoryTrends.length > 0) {
      trends.push({
        type: 'category_trends',
        description: 'Rising and falling categories',
        trends: categoryTrends
      });
    }

    // Engagement trends
    const engagementTrends = this.analyzeEngagementTrends(videos);
    if (engagementTrends.length > 0) {
      trends.push({
        type: 'engagement_trends',
        description: 'Changing engagement patterns',
        trends: engagementTrends
      });
    }

    return trends;
  }

  getCategoryDistribution(videos) {
    const distribution = {};
    videos.forEach(video => {
      const category = this.categories[video.categoryId] || 'Unknown';
      distribution[category] = (distribution[category] || 0) + 1;
    });
    return distribution;
  }

  calculateEngagementMetrics(videos) {
    const totalViews = videos.reduce((sum, video) => sum + parseInt(video.viewCount || 0), 0);
    const totalLikes = videos.reduce((sum, video) => sum + parseInt(video.likeCount || 0), 0);
    const totalComments = videos.reduce((sum, video) => sum + parseInt(video.commentCount || 0), 0);

    return {
      averageLikeRate: totalViews > 0 ? (totalLikes / totalViews * 100).toFixed(2) : 0,
      averageCommentRate: totalViews > 0 ? (totalComments / totalViews * 100).toFixed(2) : 0,
      totalEngagement: totalLikes + totalComments
    };
  }

  analyzeSuccessfulFormats(videos) {
    // Analyze titles for common patterns
    const titlePatterns = {};
    videos.forEach(video => {
      const title = video.title.toLowerCase();
      
      // Check for common patterns
      if (title.includes('vs')) titlePatterns['vs_comparisons'] = (titlePatterns['vs_comparisons'] || 0) + 1;
      if (title.includes('how to')) titlePatterns['how_to'] = (titlePatterns['how_to'] || 0) + 1;
      if (title.includes('top 10') || title.includes('top 5')) titlePatterns['list_videos'] = (titlePatterns['list_videos'] || 0) + 1;
      if (title.includes('react')) titlePatterns['reaction_videos'] = (titlePatterns['reaction_videos'] || 0) + 1;
      if (title.includes('challenge')) titlePatterns['challenge_videos'] = (titlePatterns['challenge_videos'] || 0) + 1;
    });

    return Object.entries(titlePatterns)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([format, count]) => ({ format, count }));
  }

  analyzeTimingPatterns(videos) {
    // Analyze publishing times (simplified)
    const timeSlots = {
      'morning': 0,
      'afternoon': 0,
      'evening': 0,
      'night': 0
    };

    videos.forEach(video => {
      const published = new Date(video.publishedAt);
      const hour = published.getHours();
      
      if (hour >= 6 && hour < 12) timeSlots.morning++;
      else if (hour >= 12 && hour < 17) timeSlots.afternoon++;
      else if (hour >= 17 && hour < 22) timeSlots.evening++;
      else timeSlots.night++;
    });

    return Object.entries(timeSlots)
      .sort(([,a], [,b]) => b - a)
      .map(([time, count]) => ({ time, count }));
  }

  extractTrendingTopics(videos) {
    const words = videos.flatMap(video => 
      video.title.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !['this', 'that', 'with', 'from', 'they', 'have', 'been', 'will', 'your', 'their'].includes(word))
    );

    const wordCounts = {};
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    return Object.entries(wordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));
  }

  analyzeViralPatterns(videos) {
    const patterns = [];
    
    // High view-to-like ratio
    const highEngagementVideos = videos.filter(video => {
      const views = parseInt(video.viewCount || 0);
      const likes = parseInt(video.likeCount || 0);
      return views > 0 && (likes / views) > 0.03; // 3%+ like rate
    });

    if (highEngagementVideos.length > 0) {
      patterns.push({
        pattern: 'high_engagement',
        description: 'Videos with exceptional like-to-view ratios',
        count: highEngagementVideos.length
      });
    }

    // Recent viral content
    const recentViral = videos.filter(video => {
      const published = new Date(video.publishedAt);
      const now = new Date();
      const hoursSincePublished = (now - published) / (1000 * 60 * 60);
      return hoursSincePublished < 24 && parseInt(video.viewCount || 0) > 100000;
    });

    if (recentViral.length > 0) {
      patterns.push({
        pattern: 'recent_viral',
        description: 'Videos that went viral within 24 hours',
        count: recentViral.length
      });
    }

    return patterns;
  }

  analyzeCategoryTrends(videos) {
    const categoryCounts = {};
    videos.forEach(video => {
      const category = this.categories[video.categoryId] || 'Unknown';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    const avgCount = Object.values(categoryCounts).reduce((a, b) => a + b, 0) / Object.keys(categoryCounts).length;

    return Object.entries(categoryCounts)
      .map(([category, count]) => ({
        category,
        count,
        trend: count > avgCount * 1.5 ? 'rising' : count < avgCount * 0.5 ? 'falling' : 'stable'
      }))
      .sort((a, b) => b.count - a.count);
  }

  analyzeEngagementTrends(videos) {
    const trends = [];
    
    // Calculate average engagement rates
    const totalViews = videos.reduce((sum, video) => sum + parseInt(video.viewCount || 0), 0);
    const totalLikes = videos.reduce((sum, video) => sum + parseInt(video.likeCount || 0), 0);
    const totalComments = videos.reduce((sum, video) => sum + parseInt(video.commentCount || 0), 0);

    const avgLikeRate = totalViews > 0 ? (totalLikes / totalViews * 100) : 0;
    const avgCommentRate = totalViews > 0 ? (totalComments / totalViews * 100) : 0;

    trends.push({
      metric: 'like_rate',
      value: avgLikeRate.toFixed(2) + '%',
      trend: avgLikeRate > 2 ? 'increasing' : 'decreasing'
    });

    trends.push({
      metric: 'comment_rate',
      value: avgCommentRate.toFixed(2) + '%',
      trend: avgCommentRate > 0.5 ? 'increasing' : 'decreasing'
    });

    return trends;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

module.exports = YouTubeTrending; 