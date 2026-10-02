const GoogleCloudConsole = require('./google-cloud');
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const moment = require('moment');
const _ = require('lodash');
const natural = require('natural');
const Sentiment = require('sentiment');
const { Parser } = require('json2csv');
require('dotenv').config();

// Initialize sentiment analyzer
const sentiment = new Sentiment();

class SocialMediaAnalytics {
  constructor() {
    this.gcp = new GoogleCloudConsole();
    this.browser = null;
    this.sentiment = sentiment;
    this.tokenizer = new natural.WordTokenizer();
    
    // Analytics thresholds and benchmarks
    this.benchmarks = {
      youtube: {
        engagementRate: { good: 0.05, excellent: 0.1 },
        viewDuration: { good: 0.6, excellent: 0.8 },
        subscriberGrowth: { good: 0.02, excellent: 0.05 },
        clickThroughRate: { good: 0.05, excellent: 0.1 }
      },
      tiktok: {
        engagementRate: { good: 0.08, excellent: 0.15 },
        completionRate: { good: 0.7, excellent: 0.9 },
        followerGrowth: { good: 0.03, excellent: 0.08 },
        shareRate: { good: 0.02, excellent: 0.05 }
      },
      instagram: {
        engagementRate: { good: 0.03, excellent: 0.06 },
        reachRate: { good: 0.15, excellent: 0.3 },
        followerGrowth: { good: 0.02, excellent: 0.05 },
        storyCompletion: { good: 0.7, excellent: 0.9 }
      }
    };
  }

  // ===== YOUTUBE ANALYTICS =====

  async analyzeYouTubeChannel(channelId, days = 30) {
    try {
      console.log(`📊 Analyzing YouTube channel: ${channelId}`);
      
      const analysis = {
        channelId,
        platform: 'youtube',
        analysisDate: new Date().toISOString(),
        timeRange: `${days} days`,
        overview: {},
        contentAnalysis: {},
        performanceMetrics: {},
        optimizationRecommendations: [],
        issues: [],
        trends: {}
      };

      // Get channel information
      const channelInfo = await this.gcp.getChannelInfo(channelId);
      analysis.overview = {
        channelName: channelInfo.title,
        subscriberCount: parseInt(channelInfo.statistics.subscriberCount),
        totalViews: parseInt(channelInfo.statistics.viewCount),
        totalVideos: parseInt(channelInfo.statistics.videoCount),
        description: channelInfo.description
      };

      // Get recent videos
      const videos = await this.getYouTubeVideos(channelId, days);
      analysis.contentAnalysis = await this.analyzeYouTubeContent(videos);
      analysis.performanceMetrics = await this.calculateYouTubeMetrics(videos, analysis.overview);
      analysis.optimizationRecommendations = this.generateYouTubeRecommendations(analysis);
      analysis.issues = this.identifyYouTubeIssues(analysis);
      analysis.trends = await this.analyzeYouTubeTrends(videos);

      // Store analysis in BigQuery
      await this.storeAnalysis(analysis);

      return analysis;
    } catch (error) {
      console.error('YouTube analysis error:', error.message);
      throw error;
    }
  }

  async getYouTubeVideos(channelId, days = 30) {
    try {
      const videos = [];
      let nextPageToken = null;
      const cutoffDate = moment().subtract(days, 'days');

      do {
        const response = await this.gcp.youtube.search.list({
          part: 'snippet',
          channelId: channelId,
          order: 'date',
          type: 'video',
          maxResults: 50,
          pageToken: nextPageToken
        });

        const videoIds = response.data.items.map(item => item.id.videoId);
        const videoDetails = await this.gcp.youtube.videos.list({
          part: 'snippet,statistics,contentDetails',
          id: videoIds.join(',')
        });

        for (const video of videoDetails.data.items) {
          const publishedDate = moment(video.snippet.publishedAt);
          if (publishedDate.isBefore(cutoffDate)) break;

          videos.push({
            id: video.id,
            title: video.snippet.title,
            description: video.snippet.description,
            publishedAt: video.snippet.publishedAt,
            duration: video.contentDetails.duration,
            viewCount: parseInt(video.statistics.viewCount || 0),
            likeCount: parseInt(video.statistics.likeCount || 0),
            commentCount: parseInt(video.statistics.commentCount || 0),
            tags: video.snippet.tags || [],
            categoryId: video.snippet.categoryId,
            defaultLanguage: video.snippet.defaultLanguage,
            defaultAudioLanguage: video.snippet.defaultAudioLanguage
          });
        }

        nextPageToken = response.data.nextPageToken;
      } while (nextPageToken && videos.length < 100);

      return videos;
    } catch (error) {
      console.error('Error fetching YouTube videos:', error.message);
      throw error;
    }
  }

  async analyzeYouTubeContent(videos) {
    const analysis = {
      totalVideos: videos.length,
      averageDuration: 0,
      titleAnalysis: {},
      descriptionAnalysis: {},
      tagAnalysis: {},
      categoryDistribution: {},
      languageAnalysis: {},
      postingSchedule: {},
      contentGaps: []
    };

    if (videos.length === 0) return analysis;

    // Duration analysis
    const durations = videos.map(v => this.parseDuration(v.duration));
    analysis.averageDuration = _.mean(durations);

    // Title analysis
    const titles = videos.map(v => v.title);
    analysis.titleAnalysis = this.analyzeTitles(titles);

    // Description analysis
    const descriptions = videos.map(v => v.description);
    analysis.descriptionAnalysis = this.analyzeDescriptions(descriptions);

    // Tag analysis
    const allTags = videos.flatMap(v => v.tags);
    analysis.tagAnalysis = this.analyzeTags(allTags);

    // Category distribution
    analysis.categoryDistribution = _.countBy(videos, 'categoryId');

    // Language analysis
    const languages = videos.map(v => v.defaultLanguage || v.defaultAudioLanguage).filter(Boolean);
    analysis.languageAnalysis = _.countBy(languages);

    // Posting schedule analysis
    analysis.postingSchedule = this.analyzePostingSchedule(videos);

    // Content gaps analysis
    analysis.contentGaps = this.identifyContentGaps(videos);

    return analysis;
  }

  async calculateYouTubeMetrics(videos, channelOverview) {
    const metrics = {
      engagementRate: 0,
      averageViews: 0,
      averageLikes: 0,
      averageComments: 0,
      viewDuration: 0,
      subscriberGrowth: 0,
      clickThroughRate: 0,
      retentionRate: 0
    };

    if (videos.length === 0) return metrics;

    // Calculate engagement rate
    const totalEngagements = videos.reduce((sum, v) => sum + v.likeCount + v.commentCount, 0);
    const totalViews = videos.reduce((sum, v) => sum + v.viewCount, 0);
    metrics.engagementRate = totalViews > 0 ? totalEngagements / totalViews : 0;

    // Average metrics
    metrics.averageViews = _.mean(videos.map(v => v.viewCount));
    metrics.averageLikes = _.mean(videos.map(v => v.likeCount));
    metrics.averageComments = _.mean(videos.map(v => v.commentCount));

    // View duration (estimated based on average duration)
    const avgDuration = _.mean(videos.map(v => this.parseDuration(v.duration)));
    metrics.viewDuration = avgDuration / 60; // Convert to minutes

    // Performance comparison
    metrics.performanceScore = this.calculatePerformanceScore(metrics, 'youtube');

    return metrics;
  }

  // ===== TIKTOK ANALYTICS =====

  async analyzeTikTokAccount(username, days = 30) {
    try {
      console.log(`📊 Analyzing TikTok account: ${username}`);
      
      const analysis = {
        username,
        platform: 'tiktok',
        analysisDate: new Date().toISOString(),
        timeRange: `${days} days`,
        overview: {},
        contentAnalysis: {},
        performanceMetrics: {},
        optimizationRecommendations: [],
        issues: [],
        trends: {}
      };

      // Get TikTok data (using web scraping for public data)
      const tiktokData = await this.scrapeTikTokData(username, days);
      analysis.overview = tiktokData.overview;
      analysis.contentAnalysis = await this.analyzeTikTokContent(tiktokData.videos);
      analysis.performanceMetrics = await this.calculateTikTokMetrics(tiktokData.videos, analysis.overview);
      analysis.optimizationRecommendations = this.generateTikTokRecommendations(analysis);
      analysis.issues = this.identifyTikTokIssues(analysis);
      analysis.trends = await this.analyzeTikTokTrends(tiktokData.videos);

      await this.storeAnalysis(analysis);
      return analysis;
    } catch (error) {
      console.error('TikTok analysis error:', error.message);
      throw error;
    }
  }

  async scrapeTikTokData(username, days = 30) {
    if (!this.browser) {
      this.browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }

    const page = await this.browser.newPage();
    await page.setUserAgent(process.env.SCRAPING_USER_AGENT);
    
    try {
      // Navigate to TikTok profile
      await page.goto(`https://www.tiktok.com/@${username}`, { waitUntil: 'networkidle2' });
      
      // Extract profile information
      const profileData = await page.evaluate(() => {
        const followerCount = document.querySelector('[data-e2e="followers-count"]')?.textContent;
        const followingCount = document.querySelector('[data-e2e="following-count"]')?.textContent;
        const likeCount = document.querySelector('[data-e2e="likes-count"]')?.textContent;
        const bio = document.querySelector('[data-e2e="user-bio"]')?.textContent;
        
        return { followerCount, followingCount, likeCount, bio };
      });

      // Extract video data
      const videos = await page.evaluate(() => {
        const videoElements = document.querySelectorAll('[data-e2e="user-post-item"]');
        return Array.from(videoElements, (el, index) => {
          if (index >= 20) return null; // Limit to recent 20 videos
          
          const likeCount = el.querySelector('[data-e2e="like-count"]')?.textContent;
          const commentCount = el.querySelector('[data-e2e="comment-count"]')?.textContent;
          const shareCount = el.querySelector('[data-e2e="share-count"]')?.textContent;
          const videoUrl = el.querySelector('a')?.href;
          
          return {
            likeCount: this.parseCount(likeCount),
            commentCount: this.parseCount(commentCount),
            shareCount: this.parseCount(shareCount),
            videoUrl
          };
        }).filter(Boolean);
      });

      return {
        overview: {
          username,
          followerCount: this.parseCount(profileData.followerCount),
          followingCount: this.parseCount(profileData.followingCount),
          totalLikes: this.parseCount(profileData.likeCount),
          bio: profileData.bio
        },
        videos
      };
    } finally {
      await page.close();
    }
  }

  // ===== INSTAGRAM ANALYTICS =====

  async analyzeInstagramAccount(username, days = 30) {
    try {
      console.log(`📊 Analyzing Instagram account: ${username}`);
      
      const analysis = {
        username,
        platform: 'instagram',
        analysisDate: new Date().toISOString(),
        timeRange: `${days} days`,
        overview: {},
        contentAnalysis: {},
        performanceMetrics: {},
        optimizationRecommendations: [],
        issues: [],
        trends: {}
      };

      // Get Instagram data
      const instagramData = await this.getInstagramData(username, days);
      analysis.overview = instagramData.overview;
      analysis.contentAnalysis = await this.analyzeInstagramContent(instagramData.posts);
      analysis.performanceMetrics = await this.calculateInstagramMetrics(instagramData.posts, analysis.overview);
      analysis.optimizationRecommendations = this.generateInstagramRecommendations(analysis);
      analysis.issues = this.identifyInstagramIssues(analysis);
      analysis.trends = await this.analyzeInstagramTrends(instagramData.posts);

      await this.storeAnalysis(analysis);
      return analysis;
    } catch (error) {
      console.error('Instagram analysis error:', error.message);
      throw error;
    }
  }

  async getInstagramData(username, days = 30) {
    // Try Graph API first, fallback to web scraping
    if (process.env.INSTAGRAM_GRAPH_ACCESS_TOKEN) {
      try {
        return await this.getInstagramGraphData(username, days);
      } catch (error) {
        console.log('Graph API failed, falling back to web scraping');
      }
    }

    return await this.scrapeInstagramData(username, days);
  }

  async getInstagramGraphData(username, days = 30) {
    const accessToken = process.env.INSTAGRAM_GRAPH_ACCESS_TOKEN;
    const businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

    // Get account insights
    const insightsResponse = await axios.get(
      `https://graph.facebook.com/v18.0/${businessAccountId}/insights`,
      {
        params: {
          access_token: accessToken,
          metric: 'impressions,reach,profile_views,follower_count',
          period: 'day',
          since: moment().subtract(days, 'days').format('YYYY-MM-DD'),
          until: moment().format('YYYY-MM-DD')
        }
      }
    );

    // Get recent posts
    const postsResponse = await axios.get(
      `https://graph.facebook.com/v18.0/${businessAccountId}/media`,
      {
        params: {
          access_token: accessToken,
          fields: 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count',
          limit: 50
        }
      }
    );

    return {
      overview: {
        username,
        followerCount: insightsResponse.data.data.find(d => d.name === 'follower_count')?.values[0]?.value || 0,
        totalImpressions: insightsResponse.data.data.find(d => d.name === 'impressions')?.values.reduce((sum, v) => sum + v.value, 0) || 0,
        totalReach: insightsResponse.data.data.find(d => d.name === 'reach')?.values.reduce((sum, v) => sum + v.value, 0) || 0,
        profileViews: insightsResponse.data.data.find(d => d.name === 'profile_views')?.values.reduce((sum, v) => sum + v.value, 0) || 0
      },
      posts: postsResponse.data.data
    };
  }

  // ===== CONTENT ANALYSIS HELPERS =====

  analyzeTitles(titles) {
    const analysis = {
      averageLength: 0,
      keywordFrequency: {},
      sentiment: { positive: 0, negative: 0, neutral: 0 },
      commonPatterns: [],
      optimizationScore: 0
    };

    if (titles.length === 0) return analysis;

    // Length analysis
    analysis.averageLength = _.mean(titles.map(t => t.length));

    // Keyword analysis
    const allWords = titles.flatMap(t => this.tokenizer.tokenize(t.toLowerCase()));
    analysis.keywordFrequency = _.countBy(allWords);

    // Sentiment analysis
    const sentiments = titles.map(t => this.sentiment.analyze(t));
    analysis.sentiment = {
      positive: sentiments.filter(s => s.score > 0).length,
      negative: sentiments.filter(s => s.score < 0).length,
      neutral: sentiments.filter(s => s.score === 0).length
    };

    // Pattern analysis
    analysis.commonPatterns = this.findCommonPatterns(titles);

    // Optimization score
    analysis.optimizationScore = this.calculateTitleOptimizationScore(titles);

    return analysis;
  }

  analyzeDescriptions(descriptions) {
    const analysis = {
      averageLength: 0,
      hashtagUsage: {},
      linkUsage: 0,
      callToActionUsage: 0,
      keywordDensity: {},
      optimizationScore: 0
    };

    if (descriptions.length === 0) return analysis;

    // Length analysis
    analysis.averageLength = _.mean(descriptions.map(d => d.length));

    // Hashtag analysis
    const hashtags = descriptions.flatMap(d => d.match(/#\w+/g) || []);
    analysis.hashtagUsage = _.countBy(hashtags);

    // Link analysis
    const linkRegex = /https?:\/\/[^\s]+/g;
    analysis.linkUsage = descriptions.filter(d => linkRegex.test(d)).length;

    // Call to action analysis
    const ctaWords = ['subscribe', 'like', 'comment', 'share', 'follow', 'click', 'watch'];
    analysis.callToActionUsage = descriptions.filter(d => 
      ctaWords.some(word => d.toLowerCase().includes(word))
    ).length;

    // Keyword density
    const allWords = descriptions.flatMap(d => this.tokenizer.tokenize(d.toLowerCase()));
    analysis.keywordDensity = _.countBy(allWords);

    return analysis;
  }

  analyzeTags(tags) {
    const analysis = {
      totalTags: tags.length,
      uniqueTags: _.uniq(tags).length,
      mostUsedTags: [],
      tagCategories: {},
      optimizationScore: 0
    };

    if (tags.length === 0) return analysis;

    // Most used tags
    const tagCounts = _.countBy(tags);
    analysis.mostUsedTags = _.orderBy(
      Object.entries(tagCounts).map(([tag, count]) => ({ tag, count })),
      'count',
      'desc'
    ).slice(0, 10);

    // Tag categories (basic categorization)
    analysis.tagCategories = this.categorizeTags(tags);

    return analysis;
  }

  // ===== OPTIMIZATION RECOMMENDATIONS =====

  generateYouTubeRecommendations(analysis) {
    const recommendations = [];

    // Engagement rate recommendations
    if (analysis.performanceMetrics.engagementRate < this.benchmarks.youtube.engagementRate.good) {
      recommendations.push({
        category: 'engagement',
        priority: 'high',
        title: 'Improve Engagement Rate',
        description: 'Your engagement rate is below industry standards. Focus on creating more interactive content.',
        actions: [
          'Ask questions in your videos to encourage comments',
          'Create polls and community posts',
          'Respond to comments within 24 hours',
          'Use end screens to promote other videos'
        ],
        expectedImpact: 'Increase engagement rate by 20-40%'
      });
    }

    // Title optimization
    if (analysis.contentAnalysis.titleAnalysis.optimizationScore < 0.7) {
      recommendations.push({
        category: 'content',
        priority: 'medium',
        title: 'Optimize Video Titles',
        description: 'Your titles could be more compelling and SEO-friendly.',
        actions: [
          'Include relevant keywords in titles',
          'Keep titles between 50-60 characters',
          'Use numbers and emotional triggers',
          'Test different title formats'
        ],
        expectedImpact: 'Increase click-through rate by 15-25%'
      });
    }

    // Posting schedule
    if (analysis.contentAnalysis.postingSchedule.consistency < 0.8) {
      recommendations.push({
        category: 'schedule',
        priority: 'medium',
        title: 'Improve Posting Consistency',
        description: 'Inconsistent posting can hurt your channel growth.',
        actions: [
          'Create a content calendar',
          'Post at least 2-3 times per week',
          'Use YouTube Studio to schedule uploads',
          'Analyze best posting times for your audience'
        ],
        expectedImpact: 'Improve subscriber retention and growth'
      });
    }

    return recommendations;
  }

  generateTikTokRecommendations(analysis) {
    const recommendations = [];

    // Completion rate recommendations
    if (analysis.performanceMetrics.completionRate < this.benchmarks.tiktok.completionRate.good) {
      recommendations.push({
        category: 'content',
        priority: 'high',
        title: 'Improve Video Completion Rate',
        description: 'Viewers are dropping off before finishing your videos.',
        actions: [
          'Hook viewers in the first 3 seconds',
          'Keep videos under 60 seconds for better completion',
          'Use trending sounds and effects',
          'Create compelling thumbnails'
        ],
        expectedImpact: 'Increase completion rate by 30-50%'
      });
    }

    return recommendations;
  }

  generateInstagramRecommendations(analysis) {
    const recommendations = [];

    // Engagement rate recommendations
    if (analysis.performanceMetrics.engagementRate < this.benchmarks.instagram.engagementRate.good) {
      recommendations.push({
        category: 'engagement',
        priority: 'high',
        title: 'Boost Instagram Engagement',
        description: 'Your posts need more interaction from followers.',
        actions: [
          'Use Instagram Stories daily',
          'Post when your audience is most active',
          'Use relevant hashtags (5-15 per post)',
          'Create carousel posts for better engagement'
        ],
        expectedImpact: 'Increase engagement rate by 25-40%'
      });
    }

    return recommendations;
  }

  // ===== ISSUE IDENTIFICATION =====

  identifyYouTubeIssues(analysis) {
    const issues = [];

    // Low engagement
    if (analysis.performanceMetrics.engagementRate < 0.02) {
      issues.push({
        severity: 'high',
        type: 'low_engagement',
        description: 'Very low engagement rate indicates content may not be resonating with audience',
        impact: 'Reduced visibility and slower growth'
      });
    }

    // Inconsistent posting
    if (analysis.contentAnalysis.postingSchedule.consistency < 0.6) {
      issues.push({
        severity: 'medium',
        type: 'inconsistent_posting',
        description: 'Irregular posting schedule can hurt algorithm favorability',
        impact: 'Reduced recommendations and slower growth'
      });
    }

    // Poor title optimization
    if (analysis.contentAnalysis.titleAnalysis.optimizationScore < 0.5) {
      issues.push({
        severity: 'medium',
        type: 'poor_titles',
        description: 'Titles are not optimized for search and discovery',
        impact: 'Lower click-through rates and reduced visibility'
      });
    }

    return issues;
  }

  // ===== UTILITY METHODS =====

  parseDuration(duration) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  parseCount(countStr) {
    if (!countStr) return 0;
    
    const num = countStr.replace(/[^\d.]/g, '');
    if (countStr.includes('K')) return parseFloat(num) * 1000;
    if (countStr.includes('M')) return parseFloat(num) * 1000000;
    if (countStr.includes('B')) return parseFloat(num) * 1000000000;
    
    return parseInt(num) || 0;
  }

  calculatePerformanceScore(metrics, platform) {
    const benchmark = this.benchmarks[platform];
    let score = 0;
    let totalWeight = 0;

    // Weight different metrics based on platform importance
    const weights = {
      youtube: { engagementRate: 0.3, viewDuration: 0.25, subscriberGrowth: 0.25, clickThroughRate: 0.2 },
      tiktok: { engagementRate: 0.3, completionRate: 0.3, followerGrowth: 0.2, shareRate: 0.2 },
      instagram: { engagementRate: 0.4, reachRate: 0.3, followerGrowth: 0.2, storyCompletion: 0.1 }
    };

    const platformWeights = weights[platform];

    for (const [metric, weight] of Object.entries(platformWeights)) {
      if (metrics[metric] && benchmark[metric]) {
        const ratio = metrics[metric] / benchmark[metric].excellent;
        score += Math.min(ratio, 1) * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? score / totalWeight : 0;
  }

  async storeAnalysis(analysis) {
    try {
      // Store in BigQuery
      const datasetId = process.env.BIGQUERY_DATASET_ID || 'social_analytics';
      const tableId = `${analysis.platform}_analyses`;
      
      await this.gcp.bigquery.dataset(datasetId).table(tableId).insert([analysis]);
      
      // Store in Cloud Storage as backup
      const fileName = `${analysis.platform}/${analysis.analysisDate.split('T')[0]}/${analysis.platform === 'youtube' ? analysis.channelId : analysis.username}.json`;
      await this.gcp.uploadFile(
        process.env.CLOUD_STORAGE_BUCKET,
        fileName,
        JSON.stringify(analysis, null, 2)
      );

      console.log(`✅ Analysis stored for ${analysis.platform}`);
    } catch (error) {
      console.error('Error storing analysis:', error.message);
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

module.exports = SocialMediaAnalytics; 