import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Search, ArrowRight } from 'lucide-react';
import UnifiedSearchBar from '../components/UnifiedSearchBar';
import DynamicAdComponent from '../components/DynamicAdComponent';

// Import adSlots with error handling
let importedAdSlots;
try {
  const { adSlots } = require('../components/DynamicAdComponent');
  importedAdSlots = adSlots;
} catch (error) {
  console.warn('Failed to import adSlots:', error);
  importedAdSlots = null;
}

// Safe fallback for adSlots with comprehensive error handling
const defaultAdSlots = {
  header: { slot: '1234567890', format: 'horizontal', style: { minHeight: '90px' } },
  inContent: { slot: '1122334455', format: 'rectangle', style: { minHeight: '200px' } }
};

// Use imported adSlots with multiple safety checks
const adSlots = importedAdSlots || {};
const safeAdSlots = {
  header: (adSlots?.header && typeof adSlots.header === 'object' && adSlots.header.slot) 
    ? adSlots.header 
    : defaultAdSlots.header,
  inContent: (adSlots?.inContent && typeof adSlots.inContent === 'object' && adSlots.inContent.slot) 
    ? adSlots.inContent 
    : defaultAdSlots.inContent
};

const BlogPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const blogsPerPage = 9;

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/content/blogs`, {
          params: {
            page: currentPage,
            limit: blogsPerPage
          }
        });
        setBlogs(response.data.data.blogs);
        setError(null);
      } catch (err) {
        console.error('Error fetching blogs:', err);
        setError('Failed to fetch blogs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, [API_BASE_URL, currentPage]);

  // Handle search results
  const handleSearchResults = (results) => {
    setSearchResults(results);
    setIsSearching(true);
    setCurrentPage(1);
  };

  // Clear search results
  const clearSearch = () => {
    setSearchResults([]);
    setIsSearching(false);
    setCurrentPage(1);
  };

  // Determine which blogs to display
  const displayBlogs = isSearching ? searchResults : blogs;
  const indexOfLastBlog = currentPage * blogsPerPage;
  const indexOfFirstBlog = indexOfLastBlog - blogsPerPage;
  const currentBlogs = displayBlogs.slice(indexOfFirstBlog, indexOfLastBlog);
  const totalPages = Math.ceil(displayBlogs.length / blogsPerPage);

  // Featured article (first one)
  const featuredArticle = currentBlogs[0];
  const otherArticles = currentBlogs.slice(1);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const truncateContent = (content, maxLength = 150) => {
    if (!content) return '';
    const tempElement = document.createElement('div');
    tempElement.innerHTML = content;
    let text = tempElement.textContent || tempElement.innerText;
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="section-container section-padding">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-primary-700 mb-2">Loading Articles</h2>
              <p className="text-body">Please wait while we fetch the latest content...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="section-container section-padding">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-800 mb-2">Something went wrong</h2>
              <p className="text-body mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <main>
        {/* Wired.com inspired Header - Clean and Modern */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <h1 className="font-sans text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6 tracking-tight leading-none">
                Future Farm Intelligence: Where Innovation Meets Agriculture
              </h1>
              <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-light">
                Unlock tomorrow's farming secrets today. Expert insights, breakthrough strategies, and cutting-edge innovations that transform ordinary farms into agricultural powerhouses. Your competitive edge starts here.
              </p>
              <div className="mt-8 flex items-center justify-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  Updated Daily
                </span>
                <span>•</span>
                <span>{blogs.length} Articles</span>
                <span>•</span>
                <span>Expert Verified</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Copyblogger inspired Search Section - Content-focused */}
          <div className="py-8 border-b border-gray-100">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Find Your Next Read</h2>
                <p className="text-gray-600">Search through our comprehensive library of agricultural insights</p>
              </div>
              <UnifiedSearchBar
                contentType="blog"
                placeholder="Search articles, topics, or keywords..."
                onResults={handleSearchResults}
                showFilters={false}
                className="mb-6"
              />
              {isSearching && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-800 font-medium">
                      {searchResults.length} article{searchResults.length !== 1 ? 's' : ''} found
                    </span>
                    <button
                      onClick={clearSearch}
                      className="text-blue-700 hover:text-blue-800 font-medium underline"
                    >
                      Clear Search
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Container */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {currentBlogs.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-gray-600">
                {isSearching ? 'No articles found matching your search.' : 'No articles available.'}
              </p>
            </div>
          ) : (
            <>
              {/* Wired.com inspired Featured Article - Bold and Modern */}
              {featuredArticle && !isSearching && (
                <section className="py-6 border-b border-gray-100">
                  <div className="grid lg:grid-cols-12 gap-12 items-start">
                    <div className="lg:col-span-7 order-2 lg:order-1">
                      <div className="space-y-8">
                        <div className="flex items-center space-x-3">
                          <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
                            Featured
                          </div>
                          <div className="text-sm text-gray-500 font-medium">
                            {formatDate(featuredArticle.createdAt)}
                          </div>
                        </div>
                        <h2 className="font-sans text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight tracking-tight">
                          {featuredArticle.title}
                        </h2>
                        <p className="text-xl text-gray-700 leading-relaxed font-light">
                          {truncateContent(featuredArticle.content, 250)}
                        </p>
                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          {featuredArticle.author && (
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-700 font-semibold text-xs">
                                  {featuredArticle.author.charAt(0)}
                                </span>
                              </div>
                              <span className="font-medium">By {featuredArticle.author}</span>
                            </div>
                          )}
                          <span>•</span>
                          <span>{featuredArticle.readTime || 5} min read</span>
                          <span>•</span>
                          <span>{featuredArticle.views || 0} views</span>
                        </div>
                        <Link
                          to={`/blog/${featuredArticle._id}`}
                          className="inline-flex items-center space-x-3 bg-black text-white px-8 py-4 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-200 transform hover:scale-105"
                        >
                          <span>Read Full Article</span>
                          <ArrowRight className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>
                    <div className="lg:col-span-5 order-1 lg:order-2">
                      <div className="aspect-[4/3] overflow-hidden rounded-xl shadow-2xl">
                        <img
                          src={`${API_BASE_URL}${featuredArticle.imageUrl}`}
                          alt={featuredArticle.title}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                        />
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Header Advertisement */}
              <div className="py-6">
                <DynamicAdComponent 
                  adSlot={safeAdSlots.header.slot}
                  adFormat={safeAdSlots.header.format}
                  adStyle={safeAdSlots.header.style}
                />
              </div>

              {/* Modern Article Grid - Wired.com inspired layout */}
              <section className="py-8">
                <div className="mb-8">
                  <h2 className="text-3xl font-black text-gray-900 mb-4">Latest Stories</h2>
                  <div className="w-16 h-1 bg-blue-500"></div>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
                  {(isSearching ? currentBlogs : otherArticles).map((blog) => (
                    <article key={blog._id} className="group bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
                      <div className="aspect-[16/10] overflow-hidden bg-gray-100">
                        <img
                          src={`${API_BASE_URL}${blog.imageUrl}`}
                          alt={blog.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      </div>
                      <div className="p-6 space-y-4">
                        <div className="flex items-center space-x-3 text-xs font-medium">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {blog.category || 'Agriculture'}
                          </span>
                          <span className="text-gray-500">{formatDate(blog.createdAt)}</span>
                        </div>
                        <h3 className="font-sans text-xl md:text-2xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors leading-tight tracking-tight">
                          {blog.title}
                        </h3>
                        <p className="text-gray-600 leading-relaxed font-light text-lg">
                          {truncateContent(blog.content, 140)}
                        </p>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            {blog.author && <span>By {blog.author}</span>}
                            <span>•</span>
                            <span>{blog.readTime || 5} min</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-400">
                            <span>{blog.views || 0} views</span>
                          </div>
                        </div>
                        <Link
                          to={`/blog/${blog._id}`}
                          className="inline-flex items-center justify-center w-full bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 mt-4"
                        >
                          <span>Read Full Article</span>
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              {/* In-Content Advertisement */}
              <div className="py-8">
                <DynamicAdComponent 
                  adSlot={safeAdSlots.inContent.slot}
                  adFormat={safeAdSlots.inContent.format}
                  adStyle={safeAdSlots.inContent.style}
                />
              </div>
            </>
          )}
        </div>

        {/* Modern Pagination - Wired.com inspired */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 py-12 bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-center items-center space-x-4">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-gray-50 transition-all font-medium shadow-sm"
                >
                  ← Previous
                </button>

                <div className="flex items-center space-x-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-12 h-12 rounded-lg transition-all font-semibold shadow-sm ${
                          currentPage === pageNum
                            ? 'bg-gray-900 text-white shadow-lg'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-gray-50 transition-all font-medium shadow-sm"
                >
                  Next →
                </button>
              </div>

              <div className="text-center mt-6">
                <p className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages} • {displayBlogs.length} total articles
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BlogPage;
