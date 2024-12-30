import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../css/header.css';

const Header = ({ showAd, adBannerUrl }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    // Add or remove the 'menu-open' class to the body when menu state changes
    if (menuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }

    // Cleanup function to remove the class when component unmounts
    return () => {
      document.body.classList.remove('menu-open');
    };
  }, [menuOpen]);

  return (
    <header>
      <div className="top-bar">
        <div className="left-links">
          <Link to="/auctions">Auctions</Link>
          <Link to="/events">Events</Link>
          <Link to="/advertise">Advertise</Link>
          <Link to="/suppliers">Suppliers</Link>
          <Link to="/subscribe">Subscribe</Link>
          <Link to="/contact">Contact</Link>
        </div>
        <div className="social-icons">
          {[
            { platform: 'facebook', url: 'https://facebook.com/yourpage' },
            { platform: 'twitter', url: 'https://twitter.com/yourpage' },
            { platform: 'instagram', url: 'https://instagram.com/yourpage' },
            { platform: 'whatsapp', url: 'https://wa.me/yournumber' },
            { platform: 'linkedin', url: 'https://linkedin.com/in/yourprofile' },
          ].map(({ platform, url }) => (
            <a
              key={platform}
              href={url}
              aria-label={platform}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={`/images/${platform}.png`} alt={`${platform} icon`} />
            </a>
          ))}
        </div>
      </div>

      <nav className="navbar">
        <div className="logo">
          <img src="/images/ishaazi.jpg" alt="Farmer's Weekly Logo" />
        </div>
        {showAd && (
          <div className="ad-banner">
            <img src={adBannerUrl || '/images/advert.jpeg'} alt="Advertisement Banner" />
          </div>
        )}
        <button className="menu-toggle" onClick={toggleMenu} aria-label="Toggle menu">
          ☰
        </button>
      </nav>

      <div className={`categories ${menuOpen ? 'active' : ''}`}>
        <Link to="/">Home</Link>
        <Link to="/news">News</Link>
        <Link to="/services">Services</Link>
        <Link to="/dairy">Dairy</Link>
        <Link to="/beef">Beef</Link>
        <Link to="/goats">Goats</Link>
        <Link to="/piggery">Piggery</Link>
        <Link to="/basic">Farm Basics</Link>
        <Link to="/farm">Farms For Sale</Link>
      </div>
    </header>
  );
};

export default Header;