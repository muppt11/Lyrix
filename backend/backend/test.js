const GoogleCloudConsole = require('./google-cloud');
require('dotenv').config();

// Initialize Google Cloud Console
const gcp = new GoogleCloudConsole();

// Test individual services
async function testYouTubeAPI() {
  console.log('\n🧪 Testing YouTube Data API...');
  
  try {
    const videos = await gcp.searchVideos('programming tutorial', 2);
    console.log('✅ YouTube API working - Found videos:', videos.length);
    return true;
  } catch (error) {
    console.log('❌ YouTube API failed:', error.message);
    return false;
  }
}

async function testCloudStorage() {
  console.log('\n🧪 Testing Cloud Storage...');
  
  try {
    const buckets = await gcp.listBuckets();
    console.log('✅ Cloud Storage working - Found buckets:', buckets.length);
    return true;
  } catch (error) {
    console.log('❌ Cloud Storage failed:', error.message);
    return false;
  }
}

async function testBigQuery() {
  console.log('\n🧪 Testing BigQuery...');
  
  try {
    const datasets = await gcp.listDatasets();
    console.log('✅ BigQuery working - Found datasets:', datasets.length);
    return true;
  } catch (error) {
    console.log('❌ BigQuery failed:', error.message);
    return false;
  }
}

async function testPubSub() {
  console.log('\n🧪 Testing Pub/Sub...');
  
  try {
    const topics = await gcp.listTopics();
    console.log('✅ Pub/Sub working - Found topics:', topics.length);
    return true;
  } catch (error) {
    console.log('❌ Pub/Sub failed:', error.message);
    return false;
  }
}

async function testLogging() {
  console.log('\n🧪 Testing Cloud Logging...');
  
  try {
    await gcp.writeLog('test-log', { message: 'Test log entry' });
    console.log('✅ Cloud Logging working - Log written successfully');
    return true;
  } catch (error) {
    console.log('❌ Cloud Logging failed:', error.message);
    return false;
  }
}

async function testMonitoring() {
  console.log('\n🧪 Testing Cloud Monitoring...');
  
  try {
    const metrics = await gcp.listMetrics();
    console.log('✅ Cloud Monitoring working - Found metrics:', metrics.length);
    return true;
  } catch (error) {
    console.log('❌ Cloud Monitoring failed:', error.message);
    return false;
  }
}

async function testResourceManager() {
  console.log('\n🧪 Testing Resource Manager...');
  
  try {
    const projects = await gcp.listProjects();
    console.log('✅ Resource Manager working - Found projects:', projects.length);
    return true;
  } catch (error) {
    console.log('❌ Resource Manager failed:', error.message);
    return false;
  }
}

async function testIAM() {
  console.log('\n🧪 Testing IAM...');
  
  try {
    const serviceAccounts = await gcp.listServiceAccounts();
    console.log('✅ IAM working - Found service accounts:', serviceAccounts.length);
    return true;
  } catch (error) {
    console.log('❌ IAM failed:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Running Google Cloud Console Tests\n');
  
  if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
    console.error('❌ GOOGLE_CLOUD_PROJECT_ID not set');
    return;
  }
  
  console.log(`📋 Project: ${process.env.GOOGLE_CLOUD_PROJECT_ID}\n`);
  
  const results = {
    youtube: await testYouTubeAPI(),
    storage: await testCloudStorage(),
    bigquery: await testBigQuery(),
    pubsub: await testPubSub(),
    logging: await testLogging(),
    monitoring: await testMonitoring(),
    resourceManager: await testResourceManager(),
    iam: await testIAM()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([service, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${service}`);
  });
  
  console.log(`\n🎯 Overall: ${passed}/${total} services working`);
  
  if (passed === total) {
    console.log('🎉 All services are working correctly!');
  } else {
    console.log('⚠️  Some services need configuration or permissions');
    console.log('\n🔧 To fix issues:');
    console.log('1. Enable required APIs in Google Cloud Console');
    console.log('2. Grant proper permissions to your service account');
    console.log('3. Check your authentication setup');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testYouTubeAPI,
  testCloudStorage,
  testBigQuery,
  testPubSub,
  testLogging,
  testMonitoring,
  testResourceManager,
  testIAM,
  runAllTests
}; 