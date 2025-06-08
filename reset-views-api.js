// Simple script to reset view counts via API
async function resetViews() {
  try {
    // You'll need to get your admin token from localStorage in the browser
    // Or use a test token - let's try to make a request first
    
    console.log('Attempting to reset view counts...');
    
    const response = await fetch('http://localhost:5000/api/admin/reset-views', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer your_admin_token_here',
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ View counts reset successfully!');
      console.log(`Updated ${result.data.blogsUpdated} blogs and ${result.data.newsUpdated} news items`);
      console.log('\nSample updated content:');
      result.data.sampleBlogs.forEach(blog => {
        console.log(`📝 ${blog.title}: ${blog.views} views`);
      });
      result.data.sampleNews.forEach(news => {
        console.log(`📰 ${news.title}: ${news.views} views`);
      });
    } else {
      console.log('❌ Failed to reset view counts:', result.message);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\n📋 To reset view counts manually:');
    console.log('1. Open your browser and go to your admin dashboard');
    console.log('2. Open browser console (F12)');
    console.log('3. Run this command:');
    console.log(`
fetch('/api/admin/reset-views', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('myAppAdminToken'),
    'Content-Type': 'application/json'
  }
}).then(res => res.json()).then(data => console.log(data));
    `);
  }
}

resetViews();
