const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:3000/api';

async function testLogin() {
  try {
    console.log('Attempting to login...');
    console.log('Email:', process.env.SUPER_USER_EMAIL);

    const response = await axios.post(`${API_URL}/auth/login`, {
      email: process.env.SUPER_USER_EMAIL,
      password: process.env.SUPER_USER_PASSWORD
    });

    console.log('\n✅ Login successful!');
    console.log('\nToken:', response.data.token);
    console.log('\nUser:', JSON.stringify(response.data.user, null, 2));

    // Test dashboard stats with the token
    console.log('\n\nTesting dashboard stats with token...');
    const statsResponse = await axios.get(`${API_URL}/dashboard/stats`, {
      headers: {
        'Authorization': `Bearer ${response.data.token}`
      }
    });

    console.log('\n✅ Dashboard stats:');
    console.log(JSON.stringify(statsResponse.data, null, 2));

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
  }
}

testLogin();
