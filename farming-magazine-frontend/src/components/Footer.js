import React, { useState } from 'react';
import axios from 'axios';
import API_ENDPOINTS from '../config/apiConfig';
import '../css/footer.css';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Email Validation
    const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
    if (!isValidEmail(email)) {
      setMessage('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    // Add hidden honeypot field for spam protection (not displayed in the form)
    const honeypotValue = document.querySelector('input[name="hidden-field"]')?.value;
    if (honeypotValue) {
      setMessage('Spam detected! Subscription not allowed.');
      setLoading(false);
      return;
    }

    try {
      await axios.post(API_ENDPOINTS.CREATE_SUBSCRIBER, { email });
      setMessage('Subscribed successfully!');
      setEmail('');
    } catch (error) {
      console.error('Subscription Error:', error);
      setMessage(
        error.response?.data?.message || 'Error subscribing. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="footer bg-footer-green">
      <div className="footer-container">
        <div className="footer-column">
          <h5>About Ishaazi Livestock Services</h5>
          <p>
            Ishaazi Livestock Services provides insights into the latest in agriculture,
            offering expert advice and industry trends.
          </p>
        </div>

        <div className="footer-column">
          <h5>Quick Links</h5>
          <ul>
            <li>
              <a href="/auctions" className="footer-link">
                Auctions
              </a>
            </li>
            <li>
              <a href="/events" className="footer-link">
                Events
              </a>
            </li>
            <li>
              <a href="/advertise" className="footer-link">
                Advertise
              </a>
            </li>
            <li>
              <a href="/contact" className="footer-link">
                Contact Us
              </a>
            </li>
          </ul>
        </div>

        <div className="footer-column">
          <h5>Resources</h5>
          <ul>
            <li>
              <a href="/farm-basics" className="footer-link">
                Farm Basics
              </a>
            </li>
            <li>
              <a href="/news" className="footer-link">
                Agriculture News
              </a>
            </li>
            <li>
              <a href="/guides" className="footer-link">
                Farming Guides
              </a>
            </li>
            <li>
              <a href="/farms-for-sale" className="footer-link">
                Farms for Sale
              </a>
            </li>
          </ul>
        </div>

        <div className="footer-column">
          <h5>Subscribe to Our Newsletter</h5>
          <p>Stay updated with the latest farming news and tips. Subscribe now!</p>
          <form onSubmit={handleSubscribe} className="subscribe-form">
            {/* Honeypot Field for Spam Protection */}
            <input type="text" name="hidden-field" style={{ display: 'none' }} />
            
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              aria-label="Enter your email to subscribe"
              required
            />
            <button type="submit" className="btn-subscribe" disabled={loading}>
              {loading ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
          {message && <p className={`message ${loading ? 'loading' : ''}`}>{message}</p>}
        </div>

        <div className="footer-column social-media">
          <h5>Follow Us</h5>
          <div className="social-links">
            <a href="https://facebook.com" aria-label="Facebook">
              <img src="/images/facebook.png" alt="Facebook" className="social-icon" />
            </a>
            <a href="https://twitter.com" aria-label="Twitter">
              <img src="/images/twitter.png" alt="Twitter" className="social-icon" />
            </a>
            <a href="https://instagram.com" aria-label="Instagram">
              <img src="/images/instagram.png" alt="Instagram" className="social-icon" />
            </a>
            <a href="https://linkedin.com" aria-label="LinkedIn">
              <img src="/images/linkedin.png" alt="LinkedIn" className="social-icon" />
            </a>
            <a href="https://whatsapp.com" aria-label="WhatsApp">
              <img src="/images/whatsapp.png" alt="WhatsApp" className="social-icon" />
            </a>
          </div>
        </div>
      </div>
      <div className="footer-copyright">
        &copy; 2024 Ishaazi Livestock Services. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
