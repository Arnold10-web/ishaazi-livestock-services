import React from 'react';
import { Helmet } from 'react-helmet';

/**
 * SEO component for managing all document head changes
 * 
 * @param {Object} props
 * @param {string} props.title - The title of the page
 * @param {string} props.description - Meta description
 * @param {string} props.canonical - Canonical URL
 * @param {Array} props.keywords - Keywords for meta tag
 * @param {string} props.image - Image URL for social sharing
 * @param {string} props.type - Content type (article, website, etc)
 * @param {string} props.url - Current URL
 * @param {Object} props.structuredData - Structured data for the page
 */
const SEOHelmet = ({
  title = 'Ishaazi Livestock Services | Farming Magazine',
  description = 'Latest insights and information on agriculture, livestock, and farming practices in Uganda and East Africa.',
  canonical = '',
  keywords = [],
  image = '/images/ishaazi.jpg',
  type = 'website',
  url = '',
  structuredData = null
}) => {
  const site = 'Ishaazi Livestock Services';
  const baseUrl = process.env.REACT_APP_BASE_URL || 'https://ishaaziservices.com';
  const fullUrl = url ? `${baseUrl}${url}` : baseUrl;
  const imageUrl = image.startsWith('http') ? image : `${baseUrl}${image}`;

  // Ensure keywords is always an array
  const keywordsArray = Array.isArray(keywords) 
    ? keywords 
    : (typeof keywords === 'string' && keywords.trim()) 
      ? keywords.split(',').map(k => k.trim()).filter(k => k)
      : [];

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywordsArray.length > 0 && <meta name="keywords" content={keywordsArray.join(', ')} />}
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={`${baseUrl}${canonical}`} />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:site_name" content={site} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      
      {/* Structured Data / JSON-LD */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
      
      {/* Mobile Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
      <meta name="theme-color" content="#C8F336" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    </Helmet>
  );
};

export default SEOHelmet;
