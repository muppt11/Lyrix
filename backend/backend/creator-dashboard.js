const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const { ContentCreatorAnalytics } = require('./content-creator-analytics');
const { LyraSearchEngine } = require('./lyra-search');
const GoogleCloudConsole = require('./google-cloud');
require('dotenv').config();

class CreatorDashboard {
  constructor() {
    this.app = express();
    this.creatorAnalytics = new ContentCreatorAnalytics();
    this.searchEngine = new LyraSearchEngine();
    this.gcp = new GoogleCloudConsole();
    this.creatorConfig = this.loadCreatorConfig();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupRateLimiting();
    this.initialize();
  }

  loadCreatorConfig() {
    return {
      name: process.env.CREATOR_NAME || 'Content Creator',
      niche: process.env.CREATOR_NICHE || 'general',
      level: process.env.CREATOR_LEVEL || 'nano',
      primaryPlatform: process.env.CREATOR_PRIMARY_PLATFORM || 'multi',
      theme: process.env.DASHBOARD_THEME || 'light',
      layout: process.env.DASHBOARD_LAYOUT || 'creator',
      refreshInterval: parseInt(process.env.DASHBOARD_REFRESH_INTERVAL) || 30000,
      features: {
        contentAnalysis: process.env.CONTENT_ANALYSIS_ENABLED === 'true',
        contentOptimization: process.env.CONTENT_OPTIMIZATION_ENABLED === 'true',
        thumbnailAnalysis: process.env.THUMBNAIL_ANALYSIS_ENABLED === 'true',
        titleOptimization: process.env.TITLE_OPTIMIZATION_ENABLED === 'true',
        hashtagAnalysis: process.env.HASHTAG_ANALYSIS_ENABLED === 'true',
        postingSchedule: process.env.POSTING_SCHEDULE_OPTIMIZATION_ENABLED === 'true',
        monetization: process.env.MONETIZATION_ANALYSIS_ENABLED === 'true',
        sponsorship: process.env.SPONSORSHIP_VALUATION_ENABLED === 'true',
        affiliate: process.env.AFFILIATE_MARKETING_ENABLED === 'true',
        merchandise: process.env.MERCHANDISE_ANALYSIS_ENABLED === 'true',
        revenue: process.env.REVENUE_TRACKING_ENABLED === 'true',
        growth: process.env.GROWTH_PREDICTION_ENABLED === 'true',
        engagement: process.env.ENGAGEMENT_ANALYSIS_ENABLED === 'true',
        audience: process.env.AUDIENCE_SEGMENTATION_ENABLED === 'true',
        competitor: process.env.COMPETITOR_ANALYSIS_ENABLED === 'true',
        trends: process.env.TREND_ANALYSIS_ENABLED === 'true'
      }
    };
  }

  async initialize() {
    try {
      console.log('🎬 Initializing Creator Dashboard...');
      await this.searchEngine.initialize();
      console.log(`👋 Welcome, ${this.creatorConfig.name}!`);
      console.log(`📊 Niche: ${this.creatorConfig.niche}`);
      console.log(`⭐ Level: ${this.creatorConfig.level}`);
      console.log(`🎯 Primary Platform: ${this.creatorConfig.primaryPlatform}`);
      console.log('✅ Creator Dashboard initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Creator Dashboard:', error);
    }
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
          scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"]
        }
      }
    }));

    // CORS
    this.app.use(cors({
      origin: process.env.DASHBOARD_CORS_ORIGIN || 'http://localhost:3000',
      credentials: true
    }));

    // Compression
    this.app.use(compression());

    // Logging
    this.app.use(morgan('combined'));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Static files
    this.app.use(express.static('public'));
  }

  setupRateLimiting() {
    const rateLimiter = new RateLimiterMemory({
      keyGenerator: (req) => req.ip,
      points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000
    });

    this.app.use(async (req, res, next) => {
      try {
        await rateLimiter.consume(req.ip);
        next();
      } catch (error) {
        res.status(429).json({
          error: 'Too many requests',
          retryAfter: Math.ceil(error.msBeforeNext / 1000)
        });
      }
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        creator: this.creatorConfig.name,
        timestamp: new Date().toISOString() 
      });
    });

    // Creator Dashboard Home
    this.app.get('/', this.serveCreatorDashboard.bind(this));

    // Creator Profile API
    this.app.get('/api/creator/profile', this.getCreatorProfile.bind(this));
    this.app.put('/api/creator/profile', this.updateCreatorProfile.bind(this));

    // Creator Analytics API
    this.app.get('/api/creator/overview', this.getCreatorOverview.bind(this));
    this.app.post('/api/creator/analyze', this.analyzeCreatorAccount.bind(this));
    this.app.get('/api/creator/analytics/:platform', this.getPlatformAnalytics.bind(this));
    this.app.get('/api/creator/comparison', this.compareWithCompetitors.bind(this));

    // Content Strategy API
    this.app.get('/api/creator/content/strategy', this.getContentStrategy.bind(this));
    this.app.post('/api/creator/content/optimize', this.optimizeContent.bind(this));
    this.app.get('/api/creator/content/calendar', this.getContentCalendar.bind(this));
    this.app.post('/api/creator/content/schedule', this.optimizePostingSchedule.bind(this));

    // Monetization API
    this.app.get('/api/creator/monetization/overview', this.getMonetizationOverview.bind(this));
    this.app.get('/api/creator/monetization/sponsorship', this.getSponsorshipValuation.bind(this));
    this.app.get('/api/creator/monetization/affiliate', this.getAffiliateOpportunities.bind(this));
    this.app.get('/api/creator/monetization/merchandise', this.getMerchandisePotential.bind(this));

    // Growth & Engagement API
    this.app.get('/api/creator/growth/prediction', this.getGrowthPrediction.bind(this));
    this.app.get('/api/creator/engagement/analysis', this.getEngagementAnalysis.bind(this));
    this.app.get('/api/creator/audience/segments', this.getAudienceSegments.bind(this));
    this.app.get('/api/creator/trends/analysis', this.getTrendAnalysis.bind(this));

    // Creator Tools API
    this.app.post('/api/creator/tools/title-optimizer', this.optimizeTitle.bind(this));
    this.app.post('/api/creator/tools/hashtag-analyzer', this.analyzeHashtags.bind(this));
    this.app.post('/api/creator/tools/thumbnail-analyzer', this.analyzeThumbnail.bind(this));
    this.app.post('/api/creator/tools/description-optimizer', this.optimizeDescription.bind(this));

    // Creator Reports API
    this.app.get('/api/creator/reports/weekly', this.getWeeklyReport.bind(this));
    this.app.get('/api/creator/reports/monthly', this.getMonthlyReport.bind(this));
    this.app.post('/api/creator/reports/export', this.exportCreatorReport.bind(this));

    // Creator Alerts API
    this.app.get('/api/creator/alerts', this.getCreatorAlerts.bind(this));
    this.app.post('/api/creator/alerts/settings', this.updateAlertSettings.bind(this));

    // Creator Search API
    this.app.get('/api/creator/search/content', this.searchContent.bind(this));
    this.app.get('/api/creator/search/performance', this.searchByPerformance.bind(this));
    this.app.get('/api/creator/search/trends', this.searchTrends.bind(this));

    // Error handling
    this.app.use(this.errorHandler.bind(this));
  }

  // Creator Profile Methods
  async getCreatorProfile(req, res) {
    try {
      const profile = {
        name: this.creatorConfig.name,
        niche: this.creatorConfig.niche,
        level: this.creatorConfig.level,
        primaryPlatform: this.creatorConfig.primaryPlatform,
        features: this.creatorConfig.features,
        stats: await this.getCreatorStats(),
        lastUpdated: new Date().toISOString()
      };
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateCreatorProfile(req, res) {
    try {
      const { name, niche, level, primaryPlatform } = req.body;
      // Update creator configuration
      if (name) this.creatorConfig.name = name;
      if (niche) this.creatorConfig.niche = niche;
      if (level) this.creatorConfig.level = level;
      if (primaryPlatform) this.creatorConfig.primaryPlatform = primaryPlatform;
      
      res.json({ message: 'Profile updated successfully', profile: this.creatorConfig });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Creator Analytics Methods
  async getCreatorOverview(req, res) {
    try {
      const overview = await this.creatorAnalytics.getCreatorProfile(this.creatorConfig.name);
      res.json(overview);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async analyzeCreatorAccount(req, res) {
    try {
      const { platforms, timeframe } = req.body;
      const analysis = await this.creatorAnalytics.analyzeCreatorProfile(
        this.creatorConfig.name,
        platforms || ['youtube', 'tiktok', 'instagram'],
        timeframe || '90d'
      );
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getPlatformAnalytics(req, res) {
    try {
      const { platform } = req.params;
      const analytics = await this.creatorAnalytics.analyzePlatform(
        this.creatorConfig.name,
        platform,
        '30d'
      );
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Content Strategy Methods
  async getContentStrategy(req, res) {
    try {
      const strategy = {
        contentTypes: await this.analyzeContentTypes(),
        postingSchedule: await this.analyzePostingSchedule(),
        hashtagStrategy: await this.analyzeHashtagStrategy(),
        titleStrategy: await this.analyzeTitleStrategy(),
        thumbnailStrategy: await this.analyzeThumbnailStrategy(),
        descriptionStrategy: await this.analyzeDescriptionStrategy()
      };
      res.json(strategy);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async optimizeContent(req, res) {
    try {
      const { content, platform, contentType } = req.body;
      const optimization = await this.optimizeContentForPlatform(content, platform, contentType);
      res.json(optimization);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Monetization Methods
  async getMonetizationOverview(req, res) {
    try {
      const overview = {
        totalRevenue: await this.calculateTotalRevenue(),
        revenueStreams: await this.analyzeRevenueStreams(),
        sponsorshipPotential: await this.calculateSponsorshipPotential(),
        affiliateOpportunities: await this.findAffiliateOpportunities(),
        merchandisePotential: await this.calculateMerchandisePotential()
      };
      res.json(overview);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Growth & Engagement Methods
  async getGrowthPrediction(req, res) {
    try {
      const prediction = await this.predictGrowth();
      res.json(prediction);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getEngagementAnalysis(req, res) {
    try {
      const analysis = await this.analyzeEngagement();
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Creator Tools Methods
  async optimizeTitle(req, res) {
    try {
      const { title, platform, niche } = req.body;
      const optimizedTitle = await this.optimizeTitleForPlatform(title, platform, niche);
      res.json({ original: title, optimized: optimizedTitle });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async analyzeHashtags(req, res) {
    try {
      const { hashtags, platform } = req.body;
      const analysis = await this.analyzeHashtagPerformance(hashtags, platform);
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Creator Reports Methods
  async getWeeklyReport(req, res) {
    try {
      const report = await this.generateWeeklyReport();
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getMonthlyReport(req, res) {
    try {
      const report = await this.generateMonthlyReport();
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Creator Search Methods
  async searchContent(req, res) {
    try {
      const { query, platform, filters } = req.query;
      const results = await this.searchEngine.searchContent(query, platform, filters);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Dashboard UI Methods
  serveCreatorDashboard(req, res) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LyraLytics - Creator Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: 'Inter', sans-serif; }
        .creator-gradient { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .creator-card { backdrop-filter: blur(10px); background: rgba(255, 255, 255, 0.1); }
    </style>
</head>
<body class="bg-gray-50">
    <div class="min-h-screen">
        <!-- Header -->
        <header class="creator-gradient text-white shadow-lg">
            <div class="container mx-auto px-6 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <h1 class="text-2xl font-bold">🎬 LyraLytics</h1>
                        <span class="text-sm opacity-90">Creator Dashboard</span>
                    </div>
                    <div class="flex items-center space-x-4">
                        <span class="text-sm">Welcome, ${this.creatorConfig.name}</span>
                        <span class="px-3 py-1 bg-white bg-opacity-20 rounded-full text-xs">${this.creatorConfig.level}</span>
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="container mx-auto px-6 py-8">
            <!-- Quick Stats -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="creator-card rounded-lg p-6 text-white">
                    <h3 class="text-lg font-semibold mb-2">Total Followers</h3>
                    <p class="text-3xl font-bold" id="totalFollowers">Loading...</p>
                </div>
                <div class="creator-card rounded-lg p-6 text-white">
                    <h3 class="text-lg font-semibold mb-2">Total Views</h3>
                    <p class="text-3xl font-bold" id="totalViews">Loading...</p>
                </div>
                <div class="creator-card rounded-lg p-6 text-white">
                    <h3 class="text-lg font-semibold mb-2">Engagement Rate</h3>
                    <p class="text-3xl font-bold" id="engagementRate">Loading...</p>
                </div>
                <div class="creator-card rounded-lg p-6 text-white">
                    <h3 class="text-lg font-semibold mb-2">Monthly Revenue</h3>
                    <p class="text-3xl font-bold" id="monthlyRevenue">Loading...</p>
                </div>
            </div>

            <!-- Platform Tabs -->
            <div class="bg-white rounded-lg shadow-lg mb-8">
                <div class="border-b border-gray-200">
                    <nav class="flex space-x-8 px-6">
                        <button class="platform-tab py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300" data-platform="overview">Overview</button>
                        <button class="platform-tab py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300" data-platform="youtube">YouTube</button>
                        <button class="platform-tab py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300" data-platform="tiktok">TikTok</button>
                        <button class="platform-tab py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300" data-platform="instagram">Instagram</button>
                    </nav>
                </div>
                <div class="p-6">
                    <div id="platformContent">
                        <!-- Content will be loaded here -->
                    </div>
                </div>
            </div>

            <!-- Creator Tools -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <h3 class="text-xl font-semibold mb-4">🎯 Content Optimization</h3>
                    <div class="space-y-4">
                        <button class="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600" onclick="optimizeTitle()">Title Optimizer</button>
                        <button class="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600" onclick="analyzeHashtags()">Hashtag Analyzer</button>
                        <button class="w-full bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600" onclick="optimizeSchedule()">Posting Schedule</button>
                    </div>
                </div>
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <h3 class="text-xl font-semibold mb-4">💰 Monetization</h3>
                    <div class="space-y-4">
                        <button class="w-full bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600" onclick="sponsorshipValuation()">Sponsorship Value</button>
                        <button class="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600" onclick="affiliateOpportunities()">Affiliate Opportunities</button>
                        <button class="w-full bg-indigo-500 text-white py-2 px-4 rounded hover:bg-indigo-600" onclick="merchandisePotential()">Merchandise Potential</button>
                    </div>
                </div>
            </div>

            <!-- Analytics Charts -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <h3 class="text-xl font-semibold mb-4">📈 Growth Trends</h3>
                    <canvas id="growthChart" width="400" height="200"></canvas>
                </div>
                <div class="bg-white rounded-lg shadow-lg p-6">
                    <h3 class="text-xl font-semibold mb-4">📊 Engagement Analysis</h3>
                    <canvas id="engagementChart" width="400" height="200"></canvas>
                </div>
            </div>
        </main>
    </div>

    <script>
        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', function() {
            loadCreatorOverview();
            setupPlatformTabs();
            initializeCharts();
        });

        async function loadCreatorOverview() {
            try {
                const response = await fetch('/api/creator/overview');
                const data = await response.json();
                updateQuickStats(data);
            } catch (error) {
                console.error('Error loading overview:', error);
            }
        }

        function updateQuickStats(data) {
            document.getElementById('totalFollowers').textContent = data.totalFollowers || '0';
            document.getElementById('totalViews').textContent = data.totalViews || '0';
            document.getElementById('engagementRate').textContent = (data.engagementRate || '0') + '%';
            document.getElementById('monthlyRevenue').textContent = '$' + (data.monthlyRevenue || '0');
        }

        function setupPlatformTabs() {
            const tabs = document.querySelectorAll('.platform-tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    const platform = this.dataset.platform;
                    loadPlatformContent(platform);
                    
                    // Update active tab
                    tabs.forEach(t => t.classList.remove('border-blue-500', 'text-blue-600'));
                    this.classList.add('border-blue-500', 'text-blue-600');
                });
            });
        }

        async function loadPlatformContent(platform) {
            const contentDiv = document.getElementById('platformContent');
            contentDiv.innerHTML = '<p class="text-gray-500">Loading...</p>';
            
            try {
                if (platform === 'overview') {
                    const response = await fetch('/api/creator/overview');
                    const data = await response.json();
                    contentDiv.innerHTML = generateOverviewHTML(data);
                } else {
                    const response = await fetch(\`/api/creator/analytics/\${platform}\`);
                    const data = await response.json();
                    contentDiv.innerHTML = generatePlatformHTML(data, platform);
                }
            } catch (error) {
                contentDiv.innerHTML = '<p class="text-red-500">Error loading content</p>';
            }
        }

        function generateOverviewHTML(data) {
            return \`
                <div class="space-y-6">
                    <h2 class="text-2xl font-bold">Creator Overview</h2>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="bg-gray-50 p-4 rounded">
                            <h4 class="font-semibold">Best Performing Platform</h4>
                            <p class="text-lg">\${data.bestPlatform || 'N/A'}</p>
                        </div>
                        <div class="bg-gray-50 p-4 rounded">
                            <h4 class="font-semibold">Content Strategy</h4>
                            <p class="text-lg">\${data.contentStrategy || 'N/A'}</p>
                        </div>
                        <div class="bg-gray-50 p-4 rounded">
                            <h4 class="font-semibold">Growth Rate</h4>
                            <p class="text-lg">\${data.growthRate || '0'}%</p>
                        </div>
                    </div>
                </div>
            \`;
        }

        function generatePlatformHTML(data, platform) {
            return \`
                <div class="space-y-6">
                    <h2 class="text-2xl font-bold capitalize">\${platform} Analytics</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="bg-gray-50 p-4 rounded">
                            <h4 class="font-semibold">Followers</h4>
                            <p class="text-2xl">\${data.followers || '0'}</p>
                        </div>
                        <div class="bg-gray-50 p-4 rounded">
                            <h4 class="font-semibold">Engagement Rate</h4>
                            <p class="text-2xl">\${data.engagementRate || '0'}%</p>
                        </div>
                    </div>
                </div>
            \`;
        }

        function initializeCharts() {
            // Growth Chart
            const growthCtx = document.getElementById('growthChart').getContext('2d');
            new Chart(growthCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Followers',
                        data: [1200, 1900, 3000, 5000, 2000, 3000],
                        borderColor: 'rgb(59, 130, 246)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });

            // Engagement Chart
            const engagementCtx = document.getElementById('engagementChart').getContext('2d');
            new Chart(engagementCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Likes', 'Comments', 'Shares', 'Saves'],
                    datasets: [{
                        data: [300, 50, 100, 30],
                        backgroundColor: [
                            'rgb(59, 130, 246)',
                            'rgb(16, 185, 129)',
                            'rgb(245, 158, 11)',
                            'rgb(239, 68, 68)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }

        // Creator Tools Functions
        async function optimizeTitle() {
            const title = prompt('Enter your content title:');
            if (!title) return;
            
            try {
                const response = await fetch('/api/creator/tools/title-optimizer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, platform: 'youtube', niche: '${this.creatorConfig.niche}' })
                });
                const data = await response.json();
                alert(\`Optimized title: \${data.optimized}\`);
            } catch (error) {
                alert('Error optimizing title');
            }
        }

        async function analyzeHashtags() {
            const hashtags = prompt('Enter hashtags (comma-separated):');
            if (!hashtags) return;
            
            try {
                const response = await fetch('/api/creator/tools/hashtag-analyzer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ hashtags: hashtags.split(','), platform: 'instagram' })
                });
                const data = await response.json();
                alert(\`Hashtag analysis: \${JSON.stringify(data, null, 2)}\`);
            } catch (error) {
                alert('Error analyzing hashtags');
            }
        }

        async function optimizeSchedule() {
            try {
                const response = await fetch('/api/creator/content/schedule', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ platforms: ['youtube', 'tiktok', 'instagram'] })
                });
                const data = await response.json();
                alert(\`Optimal posting schedule: \${JSON.stringify(data, null, 2)}\`);
            } catch (error) {
                alert('Error optimizing schedule');
            }
        }

        async function sponsorshipValuation() {
            try {
                const response = await fetch('/api/creator/monetization/sponsorship');
                const data = await response.json();
                alert(\`Sponsorship value: $\${data.value}\`);
            } catch (error) {
                alert('Error calculating sponsorship value');
            }
        }

        async function affiliateOpportunities() {
            try {
                const response = await fetch('/api/creator/monetization/affiliate');
                const data = await response.json();
                alert(\`Affiliate opportunities: \${JSON.stringify(data, null, 2)}\`);
            } catch (error) {
                alert('Error finding affiliate opportunities');
            }
        }

        async function merchandisePotential() {
            try {
                const response = await fetch('/api/creator/monetization/merchandise');
                const data = await response.json();
                alert(\`Merchandise potential: \${JSON.stringify(data, null, 2)}\`);
            } catch (error) {
                alert('Error calculating merchandise potential');
            }
        }
    </script>
</body>
</html>
    `;
    res.send(html);
  }

  // Helper Methods (placeholder implementations)
  async getCreatorStats() {
    return {
      totalFollowers: 0,
      totalViews: 0,
      engagementRate: 0,
      monthlyRevenue: 0
    };
  }

  async analyzeContentTypes() {
    return { bestTypes: [], recommendations: [] };
  }

  async analyzePostingSchedule() {
    return { optimalTimes: [], recommendations: [] };
  }

  async analyzeHashtagStrategy() {
    return { trending: [], recommendations: [] };
  }

  async analyzeTitleStrategy() {
    return { patterns: [], recommendations: [] };
  }

  async analyzeThumbnailStrategy() {
    return { elements: [], recommendations: [] };
  }

  async analyzeDescriptionStrategy() {
    return { patterns: [], recommendations: [] };
  }

  async optimizeContentForPlatform(content, platform, contentType) {
    return { optimized: content, recommendations: [] };
  }

  async calculateTotalRevenue() {
    return 0;
  }

  async analyzeRevenueStreams() {
    return [];
  }

  async calculateSponsorshipPotential() {
    return { value: 0, factors: [] };
  }

  async findAffiliateOpportunities() {
    return [];
  }

  async calculateMerchandisePotential() {
    return { potential: 0, recommendations: [] };
  }

  async predictGrowth() {
    return { prediction: 0, factors: [] };
  }

  async analyzeEngagement() {
    return { rate: 0, trends: [] };
  }

  async optimizeTitleForPlatform(title, platform, niche) {
    return title + ' (Optimized)';
  }

  async analyzeHashtagPerformance(hashtags, platform) {
    return { performance: [], recommendations: [] };
  }

  async generateWeeklyReport() {
    return { summary: '', details: {} };
  }

  async generateMonthlyReport() {
    return { summary: '', details: {} };
  }

  async compareWithCompetitors(req, res) {
    try {
      const competitors = await this.creatorAnalytics.compareCreators([this.creatorConfig.name, 'competitor1', 'competitor2']);
      res.json(competitors);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getContentCalendar(req, res) {
    try {
      const calendar = await this.generateContentCalendar();
      res.json(calendar);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async optimizePostingSchedule(req, res) {
    try {
      const { platforms } = req.body;
      const schedule = await this.optimizeScheduleForPlatforms(platforms);
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getCreatorAlerts(req, res) {
    try {
      const alerts = await this.creatorAnalytics.generateCreatorAlerts({ creatorId: this.creatorConfig.name });
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateAlertSettings(req, res) {
    try {
      const { settings } = req.body;
      res.json({ message: 'Alert settings updated' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async searchByPerformance(req, res) {
    try {
      const { metric, value, platform } = req.query;
      const results = await this.searchEngine.searchByPerformance(metric, value, platform);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async searchTrends(req, res) {
    try {
      const { query, platform } = req.query;
      const results = await this.searchEngine.getSearchTrends(query, platform);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async exportCreatorReport(req, res) {
    try {
      const { format, timeframe } = req.body;
      const report = await this.creatorAnalytics.exportCreatorReport(this.creatorConfig.name, format);
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Placeholder helper methods
  async generateContentCalendar() {
    return { calendar: [], recommendations: [] };
  }

  async optimizeScheduleForPlatforms(platforms) {
    return { schedule: {}, recommendations: [] };
  }

  errorHandler(err, req, res, next) {
    console.error('Creator Dashboard Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }

  start() {
    const port = process.env.DASHBOARD_PORT || 3001;
    this.app.listen(port, () => {
      console.log(`🎬 Creator Dashboard running on http://localhost:${port}`);
      console.log(`👤 Creator: ${this.creatorConfig.name}`);
      console.log(`🎯 Niche: ${this.creatorConfig.niche}`);
      console.log(`⭐ Level: ${this.creatorConfig.level}`);
    });
  }
}

module.exports = CreatorDashboard; 