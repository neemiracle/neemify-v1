const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:3000/api';

async function testCreateCompany() {
  try {
    // First login
    console.log('Logging in...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: process.env.SUPER_USER_EMAIL,
      password: process.env.SUPER_USER_PASSWORD
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    // Create a test company
    console.log('Creating test company...');
    const createResponse = await axios.post(`${API_URL}/companies`, {
      name: 'Test Healthcare Inc',
      domain: 'testhealthcare.com'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('\n✅ Company created successfully!');
    console.log('Company:', JSON.stringify(createResponse.data.company, null, 2));
    console.log('\nLicense Key:', createResponse.data.licenseKey);

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
  }
}

testCreateCompany();
