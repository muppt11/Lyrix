const axios = require('axios');
const moment = require('moment');
const _ = require('lodash');
require('dotenv').config();

class InstagramGraphAPI {
  constructor() {
    this.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    this.businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    this.appId = process.env.INSTAGRAM_APP_ID;
    this.appSecret = process.env.INSTAGRAM_APP_SECRET;
    this.graphVersion = 'v18.0';
    this.baseUrl = `https://graph.facebook.com/${this.graphVersion}`;
    
    if (!this.accessToken) {
      console.warn('⚠️ Instagram Graph API access token not configured');
    }
  }

  async initialize() {
    console.log('📸 Initializing Instagram Graph API...');
    
    if (!this.accessToken) {
      throw new Error('Instagram Graph API access token is required');
    }

    try {
      // Test the connection
      const testResponse = await this.getBusinessAccountInfo();
      console.log('✅ Instagram Graph API initialized successfully');
      console.log(`📊 Business Account: ${testResponse.name} (${testResponse.id})`);
      return testResponse;
    } catch (error) {
      console.error('❌ Instagram Graph API initialization failed:', error.message);
      throw error;
    }
  }

  // ===== BUSINESS ACCOUNT MANAGEMENT =====
  async getBusinessAccountInfo() {
    try {
      const response = await axios.get(`${this.baseUrl}/${this.businessAccountId}`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name,username,profile_picture_url,followers_count,media_count,website,biography'
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get business account info: ${error.message}`);
    }
  }

  async getBusinessAccountInsights(metric = 'impressions', period = 'day', limit = 30) {
    try {
      const response = await axios.get(`${this.baseUrl}/${this.businessAccountId}/insights`, {
        params: {
          access_token: this.accessToken,
          metric: metric,
          period: period,
          limit: limit
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get business account insights: ${error.message}`);
    }
  }

  // ===== HASHTAG ANALYSIS =====
  async searchHashtags(query, limit = 20) {
    try {
      const response = await axios.get(`${this.baseUrl}/ig_hashtag_search`, {
        params: {
          access_token: this.accessToken,
          user_token: this.accessToken,
          q: query,
          limit: limit
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to search hashtags: ${error.message}`);
    }
  }

  async getHashtagInfo(hashtagId) {
    try {
      const response = await axios.get(`${this.baseUrl}/${hashtagId}`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name,media_count'
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get hashtag info: ${error.message}`);
    }
  }

  async getHashtagMedia(hashtagId, limit = 50) {
    try {
      const response = await axios.get(`${this.baseUrl}/${hashtagId}/top_media`, {
        params: {
          access_token: this.accessToken,
          user_token: this.accessToken,
          limit: limit,
          fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,owner'
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get hashtag media: ${error.message}`);
    }
  }

  async getHashtagRecentMedia(hashtagId, limit = 50) {
    try {
      const response = await axios.get(`${this.baseUrl}/${hashtagId}/recent_media`, {
        params: {
          access_token: this.accessToken,
          user_token: this.accessToken,
          limit: limit,
          fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,owner'
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get hashtag recent media: ${error.message}`);
    }
  }

  async getTrendingHashtags(limit = 50) {
    try {
      // Get trending hashtags by searching popular terms
      const trendingTerms = [
        'trending', 'viral', 'popular', 'fashion', 'beauty', 'food', 'travel', 
        'fitness', 'lifestyle', 'tech', 'business', 'art', 'music', 'sports'
      ];

      const hashtagPromises = trendingTerms.map(async (term) => {
        try {
          const searchResults = await this.searchHashtags(term, 5);
          return searchResults.data || [];
        } catch (error) {
          console.log(`Failed to search hashtag "${term}": ${error.message}`);
          return [];
        }
      });

      const allResults = await Promise.all(hashtagPromises);
      const allHashtags = allResults.flat();

      // Get detailed info for each hashtag
      const hashtagDetails = await Promise.all(
        allHashtags.slice(0, limit).map(async (hashtag) => {
          try {
            const info = await this.getHashtagInfo(hashtag.id);
            return {
              ...hashtag,
              ...info,
              trending_score: this.calculateTrendingScore(info)
            };
          } catch (error) {
            console.log(`Failed to get hashtag details for ${hashtag.name}: ${error.message}`);
            return hashtag;
          }
        })
      );

      // Sort by trending score
      return hashtagDetails
        .filter(hashtag => hashtag.media_count > 0)
        .sort((a, b) => (b.trending_score || 0) - (a.trending_score || 0))
        .slice(0, limit);

    } catch (error) {
      throw new Error(`Failed to get trending hashtags: ${error.message}`);
    }
  }

  calculateTrendingScore(hashtag) {
    if (!hashtag.media_count) return 0;
    
    // Simple trending score based on media count
    // In a real implementation, you'd want to consider growth rate, engagement, etc.
    return Math.log10(hashtag.media_count + 1) * 10;
  }

  // ===== MEDIA ANALYSIS =====
  async getBusinessMedia(limit = 50) {
    try {
      const response = await axios.get(`${this.baseUrl}/${this.businessAccountId}/media`, {
        params: {
          access_token: this.accessToken,
          limit: limit,
          fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,insights.metric(impressions,reach,engagement,saved)'
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get business media: ${error.message}`);
    }
  }

  async getMediaInsights(mediaId) {
    try {
      const response = await axios.get(`${this.baseUrl}/${mediaId}/insights`, {
        params: {
          access_token: this.accessToken,
          metric: 'impressions,reach,engagement,saved,shares'
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get media insights: ${error.message}`);
    }
  }

  // ===== COMPETITOR ANALYSIS =====
  async analyzeCompetitorHashtags(competitorUsername, limit = 20) {
    try {
      // First, get the competitor's user ID
      const userResponse = await axios.get(`${this.baseUrl}/${competitorUsername}`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,username,media_count'
        }
      });

      const competitorId = userResponse.data.id;

      // Get their recent media
      const mediaResponse = await axios.get(`${this.baseUrl}/${competitorId}/media`, {
        params: {
          access_token: this.accessToken,
          limit: limit,
          fields: 'id,caption,like_count,comments_count'
        }
      });

      // Extract hashtags from captions
      const hashtags = [];
      mediaResponse.data.data.forEach(post => {
        if (post.caption) {
          const hashtagMatches = post.caption.match(/#\w+/g);
          if (hashtagMatches) {
            hashtags.push(...hashtagMatches);
          }
        }
      });

      // Count hashtag frequency
      const hashtagCounts = {};
      hashtags.forEach(hashtag => {
        hashtagCounts[hashtag] = (hashtagCounts[hashtag] || 0) + 1;
      });

      return {
        competitor: userResponse.data,
        hashtags: Object.entries(hashtagCounts)
          .map(([hashtag, count]) => ({ hashtag, count }))
          .sort((a, b) => b.count - a.count)
      };

    } catch (error) {
      throw new Error(`Failed to analyze competitor hashtags: ${error.message}`);
    }
  }

  // ===== HASHTAG INSIGHTS =====
  async getHashtagInsights(hashtagId, period = 'day', limit = 30) {
    try {
      const response = await axios.get(`${this.baseUrl}/${hashtagId}/insights`, {
        params: {
          access_token: this.accessToken,
          metric: 'impressions,reach,engagement',
          period: period,
          limit: limit
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get hashtag insights: ${error.message}`);
    }
  }

  // ===== TRENDING ANALYSIS =====
  async getTrendingAnalysis(limit = 50) {
    try {
      console.log('📊 Analyzing Instagram trending data...');

      // Get trending hashtags
      const trendingHashtags = await this.getTrendingHashtags(limit);
      
      // Get business account insights
      const accountInsights = await this.getBusinessAccountInsights('impressions,reach,engagement', 'day', 7);
      
      // Get recent business media
      const recentMedia = await this.getBusinessMedia(10);

      // Analyze hashtag performance
      const hashtagAnalysis = await this.analyzeHashtagPerformance(trendingHashtags);

      return {
        timestamp: new Date().toISOString(),
        platform: 'instagram',
        business_account: await this.getBusinessAccountInfo(),
        trending_hashtags: trendingHashtags,
        account_insights: accountInsights,
        recent_media: recentMedia,
        hashtag_analysis: hashtagAnalysis,
        recommendations: this.generateRecommendations(trendingHashtags, accountInsights)
      };

    } catch (error) {
      throw new Error(`Failed to get trending analysis: ${error.message}`);
    }
  }

  async analyzeHashtagPerformance(hashtags) {
    const analysis = {
      total_hashtags: hashtags.length,
      average_media_count: 0,
      top_performing_hashtags: [],
      hashtag_categories: {},
      engagement_potential: []
    };

    if (hashtags.length === 0) return analysis;

    // Calculate average media count
    const totalMedia = hashtags.reduce((sum, hashtag) => sum + (hashtag.media_count || 0), 0);
    analysis.average_media_count = Math.round(totalMedia / hashtags.length);

    // Get top performing hashtags
    analysis.top_performing_hashtags = hashtags
      .sort((a, b) => (b.media_count || 0) - (a.media_count || 0))
      .slice(0, 10);

    // Categorize hashtags
    hashtags.forEach(hashtag => {
      const category = this.categorizeHashtag(hashtag.name);
      if (!analysis.hashtag_categories[category]) {
        analysis.hashtag_categories[category] = [];
      }
      analysis.hashtag_categories[category].push(hashtag);
    });

    // Calculate engagement potential
    analysis.engagement_potential = hashtags
      .map(hashtag => ({
        hashtag: hashtag.name,
        media_count: hashtag.media_count,
        trending_score: hashtag.trending_score,
        engagement_potential: this.calculateEngagementPotential(hashtag)
      }))
      .sort((a, b) => b.engagement_potential - a.engagement_potential)
      .slice(0, 10);

    return analysis;
  }

  categorizeHashtag(hashtagName) {
    const name = hashtagName.toLowerCase();
    
    if (name.includes('fashion') || name.includes('style') || name.includes('outfit')) return 'Fashion';
    if (name.includes('beauty') || name.includes('makeup') || name.includes('skincare')) return 'Beauty';
    if (name.includes('food') || name.includes('recipe') || name.includes('cooking')) return 'Food';
    if (name.includes('travel') || name.includes('vacation') || name.includes('trip')) return 'Travel';
    if (name.includes('fitness') || name.includes('workout') || name.includes('gym')) return 'Fitness';
    if (name.includes('lifestyle') || name.includes('life') || name.includes('daily')) return 'Lifestyle';
    if (name.includes('tech') || name.includes('technology') || name.includes('gadget')) return 'Technology';
    if (name.includes('business') || name.includes('entrepreneur') || name.includes('startup')) return 'Business';
    if (name.includes('art') || name.includes('design') || name.includes('creative')) return 'Art & Design';
    if (name.includes('music') || name.includes('song') || name.includes('artist')) return 'Music';
    if (name.includes('sports') || name.includes('athlete') || name.includes('game')) return 'Sports';
    
    return 'Other';
  }

  calculateEngagementPotential(hashtag) {
    const mediaCount = hashtag.media_count || 0;
    const trendingScore = hashtag.trending_score || 0;
    
    // Higher media count = more competition, but also more potential reach
    // Higher trending score = more viral potential
    return (trendingScore * 0.7) + (Math.log10(mediaCount + 1) * 0.3);
  }

  generateRecommendations(trendingHashtags, accountInsights) {
    const recommendations = {
      hashtag_strategy: [],
      content_optimization: [],
      timing_suggestions: [],
      engagement_tips: []
    };

    // Hashtag strategy recommendations
    const topHashtags = trendingHashtags.slice(0, 10);
    recommendations.hashtag_strategy = [
      `Use trending hashtags like ${topHashtags.slice(0, 3).map(h => h.name).join(', ')} in your posts`,
      'Mix popular hashtags with niche hashtags for better reach',
      'Create branded hashtags to build community',
      'Monitor hashtag performance and adjust strategy accordingly'
    ];

    // Content optimization recommendations
    recommendations.content_optimization = [
      'Post high-quality images and videos consistently',
      'Use Instagram Stories to increase engagement',
      'Create carousel posts for more detailed content',
      'Include calls-to-action in your captions',
      'Use relevant hashtags in your bio'
    ];

    // Timing suggestions
    recommendations.timing_suggestions = [
      'Post during peak hours (6-9 PM local time)',
      'Use Instagram Insights to find your best posting times',
      'Post consistently on the same days each week',
      'Consider your audience\'s timezone when posting'
    ];

    // Engagement tips
    recommendations.engagement_tips = [
      'Respond to comments within the first hour of posting',
      'Like and comment on posts from your target audience',
      'Use Instagram Live to connect with followers',
      'Collaborate with other creators in your niche',
      'Run Instagram contests and giveaways'
    ];

    return recommendations;
  }

  // ===== HASHTAG TRACKING =====
  async trackHashtagPerformance(hashtagId, days = 7) {
    try {
      const insights = await this.getHashtagInsights(hashtagId, 'day', days);
      
      // Get recent media for this hashtag
      const recentMedia = await this.getHashtagRecentMedia(hashtagId, 20);
      
      return {
        hashtag_id: hashtagId,
        tracking_period: `${days} days`,
        insights: insights,
        recent_media: recentMedia,
        performance_summary: this.summarizeHashtagPerformance(insights, recentMedia)
      };

    } catch (error) {
      throw new Error(`Failed to track hashtag performance: ${error.message}`);
    }
  }

  summarizeHashtagPerformance(insights, media) {
    const summary = {
      total_posts: media.data ? media.data.length : 0,
      average_likes: 0,
      average_comments: 0,
      engagement_rate: 0,
      growth_trend: 'stable'
    };

    if (media.data && media.data.length > 0) {
      const totalLikes = media.data.reduce((sum, post) => sum + (post.like_count || 0), 0);
      const totalComments = media.data.reduce((sum, post) => sum + (post.comments_count || 0), 0);
      
      summary.average_likes = Math.round(totalLikes / media.data.length);
      summary.average_comments = Math.round(totalComments / media.data.length);
      summary.engagement_rate = ((totalLikes + totalComments) / media.data.length).toFixed(2);
    }

    return summary;
  }

  // ===== UTILITY METHODS =====
  async testConnection() {
    try {
      const accountInfo = await this.getBusinessAccountInfo();
      return {
        success: true,
        account: accountInfo,
        message: 'Instagram Graph API connection successful'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Instagram Graph API connection failed'
      };
    }
  }

  async getAPIQuota() {
    try {
      const response = await axios.get(`${this.baseUrl}/me`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name'
        }
      });

      // Check rate limiting headers
      const rateLimitInfo = {
        limit: response.headers['x-app-usage'] || 'Unknown',
        remaining: response.headers['x-ratelimit-remaining'] || 'Unknown',
        reset: response.headers['x-ratelimit-reset'] || 'Unknown'
      };

      return {
        user: response.data,
        rate_limits: rateLimitInfo
      };
    } catch (error) {
      throw new Error(`Failed to get API quota: ${error.message}`);
    }
  }
}

module.exports = InstagramGraphAPI; 