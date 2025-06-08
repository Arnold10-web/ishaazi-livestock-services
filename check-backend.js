import fetch from 'node-fetch';

async function resetViewCounts() {
  try {
    console.log('Checking if backend server is running...');
    
    // Test if the backend is accessible
    const testResponse = await fetch('http://localhost:5000/api/dashboard/stats', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer your_token_here', // We'll need to get this
        'Content-Type': 'application/json'
      }
    });
    
    if (testResponse.ok) {
      console.log('Backend is accessible');
      const data = await testResponse.json();
      console.log('Current popular content:', data.data?.popularContent);
    } else {
      console.log('Backend server might not be running. Please start it with: npm start');
      console.log('Once the server is running, we can create an API endpoint to reset view counts.');
    }
    
  } catch (error) {
    console.error('Error connecting to backend:', error.message);
    console.log('\nTo reset view counts, you have two options:');
    console.log('1. Start your backend server (npm start) and we can create an API endpoint');
    console.log('2. Manually reset via database if you have direct access');
  }
}

resetViewCounts();
