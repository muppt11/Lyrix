const YouTubeTrending = require('./youtube-trending');
require('dotenv').config();

class YouTubeTrendingDemo {
  constructor() {
    this.trending = new YouTubeTrending();
  }

  async demonstrateTrendingVideos() {
    console.log('\n🎬 YouTube Trending Videos Demo');
    console.log('=' .repeat(50));

    try {
      await this.trending.initialize();

      // Demo 1: Get trending videos for US
      console.log('\n📈 Demo 1: US Trending Videos');
      console.log('-'.repeat(30));
      const usTrending = await this.trending.getTrendingVideos('US', null, 10);
      console.log(`Source: ${usTrending.source}`);
      console.log(`Region: ${usTrending.region}`);
      console.log(`Count: ${usTrending.count}`);
      console.log(`Timestamp: ${usTrending.timestamp}`);
      
      // Show top 3 videos
      console.log('\nTop 3 Trending Videos:');
      usTrending.videos.slice(0, 3).forEach((video, index) => {
        console.log(`${index + 1}. ${video.title}`);
        console.log(`   Channel: ${video.channelTitle}`);
        console.log(`   Views: ${parseInt(video.viewCount || 0).toLocaleString()}`);
        console.log(`   Likes: ${parseInt(video.likeCount || 0).toLocaleString()}`);
        console.log(`   Trending Score: ${video.trendingScore || 'N/A'}`);
        console.log('');
      });

      // Demo 2: Get trending by category
      console.log('\n📊 Demo 2: Gaming Category Trending');
      console.log('-'.repeat(30));
      const gamingTrending = await this.trending.getTrendingByCategory('20', 'US', 5);
      console.log(`Category: ${gamingTrending.category}`);
      console.log(`Count: ${gamingTrending.count}`);
      
      console.log('\nGaming Trending Videos:');
      gamingTrending.videos.slice(0, 3).forEach((video, index) => {
        console.log(`${index + 1}. ${video.title}`);
        console.log(`   Channel: ${video.channelTitle}`);
        console.log(`   Views: ${parseInt(video.viewCount || 0).toLocaleString()}`);
        console.log('');
      });

      // Demo 3: Regional trending
      console.log('\n🌍 Demo 3: Regional Trending Comparison');
      console.log('-'.repeat(30));
      const regions = ['US', 'GB', 'CA'];
      for (const region of regions) {
        try {
          const regionalTrending = await this.trending.getTrendingByRegion(region, 5);
          console.log(`\n${region} Trending (${regionalTrending.count} videos):`);
          console.log(`Average Views: ${regionalTrending.regionalAnalysis.averageViews.toLocaleString()}`);
          console.log(`Top Category: ${regionalTrending.regionalAnalysis.topCategories[0]?.category || 'N/A'}`);
        } catch (error) {
          console.log(`Failed to fetch ${region} trending: ${error.message}`);
        }
      }

      // Demo 4: Trending insights
      console.log('\n🧠 Demo 4: Trending Insights & Analysis');
      console.log('-'.repeat(30));
      const insights = await this.trending.getTrendingInsights('US');
      
      console.log('\n📊 Summary:');
      console.log(`Total Videos: ${insights.insights.summary.totalVideos}`);
      console.log(`Average Views: ${insights.insights.summary.averageViews.toLocaleString()}`);
      console.log(`Total Views: ${insights.insights.summary.totalViews.toLocaleString()}`);
      
      console.log('\n🏆 Top Performing Video:');
      const topVideo = insights.insights.summary.topPerformingVideo;
      console.log(`Title: ${topVideo.title}`);
      console.log(`Channel: ${topVideo.channel}`);
      console.log(`Views: ${parseInt(topVideo.views).toLocaleString()}`);
      console.log(`Trending Score: ${topVideo.trendingScore}`);

      console.log('\n💡 Opportunities:');
      insights.insights.opportunities.forEach((opp, index) => {
        console.log(`${index + 1}. ${opp.type}: ${opp.description}`);
        console.log(`   Count: ${opp.count}`);
      });

      console.log('\n🎯 Recommendations:');
      insights.insights.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec.title}:`);
        rec.suggestions.slice(0, 3).forEach(suggestion => {
          console.log(`   • ${suggestion.format || suggestion.time || suggestion.word}: ${suggestion.count || suggestion.count || suggestion.count}`);
        });
      });

      console.log('\n📈 Trends:');
      insights.insights.trends.forEach((trend, index) => {
        console.log(`${index + 1}. ${trend.type}: ${trend.description}`);
      });

      // Demo 5: Global trending
      console.log('\n🌐 Demo 5: Global Trending Overview');
      console.log('-'.repeat(30));
      try {
        const globalTrending = await this.trending.getGlobalTrending(20);
        console.log(`Global Trending Videos: ${globalTrending.count}`);
        console.log(`Average Views: ${globalTrending.analysis.averageViews.toLocaleString()}`);
        console.log(`Average Likes: ${globalTrending.analysis.averageLikes.toLocaleString()}`);
        
        console.log('\n🔥 Viral Content:');
        globalTrending.analysis.viralContent.slice(0, 3).forEach((video, index) => {
          console.log(`${index + 1}. ${video.title}`);
          console.log(`   Channel: ${video.channelTitle}`);
          console.log(`   Views: ${parseInt(video.viewCount).toLocaleString()}`);
          console.log(`   Likes: ${parseInt(video.likeCount).toLocaleString()}`);
          console.log(`   Trending Score: ${video.trendingScore}`);
          console.log('');
        });

        console.log('\n🏆 Top Global Channels:');
        globalTrending.analysis.topGlobalChannels.slice(0, 5).forEach((channel, index) => {
          console.log(`${index + 1}. ${channel.channel}: ${channel.videos} trending videos`);
        });

      } catch (error) {
        console.log(`Global trending failed: ${error.message}`);
      }

      // Demo 6: Category analysis
      console.log('\n📋 Demo 6: Category Analysis');
      console.log('-'.repeat(30));
      const categories = ['10', '20', '24', '26']; // Music, Gaming, Entertainment, Howto
      
      for (const categoryId of categories) {
        try {
          const categoryData = await this.trending.getTrendingByCategory(categoryId, 'US', 10);
          const analysis = categoryData.analysis;
          
          console.log(`\n${analysis.category}:`);
          console.log(`Total Videos: ${analysis.totalVideos}`);
          console.log(`Average Views: ${analysis.averageViews.toLocaleString()}`);
          console.log(`Average Likes: ${analysis.averageLikes.toLocaleString()}`);
          
          console.log('Top Channels:');
          analysis.topChannels.slice(0, 3).forEach(channel => {
            console.log(`  • ${channel.channel}: ${channel.videos} videos`);
          });
          
          console.log('Common Themes:');
          analysis.commonThemes.slice(0, 5).forEach(theme => {
            console.log(`  • ${theme.word}: ${theme.count} times`);
          });
          
        } catch (error) {
          console.log(`Category ${categoryId} analysis failed: ${error.message}`);
        }
      }

      console.log('\n✅ YouTube Trending Demo Completed Successfully!');
      console.log('\n📚 What you can do with YouTube Trending:');
      console.log('• Get real-time trending videos from any region');
      console.log('• Analyze trending content by category');
      console.log('• Identify viral content patterns');
      console.log('• Discover trending topics and themes');
      console.log('• Compare regional trends');
      console.log('• Generate content ideas based on trends');
      console.log('• Track engagement patterns');
      console.log('• Find collaboration opportunities');

      console.log('\n🚀 Next Steps:');
      console.log('1. Use trending data to inform your content strategy');
      console.log('2. Identify trending topics in your niche');
      console.log('3. Analyze successful content formats');
      console.log('4. Find optimal posting times based on trends');
      console.log('5. Discover potential collaboration partners');
      console.log('6. Track trending hashtags and keywords');

    } catch (error) {
      console.error('\n❌ YouTube Trending Demo failed:', error.message);
      console.error('Stack trace:', error.stack);
    } finally {
      await this.trending.close();
    }
  }

  async demonstrateTrendingForCreators() {
    console.log('\n🎬 YouTube Trending for Content Creators');
    console.log('=' .repeat(50));

    try {
      await this.trending.initialize();

      // Get trending insights for content creators
      console.log('\n📈 Trending Insights for Content Creators');
      console.log('-'.repeat(30));
      
      const insights = await this.trending.getTrendingInsights('US');
      
      console.log('\n🎯 Content Strategy Recommendations:');
      
      // Analyze successful formats
      const successfulFormats = insights.insights.recommendations
        .find(rec => rec.type === 'content_format');
      
      if (successfulFormats) {
        console.log('\n📹 Successful Content Formats:');
        successfulFormats.suggestions.forEach(format => {
          console.log(`• ${format.format}: ${format.count} trending videos`);
        });
      }

      // Analyze timing patterns
      const timingPatterns = insights.insights.recommendations
        .find(rec => rec.type === 'timing');
      
      if (timingPatterns) {
        console.log('\n⏰ Optimal Publishing Times:');
        timingPatterns.suggestions.forEach(time => {
          console.log(`• ${time.time}: ${time.count} trending videos`);
        });
      }

      // Analyze trending topics
      const trendingTopics = insights.insights.recommendations
        .find(rec => rec.type === 'topics');
      
      if (trendingTopics) {
        console.log('\n🔥 Trending Topics to Explore:');
        trendingTopics.suggestions.forEach(topic => {
          console.log(`• ${topic.word}: ${topic.count} mentions`);
        });
      }

      // Identify opportunities
      console.log('\n💡 Content Opportunities:');
      insights.insights.opportunities.forEach(opp => {
        console.log(`\n${opp.type.toUpperCase()}:`);
        console.log(`Description: ${opp.description}`);
        if (opp.examples) {
          console.log('Examples:');
          opp.examples.forEach(example => {
            console.log(`• ${example.title || example.word || example.time}`);
          });
        }
      });

      // Category-specific insights
      console.log('\n📊 Category-Specific Insights:');
      const categories = ['20', '24', '26']; // Gaming, Entertainment, Howto
      
      for (const categoryId of categories) {
        try {
          const categoryData = await this.trending.getTrendingByCategory(categoryId, 'US', 5);
          const analysis = categoryData.analysis;
          
          console.log(`\n${analysis.category}:`);
          console.log(`• Average Views: ${analysis.averageViews.toLocaleString()}`);
          console.log(`• Average Engagement: ${analysis.averageLikes.toLocaleString()} likes`);
          console.log(`• Top Channel: ${analysis.topChannels[0]?.channel || 'N/A'}`);
          console.log(`• Popular Theme: ${analysis.commonThemes[0]?.word || 'N/A'}`);
          
        } catch (error) {
          console.log(`Category ${categoryId} failed: ${error.message}`);
        }
      }

      console.log('\n🎬 Creator Action Items:');
      console.log('1. Create content in trending formats');
      console.log('2. Post during optimal times');
      console.log('3. Incorporate trending topics');
      console.log('4. Analyze successful channels in your niche');
      console.log('5. Use trending hashtags and keywords');
      console.log('6. Monitor trending patterns regularly');

    } catch (error) {
      console.error('\n❌ Creator Trending Demo failed:', error.message);
    } finally {
      await this.trending.close();
    }
  }

  async runFullDemo() {
    console.log('🎬 YouTube Trending Videos - Full Demo');
    console.log('=' .repeat(60));
    console.log('This demo showcases YouTube trending video analysis');
    console.log('Using both API and web scraping approaches');
    console.log('=' .repeat(60));

    try {
      await this.demonstrateTrendingVideos();
      await this.demonstrateTrendingForCreators();

      console.log('\n🎉 YouTube Trending Demo Completed Successfully!');
      console.log('\n📚 Key Features Demonstrated:');
      console.log('• Real-time trending video fetching');
      console.log('• Regional and category analysis');
      console.log('• Viral content identification');
      console.log('• Engagement pattern analysis');
      console.log('• Content opportunity identification');
      console.log('• Creator-specific insights');
      console.log('• Global trend analysis');

      console.log('\n🚀 Next Steps:');
      console.log('1. Integrate trending data into your content strategy');
      console.log('2. Use trending insights to inform content creation');
      console.log('3. Monitor trending patterns in your niche');
      console.log('4. Identify collaboration opportunities');
      console.log('5. Optimize posting times based on trends');
      console.log('6. Track trending topics for content ideas');

    } catch (error) {
      console.error('\n❌ Demo failed:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  const demo = new YouTubeTrendingDemo();
  demo.runFullDemo();
}

module.exports = YouTubeTrendingDemo; 