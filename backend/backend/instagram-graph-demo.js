const InstagramGraphAPI = require('./instagram-graph-api');
require('dotenv').config();

class InstagramGraphDemo {
  constructor() {
    this.instagram = new InstagramGraphAPI();
  }

  async demonstrateBusinessAccountSetup() {
    console.log('\n📸 Instagram Graph API - Business Account Setup');
    console.log('=' .repeat(60));

    try {
      console.log('\n🔧 Required Configuration:');
      console.log('• Instagram Business Account');
      console.log('• Facebook App with Instagram Basic Display');
      console.log('• Instagram Graph API permissions');
      console.log('• Access token with required scopes');
      console.log('');

      console.log('📋 Environment Variables Needed:');
      console.log('INSTAGRAM_ACCESS_TOKEN=your_long_lived_access_token');
      console.log('INSTAGRAM_BUSINESS_ACCOUNT_ID=your_business_account_id');
      console.log('INSTAGRAM_APP_ID=your_facebook_app_id');
      console.log('INSTAGRAM_APP_SECRET=your_facebook_app_secret');
      console.log('');

      console.log('🔑 Required API Permissions:');
      console.log('• instagram_basic');
      console.log('• instagram_content_publish');
      console.log('• instagram_manage_insights');
      console.log('• pages_read_engagement');
      console.log('• pages_show_list');
      console.log('');

      console.log('📚 Setup Steps:');
      console.log('1. Create a Facebook App at developers.facebook.com');
      console.log('2. Add Instagram Basic Display product');
      console.log('3. Configure Instagram Basic Display');
      console.log('4. Generate long-lived access token');
      console.log('5. Connect your Instagram Business Account');
      console.log('6. Get your Business Account ID');
      console.log('7. Configure environment variables');
      console.log('');

    } catch (error) {
      console.error('❌ Business account setup demo failed:', error.message);
    }
  }

  async demonstrateHashtagAnalysis() {
    console.log('\n📊 Instagram Graph API - Hashtag Analysis');
    console.log('=' .repeat(60));

    try {
      await this.instagram.initialize();

      console.log('\n🔍 Hashtag Analysis Features:');
      console.log('• Search hashtags by keyword');
      console.log('• Get hashtag information and media count');
      console.log('• Analyze top and recent media for hashtags');
      console.log('• Track hashtag performance over time');
      console.log('• Categorize hashtags by topic');
      console.log('• Calculate engagement potential');
      console.log('');

      // Search for trending hashtags
      console.log('🔎 Searching for trending hashtags...');
      const trendingHashtags = await this.instagram.getTrendingHashtags(10);
      
      console.log(`✅ Found ${trendingHashtags.length} trending hashtags`);
      
      console.log('\n🔥 Top 5 Trending Hashtags:');
      trendingHashtags.slice(0, 5).forEach((hashtag, index) => {
        console.log(`${index + 1}. ${hashtag.name}`);
        console.log(`   Media Count: ${hashtag.media_count?.toLocaleString() || 'N/A'}`);
        console.log(`   Trending Score: ${hashtag.trending_score?.toFixed(2) || 'N/A'}`);
        console.log(`   Category: ${this.instagram.categorizeHashtag(hashtag.name)}`);
        console.log('');
      });

      // Analyze hashtag performance
      console.log('📈 Analyzing hashtag performance...');
      const hashtagAnalysis = await this.instagram.analyzeHashtagPerformance(trendingHashtags);
      
      console.log('\n📊 Hashtag Performance Summary:');
      console.log(`Total Hashtags Analyzed: ${hashtagAnalysis.total_hashtags}`);
      console.log(`Average Media Count: ${hashtagAnalysis.average_media_count.toLocaleString()}`);
      
      console.log('\n🏆 Top Performing Hashtags:');
      hashtagAnalysis.top_performing_hashtags.slice(0, 5).forEach((hashtag, index) => {
        console.log(`${index + 1}. ${hashtag.name} - ${hashtag.media_count?.toLocaleString()} posts`);
      });

      console.log('\n📂 Hashtag Categories:');
      Object.entries(hashtagAnalysis.hashtag_categories).forEach(([category, hashtags]) => {
        console.log(`${category}: ${hashtags.length} hashtags`);
      });

      console.log('\n💡 Top Engagement Potential Hashtags:');
      hashtagAnalysis.engagement_potential.slice(0, 5).forEach((hashtag, index) => {
        console.log(`${index + 1}. ${hashtag.hashtag} - Score: ${hashtag.engagement_potential.toFixed(2)}`);
      });

    } catch (error) {
      console.error('❌ Hashtag analysis demo failed:', error.message);
    }
  }

  async demonstrateBusinessInsights() {
    console.log('\n📈 Instagram Graph API - Business Account Insights');
    console.log('=' .repeat(60));

    try {
      console.log('\n📊 Business Account Insights Features:');
      console.log('• Account performance metrics');
      console.log('• Media insights and analytics');
      console.log('• Follower growth tracking');
      console.log('• Engagement rate analysis');
      console.log('• Content performance comparison');
      console.log('');

      // Get business account info
      console.log('👤 Getting business account information...');
      const accountInfo = await this.instagram.getBusinessAccountInfo();
      
      console.log('\n📋 Business Account Details:');
      console.log(`Name: ${accountInfo.name}`);
      console.log(`Username: @${accountInfo.username}`);
      console.log(`Followers: ${accountInfo.followers_count?.toLocaleString() || 'N/A'}`);
      console.log(`Media Count: ${accountInfo.media_count?.toLocaleString() || 'N/A'}`);
      console.log(`Website: ${accountInfo.website || 'Not set'}`);
      console.log(`Bio: ${accountInfo.biography || 'No bio'}`);
      console.log('');

      // Get account insights
      console.log('📈 Getting account insights...');
      const accountInsights = await this.instagram.getBusinessAccountInsights('impressions,reach,engagement', 'day', 7);
      
      console.log('\n📊 Account Performance (Last 7 Days):');
      if (accountInsights.data) {
        accountInsights.data.forEach(insight => {
          console.log(`${insight.name}: ${insight.values?.[0]?.value || 'N/A'}`);
        });
      }

      // Get recent media
      console.log('\n📱 Getting recent media...');
      const recentMedia = await this.instagram.getBusinessMedia(5);
      
      console.log('\n📸 Recent Media Performance:');
      if (recentMedia.data) {
        recentMedia.data.slice(0, 3).forEach((post, index) => {
          console.log(`${index + 1}. ${post.caption?.substring(0, 50)}...`);
          console.log(`   Likes: ${post.like_count?.toLocaleString() || 'N/A'}`);
          console.log(`   Comments: ${post.comments_count?.toLocaleString() || 'N/A'}`);
          console.log(`   Type: ${post.media_type}`);
          console.log('');
        });
      }

    } catch (error) {
      console.error('❌ Business insights demo failed:', error.message);
    }
  }

  async demonstrateCompetitorAnalysis() {
    console.log('\n🔍 Instagram Graph API - Competitor Analysis');
    console.log('=' .repeat(60));

    try {
      console.log('\n🎯 Competitor Analysis Features:');
      console.log('• Analyze competitor hashtag usage');
      console.log('• Track competitor content strategy');
      console.log('• Identify trending hashtags in your niche');
      console.log('• Compare engagement rates');
      console.log('• Find collaboration opportunities');
      console.log('');

      // Example competitor analysis (using a placeholder username)
      console.log('🔍 Analyzing competitor hashtag strategy...');
      console.log('Note: This requires a valid competitor username');
      console.log('');

      console.log('📊 What You Can Analyze:');
      console.log('• Most used hashtags by competitors');
      console.log('• Hashtag frequency and patterns');
      console.log('• Content themes and topics');
      console.log('• Posting frequency and timing');
      console.log('• Engagement patterns');
      console.log('');

      console.log('💡 Competitor Analysis Strategy:');
      console.log('1. Identify top competitors in your niche');
      console.log('2. Analyze their hashtag strategy');
      console.log('3. Find trending hashtags they use');
      console.log('4. Identify content gaps and opportunities');
      console.log('5. Adapt successful strategies to your content');
      console.log('6. Monitor competitor performance regularly');
      console.log('');

    } catch (error) {
      console.error('❌ Competitor analysis demo failed:', error.message);
    }
  }

  async demonstrateTrendingAnalysis() {
    console.log('\n📈 Instagram Graph API - Trending Analysis');
    console.log('=' .repeat(60));

    try {
      console.log('\n🚀 Comprehensive Trending Analysis Features:');
      console.log('• Real-time trending hashtag identification');
      console.log('• Cross-category trend analysis');
      console.log('• Engagement potential calculation');
      console.log('• Personalized recommendations');
      console.log('• Performance tracking over time');
      console.log('');

      console.log('📊 Running comprehensive trending analysis...');
      const trendingAnalysis = await this.instagram.getTrendingAnalysis(20);
      
      console.log('\n📋 Analysis Summary:');
      console.log(`Platform: ${trendingAnalysis.platform}`);
      console.log(`Timestamp: ${trendingAnalysis.timestamp}`);
      console.log(`Business Account: ${trendingAnalysis.business_account?.name}`);
      console.log(`Trending Hashtags Found: ${trendingAnalysis.trending_hashtags.length}`);
      console.log('');

      // Show hashtag analysis
      if (trendingAnalysis.hashtag_analysis) {
        const analysis = trendingAnalysis.hashtag_analysis;
        
        console.log('📊 Hashtag Analysis Results:');
        console.log(`Total Hashtags: ${analysis.total_hashtags}`);
        console.log(`Average Media Count: ${analysis.average_media_count.toLocaleString()}`);
        
        console.log('\n🏆 Top Performing Hashtags:');
        analysis.top_performing_hashtags.slice(0, 5).forEach((hashtag, index) => {
          console.log(`${index + 1}. ${hashtag.name} - ${hashtag.media_count?.toLocaleString()} posts`);
        });

        console.log('\n📂 Category Distribution:');
        Object.entries(analysis.hashtag_categories).forEach(([category, hashtags]) => {
          console.log(`${category}: ${hashtags.length} hashtags`);
        });

        console.log('\n💡 Best Engagement Potential:');
        analysis.engagement_potential.slice(0, 5).forEach((hashtag, index) => {
          console.log(`${index + 1}. ${hashtag.hashtag} - Score: ${hashtag.engagement_potential.toFixed(2)}`);
        });
      }

      // Show recommendations
      if (trendingAnalysis.recommendations) {
        const recs = trendingAnalysis.recommendations;
        
        console.log('\n🎯 Personalized Recommendations:');
        
        console.log('\n📝 Hashtag Strategy:');
        recs.hashtag_strategy.forEach((rec, index) => {
          console.log(`${index + 1}. ${rec}`);
        });

        console.log('\n📱 Content Optimization:');
        recs.content_optimization.forEach((rec, index) => {
          console.log(`${index + 1}. ${rec}`);
        });

        console.log('\n⏰ Timing Suggestions:');
        recs.timing_suggestions.forEach((rec, index) => {
          console.log(`${index + 1}. ${rec}`);
        });

        console.log('\n💬 Engagement Tips:');
        recs.engagement_tips.forEach((rec, index) => {
          console.log(`${index + 1}. ${rec}`);
        });
      }

    } catch (error) {
      console.error('❌ Trending analysis demo failed:', error.message);
    }
  }

  async demonstrateHashtagTracking() {
    console.log('\n📊 Instagram Graph API - Hashtag Performance Tracking');
    console.log('=' .repeat(60));

    try {
      console.log('\n📈 Hashtag Tracking Features:');
      console.log('• Track hashtag performance over time');
      console.log('• Monitor engagement rates');
      console.log('• Analyze growth trends');
      console.log('• Compare hashtag effectiveness');
      console.log('• Generate performance reports');
      console.log('');

      console.log('🔍 Getting trending hashtags for tracking...');
      const trendingHashtags = await this.instagram.getTrendingHashtags(5);
      
      if (trendingHashtags.length > 0) {
        const hashtagToTrack = trendingHashtags[0];
        console.log(`📊 Tracking hashtag: ${hashtagToTrack.name}`);
        
        console.log('\n📈 Performance Tracking (7 days):');
        const trackingData = await this.instagram.trackHashtagPerformance(hashtagToTrack.id, 7);
        
        console.log(`Tracking Period: ${trackingData.tracking_period}`);
        console.log(`Total Posts: ${trackingData.performance_summary.total_posts}`);
        console.log(`Average Likes: ${trackingData.performance_summary.average_likes}`);
        console.log(`Average Comments: ${trackingData.performance_summary.average_comments}`);
        console.log(`Engagement Rate: ${trackingData.performance_summary.engagement_rate}%`);
        console.log(`Growth Trend: ${trackingData.performance_summary.growth_trend}`);
        console.log('');

        console.log('📊 Recent Media Performance:');
        if (trackingData.recent_media.data) {
          trackingData.recent_media.data.slice(0, 3).forEach((post, index) => {
            console.log(`${index + 1}. ${post.caption?.substring(0, 50)}...`);
            console.log(`   Likes: ${post.like_count?.toLocaleString() || 'N/A'}`);
            console.log(`   Comments: ${post.comments_count?.toLocaleString() || 'N/A'}`);
            console.log(`   Posted: ${post.timestamp}`);
            console.log('');
          });
        }
      }

      console.log('💡 Hashtag Tracking Best Practices:');
      console.log('1. Track hashtags relevant to your niche');
      console.log('2. Monitor performance weekly');
      console.log('3. Compare engagement rates');
      console.log('4. Adjust strategy based on performance');
      console.log('5. Test new hashtags regularly');
      console.log('6. Keep track of seasonal trends');
      console.log('');

    } catch (error) {
      console.error('❌ Hashtag tracking demo failed:', error.message);
    }
  }

  async demonstrateAPITesting() {
    console.log('\n🔧 Instagram Graph API - Connection Testing');
    console.log('=' .repeat(60));

    try {
      console.log('\n🔍 Testing Instagram Graph API connection...');
      const connectionTest = await this.instagram.testConnection();
      
      if (connectionTest.success) {
        console.log('✅ Connection Test Results:');
        console.log(`Status: ${connectionTest.message}`);
        console.log(`Account: ${connectionTest.account.name}`);
        console.log(`Username: @${connectionTest.account.username}`);
        console.log(`Followers: ${connectionTest.account.followers_count?.toLocaleString() || 'N/A'}`);
        console.log('');
      } else {
        console.log('❌ Connection Test Failed:');
        console.log(`Error: ${connectionTest.error}`);
        console.log(`Message: ${connectionTest.message}`);
        console.log('');
      }

      console.log('📊 API Quota Information:');
      try {
        const quotaInfo = await this.instagram.getAPIQuota();
        console.log(`User: ${quotaInfo.user.name}`);
        console.log(`Rate Limits: ${JSON.stringify(quotaInfo.rate_limits, null, 2)}`);
        console.log('');
      } catch (error) {
        console.log('⚠️ Could not retrieve quota information');
        console.log('');
      }

      console.log('🔧 API Configuration Checklist:');
      console.log('✅ Instagram Business Account');
      console.log('✅ Facebook App with Instagram Basic Display');
      console.log('✅ Long-lived access token');
      console.log('✅ Business Account ID');
      console.log('✅ Required API permissions');
      console.log('✅ Environment variables configured');
      console.log('');

    } catch (error) {
      console.error('❌ API testing demo failed:', error.message);
    }
  }

  async runFullDemo() {
    console.log('📸 Instagram Graph API - Full Demo');
    console.log('=' .repeat(80));
    console.log('This demo showcases Instagram Graph API capabilities');
    console.log('for hashtag insights, business analytics, and trending analysis');
    console.log('=' .repeat(80));

    try {
      // Run individual demos
      await this.demonstrateBusinessAccountSetup();
      await this.demonstrateAPITesting();
      await this.demonstrateHashtagAnalysis();
      await this.demonstrateBusinessInsights();
      await this.demonstrateCompetitorAnalysis();
      await this.demonstrateTrendingAnalysis();
      await this.demonstrateHashtagTracking();

      console.log('\n🎉 Instagram Graph API Demo Completed Successfully!');
      console.log('\n📚 Key Features Demonstrated:');
      console.log('• Business account setup and configuration');
      console.log('• Hashtag search and analysis');
      console.log('• Business account insights and analytics');
      console.log('• Competitor hashtag analysis');
      console.log('• Comprehensive trending analysis');
      console.log('• Hashtag performance tracking');
      console.log('• API connection testing and monitoring');
      console.log('• Personalized recommendations generation');

      console.log('\n🚀 Next Steps:');
      console.log('1. Set up your Instagram Business Account');
      console.log('2. Configure Facebook App and API permissions');
      console.log('3. Generate long-lived access token');
      console.log('4. Configure environment variables');
      console.log('5. Start analyzing hashtag performance');
      console.log('6. Track trending hashtags in your niche');
      console.log('7. Implement personalized recommendations');
      console.log('8. Monitor competitor strategies');

      console.log('\n💡 Pro Tips:');
      console.log('• Use hashtag insights to optimize your content strategy');
      console.log('• Track trending hashtags relevant to your niche');
      console.log('• Analyze competitor hashtag usage for opportunities');
      console.log('• Monitor your business account performance regularly');
      console.log('• Test different hashtag combinations for better reach');
      console.log('• Stay updated with Instagram API changes and new features');

    } catch (error) {
      console.error('\n❌ Demo failed:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  const demo = new InstagramGraphDemo();
  demo.runFullDemo();
}

module.exports = InstagramGraphDemo; 