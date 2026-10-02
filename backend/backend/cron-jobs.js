const cron = require('node-cron');
const moment = require('moment');
const fs = require('fs').promises;
const path = require('path');
const nodemailer = require('nodemailer');
const _ = require('lodash');
require('dotenv').config();

// Import our analytics modules
const YouTubeTrending = require('./youtube-trending');
const TrendingAPIs = require('./trending-apis');
const InstagramGraphAPI = require('./instagram-graph-api');
const SocialMediaAnalytics = require('./social-analytics');
const GoogleCloudConsole = require('./google-cloud');

class CronJobManager {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
    this.logFile = path.join(__dirname, 'logs', 'cron-jobs.log');
    this.reportsDir = path.join(__dirname, 'reports');
    
    // Initialize analytics modules
    this.youtubeTrending = new YouTubeTrending();
    this.trendingAPIs = new TrendingAPIs();
    this.instagramGraph = new InstagramGraphAPI();
    this.socialAnalytics = new SocialMediaAnalytics();
    this.gcp = new GoogleCloudConsole();
    
    // Email transporter for notifications
    this.emailTransporter = this.createEmailTransporter();
    
    // Ensure logs and reports directories exist
    this.ensureDirectories();
  }

  async ensureDirectories() {
    try {
      await fs.mkdir(path.dirname(this.logFile), { recursive: true });
      await fs.mkdir(this.reportsDir, { recursive: true });
    } catch (error) {
      console.error('Error creating directories:', error);
    }
  }

  createEmailTransporter() {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('⚠️ Email configuration not found. Email notifications disabled.');
      return null;
    }

    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async log(message, level = 'INFO') {
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;
    
    try {
      await fs.appendFile(this.logFile, logEntry);
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
    
    console.log(`[${level}] ${message}`);
  }

  async sendEmailNotification(subject, content, recipients = null) {
    if (!this.emailTransporter || !process.env.NOTIFICATION_EMAIL) {
      return;
    }

    try {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: recipients || process.env.NOTIFICATION_EMAIL,
        subject: `LyraLytics - ${subject}`,
        html: content
      };

      await this.emailTransporter.sendMail(mailOptions);
      await this.log(`Email notification sent: ${subject}`);
    } catch (error) {
      await this.log(`Failed to send email notification: ${error.message}`, 'ERROR');
    }
  }

  // ===== REAL-TIME TRENDING DATA COLLECTION =====
  async scheduleRealTimeTrendingJob() {
    const jobName = 'real-time-trending';
    const schedule = process.env.REAL_TIME_TRENDING_SCHEDULE || '*/3 * * * *'; // Every 3 minutes
    
    const job = cron.schedule(schedule, async () => {
      await this.log(`Starting real-time trending data collection job`);
      
      try {
        const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
        const results = {
          timestamp: timestamp,
          collection_time: new Date().toISOString(),
          platforms: {}
        };
        
        // Collect Google Trends data
        try {
          await this.trendingAPIs.initialize();
          const googleTrends = await this.trendingAPIs.getGoogleTrends('US', 10);
          results.platforms.google_trends = googleTrends;
          await this.log(`Google Trends data collected: ${googleTrends.trends?.length || 0} trends`);
        } catch (error) {
          await this.log(`Failed to get Google Trends: ${error.message}`, 'ERROR');
          results.platforms.google_trends = { error: error.message };
        }
        
        // Collect YouTube trending data
        try {
          await this.youtubeTrending.initialize();
          const youtubeTrending = await this.youtubeTrending.getTrendingVideos('US', null, 10);
          results.platforms.youtube = youtubeTrending;
          await this.log(`YouTube trending data collected: ${youtubeTrending.count || 0} videos`);
        } catch (error) {
          await this.log(`Failed to get YouTube trending: ${error.message}`, 'ERROR');
          results.platforms.youtube = { error: error.message };
        } finally {
          await this.youtubeTrending.close();
        }
        
        // Collect TikTok trending data
        try {
          const tiktokTrending = await this.trendingAPIs.getTikTokTrending('US', 10);
          results.platforms.tiktok = tiktokTrending;
          await this.log(`TikTok trending data collected: ${tiktokTrending.videos?.length || 0} videos`);
        } catch (error) {
          await this.log(`Failed to get TikTok trending: ${error.message}`, 'ERROR');
          results.platforms.tiktok = { error: error.message };
        }
        
        // Collect Instagram trending data
        try {
          await this.instagramGraph.initialize();
          const instagramTrending = await this.instagramGraph.getTrendingHashtags(10);
          results.platforms.instagram = instagramTrending;
          await this.log(`Instagram trending data collected: ${instagramTrending.length || 0} hashtags`);
        } catch (error) {
          await this.log(`Failed to get Instagram trending: ${error.message}`, 'ERROR');
          results.platforms.instagram = { error: error.message };
        }
        
        // Collect X (Twitter) trending data
        try {
          const twitterTrending = await this.trendingAPIs.getTwitterTrending('US', 10);
          results.platforms.twitter = twitterTrending;
          await this.log(`X (Twitter) trending data collected: ${twitterTrending.trends?.length || 0} trends`);
        } catch (error) {
          await this.log(`Failed to get X (Twitter) trending: ${error.message}`, 'ERROR');
          results.platforms.twitter = { error: error.message };
        }
        
        // Generate trending insights
        results.insights = this.generateRealTimeTrendingInsights(results.platforms);
        
        // Save results to file with timestamp
        const filename = `real-time-trending-${moment().format('YYYY-MM-DD-HH-mm')}.json`;
        await fs.writeFile(path.join(this.reportsDir, filename), JSON.stringify(results, null, 2));
        
        // Log summary
        const successCount = Object.values(results.platforms).filter(p => !p.error).length;
        await this.log(`Real-time trending job completed: ${successCount}/5 platforms successful`);
        
        // Send notification for significant trends (optional)
        if (this.shouldSendTrendingAlert(results.insights)) {
          const summary = this.generateRealTimeTrendingSummary(results);
          await this.sendEmailNotification('Real-Time Trending Alert', summary);
        }
        
      } catch (error) {
        await this.log(`Real-time trending job failed: ${error.message}`, 'ERROR');
        await this.sendEmailNotification('Real-Time Trending Job Failed', 
          `<p>Error: ${error.message}</p><p>Time: ${moment().format('YYYY-MM-DD HH:mm:ss')}</p>`);
      } finally {
        try {
          await this.trendingAPIs.close();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }, {
      scheduled: false,
      timezone: process.env.TIMEZONE || 'UTC'
    });

    this.jobs.set(jobName, job);
    await this.log(`YouTube trending job scheduled: ${schedule}`);
  }

  generateRealTimeTrendingInsights(platforms) {
    const insights = {
      total_trends: 0,
      platform_summary: {},
      cross_platform_trends: [],
      viral_potential: [],
      content_opportunities: []
    };

    // Analyze each platform
    Object.entries(platforms).forEach(([platform, data]) => {
      if (data && !data.error) {
        let trendCount = 0;
        let topTrends = [];

        switch (platform) {
          case 'google_trends':
            trendCount = data.trends?.length || 0;
            topTrends = data.trends?.slice(0, 5).map(t => ({ term: t.term, score: t.score })) || [];
            break;
          case 'youtube':
            trendCount = data.videos?.length || 0;
            topTrends = data.videos?.slice(0, 5).map(v => ({ 
              title: v.title, 
              views: v.viewCount,
              channel: v.channelTitle 
            })) || [];
            break;
          case 'tiktok':
            trendCount = data.videos?.length || 0;
            topTrends = data.videos?.slice(0, 5).map(v => ({ 
              title: v.title, 
              views: v.viewCount,
              creator: v.creator 
            })) || [];
            break;
          case 'instagram':
            trendCount = data.length || 0;
            topTrends = data.slice(0, 5).map(h => ({ 
              hashtag: h.name, 
              media_count: h.media_count,
              trending_score: h.trending_score 
            })) || [];
            break;
          case 'twitter':
            trendCount = data.trends?.length || 0;
            topTrends = data.trends?.slice(0, 5).map(t => ({ 
              term: t.name, 
              tweet_volume: t.tweet_volume 
            })) || [];
            break;
        }

        insights.platform_summary[platform] = {
          trend_count: trendCount,
          top_trends: topTrends
        };
        insights.total_trends += trendCount;
      }
    });

    // Identify cross-platform trends
    const allTerms = new Set();
    Object.values(insights.platform_summary).forEach(platform => {
      platform.top_trends.forEach(trend => {
        const term = trend.term || trend.title || trend.hashtag;
        if (term) allTerms.add(term.toLowerCase());
      });
    });

    // Find terms that appear on multiple platforms
    Object.entries(insights.platform_summary).forEach(([platform, data]) => {
      data.top_trends.forEach(trend => {
        const term = trend.term || trend.title || trend.hashtag;
        if (term) {
          const termLower = term.toLowerCase();
          const appearances = Array.from(allTerms).filter(t => 
            t.includes(termLower) || termLower.includes(t)
          ).length;
          
          if (appearances > 1) {
            insights.cross_platform_trends.push({
              term: term,
              platforms: [platform],
              viral_potential: appearances
            });
          }
        }
      });
    });

    // Identify viral potential trends
    insights.viral_potential = insights.cross_platform_trends
      .sort((a, b) => b.viral_potential - a.viral_potential)
      .slice(0, 5);

    // Generate content opportunities
    insights.content_opportunities = insights.viral_potential.map(trend => ({
      topic: trend.term,
      platforms: trend.platforms,
      content_types: this.suggestContentTypes(trend.term),
      hashtags: this.suggestHashtags(trend.term)
    }));

    return insights;
  }

  suggestContentTypes(term) {
    const suggestions = [];
    const termLower = term.toLowerCase();
    
    if (termLower.includes('how') || termLower.includes('tutorial')) {
      suggestions.push('Tutorial Video', 'Step-by-Step Guide', 'Educational Content');
    } else if (termLower.includes('review') || termLower.includes('test')) {
      suggestions.push('Product Review', 'Comparison Video', 'Unboxing');
    } else if (termLower.includes('news') || termLower.includes('update')) {
      suggestions.push('News Update', 'Breaking News', 'Analysis Video');
    } else {
      suggestions.push('General Content', 'Trending Topic Video', 'Discussion');
    }
    
    return suggestions;
  }

  suggestHashtags(term) {
    const hashtags = [];
    const termLower = term.toLowerCase();
    
    // Add the term itself as a hashtag
    hashtags.push(`#${term.replace(/\s+/g, '')}`);
    
    // Add related hashtags based on the term
    if (termLower.includes('trending')) hashtags.push('#trending', '#viral');
    if (termLower.includes('news')) hashtags.push('#news', '#breaking');
    if (termLower.includes('how')) hashtags.push('#howto', '#tutorial');
    if (termLower.includes('review')) hashtags.push('#review', '#product');
    
    return hashtags.slice(0, 5);
  }

  shouldSendTrendingAlert(insights) {
    // Send alert if there are significant cross-platform trends
    return insights.cross_platform_trends.length > 0 || 
           insights.viral_potential.length > 0 ||
           insights.total_trends > 20;
  }

  generateRealTimeTrendingSummary(results) {
    let summary = '<h2>Real-Time Trending Alert</h2>';
    summary += `<p><strong>Generated:</strong> ${results.timestamp}</p>`;
    summary += `<p><strong>Total Trends Collected:</strong> ${results.insights.total_trends}</p>`;
    
    // Platform summary
    summary += '<h3>Platform Summary</h3>';
    Object.entries(results.insights.platform_summary).forEach(([platform, data]) => {
      summary += `<h4>${platform.replace('_', ' ').toUpperCase()}</h4>`;
      summary += `<p>Trends: ${data.trend_count}</p>`;
      if (data.top_trends.length > 0) {
        summary += '<ul>';
        data.top_trends.slice(0, 3).forEach(trend => {
          const display = trend.term || trend.title || trend.hashtag;
          summary += `<li>${display}</li>`;
        });
        summary += '</ul>';
      }
    });
    
    // Cross-platform trends
    if (results.insights.cross_platform_trends.length > 0) {
      summary += '<h3>🔥 Cross-Platform Trends</h3>';
      summary += '<ul>';
      results.insights.cross_platform_trends.slice(0, 5).forEach(trend => {
        summary += `<li><strong>${trend.term}</strong> - Viral Potential: ${trend.viral_potential}</li>`;
      });
      summary += '</ul>';
    }
    
    // Content opportunities
    if (results.insights.content_opportunities.length > 0) {
      summary += '<h3>💡 Content Opportunities</h3>';
      summary += '<ul>';
      results.insights.content_opportunities.slice(0, 3).forEach(opp => {
        summary += `<li><strong>${opp.topic}</strong> - ${opp.content_types.join(', ')}</li>`;
      });
      summary += '</ul>';
    }
    
    return summary;
  }

  generateYouTubeTrendingSummary(results) {
    let summary = '<h2>YouTube Trending Report</h2>';
    summary += `<p><strong>Generated:</strong> ${moment().format('YYYY-MM-DD HH:mm:ss')}</p>`;
    
    Object.entries(results).forEach(([region, data]) => {
      if (data && data.videos) {
        summary += `<h3>${region} Trending (${data.count} videos)</h3>`;
        summary += '<ul>';
        data.videos.slice(0, 5).forEach(video => {
          summary += `<li><strong>${video.title}</strong> - ${video.channelTitle} (${parseInt(video.viewCount || 0).toLocaleString()} views)</li>`;
        });
        summary += '</ul>';
      }
    });
    
    return summary;
  }

  // ===== MULTI-PLATFORM TRENDING JOBS =====
  async scheduleMultiPlatformTrendingJob() {
    const jobName = 'multi-platform-trending';
    const schedule = process.env.MULTI_PLATFORM_TRENDING_SCHEDULE || '0 */4 * * *'; // Every 4 hours
    
    const job = cron.schedule(schedule, async () => {
      await this.log(`Starting multi-platform trending analysis job`);
      
      try {
        await this.trendingAPIs.initialize();
        
        // Get trending data from all platforms
        const platforms = ['youtube', 'tiktok', 'instagram', 'twitter', 'google'];
        const results = {};
        
        for (const platform of platforms) {
          try {
            switch (platform) {
              case 'youtube':
                results.youtube = await this.trendingAPIs.getYouTubeTrending('US', 15);
                break;
              case 'tiktok':
                results.tiktok = await this.trendingAPIs.getTikTokTrending('US', 15);
                break;
              case 'instagram':
                results.instagram = await this.trendingAPIs.getInstagramTrending('US', 15);
                break;
              case 'twitter':
                results.twitter = await this.trendingAPIs.getTwitterTrending('US', 15);
                break;
              case 'google':
                results.google = await this.trendingAPIs.getGoogleTrends('US', 15);
                break;
            }
            await this.log(`Multi-platform trending data collected for ${platform}`);
          } catch (error) {
            await this.log(`Failed to get ${platform} trending: ${error.message}`, 'ERROR');
          }
        }
        
        // Save results to file
        const filename = `multi-platform-trending-${moment().format('YYYY-MM-DD-HH')}.json`;
        await fs.writeFile(path.join(this.reportsDir, filename), JSON.stringify(results, null, 2));
        
        // Generate summary
        const summary = this.generateMultiPlatformTrendingSummary(results);
        await this.sendEmailNotification('Multi-Platform Trending Report', summary);
        
        await this.log(`Multi-platform trending job completed successfully`);
        
      } catch (error) {
        await this.log(`Multi-platform trending job failed: ${error.message}`, 'ERROR');
        await this.sendEmailNotification('Multi-Platform Trending Job Failed', 
          `<p>Error: ${error.message}</p><p>Time: ${moment().format('YYYY-MM-DD HH:mm:ss')}</p>`);
      } finally {
        await this.trendingAPIs.close();
      }
    }, {
      scheduled: false,
      timezone: process.env.TIMEZONE || 'UTC'
    });

    this.jobs.set(jobName, job);
    await this.log(`Multi-platform trending job scheduled: ${schedule}`);
  }

  generateMultiPlatformTrendingSummary(results) {
    let summary = '<h2>Multi-Platform Trending Report</h2>';
    summary += `<p><strong>Generated:</strong> ${moment().format('YYYY-MM-DD HH:mm:ss')}</p>`;
    
    Object.entries(results).forEach(([platform, data]) => {
      if (data && data.videos) {
        summary += `<h3>${platform.toUpperCase()} Trending (${data.count} items)</h3>`;
        summary += '<ul>';
        data.videos.slice(0, 5).forEach(item => {
          summary += `<li><strong>${item.title}</strong> - ${item.channelTitle || 'N/A'} (${item.viewCount || 'N/A'})</li>`;
        });
        summary += '</ul>';
      }
    });
    
    return summary;
  }

  // ===== INSTAGRAM GRAPH API JOBS =====
  async scheduleInstagramAnalysisJob() {
    const jobName = 'instagram-analysis';
    const schedule = process.env.INSTAGRAM_ANALYSIS_SCHEDULE || '0 */8 * * *'; // Every 8 hours
    
    const job = cron.schedule(schedule, async () => {
      await this.log(`Starting Instagram analysis job`);
      
      try {
        await this.instagramGraph.initialize();
        
        // Get comprehensive Instagram analysis
        const analysis = await this.instagramGraph.getTrendingAnalysis(30);
        
        // Save results to file
        const filename = `instagram-analysis-${moment().format('YYYY-MM-DD-HH')}.json`;
        await fs.writeFile(path.join(this.reportsDir, filename), JSON.stringify(analysis, null, 2));
        
        // Generate summary
        const summary = this.generateInstagramAnalysisSummary(analysis);
        await this.sendEmailNotification('Instagram Analysis Report', summary);
        
        await this.log(`Instagram analysis job completed successfully`);
        
      } catch (error) {
        await this.log(`Instagram analysis job failed: ${error.message}`, 'ERROR');
        await this.sendEmailNotification('Instagram Analysis Job Failed', 
          `<p>Error: ${error.message}</p><p>Time: ${moment().format('YYYY-MM-DD HH:mm:ss')}</p>`);
      }
    }, {
      scheduled: false,
      timezone: process.env.TIMEZONE || 'UTC'
    });

    this.jobs.set(jobName, job);
    await this.log(`Instagram analysis job scheduled: ${schedule}`);
  }

  generateInstagramAnalysisSummary(analysis) {
    let summary = '<h2>Instagram Analysis Report</h2>';
    summary += `<p><strong>Generated:</strong> ${moment().format('YYYY-MM-DD HH:mm:ss')}</p>`;
    summary += `<p><strong>Business Account:</strong> ${analysis.business_account?.name || 'N/A'}</p>`;
    summary += `<p><strong>Trending Hashtags Found:</strong> ${analysis.trending_hashtags?.length || 0}</p>`;
    
    if (analysis.hashtag_analysis) {
      const hashtagAnalysis = analysis.hashtag_analysis;
      summary += `<h3>Hashtag Analysis</h3>`;
      summary += `<p><strong>Total Hashtags:</strong> ${hashtagAnalysis.total_hashtags}</p>`;
      summary += `<p><strong>Average Media Count:</strong> ${hashtagAnalysis.average_media_count?.toLocaleString()}</p>`;
      
      if (hashtagAnalysis.top_performing_hashtags) {
        summary += `<h4>Top Performing Hashtags:</h4><ul>`;
        hashtagAnalysis.top_performing_hashtags.slice(0, 5).forEach(hashtag => {
          summary += `<li>${hashtag.name} - ${hashtag.media_count?.toLocaleString()} posts</li>`;
        });
        summary += '</ul>';
      }
    }
    
    if (analysis.recommendations) {
      const recs = analysis.recommendations;
      summary += `<h3>Recommendations</h3>`;
      summary += `<h4>Hashtag Strategy:</h4><ul>`;
      recs.hashtag_strategy?.slice(0, 3).forEach(rec => {
        summary += `<li>${rec}</li>`;
      });
      summary += '</ul>';
    }
    
    return summary;
  }

  // ===== SOCIAL MEDIA ANALYTICS JOBS =====
  async scheduleSocialMediaAnalyticsJob() {
    const jobName = 'social-media-analytics';
    const schedule = process.env.SOCIAL_MEDIA_ANALYTICS_SCHEDULE || '0 2 * * *'; // Daily at 2 AM
    
    const job = cron.schedule(schedule, async () => {
      await this.log(`Starting social media analytics job`);
      
      try {
        // Get channel IDs from environment or configuration
        const channels = this.getChannelIds();
        const results = {};
        
        for (const [platform, channelId] of Object.entries(channels)) {
          if (channelId) {
            try {
              switch (platform) {
                case 'youtube':
                  results.youtube = await this.socialAnalytics.analyzeYouTubeChannel(channelId, 30);
                  break;
                case 'tiktok':
                  results.tiktok = await this.socialAnalytics.analyzeTikTokAccount(channelId, 30);
                  break;
                case 'instagram':
                  results.instagram = await this.socialAnalytics.analyzeInstagramAccount(channelId, 30);
                  break;
              }
              await this.log(`Social media analytics completed for ${platform}`);
            } catch (error) {
              await this.log(`Failed to analyze ${platform}: ${error.message}`, 'ERROR');
            }
          }
        }
        
        // Save results to file
        const filename = `social-media-analytics-${moment().format('YYYY-MM-DD')}.json`;
        await fs.writeFile(path.join(this.reportsDir, filename), JSON.stringify(results, null, 2));
        
        // Generate summary
        const summary = this.generateSocialMediaAnalyticsSummary(results);
        await this.sendEmailNotification('Social Media Analytics Report', summary);
        
        await this.log(`Social media analytics job completed successfully`);
        
      } catch (error) {
        await this.log(`Social media analytics job failed: ${error.message}`, 'ERROR');
        await this.sendEmailNotification('Social Media Analytics Job Failed', 
          `<p>Error: ${error.message}</p><p>Time: ${moment().format('YYYY-MM-DD HH:mm:ss')}</p>`);
      }
    }, {
      scheduled: false,
      timezone: process.env.TIMEZONE || 'UTC'
    });

    this.jobs.set(jobName, job);
    await this.log(`Social media analytics job scheduled: ${schedule}`);
  }

  getChannelIds() {
    return {
      youtube: process.env.YOUTUBE_CHANNEL_ID,
      tiktok: process.env.TIKTOK_USERNAME,
      instagram: process.env.INSTAGRAM_USERNAME
    };
  }

  generateSocialMediaAnalyticsSummary(results) {
    let summary = '<h2>Social Media Analytics Report</h2>';
    summary += `<p><strong>Generated:</strong> ${moment().format('YYYY-MM-DD HH:mm:ss')}</p>`;
    
    Object.entries(results).forEach(([platform, data]) => {
      if (data) {
        summary += `<h3>${platform.toUpperCase()} Analytics</h3>`;
        summary += `<p><strong>Channel:</strong> ${data.channelInfo?.title || 'N/A'}</p>`;
        summary += `<p><strong>Subscribers/Followers:</strong> ${data.channelInfo?.subscriberCount?.toLocaleString() || 'N/A'}</p>`;
        summary += `<p><strong>Total Views:</strong> ${data.channelInfo?.viewCount?.toLocaleString() || 'N/A'}</p>`;
        
        if (data.recommendations) {
          summary += `<h4>Recommendations:</h4><ul>`;
          data.recommendations.slice(0, 3).forEach(rec => {
            summary += `<li>${rec}</li>`;
          });
          summary += '</ul>';
        }
      }
    });
    
    return summary;
  }

  // ===== DATA CLEANUP JOBS =====
  async scheduleDataCleanupJob() {
    const jobName = 'data-cleanup';
    const schedule = process.env.DATA_CLEANUP_SCHEDULE || '0 3 * * 0'; // Weekly on Sunday at 3 AM
    
    const job = cron.schedule(schedule, async () => {
      await this.log(`Starting data cleanup job`);
      
      try {
        const retentionDays = parseInt(process.env.DATA_RETENTION_DAYS) || 30;
        const cutoffDate = moment().subtract(retentionDays, 'days');
        
        // Clean up old report files
        const files = await fs.readdir(this.reportsDir);
        let deletedCount = 0;
        
        for (const file of files) {
          const filePath = path.join(this.reportsDir, file);
          const stats = await fs.stat(filePath);
          
          if (moment(stats.mtime).isBefore(cutoffDate)) {
            await fs.unlink(filePath);
            deletedCount++;
          }
        }
        
        await this.log(`Data cleanup completed: ${deletedCount} old files deleted`);
        
        // Clean up old log entries (keep last 1000 lines)
        const logContent = await fs.readFile(this.logFile, 'utf8');
        const logLines = logContent.split('\n');
        if (logLines.length > 1000) {
          const recentLines = logLines.slice(-1000);
          await fs.writeFile(this.logFile, recentLines.join('\n'));
          await this.log(`Log cleanup completed: kept last 1000 lines`);
        }
        
      } catch (error) {
        await this.log(`Data cleanup job failed: ${error.message}`, 'ERROR');
      }
    }, {
      scheduled: false,
      timezone: process.env.TIMEZONE || 'UTC'
    });

    this.jobs.set(jobName, job);
    await this.log(`Data cleanup job scheduled: ${schedule}`);
  }

  // ===== HEALTH CHECK JOBS =====
  async scheduleHealthCheckJob() {
    const jobName = 'health-check';
    const schedule = process.env.HEALTH_CHECK_SCHEDULE || '*/30 * * * *'; // Every 30 minutes
    
    const job = cron.schedule(schedule, async () => {
      await this.log(`Starting health check job`);
      
      try {
        const healthChecks = [];
        
        // Check YouTube API
        try {
          await this.youtubeTrending.initialize();
          healthChecks.push({ service: 'YouTube API', status: 'OK' });
          await this.youtubeTrending.close();
        } catch (error) {
          healthChecks.push({ service: 'YouTube API', status: 'ERROR', error: error.message });
        }
        
        // Check Google Cloud
        try {
          await this.gcp.healthCheck();
          healthChecks.push({ service: 'Google Cloud', status: 'OK' });
        } catch (error) {
          healthChecks.push({ service: 'Google Cloud', status: 'ERROR', error: error.message });
        }
        
        // Check file system
        try {
          await fs.access(this.reportsDir);
          healthChecks.push({ service: 'File System', status: 'OK' });
        } catch (error) {
          healthChecks.push({ service: 'File System', status: 'ERROR', error: error.message });
        }
        
        // Log health check results
        const failedChecks = healthChecks.filter(check => check.status === 'ERROR');
        if (failedChecks.length > 0) {
          await this.log(`Health check found ${failedChecks.length} failed services`, 'WARN');
          await this.sendEmailNotification('Health Check Alert', 
            `<h2>Health Check Alert</h2><p>The following services are experiencing issues:</p><ul>${
              failedChecks.map(check => `<li>${check.service}: ${check.error}</li>`).join('')
            }</ul>`);
        } else {
          await this.log(`Health check completed: all services OK`);
        }
        
      } catch (error) {
        await this.log(`Health check job failed: ${error.message}`, 'ERROR');
      }
    }, {
      scheduled: false,
      timezone: process.env.TIMEZONE || 'UTC'
    });

    this.jobs.set(jobName, job);
    await this.log(`Health check job scheduled: ${schedule}`);
  }

  // ===== JOB MANAGEMENT =====
  async startAllJobs() {
    if (this.isRunning) {
      await this.log('Cron jobs are already running');
      return;
    }

    await this.log('Starting all cron jobs...');
    
    try {
      await this.scheduleRealTimeTrendingJob();
      await this.scheduleMultiPlatformTrendingJob();
      await this.scheduleInstagramAnalysisJob();
      await this.scheduleSocialMediaAnalyticsJob();
      await this.scheduleDataCleanupJob();
      await this.scheduleHealthCheckJob();
      
      // Start all jobs
      for (const [name, job] of this.jobs) {
        job.start();
        await this.log(`Started job: ${name}`);
      }
      
      this.isRunning = true;
      await this.log('All cron jobs started successfully');
      
      // Send startup notification
      await this.sendEmailNotification('Cron Jobs Started', 
        `<h2>Cron Jobs Started Successfully</h2><p>All scheduled jobs are now running.</p><p>Time: ${moment().format('YYYY-MM-DD HH:mm:ss')}</p>`);
      
    } catch (error) {
      await this.log(`Failed to start cron jobs: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  async stopAllJobs() {
    if (!this.isRunning) {
      await this.log('No cron jobs are currently running');
      return;
    }

    await this.log('Stopping all cron jobs...');
    
    for (const [name, job] of this.jobs) {
      job.stop();
      await this.log(`Stopped job: ${name}`);
    }
    
    this.isRunning = false;
    await this.log('All cron jobs stopped successfully');
  }

  async getJobStatus() {
    const status = {
      isRunning: this.isRunning,
      jobs: []
    };
    
    for (const [name, job] of this.jobs) {
      status.jobs.push({
        name,
        running: job.running,
        nextDate: job.nextDate()
      });
    }
    
    return status;
  }

  async listScheduledJobs() {
    const jobs = [];
    
    for (const [name, job] of this.jobs) {
      jobs.push({
        name,
        schedule: job.cronTime.source,
        running: job.running,
        nextRun: job.nextDate()
      });
    }
    
    return jobs;
  }

  async runJobManually(jobName) {
    if (!this.jobs.has(jobName)) {
      throw new Error(`Job '${jobName}' not found`);
    }
    
    await this.log(`Running job manually: ${jobName}`);
    
    const job = this.jobs.get(jobName);
    job.fireOnTick();
    
    await this.log(`Manual job execution triggered: ${jobName}`);
  }
}

module.exports = CronJobManager; 