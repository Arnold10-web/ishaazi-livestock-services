import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { CalendarDays, Clock, ArrowLeft, Share2, Twitter, Facebook, Linkedin, BookOpen, X } from 'lucide-react';
import RecentPosts from '../components/RecentPosts';

const NewsPost = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const articleRef = useRef(null);

  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentNews, setRecentNews] = useState([]);
  const [readingProgress, setReadingProgress] = useState(0);
  const [expandedImage, setExpandedImage] = useState(null);
  const [headings, setHeadings] = useState([]);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/content/news/${id}`);
        const data = res.data.data;

        const parser = new DOMParser();
        const doc = parser.parseFromString(data.content, 'text/html');
        const headingElements = Array.from(doc.querySelectorAll('h2, h3'));
        const extracted = headingElements.map((el, i) => ({
          id: `heading-${i}`,
          text: el.textContent,
          level: el.tagName.toLowerCase()
        }));

        headingElements.forEach((el, i) => (el.id = `heading-${i}`));
        data.content = doc.body.innerHTML;

        setNews(data);
        setHeadings(extracted);

        const recent = await axios.get(`${API_BASE_URL}/api/content/news?limit=3`);
        setRecentNews(recent.data.data.news.filter(n => n._id !== id));
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Could not load the article.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const onScroll = () => {
      if (!articleRef.current) return;
      const articleHeight = articleRef.current.offsetHeight;
      const scrollY = window.scrollY;
      const winHeight = window.innerHeight;
      const progress = (scrollY / (articleHeight - winHeight)) * 100;
      setReadingProgress(Math.min(100, Math.max(0, progress)));
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const formatDate = date => new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  const estimateReadTime = content => {
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return `${Math.ceil(wordCount / 200)} min read`;
  };

  const handleShare = platform => {
    const url = window.location.href;
    const title = news.title;
    const text = news.summary || title;

    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(text)}`;
        break;
      default:
        navigator.clipboard.writeText(url).then(() => alert('Link copied to clipboard!'));
        return;
    }
    window.open(shareUrl, '_blank');
  };

  const scrollToHeading = id => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleImageError = e => {
    e.target.src = '/placeholder-image.jpg';
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><span className="text-gray-600 dark:text-white">Loading...</span></div>;
  }

  if (error || !news) {
    return <div className="min-h-screen flex items-center justify-center text-center text-red-500">{error || 'News not found'}</div>;
  }

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
            onClick={() => navigate('/news')}
            className="inline-flex items-center px-4 py-2 text-sm text-blue-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to News
          </button>

          <article className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow">
            <div className="space-y-6">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{news.title}</h1>
              <div className="flex gap-4 text-gray-600 dark:text-gray-400 text-sm">
                <span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" /> {formatDate(news.createdAt)}</span>
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {estimateReadTime(news.content)}</span>
              </div>
              {news.imageUrl && (
                <img
                  src={`${API_BASE_URL}${news.imageUrl}`}
                  alt={news.title}
                  className="w-full rounded-lg cursor-pointer"
                  onClick={() => setExpandedImage(news.imageUrl)}
                  onError={handleImageError}
                />
              )}
              {news.summary && <p className="text-lg text-gray-700 dark:text-gray-300 italic">{news.summary}</p>}
              <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: news.content }} />
              <div className="flex gap-3 items-center pt-6 border-t border-gray-200 dark:border-gray-700">
                <button onClick={() => handleShare()} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  <Share2 className="h-4 w-4" /> Share
                </button>
                <button onClick={() => handleShare('twitter')} aria-label="Twitter"><Twitter className="h-4 w-4 text-gray-500" /></button>
                <button onClick={() => handleShare('facebook')} aria-label="Facebook"><Facebook className="h-4 w-4 text-gray-500" /></button>
                <button onClick={() => handleShare('linkedin')} aria-label="LinkedIn"><Linkedin className="h-4 w-4 text-gray-500" /></button>
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
          <RecentPosts posts={recentNews} themeColor="#3b82f6" />
        </aside>
      </div>
    </div>
  );
};

export default NewsPost;