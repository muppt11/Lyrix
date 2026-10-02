const TrendingAPIs = require('./trending-apis');
require('dotenv').config();

class TrendingAPIsDemo {
  constructor() {
    this.trending = new TrendingAPIs();
  }

  async demonstrateYouTubeTrending() {
    console.log('\n📈 YouTube Trending Demo');
    console.log('=' .repeat(50));

    try {
      await this.trending.initialize();

      console.log('\n🎬 YouTube Trending Sources:');
      console.log('• Web scraping from YouTube trending page');
      console.log('• RapidAPI YouTube trending endpoint');
      console.log('• SocialBlade API (if configured)');
      console.log('');

      const youtubeTrending = await this.trending.getYouTubeTrending('US', 10);
      
      console.log(`✅ YouTube Trending Results:`);
      console.log(`Platform: ${youtubeTrending.platform}`);
      console.log(`Region: ${youtubeTrending.region}`);
      console.log(`Count: ${youtubeTrending.count}`);
      console.log(`Source: ${youtubeTrending.source}`);
      console.log(`Timestamp: ${youtubeTrending.timestamp}`);
      
      console.log('\n📺 Top 5 Trending Videos:');
      youtubeTrending.videos.slice(0, 5).forEach((video, index) => {
        console.log(`${index + 1}. ${video.title}`);
        console.log(`   Channel: ${video.channelTitle}`);
        console.log(`   Views: ${video.viewCount}`);
        console.log(`   Platform: ${video.platform}`);
        console.log('');
      });

    } catch (error) {
      console.error('❌ YouTube trending demo failed:', error.message);
    }
  }

  async demonstrateTikTokTrending() {
    console.log('\n📱 TikTok Trending Demo');
    console.log('=' .repeat(50));

    try {
      console.log('\n🎵 TikTok Trending Sources:');
      console.log('• Web scraping from TikTok For You page');
      console.log('• RapidAPI TikTok trending endpoint');
      console.log('• TikTok hashtag scraping');
      console.log('');

      const tiktokTrending = await this.trending.getTikTokTrending('US', 10);
      
      console.log(`✅ TikTok Trending Results:`);
      console.log(`Platform: ${tiktokTrending.platform}`);
      console.log(`Region: ${tiktokTrending.region}`);
      console.log(`Count: ${tiktokTrending.count}`);
      console.log(`Source: ${tiktokTrending.source}`);
      
      console.log('\n🎵 Top 5 Trending Videos/Hashtags:');
      tiktokTrending.videos.slice(0, 5).forEach((video, index) => {
        console.log(`${index + 1}. ${video.title}`);
        console.log(`   Author: ${video.channelTitle}`);
        console.log(`   Views/Count: ${video.viewCount}`);
        console.log(`   Type: ${video.type || 'video'}`);
        console.log('');
      });

    } catch (error) {
      console.error('❌ TikTok trending demo failed:', error.message);
    }
  }

  async demonstrateInstagramTrending() {
    console.log('\n📸 Instagram Trending Demo');
    console.log('=' .repeat(50));

    try {
      console.log('\n📷 Instagram Trending Sources:');
      console.log('• Web scraping from Instagram explore page');
      console.log('• Instagram Graph API (if configured)');
      console.log('• Instagram hashtag scraping');
      console.log('');

      const instagramTrending = await this.trending.getInstagramTrending('US', 10);
      
      console.log(`✅ Instagram Trending Results:`);
      console.log(`Platform: ${instagramTrending.platform}`);
      console.log(`Region: ${instagramTrending.region}`);
      console.log(`Count: ${instagramTrending.count}`);
      console.log(`Source: ${instagramTrending.source}`);
      
      console.log('\n📷 Top 5 Trending Posts/Hashtags:');
      instagramTrending.videos.slice(0, 5).forEach((post, index) => {
        console.log(`${index + 1}. ${post.title}`);
        console.log(`   Author: ${post.channelTitle}`);
        console.log(`   Likes/Count: ${post.viewCount}`);
        console.log(`   Type: ${post.type || 'post'}`);
        console.log('');
      });

    } catch (error) {
      console.error('❌ Instagram trending demo failed:', error.message);
    }
  }

  async demonstrateTwitterTrending() {
    console.log('\n🐦 Twitter Trending Demo');
    console.log('=' .repeat(50));

    try {
      console.log('\n📱 Twitter Trending Sources:');
      console.log('• Web scraping from Twitter explore page');
      console.log('• Twitter API v2 (if configured)');
      console.log('• Twitter hashtag scraping');
      console.log('');

      const twitterTrending = await this.trending.getTwitterTrending('US', 10);
      
      console.log(`✅ Twitter Trending Results:`);
      console.log(`Platform: ${twitterTrending.platform}`);
      console.log(`Region: ${twitterTrending.region}`);
      console.log(`Count: ${twitterTrending.count}`);
      console.log(`Source: ${twitterTrending.source}`);
      
      console.log('\n🐦 Top 5 Trending Topics/Hashtags:');
      twitterTrending.videos.slice(0, 5).forEach((trend, index) => {
        console.log(`${index + 1}. ${trend.title}`);
        console.log(`   Type: ${trend.channelTitle}`);
        console.log(`   Count: ${trend.viewCount}`);
        console.log(`   Category: ${trend.type || 'trend'}`);
        console.log('');
      });

    } catch (error) {
      console.error('❌ Twitter trending demo failed:', error.message);
    }
  }

  async demonstrateGoogleTrends() {
    console.log('\n🔍 Google Trends Demo');
    console.log('=' .repeat(50));

    try {
      console.log('\n📊 Google Trends Sources:');
      console.log('• Web scraping from Google Trends page');
      console.log('• Google Trends API (if configured)');
      console.log('');

      const googleTrends = await this.trending.getGoogleTrends('US', 10);
      
      console.log(`✅ Google Trends Results:`);
      console.log(`Platform: ${googleTrends.platform}`);
      console.log(`Region: ${googleTrends.region}`);
      console.log(`Count: ${googleTrends.count}`);
      console.log(`Source: ${googleTrends.source}`);
      
      console.log('\n🔍 Top 5 Trending Searches:');
      googleTrends.videos.slice(0, 5).forEach((trend, index) => {
        console.log(`${index + 1}. ${trend.title}`);
        console.log(`   Traffic: ${trend.viewCount}`);
        console.log(`   Type: ${trend.type || 'search'}`);
        console.log('');
      });

    } catch (error) {
      console.error('❌ Google Trends demo failed:', error.message);
    }
  }

  async demonstrateCrossPlatformTrending() {
    console.log('\n🌐 Cross-Platform Trending Demo');
    console.log('=' .repeat(50));

    try {
      console.log('\n🔄 Cross-Platform Analysis:');
      console.log('• YouTube trending videos');
      console.log('• TikTok trending content and hashtags');
      console.log('• Instagram trending posts and hashtags');
      console.log('• Twitter trending topics and hashtags');
      console.log('• Google trending searches');
      console.log('');

      const allTrending = await this.trending.getAllTrending('US', 10);
      
      console.log(`✅ Cross-Platform Results:`);
      console.log(`Region: ${allTrending.region}`);
      console.log(`Timestamp: ${allTrending.timestamp}`);
      console.log(`Total Platforms: ${allTrending.summary.totalPlatforms}`);
      console.log(`Successful Platforms: ${allTrending.summary.successfulPlatforms}`);
      console.log(`Total Trending Items: ${allTrending.summary.totalTrendingItems}`);
      
      console.log('\n📊 Platform Comparison:');
      Object.entries(allTrending.summary.platformComparison).forEach(([platform, data]) => {
        console.log(`${platform.toUpperCase()}: ${data.count} items (${data.source})`);
      });
      
      console.log('\n🔥 Top Cross-Platform Trends:');
      allTrending.summary.topTrends.slice(0, 10).forEach((trend, index) => {
        console.log(`${index + 1}. [${trend.platform.toUpperCase()}] ${trend.title}`);
        console.log(`   Count: ${trend.viewCount}`);
        console.log(`   Type: ${trend.type}`);
        console.log('');
      });

      console.log('\n📈 Platform Success Rate:');
      const successRate = (allTrending.summary.successfulPlatforms / allTrending.summary.totalPlatforms * 100).toFixed(1);
      console.log(`${successRate}% of platforms returned data successfully`);

    } catch (error) {
      console.error('❌ Cross-platform trending demo failed:', error.message);
    }
  }

  async demonstrateTrendingForCreators() {
    console.log('\n🎬 Trending Analysis for Content Creators');
    console.log('=' .repeat(50));

    try {
      console.log('\n🎯 How Content Creators Can Use Trending Data:');
      console.log('• Identify trending topics in your niche');
      console.log('• Discover viral content formats');
      console.log('• Find optimal posting times');
      console.log('• Spot collaboration opportunities');
      console.log('• Track hashtag trends');
      console.log('• Monitor competitor activity');
      console.log('');

      // Get trending data from multiple platforms
      const platforms = ['youtube', 'tiktok', 'instagram'];
      const trendingData = {};

      for (const platform of platforms) {
        try {
          switch (platform) {
            case 'youtube':
              trendingData.youtube = await this.trending.getYouTubeTrending('US', 5);
              break;
            case 'tiktok':
              trendingData.tiktok = await this.trending.getTikTokTrending('US', 5);
              break;
            case 'instagram':
              trendingData.instagram = await this.trending.getInstagramTrending('US', 5);
              break;
          }
        } catch (error) {
          console.log(`${platform} trending failed: ${error.message}`);
        }
      }

      console.log('📊 Trending Insights for Creators:');
      
      // Analyze content opportunities
      const allContent = [];
      Object.entries(trendingData).forEach(([platform, data]) => {
        if (data && data.videos) {
          data.videos.forEach(video => {
            allContent.push({
              platform,
              title: video.title,
              type: video.type || 'content',
              viewCount: video.viewCount
            });
          });
        }
      });

      // Find common themes
      const words = allContent.flatMap(item => 
        item.title.toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter(word => word.length > 3)
      );

      const wordCounts = {};
      words.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });

      const trendingWords = Object.entries(wordCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);

      console.log('\n🔥 Trending Keywords:');
      trendingWords.forEach(([word, count]) => {
        console.log(`• ${word}: ${count} mentions`);
      });

      // Platform-specific insights
      console.log('\n📱 Platform-Specific Insights:');
      Object.entries(trendingData).forEach(([platform, data]) => {
        if (data && data.videos) {
          console.log(`\n${platform.toUpperCase()}:`);
          console.log(`• Total trending items: ${data.videos.length}`);
          console.log(`• Content types: ${[...new Set(data.videos.map(v => v.type || 'content'))].join(', ')}`);
          
          const topContent = data.videos[0];
          if (topContent) {
            console.log(`• Top trending: ${topContent.title}`);
          }
        }
      });

      console.log('\n💡 Creator Action Items:');
      console.log('1. Create content around trending keywords');
      console.log('2. Use trending hashtags in your posts');
      console.log('3. Study viral content formats');
      console.log('4. Post during peak trending times');
      console.log('5. Collaborate with trending creators');
      console.log('6. Monitor trends in your niche regularly');

    } catch (error) {
      console.error('❌ Creator trending demo failed:', error.message);
    }
  }

  async demonstrateAPIConfiguration() {
    console.log('\n⚙️ API Configuration Guide');
    console.log('=' .repeat(50));

    console.log('\n🔑 Required API Keys for Enhanced Trending:');
    console.log('');
    console.log('📈 RapidAPI (for multiple platforms):');
    console.log('RAPIDAPI_KEY=your_rapidapi_key_here');
    console.log('');
    console.log('📊 SocialBlade API:');
    console.log('SOCIALBLADE_API_KEY=your_socialblade_key_here');
    console.log('');
    console.log('🔍 Google Trends API:');
    console.log('GOOGLE_TRENDS_API_KEY=your_google_trends_key_here');
    console.log('');
    console.log('🐦 Twitter API v2:');
    console.log('TWITTER_BEARER_TOKEN=your_twitter_bearer_token_here');
    console.log('');
    console.log('📸 Instagram Graph API:');
    console.log('INSTAGRAM_ACCESS_TOKEN=your_instagram_token_here');
    console.log('');

    console.log('📚 How to Get API Keys:');
    console.log('• RapidAPI: Sign up at rapidapi.com and subscribe to trending APIs');
    console.log('• SocialBlade: Contact SocialBlade for API access');
    console.log('• Google Trends: Use Google Trends API (limited)');
    console.log('• Twitter: Apply for Twitter API access at developer.twitter.com');
    console.log('• Instagram: Use Instagram Graph API for business accounts');
    console.log('');

    console.log('⚠️ Important Notes:');
    console.log('• Some APIs require paid subscriptions');
    console.log('• Rate limits apply to all APIs');
    console.log('• Web scraping is used as fallback when APIs fail');
    console.log('• Always respect platform terms of service');
    console.log('• Consider using proxy rotation for heavy scraping');
  }

  async runFullDemo() {
    console.log('🌐 Enhanced Trending APIs - Full Demo');
    console.log('=' .repeat(60));
    console.log('This demo showcases multi-platform trending analysis');
    console.log('Using third-party APIs and advanced web scraping');
    console.log('=' .repeat(60));

    try {
      await this.trending.initialize();

      // Run individual platform demos
      await this.demonstrateYouTubeTrending();
      await this.demonstrateTikTokTrending();
      await this.demonstrateInstagramTrending();
      await this.demonstrateTwitterTrending();
      await this.demonstrateGoogleTrends();
      
      // Run cross-platform analysis
      await this.demonstrateCrossPlatformTrending();
      
      // Run creator-focused analysis
      await this.demonstrateTrendingForCreators();
      
      // Show API configuration guide
      await this.demonstrateAPIConfiguration();

      console.log('\n🎉 Enhanced Trending APIs Demo Completed Successfully!');
      console.log('\n📚 Key Features Demonstrated:');
      console.log('• Multi-platform trending data collection');
      console.log('• Third-party API integration');
      console.log('• Advanced web scraping techniques');
      console.log('• Cross-platform trend analysis');
      console.log('• Creator-focused insights');
      console.log('• API configuration guidance');
      console.log('• Fallback mechanisms for reliability');

      console.log('\n🚀 Next Steps:');
      console.log('1. Configure API keys for enhanced functionality');
      console.log('2. Integrate trending data into your content strategy');
      console.log('3. Set up automated trending monitoring');
      console.log('4. Use cross-platform insights for content planning');
      console.log('5. Monitor trending patterns in your niche');
      console.log('6. Optimize posting times based on trending data');

    } catch (error) {
      console.error('\n❌ Demo failed:', error.message);
      console.error('Stack trace:', error.stack);
    } finally {
      await this.trending.close();
    }
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  const demo = new TrendingAPIsDemo();
  demo.runFullDemo();
}

module.exports = TrendingAPIsDemo; 