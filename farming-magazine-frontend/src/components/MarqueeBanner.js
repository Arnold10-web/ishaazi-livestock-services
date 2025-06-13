import React, { useState, useEffect } from 'react';

const MarqueeBanner = ({ variant = "green" }) => {
  const [headlines, setHeadlines] = useState([]);

  // Color variants - you can easily switch between these
  const colorVariants = {
    green: "bg-green-800 text-white",
    red: "bg-red-600 text-white", 
    blue: "bg-blue-700 text-white",
    gray: "bg-gray-800 text-white",
    orange: "bg-orange-600 text-white"
  };

  useEffect(() => {
    // Fetch latest breaking news from the API
    const fetchHeadlines = async () => {
      try {
        // Get the latest news with breaking priority
        const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const response = await fetch(`${API_BASE_URL}/api/content/news?limit=10&breaking=true`);
        
        if (response.ok) {
          const data = await response.json();
          const newsHeadlines = data.data.news.map(article => ({
            title: article.title,
            id: article._id,
            createdAt: article.createdAt
          }));
          
          if (newsHeadlines.length > 0) {
            setHeadlines(newsHeadlines);
          } else {
            // Fallback to latest news if no breaking news
            const fallbackResponse = await fetch(`${API_BASE_URL}/api/content/news?limit=5`);
            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();
              const fallbackHeadlines = fallbackData.data.news.map(article => ({
                title: article.title,
                id: article._id,
                createdAt: article.createdAt
              }));
              setHeadlines(fallbackHeadlines);
            }
          }
        } else {
          // API failed, use fallback headlines
          setHeadlines([
            { title: "Stay tuned for the latest livestock and agricultural news updates", id: "fallback-1" },
            { title: "Real-time market insights and farming technology updates coming soon", id: "fallback-2" }
          ]);
        }
      } catch (err) {
        console.error('Failed to fetch headlines:', err);
        // Fallback to generic headlines on error
        setHeadlines([
          { title: "Welcome to your trusted source for agricultural and livestock news", id: "fallback-1" },
          { title: "Expert insights on farming practices and market trends", id: "fallback-2" }
        ]);
      }
    };

    fetchHeadlines();
    
    // Refresh headlines every 10 minutes for fresh content
    const interval = setInterval(fetchHeadlines, 600000);
    return () => clearInterval(interval);
  }, []);

  if (headlines.length === 0) return null;

  return (
    <div className={`${colorVariants[variant]} py-2 overflow-hidden relative`}>
      <div className="animate-marquee whitespace-nowrap">
        <span className="text-sm font-medium">
          {headlines.map((headline, index) => (
            <span key={headline.id || index} className="mx-8">
              📰 {headline.title}
              {headline.createdAt && (
                <span className="ml-2 text-xs opacity-75">
                  • {new Date(headline.createdAt).toLocaleDateString()}
                </span>
              )}
            </span>
          ))}
        </span>
      </div>
      {/* Add CSS animation styles */}
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translate3d(-100%, 0, 0); }
          100% { transform: translate3d(100%, 0, 0); }
        }
        
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default MarqueeBanner;
