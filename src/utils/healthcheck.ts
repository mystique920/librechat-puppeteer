/**
 * Health check script for Docker container
 * 
 * This script is used by the Docker HEALTHCHECK command to verify
 * that the service is running correctly.
 */

import http from 'http';

const options = {
  host: 'localhost',
  port: process.env.PORT || 3000,
  path: '/health',
  timeout: 2000
};

const request = http.request(options, (res) => {
  console.log(`Health check status: ${res.statusCode}`);
  
  // If the status code is not 200, exit with an error
  if (res.statusCode !== 200) {
    process.exit(1);
  }
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const healthData = JSON.parse(data);
      
      // Check if Puppeteer is ready
      if (healthData.puppeteer !== 'READY') {
        console.error('Puppeteer is not ready');
        process.exit(1);
      }
      
      console.log('Health check passed');
      process.exit(0);
    } catch (error) {
      console.error('Error parsing health check response:', error);
      process.exit(1);
    }
  });
});

request.on('error', (error) => {
  console.error('Health check failed:', error.message);
  process.exit(1);
});

request.end();