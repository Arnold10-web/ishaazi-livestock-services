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
    <section className="bg-white py-16 px-4">
      {/* Hero content */}
      <div className="section-container text-center mb-16 animate-fade-in-up">
        <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-primary-700 mb-6">
          Ishaazi Livestock Services
        </h1>
        <h2 className="text-xl md:text-2xl font-semibold text-secondary-500 mb-6">
          Empowering Farmers Through Knowledge
        </h2>
        <p className="text-body text-lg md:text-xl max-w-3xl mx-auto mb-10">
          Your trusted source for the latest news, trends, cutting-edge developments,
          expert insights, and in-depth analysis about the livestock industry.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/services"
            className="btn-primary"
          >
            Explore Services
          </Link>
          <Link
            to="/magazine"
            className="btn-secondary"
          >
            Read Our Magazine
          </Link>
        </div>
      </div>

      {/* Latest Blogs Section */}
      <div className="section-container mt-16 animate-fade-in">
        <div className="text-center mb-12">
          <Link to="/blog" className="text-3xl font-serif font-bold text-heading hover:text-primary-600 transition-colors duration-200 relative group">
            Latest Articles
            <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-accent-500 group-hover:w-full transition-all duration-300"></span>
          </Link>
          <p className="text-body mt-4 max-w-2xl mx-auto">
            Stay updated with the latest insights, tips, and news from the livestock industry
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {latestBlogs.map((blog) => (
            <article
              key={blog._id}
              className="blog-card"
            >
              <div className="overflow-hidden">
                <img
                  src={`${API_BASE_URL}${blog.imageUrl}`}
                  alt={blog.title}
                  className="blog-card-image hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="blog-card-content">
                <h3 className="blog-card-title">{blog.title}</h3>
                <p className="blog-card-excerpt">{truncateContent(blog.content)}</p>
                <Link
                  to={`/blog/${blog._id}`}
                  className="read-more-link"
                >
                  Read More
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;