// ========================
// Redesigned PiggeryPost.js
// ========================

import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  CalendarDays, Clock, ArrowLeft, Share2, Twitter, Facebook, Linkedin, BookOpen, X
} from 'lucide-react';
import RecentPosts from '../components/RecentPosts';

const PiggeryPost = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const articleRef = useRef(null);

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [readingProgress, setReadingProgress] = useState(0);
  const [headings, setHeadings] = useState([]);
  const [expandedImage, setExpandedImage] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/content/piggeries/${id}`);
        const data = res.data.data;

        const parser = new DOMParser();
        const doc = parser.parseFromString(data.content, 'text/html');
        const headingElements = Array.from(doc.querySelectorAll('h2, h3'));
        headingElements.forEach((el, i) => (el.id = `heading-${i}`));
        const extracted = headingElements.map((el, i) => ({
          id: `heading-${i}`,
          text: el.textContent,
          level: el.tagName.toLowerCase()
        }));
        data.content = doc.body.innerHTML;

        setPost(data);
        setHeadings(extracted);

        const recent = await axios.get(`${API_BASE_URL}/api/content/piggeries?limit=3`);
        setRecentPosts(recent.data.data.piggeries.filter(p => p._id !== id));
      } catch (err) {
        console.error(err);
        setError('Unable to load piggery details.');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
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

  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  const estimateReadTime = (html) => {
    const text = html.replace(/<[^>]*>/g, '');
    return `${Math.ceil(text.split(/\s+/).length / 200)} min read`;
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const title = post.title;
    const text = post.subtitle || post.title;
    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
        break;
      default:
        navigator.clipboard.writeText(url).then(() => alert('Link copied!'));
        return;
    }
    window.open(shareUrl, '_blank');
  };

  const scrollToHeading = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleImageError = (e) => {
    e.target.src = '/placeholder-image.jpg';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <span className="text-gray-500 dark:text-white">Loading piggery...</span>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 bg-gray-50 dark:bg-gray-900">
        {error || 'Post not found'}
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <motion.div style={{ width: `${readingProgress}%` }} className="fixed top-0 left-0 h-1 bg-blue-600 z-50" />

      {expandedImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <button onClick={() => setExpandedImage(null)} className="absolute top-4 right-4 text-white">
            <X className="h-8 w-8" />
          </button>
          <img
            src={`${API_BASE_URL}${expandedImage}`}
            alt="Expanded"
            className="max-w-full max-h-[80vh] object-contain"
            onError={handleImageError}
          />
        </div>
      )}

      <div className="container mx-auto px-4 py-12 max-w-6xl grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8" ref={articleRef}>
          <button
            onClick={() => navigate('/piggery')}
            className="inline-flex items-center px-4 py-2 text-sm text-blue-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Piggery
          </button>

          <article className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow">
            <div className="space-y-6">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{post.title}</h1>
              <div className="flex gap-4 text-gray-600 dark:text-gray-400 text-sm">
                <span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" /> {formatDate(post.createdAt)}</span>
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {estimateReadTime(post.content)}</span>
              </div>
              {post.imageUrl && (
                <img
                  src={`${API_BASE_URL}${post.imageUrl}`}
                  alt={post.title}
                  className="w-full rounded-lg cursor-pointer"
                  onClick={() => setExpandedImage(post.imageUrl)}
                  onError={handleImageError}
                />
              )}
              {post.subtitle && <p className="text-lg text-gray-700 dark:text-gray-300 italic">{post.subtitle}</p>}
              <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                {post.breedingInfo?.map((item, i) => (
                  <div key={i} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700">
                    <h3 className="font-bold text-gray-800 dark:text-white">{item.label}</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
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
          <RecentPosts posts={recentPosts} themeColor="#3b82f6" />
        </aside>
      </div>
    </div>
  );
};

export default PiggeryPost;
