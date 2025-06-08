import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Search, Calendar, User, ArrowRight } from 'lucide-react';

const NewsPage = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const newsPerPage = 9;

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/content/news`, {
          params: {
            page: currentPage,
            limit: newsPerPage
          }
        });
        setNews(response.data.data.news);
        setError(null);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('Failed to fetch news. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [API_BASE_URL, currentPage]);

  const filteredNews = news.filter(article =>
    article.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.summary?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLast = currentPage * newsPerPage;
  const indexOfFirst = indexOfLast - newsPerPage;
  const currentNews = filteredNews.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredNews.length / newsPerPage);

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
              <h2 className="text-xl font-semibold text-primary-700 mb-2">Loading News</h2>
              <p className="text-body">Please wait while we fetch the latest updates...</p>
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
            Latest News
          </h1>
          <p className="text-body text-lg md:text-xl max-w-3xl mx-auto">
            Stay informed with breaking news, market updates, and important developments in agriculture and livestock farming.
          </p>
        </div>

        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search news..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-neutral-800 placeholder-neutral-500"
            />
          </div>
        </div>
        {/* News Grid */}
        <div className="mb-12">
          {currentNews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-body text-lg">No news articles found matching your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentNews.map((article) => (
                <article key={article._id} className="blog-card">
                  <div className="overflow-hidden">
                    <img
                      src={`${API_BASE_URL}${article.imageUrl}`}
                      alt={article.title}
                      className="blog-card-image hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="blog-card-content">
                    <div className="blog-card-meta">
                      <span>{formatDate(article.createdAt)}</span>
                      {article.author && <span> • By {article.author}</span>}
                    </div>
                    <h3 className="blog-card-title">{article.title}</h3>
                    <p className="blog-card-excerpt">{truncateContent(article.summary || article.content)}</p>
                    <Link
                      to={`/news/${article._id}`}
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

export default NewsPage;
