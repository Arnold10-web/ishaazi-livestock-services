import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ArticleDetailTemplate from '../components/ArticleDetailTemplate';

const BlogPost = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [expandedImage, setExpandedImage] = useState(null);
  const [headings, setHeadings] = useState([]);

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

        // Fetch related posts based on tags or category
        const relatedResponse = await axios.get(`${API_BASE_URL}/api/content/blogs?limit=6`);
        const relatedPosts = relatedResponse.data.data.blogs
          .filter(post => post._id !== id)
          .filter(post => 
            post.tags?.some(tag => blogData.tags?.includes(tag)) ||
            post.category === blogData.category
          )
          .slice(0, 3);
        setRelatedPosts(relatedPosts);

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

  const handleImageClick = (imageUrl) => {
    setExpandedImage(imageUrl);
  };

  const handleCloseImage = () => {
    setExpandedImage(null);
  };

  return (
    <ArticleDetailTemplate
      article={blog}
      contentType="blogs"
      loading={loading}
      error={error}
      headings={headings}
      recentPosts={recentPosts}
      relatedPosts={relatedPosts}
      backPath="/blog"
      backLabel="Blog"
      onImageClick={handleImageClick}
      expandedImage={expandedImage}
      onCloseImage={handleCloseImage}
    />
  );
};

export default BlogPost;
