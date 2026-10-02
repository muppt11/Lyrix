const { create, insert, search, remove, getInfo } = require('@lyrasearch/lyra');
const SocialMediaAnalytics = require('./social-analytics');
const GoogleCloudConsole = require('./google-cloud');
const moment = require('moment');
const _ = require('lodash');
require('dotenv').config();

class LyraSearchEngine {
  constructor() {
    this.analytics = new SocialMediaAnalytics();
    this.gcp = new GoogleCloudConsole();
    this.db = null;
    this.searchIndexes = {
      youtube: null,
      tiktok: null,
      instagram: null,
      combined: null
    };
    this.initialized = false;
  }

  async initialize() {
    try {
      console.log('🔍 Initializing LyraLytics Search Engine...');

      // Create search indexes for each platform
      this.searchIndexes.youtube = await create({
        schema: {
          id: 'string',
          channelId: 'string',
          channelName: 'string',
          platform: 'string',
          analysisDate: 'string',
          timeRange: 'string',
          subscriberCount: 'number',
          totalViews: 'number',
          totalVideos: 'number',
          engagementRate: 'number',
          performanceScore: 'number',
          issues: 'string',
          recommendations: 'string',
          content: 'string',
          tags: 'string',
          description: 'string'
        },
        defaultLanguage: 'english'
      });

      this.searchIndexes.tiktok = await create({
        schema: {
          id: 'string',
          username: 'string',
          platform: 'string',
          analysisDate: 'string',
          timeRange: 'string',
          followerCount: 'number',
          totalLikes: 'number',
          engagementRate: 'number',
          performanceScore: 'number',
          issues: 'string',
          recommendations: 'string',
          content: 'string',
          bio: 'string'
        },
        defaultLanguage: 'english'
      });

      this.searchIndexes.instagram = await create({
        schema: {
          id: 'string',
          username: 'string',
          platform: 'string',
          analysisDate: 'string',
          timeRange: 'string',
          followerCount: 'number',
          totalPosts: 'number',
          engagementRate: 'number',
          performanceScore: 'number',
          issues: 'string',
          recommendations: 'string',
          content: 'string',
          bio: 'string'
        },
        defaultLanguage: 'english'
      });

      // Create combined search index
      this.searchIndexes.combined = await create({
        schema: {
          id: 'string',
          platform: 'string',
          accountId: 'string',
          accountName: 'string',
          analysisDate: 'string',
          timeRange: 'string',
          followerCount: 'number',
          engagementRate: 'number',
          performanceScore: 'number',
          issues: 'string',
          recommendations: 'string',
          content: 'string',
          tags: 'string',
          category: 'string'
        },
        defaultLanguage: 'english'
      });

      this.initialized = true;
      console.log('✅ LyraLytics Search Engine initialized successfully');

      // Load existing data into search indexes
      await this.loadExistingData();

    } catch (error) {
      console.error('❌ Error initializing LyraLytics Search Engine:', error);
      throw error;
    }
  }

  async loadExistingData() {
    try {
      console.log('📥 Loading existing analytics data into LyraLytics search indexes...');

      // Load YouTube data
      const youtubeData = await this.getAnalyticsFromBigQuery('youtube');
      for (const record of youtubeData) {
        await this.indexYouTubeRecord(record);
      }

      // Load TikTok data
      const tiktokData = await this.getAnalyticsFromBigQuery('tiktok');
      for (const record of tiktokData) {
        await this.indexTikTokRecord(record);
      }

      // Load Instagram data
      const instagramData = await this.getAnalyticsFromBigQuery('instagram');
      for (const record of instagramData) {
        await this.indexInstagramRecord(record);
      }

      console.log(`✅ Loaded ${youtubeData.length + tiktokData.length + instagramData.length} records into LyraLytics search indexes`);

    } catch (error) {
      console.error('Error loading existing data:', error);
    }
  }

  async getAnalyticsFromBigQuery(platform) {
    try {
      const query = `
        SELECT *
        FROM \`${process.env.GOOGLE_CLOUD_PROJECT_ID}.${process.env.BIGQUERY_DATASET_ID || 'social_analytics'}.${platform}_analyses\`
        ORDER BY analysisDate DESC
        LIMIT 1000
      `;

      const results = await this.gcp.queryData(query);
      return results;
    } catch (error) {
      console.error(`Error fetching ${platform} data from BigQuery:`, error);
      return [];
    }
  }

  async indexYouTubeRecord(record) {
    try {
      const searchRecord = {
        id: `youtube_${record.channelId}_${record.analysisDate}`,
        channelId: record.channelId,
        channelName: record.overview?.channelName || '',
        platform: 'youtube',
        analysisDate: record.analysisDate,
        timeRange: record.timeRange,
        subscriberCount: record.overview?.subscriberCount || 0,
        totalViews: record.overview?.totalViews || 0,
        totalVideos: record.overview?.totalVideos || 0,
        engagementRate: record.performanceMetrics?.engagementRate || 0,
        performanceScore: record.performanceMetrics?.performanceScore || 0,
        issues: this.formatIssues(record.issues),
        recommendations: this.formatRecommendations(record.optimizationRecommendations),
        content: this.formatContent(record.contentAnalysis),
        tags: this.formatTags(record.contentAnalysis?.tagAnalysis),
        description: record.overview?.description || ''
      };

      await insert(this.searchIndexes.youtube, searchRecord);
      await this.indexCombinedRecord(searchRecord);

    } catch (error) {
      console.error('Error indexing YouTube record:', error);
    }
  }

  async indexTikTokRecord(record) {
    try {
      const searchRecord = {
        id: `tiktok_${record.username}_${record.analysisDate}`,
        username: record.username,
        platform: 'tiktok',
        analysisDate: record.analysisDate,
        timeRange: record.timeRange,
        followerCount: record.overview?.followerCount || 0,
        totalLikes: record.overview?.totalLikes || 0,
        engagementRate: record.performanceMetrics?.engagementRate || 0,
        performanceScore: record.performanceMetrics?.performanceScore || 0,
        issues: this.formatIssues(record.issues),
        recommendations: this.formatRecommendations(record.optimizationRecommendations),
        content: this.formatContent(record.contentAnalysis),
        bio: record.overview?.bio || ''
      };

      await insert(this.searchIndexes.tiktok, searchRecord);
      await this.indexCombinedRecord(searchRecord);

    } catch (error) {
      console.error('Error indexing TikTok record:', error);
    }
  }

  async indexInstagramRecord(record) {
    try {
      const searchRecord = {
        id: `instagram_${record.username}_${record.analysisDate}`,
        username: record.username,
        platform: 'instagram',
        analysisDate: record.analysisDate,
        timeRange: record.timeRange,
        followerCount: record.overview?.followerCount || 0,
        totalPosts: record.overview?.totalPosts || 0,
        engagementRate: record.performanceMetrics?.engagementRate || 0,
        performanceScore: record.performanceMetrics?.performanceScore || 0,
        issues: this.formatIssues(record.issues),
        recommendations: this.formatRecommendations(record.optimizationRecommendations),
        content: this.formatContent(record.contentAnalysis),
        bio: record.overview?.bio || ''
      };

      await insert(this.searchIndexes.instagram, searchRecord);
      await this.indexCombinedRecord(searchRecord);

    } catch (error) {
      console.error('Error indexing Instagram record:', error);
    }
  }

  async indexCombinedRecord(record) {
    try {
      const combinedRecord = {
        id: record.id,
        platform: record.platform,
        accountId: record.channelId || record.username,
        accountName: record.channelName || record.username,
        analysisDate: record.analysisDate,
        timeRange: record.timeRange,
        followerCount: record.subscriberCount || record.followerCount || 0,
        engagementRate: record.engagementRate || 0,
        performanceScore: record.performanceScore || 0,
        issues: record.issues || '',
        recommendations: record.recommendations || '',
        content: record.content || '',
        tags: record.tags || '',
        category: this.categorizeAccount(record)
      };

      await insert(this.searchIndexes.combined, combinedRecord);

    } catch (error) {
      console.error('Error indexing combined record:', error);
    }
  }

  formatIssues(issues) {
    if (!issues || !Array.isArray(issues)) return '';
    return issues.map(issue => `${issue.type}: ${issue.description}`).join('; ');
  }

  formatRecommendations(recommendations) {
    if (!recommendations || !Array.isArray(recommendations)) return '';
    return recommendations.map(rec => `${rec.title}: ${rec.description}`).join('; ');
  }

  formatContent(contentAnalysis) {
    if (!contentAnalysis) return '';
    
    const parts = [];
    if (contentAnalysis.titleAnalysis) {
      parts.push(`Titles: ${contentAnalysis.titleAnalysis.averageLength} chars avg`);
    }
    if (contentAnalysis.descriptionAnalysis) {
      parts.push(`Descriptions: ${contentAnalysis.descriptionAnalysis.averageLength} chars avg`);
    }
    if (contentAnalysis.tagAnalysis) {
      parts.push(`${contentAnalysis.tagAnalysis.totalTags} tags used`);
    }
    
    return parts.join('; ');
  }

  formatTags(tagAnalysis) {
    if (!tagAnalysis || !tagAnalysis.mostUsedTags) return '';
    return tagAnalysis.mostUsedTags.slice(0, 10).map(tag => tag.tag).join(', ');
  }

  categorizeAccount(record) {
    const followerCount = record.subscriberCount || record.followerCount || 0;
    const performanceScore = record.performanceScore || 0;

    if (followerCount > 1000000) return 'mega';
    if (followerCount > 100000) return 'macro';
    if (followerCount > 10000) return 'micro';
    if (followerCount > 1000) return 'nano';
    return 'starter';
  }

  // ===== SEARCH FUNCTIONS =====

  async searchAnalytics(query, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const {
      platform = 'combined',
      limit = 20,
      offset = 0,
      filters = {},
      sortBy = 'performanceScore',
      sortOrder = 'desc'
    } = options;

    try {
      const searchOptions = {
        term: query,
        limit,
        offset,
        properties: ['accountName', 'content', 'issues', 'recommendations', 'tags'],
        sortBy: {
          property: sortBy,
          order: sortOrder
        }
      };

      // Add filters
      if (filters.platform && platform === 'combined') {
        searchOptions.where = { platform: filters.platform };
      }
      if (filters.category) {
        searchOptions.where = { ...searchOptions.where, category: filters.category };
      }
      if (filters.minEngagement) {
        searchOptions.where = { ...searchOptions.where, engagementRate: { gte: filters.minEngagement } };
      }
      if (filters.minPerformance) {
        searchOptions.where = { ...searchOptions.where, performanceScore: { gte: filters.minPerformance } };
      }

      const results = await search(this.searchIndexes[platform], searchOptions);
      
      return {
        query,
        platform,
        total: results.count,
        hits: results.hits.map(hit => ({
          ...hit.document,
          score: hit.score
        })),
        facets: results.facets || {},
        processingTime: results.processingTime
      };

    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  async searchByPerformance(minScore = 0.7, platform = 'combined') {
    return await this.searchAnalytics('', {
      platform,
      filters: { minPerformance: minScore },
      sortBy: 'performanceScore',
      sortOrder: 'desc'
    });
  }

  async searchByEngagement(minRate = 0.05, platform = 'combined') {
    return await this.searchAnalytics('', {
      platform,
      filters: { minEngagement: minRate },
      sortBy: 'engagementRate',
      sortOrder: 'desc'
    });
  }

  async searchIssues(issueType = '', platform = 'combined') {
    return await this.searchAnalytics(issueType, {
      platform,
      properties: ['issues'],
      sortBy: 'analysisDate',
      sortOrder: 'desc'
    });
  }

  async searchRecommendations(category = '', platform = 'combined') {
    return await this.searchAnalytics(category, {
      platform,
      properties: ['recommendations'],
      sortBy: 'analysisDate',
      sortOrder: 'desc'
    });
  }

  async searchContent(contentType = '', platform = 'combined') {
    return await this.searchAnalytics(contentType, {
      platform,
      properties: ['content', 'tags'],
      sortBy: 'analysisDate',
      sortOrder: 'desc'
    });
  }

  // ===== ANALYTICS SEARCH FUNCTIONS =====

  async findTopPerformers(platform = 'combined', limit = 10) {
    return await this.searchAnalytics('', {
      platform,
      limit,
      sortBy: 'performanceScore',
      sortOrder: 'desc'
    });
  }

  async findHighEngagementAccounts(platform = 'combined', limit = 10) {
    return await this.searchAnalytics('', {
      platform,
      limit,
      sortBy: 'engagementRate',
      sortOrder: 'desc'
    });
  }

  async findAccountsWithIssues(issueType = '', platform = 'combined', limit = 20) {
    return await this.searchAnalytics(issueType, {
      platform,
      limit,
      properties: ['issues'],
      sortBy: 'analysisDate',
      sortOrder: 'desc'
    });
  }

  async findSimilarAccounts(accountId, platform = 'combined', limit = 10) {
    // Get the target account's data
    const targetAccount = await this.getAccountById(accountId, platform);
    if (!targetAccount) {
      throw new Error('Account not found');
    }

    // Search for similar accounts based on performance and engagement
    const similarQuery = `performance:${targetAccount.performanceScore} engagement:${targetAccount.engagementRate}`;
    
    return await this.searchAnalytics(similarQuery, {
      platform,
      limit,
      filters: {
        minPerformance: targetAccount.performanceScore * 0.8,
        maxPerformance: targetAccount.performanceScore * 1.2
      }
    });
  }

  async getAccountById(accountId, platform = 'combined') {
    try {
      const results = await search(this.searchIndexes[platform], {
        term: accountId,
        properties: ['accountId'],
        limit: 1
      });

      return results.hits.length > 0 ? results.hits[0].document : null;
    } catch (error) {
      console.error('Error getting account by ID:', error);
      return null;
    }
  }

  // ===== TREND ANALYSIS =====

  async analyzeTrends(platform = 'combined', days = 30) {
    const cutoffDate = moment().subtract(days, 'days').toISOString();
    
    const results = await this.searchAnalytics('', {
      platform,
      filters: {
        analysisDate: { gte: cutoffDate }
      },
      limit: 1000
    });

    const trends = {
      averagePerformance: 0,
      averageEngagement: 0,
      topIssues: {},
      topRecommendations: {},
      platformBreakdown: {},
      categoryBreakdown: {}
    };

    if (results.hits.length > 0) {
      trends.averagePerformance = _.mean(results.hits.map(h => h.performanceScore));
      trends.averageEngagement = _.mean(results.hits.map(h => h.engagementRate));
      
      // Analyze issues
      results.hits.forEach(hit => {
        const issues = hit.issues.split(';');
        issues.forEach(issue => {
          const issueType = issue.split(':')[0];
          trends.topIssues[issueType] = (trends.topIssues[issueType] || 0) + 1;
        });
      });

      // Analyze recommendations
      results.hits.forEach(hit => {
        const recommendations = hit.recommendations.split(';');
        recommendations.forEach(rec => {
          const recType = rec.split(':')[0];
          trends.topRecommendations[recType] = (trends.topRecommendations[recType] || 0) + 1;
        });
      });

      // Platform breakdown
      trends.platformBreakdown = _.countBy(results.hits, 'platform');
      
      // Category breakdown
      trends.categoryBreakdown = _.countBy(results.hits, 'category');
    }

    return trends;
  }

  // ===== INDEX MANAGEMENT =====

  async getIndexInfo(platform = 'combined') {
    try {
      const info = await getInfo(this.searchIndexes[platform]);
      return {
        platform,
        documentCount: info.documentCount,
        schema: info.schema,
        size: info.size
      };
    } catch (error) {
      console.error('Error getting index info:', error);
      return null;
    }
  }

  async getAllIndexInfo() {
    const platforms = ['youtube', 'tiktok', 'instagram', 'combined'];
    const info = {};

    for (const platform of platforms) {
      info[platform] = await this.getIndexInfo(platform);
    }

    return info;
  }

  async clearIndex(platform) {
    try {
      // Note: Lyra doesn't have a direct clear method, so we'd need to recreate the index
      console.log(`Clearing ${platform} index...`);
      
      // Recreate the index
      this.searchIndexes[platform] = await create({
        schema: this.searchIndexes[platform].schema,
        defaultLanguage: 'english'
      });

      console.log(`✅ ${platform} index cleared`);
    } catch (error) {
      console.error(`Error clearing ${platform} index:`, error);
    }
  }

  async reindexAll() {
    console.log('🔄 Reindexing all LyraLytics data...');
    
    // Clear all indexes
    for (const platform of ['youtube', 'tiktok', 'instagram', 'combined']) {
      await this.clearIndex(platform);
    }

    // Reload all data
    await this.loadExistingData();
    
    console.log('✅ All LyraLytics data reindexed successfully');
  }

  // ===== UTILITY FUNCTIONS =====

  async addAnalyticsRecord(record) {
    try {
      switch (record.platform) {
        case 'youtube':
          await this.indexYouTubeRecord(record);
          break;
        case 'tiktok':
          await this.indexTikTokRecord(record);
          break;
        case 'instagram':
          await this.indexInstagramRecord(record);
          break;
        default:
          throw new Error(`Unknown platform: ${record.platform}`);
      }

      console.log(`✅ Indexed ${record.platform} record for ${record.channelId || record.username} in LyraLytics`);
    } catch (error) {
      console.error('Error adding analytics record:', error);
      throw error;
    }
  }

  async removeAnalyticsRecord(recordId, platform) {
    try {
      await remove(this.searchIndexes[platform], recordId);
      console.log(`✅ Removed record ${recordId} from ${platform} index`);
    } catch (error) {
      console.error('Error removing analytics record:', error);
      throw error;
    }
  }
}

// Example usage and testing
async function demonstrateLyraSearch() {
  console.log('🔍 LyraLytics Search Engine Demo\n');

  const searchEngine = new LyraSearchEngine();
  
  try {
    // Initialize the search engine
    await searchEngine.initialize();

    // Get index information
    const indexInfo = await searchEngine.getAllIndexInfo();
    console.log('📊 Index Information:', indexInfo);

    // Search examples
    console.log('\n🔍 Search Examples:');
    
    // Search for high-performing accounts
    const topPerformers = await searchEngine.findTopPerformers('combined', 5);
    console.log('🏆 Top Performers:', topPerformers.hits.length);

    // Search for accounts with engagement issues
    const engagementIssues = await searchEngine.searchIssues('engagement', 'combined');
    console.log('⚠️ Accounts with Engagement Issues:', engagementIssues.hits.length);

    // Search for optimization recommendations
    const recommendations = await searchEngine.searchRecommendations('title', 'youtube');
    console.log('💡 Title Optimization Recommendations:', recommendations.hits.length);

    // Analyze trends
    const trends = await searchEngine.analyzeTrends('combined', 30);
    console.log('📈 Recent Trends:', {
      averagePerformance: trends.averagePerformance.toFixed(2),
      averageEngagement: (trends.averageEngagement * 100).toFixed(2) + '%',
      topIssues: Object.keys(trends.topIssues).slice(0, 3)
    });

    console.log('\n✅ LyraLytics Search Engine demo completed successfully!');

  } catch (error) {
    console.error('❌ LyraLytics Search Engine demo failed:', error);
  }
}

module.exports = {
  LyraSearchEngine,
  demonstrateLyraSearch
};

// Run demo if this file is executed directly
if (require.main === module) {
  demonstrateLyraSearch();
} 