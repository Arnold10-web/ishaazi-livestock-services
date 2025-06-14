/**
 * Direct Blog Update Test - Debugging
 * 
 * This script directly updates a blog using axios with debugging.
 */
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const AUTH = { username: 'Admin', password: 'Admin123' };
const BLOG_ID = '684d4864e203437895daa840'; // The Form Data Blog Post ID

async function directUpdateDebug() {
  try {
    // Step 1: Login
    const loginResponse = await axios.post(`${API_URL}/admin/login`, AUTH);
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Step 2: Update using direct JSON with tags as an array
    try {
      const updateData = {
        title: 'Debug JSON Update - ' + new Date().toISOString(),
        tags: ['debug', 'json', 'update', 'test']
      };
      
      console.log('Sending update data:', JSON.stringify(updateData, null, 2));
      
      const updateResponse = await axios({
        method: 'put',
        url: `${API_URL}/content/blogs/${BLOG_ID}`,
        data: updateData,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Update successful!');
      console.log('Updated blog:', JSON.stringify(updateResponse.data, null, 2));
      
      return true;
    } catch (updateError) {
      console.error('❌ Update failed!');
      console.error('Error:', updateError.message);
      if (updateError.response?.data) {
        console.error('Response:', JSON.stringify(updateError.response.data, null, 2));
      }
      
      // Log more error details
      if (updateError.response) {
        console.error('Status:', updateError.response.status);
        console.error('Headers:', updateError.response.headers);
      }
      
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

directUpdateDebug().catch(console.error);
