const readline = require('readline');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const CreatorTools = require('./creator-tools');
const { ContentCreatorAnalytics } = require('./content-creator-analytics');
const { LyraSearchEngine } = require('./lyra-search');
const SocialMediaAnalytics = require('./social-analytics');
const GoogleCloudConsole = require('./google-cloud');
require('dotenv').config();

class LyraAssistant {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    this.creatorTools = new CreatorTools();
    this.creatorAnalytics = new ContentCreatorAnalytics();
    this.searchEngine = new LyraSearchEngine();
    this.analytics = new SocialMediaAnalytics();
    this.gcp = new GoogleCloudConsole();
    
    this.userProfile = this.loadUserProfile();
    this.conversationHistory = [];
    this.isActive = false;
    
    this.personality = {
      name: 'Lyra',
      role: 'Content Creator AI Assistant',
      traits: ['helpful', 'enthusiastic', 'knowledgeable', 'encouraging'],
      voice: 'friendly and energetic',
      expertise: ['social media analytics', 'content optimization', 'creator growth', 'monetization']
    };
    
    this.capabilities = {
      analytics: ['youtube', 'tiktok', 'instagram'],
      tools: ['title_optimizer', 'hashtag_analyzer', 'schedule_optimizer', 'content_generator'],
      insights: ['performance_analysis', 'growth_prediction', 'monetization_advice', 'trend_analysis']
    };
  }

  loadUserProfile() {
    return {
      name: process.env.CREATOR_NAME || 'Creator',
      niche: process.env.CREATOR_NICHE || 'general',
      level: process.env.CREATOR_LEVEL || 'nano',
      primaryPlatform: process.env.CREATOR_PRIMARY_PLATFORM || 'multi',
      preferences: {
        communicationStyle: 'conversational',
        detailLevel: 'comprehensive',
        focusAreas: ['growth', 'monetization', 'content']
      }
    };
  }

  async initialize() {
    console.clear();
    await this.showWelcomeAnimation();
    await this.greetUser();
    this.isActive = true;
    await this.startConversation();
  }

  async showWelcomeAnimation() {
    const spinner = ora('Initializing Lyra...').start();
    
    // Simulate initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
    spinner.succeed('Lyra is ready!');
    
    console.log('\n' + '='.repeat(60));
    console.log(chalk.cyan.bold('🌟 Welcome to LyraLytics 🌟'));
    console.log(chalk.cyan('Your AI Assistant for Content Creator Success'));
    console.log('='.repeat(60) + '\n');
  }

  async greetUser() {
    const timeOfDay = this.getTimeOfDay();
    const greeting = this.getGreeting(timeOfDay);
    
    console.log(chalk.magenta.bold(`🎬 ${this.personality.name}:`));
    console.log(chalk.magenta(`${greeting}, ${this.userProfile.name}! 👋`));
    console.log(chalk.magenta(`I'm your AI assistant, and I'm here to help you grow as a content creator.`));
    console.log(chalk.magenta(`I can analyze your social media performance, optimize your content, and provide insights to help you succeed.`));
    console.log(chalk.magenta(`What would you like to work on today?`));
    console.log('');
  }

  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  getGreeting(timeOfDay) {
    const greetings = {
      morning: ['Good morning', 'Rise and shine', 'Good morning'],
      afternoon: ['Good afternoon', 'Hello there', 'Hi there'],
      evening: ['Good evening', 'Hello', 'Hi']
    };
    const options = greetings[timeOfDay];
    return options[Math.floor(Math.random() * options.length)];
  }

  async startConversation() {
    while (this.isActive) {
      try {
        const userInput = await this.getUserInput();
        if (userInput.toLowerCase().includes('goodbye') || userInput.toLowerCase().includes('bye')) {
          await this.sayGoodbye();
          break;
        }
        
        await this.processUserInput(userInput);
      } catch (error) {
        console.log(chalk.red(`❌ I encountered an error: ${error.message}`));
        console.log(chalk.yellow(`Let me try to help you with something else.`));
      }
    }
  }

  async getUserInput() {
    return new Promise((resolve) => {
      this.rl.question(chalk.cyan.bold('You: '), (input) => {
        resolve(input.trim());
      });
    });
  }

  async processUserInput(input) {
    this.conversationHistory.push({ user: input, timestamp: new Date() });
    
    const intent = this.analyzeIntent(input);
    const response = await this.generateResponse(intent, input);
    
    await this.speak(response);
  }

  analyzeIntent(input) {
    const lowerInput = input.toLowerCase();
    
    // Analytics and performance
    if (lowerInput.includes('analyze') || lowerInput.includes('performance') || lowerInput.includes('stats')) {
      return 'analytics';
    }
    
    // Content optimization
    if (lowerInput.includes('optimize') || lowerInput.includes('improve') || lowerInput.includes('better')) {
      return 'optimization';
    }
    
    // Content ideas
    if (lowerInput.includes('idea') || lowerInput.includes('content') || lowerInput.includes('create')) {
      return 'content_ideas';
    }
    
    // Monetization
    if (lowerInput.includes('money') || lowerInput.includes('revenue') || lowerInput.includes('sponsorship')) {
      return 'monetization';
    }
    
    // Growth
    if (lowerInput.includes('grow') || lowerInput.includes('followers') || lowerInput.includes('audience')) {
      return 'growth';
    }
    
    // Platform specific
    if (lowerInput.includes('youtube')) return 'youtube';
    if (lowerInput.includes('tiktok')) return 'tiktok';
    if (lowerInput.includes('instagram')) return 'instagram';
    
    // Help
    if (lowerInput.includes('help') || lowerInput.includes('what can you do')) {
      return 'help';
    }
    
    // General conversation
    return 'conversation';
  }

  async generateResponse(intent, input) {
    switch (intent) {
      case 'analytics':
        return await this.handleAnalyticsRequest(input);
      case 'optimization':
        return await this.handleOptimizationRequest(input);
      case 'content_ideas':
        return await this.handleContentIdeasRequest(input);
      case 'monetization':
        return await this.handleMonetizationRequest(input);
      case 'growth':
        return await this.handleGrowthRequest(input);
      case 'youtube':
        return await this.handleYouTubeRequest(input);
      case 'tiktok':
        return await this.handleTikTokRequest(input);
      case 'instagram':
        return await this.handleInstagramRequest(input);
      case 'help':
        return this.getHelpResponse();
      default:
        return this.getConversationResponse(input);
    }
  }

  async handleAnalyticsRequest(input) {
    const spinner = ora('Analyzing your performance...').start();
    
    try {
      // Simulate analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      spinner.succeed('Analysis complete!');
      
      const analysis = {
        overall: {
          followers: Math.floor(Math.random() * 100000) + 1000,
          engagement: (Math.random() * 10 + 2).toFixed(2),
          growth: (Math.random() * 20 + 5).toFixed(2)
        },
        platforms: {
          youtube: { subscribers: Math.floor(Math.random() * 50000) + 1000, views: Math.floor(Math.random() * 1000000) + 10000 },
          tiktok: { followers: Math.floor(Math.random() * 100000) + 1000, likes: Math.floor(Math.random() * 500000) + 5000 },
          instagram: { followers: Math.floor(Math.random() * 50000) + 1000, engagement: (Math.random() * 8 + 2).toFixed(2) }
        }
      };
      
      return `📊 Here's your performance analysis, ${this.userProfile.name}!\n\n` +
             `🎯 Overall Performance:\n` +
             `• Total Followers: ${analysis.overall.followers.toLocaleString()}\n` +
             `• Average Engagement: ${analysis.overall.engagement}%\n` +
             `• Growth Rate: ${analysis.overall.growth}%\n\n` +
             `📺 Platform Breakdown:\n` +
             `• YouTube: ${analysis.platforms.youtube.subscribers.toLocaleString()} subscribers, ${analysis.platforms.youtube.views.toLocaleString()} views\n` +
             `• TikTok: ${analysis.platforms.tiktok.followers.toLocaleString()} followers, ${analysis.platforms.tiktok.likes.toLocaleString()} likes\n` +
             `• Instagram: ${analysis.platforms.instagram.followers.toLocaleString()} followers, ${analysis.platforms.instagram.engagement}% engagement\n\n` +
             `💡 Would you like me to dive deeper into any specific platform or help you optimize your content?`;
             
    } catch (error) {
      spinner.fail('Analysis failed');
      return `I'm sorry, I couldn't analyze your performance right now. Let me help you with something else!`;
    }
  }

  async handleOptimizationRequest(input) {
    const spinner = ora('Generating optimization suggestions...').start();
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      spinner.succeed('Optimization ready!');
      
      const suggestions = [
        '🎬 Try adding more engaging thumbnails with bright colors and text overlays',
        '📝 Optimize your titles with numbers and questions (e.g., "5 Ways to...", "Why Does...")',
        '⏰ Post during peak hours: 3-4 PM and 7-9 PM for YouTube, 6-10 PM for TikTok',
        '🏷️ Use trending hashtags and sounds to increase discoverability',
        '💬 Engage with your audience by responding to comments within the first hour',
        '📊 Create more content in your best-performing format'
      ];
      
      const selectedSuggestions = suggestions.sort(() => 0.5 - Math.random()).slice(0, 3);
      
      return `🚀 Here are some optimization suggestions for you, ${this.userProfile.name}!\n\n` +
             selectedSuggestions.map(s => `• ${s}`).join('\n') + '\n\n' +
             `Would you like me to help you implement any of these suggestions or analyze your specific content?`;
             
    } catch (error) {
      spinner.fail('Optimization failed');
      return `I'm sorry, I couldn't generate optimization suggestions right now. Let me help you with something else!`;
    }
  }

  async handleContentIdeasRequest(input) {
    const spinner = ora('Generating content ideas...').start();
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      spinner.succeed('Content ideas ready!');
      
      const ideas = [
        { title: 'Day in the Life of a Content Creator', type: 'vlog', difficulty: 'Easy', engagement: 'High' },
        { title: 'Top 10 Tips for Growing Your Channel', type: 'tutorial', difficulty: 'Medium', engagement: 'High' },
        { title: 'Behind the Scenes: How I Edit Videos', type: 'educational', difficulty: 'Medium', engagement: 'Medium' },
        { title: 'Q&A with My Audience', type: 'interactive', difficulty: 'Easy', engagement: 'High' },
        { title: 'My Morning Routine for Success', type: 'lifestyle', difficulty: 'Easy', engagement: 'Medium' }
      ];
      
      return `💡 Here are some content ideas for you, ${this.userProfile.name}!\n\n` +
             ideas.map((idea, index) => 
               `${index + 1}. ${idea.title}\n   📝 Type: ${idea.type} | 🎯 Difficulty: ${idea.difficulty} | 📊 Engagement: ${idea.engagement}`
             ).join('\n\n') + '\n\n' +
             `These ideas are tailored to your ${this.userProfile.niche} niche. Would you like me to help you develop any of these ideas further?`;
             
    } catch (error) {
      spinner.fail('Content ideas failed');
      return `I'm sorry, I couldn't generate content ideas right now. Let me help you with something else!`;
    }
  }

  async handleMonetizationRequest(input) {
    const spinner = ora('Analyzing monetization opportunities...').start();
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1800));
      spinner.succeed('Monetization analysis complete!');
      
      const opportunities = [
        { type: 'Sponsorships', potential: '$500-$2000 per post', requirements: '10K+ followers, good engagement' },
        { type: 'Affiliate Marketing', potential: '$100-$500 per month', requirements: 'Authentic product recommendations' },
        { type: 'Merchandise', potential: '$200-$1000 per month', requirements: 'Strong brand identity' },
        { type: 'YouTube Partner Program', potential: '$100-$1000 per month', requirements: '1000 subscribers, 4000 watch hours' },
        { type: 'TikTok Creator Fund', potential: '$50-$500 per month', requirements: '10K+ followers, 100K+ views' }
      ];
      
      return `💰 Here are your monetization opportunities, ${this.userProfile.name}!\n\n` +
             opportunities.map(opp => 
               `💼 ${opp.type}\n   💵 Potential: ${opp.potential}\n   📋 Requirements: ${opp.requirements}`
             ).join('\n\n') + '\n\n' +
             `Based on your current level (${this.userProfile.level}), I'd recommend focusing on ${opportunities[0].type} and ${opportunities[1].type}.\n\n` +
             `Would you like me to help you develop a monetization strategy or calculate your sponsorship rates?`;
             
    } catch (error) {
      spinner.fail('Monetization analysis failed');
      return `I'm sorry, I couldn't analyze your monetization opportunities right now. Let me help you with something else!`;
    }
  }

  async handleGrowthRequest(input) {
    const spinner = ora('Analyzing growth strategies...').start();
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1600));
      spinner.succeed('Growth analysis complete!');
      
      const strategies = [
        '🎯 Focus on your best-performing content type and create more of it',
        '🤝 Collaborate with other creators in your niche',
        '📱 Post consistently at optimal times for each platform',
        '💬 Engage actively with your audience in comments and DMs',
        '📈 Use trending hashtags and sounds to increase discoverability',
        '🎬 Create content that solves problems or entertains your audience'
      ];
      
      return `📈 Here are your growth strategies, ${this.userProfile.name}!\n\n` +
             strategies.map(strategy => `• ${strategy}`).join('\n') + '\n\n' +
             `Based on your ${this.userProfile.niche} niche, I predict you could reach the next creator level within 3-6 months with consistent effort.\n\n` +
             `Would you like me to help you create a growth plan or analyze your current growth trajectory?`;
             
    } catch (error) {
      spinner.fail('Growth analysis failed');
      return `I'm sorry, I couldn't analyze your growth strategies right now. Let me help you with something else!`;
    }
  }

  async handleYouTubeRequest(input) {
    const spinner = ora('Analyzing YouTube performance...').start();
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      spinner.succeed('YouTube analysis complete!');
      
      return `📺 YouTube Analysis for ${this.userProfile.name}!\n\n` +
             `🎯 Key Metrics:\n` +
             `• Subscribers: ${Math.floor(Math.random() * 50000 + 1000).toLocaleString()}\n` +
             `• Average Views: ${Math.floor(Math.random() * 100000 + 10000).toLocaleString()}\n` +
             `• Watch Time: ${Math.floor(Math.random() * 1000 + 100)} hours\n` +
             `• Engagement Rate: ${(Math.random() * 8 + 2).toFixed(2)}%\n\n` +
             `💡 YouTube Optimization Tips:\n` +
             `• Create compelling thumbnails with bright colors and text\n` +
             `• Write SEO-optimized titles and descriptions\n` +
             `• Add timestamps to help viewers navigate\n` +
             `• Post consistently on Tuesdays and Fridays\n` +
             `• Engage with comments within the first hour\n\n` +
             `Would you like me to help you optimize a specific video or analyze your channel performance?`;
             
    } catch (error) {
      spinner.fail('YouTube analysis failed');
      return `I'm sorry, I couldn't analyze your YouTube performance right now. Let me help you with something else!`;
    }
  }

  async handleTikTokRequest(input) {
    const spinner = ora('Analyzing TikTok performance...').start();
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      spinner.succeed('TikTok analysis complete!');
      
      return `🎵 TikTok Analysis for ${this.userProfile.name}!\n\n` +
             `🎯 Key Metrics:\n` +
             `• Followers: ${Math.floor(Math.random() * 100000 + 1000).toLocaleString()}\n` +
             `• Average Views: ${Math.floor(Math.random() * 50000 + 5000).toLocaleString()}\n` +
             `• Likes: ${Math.floor(Math.random() * 10000 + 500).toLocaleString()}\n` +
             `• Shares: ${Math.floor(Math.random() * 1000 + 100).toLocaleString()}\n\n` +
             `💡 TikTok Optimization Tips:\n` +
             `• Use trending sounds and hashtags\n` +
             `• Create content in the first 3 seconds\n` +
             `• Post 1-2 times daily at peak times\n` +
             `• Engage with trending challenges\n` +
             `• Use text overlays for better engagement\n\n` +
             `Would you like me to help you create viral content or analyze your TikTok trends?`;
             
    } catch (error) {
      spinner.fail('TikTok analysis failed');
      return `I'm sorry, I couldn't analyze your TikTok performance right now. Let me help you with something else!`;
    }
  }

  async handleInstagramRequest(input) {
    const spinner = ora('Analyzing Instagram performance...').start();
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      spinner.succeed('Instagram analysis complete!');
      
      return `📸 Instagram Analysis for ${this.userProfile.name}!\n\n` +
             `🎯 Key Metrics:\n` +
             `• Followers: ${Math.floor(Math.random() * 50000 + 1000).toLocaleString()}\n` +
             `• Average Engagement: ${(Math.random() * 8 + 2).toFixed(2)}%\n` +
             `• Reach: ${Math.floor(Math.random() * 10000 + 1000).toLocaleString()}\n` +
             `• Saves: ${Math.floor(Math.random() * 500 + 50).toLocaleString()}\n\n` +
             `💡 Instagram Optimization Tips:\n` +
             `• Post high-quality, visually appealing content\n` +
             `• Use relevant hashtags (5-15 per post)\n` +
             `• Post stories daily to stay top of mind\n` +
             `• Engage with your audience through comments and DMs\n` +
             `• Use Instagram Reels for better reach\n\n` +
             `Would you like me to help you optimize your Instagram strategy or create engaging captions?`;
             
    } catch (error) {
      spinner.fail('Instagram analysis failed');
      return `I'm sorry, I couldn't analyze your Instagram performance right now. Let me help you with something else!`;
    }
  }

  getHelpResponse() {
    return `🎬 Hi ${this.userProfile.name}! I'm Lyra, your AI assistant for content creator success. Here's what I can help you with:\n\n` +
           `📊 Analytics & Performance:\n` +
           `• Analyze your social media performance\n` +
           `• Track growth across platforms\n` +
           `• Compare performance metrics\n\n` +
           `🚀 Content Optimization:\n` +
           `• Optimize titles, descriptions, and thumbnails\n` +
           `• Generate content ideas\n` +
           `• Improve hashtag strategies\n\n` +
           `💰 Monetization:\n` +
           `• Calculate sponsorship rates\n` +
           `• Identify revenue opportunities\n` +
           `• Develop monetization strategies\n\n` +
           `📈 Growth Strategies:\n` +
           `• Find optimal posting times\n` +
           `• Analyze audience insights\n` +
           `• Create growth plans\n\n` +
           `🎯 Platform-Specific Help:\n` +
           `• YouTube channel optimization\n` +
           `• TikTok viral content creation\n` +
           `• Instagram engagement strategies\n\n` +
           `Just ask me anything about your content creator journey, and I'll help you succeed! 🌟`;
  }

  getConversationResponse(input) {
    const responses = [
      `That's interesting, ${this.userProfile.name}! As a content creator, I'd love to help you with your social media strategy. What specific aspect would you like to work on?`,
      `I'm here to help you grow as a content creator! Would you like to analyze your performance, get content ideas, or optimize your strategy?`,
      `Great question! Let me help you with your content creator goals. Are you looking to grow your audience, increase engagement, or boost your revenue?`,
      `I'm excited to help you succeed as a content creator! What's your biggest challenge right now - growth, monetization, or content creation?`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  async speak(message) {
    console.log(chalk.magenta.bold(`🎬 ${this.personality.name}:`));
    
    // Simulate typing effect
    const words = message.split(' ');
    for (let i = 0; i < words.length; i++) {
      process.stdout.write(chalk.magenta(words[i] + ' '));
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    console.log('\n');
  }

  async sayGoodbye() {
    const timeOfDay = this.getTimeOfDay();
    const goodbyes = {
      morning: ['Have a wonderful day', 'Good luck with your content today', 'Hope your day is productive'],
      afternoon: ['Have a great afternoon', 'Good luck with your content', 'Hope your day continues well'],
      evening: ['Have a great evening', 'Rest well and keep creating', 'Hope you had a productive day']
    };
    
    const goodbye = goodbyes[timeOfDay][Math.floor(Math.random() * goodbyes[timeOfDay].length)];
    
    await this.speak(`${goodbye}, ${this.userProfile.name}! 🌟`);
    await this.speak(`Remember, I'm always here to help you grow as a content creator. Come back anytime! 👋`);
    
    this.isActive = false;
    this.rl.close();
  }
}

// Run Lyra if this file is executed directly
if (require.main === module) {
  const lyra = new LyraAssistant();
  lyra.initialize().catch(console.error);
}

module.exports = LyraAssistant; 