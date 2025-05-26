// ========================
// Redesigned BlogPost.js
// ========================

import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  AlertCircle, Loader2, Calendar, Clock, ArrowLeft, Share2, Facebook,
  Twitter, Linkedin, Link as LinkIcon, BookOpen, X, Maximize
} from 'lucide-react';
import { motion } from 'framer-motion';
import RecentPosts from '../components/RecentPosts';

const BlogPost = () => {
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [expandedImage, setExpandedImage] = useState(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [headings, setHeadings] = useState([]);
  const { id } = useParams();
  const articleRef = useRef(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/content/blogs/${id}`);
        const blogData = response.data.data;

        if (blogData?.content) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(blogData.content, 'text/html');
          const headingElements = Array.from(doc.querySelectorAll('h2, h3'));
          const extractedHeadings = headingElements.map((heading, index) => ({
            id: `heading-${index}`,
            text: heading.textContent,
            level: heading.tagName.toLowerCase(),
          }));

          headingElements.forEach((heading, index) => {
            heading.id = `heading-${index}`;
          });

          blogData.content = doc.body.innerHTML;
          setHeadings(extractedHeadings);
        }

        setBlog(blogData);
        document.title = `${blogData.title} | Your Blog Name`;

        const recentResponse = await axios.get(`${API_BASE_URL}/api/content/blogs?limit=3`);
        const filteredRecentPosts = recentResponse.data.data.blogs.filter(post => post._id !== id);
        setRecentPosts(filteredRecentPosts);

        setError(null);
      } catch (err) {
        console.error('Error fetching blog:', err);
        setError('Failed to fetch blog. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    window.scrollTo(0, 0);
  }, [id, API_BASE_URL]);

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

  const formatDate = (dateString) => new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  }).format(new Date(dateString));

  const estimateReadTime = (content) => {
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return `${Math.ceil(wordCount / 200)} min read`;
  };

  const handleShare = (platform = null) => {
    const shareUrl = window.location.href;
    const shareTitle = blog?.title || 'Blog Post';
    const shareText = blog?.subtitle || blog?.title || 'Check out this blog post';

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
        if (navigator.share) {
          navigator.share({ title: shareTitle, text: shareText, url: shareUrl }).catch(console.error);
        } else {
          navigator.clipboard.writeText(shareUrl).then(() => alert('Link copied to clipboard!')).catch(console.error);
        }
        return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const scrollToHeading = (id) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = '/placeholder-image.jpg';
    e.target.alt = 'Image not available';
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md max-w-md w-full text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Error Loading Article</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
        <Link to="/blog" className="text-blue-600 hover:underline">Return to Blog</Link>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <motion.div style={{ width: `${readingProgress}%` }} className="fixed top-0 left-0 h-1 bg-blue-600 z-50" />

      {expandedImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <button onClick={() => setExpandedImage(null)} className="absolute top-4 right-4 text-white">
            <X className="h-8 w-8" />
          </button>
          <img src={`${API_BASE_URL}${expandedImage}`} alt="Expanded" className="max-w-full max-h-[80vh] object-contain" onError={handleImageError} />
        </div>
      )}

      <div className="container mx-auto px-4 py-12 max-w-6xl grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8" ref={articleRef}>
          <button
            onClick={() => navigate('/blog')}
            className="inline-flex items-center px-4 py-2 text-sm text-blue-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Blog
          </button>

          <article className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow">
            <div className="space-y-6">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{blog.title}</h1>
              <div className="flex gap-4 text-gray-600 dark:text-gray-400 text-sm">
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {formatDate(blog.publishedAt || blog.createdAt)}</span>
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {estimateReadTime(blog.content)}</span>
              </div>

              {blog.imageUrl && (
                <img
                  src={`${API_BASE_URL}${blog.imageUrl}`}
                  alt={blog.title}
                  className="w-full rounded-lg cursor-pointer"
                  onClick={() => setExpandedImage(blog.imageUrl)}
                  onError={handleImageError}
                />
              )}

              {blog.subtitle && <p className="text-lg text-gray-700 dark:text-gray-300 italic">{blog.subtitle}</p>}
              <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: blog.content }} />

              <div className="flex gap-2 flex-wrap">
                {blog.tags?.map((tag, i) => (
                  <span key={i} className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm text-gray-700 dark:text-gray-300">#{tag}</span>
                ))}
              </div>

              <div className="flex gap-3 items-center pt-6 border-t border-gray-200 dark:border-gray-700">
                <button onClick={() => handleShare()} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  <Share2 className="h-4 w-4" /> Share
                </button>
                <button onClick={() => handleShare('twitter')} aria-label="Share on Twitter"><Twitter className="h-4 w-4 text-gray-500" /></button>
                <button onClick={() => handleShare('facebook')} aria-label="Share on Facebook"><Facebook className="h-4 w-4 text-gray-500" /></button>
                <button onClick={() => handleShare('linkedin')} aria-label="Share on LinkedIn"><Linkedin className="h-4 w-4 text-gray-500" /></button>
              </div>
            </div>
          </article>
        </div>

        <aside className="space-y-6 sticky top-20 self-start">
          {headings.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
              <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white flex items-center"><BookOpen className="w-5 h-5 mr-2" /> Table of Contents</h2>
              <nav className="space-y-2">
                {headings.map(heading => (
                  <button
                    key={heading.id}
                    onClick={() => scrollToHeading(heading.id)}
                    className={`block w-full text-left text-sm px-3 py-1 rounded hover:bg-blue-50 dark:hover:bg-gray-700 ${heading.level === 'h3' ? 'ml-4 text-gray-500' : 'text-gray-800 dark:text-white'}`}
                  >
                    {heading.text}
                  </button>
                ))}
              </nav>
            </div>
          )}
          <RecentPosts posts={recentPosts} themeColor="#3b82f6" />
        </aside>
      </div>
    </div>
  );
};

export default BlogPost;
