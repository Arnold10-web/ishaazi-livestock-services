import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  AlertCircle, 
  Loader2, 
  ArrowLeft, 
  Share2, 
  Calendar, 
  Clock,
  BookOpen,
  ChevronRight,
  X,
  Maximize,
  Printer,
  Facebook,
  Twitter,
  Linkedin,
  Link as LinkIcon
} from 'lucide-react';

const GoatPost = () => {
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentArticles, setRecentArticles] = useState([]);
  const [expandedImage, setExpandedImage] = useState(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [headings, setHeadings] = useState([]);
  const { id } = useParams();
  const articleRef = useRef(null);
  
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://ishaazi-livestock-services-production.up.railway.app';
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/content/goats/${id}`);
        setArticle(response.data.data);
        document.title = `${response.data.data.title} | Goat Articles`;
        
        const recentResponse = await axios.get(`${API_BASE_URL}/api/content/goats?limit=3&exclude=${id}&sort=-createdAt`);
        setRecentArticles(recentResponse.data.data || []);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching article:', err);
        setError('Failed to fetch article. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    window.scrollTo(0, 0);
  }, [id, API_BASE_URL]);

  useEffect(() => {
    if (!article?.content) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(article.content, 'text/html');
    const headingElements = Array.from(doc.querySelectorAll('h2, h3'));
    const extractedHeadings = headingElements.map((heading, index) => ({
      id: `heading-${index}`,
      text: heading.textContent,
      level: heading.tagName.toLowerCase(),
    }));
    setHeadings(extractedHeadings);

    headingElements.forEach((heading, index) => {
      heading.id = `heading-${index}`;
    });
    setArticle(prev => ({ ...prev, content: doc.body.innerHTML }));
  }, [article]);

  useEffect(() => {
    const handleScroll = () => {
      if (!articleRef.current) return;
      
      const articleHeight = articleRef.current.offsetHeight;
      const windowHeight = window.innerHeight;
      const scrollPosition = window.scrollY;
      const progress = (scrollPosition / (articleHeight - windowHeight)) * 100;
      setReadingProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(dateString));
  };

  const estimateReadTime = (content) => {
    if (!content) return '1 min read';
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return `${Math.ceil(wordCount / 200)} min read`;
  };

  const handleShare = (platform = null) => {
    const shareUrl = window.location.href;
    const shareTitle = article.title;
    const shareText = article.metadata?.description || article.title;

    if (platform) {
      let url = '';
      switch (platform) {
        case 'twitter':
          url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
          break;
        case 'facebook':
          url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
          break;
        case 'linkedin':
          url = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}&summary=${encodeURIComponent(shareText)}`;
          break;
        default:
          break;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    } else if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareUrl)
        .then(() => alert('Link copied to clipboard!'))
        .catch(console.error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const scrollToHeading = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 md:p-8 space-y-6">
                  <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="flex gap-4">
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                  <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" 
                           style={{ width: `${Math.random() * 30 + 70}%` }}></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm space-y-4">
                <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="h-16 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm space-y-4">
                <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md max-w-md w-full">
          <div className="flex items-center justify-center mb-6">
            <AlertCircle className="h-16 w-16 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-4">
            Oops! Something Went Wrong
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <div className="text-center">
            <Link 
              to="/goat" 
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Articles
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md max-w-md w-full text-center">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="h-16 w-16 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">Article Not Found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">The article you're looking for doesn't exist.</p>
          <Link 
            to="/goat" 
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Browse Articles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-purple-100 dark:bg-gray-700 z-50">
        <div 
          className="h-full bg-purple-600 transition-all duration-150" 
          style={{ width: `${readingProgress}%` }}
        ></div>
      </div>

      {/* Expanded Image Modal */}
      {expandedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <button 
            onClick={() => setExpandedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <X className="h-8 w-8" />
          </button>
          <div className="max-w-6xl max-h-[90vh] flex flex-col">
            <img 
              src={`${API_BASE_URL}${expandedImage}`} 
              alt="Expanded view" 
              className="max-w-full max-h-[80vh] object-contain"
            />
            {article.metadata?.imageCaption && (
              <p className="text-white text-center mt-4 text-sm italic">
                {article.metadata.imageCaption}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2">
            <Link 
              to="/goats" 
              className="inline-flex items-center text-gray-600 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400 mb-6 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Articles
            </Link>

            <article className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden" ref={articleRef}>
              <div className="p-6 md:p-8">
                <header className="mb-8">
                  {article.metadata?.category && (
                    <span className="inline-block bg-purple-50 dark:bg-purple-900 text-purple-700 dark:text-purple-200 px-3 py-1 rounded-full text-sm font-medium mb-4">
                      {article.metadata.category}
                    </span>
                  )}

                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                    {article.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-400 mb-6 text-sm">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-purple-500" />
                      <span>Published: {formatDate(article.createdAt)}</span>
                    </div>

                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-purple-500" />
                      <span>{estimateReadTime(article.content)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={() => handleShare()}
                      className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Share2 className="h-4 w-4" />
                      <span>Share</span>
                    </button>

                    <button 
                      onClick={handlePrint}
                      className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Printer className="h-4 w-4" />
                      <span>Print</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleShare('twitter')}
                        className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        aria-label="Share on Twitter"
                      >
                        <Twitter className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleShare('facebook')}
                        className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        aria-label="Share on Facebook"
                      >
                        <Facebook className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleShare('linkedin')}
                        className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        aria-label="Share on LinkedIn"
                      >
                        <Linkedin className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleShare()}
                        className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        aria-label="Copy link"
                      >
                        <LinkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </header>

                {article.imageUrl && (
                  <div className="mb-8 rounded-xl overflow-hidden relative group">
                    <img 
                      src={`${API_BASE_URL}${article.imageUrl}`} 
                      alt={article.title} 
                      className="w-full h-auto max-h-[500px] object-cover cursor-pointer"
                      crossOrigin="anonymous"
                      onClick={() => setExpandedImage(article.imageUrl)}
                    />
                    <button 
                      onClick={() => setExpandedImage(article.imageUrl)}
                      className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Expand image"
                    >
                      <Maximize className="h-5 w-5" />
                    </button>
                    {article.metadata?.imageCaption && (
                      <p className="text-center text-gray-500 dark:text-gray-400 italic mt-2 text-sm">
                        {article.metadata.imageCaption}
                      </p>
                    )}
                  </div>
                )}

                <div 
                  className="prose prose-lg max-w-none dark:prose-invert 
                    prose-img:rounded-lg prose-img:shadow-md prose-a:text-purple-600 dark:prose-a:text-purple-400
                    prose-headings:scroll-mt-20 print:prose-sm"
                  dangerouslySetInnerHTML={{ __html: article.content }} 
                />

                {article.metadata?.tags && article.metadata.tags.length > 0 && (
                  <footer className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex flex-wrap gap-2 items-center">
                      {article.metadata.tags.map((tag, index) => (
                        <span 
                          key={index} 
                          className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-1 rounded-full text-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </footer>
                )}
              </div>
            </article>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Table of Contents */}
            {headings.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm sticky top-6">
                <div className="flex items-center mb-6">
                  <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-3" />
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Table of Contents</h2>
                </div>
                <nav className="space-y-2">
                  {headings.map((heading) => (
                    <button
                      key={heading.id}
                      onClick={() => scrollToHeading(heading.id)}
                      className={`block text-left w-full px-2 py-1 rounded text-sm transition-colors
                        ${heading.level === 'h2' ? 'font-medium text-gray-800 dark:text-gray-200' : 'text-gray-600 dark:text-gray-400 ml-3'}
                        hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-700`}
                    >
                      {heading.text}
                    </button>
                  ))}
                </nav>
              </div>
            )}

            {/* Recent Articles */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-6">
                <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-3" />
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Articles</h2>
              </div>
              <div className="space-y-4">
                {recentArticles.length > 0 ? (
                  recentArticles.map(item => (
                    <Link 
                      key={item._id} 
                      to={`/goats/${item._id}`}
                      className="group block"
                    >
                      <div className="flex gap-4 items-start">
                        {item.imageUrl && (
                          <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden">
                            <img
                              src={`${API_BASE_URL}${item.imageUrl}`}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div>
                          <h3 className="text-sm font-medium text-gray-800 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                            {item.title}
                          </h3>
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <Calendar className="mr-1 h-3 w-3" />
                            <span>{formatDate(item.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No recent articles found</p>
                )}
              </div>
            </div>

            {/* Article Information */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-6">
                <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-3" />
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Article Information</h2>
              </div>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Reading Time</span>
                  <span className="font-medium text-gray-800 dark:text-white">{estimateReadTime(article.content)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Published</span>
                  <span className="font-medium text-gray-800 dark:text-white">{formatDate(article.createdAt)}</span>
                </div>
                {article.updatedAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Last Updated</span>
                    <span className="font-medium text-gray-800 dark:text-white">{formatDate(article.updatedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            font-size: 12pt;
          }
          .no-print {
            display: none !important;
          }
          a {
            text-decoration: underline;
            color: #0000EE;
          }
          a[href^="http"]:after {
            content: " (" attr(href) ")";
            font-size: 0.8em;
            font-weight: normal;
          }
          img {
            max-width: 100% !important;
            height: auto !important;
          }
        }
      `}</style>
    </div>
  );
};

export default GoatPost;