import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Search, Calendar, User, ArrowRight } from 'lucide-react';
import UnifiedSearchBar from '../components/UnifiedSearchBar';

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
      <main className="section-container section-padding">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-heading mb-6">
            Blog Articles
          </h1>
          <p className="text-body text-lg md:text-xl max-w-3xl mx-auto">
            Discover expert insights, practical tips, and the latest trends in modern farming and livestock management.
          </p>
        </div>

        {/* Enhanced Search Section */}
        <div className="max-w-4xl mx-auto mb-12">
          <UnifiedSearchBar
            contentType="blog"
            placeholder="Search blog articles..."
            onResults={handleSearchResults}
            showFilters={true}
            className="mb-4"
          />

          {isSearching && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-600">
                Showing {searchResults.length} search result{searchResults.length !== 1 ? 's' : ''}
              </p>
              <button
                onClick={clearSearch}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>

        {/* Articles Grid */}
        <div className="mb-12">
          {currentBlogs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-body text-lg">
                {isSearching ? 'No articles found matching your search.' : 'No articles available.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentBlogs.map((blog) => (
                <article key={blog._id} className="blog-card">
                  <div className="overflow-hidden">
                    <img
                      src={`${API_BASE_URL}${blog.imageUrl}`}
                      alt={blog.title}
                      className="blog-card-image hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="blog-card-content">
                    <div className="blog-card-meta">
                      <span>{formatDate(blog.createdAt)}</span>
                      {blog.author && <span> • By {blog.author}</span>}
                    </div>
                    <h3 className="blog-card-title">{blog.title}</h3>
                    <p className="blog-card-excerpt">{truncateContent(blog.content)}</p>
                    <Link
                      to={`/blog/${blog._id}`}
                      className="read-more-link"
                    >
                      Read More
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-6 py-2 bg-white border border-neutral-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-neutral-700 hover:bg-neutral-50 transition-colors duration-200"
            >
              Previous
            </button>

            <span className="px-4 py-2 text-neutral-600">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-6 py-2 bg-white border border-neutral-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-neutral-700 hover:bg-neutral-50 transition-colors duration-200"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default BlogPage;
