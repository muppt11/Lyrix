const moment = require('moment-timezone');
const _ = require('lodash');
const { LyraSearchEngine } = require('./lyra-search');
const SocialMediaAnalytics = require('./social-analytics');
const GoogleCloudConsole = require('./google-cloud');
require('dotenv').config();

class BusinessInsights {
  constructor() {
    this.searchEngine = new LyraSearchEngine();
    this.analytics = new SocialMediaAnalytics();
    this.gcp = new GoogleCloudConsole();
    this.insights = new Map();
    this.reports = new Map();
    this.alerts = new Map();
    this.initialize();
  }

  async initialize() {
    try {
      console.log('🧠 Initializing LyraLytics Business Insights Engine...');
      await this.searchEngine.initialize();
      this.loadInsightTemplates();
      console.log('✅ Business Insights Engine initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Business Insights:', error);
    }
  }

  loadInsightTemplates() {
    // Performance Insights
    this.insights.set('performance', {
      name: 'Performance Analysis',
      description: 'Comprehensive performance insights across all platforms',
      metrics: ['engagement_rate', 'growth_rate', 'reach_rate', 'conversion_rate'],
      thresholds: {
        excellent: { engagement: 0.08, growth: 0.05, reach: 0.15 },
        good: { engagement: 0.05, growth: 0.02, reach: 0.10 },
        poor: { engagement: 0.02, growth: -0.01, reach: 0.05 }
      }
    });

    // Content Insights
    this.insights.set('content', {
      name: 'Content Performance Analysis',
      description: 'Deep dive into content performance and optimization',
      metrics: ['content_engagement', 'content_reach', 'content_virality'],
      analysis: ['title_optimization', 'description_analysis', 'hashtag_performance']
    });

    // Audience Insights
    this.insights.set('audience', {
      name: 'Audience Behavior Analysis',
      description: 'Understanding your audience and their behavior patterns',
      metrics: ['audience_growth', 'audience_engagement', 'audience_retention'],
      segments: ['new_followers', 'active_followers', 'lapsed_followers']
    });

    // Competitive Insights
    this.insights.set('competitive', {
      name: 'Competitive Analysis',
      description: 'Benchmarking against competitors and industry standards',
      metrics: ['market_position', 'competitive_gap', 'opportunity_analysis'],
      benchmarks: ['industry_average', 'top_performers', 'direct_competitors']
    });

    // ROI Insights
    this.insights.set('roi', {
      name: 'Return on Investment Analysis',
      description: 'Measuring marketing ROI and business impact',
      metrics: ['cost_per_acquisition', 'lifetime_value', 'conversion_rate'],
      calculations: ['roi_per_platform', 'roi_per_campaign', 'roi_trends']
    });
  }

  async generateComprehensiveInsights(businessId, timeframe = '30d') {
    console.log(`🧠 Generating comprehensive insights for business ${businessId}...`);

    const insights = {
      businessId,
      timeframe,
      generatedAt: new Date(),
      summary: {},
      performance: {},
      content: {},
      audience: {},
      competitive: {},
      roi: {},
      recommendations: [],
      alerts: [],
      trends: {}
    };

    try {
      // Collect all analytics data
      const analyticsData = await this.collectAnalyticsData(businessId, timeframe);
      
      // Generate performance insights
      insights.performance = await this.generatePerformanceInsights(analyticsData);
      
      // Generate content insights
      insights.content = await this.generateContentInsights(analyticsData);
      
      // Generate audience insights
      insights.audience = await this.generateAudienceInsights(analyticsData);
      
      // Generate competitive insights
      insights.competitive = await this.generateCompetitiveInsights(analyticsData);
      
      // Generate ROI insights
      insights.roi = await this.generateROIInsights(analyticsData);
      
      // Generate trends
      insights.trends = await this.generateTrendInsights(analyticsData);
      
      // Generate executive summary
      insights.summary = this.generateExecutiveSummary(insights);
      
      // Generate recommendations
      insights.recommendations = this.generateRecommendations(insights);
      
      // Generate alerts
      insights.alerts = this.generateAlerts(insights);
      
      // Store insights
      this.reports.set(businessId, insights);
      
      console.log(`✅ Comprehensive insights generated for ${businessId}`);
      return insights;

    } catch (error) {
      console.error('Error generating comprehensive insights:', error);
      throw error;
    }
  }

  async collectAnalyticsData(businessId, timeframe) {
    const data = {
      youtube: [],
      tiktok: [],
      instagram: [],
      combined: []
    };

    try {
      // Get data from Lyra search engine
      for (const platform of ['youtube', 'tiktok', 'instagram']) {
        const results = await this.searchEngine.searchAnalytics('', {
          platform,
          limit: 100,
          sortBy: 'analysisDate',
          sortOrder: 'desc'
        });
        
        data[platform] = results.hits;
      }

      // Get combined data
      const combinedResults = await this.searchEngine.searchAnalytics('', {
        platform: 'combined',
        limit: 100,
        sortBy: 'analysisDate',
        sortOrder: 'desc'
      });
      
      data.combined = combinedResults.hits;

    } catch (error) {
      console.error('Error collecting analytics data:', error);
    }

    return data;
  }

  async generatePerformanceInsights(analyticsData) {
    const insights = {
      overall: {},
      byPlatform: {},
      trends: {},
      benchmarks: {}
    };

    // Calculate overall performance
    const allData = Object.values(analyticsData).flat();
    if (allData.length > 0) {
      insights.overall = {
        averageEngagement: _.mean(allData.map(d => d.engagementRate || 0)),
        averagePerformance: _.mean(allData.map(d => d.performanceScore || 0)),
        totalFollowers: _.sum(allData.map(d => d.followerCount || d.subscriberCount || 0)),
        growthRate: this.calculateGrowthRate(allData),
        topPerformers: this.findTopPerformers(allData, 5)
      };
    }

    // Calculate platform-specific performance
    for (const [platform, data] of Object.entries(analyticsData)) {
      if (data.length > 0) {
        insights.byPlatform[platform] = {
          averageEngagement: _.mean(data.map(d => d.engagementRate || 0)),
          averagePerformance: _.mean(data.map(d => d.performanceScore || 0)),
          totalFollowers: _.sum(data.map(d => d.followerCount || d.subscriberCount || 0)),
          growthRate: this.calculateGrowthRate(data),
          bestPerformingContent: this.findBestPerformingContent(data)
        };
      }
    }

    // Calculate trends
    insights.trends = this.calculatePerformanceTrends(analyticsData);

    // Set benchmarks
    insights.benchmarks = this.setPerformanceBenchmarks(insights.overall);

    return insights;
  }

  async generateContentInsights(analyticsData) {
    const insights = {
      performance: {},
      optimization: {},
      trends: {},
      recommendations: []
    };

    // Analyze content performance across platforms
    for (const [platform, data] of Object.entries(analyticsData)) {
      if (data.length > 0) {
        insights.performance[platform] = {
          averageContentScore: _.mean(data.map(d => d.contentScore || 0)),
          topContentTypes: this.analyzeContentTypes(data),
          contentEngagement: this.analyzeContentEngagement(data),
          viralContent: this.findViralContent(data)
        };
      }
    }

    // Generate content optimization insights
    insights.optimization = this.generateContentOptimizationInsights(analyticsData);

    // Generate content trends
    insights.trends = this.analyzeContentTrends(analyticsData);

    // Generate content recommendations
    insights.recommendations = this.generateContentRecommendations(insights);

    return insights;
  }

  async generateAudienceInsights(analyticsData) {
    const insights = {
      demographics: {},
      behavior: {},
      growth: {},
      segments: {},
      engagement: {}
    };

    // Analyze audience growth
    for (const [platform, data] of Object.entries(analyticsData)) {
      if (data.length > 0) {
        insights.growth[platform] = {
          growthRate: this.calculateGrowthRate(data),
          followerRetention: this.calculateFollowerRetention(data),
          audienceQuality: this.assessAudienceQuality(data),
          growthTrends: this.analyzeGrowthTrends(data)
        };
      }
    }

    // Analyze audience behavior
    insights.behavior = this.analyzeAudienceBehavior(analyticsData);

    // Segment audience
    insights.segments = this.segmentAudience(analyticsData);

    // Analyze engagement patterns
    insights.engagement = this.analyzeEngagementPatterns(analyticsData);

    return insights;
  }

  async generateCompetitiveInsights(analyticsData) {
    const insights = {
      marketPosition: {},
      competitiveGap: {},
      opportunities: {},
      threats: {},
      benchmarks: {}
    };

    // Get competitive data (simulated for demo)
    const competitiveData = this.getCompetitiveData();

    // Analyze market position
    insights.marketPosition = this.analyzeMarketPosition(analyticsData, competitiveData);

    // Identify competitive gaps
    insights.competitiveGap = this.identifyCompetitiveGaps(analyticsData, competitiveData);

    // Find opportunities
    insights.opportunities = this.findOpportunities(insights.competitiveGap);

    // Identify threats
    insights.threats = this.identifyThreats(analyticsData, competitiveData);

    // Set competitive benchmarks
    insights.benchmarks = this.setCompetitiveBenchmarks(competitiveData);

    return insights;
  }

  async generateROIInsights(analyticsData) {
    const insights = {
      overall: {},
      byPlatform: {},
      byCampaign: {},
      trends: {},
      recommendations: []
    };

    // Calculate overall ROI
    insights.overall = this.calculateOverallROI(analyticsData);

    // Calculate platform-specific ROI
    for (const [platform, data] of Object.entries(analyticsData)) {
      if (data.length > 0) {
        insights.byPlatform[platform] = this.calculatePlatformROI(data, platform);
      }
    }

    // Analyze ROI trends
    insights.trends = this.analyzeROITrends(analyticsData);

    // Generate ROI recommendations
    insights.recommendations = this.generateROIRecommendations(insights);

    return insights;
  }

  async generateTrendInsights(analyticsData) {
    const insights = {
      performance: {},
      content: {},
      audience: {},
      market: {}
    };

    // Analyze performance trends
    insights.performance = this.analyzePerformanceTrends(analyticsData);

    // Analyze content trends
    insights.content = this.analyzeContentTrends(analyticsData);

    // Analyze audience trends
    insights.audience = this.analyzeAudienceTrends(analyticsData);

    // Analyze market trends
    insights.market = this.analyzeMarketTrends(analyticsData);

    return insights;
  }

  generateExecutiveSummary(insights) {
    const summary = {
      keyMetrics: {},
      highlights: [],
      challenges: [],
      opportunities: [],
      recommendations: []
    };

    // Key metrics
    if (insights.performance.overall) {
      summary.keyMetrics = {
        averageEngagement: `${(insights.performance.overall.averageEngagement * 100).toFixed(2)}%`,
        averagePerformance: `${(insights.performance.overall.averagePerformance * 100).toFixed(1)}%`,
        totalFollowers: insights.performance.overall.totalFollowers.toLocaleString(),
        growthRate: `${(insights.performance.overall.growthRate * 100).toFixed(2)}%`
      };
    }

    // Highlights
    if (insights.performance.overall.averageEngagement > 0.05) {
      summary.highlights.push('Above-average engagement rates across platforms');
    }

    if (insights.performance.overall.growthRate > 0.02) {
      summary.highlights.push('Strong audience growth trend');
    }

    // Challenges
    if (insights.alerts.length > 0) {
      summary.challenges.push(`${insights.alerts.length} performance alerts need attention`);
    }

    // Opportunities
    if (insights.competitive.opportunities) {
      summary.opportunities.push('Identified competitive gaps to exploit');
    }

    // Top recommendations
    summary.recommendations = insights.recommendations.slice(0, 3);

    return summary;
  }

  generateRecommendations(insights) {
    const recommendations = [];

    // Performance-based recommendations
    if (insights.performance.overall) {
      if (insights.performance.overall.averageEngagement < 0.03) {
        recommendations.push({
          category: 'engagement',
          title: 'Improve Content Engagement',
          description: 'Your engagement rate is below industry average. Focus on creating more interactive and engaging content.',
          priority: 'high',
          expectedImpact: 'Increase engagement by 25-50%',
          actionItems: [
            'Create more interactive content (polls, questions, stories)',
            'Respond to comments within 2 hours',
            'Use trending hashtags and topics',
            'Collaborate with influencers in your niche'
          ]
        });
      }
    }

    // Content-based recommendations
    if (insights.content.optimization) {
      recommendations.push({
        category: 'content',
        title: 'Optimize Content Strategy',
        description: 'Based on content performance analysis, optimize your content creation and posting strategy.',
        priority: 'medium',
        expectedImpact: 'Improve content performance by 15-30%',
        actionItems: [
          'Post at optimal times based on audience activity',
          'Use data-driven content themes',
          'Optimize post descriptions and hashtags',
          'Create more video content'
        ]
      });
    }

    // ROI-based recommendations
    if (insights.roi.overall) {
      recommendations.push({
        category: 'roi',
        title: 'Optimize Marketing Spend',
        description: 'Focus resources on high-performing platforms and content types.',
        priority: 'high',
        expectedImpact: 'Improve ROI by 20-40%',
        actionItems: [
          'Allocate more budget to top-performing platforms',
          'Invest in content that drives conversions',
          'Optimize ad targeting based on audience insights',
          'Implement conversion tracking'
        ]
      });
    }

    return recommendations;
  }

  generateAlerts(insights) {
    const alerts = [];

    // Performance alerts
    if (insights.performance.overall) {
      if (insights.performance.overall.averageEngagement < 0.02) {
        alerts.push({
          type: 'low_engagement',
          severity: 'high',
          title: 'Critical: Low Engagement Rate',
          description: 'Your engagement rate is critically low and needs immediate attention.',
          impact: 'Poor engagement can hurt algorithm ranking and audience growth',
          recommendations: [
            'Review and improve content quality',
            'Increase audience interaction',
            'Analyze competitor content strategies'
          ]
        });
      }

      if (insights.performance.overall.growthRate < -0.01) {
        alerts.push({
          type: 'negative_growth',
          severity: 'medium',
          title: 'Warning: Negative Growth Trend',
          description: 'Your audience is declining, which may indicate content or strategy issues.',
          impact: 'Declining audience can affect reach and engagement',
          recommendations: [
            'Analyze recent content performance',
            'Review posting schedule and frequency',
            'Engage with existing audience more actively'
          ]
        });
      }
    }

    // Content alerts
    if (insights.content.performance) {
      for (const [platform, performance] of Object.entries(insights.content.performance)) {
        if (performance.averageContentScore < 0.5) {
          alerts.push({
            type: 'poor_content_performance',
            severity: 'medium',
            title: `Poor Content Performance on ${platform}`,
            description: `Content on ${platform} is underperforming compared to benchmarks.`,
            impact: 'Poor content can hurt platform algorithm ranking',
            recommendations: [
              'Analyze top-performing content on the platform',
              'Optimize content format and style',
              'Review posting times and frequency'
            ]
          });
        }
      }
    }

    return alerts;
  }

  // Helper methods
  calculateGrowthRate(data) {
    if (data.length < 2) return 0;
    
    const recent = data[0];
    const previous = data[1];
    
    const recentFollowers = recent.followerCount || recent.subscriberCount || 0;
    const previousFollowers = previous.followerCount || previous.subscriberCount || 0;
    
    if (previousFollowers === 0) return 0;
    
    return (recentFollowers - previousFollowers) / previousFollowers;
  }

  findTopPerformers(data, limit = 5) {
    return data
      .sort((a, b) => (b.performanceScore || 0) - (a.performanceScore || 0))
      .slice(0, limit)
      .map(item => ({
        id: item.id,
        name: item.accountName || item.channelName || item.username,
        platform: item.platform,
        performanceScore: item.performanceScore,
        engagementRate: item.engagementRate
      }));
  }

  findBestPerformingContent(data) {
    return data
      .filter(item => item.contentAnalysis)
      .sort((a, b) => (b.contentScore || 0) - (a.contentScore || 0))
      .slice(0, 3)
      .map(item => ({
        title: item.contentAnalysis?.title || 'Unknown',
        score: item.contentScore,
        engagement: item.engagementRate
      }));
  }

  calculatePerformanceTrends(analyticsData) {
    const trends = {};
    
    for (const [platform, data] of Object.entries(analyticsData)) {
      if (data.length >= 7) {
        const weeklyData = data.slice(0, 7);
        trends[platform] = {
          engagement: this.calculateTrend(weeklyData.map(d => d.engagementRate || 0)),
          performance: this.calculateTrend(weeklyData.map(d => d.performanceScore || 0)),
          growth: this.calculateTrend(weeklyData.map(d => d.followerCount || d.subscriberCount || 0))
        };
      }
    }
    
    return trends;
  }

  calculateTrend(values) {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = _.mean(firstHalf);
    const secondAvg = _.mean(secondHalf);
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  }

  setPerformanceBenchmarks(overall) {
    return {
      engagement: {
        excellent: 0.08,
        good: 0.05,
        poor: 0.02,
        current: overall.averageEngagement
      },
      performance: {
        excellent: 0.8,
        good: 0.6,
        poor: 0.4,
        current: overall.averagePerformance
      },
      growth: {
        excellent: 0.05,
        good: 0.02,
        poor: -0.01,
        current: overall.growthRate
      }
    };
  }

  analyzeContentTypes(data) {
    const contentTypes = {};
    
    data.forEach(item => {
      if (item.contentAnalysis?.type) {
        const type = item.contentAnalysis.type;
        if (!contentTypes[type]) {
          contentTypes[type] = { count: 0, totalEngagement: 0 };
        }
        contentTypes[type].count++;
        contentTypes[type].totalEngagement += item.engagementRate || 0;
      }
    });
    
    return Object.entries(contentTypes).map(([type, stats]) => ({
      type,
      count: stats.count,
      averageEngagement: stats.totalEngagement / stats.count
    }));
  }

  analyzeContentEngagement(data) {
    return {
      averageEngagement: _.mean(data.map(d => d.engagementRate || 0)),
      engagementRange: {
        min: _.min(data.map(d => d.engagementRate || 0)),
        max: _.max(data.map(d => d.engagementRate || 0))
      },
      topEngagement: data
        .sort((a, b) => (b.engagementRate || 0) - (a.engagementRate || 0))
        .slice(0, 5)
    };
  }

  findViralContent(data) {
    return data
      .filter(item => (item.engagementRate || 0) > 0.1) // 10% engagement threshold
      .sort((a, b) => (b.engagementRate || 0) - (a.engagementRate || 0))
      .slice(0, 3);
  }

  generateContentOptimizationInsights(analyticsData) {
    const insights = {
      bestTimes: this.analyzeBestPostingTimes(analyticsData),
      bestContentTypes: this.analyzeBestContentTypes(analyticsData),
      hashtagPerformance: this.analyzeHashtagPerformance(analyticsData),
      titleOptimization: this.analyzeTitleOptimization(analyticsData)
    };
    
    return insights;
  }

  analyzeBestPostingTimes(analyticsData) {
    // This would analyze posting times vs engagement
    return {
      youtube: ['Tuesday 2-4 PM', 'Thursday 2-4 PM'],
      tiktok: ['Monday 6-8 PM', 'Wednesday 6-8 PM'],
      instagram: ['Tuesday 1-3 PM', 'Friday 1-3 PM']
    };
  }

  analyzeBestContentTypes(analyticsData) {
    const contentTypes = {};
    
    for (const [platform, data] of Object.entries(analyticsData)) {
      contentTypes[platform] = this.analyzeContentTypes(data);
    }
    
    return contentTypes;
  }

  analyzeHashtagPerformance(analyticsData) {
    // This would analyze hashtag usage and performance
    return {
      topHashtags: ['#marketing', '#business', '#growth'],
      hashtagEngagement: {
        '#marketing': 0.08,
        '#business': 0.06,
        '#growth': 0.05
      }
    };
  }

  analyzeTitleOptimization(analyticsData) {
    // This would analyze title performance
    return {
      optimalLength: '50-60 characters',
      topKeywords: ['how to', 'best', 'tips', 'guide'],
      performanceFactors: ['clarity', 'urgency', 'benefit-focused']
    };
  }

  analyzeContentTrends(analyticsData) {
    return {
      videoGrowth: '+15%',
      storyEngagement: '+25%',
      liveContent: '+40%',
      userGeneratedContent: '+30%'
    };
  }

  generateContentRecommendations(insights) {
    const recommendations = [];
    
    if (insights.performance) {
      for (const [platform, performance] of Object.entries(insights.performance)) {
        if (performance.averageEngagement < 0.05) {
          recommendations.push({
            platform,
            type: 'engagement',
            recommendation: `Focus on interactive content for ${platform}`,
            priority: 'high'
          });
        }
      }
    }
    
    return recommendations;
  }

  calculateFollowerRetention(data) {
    // This would calculate follower retention rate
    return 0.85; // 85% retention rate
  }

  assessAudienceQuality(data) {
    // This would assess audience quality based on engagement and behavior
    return {
      score: 0.75,
      factors: ['high engagement', 'active participation', 'quality interactions']
    };
  }

  analyzeGrowthTrends(data) {
    return {
      trend: 'increasing',
      rate: 0.03,
      factors: ['consistent posting', 'quality content', 'audience engagement']
    };
  }

  analyzeAudienceBehavior(analyticsData) {
    return {
      activeHours: ['9-11 AM', '2-4 PM', '7-9 PM'],
      preferredContent: ['video', 'images', 'stories'],
      interactionPatterns: ['comments', 'shares', 'saves']
    };
  }

  segmentAudience(analyticsData) {
    return {
      newFollowers: { count: 150, engagement: 0.04 },
      activeFollowers: { count: 500, engagement: 0.08 },
      lapsedFollowers: { count: 50, engagement: 0.01 }
    };
  }

  analyzeEngagementPatterns(analyticsData) {
    return {
      commentRate: 0.02,
      shareRate: 0.01,
      saveRate: 0.005,
      clickRate: 0.03
    };
  }

  getCompetitiveData() {
    // Simulated competitive data
    return {
      industry_average: {
        engagement: 0.05,
        growth: 0.02,
        reach: 0.10
      },
      top_performers: {
        engagement: 0.12,
        growth: 0.08,
        reach: 0.25
      },
      direct_competitors: [
        { name: 'Competitor A', engagement: 0.06, growth: 0.03 },
        { name: 'Competitor B', engagement: 0.04, growth: 0.01 },
        { name: 'Competitor C', engagement: 0.08, growth: 0.05 }
      ]
    };
  }

  analyzeMarketPosition(analyticsData, competitiveData) {
    const overall = this.calculateOverallMetrics(analyticsData);
    
    return {
      engagement: {
        current: overall.averageEngagement,
        industry: competitiveData.industry_average.engagement,
        position: overall.averageEngagement > competitiveData.industry_average.engagement ? 'above' : 'below'
      },
      growth: {
        current: overall.growthRate,
        industry: competitiveData.industry_average.growth,
        position: overall.growthRate > competitiveData.industry_average.growth ? 'above' : 'below'
      }
    };
  }

  calculateOverallMetrics(analyticsData) {
    const allData = Object.values(analyticsData).flat();
    
    return {
      averageEngagement: _.mean(allData.map(d => d.engagementRate || 0)),
      growthRate: this.calculateGrowthRate(allData),
      totalFollowers: _.sum(allData.map(d => d.followerCount || d.subscriberCount || 0))
    };
  }

  identifyCompetitiveGaps(analyticsData, competitiveData) {
    const overall = this.calculateOverallMetrics(analyticsData);
    
    return {
      engagement: {
        gap: competitiveData.industry_average.engagement - overall.averageEngagement,
        opportunity: overall.averageEngagement < competitiveData.industry_average.engagement
      },
      growth: {
        gap: competitiveData.industry_average.growth - overall.growthRate,
        opportunity: overall.growthRate < competitiveData.industry_average.growth
      }
    };
  }

  findOpportunities(competitiveGap) {
    const opportunities = [];
    
    if (competitiveGap.engagement.opportunity) {
      opportunities.push({
        type: 'engagement',
        description: 'Improve engagement to reach industry average',
        potential: 'High',
        effort: 'Medium'
      });
    }
    
    if (competitiveGap.growth.opportunity) {
      opportunities.push({
        type: 'growth',
        description: 'Accelerate growth to match industry standards',
        potential: 'High',
        effort: 'High'
      });
    }
    
    return opportunities;
  }

  identifyThreats(analyticsData, competitiveData) {
    const threats = [];
    
    // Analyze competitor performance
    competitiveData.direct_competitors.forEach(competitor => {
      if (competitor.engagement > 0.08) {
        threats.push({
          type: 'competitor',
          description: `${competitor.name} has high engagement rate`,
          severity: 'medium',
          impact: 'Could attract your audience'
        });
      }
    });
    
    return threats;
  }

  setCompetitiveBenchmarks(competitiveData) {
    return {
      engagement: {
        industry: competitiveData.industry_average.engagement,
        top: competitiveData.top_performers.engagement,
        target: competitiveData.industry_average.engagement * 1.2
      },
      growth: {
        industry: competitiveData.industry_average.growth,
        top: competitiveData.top_performers.growth,
        target: competitiveData.industry_average.growth * 1.5
      }
    };
  }

  calculateOverallROI(analyticsData) {
    // Simulated ROI calculation
    return {
      totalInvestment: 5000,
      totalRevenue: 15000,
      roi: 2.0, // 200% ROI
      costPerAcquisition: 25,
      lifetimeValue: 150,
      paybackPeriod: 3 // months
    };
  }

  calculatePlatformROI(data, platform) {
    // Simulated platform-specific ROI
    const platformROI = {
      youtube: { roi: 2.5, costPerAcquisition: 20 },
      tiktok: { roi: 1.8, costPerAcquisition: 15 },
      instagram: { roi: 2.2, costPerAcquisition: 30 }
    };
    
    return platformROI[platform] || { roi: 1.5, costPerAcquisition: 25 };
  }

  analyzeROITrends(analyticsData) {
    return {
      trend: 'increasing',
      monthlyGrowth: 0.15,
      seasonalPatterns: ['Q4 peak', 'Q1 dip', 'Q2 recovery'],
      factors: ['improved targeting', 'better content', 'optimized spend']
    };
  }

  generateROIRecommendations(insights) {
    const recommendations = [];
    
    if (insights.overall.roi < 2.0) {
      recommendations.push({
        type: 'roi_optimization',
        description: 'Focus on high-ROI platforms and content types',
        priority: 'high',
        expectedImpact: 'Increase ROI by 25-50%'
      });
    }
    
    return recommendations;
  }

  // Public API methods
  async getInsights(businessId) {
    return this.reports.get(businessId);
  }

  async getInsightTypes() {
    return Array.from(this.insights.entries()).map(([id, insight]) => ({
      id,
      ...insight
    }));
  }

  async generateSpecificInsight(businessId, insightType, timeframe = '30d') {
    const analyticsData = await this.collectAnalyticsData(businessId, timeframe);
    
    switch (insightType) {
      case 'performance':
        return await this.generatePerformanceInsights(analyticsData);
      case 'content':
        return await this.generateContentInsights(analyticsData);
      case 'audience':
        return await this.generateAudienceInsights(analyticsData);
      case 'competitive':
        return await this.generateCompetitiveInsights(analyticsData);
      case 'roi':
        return await this.generateROIInsights(analyticsData);
      default:
        throw new Error(`Unknown insight type: ${insightType}`);
    }
  }

  async exportInsights(businessId, format = 'json') {
    const insights = this.reports.get(businessId);
    if (!insights) {
      throw new Error(`No insights found for business ${businessId}`);
    }

    switch (format) {
      case 'json':
        return JSON.stringify(insights, null, 2);
      case 'csv':
        return this.convertToCSV(insights);
      case 'pdf':
        return this.convertToPDF(insights);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  convertToCSV(insights) {
    // Convert insights to CSV format
    const csv = [];
    
    // Add summary
    csv.push('Category,Metric,Value');
    csv.push(`Engagement,Average,${(insights.performance.overall.averageEngagement * 100).toFixed(2)}%`);
    csv.push(`Performance,Average,${(insights.performance.overall.averagePerformance * 100).toFixed(1)}%`);
    csv.push(`Growth,Rate,${(insights.performance.overall.growthRate * 100).toFixed(2)}%`);
    
    return csv.join('\n');
  }

  convertToPDF(insights) {
    // This would generate a PDF report
    return 'PDF report generated';
  }
}

// Example usage and testing
async function demonstrateBusinessInsights() {
  console.log('🧠 LyraLytics Business Insights Demo\n');

  const insights = new BusinessInsights();
  
  try {
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('📊 Available Insight Types:');
    const insightTypes = await insights.getInsightTypes();
    insightTypes.forEach(type => {
      console.log(`  • ${type.name}: ${type.description}`);
    });

    console.log('\n🔍 Generating Comprehensive Business Insights...');
    const businessId = 'demo_business_001';
    const comprehensiveInsights = await insights.generateComprehensiveInsights(businessId, '30d');

    console.log('\n📈 Key Insights Summary:');
    console.log(`  • Average Engagement: ${(comprehensiveInsights.performance.overall.averageEngagement * 100).toFixed(2)}%`);
    console.log(`  • Average Performance: ${(comprehensiveInsights.performance.overall.averagePerformance * 100).toFixed(1)}%`);
    console.log(`  • Growth Rate: ${(comprehensiveInsights.performance.overall.growthRate * 100).toFixed(2)}%`);
    console.log(`  • Total Followers: ${comprehensiveInsights.performance.overall.totalFollowers.toLocaleString()}`);

    console.log('\n💡 Top Recommendations:');
    comprehensiveInsights.recommendations.slice(0, 3).forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec.title}`);
      console.log(`     ${rec.description}`);
    });

    console.log('\n⚠️ Alerts:');
    comprehensiveInsights.alerts.forEach(alert => {
      console.log(`  • ${alert.title}: ${alert.description}`);
    });

    console.log('\n📊 Platform Performance:');
    Object.entries(comprehensiveInsights.performance.byPlatform).forEach(([platform, perf]) => {
      console.log(`  • ${platform}: ${(perf.averageEngagement * 100).toFixed(2)}% engagement`);
    });

    console.log('\n✅ Business Insights demo completed successfully!');

  } catch (error) {
    console.error('❌ Business Insights demo failed:', error);
  }
}

module.exports = {
  BusinessInsights,
  demonstrateBusinessInsights
};

// Run demo if this file is executed directly
if (require.main === module) {
  demonstrateBusinessInsights();
} 