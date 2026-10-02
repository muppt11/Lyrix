const GoogleCloudConsole = require('./google-cloud');
const SocialMediaAnalytics = require('./social-analytics');
const AnalyticsDashboard = require('./dashboard');
const { LyraSearchEngine } = require('./lyra-search');
const { MarketingWorkflow } = require('./marketing-workflow');
const { WebsiteBuilder } = require('./website-builder');
const { BusinessInsights } = require('./business-insights');
const { ContentCreatorAnalytics } = require('./content-creator-analytics');
const LyraAssistant = require('./lyra-assistant');
const YouTubeTrending = require('./youtube-trending');
const TrendingAPIs = require('./trending-apis');
const InstagramGraphAPI = require('./instagram-graph-api');
const CronJobManager = require('./cron-jobs');
require('dotenv').config();

// Initialize services
const gcp = new GoogleCloudConsole();
const analytics = new SocialMediaAnalytics();
const searchEngine = new LyraSearchEngine();
const marketingWorkflow = new MarketingWorkflow();
const websiteBuilder = new WebsiteBuilder();
const businessInsights = new BusinessInsights();
const creatorAnalytics = new ContentCreatorAnalytics();
const lyra = new LyraAssistant();
const youtubeTrending = new YouTubeTrending();
const trendingAPIs = new TrendingAPIs();
const instagramGraph = new InstagramGraphAPI();
const cronManager = new CronJobManager();

// Example usage functions
async function demonstrateLyra() {
  console.log('\n=== Lyra AI Assistant Demo ===');
  
  try {
    console.log('🎬 Meet Lyra - Your AI Assistant for Content Creator Success!');
    console.log('');
    console.log('🌟 Lyra Features:');
    console.log('• Interactive conversation interface');
    console.log('• Personalized creator assistance');
    console.log('• Real-time analytics and insights');
    console.log('• Content optimization recommendations');
    console.log('• Growth strategy guidance');
    console.log('• Monetization advice');
    console.log('• Platform-specific optimization');
    console.log('• Natural language understanding');
    console.log('');

    console.log('🎯 How to Use Lyra:');
    console.log('• Run: npm run lyra');
    console.log('• Ask questions naturally');
    console.log('• Get personalized recommendations');
    console.log('• Receive actionable insights');
    console.log('• Optimize your content strategy');
    console.log('');

    console.log('💬 Example Conversations:');
    console.log('• "How can I grow my YouTube channel?"');
    console.log('• "What content should I create next?"');
    console.log('• "How can I make more money from my content?"');
    console.log('• "Analyze my social media performance"');
    console.log('• "Help me optimize my TikTok content"');
    console.log('• "What are the best posting times?"');
    console.log('');

    console.log('🚀 Start your conversation with Lyra: npm run lyra');
    console.log('');

  } catch (error) {
    console.error('❌ Lyra demo failed:', error);
  }
}

async function demonstrateInstagramGraphAPI() {
  console.log('\n=== Instagram Graph API Demo ===');
  
  try {
    console.log('📸 Instagram Graph API Features:');
    console.log('• Business account insights and analytics');
    console.log('• Hashtag search and performance analysis');
    console.log('• Trending hashtag identification');
    console.log('• Competitor hashtag analysis');
    console.log('• Media insights and engagement tracking');
    console.log('• Personalized content recommendations');
    console.log('• Hashtag performance tracking over time');
    console.log('');

    console.log('🎯 Business Account Capabilities:');
    console.log('• Account performance metrics');
    console.log('• Follower growth tracking');
    console.log('• Media insights and analytics');
    console.log('• Engagement rate analysis');
    console.log('• Content performance comparison');
    console.log('');

    console.log('🔍 Hashtag Analysis Features:');
    console.log('• Search hashtags by keyword');
    console.log('• Get hashtag information and media count');
    console.log('• Analyze top and recent media for hashtags');
    console.log('• Track hashtag performance over time');
    console.log('• Categorize hashtags by topic');
    console.log('• Calculate engagement potential');
    console.log('');

    console.log('📊 Trending Analysis:');
    console.log('• Real-time trending hashtag identification');
    console.log('• Cross-category trend analysis');
    console.log('• Engagement potential calculation');
    console.log('• Personalized recommendations');
    console.log('• Performance tracking over time');
    console.log('');

    console.log('🚀 How to Use Instagram Graph API:');
    console.log('• Run: npm run instagram-graph-demo');
    console.log('• Set up Instagram Business Account');
    console.log('• Configure Facebook App and API permissions');
    console.log('• Generate long-lived access token');
    console.log('• Analyze hashtag performance');
    console.log('• Track trending hashtags in your niche');
    console.log('• Monitor competitor strategies');
    console.log('');

    console.log('⚙️ Required Setup:');
    console.log('• Instagram Business Account');
    console.log('• Facebook App with Instagram Basic Display');
    console.log('• Long-lived access token');
    console.log('• Business Account ID');
    console.log('• Required API permissions');
    console.log('');

    console.log('🎬 Start Instagram Graph API analysis: npm run instagram-graph-demo');
    console.log('');

  } catch (error) {
    console.error('❌ Instagram Graph API demo failed:', error);
  }
}

async function demonstrateCronJobs() {
  console.log('\n=== Cron Jobs Demo ===');
  
  try {
    console.log('⏰ Cron Job System Features:');
    console.log('• Automated YouTube trending analysis');
    console.log('• Multi-platform trending data collection');
    console.log('• Instagram Graph API analysis');
    console.log('• Social media analytics automation');
    console.log('• Data cleanup and maintenance');
    console.log('• Health monitoring and alerts');
    console.log('• Email notifications and reporting');
    console.log('');

    console.log('📅 Available Cron Jobs:');
    console.log('1. Real-Time Trending Analysis (Every 3 minutes)');
    console.log('2. Multi-Platform Trending Analysis (Every 4 hours)');
    console.log('3. Instagram Graph API Analysis (Every 8 hours)');
    console.log('4. Social Media Analytics (Daily at 2 AM)');
    console.log('5. Data Cleanup (Weekly on Sunday at 3 AM)');
    console.log('6. Health Check (Every 30 minutes)');
    console.log('');

    console.log('🚀 How to Use Cron Jobs:');
    console.log('• Run: npm run cron-demo');
    console.log('• Start jobs: npm run cron-start');
    console.log('• Stop jobs: npm run cron-stop');
    console.log('• Check status: npm run cron-status');
    console.log('• View logs: npm run cron-logs');
    console.log('');

    console.log('⚙️ Required Configuration:');
    console.log('• Set up email notifications (SMTP settings)');
    console.log('• Configure channel IDs for analytics');
    console.log('• Customize job schedules as needed');
    console.log('• Set timezone and retention settings');
    console.log('');

    console.log('📊 Generated Reports:');
    console.log('• Real-time trending reports (every 3 minutes)');
    console.log('• Multi-platform trending analysis');
    console.log('• Instagram business insights');
    console.log('• Social media analytics summaries');
    console.log('• Email notifications with HTML reports');
    console.log('');

    console.log('🎬 Start Cron Jobs demo: npm run cron-demo');
    console.log('');

  } catch (error) {
    console.error('❌ Cron jobs demo failed:', error);
  }
}

async function demonstrateEnhancedTrendingAPIs() {
  console.log('\n=== Enhanced Trending APIs Demo ===');
  
  try {
    console.log('🌐 Enhanced Trending APIs Features:');
    console.log('• Multi-platform trending data collection');
    console.log('• Third-party API integration (RapidAPI, SocialBlade, etc.)');
    console.log('• Advanced web scraping for platforms without APIs');
    console.log('• Cross-platform trend analysis and comparison');
    console.log('• Trending hashtags and topics identification');
    console.log('• Creator-focused trending insights');
    console.log('• Fallback mechanisms for reliability');
    console.log('');

    console.log('🎯 Supported Platforms:');
    console.log('• YouTube - Videos, channels, categories');
    console.log('• TikTok - Videos, hashtags, challenges');
    console.log('• Instagram - Posts, hashtags, stories');
    console.log('• Twitter - Topics, hashtags, trends');
    console.log('• Google Trends - Search trends, topics');
    console.log('');

    console.log('🔧 Data Sources:');
    console.log('• Official APIs (when available)');
    console.log('• Third-party APIs (RapidAPI, SocialBlade)');
    console.log('• Web scraping (Puppeteer, Cheerio)');
    console.log('• Cross-platform aggregation');
    console.log('');

    console.log('📊 Analysis Capabilities:');
    console.log('• Real-time trending data collection');
    console.log('• Regional trend comparison');
    console.log('• Platform-specific insights');
    console.log('• Viral content identification');
    console.log('• Hashtag trend analysis');
    console.log('• Content opportunity spotting');
    console.log('• Creator collaboration opportunities');
    console.log('');

    console.log('🚀 How to Use Enhanced Trending:');
    console.log('• Run: npm run trending-apis-demo');
    console.log('• Configure API keys for enhanced functionality');
    console.log('• Get trending data from multiple platforms');
    console.log('• Analyze cross-platform trends');
    console.log('• Identify content opportunities');
    console.log('• Monitor trending patterns in your niche');
    console.log('');

    console.log('⚙️ API Configuration Required:');
    console.log('• RapidAPI Key - For multiple platform APIs');
    console.log('• SocialBlade API Key - For YouTube analytics');
    console.log('• Twitter Bearer Token - For Twitter trends');
    console.log('• Instagram Access Token - For Instagram data');
    console.log('• Google Trends API Key - For search trends');
    console.log('');

    console.log('🎬 Start enhanced trending analysis: npm run trending-apis-demo');
    console.log('');

  } catch (error) {
    console.error('❌ Enhanced Trending APIs demo failed:', error);
  }
}

async function demonstrateYouTubeTrending() {
  console.log('\n=== YouTube Trending Videos Demo ===');
  
  try {
    console.log('📈 YouTube Trending Videos Features:');
    console.log('• Real-time trending video fetching via API and web scraping');
    console.log('• Regional trending analysis (US, UK, Canada, etc.)');
    console.log('• Category-specific trending (Gaming, Music, Entertainment, etc.)');
    console.log('• Viral content identification and analysis');
    console.log('• Trending score calculation and ranking');
    console.log('• Content opportunity identification');
    console.log('• Engagement pattern analysis');
    console.log('• Global trending overview');
    console.log('');

    console.log('🎯 How to Use YouTube Trending:');
    console.log('• Run: npm run trending-demo');
    console.log('• Get trending videos for any region');
    console.log('• Analyze trending content by category');
    console.log('• Identify viral content patterns');
    console.log('• Discover trending topics and themes');
    console.log('• Generate content ideas based on trends');
    console.log('');

    console.log('📊 Trending Analysis Capabilities:');
    console.log('• API-based trending (primary method)');
    console.log('• Web scraping fallback (when API fails)');
    console.log('• Multi-region trending comparison');
    console.log('• Category-specific insights');
    console.log('• Viral content identification');
    console.log('• Engagement pattern analysis');
    console.log('• Content opportunity spotting');
    console.log('• Trending score calculation');
    console.log('');

    console.log('🚀 Start trending analysis: npm run trending-demo');
    console.log('');

  } catch (error) {
    console.error('❌ YouTube Trending demo failed:', error);
  }
}

async function demonstrateContentCreatorAnalytics() {
  console.log('\n=== Content Creator Analytics Demo ===');
  
  try {
    console.log('🎬 Content Creator Analytics Features:');
    console.log('• Multi-platform creator analysis (YouTube, TikTok, Instagram)');
    console.log('• Content strategy optimization and recommendations');
    console.log('• Monetization insights and revenue opportunities');
    console.log('• Growth trajectory analysis and predictions');
    console.log('• Creator comparison and benchmarking');
    console.log('• Performance alerts and improvement recommendations');
    console.log('');

    console.log('🎯 Creator Types Supported:');
    console.log('  • YouTube Creators - Subscribers, views, watch time, revenue');
    console.log('  • TikTok Creators - Followers, likes, shares, creator fund');
    console.log('  • Instagram Creators - Followers, engagement, reach, sponsorships');
    console.log('');

    console.log('📊 Creator Analytics Capabilities:');
    console.log('• Performance Analysis - Engagement rates, growth metrics, content scores');
    console.log('• Content Strategy - Best content types, posting schedules, optimization');
    console.log('• Audience Insights - Demographics, behavior, engagement patterns');
    console.log('• Monetization Analysis - Revenue streams, sponsorship potential, opportunities');
    console.log('• Growth Tracking - Trajectory analysis, predictions, strategies');
    console.log('• Competitive Analysis - Benchmarking against similar creators');
    console.log('');

    console.log('💡 Creator-Specific Benefits:');
    console.log('• Understand performance across all your platforms');
    console.log('• Identify content gaps and optimization opportunities');
    console.log('• Maximize monetization potential and revenue streams');
    console.log('• Track growth and set realistic goals');
    console.log('• Benchmark against other creators in your niche');
    console.log('• Get actionable recommendations for improvement');
    console.log('• Optimize content strategy for each platform');
    console.log('• Identify trending content opportunities');
    console.log('');

    // Show creator levels
    console.log('🏆 Creator Levels:');
    console.log('  • Nano Creator: 1K-10K followers');
    console.log('  • Micro Creator: 10K-100K followers');
    console.log('  • Macro Creator: 100K-1M followers');
    console.log('  • Mega Creator: 1M+ followers');
    console.log('');

    // Show monetization opportunities
    console.log('💰 Monetization Opportunities:');
    console.log('  • Platform Monetization Programs (YouTube Partner, TikTok Creator Fund)');
    console.log('  • Brand Sponsorships and Partnerships');
    console.log('  • Affiliate Marketing and Commission Sales');
    console.log('  • Merchandise and Product Sales');
    console.log('  • Exclusive Content and Memberships');
    console.log('  • Live Streaming and Virtual Events');
    console.log('');

  } catch (error) {
    console.error('❌ Content Creator Analytics demo failed:', error);
  }
}

async function demonstrateLyraSearch() {
  console.log('\n=== Lyra Search Engine Demo ===');
  
  try {
    // Initialize the search engine
    await searchEngine.initialize();
    console.log('✅ Lyra Search Engine initialized');

    // Get index information
    const indexInfo = await searchEngine.getAllIndexInfo();
    console.log('📊 Search Index Information:');
    Object.entries(indexInfo).forEach(([platform, info]) => {
      if (info) {
        console.log(`  ${platform}: ${info.documentCount} documents`);
      }
    });

    // Search examples
    console.log('\n🔍 Search Capabilities:');
    console.log('• Full-text search across all analytics data');
    console.log('• Platform-specific searches (YouTube, TikTok, Instagram)');
    console.log('• Performance-based filtering and sorting');
    console.log('• Issue and recommendation searches');
    console.log('• Similar account discovery');
    console.log('• Trend analysis and insights');
    console.log('');

    // Example search queries
    console.log('📝 Example Search Queries:');
    console.log('• Find top performing accounts: searchEngine.findTopPerformers()');
    console.log('• Find high engagement accounts: searchEngine.findHighEngagementAccounts()');
    console.log('• Search for specific issues: searchEngine.searchIssues("engagement")');
    console.log('• Find optimization recommendations: searchEngine.searchRecommendations("title")');
    console.log('• Find similar accounts: searchEngine.findSimilarAccounts("accountId")');
    console.log('');

    // Show search performance
    console.log('⚡ Search Performance:');
    console.log('• In-memory search for instant results');
    console.log('• Sub-millisecond query response times');
    console.log('• Real-time indexing of new analytics data');
    console.log('• Advanced filtering and sorting options');
    console.log('');

  } catch (error) {
    console.error('❌ Lyra Search Engine demo failed:', error);
  }
}

async function demonstrateMarketingWorkflow() {
  console.log('\n=== Marketing Workflow Automation Demo ===');
  
  try {
    console.log('🚀 Marketing Workflow Automation Features:');
    console.log('• Automated weekly performance reports');
    console.log('• Content calendar generation');
    console.log('• Real-time performance alerts');
    console.log('• Competitor analysis automation');
    console.log('• Email notifications and reports');
    console.log('• Custom workflow creation');
    console.log('');

    // Get available workflows
    const workflows = marketingWorkflow.getWorkflows();
    console.log('📋 Available Workflows:');
    workflows.forEach(workflow => {
      console.log(`  • ${workflow.name}: ${workflow.description}`);
    });

    console.log('\n💡 Business Benefits:');
    console.log('• Save 10-15 hours per week on manual reporting');
    console.log('• Never miss important performance alerts');
    console.log('• Automated content planning and scheduling');
    console.log('• Data-driven marketing decisions');
    console.log('• Consistent reporting and insights');
    console.log('');

    // Show email templates
    console.log('📧 Email Templates Available:');
    console.log('• Weekly Performance Reports');
    console.log('• Content Calendars');
    console.log('• Performance Alerts');
    console.log('• Competitive Analysis Reports');
    console.log('');

  } catch (error) {
    console.error('❌ Marketing Workflow demo failed:', error);
  }
}

async function demonstrateWebsiteBuilder() {
  console.log('\n=== Website Builder Demo ===');
  
  try {
    console.log('🌐 Website Builder Features:');
    console.log('• Professional website templates');
    console.log('• Integrated analytics and tracking');
    console.log('• SEO optimization');
    console.log('• Responsive design');
    console.log('• Content management system');
    console.log('• Automated deployment');
    console.log('');

    // Get available templates
    const templates = websiteBuilder.getTemplates();
    console.log('📋 Available Templates:');
    templates.forEach(template => {
      console.log(`  • ${template.name}: ${template.description}`);
      console.log(`    Features: ${template.features.join(', ')}`);
    });

    console.log('\n💼 Business Benefits:');
    console.log('• Professional websites in minutes, not weeks');
    console.log('• Built-in analytics and tracking');
    console.log('• SEO-optimized for better search rankings');
    console.log('• Mobile-responsive design');
    console.log('• Easy content updates and management');
    console.log('• Cost-effective web development');
    console.log('');

    // Show website features
    console.log('🔧 Website Features:');
    console.log('• Contact forms with analytics');
    console.log('• Social media integration');
    console.log('• Blog and content management');
    console.log('• E-commerce capabilities');
    console.log('• Performance optimization');
    console.log('• Security and SSL certificates');
    console.log('');

  } catch (error) {
    console.error('❌ Website Builder demo failed:', error);
  }
}

async function demonstrateBusinessInsights() {
  console.log('\n=== Business Insights Engine Demo ===');
  
  try {
    console.log('🧠 Business Insights Features:');
    console.log('• Transform scattered data into clear insights');
    console.log('• Performance analysis across all platforms');
    console.log('• Content optimization recommendations');
    console.log('• Audience behavior analysis');
    console.log('• Competitive benchmarking');
    console.log('• ROI measurement and optimization');
    console.log('');

    // Get insight types
    const insightTypes = await businessInsights.getInsightTypes();
    console.log('📊 Available Insight Types:');
    insightTypes.forEach(type => {
      console.log(`  • ${type.name}: ${type.description}`);
    });

    console.log('\n💡 Business Value:');
    console.log('• Clear, actionable insights from complex data');
    console.log('• Data-driven decision making');
    console.log('• Performance optimization opportunities');
    console.log('• Competitive advantage identification');
    console.log('• ROI improvement strategies');
    console.log('• Automated reporting and alerts');
    console.log('');

    // Show insight categories
    console.log('📈 Insight Categories:');
    console.log('• Performance Analysis - Engagement, growth, reach metrics');
    console.log('• Content Analysis - Optimization, trends, recommendations');
    console.log('• Audience Analysis - Behavior, segments, retention');
    console.log('• Competitive Analysis - Benchmarking, gaps, opportunities');
    console.log('• ROI Analysis - Investment tracking, optimization');
    console.log('');

  } catch (error) {
    console.error('❌ Business Insights demo failed:', error);
  }
}

async function demonstrateSocialMediaAnalytics() {
  console.log('\n=== Social Media Analytics Demo ===');
  
  try {
    // Check if required environment variables are set
    if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
      console.error('❌ Please set GOOGLE_CLOUD_PROJECT_ID in your .env file');
      return;
    }

    console.log('🔍 Social Media Analytics System');
    console.log('================================');
    console.log('This system can analyze:');
    console.log('• YouTube channels (using YouTube Data API)');
    console.log('• TikTok accounts (using web scraping)');
    console.log('• Instagram accounts (using Graph API or web scraping)');
    console.log('');

    // Example YouTube analysis (if API key is available)
    if (process.env.YOUTUBE_API_KEY) {
      console.log('📺 YouTube Analytics Example:');
      console.log('To analyze a YouTube channel, use:');
      console.log('await analytics.analyzeYouTubeChannel("CHANNEL_ID", 30);');
      console.log('');
    } else {
      console.log('⚠️  YouTube API key not configured');
      console.log('Set YOUTUBE_API_KEY in .env to enable YouTube analytics');
      console.log('');
    }

    // Example TikTok analysis
    console.log('🎵 TikTok Analytics Example:');
    console.log('To analyze a TikTok account, use:');
    console.log('await analytics.analyzeTikTokAccount("username", 30);');
    console.log('');

    // Example Instagram analysis
    console.log('📸 Instagram Analytics Example:');
    console.log('To analyze an Instagram account, use:');
    console.log('await analytics.analyzeInstagramAccount("username", 30);');
    console.log('');

    // Show analytics capabilities
    console.log('📊 Analytics Features:');
    console.log('• Content performance analysis');
    console.log('• Engagement rate calculations');
    console.log('• Optimization recommendations');
    console.log('• Issue identification');
    console.log('• Trend analysis');
    console.log('• Cross-platform comparison');
    console.log('');

    // Show dashboard capabilities
    console.log('🖥️  Dashboard Features:');
    console.log('• Real-time analytics visualization');
    console.log('• Interactive charts and graphs');
    console.log('• Detailed performance metrics');
    console.log('• Optimization recommendations');
    console.log('• Data export capabilities');
    console.log('• Lyra-powered search functionality');
    console.log('');

  } catch (error) {
    console.error('Social Media Analytics Demo Error:', error.message);
  }
}

async function demonstrateYouTubeAPI() {
  console.log('\n=== YouTube Data API Demo ===');
  
  try {
    if (!process.env.YOUTUBE_API_KEY) {
      console.log('⚠️  YouTube API key not configured');
      return;
    }

    // Search for videos
    console.log('Searching for "math tutorials"...');
    const searchResults = await gcp.searchVideos('math tutorials', 3);
    console.log(`Found ${searchResults.length} videos:`);
    searchResults.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title} (${video.channelTitle})`);
    });

    // Get details for the first video
    if (searchResults.length > 0) {
      console.log('\nGetting details for first video...');
      const videoDetails = await gcp.getVideoDetails(searchResults[0].id);
      console.log('Video Details:', {
        title: videoDetails.title,
        channel: videoDetails.channelTitle,
        views: videoDetails.statistics?.viewCount || 'N/A',
        duration: videoDetails.duration
      });
    }
  } catch (error) {
    console.error('YouTube API Error:', error.message);
  }
}

async function demonstrateCloudStorage() {
  console.log('\n=== Cloud Storage Demo ===');
  
  try {
    // List buckets
    console.log('Listing Cloud Storage buckets...');
    const buckets = await gcp.listBuckets();
    console.log(`Found ${buckets.length} buckets:`);
    buckets.forEach(bucket => {
      console.log(`- ${bucket.name} (${bucket.location})`);
    });

    // Example: Upload a test file (if you have a bucket)
    if (buckets.length > 0 && process.env.CLOUD_STORAGE_BUCKET) {
      console.log('\nUploading test file...');
      const testContent = 'Hello from Google Cloud Storage!';
      const result = await gcp.uploadFile(
        process.env.CLOUD_STORAGE_BUCKET,
        'test-file.txt',
        testContent
      );
      console.log('Upload result:', result);
    }
  } catch (error) {
    console.error('Cloud Storage Error:', error.message);
  }
}

async function demonstrateBigQuery() {
  console.log('\n=== BigQuery Demo ===');
  
  try {
    // List datasets
    console.log('Listing BigQuery datasets...');
    const datasets = await gcp.listDatasets();
    console.log(`Found ${datasets.length} datasets:`);
    datasets.forEach(dataset => {
      console.log(`- ${dataset.datasetId} (${dataset.location})`);
    });

    // Example: Create a dataset (if you have permissions)
    if (process.env.BIGQUERY_DATASET_ID) {
      console.log('\nCreating test dataset...');
      try {
        const result = await gcp.createDataset(process.env.BIGQUERY_DATASET_ID);
        console.log('Dataset created:', result);
      } catch (error) {
        console.log('Dataset creation failed (might already exist):', error.message);
      }
    }
  } catch (error) {
    console.error('BigQuery Error:', error.message);
  }
}

async function demonstratePubSub() {
  console.log('\n=== Pub/Sub Demo ===');
  
  try {
    // List topics
    console.log('Listing Pub/Sub topics...');
    const topics = await gcp.listTopics();
    console.log(`Found ${topics.length} topics:`);
    topics.forEach(topic => {
      console.log(`- ${topic.name}`);
    });

    // Example: Create a topic and publish a message
    if (process.env.PUBSUB_TOPIC_NAME) {
      console.log('\nCreating test topic...');
      try {
        await gcp.createTopic(process.env.PUBSUB_TOPIC_NAME);
        console.log('Topic created successfully');
        
        // Publish a test message
        const testMessage = {
          message: 'Hello from Pub/Sub!',
          timestamp: new Date().toISOString()
        };
        const publishResult = await gcp.publishMessage(process.env.PUBSUB_TOPIC_NAME, testMessage);
        console.log('Message published:', publishResult);
      } catch (error) {
        console.log('Topic creation failed (might already exist):', error.message);
      }
    }
  } catch (error) {
    console.error('Pub/Sub Error:', error.message);
  }
}

async function demonstrateLogging() {
  console.log('\n=== Cloud Logging Demo ===');
  
  try {
    // Write a test log
    console.log('Writing test log entry...');
    const logData = {
      message: 'Test log from LyraLytics',
      service: 'demo',
      timestamp: new Date().toISOString()
    };
    await gcp.writeLog('lyralytics-demo', logData);
    console.log('Log entry written successfully');

    // List recent logs
    console.log('\nListing recent logs...');
    const logs = await gcp.listLogs();
    console.log(`Found ${logs.length} recent log entries`);
  } catch (error) {
    console.error('Cloud Logging Error:', error.message);
  }
}

async function demonstrateMonitoring() {
  console.log('\n=== Cloud Monitoring Demo ===');
  
  try {
    // List available metrics
    console.log('Listing available metrics...');
    const metrics = await gcp.listMetrics();
    console.log(`Found ${metrics.length} metrics:`);
    metrics.slice(0, 5).forEach(metric => {
      console.log(`- ${metric.name} (${metric.type})`);
    });

    // Create a custom time series
    console.log('\nCreating custom time series...');
    const customMetric = 'custom.googleapis.com/lyralytics/demo';
    await gcp.createTimeSeries(customMetric, Math.random() * 100, {
      environment: 'demo'
    });
    console.log('Custom time series created');
  } catch (error) {
    console.error('Cloud Monitoring Error:', error.message);
  }
}

async function demonstrateResourceManager() {
  console.log('\n=== Resource Manager Demo ===');
  
  try {
    // List projects
    console.log('Listing projects...');
    const projects = await gcp.listProjects();
    console.log(`Found ${projects.length} projects:`);
    projects.forEach(project => {
      console.log(`- ${project.name} (${project.projectId}) - ${project.state}`);
    });

    // Get current project info
    console.log('\nGetting current project info...');
    const projectInfo = await gcp.getProjectInfo();
    console.log('Current project:', projectInfo);
  } catch (error) {
    console.error('Resource Manager Error:', error.message);
  }
}

async function demonstrateIAM() {
  console.log('\n=== IAM Demo ===');
  
  try {
    // List service accounts
    console.log('Listing service accounts...');
    const serviceAccounts = await gcp.listServiceAccounts();
    console.log(`Found ${serviceAccounts.length} service accounts:`);
    serviceAccounts.forEach(account => {
      console.log(`- ${account.displayName || account.email} (${account.disabled ? 'disabled' : 'enabled'})`);
    });

    // Get IAM policy
    console.log('\nGetting IAM policy...');
    const policy = await gcp.getIamPolicy();
    console.log(`IAM policy has ${policy.bindings?.length || 0} bindings`);
  } catch (error) {
    console.error('IAM Error:', error.message);
  }
}

async function demonstrateProjectOverview() {
  console.log('\n=== Project Overview ===');
  
  try {
    const overview = await gcp.getProjectResources();
    console.log('Project Overview:', overview);
  } catch (error) {
    console.error('Project Overview Error:', error.message);
  }
}

async function demonstrateHealthCheck() {
  console.log('\n=== Health Check ===');
  
  try {
    const health = await gcp.healthCheck();
    console.log('Health Status:', health);
  } catch (error) {
    console.error('Health Check Error:', error.message);
  }
}

// Main demonstration function
async function main() {
  console.log('🚀 LyraLytics - Comprehensive Social Media Analytics & Marketing Automation Platform\n');
  console.log('🎬 **SPECIALIZED FOR CONTENT CREATORS** - YouTube, TikTok, Instagram Influencers\n');
  
  // Check if required environment variables are set
  if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
    console.error('❌ Please set GOOGLE_CLOUD_PROJECT_ID in your .env file');
    console.log('Copy env.example to .env and configure your Google Cloud settings');
    return;
  }

  console.log(`📋 Project ID: ${process.env.GOOGLE_CLOUD_PROJECT_ID}`);
  console.log(`🌍 Region: ${process.env.GOOGLE_CLOUD_REGION || 'us-central1'}\n`);

  try {
    // Run demonstrations
    await demonstrateLyra();
    await demonstrateInstagramGraphAPI();
    await demonstrateCronJobs();
    await demonstrateEnhancedTrendingAPIs();
    await demonstrateYouTubeTrending();
    await demonstrateContentCreatorAnalytics();
    await demonstrateLyraSearch();
    await demonstrateMarketingWorkflow();
    await demonstrateWebsiteBuilder();
    await demonstrateBusinessInsights();
    await demonstrateSocialMediaAnalytics();
    await demonstrateYouTubeAPI();
    await demonstrateCloudStorage();
    await demonstrateBigQuery();
    await demonstratePubSub();
    await demonstrateLogging();
    await demonstrateMonitoring();
    await demonstrateResourceManager();
    await demonstrateIAM();
    await demonstrateProjectOverview();
    await demonstrateHealthCheck();

    console.log('\n✅ Demo completed successfully!');
    console.log('\n📚 Next steps:');
    console.log('1. Review the output above to see what services are working');
    console.log('2. Check your Google Cloud Console to see created resources');
    console.log('3. Start Lyra AI Assistant: npm run lyra');
    console.log('4. Start the analytics dashboard: npm run dashboard');
    console.log('5. Start the creator dashboard: npm run creator-dashboard');
    console.log('6. Run analytics on your social media accounts: npm run analyze');
    console.log('6. Test Lyra search functionality: npm run search');
    console.log('7. Analyze YouTube trending videos: npm run trending-demo');
    console.log('8. Enhanced multi-platform trending: npm run trending-apis-demo');
    console.log('9. Instagram Graph API analysis: npm run instagram-graph-demo');
    console.log('10. Automated cron jobs: npm run cron-demo');
    console.log('11. Set up marketing workflows: npm run marketing');
    console.log('12. Build a website: npm run website');
    console.log('13. Generate business insights: npm run insights');
    console.log('14. Analyze content creator profiles: npm run creator');
    console.log('15. Test creator tools: npm run tools-demo');
    console.log('16. Customize the code for your specific use case');
    console.log('17. Set up proper authentication and permissions');

    console.log('\n🎯 Available Commands:');
    console.log('• npm start - Run the main demo');
    console.log('• npm run lyra - Start Lyra AI Assistant');
    console.log('• npm run dashboard - Start the web dashboard');
    console.log('• npm run trending-demo - Analyze YouTube trending videos');
    console.log('• npm run trending-apis-demo - Enhanced multi-platform trending');
    console.log('• npm run instagram-graph-demo - Instagram Graph API analysis');
    console.log('• npm run cron-demo - Automated cron jobs demo');
    console.log('• npm run analyze - Run social media analytics');
    console.log('• npm run search - Test Lyra search functionality');
    console.log('• npm run marketing - Set up marketing workflows');
    console.log('• npm run website - Build professional websites');
    console.log('• npm run insights - Generate business insights');
    console.log('• npm run creator - Analyze content creator profiles');
    console.log('• npm run creator-dashboard - Start creator-focused dashboard');
    console.log('• npm run tools-demo - Test creator optimization tools');
    console.log('• npm test - Run comprehensive tests');

    console.log('\n🎬 Content Creator Features:');
    console.log('• Multi-platform analytics (YouTube, TikTok, Instagram)');
    console.log('• Content strategy optimization and recommendations');
    console.log('• Monetization insights and revenue opportunities');
    console.log('• Growth trajectory analysis and predictions');
    console.log('• Creator comparison and benchmarking');
    console.log('• Performance alerts and improvement recommendations');
    console.log('• Creator level classification (Nano to Mega)');
    console.log('• Revenue stream analysis and optimization');

    console.log('\n🔍 Lyra Search Features:');
    console.log('• Fast in-memory search across all analytics data');
    console.log('• Real-time indexing of new analytics records');
    console.log('• Advanced filtering and sorting options');
    console.log('• Cross-platform search capabilities');
    console.log('• Performance-based account discovery');

    console.log('\n🚀 Marketing Workflow Benefits:');
    console.log('• Save 10-15 hours per week on manual reporting');
    console.log('• Automated performance alerts and notifications');
    console.log('• Data-driven content planning and scheduling');
    console.log('• Competitive analysis automation');
    console.log('• Professional email reports and insights');

    console.log('\n🌐 Website Builder Benefits:');
    console.log('• Professional websites in minutes, not weeks');
    console.log('• Built-in analytics and tracking integration');
    console.log('• SEO-optimized for better search rankings');
    console.log('• Mobile-responsive design');
    console.log('• Cost-effective web development solution');

    console.log('\n🧠 Business Insights Benefits:');
    console.log('• Transform scattered data into clear insights');
    console.log('• Data-driven decision making');
    console.log('• Performance optimization opportunities');
    console.log('• Competitive advantage identification');
    console.log('• ROI improvement strategies');

    console.log('\n💡 For Content Creators:');
    console.log('• Understand your performance across all platforms');
    console.log('• Identify content gaps and optimization opportunities');
    console.log('• Maximize monetization potential and revenue streams');
    console.log('• Track growth and set realistic goals');
    console.log('• Benchmark against other creators in your niche');
    console.log('• Get actionable recommendations for improvement');
    console.log('• Optimize content strategy for each platform');
    console.log('• Identify trending content opportunities');
    console.log('• Use specialized creator tools for optimization');
    console.log('• Access creator-focused dashboard and analytics');
    console.log('• Chat with Lyra AI Assistant for personalized help');
    console.log('• Analyze YouTube trending videos for content ideas');
    console.log('• Access enhanced multi-platform trending data');
    console.log('• Leverage Instagram Graph API for hashtag insights');
    console.log('• Automate analytics tasks with cron jobs');

  } catch (error) {
    console.error('\n❌ Demo failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure your service account has proper permissions');
    console.log('2. Check that all required APIs are enabled');
    console.log('3. Verify your environment variables are set correctly');
  }
}

// Export the services and functions
module.exports = {
  gcp,
  analytics,
  searchEngine,
  marketingWorkflow,
  websiteBuilder,
  businessInsights,
  creatorAnalytics,
  lyra,
  youtubeTrending,
  trendingAPIs,
  instagramGraph,
  cronManager,
  demonstrateLyra,
  demonstrateInstagramGraphAPI,
  demonstrateCronJobs,
  demonstrateEnhancedTrendingAPIs,
  demonstrateYouTubeTrending,
  demonstrateContentCreatorAnalytics,
  demonstrateLyraSearch,
  demonstrateMarketingWorkflow,
  demonstrateWebsiteBuilder,
  demonstrateBusinessInsights,
  demonstrateSocialMediaAnalytics,
  demonstrateYouTubeAPI,
  demonstrateCloudStorage,
  demonstrateBigQuery,
  demonstratePubSub,
  demonstrateLogging,
  demonstrateMonitoring,
  demonstrateResourceManager,
  demonstrateIAM,
  demonstrateProjectOverview,
  demonstrateHealthCheck
};

// Run the demo if this file is executed directly
if (require.main === module) {
  main();
} 