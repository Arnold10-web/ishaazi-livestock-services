/**
 * Minimal Blog Update Test
 * 
 * This script updates a blog using FormData.
 */
import axios from 'axios';
import FormData from 'form-data';

const API_URL = 'http://localhost:5000/api';
const AUTH = { username: 'Admin', password: 'Admin123' };
// Use the most recently created blog ID
const BLOG_ID = '684d4864e203437895daa840';

// Very simple test focusing only on the update process
async function testUpdateWithFormData() {
  try {
    // Step 1: Login
    const loginResponse = await axios.post(`${API_URL}/admin/login`, AUTH);
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Step 2: Update with FormData
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('title', 'Updated FormData Title - ' + new Date().toISOString());
      
      // Try sending tags as a JSON string array
      const tagsArray = ['updated', 'form', 'test', 'data'];
      formData.append('tags', JSON.stringify(tagsArray));
      
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
    } catch (updateError) {
      console.error('❌ Update failed!');
      console.error('Error:', updateError.message);
      console.error('Response:', updateError.response?.data);
      
      // Print the exact request that failed
      console.log('\nExact request details:');
      console.log('URL:', `${API_URL}/content/blogs/${BLOG_ID}`);
      console.log('Method:', 'PUT');
      console.log('Headers:', {
        'Content-Type': 'multipart/form-data',
        'Authorization': 'Bearer [token]'
      });
      console.log('Data: FormData with title and tags');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    }
  }
}

testUpdateWithFormData().catch(console.error);
