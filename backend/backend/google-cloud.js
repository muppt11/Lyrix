const { Storage } = require('@google-cloud/storage');
const { BigQuery } = require('@google-cloud/bigquery');
const { PubSub } = require('@google-cloud/pubsub');
const { Logging } = require('@google-cloud/logging');
const { Monitoring } = require('@google-cloud/monitoring');
const { ResourceManager } = require('@google-cloud/resource-manager');
const { IAM } = require('@google-cloud/iam');
const { google } = require('googleapis');
require('dotenv').config();

// Initialize Google Cloud services
class GoogleCloudConsole {
  constructor() {
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    this.region = process.env.GOOGLE_CLOUD_REGION || 'us-central1';
    
    // Initialize services
    this.storage = new Storage({ projectId: this.projectId });
    this.bigquery = new BigQuery({ projectId: this.projectId });
    this.pubsub = new PubSub({ projectId: this.projectId });
    this.logging = new Logging({ projectId: this.projectId });
    this.monitoring = new Monitoring({ projectId: this.projectId });
    this.resourceManager = new ResourceManager({ projectId: this.projectId });
    this.iam = new IAM({ projectId: this.projectId });
    
    // YouTube API
    this.youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY
    });
  }

  // ===== CLOUD STORAGE OPERATIONS =====
  
  async listBuckets() {
    try {
      const [buckets] = await this.storage.getBuckets();
      return buckets.map(bucket => ({
        name: bucket.name,
        location: bucket.metadata.location,
        created: bucket.metadata.timeCreated
      }));
    } catch (error) {
      console.error('Error listing buckets:', error.message);
      throw error;
    }
  }

  async uploadFile(bucketName, fileName, fileContent) {
    try {
      const bucket = this.storage.bucket(bucketName);
      const file = bucket.file(fileName);
      
      await file.save(fileContent, {
        metadata: {
          contentType: 'application/octet-stream'
        }
      });
      
      return { success: true, fileName, bucketName };
    } catch (error) {
      console.error('Error uploading file:', error.message);
      throw error;
    }
  }

  async downloadFile(bucketName, fileName) {
    try {
      const bucket = this.storage.bucket(bucketName);
      const file = bucket.file(fileName);
      
      const [content] = await file.download();
      return content;
    } catch (error) {
      console.error('Error downloading file:', error.message);
      throw error;
    }
  }

  // ===== BIGQUERY OPERATIONS =====
  
  async listDatasets() {
    try {
      const [datasets] = await this.bigquery.getDatasets();
      return datasets.map(dataset => ({
        id: dataset.id,
        datasetId: dataset.datasetId,
        location: dataset.metadata.location
      }));
    } catch (error) {
      console.error('Error listing datasets:', error.message);
      throw error;
    }
  }

  async createDataset(datasetId, location = 'US') {
    try {
      const [dataset] = await this.bigquery.createDataset(datasetId, {
        location: location
      });
      
      return {
        success: true,
        datasetId: dataset.datasetId,
        location: dataset.metadata.location
      };
    } catch (error) {
      console.error('Error creating dataset:', error.message);
      throw error;
    }
  }

  async queryData(query) {
    try {
      const [rows] = await this.bigquery.query({ query });
      return rows;
    } catch (error) {
      console.error('Error executing query:', error.message);
      throw error;
    }
  }

  // ===== PUB/SUB OPERATIONS =====
  
  async listTopics() {
    try {
      const [topics] = await this.pubsub.getTopics();
      return topics.map(topic => ({
        name: topic.name,
        projectId: this.projectId
      }));
    } catch (error) {
      console.error('Error listing topics:', error.message);
      throw error;
    }
  }

  async createTopic(topicName) {
    try {
      const [topic] = await this.pubsub.createTopic(topicName);
      return { success: true, topicName: topic.name };
    } catch (error) {
      console.error('Error creating topic:', error.message);
      throw error;
    }
  }

  async publishMessage(topicName, message) {
    try {
      const topic = this.pubsub.topic(topicName);
      const messageBuffer = Buffer.from(JSON.stringify(message));
      
      const messageId = await topic.publish(messageBuffer);
      return { success: true, messageId };
    } catch (error) {
      console.error('Error publishing message:', error.message);
      throw error;
    }
  }

  async subscribeToTopic(topicName, subscriptionName) {
    try {
      const topic = this.pubsub.topic(topicName);
      const subscription = topic.subscription(subscriptionName);
      
      await subscription.create();
      return { success: true, subscriptionName };
    } catch (error) {
      console.error('Error creating subscription:', error.message);
      throw error;
    }
  }

  // ===== LOGGING OPERATIONS =====
  
  async writeLog(logName, data) {
    try {
      const log = this.logging.log(logName);
      const entry = log.entry({
        resource: {
          type: 'global'
        },
        severity: 'INFO'
      }, data);
      
      await log.write(entry);
      return { success: true };
    } catch (error) {
      console.error('Error writing log:', error.message);
      throw error;
    }
  }

  async listLogs() {
    try {
      const [entries] = await this.logging.getEntries({
        filter: `resource.type="global"`,
        maxResults: 10
      });
      
      return entries.map(entry => ({
        timestamp: entry.metadata.timestamp,
        severity: entry.metadata.severity,
        textPayload: entry.data.textPayload
      }));
    } catch (error) {
      console.error('Error listing logs:', error.message);
      throw error;
    }
  }

  // ===== MONITORING OPERATIONS =====
  
  async listMetrics() {
    try {
      const [metrics] = await this.monitoring.listMetricDescriptors({
        filter: 'metric.type = starts_with("compute.googleapis.com/instance")'
      });
      
      return metrics.map(metric => ({
        name: metric.displayName,
        type: metric.type,
        description: metric.description
      }));
    } catch (error) {
      console.error('Error listing metrics:', error.message);
      throw error;
    }
  }

  async createTimeSeries(metricType, value, labels = {}) {
    try {
      const dataPoint = {
        interval: {
          endTime: {
            seconds: Date.now() / 1000
          }
        },
        value: {
          doubleValue: value
        }
      };

      const timeSeriesData = {
        metric: {
          type: metricType,
          labels: labels
        },
        resource: {
          type: 'global',
          labels: {
            project_id: this.projectId
          }
        },
        points: [dataPoint]
      };

      await this.monitoring.createTimeSeries({
        name: this.monitoring.projectPath(this.projectId),
        timeSeries: [timeSeriesData]
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error creating time series:', error.message);
      throw error;
    }
  }

  // ===== RESOURCE MANAGER OPERATIONS =====
  
  async listProjects() {
    try {
      const [projects] = await this.resourceManager.getProjects();
      return projects.map(project => ({
        projectId: project.projectId,
        name: project.name,
        projectNumber: project.projectNumber,
        state: project.state
      }));
    } catch (error) {
      console.error('Error listing projects:', error.message);
      throw error;
    }
  }

  async getProjectInfo() {
    try {
      const [project] = await this.resourceManager.getProject(this.projectId);
      return {
        projectId: project.projectId,
        name: project.name,
        projectNumber: project.projectNumber,
        state: project.state,
        createTime: project.createTime
      };
    } catch (error) {
      console.error('Error getting project info:', error.message);
      throw error;
    }
  }

  // ===== IAM OPERATIONS =====
  
  async listServiceAccounts() {
    try {
      const [accounts] = await this.iam.getServiceAccounts({
        name: `projects/${this.projectId}`
      });
      
      return accounts.map(account => ({
        name: account.name,
        email: account.email,
        displayName: account.displayName,
        disabled: account.disabled
      }));
    } catch (error) {
      console.error('Error listing service accounts:', error.message);
      throw error;
    }
  }

  async getIamPolicy() {
    try {
      const [policy] = await this.iam.getIamPolicy({
        resource: `projects/${this.projectId}`
      });
      
      return policy;
    } catch (error) {
      console.error('Error getting IAM policy:', error.message);
      throw error;
    }
  }

  // ===== YOUTUBE API OPERATIONS =====
  
  async searchVideos(query, maxResults = 10) {
    try {
      const response = await this.youtube.search.list({
        part: 'snippet',
        q: query,
        maxResults: maxResults,
        type: 'video'
      });

      return response.data.items.map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        thumbnails: item.snippet.thumbnails
      }));
    } catch (error) {
      console.error('Error searching videos:', error.message);
      throw error;
    }
  }

  async getVideoDetails(videoId) {
    try {
      const response = await this.youtube.videos.list({
        part: 'snippet,statistics,contentDetails',
        id: videoId
      });

      if (response.data.items.length === 0) {
        throw new Error('Video not found');
      }

      const video = response.data.items[0];
      return {
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        channelTitle: video.snippet.channelTitle,
        publishedAt: video.snippet.publishedAt,
        thumbnails: video.snippet.thumbnails,
        statistics: video.statistics,
        duration: video.contentDetails.duration
      };
    } catch (error) {
      console.error('Error getting video details:', error.message);
      throw error;
    }
  }

  // ===== UTILITY METHODS =====
  
  async getProjectResources() {
    try {
      const [projects] = await this.listProjects();
      const [buckets] = await this.listBuckets();
      const [datasets] = await this.listDatasets();
      const [topics] = await this.listTopics();
      const [serviceAccounts] = await this.listServiceAccounts();
      
      return {
        project: await this.getProjectInfo(),
        resources: {
          buckets: buckets.length,
          datasets: datasets.length,
          topics: topics.length,
          serviceAccounts: serviceAccounts.length
        }
      };
    } catch (error) {
      console.error('Error getting project resources:', error.message);
      throw error;
    }
  }

  async healthCheck() {
    try {
      const checks = {
        storage: false,
        bigquery: false,
        pubsub: false,
        logging: false,
        monitoring: false,
        resourceManager: false,
        iam: false,
        youtube: false
      };

      // Test each service
      try {
        await this.listBuckets();
        checks.storage = true;
      } catch (e) {}

      try {
        await this.listDatasets();
        checks.bigquery = true;
      } catch (e) {}

      try {
        await this.listTopics();
        checks.pubsub = true;
      } catch (e) {}

      try {
        await this.listLogs();
        checks.logging = true;
      } catch (e) {}

      try {
        await this.listMetrics();
        checks.monitoring = true;
      } catch (e) {}

      try {
        await this.listProjects();
        checks.resourceManager = true;
      } catch (e) {}

      try {
        await this.listServiceAccounts();
        checks.iam = true;
      } catch (e) {}

      try {
        await this.searchVideos('test', 1);
        checks.youtube = true;
      } catch (e) {}

      return {
        status: 'healthy',
        services: checks,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = GoogleCloudConsole; 