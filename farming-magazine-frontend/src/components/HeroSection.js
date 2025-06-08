import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Users, BookOpen } from 'lucide-react';
import AdBanner from './AdBanner';
import { SponsoredContent } from './AdPlacement';

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
    <section className="bg-gradient-to-br from-[#F5F5DC] via-white to-[#F0F8E8] py-16 px-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-[#2D5016] rounded-full"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-[#DAA520] rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[#8B4513] rounded-full"></div>
      </div>

      {/* Hero content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-6xl mx-auto text-center mb-16 relative z-10"
      >
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-[#2D5016] mb-6 leading-tight"
        >
          Ishaazi Livestock Services
          <span className="block text-[#DAA520] text-3xl md:text-4xl lg:text-5xl mt-2">
            Empowering Farmers
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-gray-700 text-lg md:text-xl max-w-4xl mx-auto mb-8 leading-relaxed"
        >
          Your comprehensive source for the latest agricultural news, expert insights,
          cutting-edge farming techniques, and in-depth analysis of the livestock industry.
          Join thousands of farmers building a sustainable future.
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="flex flex-wrap justify-center gap-8 mb-10"
        >
          <div className="flex items-center gap-2 text-[#2D5016]">
            <Users className="h-5 w-5 text-[#DAA520]" />
            <span className="font-bold text-lg">10K+</span>
            <span className="text-sm">Farmers</span>
          </div>
          <div className="flex items-center gap-2 text-[#2D5016]">
            <BookOpen className="h-5 w-5 text-[#DAA520]" />
            <span className="font-bold text-lg">500+</span>
            <span className="text-sm">Articles</span>
          </div>
          <div className="flex items-center gap-2 text-[#2D5016]">
            <TrendingUp className="h-5 w-5 text-[#DAA520]" />
            <span className="font-bold text-lg">95%</span>
            <span className="text-sm">Success Rate</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            to="/services"
            className="group px-8 py-4 bg-gradient-to-r from-[#DAA520] to-[#B8860B] text-white font-semibold rounded-full hover:from-[#B8860B] hover:to-[#DAA520] transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            Explore Services
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/magazine"
            className="px-8 py-4 bg-transparent text-[#2D5016] font-semibold border-2 border-[#2D5016] rounded-full hover:bg-[#2D5016] hover:text-white transform hover:-translate-y-1 transition-all duration-300"
          >
            Read Our Magazine
          </Link>
        </motion.div>
      </motion.div>

      {/* Strategic Ad Placement */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.8 }}
        className="max-w-6xl mx-auto mb-16"
      >
        <AdBanner
          position="inline"
          size="banner"
          category="farming"
          showCloseButton={false}
          autoRotate={true}
          rotationInterval={60000}
        />
      </motion.div>

      {/* Latest Blogs Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="max-w-6xl mx-auto mt-16"
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#2D5016] mb-4">
            Latest Agricultural Insights
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
            Stay informed with our expert analysis, practical tips, and industry updates
          </p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-[#DAA520] font-semibold hover:text-[#B8860B] transition-colors group"
          >
            View All Articles
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {latestBlogs.map((blog, index) => (
            <motion.div
              key={blog._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 + index * 0.1, duration: 0.6 }}
              className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-[#2D5016] border-opacity-10"
            >
              <div className="relative overflow-hidden">
                <img
                  src={`${API_BASE_URL}${blog.imageUrl}`}
                  alt={blog.title}
                  className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-[#2D5016] mb-3 line-clamp-2 group-hover:text-[#DAA520] transition-colors">
                  {blog.title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-3">{truncateContent(blog.content)}</p>
                <Link
                  to={`/blog/${blog._id}`}
                  className="inline-flex items-center gap-2 text-[#DAA520] font-semibold hover:text-[#B8860B] transition-colors group-hover:gap-3"
                >
                  Read More
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Sponsored Content Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.8 }}
        className="max-w-6xl mx-auto mt-16"
      >
        <SponsoredContent
          title="Boost Your Farm Productivity with Smart Technology"
          description="Discover how modern IoT sensors and data analytics can increase your crop yields by up to 30% while reducing water usage and operational costs."
          sponsorName="AgriTech Solutions"
          clickUrl="https://example-agritech.com"
          imageUrl="/images/smart-farming.jpg"
          className="mb-8"
        />
      </motion.div>
    </section>
  );
};

export default HeroSection;