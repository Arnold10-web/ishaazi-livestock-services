import React from 'react';
import { Helmet } from 'react-helmet';

/**
 * Enhanced SEO component with comprehensive structured data and meta tags
 */
const EnhancedSEO = ({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website',
  article = null,
  organization = null,
  breadcrumbs = [],
  faq = [],
  reviews = [],
  canonical = null
}) => {
  const baseUrl = process.env.REACT_APP_BASE_URL || 'https://ishaazilivestockservices.com';
  const fullUrl = url ? `${baseUrl}${url}` : baseUrl;
  const imageUrl = image ? (image.startsWith('http') ? image : `${baseUrl}${image}`) : `${baseUrl}/images/ishaazi.jpg`;

  // Default organization data
  const defaultOrganization = {
    "@type": "Organization",
    "name": "Ishaazi Livestock Services",
    "url": baseUrl,
    "logo": {
      "@type": "ImageObject",
      "url": `${baseUrl}/images/ishaazi.jpg`,
      "width": 400,
      "height": 400
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+256-XXX-XXXXXX",
      "contactType": "customer service",
      "availableLanguage": ["English", "Luganda"]
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "UG",
      "addressRegion": "Central Region",
      "addressLocality": "Kampala"
    },
    "sameAs": [
      "https://facebook.com/ishaazilivestockservices",
      "https://twitter.com/ishaazilivestock",
      "https://instagram.com/ishaazilivestockservices"
    ]
  };

  // Generate structured data
  const generateStructuredData = () => {
    const structuredData = [];

    // Organization
    structuredData.push({
      "@context": "https://schema.org",
      ...defaultOrganization,
      ...organization
    });

    // Website
    structuredData.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Ishaazi Livestock Services",
      "url": baseUrl,
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${baseUrl}/search?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    });

    // Article (if provided)
    if (article && type === 'article') {
      structuredData.push({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "description": description,
        "image": imageUrl,
        "author": {
          "@type": "Organization",
          "name": article.author || "Ishaazi Livestock Services"
        },
        "publisher": defaultOrganization,
        "datePublished": article.publishedAt || article.createdAt,
        "dateModified": article.updatedAt || article.createdAt,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": fullUrl
        },
        "keywords": Array.isArray(keywords) ? keywords.join(', ') : keywords,
        "articleSection": article.category || "Agriculture",
        "wordCount": article.wordCount || 0,
        "timeRequired": article.readTime || "PT5M"
      });
    }

    // Breadcrumbs
    if (breadcrumbs.length > 0) {
      structuredData.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbs.map((crumb, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": crumb.name,
          "item": `${baseUrl}${crumb.url}`
        }))
      });
    }

    // FAQ
    if (faq.length > 0) {
      structuredData.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faq.map(item => ({
          "@type": "Question",
          "name": item.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": item.answer
          }
        }))
      });
    }

    // Reviews/Ratings
    if (reviews.length > 0) {
      const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
      structuredData.push({
        "@context": "https://schema.org",
        "@type": "AggregateRating",
        "ratingValue": avgRating.toFixed(1),
        "reviewCount": reviews.length,
        "bestRating": 5,
        "worstRating": 1
      });
    }

    return structuredData;
  };

  // Generate keywords string
  const keywordsString = Array.isArray(keywords) 
    ? keywords.join(', ') 
    : keywords;

  // Default keywords for farming content
  const defaultKeywords = [
    'farming', 'agriculture', 'livestock', 'Uganda', 'East Africa',
    'sustainable farming', 'agricultural practices', 'livestock management'
  ];

  const allKeywords = Array.isArray(keywords) 
    ? [...new Set([...keywords, ...defaultKeywords])]
    : [...defaultKeywords, keywords].filter(Boolean);

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={allKeywords.join(', ')} />
      <meta name="author" content="Ishaazi Livestock Services" />
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonical || fullUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Ishaazi Livestock Services" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@ishaazilivestock" />
      <meta name="twitter:creator" content="@ishaazilivestock" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      
      {/* Article specific meta tags */}
      {article && type === 'article' && (
        <>
          <meta property="article:published_time" content={article.publishedAt || article.createdAt} />
          <meta property="article:modified_time" content={article.updatedAt || article.createdAt} />
          <meta property="article:author" content={article.author || "Ishaazi Livestock Services"} />
          <meta property="article:section" content={article.category || "Agriculture"} />
          {article.tags && article.tags.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Mobile and App Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
      <meta name="theme-color" content="#1B4332" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="Ishaazi Livestock" />
      
      {/* PWA Meta Tags */}
      <link rel="manifest" href="/manifest.json" />
      <link rel="apple-touch-icon" href="/images/icons/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/images/icons/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/images/icons/favicon-16x16.png" />
      
      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* DNS Prefetch */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      
      {/* Structured Data */}
      {generateStructuredData().map((data, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
      
      {/* Additional SEO Meta Tags */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="msapplication-TileColor" content="#1B4332" />
      <meta name="msapplication-config" content="/browserconfig.xml" />
      
      {/* Language and Region */}
      <meta httpEquiv="content-language" content="en-US" />
      <meta name="geo.region" content="UG" />
      <meta name="geo.placename" content="Uganda" />
      
      {/* Cache Control */}
      <meta httpEquiv="cache-control" content="public, max-age=31536000" />
      
      {/* Security Headers */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-Frame-Options" content="DENY" />
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      
      {/* Performance Hints */}
      <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
    </Helmet>
  );
};

export default EnhancedSEO;
