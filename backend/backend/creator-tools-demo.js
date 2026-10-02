const CreatorTools = require('./creator-tools');
require('dotenv').config();

class CreatorToolsDemo {
  constructor() {
    this.tools = new CreatorTools();
  }

  async demonstrateYouTubeTools() {
    console.log('\n🎬 YouTube Creator Tools Demo');
    console.log('=' .repeat(50));

    // Title Optimization
    console.log('\n📝 Title Optimization:');
    const titleAnalysis = await this.tools.optimizeYouTubeTitle(
      'My Gaming Video',
      'gaming',
      'gamers'
    );
    console.log('Original:', titleAnalysis.original);
    console.log('Optimized:', titleAnalysis.optimized);
    console.log('Score:', titleAnalysis.score);
    console.log('Recommendations:', titleAnalysis.recommendations);

    // Description Optimization
    console.log('\n📄 Description Optimization:');
    const descAnalysis = await this.tools.optimizeYouTubeDescription(
      'Check out this awesome gaming video!',
      'gaming'
    );
    console.log('Original:', descAnalysis.original);
    console.log('Optimized:', descAnalysis.optimized);
    console.log('Score:', descAnalysis.score);
    console.log('Recommendations:', descAnalysis.recommendations);

    // Thumbnail Analysis
    console.log('\n🖼️ Thumbnail Analysis:');
    const thumbnailAnalysis = await this.tools.analyzeYouTubeThumbnail(
      'https://example.com/thumbnail.jpg'
    );
    console.log('Score:', thumbnailAnalysis.score);
    console.log('Recommendations:', thumbnailAnalysis.recommendations);
    console.log('Optimization:', thumbnailAnalysis.optimization);
  }

  async demonstrateTikTokTools() {
    console.log('\n🎵 TikTok Creator Tools Demo');
    console.log('=' .repeat(50));

    // Content Optimization
    console.log('\n📱 Content Optimization:');
    const contentAnalysis = await this.tools.optimizeTikTokContent(
      'Check out this amazing dance! #dance #viral',
      'trending_sound_1'
    );
    console.log('Original:', contentAnalysis.original);
    console.log('Optimized:', contentAnalysis.optimized);
    console.log('Score:', contentAnalysis.score);
    console.log('Hashtags:', contentAnalysis.hashtags);
    console.log('Recommendations:', contentAnalysis.recommendations);

    // Trend Analysis
    console.log('\n📈 Trend Analysis:');
    const trends = await this.tools.analyzeTikTokTrends();
    console.log('Trending Sounds:', trends.sounds);
    console.log('Trending Hashtags:', trends.hashtags);
    console.log('Challenges:', trends.challenges);
    console.log('Effects:', trends.effects);
  }

  async demonstrateInstagramTools() {
    console.log('\n📸 Instagram Creator Tools Demo');
    console.log('=' .repeat(50));

    // Caption Optimization
    console.log('\n📝 Caption Optimization:');
    const captionAnalysis = await this.tools.optimizeInstagramCaption(
      'Amazing sunset today! Love this view',
      'photo'
    );
    console.log('Original:', captionAnalysis.original);
    console.log('Optimized:', captionAnalysis.optimized);
    console.log('Score:', captionAnalysis.score);
    console.log('Hashtags:', captionAnalysis.hashtags);
    console.log('Emojis:', captionAnalysis.emojis);
    console.log('Recommendations:', captionAnalysis.recommendations);

    // Story Optimization
    console.log('\n📱 Story Optimization:');
    const storyAnalysis = await this.tools.optimizeInstagramStory([
      'text',
      'music'
    ]);
    console.log('Elements:', storyAnalysis.elements);
    console.log('Score:', storyAnalysis.score);
    console.log('Recommendations:', storyAnalysis.recommendations);
    console.log('Optimization:', storyAnalysis.optimization);
  }

  async demonstrateCrossPlatformTools() {
    console.log('\n🌐 Cross-Platform Creator Tools Demo');
    console.log('=' .repeat(50));

    // Posting Schedule Optimization
    console.log('\n⏰ Posting Schedule Optimization:');
    const schedule = await this.tools.optimizePostingSchedule([
      'youtube',
      'tiktok',
      'instagram'
    ]);
    console.log('Platform Schedules:');
    for (const [platform, data] of Object.entries(schedule.platforms)) {
      console.log(`  ${platform}:`);
      console.log(`    Best Day: ${data.bestDay}`);
      console.log(`    Frequency: ${data.frequency}`);
      console.log(`    Times: ${data.recommendedTimes.join(', ')}`);
    }
    console.log('Recommendations:', schedule.recommendations);

    // Content Performance Analysis
    console.log('\n📊 Content Performance Analysis:');
    const performanceData = {
      youtube: { views: 10000, engagement: 500 },
      tiktok: { views: 50000, engagement: 2000 },
      instagram: { views: 5000, engagement: 300 }
    };
    const performanceAnalysis = await this.tools.analyzeContentPerformance(performanceData);
    console.log('Overall Performance:', performanceAnalysis.overall);
    console.log('Platform Performance:', performanceAnalysis.byPlatform);
    console.log('Recommendations:', performanceAnalysis.recommendations);
    console.log('Trends:', performanceAnalysis.trends);

    // Content Idea Generation
    console.log('\n💡 Content Idea Generation:');
    const ideas = await this.tools.generateContentIdeas('lifestyle', 'youtube', 5);
    console.log(`Generated ${ideas.ideas.length} ideas for ${ideas.niche} on ${ideas.platform}:`);
    ideas.ideas.forEach((idea, index) => {
      console.log(`  ${index + 1}. ${idea.title}`);
      console.log(`     Type: ${idea.type}`);
      console.log(`     Difficulty: ${idea.difficulty}`);
      console.log(`     Estimated Engagement: ${idea.estimatedEngagement}%`);
    });
  }

  async demonstrateCreatorWorkflow() {
    console.log('\n🔄 Creator Workflow Demo');
    console.log('=' .repeat(50));

    // Simulate a complete creator workflow
    console.log('\n📋 Complete Creator Workflow:');
    
    // 1. Generate content ideas
    console.log('\n1️⃣ Generating content ideas...');
    const ideas = await this.tools.generateContentIdeas('tech', 'youtube', 3);
    const selectedIdea = ideas.ideas[0];
    console.log(`Selected idea: ${selectedIdea.title}`);

    // 2. Optimize title
    console.log('\n2️⃣ Optimizing title...');
    const titleAnalysis = await this.tools.optimizeYouTubeTitle(
      selectedIdea.title,
      'tech',
      'tech enthusiasts'
    );
    console.log(`Optimized title: ${titleAnalysis.optimized}`);

    // 3. Optimize description
    console.log('\n3️⃣ Optimizing description...');
    const descAnalysis = await this.tools.optimizeYouTubeDescription(
      selectedIdea.description,
      'tech'
    );
    console.log(`Optimized description: ${descAnalysis.optimized.substring(0, 100)}...`);

    // 4. Optimize posting schedule
    console.log('\n4️⃣ Optimizing posting schedule...');
    const schedule = await this.tools.optimizePostingSchedule(['youtube']);
    console.log(`Best posting time: ${schedule.platforms.youtube.recommendedTimes[0]}`);

    // 5. Cross-platform adaptation
    console.log('\n5️⃣ Adapting for other platforms...');
    
    // TikTok adaptation
    const tiktokContent = await this.tools.optimizeTikTokContent(
      selectedIdea.title,
      'trending_tech'
    );
    console.log(`TikTok content: ${tiktokContent.optimized}`);

    // Instagram adaptation
    const instagramCaption = await this.tools.optimizeInstagramCaption(
      selectedIdea.title,
      'reel'
    );
    console.log(`Instagram caption: ${instagramCaption.optimized}`);

    console.log('\n✅ Creator workflow completed!');
  }

  async runFullDemo() {
    console.log('🎬 LyraLytics Creator Tools - Full Demo');
    console.log('=' .repeat(60));
    console.log('This demo showcases specialized tools for content creators');
    console.log('Optimizing content for YouTube, TikTok, and Instagram');
    console.log('=' .repeat(60));

    try {
      await this.demonstrateYouTubeTools();
      await this.demonstrateTikTokTools();
      await this.demonstrateInstagramTools();
      await this.demonstrateCrossPlatformTools();
      await this.demonstrateCreatorWorkflow();

      console.log('\n🎉 Creator Tools Demo Completed Successfully!');
      console.log('\n📚 What you can do with these tools:');
      console.log('• Optimize YouTube titles, descriptions, and thumbnails');
      console.log('• Create viral TikTok content with trending elements');
      console.log('• Craft engaging Instagram captions and stories');
      console.log('• Find optimal posting times across platforms');
      console.log('• Generate content ideas for your niche');
      console.log('• Analyze content performance and trends');
      console.log('• Streamline your creator workflow');

      console.log('\n🚀 Next Steps:');
      console.log('1. Configure your creator profile in .env');
      console.log('2. Start the creator dashboard: npm run creator-dashboard');
      console.log('3. Run creator analytics: npm run creator');
      console.log('4. Use the tools in your own projects');
      console.log('5. Customize optimization rules for your niche');

    } catch (error) {
      console.error('\n❌ Demo failed:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  const demo = new CreatorToolsDemo();
  demo.runFullDemo();
}

module.exports = CreatorToolsDemo; 