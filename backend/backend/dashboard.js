const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const SocialMediaAnalytics = require('./social-analytics');
const GoogleCloudConsole = require('./google-cloud');
const { LyraSearchEngine } = require('./lyra-search');
require('dotenv').config();

class AnalyticsDashboard {
  constructor() {
    this.app = express();
    this.analytics = new SocialMediaAnalytics();
    this.gcp = new GoogleCloudConsole();
    this.searchEngine = new LyraSearchEngine();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupRateLimiting();
    this.initializeSearch();
  }

  async initializeSearch() {
    try {
      await this.searchEngine.initialize();
      console.log('✅ Lyra Search Engine initialized for dashboard');
    } catch (error) {
      console.error('❌ Failed to initialize Lyra Search Engine:', error);
    }
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
          scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"]
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
      duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000 // 15 minutes
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
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    // API Routes
    this.app.get('/api/overview', this.getOverview.bind(this));
    this.app.post('/api/analyze/youtube', this.analyzeYouTube.bind(this));
    this.app.post('/api/analyze/tiktok', this.analyzeTikTok.bind(this));
    this.app.post('/api/analyze/instagram', this.analyzeInstagram.bind(this));
    this.app.get('/api/analytics/:platform/:id', this.getAnalytics.bind(this));
    this.app.get('/api/recommendations/:platform/:id', this.getRecommendations.bind(this));
    this.app.get('/api/trends/:platform/:id', this.getTrends.bind(this));
    this.app.get('/api/comparison', this.compareAccounts.bind(this));
    this.app.post('/api/export', this.exportData.bind(this));

    // Lyra Search Routes
    this.app.get('/api/search', this.searchAnalytics.bind(this));
    this.app.get('/api/search/top-performers', this.getTopPerformers.bind(this));
    this.app.get('/api/search/high-engagement', this.getHighEngagementAccounts.bind(this));
    this.app.get('/api/search/issues', this.searchIssues.bind(this));
    this.app.get('/api/search/recommendations', this.searchRecommendations.bind(this));
    this.app.get('/api/search/similar', this.findSimilarAccounts.bind(this));
    this.app.get('/api/search/trends', this.getSearchTrends.bind(this));
    this.app.get('/api/search/index-info', this.getSearchIndexInfo.bind(this));

    // Dashboard routes
    this.app.get('/', this.serveDashboard.bind(this));
    this.app.get('/dashboard', this.serveDashboard.bind(this));
    this.app.get('/analytics/:platform/:id', this.serveAnalyticsPage.bind(this));
    this.app.get('/search', this.serveSearchPage.bind(this));

    // Error handling
    this.app.use(this.errorHandler.bind(this));
  }

  async getOverview(req, res) {
    try {
      const overview = {
        totalAccounts: 0,
        totalAnalyses: 0,
        recentAnalyses: [],
        platformBreakdown: {
          youtube: 0,
          tiktok: 0,
          instagram: 0
        },
        topPerformers: [],
        systemHealth: await this.gcp.healthCheck(),
        searchIndexInfo: await this.searchEngine.getAllIndexInfo()
      };

      // Get analytics from BigQuery
      const query = `
        SELECT 
          platform,
          COUNT(*) as count,
          MAX(analysisDate) as lastAnalysis
        FROM \`${process.env.GOOGLE_CLOUD_PROJECT_ID}.${process.env.BIGQUERY_DATASET_ID || 'social_analytics'}.youtube_analyses\`
        GROUP BY platform
        UNION ALL
        SELECT 
          platform,
          COUNT(*) as count,
          MAX(analysisDate) as lastAnalysis
        FROM \`${process.env.GOOGLE_CLOUD_PROJECT_ID}.${process.env.BIGQUERY_DATASET_ID || 'social_analytics'}.tiktok_analyses\`
        GROUP BY platform
        UNION ALL
        SELECT 
          platform,
          COUNT(*) as count,
          MAX(analysisDate) as lastAnalysis
        FROM \`${process.env.GOOGLE_CLOUD_PROJECT_ID}.${process.env.BIGQUERY_DATASET_ID || 'social_analytics'}.instagram_analyses\`
        GROUP BY platform
      `;

      const results = await this.gcp.queryData(query);
      
      results.forEach(row => {
        overview.platformBreakdown[row.platform] = parseInt(row.count);
        overview.totalAnalyses += parseInt(row.count);
      });

      res.json(overview);
    } catch (error) {
      console.error('Error getting overview:', error);
      res.status(500).json({ error: 'Failed to get overview' });
    }
  }

  async analyzeYouTube(req, res) {
    try {
      const { channelId, days = 30 } = req.body;
      
      if (!channelId) {
        return res.status(400).json({ error: 'Channel ID is required' });
      }

      const analysis = await this.analytics.analyzeYouTubeChannel(channelId, days);
      
      // Index the analysis in Lyra
      await this.searchEngine.addAnalyticsRecord(analysis);
      
      res.json(analysis);
    } catch (error) {
      console.error('YouTube analysis error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async analyzeTikTok(req, res) {
    try {
      const { username, days = 30 } = req.body;
      
      if (!username) {
        return res.status(400).json({ error: 'Username is required' });
      }

      const analysis = await this.analytics.analyzeTikTokAccount(username, days);
      
      // Index the analysis in Lyra
      await this.searchEngine.addAnalyticsRecord(analysis);
      
      res.json(analysis);
    } catch (error) {
      console.error('TikTok analysis error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async analyzeInstagram(req, res) {
    try {
      const { username, days = 30 } = req.body;
      
      if (!username) {
        return res.status(400).json({ error: 'Username is required' });
      }

      const analysis = await this.analytics.analyzeInstagramAccount(username, days);
      
      // Index the analysis in Lyra
      await this.searchEngine.addAnalyticsRecord(analysis);
      
      res.json(analysis);
    } catch (error) {
      console.error('Instagram analysis error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ===== LYRA SEARCH ENDPOINTS =====

  async searchAnalytics(req, res) {
    try {
      const { 
        query = '', 
        platform = 'combined', 
        limit = 20, 
        offset = 0,
        filters = {},
        sortBy = 'performanceScore',
        sortOrder = 'desc'
      } = req.query;

      const results = await this.searchEngine.searchAnalytics(query, {
        platform,
        limit: parseInt(limit),
        offset: parseInt(offset),
        filters: JSON.parse(filters || '{}'),
        sortBy,
        sortOrder
      });

      res.json(results);
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  }

  async getTopPerformers(req, res) {
    try {
      const { platform = 'combined', limit = 10 } = req.query;
      const results = await this.searchEngine.findTopPerformers(platform, parseInt(limit));
      res.json(results);
    } catch (error) {
      console.error('Top performers search error:', error);
      res.status(500).json({ error: 'Failed to get top performers' });
    }
  }

  async getHighEngagementAccounts(req, res) {
    try {
      const { platform = 'combined', limit = 10 } = req.query;
      const results = await this.searchEngine.findHighEngagementAccounts(platform, parseInt(limit));
      res.json(results);
    } catch (error) {
      console.error('High engagement search error:', error);
      res.status(500).json({ error: 'Failed to get high engagement accounts' });
    }
  }

  async searchIssues(req, res) {
    try {
      const { issueType = '', platform = 'combined', limit = 20 } = req.query;
      const results = await this.searchEngine.searchIssues(issueType, platform, parseInt(limit));
      res.json(results);
    } catch (error) {
      console.error('Issues search error:', error);
      res.status(500).json({ error: 'Failed to search issues' });
    }
  }

  async searchRecommendations(req, res) {
    try {
      const { category = '', platform = 'combined', limit = 20 } = req.query;
      const results = await this.searchEngine.searchRecommendations(category, platform, parseInt(limit));
      res.json(results);
    } catch (error) {
      console.error('Recommendations search error:', error);
      res.status(500).json({ error: 'Failed to search recommendations' });
    }
  }

  async findSimilarAccounts(req, res) {
    try {
      const { accountId, platform = 'combined', limit = 10 } = req.query;
      
      if (!accountId) {
        return res.status(400).json({ error: 'Account ID is required' });
      }

      const results = await this.searchEngine.findSimilarAccounts(accountId, platform, parseInt(limit));
      res.json(results);
    } catch (error) {
      console.error('Similar accounts search error:', error);
      res.status(500).json({ error: 'Failed to find similar accounts' });
    }
  }

  async getSearchTrends(req, res) {
    try {
      const { platform = 'combined', days = 30 } = req.query;
      const trends = await this.searchEngine.analyzeTrends(platform, parseInt(days));
      res.json(trends);
    } catch (error) {
      console.error('Trends analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze trends' });
    }
  }

  async getSearchIndexInfo(req, res) {
    try {
      const info = await this.searchEngine.getAllIndexInfo();
      res.json(info);
    } catch (error) {
      console.error('Index info error:', error);
      res.status(500).json({ error: 'Failed to get index info' });
    }
  }

  // ===== EXISTING ENDPOINTS =====

  async getAnalytics(req, res) {
    try {
      const { platform, id } = req.params;
      const { days = 30 } = req.query;

      const query = `
        SELECT *
        FROM \`${process.env.GOOGLE_CLOUD_PROJECT_ID}.${process.env.BIGQUERY_DATASET_ID || 'social_analytics'}.${platform}_analyses\`
        WHERE ${platform === 'youtube' ? 'channelId' : 'username'} = @id
        ORDER BY analysisDate DESC
        LIMIT 1
      `;

      const options = {
        query,
        params: { id }
      };

      const [rows] = await this.gcp.bigquery.query(options);
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Analysis not found' });
      }

      res.json(rows[0]);
    } catch (error) {
      console.error('Error getting analytics:', error);
      res.status(500).json({ error: 'Failed to get analytics' });
    }
  }

  async getRecommendations(req, res) {
    try {
      const { platform, id } = req.params;
      
      const analysis = await this.getAnalytics(req, res);
      if (analysis.error) return;

      const recommendations = analysis.optimizationRecommendations;
      res.json({
        platform,
        id,
        recommendations,
        priorityCounts: {
          high: recommendations.filter(r => r.priority === 'high').length,
          medium: recommendations.filter(r => r.priority === 'medium').length,
          low: recommendations.filter(r => r.priority === 'low').length
        }
      });
    } catch (error) {
      console.error('Error getting recommendations:', error);
      res.status(500).json({ error: 'Failed to get recommendations' });
    }
  }

  async getTrends(req, res) {
    try {
      const { platform, id } = req.params;
      const { days = 90 } = req.query;

      const query = `
        SELECT 
          analysisDate,
          performanceMetrics,
          contentAnalysis
        FROM \`${process.env.GOOGLE_CLOUD_PROJECT_ID}.${process.env.BIGQUERY_DATASET_ID || 'social_analytics'}.${platform}_analyses\`
        WHERE ${platform === 'youtube' ? 'channelId' : 'username'} = @id
        AND analysisDate >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL @days DAY)
        ORDER BY analysisDate ASC
      `;

      const options = {
        query,
        params: { id, days: parseInt(days) }
      };

      const [rows] = await this.gcp.bigquery.query(options);
      
      const trends = this.calculateTrends(rows, platform);
      res.json(trends);
    } catch (error) {
      console.error('Error getting trends:', error);
      res.status(500).json({ error: 'Failed to get trends' });
    }
  }

  async compareAccounts(req, res) {
    try {
      const { accounts } = req.query; // Format: "platform:id,platform:id"
      
      if (!accounts) {
        return res.status(400).json({ error: 'Accounts parameter is required' });
      }

      const accountList = accounts.split(',').map(acc => {
        const [platform, id] = acc.split(':');
        return { platform, id };
      });

      const comparisons = await Promise.all(
        accountList.map(async ({ platform, id }) => {
          const analysis = await this.getAnalytics({ params: { platform, id } }, { json: (data) => data });
          return { platform, id, analysis };
        })
      );

      const comparisonData = this.generateComparisonData(comparisons);
      res.json(comparisonData);
    } catch (error) {
      console.error('Error comparing accounts:', error);
      res.status(500).json({ error: 'Failed to compare accounts' });
    }
  }

  async exportData(req, res) {
    try {
      const { platform, id, format = 'json' } = req.body;
      
      const analysis = await this.getAnalytics({ params: { platform, id } }, { json: (data) => data });
      
      if (format === 'csv') {
        const { Parser } = require('json2csv');
        const parser = new Parser();
        const csv = parser.parse(analysis);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${platform}_${id}_analysis.csv`);
        res.send(csv);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=${platform}_${id}_analysis.json`);
        res.json(analysis);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      res.status(500).json({ error: 'Failed to export data' });
    }
  }

  serveDashboard(req, res) {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LyraLytics - Social Media Analytics Dashboard</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }
          .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
          .header { background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .nav { display: flex; gap: 15px; margin-top: 15px; }
          .nav a { padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
          .nav a:hover { background: #0056b3; }
          .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
          .card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .card h3 { margin-bottom: 15px; color: #333; }
          .metric { display: flex; justify-content: space-between; margin-bottom: 10px; }
          .metric-value { font-weight: bold; color: #007bff; }
          .btn { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
          .btn:hover { background: #0056b3; }
          .form-group { margin-bottom: 15px; }
          .form-group label { display: block; margin-bottom: 5px; }
          .form-group input, .form-group select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
          .chart-container { position: relative; height: 300px; margin-top: 20px; }
          .search-section { background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
          .search-results { max-height: 400px; overflow-y: auto; }
          .search-result { background: white; padding: 15px; margin-bottom: 10px; border-radius: 5px; border-left: 4px solid #007bff; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 LyraLytics - Social Media Analytics Dashboard</h1>
            <p>Comprehensive analytics for YouTube, TikTok, and Instagram optimization with Lyra Search</p>
            <div class="nav">
              <a href="/dashboard">Dashboard</a>
              <a href="/search">Search Analytics</a>
              <a href="/api/search/index-info" target="_blank">Search Index Info</a>
            </div>
          </div>

          <div class="search-section">
            <h3>🔍 Quick Search</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px; margin-bottom: 15px;">
              <input type="text" id="searchQuery" placeholder="Search analytics..." style="grid-column: 1 / 3;">
              <select id="searchPlatform">
                <option value="combined">All Platforms</option>
                <option value="youtube">YouTube</option>
                <option value="tiktok">TikTok</option>
                <option value="instagram">Instagram</option>
              </select>
              <button onclick="searchAnalytics()" class="btn">Search</button>
            </div>
            <div id="searchResults" class="search-results"></div>
          </div>

          <div class="grid">
            <div class="card">
              <h3>🔍 Quick Analysis</h3>
              <form id="analysisForm">
                <div class="form-group">
                  <label>Platform:</label>
                  <select id="platform" required>
                    <option value="">Select Platform</option>
                    <option value="youtube">YouTube</option>
                    <option value="tiktok">TikTok</option>
                    <option value="instagram">Instagram</option>
                  </select>
                </div>
                <div class="form-group">
                  <label id="idLabel">Channel ID / Username:</label>
                  <input type="text" id="accountId" required placeholder="Enter channel ID or username">
                </div>
                <div class="form-group">
                  <label>Analysis Period (days):</label>
                  <input type="number" id="days" value="30" min="7" max="365">
                </div>
                <button type="submit" class="btn">Analyze Account</button>
              </form>
            </div>

            <div class="card">
              <h3>📈 Overview</h3>
              <div id="overview">
                <div class="metric">
                  <span>Total Analyses:</span>
                  <span class="metric-value" id="totalAnalyses">-</span>
                </div>
                <div class="metric">
                  <span>YouTube Accounts:</span>
                  <span class="metric-value" id="youtubeCount">-</span>
                </div>
                <div class="metric">
                  <span>TikTok Accounts:</span>
                  <span class="metric-value" id="tiktokCount">-</span>
                </div>
                <div class="metric">
                  <span>Instagram Accounts:</span>
                  <span class="metric-value" id="instagramCount">-</span>
                </div>
              </div>
            </div>

            <div class="card">
              <h3>🏆 Top Performers</h3>
              <button onclick="loadTopPerformers()" class="btn">Load Top Performers</button>
              <div id="topPerformers" style="margin-top: 15px;"></div>
            </div>

            <div class="card">
              <h3>📊 Engagement Leaders</h3>
              <button onclick="loadHighEngagement()" class="btn">Load High Engagement</button>
              <div id="highEngagement" style="margin-top: 15px;"></div>
            </div>
          </div>

          <div class="card" id="resultsCard" style="display: none;">
            <h3>📋 Analysis Results</h3>
            <div id="results"></div>
          </div>
        </div>

        <script>
          // Dashboard JavaScript
          document.addEventListener('DOMContentLoaded', function() {
            loadOverview();
            setupFormHandlers();
          });

          async function loadOverview() {
            try {
              const response = await fetch('/api/overview');
              const data = await response.json();
              
              document.getElementById('totalAnalyses').textContent = data.totalAnalyses;
              document.getElementById('youtubeCount').textContent = data.platformBreakdown.youtube;
              document.getElementById('tiktokCount').textContent = data.platformBreakdown.tiktok;
              document.getElementById('instagramCount').textContent = data.platformBreakdown.instagram;
            } catch (error) {
              console.error('Error loading overview:', error);
            }
          }

          async function searchAnalytics() {
            const query = document.getElementById('searchQuery').value;
            const platform = document.getElementById('searchPlatform').value;
            const resultsDiv = document.getElementById('searchResults');

            if (!query.trim()) {
              resultsDiv.innerHTML = '<p>Please enter a search query</p>';
              return;
            }

            try {
              const response = await fetch(\`/api/search?query=\${encodeURIComponent(query)}&platform=\${platform}\`);
              const data = await response.json();

              if (data.hits.length === 0) {
                resultsDiv.innerHTML = '<p>No results found</p>';
                return;
              }

              resultsDiv.innerHTML = data.hits.map(hit => \`
                <div class="search-result">
                  <h4>\${hit.accountName || hit.channelName || hit.username}</h4>
                  <p><strong>Platform:</strong> \${hit.platform} | <strong>Performance:</strong> \${(hit.performanceScore * 100).toFixed(1)}%</p>
                  <p><strong>Engagement:</strong> \${(hit.engagementRate * 100).toFixed(2)}% | <strong>Followers:</strong> \${hit.followerCount?.toLocaleString() || hit.subscriberCount?.toLocaleString()}</p>
                  <p><strong>Score:</strong> \${hit.score.toFixed(3)}</p>
                </div>
              \`).join('');

            } catch (error) {
              console.error('Search error:', error);
              resultsDiv.innerHTML = '<p>Search failed</p>';
            }
          }

          async function loadTopPerformers() {
            try {
              const response = await fetch('/api/search/top-performers?limit=5');
              const data = await response.json();
              
              const div = document.getElementById('topPerformers');
              div.innerHTML = data.hits.map(hit => \`
                <div style="margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                  <strong>\${hit.accountName}</strong> (\${hit.platform})<br>
                  Performance: \${(hit.performanceScore * 100).toFixed(1)}%
                </div>
              \`).join('');
            } catch (error) {
              console.error('Error loading top performers:', error);
            }
          }

          async function loadHighEngagement() {
            try {
              const response = await fetch('/api/search/high-engagement?limit=5');
              const data = await response.json();
              
              const div = document.getElementById('highEngagement');
              div.innerHTML = data.hits.map(hit => \`
                <div style="margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                  <strong>\${hit.accountName}</strong> (\${hit.platform})<br>
                  Engagement: \${(hit.engagementRate * 100).toFixed(2)}%
                </div>
              \`).join('');
            } catch (error) {
              console.error('Error loading high engagement:', error);
            }
          }

          function setupFormHandlers() {
            const platformSelect = document.getElementById('platform');
            const idLabel = document.getElementById('idLabel');
            const accountIdInput = document.getElementById('accountId');

            platformSelect.addEventListener('change', function() {
              const platform = this.value;
              if (platform === 'youtube') {
                idLabel.textContent = 'Channel ID:';
                accountIdInput.placeholder = 'Enter YouTube channel ID';
              } else {
                idLabel.textContent = 'Username:';
                accountIdInput.placeholder = 'Enter ' + platform + ' username';
              }
            });

            document.getElementById('analysisForm').addEventListener('submit', async function(e) {
              e.preventDefault();
              
              const platform = document.getElementById('platform').value;
              const accountId = document.getElementById('accountId').value;
              const days = document.getElementById('days').value;

              if (!platform || !accountId) {
                alert('Please fill in all required fields');
                return;
              }

              await analyzeAccount(platform, accountId, days);
            });
          }

          async function analyzeAccount(platform, accountId, days) {
            try {
              const response = await fetch(\`/api/analyze/\${platform}\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  [platform === 'youtube' ? 'channelId' : 'username']: accountId, 
                  days: parseInt(days) 
                })
              });

              if (!response.ok) {
                throw new Error('Analysis failed');
              }

              const analysis = await response.json();
              displayResults(analysis);
            } catch (error) {
              console.error('Analysis error:', error);
              alert('Analysis failed: ' + error.message);
            }
          }

          function displayResults(analysis) {
            const resultsCard = document.getElementById('resultsCard');
            const resultsDiv = document.getElementById('results');

            resultsDiv.innerHTML = \`
              <div style="margin-bottom: 20px;">
                <h4>\${analysis.overview.channelName || analysis.overview.username}</h4>
                <p><strong>Platform:</strong> \${analysis.platform}</p>
                <p><strong>Analysis Date:</strong> \${new Date(analysis.analysisDate).toLocaleDateString()}</p>
              </div>

              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                <div class="card">
                  <h5>Performance Score</h5>
                  <div class="metric-value">\${(analysis.performanceMetrics.performanceScore * 100).toFixed(1)}%</div>
                </div>
                <div class="card">
                  <h5>Engagement Rate</h5>
                  <div class="metric-value">\${(analysis.performanceMetrics.engagementRate * 100).toFixed(2)}%</div>
                </div>
                <div class="card">
                  <h5>Issues Found</h5>
                  <div class="metric-value">\${analysis.issues.length}</div>
                </div>
                <div class="card">
                  <h5>Recommendations</h5>
                  <div class="metric-value">\${analysis.optimizationRecommendations.length}</div>
                </div>
              </div>

              <div style="margin-bottom: 20px;">
                <h5>🔧 Optimization Recommendations</h5>
                <div style="max-height: 300px; overflow-y: auto;">
                  \${analysis.optimizationRecommendations.map(rec => \`
                    <div style="border-left: 4px solid \${rec.priority === 'high' ? '#dc3545' : rec.priority === 'medium' ? '#ffc107' : '#28a745'}; padding-left: 15px; margin-bottom: 15px;">
                      <h6>\${rec.title}</h6>
                      <p>\${rec.description}</p>
                      <p><strong>Expected Impact:</strong> \${rec.expectedImpact}</p>
                    </div>
                  \`).join('')}
                </div>
              </div>

              <div>
                <h5>⚠️ Issues Identified</h5>
                <div>
                  \${analysis.issues.map(issue => \`
                    <div style="border-left: 4px solid \${issue.severity === 'high' ? '#dc3545' : '#ffc107'}; padding-left: 15px; margin-bottom: 10px;">
                      <h6>\${issue.type.replace(/_/g, ' ').toUpperCase()}</h6>
                      <p>\${issue.description}</p>
                      <p><strong>Impact:</strong> \${issue.impact}</p>
                    </div>
                  \`).join('')}
                </div>
              </div>
            \`;

            resultsCard.style.display = 'block';
            resultsCard.scrollIntoView({ behavior: 'smooth' });
          }
        </script>
      </body>
      </html>
    `);
  }

  serveSearchPage(req, res) {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LyraLytics - Analytics Search</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }
          .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
          .header { background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .search-form { background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
          .form-group { margin-bottom: 15px; }
          .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
          .form-group input, .form-group select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
          .btn { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
          .btn:hover { background: #0056b3; }
          .results { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .result-item { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 5px; }
          .result-item h3 { margin-bottom: 10px; color: #333; }
          .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 10px; }
          .metric { text-align: center; padding: 10px; background: #f8f9fa; border-radius: 5px; }
          .metric-value { font-size: 1.2em; font-weight: bold; color: #007bff; }
          .back-link { display: inline-block; margin-bottom: 20px; color: #007bff; text-decoration: none; }
          .back-link:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <a href="/dashboard" class="back-link">← Back to Dashboard</a>
          
          <div class="header">
            <h1>🔍 LyraLytics - Analytics Search</h1>
            <p>Fast, in-memory search across all social media analytics data powered by Lyra</p>
          </div>

          <div class="search-form">
            <h3>Search Analytics</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Search Query:</label>
                <input type="text" id="searchQuery" placeholder="Enter search terms...">
              </div>
              <div class="form-group">
                <label>Platform:</label>
                <select id="searchPlatform">
                  <option value="combined">All Platforms</option>
                  <option value="youtube">YouTube</option>
                  <option value="tiktok">TikTok</option>
                  <option value="instagram">Instagram</option>
                </select>
              </div>
              <div class="form-group">
                <label>Sort By:</label>
                <select id="sortBy">
                  <option value="performanceScore">Performance Score</option>
                  <option value="engagementRate">Engagement Rate</option>
                  <option value="analysisDate">Analysis Date</option>
                  <option value="followerCount">Follower Count</option>
                </select>
              </div>
              <div class="form-group">
                <label>Sort Order:</label>
                <select id="sortOrder">
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
            <button onclick="performSearch()" class="btn">Search</button>
          </div>

          <div class="results">
            <h3>Search Results</h3>
            <div id="searchResults">
              <p>Enter a search query to begin...</p>
            </div>
          </div>
        </div>

        <script>
          async function performSearch() {
            const query = document.getElementById('searchQuery').value;
            const platform = document.getElementById('searchPlatform').value;
            const sortBy = document.getElementById('sortBy').value;
            const sortOrder = document.getElementById('sortOrder').value;
            const resultsDiv = document.getElementById('searchResults');

            if (!query.trim()) {
              resultsDiv.innerHTML = '<p>Please enter a search query</p>';
              return;
            }

            try {
              const response = await fetch(\`/api/search?query=\${encodeURIComponent(query)}&platform=\${platform}&sortBy=\${sortBy}&sortOrder=\${sortOrder}\`);
              const data = await response.json();

              if (data.hits.length === 0) {
                resultsDiv.innerHTML = '<p>No results found</p>';
                return;
              }

              resultsDiv.innerHTML = \`
                <p><strong>Found \${data.hits.length} results</strong> (Processing time: \${data.processingTime}ms)</p>
                \${data.hits.map(hit => \`
                  <div class="result-item">
                    <h3>\${hit.accountName || hit.channelName || hit.username}</h3>
                    <div class="metrics">
                      <div class="metric">
                        <div class="metric-value">\${hit.platform}</div>
                        <div>Platform</div>
                      </div>
                      <div class="metric">
                        <div class="metric-value">\${(hit.performanceScore * 100).toFixed(1)}%</div>
                        <div>Performance</div>
                      </div>
                      <div class="metric">
                        <div class="metric-value">\${(hit.engagementRate * 100).toFixed(2)}%</div>
                        <div>Engagement</div>
                      </div>
                      <div class="metric">
                        <div class="metric-value">\${(hit.followerCount || hit.subscriberCount || 0).toLocaleString()}</div>
                        <div>Followers</div>
                      </div>
                    </div>
                    <p><strong>Search Score:</strong> \${hit.score.toFixed(3)}</p>
                    <p><strong>Analysis Date:</strong> \${new Date(hit.analysisDate).toLocaleDateString()}</p>
                  </div>
                \`).join('')}
              \`;

            } catch (error) {
              console.error('Search error:', error);
              resultsDiv.innerHTML = '<p>Search failed</p>';
            }
          }
        </script>
      </body>
      </html>
    `);
  }

  serveAnalyticsPage(req, res) {
    const { platform, id } = req.params;
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LyraLytics - Analytics - ${platform} - ${id}</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
          /* Same styles as dashboard */
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 LyraLytics - ${platform.toUpperCase()} Analytics - ${id}</h1>
            <a href="/dashboard" class="btn">← Back to Dashboard</a>
          </div>
          <div id="analytics-content">Loading...</div>
        </div>
        <script>
          // Load specific analytics data
          loadAnalytics('${platform}', '${id}');
        </script>
      </body>
      </html>
    `);
  }

  calculateTrends(rows, platform) {
    // Calculate trends from historical data
    const trends = {
      engagement: [],
      growth: [],
      performance: []
    };

    rows.forEach(row => {
      const date = new Date(row.analysisDate);
      trends.engagement.push({
        date: date.toISOString().split('T')[0],
        value: row.performanceMetrics.engagementRate
      });
    });

    return trends;
  }

  generateComparisonData(comparisons) {
    // Generate comparison data between accounts
    return {
      accounts: comparisons,
      metrics: {
        engagement: comparisons.map(c => ({
          platform: c.platform,
          id: c.id,
          value: c.analysis.performanceMetrics.engagementRate
        })),
        performance: comparisons.map(c => ({
          platform: c.platform,
          id: c.id,
          value: c.analysis.performanceMetrics.performanceScore
        }))
      }
    };
  }

  errorHandler(err, req, res, next) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }

  start() {
    const port = process.env.DASHBOARD_PORT || 3000;
    const host = process.env.DASHBOARD_HOST || 'localhost';
    
    this.app.listen(port, host, () => {
      console.log(`🚀 LyraLytics Dashboard running at http://${host}:${port}`);
      console.log(`📊 Health check: http://${host}:${port}/health`);
      console.log(`🔍 Search page: http://${host}:${port}/search`);
    });
  }
}

module.exports = AnalyticsDashboard; 