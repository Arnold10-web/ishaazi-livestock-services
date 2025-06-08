// Browser Console Command to Reset View Counts
// Copy and paste this into your browser console (F12) while on your admin dashboard:

fetch('http://localhost:5000/api/admin/reset-views', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('myAppAdminToken'),
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('✅ View counts reset successfully!');
    console.log(`Updated ${data.data.blogsUpdated} blogs and ${data.data.newsUpdated} news items`);
    console.log('\nSample updated content:');
    data.data.sampleBlogs.forEach(blog => {
      console.log(`📝 ${blog.title}: ${blog.views} views`);
    });
    data.data.sampleNews.forEach(news => {
      console.log(`📰 ${news.title}: ${news.views} views`);
    });
    
    // Refresh the page to see updated dashboard
    console.log('\n🔄 Refreshing page to show updated dashboard...');
    setTimeout(() => window.location.reload(), 2000);
  } else {
    console.log('❌ Failed to reset view counts:', data.message);
  }
})
.catch(error => {
  console.error('Error:', error);
});
