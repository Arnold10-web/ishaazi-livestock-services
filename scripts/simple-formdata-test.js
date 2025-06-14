/**
 * Simple FormData Test
 * 
 * This script tests updating a blog with FormData sending a single field.
 */
import axios from 'axios';
import FormData from 'form-data';

const API_URL = 'http://localhost:5000/api';
const AUTH = { username: 'Admin', password: 'Admin123' };
const BLOG_ID = '684d4864e203437895daa840'; // The Form Data Blog Post ID

async function simpleFormDataTest() {
  try {
    // Step 1: Login
    const loginResponse = await axios.post(`${API_URL}/admin/login`, AUTH);
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Step 2: Update with simple FormData
    try {
      const formData = new FormData();
      formData.append('title', 'Simple FormData Test with Tags - ' + new Date().toISOString());
      // Try with just string values for tags (not JSON)
      formData.append('tags', 'simple,form,test,tags');
      
      const updateResponse = await axios.put(
        `${API_URL}/content/blogs/${BLOG_ID}`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('✅ Update successful!');
      console.log('Updated blog:', JSON.stringify(updateResponse.data, null, 2));
      
      return true;
    } catch (updateError) {
      console.error('❌ Update failed!');
      console.error('Error:', updateError.message);
      if (updateError.response?.data) {
        console.error('Response:', JSON.stringify(updateError.response.data, null, 2));
      }
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

simpleFormDataTest().catch(console.error);
