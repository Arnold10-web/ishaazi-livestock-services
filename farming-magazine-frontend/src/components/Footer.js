// src/components/Footer.js
import React from 'react';
import '../css/footer.css';

const Footer = () => (
  <footer className="footer bg-footer-green">
    <div className="footer-container">
      <div className="footer-column">
        <h5>About Farmer's Weekly</h5>
        <p>Farmer's Weekly provides insights into the latest in agriculture, offering expert advice and industry trends.</p>
      </div>

      <div className="footer-column">
        <h5>Quick Links</h5>
        <ul>
          <li><a href="/auctions" className="footer-link">Auctions</a></li>
          <li><a href="/events" className="footer-link">Events</a></li>
          <li><a href="/advertise" className="footer-link">Advertise</a></li>
          <li><a href="/contact" className="footer-link">Contact Us</a></li>
        </ul>
      </div>

      <div className="footer-column">
        <h5>Resources</h5>
        <ul>
          <li><a href="/farm-basics" className="footer-link">Farm Basics</a></li>
          <li><a href="/news" className="footer-link">Agriculture News</a></li>
          <li><a href="/guides" className="footer-link">Farming Guides</a></li>
          <li><a href="/farms-for-sale" className="footer-link">Farms for Sale</a></li>
        </ul>
      </div>

      <div className="footer-column">
        <h5>Subscribe to Our Newsletter</h5>
        <p>Stay updated with the latest farming news and tips. Subscribe now!</p>
        <form className="subscribe-form">
          <input type="email" placeholder="Enter your email" required />
          <button type="submit" className="btn-subscribe">Subscribe</button>
        </form>
      </div>

      <div className="footer-column social-media">
        <h5>Follow Us</h5>
        <div className="social-links">
          <a href="#"><img src="/images/facebook.png" alt="Facebook" className="social-icon" /></a>
          <a href="#"><img src="/images/twitter.png" alt="Twitter" className="social-icon" /></a>
          <a href="#"><img src="/images/instagram.png" alt="Instagram" className="social-icon" /></a>
          <a href="#"><img src="/images/linkedin.png" alt="LinkedIn" className="social-icon" /></a>
          <a href="#"><img src="/images/whatsapp.png" alt="WhatsApp" className="social-icon" /></a>
        </div>
      </div>
    </div>
    <div className="footer-copyright">
      &copy; 2024 Farmer's Weekly. All rights reserved.
    </div>
  </footer>
);

export default Footer;
