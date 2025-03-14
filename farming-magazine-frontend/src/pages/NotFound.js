import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="not-found-container">
      <h1>404 - Page Not Found</h1>
      <p>Oops! The page you are looking for does not exist.</p>
      <p>It might have been moved or deleted.</p>
      <Link to="/" className="home-link">Go back to Homepage</Link>
    </div>
  );
};

export default NotFound;