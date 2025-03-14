import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const HeroSection = () => {
  const [latestBlogs, setLatestBlogs] = useState([]);
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchLatestBlogs = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/content/blogs?limit=3`);
        setLatestBlogs(response.data.data.blogs);
      } catch (error) {
        console.error('Error fetching latest blogs:', error);
      }
    };

    fetchLatestBlogs();
  }, []);

  const truncateContent = (content, maxLength = 100) => {
    if (!content) return '';
    const tempElement = document.createElement('div');
    tempElement.innerHTML = content;
    let text = tempElement.textContent || tempElement.innerText;
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <section className="bg-gradient-to-br from-gray-50 to-white py-16 px-4">
      {/* Hero content */}
      <div className="max-w-6xl mx-auto text-center mb-16 animate-fade-in-up">
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-green-700 mb-6">
          Ishaazi Livestock Services, Empowering Farmers
        </h1>
        <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto mb-10">
          Welcome to Ishaazi Livestock Services, your go-to source for the latest news, trends,
          cutting-edge developments, expert insights, and in-depth analysis about the livestock industry.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/services" 
            className="px-8 py-3 bg-amber-500 text-white font-medium rounded-full hover:bg-amber-600 transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Explore Services
          </Link>
          <Link 
            to="/magazine" 
            className="px-8 py-3 bg-transparent text-green-700 font-medium border-2 border-green-700 rounded-full hover:bg-green-700 hover:text-white transform hover:-translate-y-1 transition-all duration-300"
          >
            Read Our Magazine
          </Link>
        </div>
      </div>

      {/* Latest Blogs Section */}
      <div className="max-w-6xl mx-auto mt-16 animate-fade-in">
        <div className="flex justify-center mb-10">
          <Link to="/blog" className="text-2xl font-serif font-bold text-green-700 hover:text-green-800 transition-colors duration-300 relative group">
            Our Blogs
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 group-hover:w-full transition-all duration-300"></span>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {latestBlogs.map((blog) => (
            <div 
              key={blog._id} 
              className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="overflow-hidden">
                <img 
                  src={`${API_BASE_URL}${blog.imageUrl}`} 
                  alt={blog.title} 
                  className="w-full h-48 object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-green-700 mb-3">{blog.title}</h3>
                <p className="text-gray-600 mb-4">{truncateContent(blog.content)}</p>
                <Link 
                  to={`/blog/${blog._id}`} 
                  className="text-amber-500 font-medium hover:text-amber-600 transition-colors duration-300 inline-flex items-center"
                >
                  Read More
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;