const axios = require('axios');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const moment = require('moment');
const _ = require('lodash');
require('dotenv').config();

class TrendingAPIs {
  constructor() {
    this.browser = null;
    this.apiKeys = {
      rapidapi: process.env.RAPIDAPI_KEY,
      socialblade: process.env.SOCIALBLADE_API_KEY,
      trends24: process.env.TRENDS24_API_KEY,
      googleTrends: process.env.GOOGLE_TRENDS_API_KEY,
      twitterBearer: process.env.TWITTER_BEARER_TOKEN,
      instagramToken: process.env.INSTAGRAM_ACCESS_TOKEN
    };
    
    this.baseUrls = {
      rapidapi: 'https://rapidapi.com',
      socialblade: 'https://api.socialblade.com',
      trends24: 'https://trends24.in',
      googleTrends: 'https://trends.google.com',
      youtube: 'https://www.youtube.com',
      tiktok: 'https://www.tiktok.com',
      instagram: 'https://www.instagram.com',
      twitter: 'https://twitter.com'
    };
  }

  async initialize() {
    console.log('🚀 Initializing Trending APIs...');
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
      });
      console.log('✅ Trending APIs initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Trending APIs:', error);
    }
  }

  // ===== YOUTUBE TRENDING =====
  async getYouTubeTrending(region = 'US', maxResults = 50) {
    console.log(`📈 Fetching YouTube trending for region: ${region}`);
    
    try {
      // Try multiple sources
      const sources = [
        () => this.scrapeYouTubeTrending(region, maxResults),
        () => this.getYouTubeTrendingViaRapidAPI(region, maxResults),
        () => this.getYouTubeTrendingViaSocialBlade(region, maxResults)
      ];

      for (const source of sources) {
        try {
          const result = await source();
          if (result && result.length > 0) {
            return {
              platform: 'youtube',
              region,
              count: result.length,
              videos: result,
              source: 'api/scraping',
              timestamp: new Date().toISOString()
            };
          }
        } catch (error) {
          console.log(`Source failed: ${error.message}`);
          continue;
        }
      }

      throw new Error('All YouTube trending sources failed');
    } catch (error) {
      throw new Error(`YouTube trending failed: ${error.message}`);
    }
  }

  async scrapeYouTubeTrending(region = 'US', maxResults = 50) {
    if (!this.browser) throw new Error('Browser not initialized');

    const page = await this.browser.newPage();
    
    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      await page.setViewport({ width: 1920, height: 1080 });
      
      // Navigate to YouTube trending
      const url = `https://www.youtube.com/feed/trending?gl=${region}`;
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for content to load
      await page.waitForSelector('#content', { timeout: 15000 });
      
      // Scroll to load more content
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
      });
      await page.waitForTimeout(2000);

      const videos = await page.evaluate((maxResults) => {
        const videoElements = document.querySelectorAll('#content ytd-video-renderer, #content ytd-rich-grid-media');
        const videos = [];
        
        for (let i = 0; i < Math.min(videoElements.length, maxResults); i++) {
          const element = videoElements[i];
          
          try {
            const titleElement = element.querySelector('#video-title, #video-title-link');
            const channelElement = element.querySelector('#channel-name, #channel-name a');
            const viewsElement = element.querySelector('#metadata-line, #metadata');
            const thumbnailElement = element.querySelector('#thumbnail img, #img');
            const durationElement = element.querySelector('#text, .ytd-thumbnail-overlay-time-status-renderer');
            const linkElement = element.querySelector('#video-title-link, a#thumbnail');
            
            if (titleElement && channelElement) {
              const title = titleElement.textContent.trim();
              const channel = channelElement.textContent.trim();
              const views = viewsElement ? viewsElement.textContent.trim() : 'Unknown views';
              const thumbnail = thumbnailElement ? thumbnailElement.src : '';
              const duration = durationElement ? durationElement.textContent.trim() : '';
              const videoId = linkElement ? this.extractVideoId(linkElement.href) : '';
              
              videos.push({
                id: videoId,
                title,
                channelTitle: channel,
                viewCount: views,
                thumbnail,
                duration,
                publishedAt: new Date().toISOString(),
                platform: 'youtube',
                trending: true
              });
            }
          } catch (error) {
            console.log('Error extracting video data:', error);
          }
        }
        
        return videos;
      }, maxResults);
      
      return videos;
    } catch (error) {
      throw new Error(`YouTube scraping failed: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  async getYouTubeTrendingViaRapidAPI(region = 'US', maxResults = 50) {
    if (!this.apiKeys.rapidapi) {
      throw new Error('RapidAPI key not configured');
    }

    try {
      const response = await axios.get('https://youtube-trending.p.rapidapi.com/trending', {
        headers: {
          'X-RapidAPI-Key': this.apiKeys.rapidapi,
          'X-RapidAPI-Host': 'youtube-trending.p.rapidapi.com'
        },
        params: {
          region: region,
          limit: maxResults
        }
      });

      if (response.data && response.data.data) {
        return response.data.data.map(video => ({
          id: video.videoId,
          title: video.title,
          channelTitle: video.channelTitle,
          viewCount: video.viewCount,
          thumbnail: video.thumbnail,
          duration: video.duration,
          publishedAt: video.publishedAt,
          platform: 'youtube',
          trending: true
        }));
      }

      return [];
    } catch (error) {
      throw new Error(`RapidAPI YouTube trending failed: ${error.message}`);
    }
  }

  async getYouTubeTrendingViaSocialBlade(region = 'US', maxResults = 50) {
    if (!this.apiKeys.socialblade) {
      throw new Error('SocialBlade API key not configured');
    }

    try {
      const response = await axios.get(`${this.baseUrls.socialblade}/youtube/trending`, {
        headers: {
          'Authorization': `Bearer ${this.apiKeys.socialblade}`,
          'Content-Type': 'application/json'
        },
        params: {
          region: region,
          limit: maxResults
        }
      });

      if (response.data && response.data.videos) {
        return response.data.videos.map(video => ({
          id: video.video_id,
          title: video.title,
          channelTitle: video.channel_name,
          viewCount: video.views,
          thumbnail: video.thumbnail,
          duration: video.duration,
          publishedAt: video.upload_date,
          platform: 'youtube',
          trending: true
        }));
      }

      return [];
    } catch (error) {
      throw new Error(`SocialBlade YouTube trending failed: ${error.message}`);
    }
  }

  // ===== TIKTOK TRENDING =====
  async getTikTokTrending(region = 'US', maxResults = 50) {
    console.log(`📱 Fetching TikTok trending for region: ${region}`);
    
    try {
      const sources = [
        () => this.scrapeTikTokTrending(region, maxResults),
        () => this.getTikTokTrendingViaRapidAPI(region, maxResults),
        () => this.getTikTokHashtags(region, maxResults)
      ];

      for (const source of sources) {
        try {
          const result = await source();
          if (result && result.length > 0) {
            return {
              platform: 'tiktok',
              region,
              count: result.length,
              videos: result,
              source: 'api/scraping',
              timestamp: new Date().toISOString()
            };
          }
        } catch (error) {
          console.log(`TikTok source failed: ${error.message}`);
          continue;
        }
      }

      throw new Error('All TikTok trending sources failed');
    } catch (error) {
      throw new Error(`TikTok trending failed: ${error.message}`);
    }
  }

  async scrapeTikTokTrending(region = 'US', maxResults = 50) {
    if (!this.browser) throw new Error('Browser not initialized');

    const page = await this.browser.newPage();
    
    try {
      await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15');
      await page.setViewport({ width: 375, height: 812 });
      
      // Navigate to TikTok trending
      const url = `https://www.tiktok.com/foryou`;
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for content to load
      await page.waitForSelector('[data-e2e="feed-item"]', { timeout: 15000 });
      
      // Scroll to load more content
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
      });
      await page.waitForTimeout(3000);

      const videos = await page.evaluate((maxResults) => {
        const videoElements = document.querySelectorAll('[data-e2e="feed-item"]');
        const videos = [];
        
        for (let i = 0; i < Math.min(videoElements.length, maxResults); i++) {
          const element = videoElements[i];
          
          try {
            const titleElement = element.querySelector('[data-e2e="video-desc"]');
            const authorElement = element.querySelector('[data-e2e="video-author"]');
            const statsElement = element.querySelector('[data-e2e="video-stats"]');
            const videoElement = element.querySelector('video');
            
            if (titleElement && authorElement) {
              const title = titleElement.textContent.trim();
              const author = authorElement.textContent.trim();
              const stats = statsElement ? statsElement.textContent.trim() : '';
              const videoSrc = videoElement ? videoElement.src : '';
              
              videos.push({
                id: `tiktok_${i}`,
                title,
                channelTitle: author,
                viewCount: stats,
                thumbnail: videoSrc,
                platform: 'tiktok',
                trending: true
              });
            }
          } catch (error) {
            console.log('Error extracting TikTok video data:', error);
          }
        }
        
        return videos;
      }, maxResults);
      
      return videos;
    } catch (error) {
      throw new Error(`TikTok scraping failed: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  async getTikTokTrendingViaRapidAPI(region = 'US', maxResults = 50) {
    if (!this.apiKeys.rapidapi) {
      throw new Error('RapidAPI key not configured');
    }

    try {
      const response = await axios.get('https://tiktok-trending.p.rapidapi.com/trending', {
        headers: {
          'X-RapidAPI-Key': this.apiKeys.rapidapi,
          'X-RapidAPI-Host': 'tiktok-trending.p.rapidapi.com'
        },
        params: {
          region: region,
          limit: maxResults
        }
      });

      if (response.data && response.data.data) {
        return response.data.data.map(video => ({
          id: video.id,
          title: video.desc,
          channelTitle: video.author.nickname,
          viewCount: video.stats.playCount,
          thumbnail: video.video.cover,
          platform: 'tiktok',
          trending: true
        }));
      }

      return [];
    } catch (error) {
      throw new Error(`RapidAPI TikTok trending failed: ${error.message}`);
    }
  }

  async getTikTokHashtags(region = 'US', maxResults = 50) {
    if (!this.browser) throw new Error('Browser not initialized');

    const page = await this.browser.newPage();
    
    try {
      await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15');
      
      // Navigate to TikTok hashtag page
      const url = `https://www.tiktok.com/trending`;
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      await page.waitForSelector('[data-e2e="trending-hashtag"]', { timeout: 15000 });

      const hashtags = await page.evaluate((maxResults) => {
        const hashtagElements = document.querySelectorAll('[data-e2e="trending-hashtag"]');
        const hashtags = [];
        
        for (let i = 0; i < Math.min(hashtagElements.length, maxResults); i++) {
          const element = hashtagElements[i];
          
          try {
            const hashtagElement = element.querySelector('a');
            const countElement = element.querySelector('[data-e2e="hashtag-count"]');
            
            if (hashtagElement) {
              const hashtag = hashtagElement.textContent.trim();
              const count = countElement ? countElement.textContent.trim() : '';
              
              hashtags.push({
                id: `hashtag_${i}`,
                title: `#${hashtag}`,
                channelTitle: 'Trending Hashtag',
                viewCount: count,
                platform: 'tiktok',
                trending: true,
                type: 'hashtag'
              });
            }
          } catch (error) {
            console.log('Error extracting hashtag data:', error);
          }
        }
        
        return hashtags;
      }, maxResults);
      
      return hashtags;
    } catch (error) {
      throw new Error(`TikTok hashtag scraping failed: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  // ===== INSTAGRAM TRENDING =====
  async getInstagramTrending(region = 'US', maxResults = 50) {
    console.log(`📸 Fetching Instagram trending for region: ${region}`);
    
    try {
      const sources = [
        () => this.scrapeInstagramTrending(region, maxResults),
        () => this.getInstagramTrendingViaAPI(region, maxResults),
        () => this.getInstagramHashtags(region, maxResults)
      ];

      for (const source of sources) {
        try {
          const result = await source();
          if (result && result.length > 0) {
            return {
              platform: 'instagram',
              region,
              count: result.length,
              videos: result,
              source: 'api/scraping',
              timestamp: new Date().toISOString()
            };
          }
        } catch (error) {
          console.log(`Instagram source failed: ${error.message}`);
          continue;
        }
      }

      throw new Error('All Instagram trending sources failed');
    } catch (error) {
      throw new Error(`Instagram trending failed: ${error.message}`);
    }
  }

  async scrapeInstagramTrending(region = 'US', maxResults = 50) {
    if (!this.browser) throw new Error('Browser not initialized');

    const page = await this.browser.newPage();
    
    try {
      await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15');
      await page.setViewport({ width: 375, height: 812 });
      
      // Navigate to Instagram explore
      const url = `https://www.instagram.com/explore/`;
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for content to load
      await page.waitForSelector('article', { timeout: 15000 });
      
      // Scroll to load more content
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
      });
      await page.waitForTimeout(3000);

      const posts = await page.evaluate((maxResults) => {
        const postElements = document.querySelectorAll('article img');
        const posts = [];
        
        for (let i = 0; i < Math.min(postElements.length, maxResults); i++) {
          const element = postElements[i];
          
          try {
            const alt = element.alt || '';
            const src = element.src || '';
            const parent = element.closest('article');
            
            if (parent) {
              const likeElement = parent.querySelector('[data-e2e="like-count"]');
              const likes = likeElement ? likeElement.textContent.trim() : '';
              
              posts.push({
                id: `instagram_${i}`,
                title: alt,
                channelTitle: 'Instagram Post',
                viewCount: likes,
                thumbnail: src,
                platform: 'instagram',
                trending: true
              });
            }
          } catch (error) {
            console.log('Error extracting Instagram post data:', error);
          }
        }
        
        return posts;
      }, maxResults);
      
      return posts;
    } catch (error) {
      throw new Error(`Instagram scraping failed: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  async getInstagramTrendingViaAPI(region = 'US', maxResults = 50) {
    if (!this.apiKeys.instagramToken) {
      throw new Error('Instagram access token not configured');
    }

    try {
      const response = await axios.get(`https://graph.instagram.com/v12.0/me/media`, {
        params: {
          access_token: this.apiKeys.instagramToken,
          fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count',
          limit: maxResults
        }
      });

      if (response.data && response.data.data) {
        return response.data.data.map(post => ({
          id: post.id,
          title: post.caption || 'Instagram Post',
          channelTitle: 'Instagram User',
          viewCount: post.like_count || 0,
          thumbnail: post.media_url || post.thumbnail_url,
          platform: 'instagram',
          trending: true
        }));
      }

      return [];
    } catch (error) {
      throw new Error(`Instagram API trending failed: ${error.message}`);
    }
  }

  async getInstagramHashtags(region = 'US', maxResults = 50) {
    if (!this.browser) throw new Error('Browser not initialized');

    const page = await this.browser.newPage();
    
    try {
      await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15');
      
      // Navigate to Instagram trending hashtags
      const url = `https://www.instagram.com/explore/tags/trending/`;
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      await page.waitForSelector('article', { timeout: 15000 });

      const hashtags = await page.evaluate((maxResults) => {
        const hashtagElements = document.querySelectorAll('a[href*="/explore/tags/"]');
        const hashtags = [];
        
        for (let i = 0; i < Math.min(hashtagElements.length, maxResults); i++) {
          const element = hashtagElements[i];
          
          try {
            const hashtag = element.textContent.trim();
            const href = element.href;
            
            if (hashtag && hashtag.startsWith('#')) {
              hashtags.push({
                id: `hashtag_${i}`,
                title: hashtag,
                channelTitle: 'Trending Hashtag',
                viewCount: 'Trending',
                thumbnail: '',
                platform: 'instagram',
                trending: true,
                type: 'hashtag',
                url: href
              });
            }
          } catch (error) {
            console.log('Error extracting Instagram hashtag data:', error);
          }
        }
        
        return hashtags;
      }, maxResults);
      
      return hashtags;
    } catch (error) {
      throw new Error(`Instagram hashtag scraping failed: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  // ===== TWITTER TRENDING =====
  async getTwitterTrending(region = 'US', maxResults = 50) {
    console.log(`🐦 Fetching Twitter trending for region: ${region}`);
    
    try {
      const sources = [
        () => this.scrapeTwitterTrending(region, maxResults),
        () => this.getTwitterTrendingViaAPI(region, maxResults),
        () => this.getTwitterHashtags(region, maxResults)
      ];

      for (const source of sources) {
        try {
          const result = await source();
          if (result && result.length > 0) {
            return {
              platform: 'twitter',
              region,
              count: result.length,
              videos: result,
              source: 'api/scraping',
              timestamp: new Date().toISOString()
            };
          }
        } catch (error) {
          console.log(`Twitter source failed: ${error.message}`);
          continue;
        }
      }

      throw new Error('All Twitter trending sources failed');
    } catch (error) {
      throw new Error(`Twitter trending failed: ${error.message}`);
    }
  }

  async scrapeTwitterTrending(region = 'US', maxResults = 50) {
    if (!this.browser) throw new Error('Browser not initialized');

    const page = await this.browser.newPage();
    
    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      await page.setViewport({ width: 1200, height: 800 });
      
      // Navigate to Twitter trending
      const url = `https://twitter.com/explore`;
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for content to load
      await page.waitForSelector('[data-testid="trend"]', { timeout: 15000 });

      const trends = await page.evaluate((maxResults) => {
        const trendElements = document.querySelectorAll('[data-testid="trend"]');
        const trends = [];
        
        for (let i = 0; i < Math.min(trendElements.length, maxResults); i++) {
          const element = trendElements[i];
          
          try {
            const trendElement = element.querySelector('[data-testid="trend"] span');
            const countElement = element.querySelector('[data-testid="trend"] div');
            
            if (trendElement) {
              const trend = trendElement.textContent.trim();
              const count = countElement ? countElement.textContent.trim() : '';
              
              trends.push({
                id: `trend_${i}`,
                title: trend,
                channelTitle: 'Twitter Trend',
                viewCount: count,
                platform: 'twitter',
                trending: true,
                type: 'trend'
              });
            }
          } catch (error) {
            console.log('Error extracting Twitter trend data:', error);
          }
        }
        
        return trends;
      }, maxResults);
      
      return trends;
    } catch (error) {
      throw new Error(`Twitter scraping failed: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  async getTwitterTrendingViaAPI(region = 'US', maxResults = 50) {
    if (!this.apiKeys.twitterBearer) {
      throw new Error('Twitter bearer token not configured');
    }

    try {
      const response = await axios.get('https://api.twitter.com/2/tweets/search/recent', {
        headers: {
          'Authorization': `Bearer ${this.apiKeys.twitterBearer}`,
          'Content-Type': 'application/json'
        },
        params: {
          query: 'trending',
          max_results: maxResults,
          'tweet.fields': 'created_at,public_metrics,author_id',
          'user.fields': 'username,name'
        }
      });

      if (response.data && response.data.data) {
        return response.data.data.map(tweet => ({
          id: tweet.id,
          title: tweet.text,
          channelTitle: 'Twitter User',
          viewCount: tweet.public_metrics?.retweet_count || 0,
          platform: 'twitter',
          trending: true
        }));
      }

      return [];
    } catch (error) {
      throw new Error(`Twitter API trending failed: ${error.message}`);
    }
  }

  async getTwitterHashtags(region = 'US', maxResults = 50) {
    if (!this.browser) throw new Error('Browser not initialized');

    const page = await this.browser.newPage();
    
    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      // Navigate to Twitter trending hashtags
      const url = `https://twitter.com/explore/tabs/trending`;
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      await page.waitForSelector('[data-testid="trend"]', { timeout: 15000 });

      const hashtags = await page.evaluate((maxResults) => {
        const hashtagElements = document.querySelectorAll('[data-testid="trend"]');
        const hashtags = [];
        
        for (let i = 0; i < Math.min(hashtagElements.length, maxResults); i++) {
          const element = hashtagElements[i];
          
          try {
            const hashtagElement = element.querySelector('span');
            const countElement = element.querySelector('div');
            
            if (hashtagElement) {
              const hashtag = hashtagElement.textContent.trim();
              const count = countElement ? countElement.textContent.trim() : '';
              
              if (hashtag.startsWith('#')) {
                hashtags.push({
                  id: `hashtag_${i}`,
                  title: hashtag,
                  channelTitle: 'Trending Hashtag',
                  viewCount: count,
                  platform: 'twitter',
                  trending: true,
                  type: 'hashtag'
                });
              }
            }
          } catch (error) {
            console.log('Error extracting Twitter hashtag data:', error);
          }
        }
        
        return hashtags;
      }, maxResults);
      
      return hashtags;
    } catch (error) {
      throw new Error(`Twitter hashtag scraping failed: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  // ===== GOOGLE TRENDS =====
  async getGoogleTrends(region = 'US', maxResults = 50) {
    console.log(`🔍 Fetching Google Trends for region: ${region}`);
    
    try {
      const sources = [
        () => this.scrapeGoogleTrends(region, maxResults),
        () => this.getGoogleTrendsViaAPI(region, maxResults)
      ];

      for (const source of sources) {
        try {
          const result = await source();
          if (result && result.length > 0) {
            return {
              platform: 'google',
              region,
              count: result.length,
              videos: result,
              source: 'api/scraping',
              timestamp: new Date().toISOString()
            };
          }
        } catch (error) {
          console.log(`Google Trends source failed: ${error.message}`);
          continue;
        }
      }

      throw new Error('All Google Trends sources failed');
    } catch (error) {
      throw new Error(`Google Trends failed: ${error.message}`);
    }
  }

  async scrapeGoogleTrends(region = 'US', maxResults = 50) {
    if (!this.browser) throw new Error('Browser not initialized');

    const page = await this.browser.newPage();
    
    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      await page.setViewport({ width: 1200, height: 800 });
      
      // Navigate to Google Trends
      const url = `https://trends.google.com/trends/trendingsearches/daily?geo=${region}`;
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for content to load
      await page.waitForSelector('.trending-story', { timeout: 15000 });

      const trends = await page.evaluate((maxResults) => {
        const trendElements = document.querySelectorAll('.trending-story');
        const trends = [];
        
        for (let i = 0; i < Math.min(trendElements.length, maxResults); i++) {
          const element = trendElements[i];
          
          try {
            const titleElement = element.querySelector('.title');
            const trafficElement = element.querySelector('.search-count-title');
            
            if (titleElement) {
              const title = titleElement.textContent.trim();
              const traffic = trafficElement ? trafficElement.textContent.trim() : '';
              
              trends.push({
                id: `trend_${i}`,
                title,
                channelTitle: 'Google Trend',
                viewCount: traffic,
                platform: 'google',
                trending: true,
                type: 'trend'
              });
            }
          } catch (error) {
            console.log('Error extracting Google trend data:', error);
          }
        }
        
        return trends;
      }, maxResults);
      
      return trends;
    } catch (error) {
      throw new Error(`Google Trends scraping failed: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  async getGoogleTrendsViaAPI(region = 'US', maxResults = 50) {
    if (!this.apiKeys.googleTrends) {
      throw new Error('Google Trends API key not configured');
    }

    try {
      const response = await axios.get('https://trends.googleapis.com/trends/api/dailytrends', {
        params: {
          hl: 'en-US',
          tz: '-120',
          geo: region,
          ns: '15',
          key: this.apiKeys.googleTrends
        }
      });

      if (response.data && response.data.default && response.data.default.trendingSearchesDays) {
        const trends = [];
        const day = response.data.default.trendingSearchesDays[0];
        
        if (day && day.trendingSearches) {
          day.trendingSearches.slice(0, maxResults).forEach((trend, index) => {
            trends.push({
              id: `trend_${index}`,
              title: trend.title.query,
              channelTitle: 'Google Trend',
              viewCount: trend.formattedTraffic,
              thumbnail: trend.image?.imageUrl || '',
              platform: 'google',
              trending: true,
              type: 'trend'
            });
          });
        }
        
        return trends;
      }

      return [];
    } catch (error) {
      throw new Error(`Google Trends API failed: ${error.message}`);
    }
  }

  // ===== CROSS-PLATFORM TRENDING =====
  async getAllTrending(region = 'US', maxResults = 20) {
    console.log(`🌐 Fetching all platform trending for region: ${region}`);
    
    try {
      const platforms = [
        { name: 'youtube', func: () => this.getYouTubeTrending(region, maxResults) },
        { name: 'tiktok', func: () => this.getTikTokTrending(region, maxResults) },
        { name: 'instagram', func: () => this.getInstagramTrending(region, maxResults) },
        { name: 'twitter', func: () => this.getTwitterTrending(region, maxResults) },
        { name: 'google', func: () => this.getGoogleTrends(region, maxResults) }
      ];

      const results = {};
      
      for (const platform of platforms) {
        try {
          const result = await platform.func();
          results[platform.name] = result;
        } catch (error) {
          console.log(`${platform.name} trending failed: ${error.message}`);
          results[platform.name] = { error: error.message };
        }
      }

      return {
        region,
        timestamp: new Date().toISOString(),
        platforms: results,
        summary: this.generateCrossPlatformSummary(results)
      };
    } catch (error) {
      throw new Error(`Cross-platform trending failed: ${error.message}`);
    }
  }

  generateCrossPlatformSummary(results) {
    const summary = {
      totalPlatforms: Object.keys(results).length,
      successfulPlatforms: 0,
      totalTrendingItems: 0,
      topTrends: [],
      platformComparison: {}
    };

    Object.entries(results).forEach(([platform, data]) => {
      if (data && !data.error && data.videos) {
        summary.successfulPlatforms++;
        summary.totalTrendingItems += data.videos.length;
        
        summary.platformComparison[platform] = {
          count: data.videos.length,
          source: data.source
        };

        // Add top trends from each platform
        data.videos.slice(0, 3).forEach(video => {
          summary.topTrends.push({
            platform,
            title: video.title,
            viewCount: video.viewCount,
            type: video.type || 'content'
          });
        });
      }
    });

    // Sort top trends by popularity
    summary.topTrends.sort((a, b) => {
      const aCount = parseInt(a.viewCount) || 0;
      const bCount = parseInt(b.viewCount) || 0;
      return bCount - aCount;
    });

    return summary;
  }

  // ===== UTILITY METHODS =====
  extractVideoId(url) {
    if (!url) return '';
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : '';
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

module.exports = TrendingAPIs; 