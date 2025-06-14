/**
 * Curl Blog Update Test
 */
import { exec } from 'child_process';
import axios from 'axios';
import util from 'util';

const execPromise = util.promisify(exec);
const API_URL = 'http://localhost:5000/api';
const AUTH = { username: 'Admin', password: 'Admin123' };
const BLOG_ID = '684d4864e203437895daa840'; // The Form Data Blog Post ID

async function curlUpdateTest() {
  try {
    // Step 1: Login
    const loginResponse = await axios.post(`${API_URL}/admin/login`, AUTH);
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Step 2: Update using curl
    try {
      const updateData = {
        title: 'Curl Update with Tags - ' + new Date().toISOString(),
        tags: ['curl', 'test', 'update', 'tags']
      };
      
      const jsonData = JSON.stringify(updateData);
      
      const curlCommand = `curl -X PUT "${API_URL}/content/blogs/${BLOG_ID}" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${token}" \
        -d '${jsonData}'`;
      
      console.log('Executing curl command...');
      
      const { stdout, stderr } = await execPromise(curlCommand);
      
      if (stderr) {
        console.error('❌ Curl error:', stderr);
      }
      
      console.log('✅ Curl output:');
      console.log(stdout);
      
      return true;
    } catch (error) {
      console.error('❌ Error executing curl command:', error.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

curlUpdateTest().catch(console.error);
