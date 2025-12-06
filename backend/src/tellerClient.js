const axios = require('axios');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Teller API base URL
const TELLER_API_BASE = 'https://api.teller.io';

// Load SSL certificates for mTLS authentication
const certPath = path.resolve(__dirname, '..', process.env.TELLER_CERT_PATH || './certs/certificate.pem');
const keyPath = path.resolve(__dirname, '..', process.env.TELLER_KEY_PATH || './certs/private_key.pem');

let httpsAgent;

try {
  const cert = fs.readFileSync(certPath);
  const key = fs.readFileSync(keyPath);

  // Create HTTPS agent with client certificate for mTLS
  httpsAgent = new https.Agent({
    cert: cert,
    key: key,
    rejectUnauthorized: true // Verify Teller's SSL certificate
  });

  console.log('✓ Teller SSL certificates loaded successfully');
} catch (error) {
  console.error('✗ Failed to load Teller SSL certificates:');
  console.error(`  Certificate path: ${certPath}`);
  console.error(`  Key path: ${keyPath}`);
  console.error(`  Error: ${error.message}`);
  console.error('\nPlease ensure your certificate.pem and private_key.pem are in backend/certs/');
}

// Create axios instance with mTLS configuration
const tellerClient = axios.create({
  baseURL: TELLER_API_BASE,
  httpsAgent: httpsAgent,
  headers: {
    'Content-Type': 'application/json'
  }
});

module.exports = tellerClient;
