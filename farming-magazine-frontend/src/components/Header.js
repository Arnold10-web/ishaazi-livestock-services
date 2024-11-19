// src/components/Header.js
import React from 'react';
import { Link } from 'react-router-dom';
import '../css/header.css';

const Header = ({ showAd }) => (
  <header>
    <div className="top-bar">
      <div className="left-links">
        <Link to="/auctions">Auctions</Link> | <Link to="/events">Events</Link> | <Link to="/advertise">Advertise</Link>
        | <Link to="/suppliers">Suppliers</Link> | <Link to="/subscribe">Subscribe</Link> | <Link to="/contact">Contact</Link>
      </div>
      <div className="social-icons">
        <a href="/"><img src="/images/facebook.png" alt="Facebook" /></a>
        <a href="/"><img src="/images/twitter.png" alt="Twitter" /></a>
        <a href="/"><img src="/images/instagram.png" alt="Instagram" /></a>
        <a href="/"><img src="/images/whatsapp.png" alt="Whatsapp" /></a>
        <a href="/"><img src="/images/linkedin.png" alt="Linkedin" /></a>
      </div>
    </div>

    <nav className="navbar">
      <div className="logo">
        <img src="/images/ishaazi.jpg" alt="Farmer's Weekly Logo" />
      </div>
      {showAd && (
        <div className="ad-banner">
          <img src="/images/advert.jpeg" alt="Advertisement Banner" />
        </div>
      )}
    </nav>

    <div className="categories">
      <Link to="/">Home</Link>
      <Link to="/news">News</Link>
      <Link to="/services">Services</Link>
      <Link to="/dairy">Dairy</Link>
      <Link to="/beef">Beef</Link>
      <Link to="/goats">Goats</Link>
      <Link to="/piggery">Piggery</Link>
      <Link to="/farm-basics">Farm Basics</Link>
      <Link to="/farms-for-sale">Farms For Sale</Link>
    </div>
  </header>
);

export default Header;
