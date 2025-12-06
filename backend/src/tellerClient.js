const axios = require('axios');

const TELLER_API_BASE = process.env.TELLER_ENV === 'production'
  ? 'https://api.teller.io'
  : 'https://api.teller.io'; // Teller uses same endpoint for sandbox/production

const tellerClient = axios.create({
  baseURL: TELLER_API_BASE,
  auth: {
    username: process.env.TELLER_API_KEY || '',
    password: ''
  },
  headers: {
    'Content-Type': 'application/json'
  }
});

module.exports = tellerClient;
