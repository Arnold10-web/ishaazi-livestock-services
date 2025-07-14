import React from "react";
import { Link } from "react-router-dom";
import tw from "twin.macro";
import styled from "styled-components";
import { motion } from "framer-motion";
import { Calendar, Clock } from "lucide-react";

const RecentPostsContainer = styled.div(({ themeColor }) => [
  tw`mt-6 lg:mt-0 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm`,
  `
    h2 {
      color: ${themeColor};
    }
    .post-item:hover h3 {
      color: ${themeColor};
    }
  `
]);

const PostItem = styled(motion.div)`
  ${tw`flex gap-4 mb-6 last:mb-0 cursor-pointer`}
  transition: transform 0.2s ease-in-out;
  &:hover {
    transform: translateY(-2px);
  }
`;

const PostImage = styled.div`
  ${tw`h-20 w-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-700`}
  img {
    ${tw`w-full h-full object-cover`}
  }
`;

const PostContent = tw.div`flex-1 flex flex-col justify-between`;
const PostTitle = tw.h3`text-base font-medium text-gray-900 dark:text-white line-clamp-2 transition-colors duration-200`;
const PostMeta = tw.div`flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400`;

const RecentPosts = ({ posts, themeColor = "#3b82f6", contentType = "blogs" }) => {
  if (!Array.isArray(posts) || posts.length === 0) {
    return null;
  }

  // Format date in a readable format
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  // Estimate read time based on content length
  const estimateReadTime = (content) => {
    if (!content) return '1 min';
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return `${Math.max(1, Math.ceil(wordCount / 200))} min`;
  };

  // Generate link path based on content type
  const getPostLink = (post) => {
    const id = post._id;
    // Singular form for URL paths
    const singularContentType = contentType.endsWith('s') 
      ? contentType.slice(0, -1) 
      : contentType;
    
    return `/${singularContentType}/${id}`;
  };

  return (
    <RecentPostsContainer themeColor={themeColor}>
      <div className="flex items-center mb-6">
        <h2 className="text-lg font-semibold">Recent Articles</h2>
      </div>
      
      <div className="space-y-6">
        {posts.map((post, index) => (
          <Link to={getPostLink(post)} key={index}>
            <PostItem 
              className="post-item"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <PostImage>
                {post.imageUrl ? (
                  <img 
                    src={post.imageUrl.startsWith('http') ? post.imageUrl : `${process.env.REACT_APP_API_URL || 'https://ishaazi-livestock-services-production.up.railway.app'}${post.imageUrl}`} 
                    alt={post.title} 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder-image.jpg';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">No image</span>
                  </div>
                )}
              </PostImage>
              
              <PostContent>
                <PostTitle>{post.title}</PostTitle>
                
                <PostMeta>
                  <span className="flex items-center">
                    <Calendar className="mr-1 h-3 w-3" />
                    {formatDate(post.createdAt)}
                  </span>
                  
                  {post.content && (
                    <span className="flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      {estimateReadTime(post.content)}
                    </span>
                  )}
                </PostMeta>
              </PostContent>
            </PostItem>
          </Link>
        ))}
      </div>
    </RecentPostsContainer>
  );
};

export default RecentPosts;