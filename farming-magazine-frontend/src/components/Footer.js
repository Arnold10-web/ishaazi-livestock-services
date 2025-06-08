import React, { useState } from 'react';
import axios from 'axios';
import API_ENDPOINTS from '../config/apiConfig';
import { Link } from 'react-router-dom';
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  MessageCircle,
  Mail,
  MapPin,
  Phone,
  ArrowRight,
  Send,
  Check,
  AlertCircle
} from 'lucide-react';

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

  const socialLinks = [
    { platform: 'Facebook', icon: Facebook, url: 'https://facebook.com', color: 'hover:text-blue-400' },
    { platform: 'Twitter', icon: Twitter, url: 'https://twitter.com', color: 'hover:text-sky-400' },
    { platform: 'Instagram', icon: Instagram, url: 'https://instagram.com', color: 'hover:text-pink-400' },
    { platform: 'LinkedIn', icon: Linkedin, url: 'https://linkedin.com', color: 'hover:text-blue-600' },
    { platform: 'WhatsApp', icon: MessageCircle, url: 'https://whatsapp.com', color: 'hover:text-green-400' },
  ];

  const quickLinks = [
    { to: '/auctions', label: 'Auctions' },
    { to: '/events', label: 'Events' },
    { to: '/advertise', label: 'Advertise' },
    { to: '/contact', label: 'Contact Us' },
    { to: '/suppliers', label: 'Suppliers' },
    { to: '/subscribe', label: 'Subscribe' },
  ];

  const resourceLinks = [
    { to: '/basic', label: 'Farm Basics' },
    { to: '/news', label: 'Agriculture News' },
    { to: '/dairy', label: 'Dairy Farming' },
    { to: '/beef', label: 'Beef Cattle' },
    { to: '/goats', label: 'Goat Farming' },
    { to: '/farm', label: 'Farms for Sale' },
  ];

  const legalLinks = [
    { to: '/privacy', label: 'Privacy Policy' },
    { to: '/terms', label: 'Terms of Service' },
    { to: '/sitemap', label: 'Sitemap' },
    { to: '/cookies', label: 'Cookie Policy' },
  ];

  return (
    <footer className="bg-primary-700 text-white">
      {/* Simple top border */}
      <div className="w-full h-1 bg-accent-500"></div>

      {/* Main Footer Content */}
      <div className="section-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* About Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <img
                src="/images/ishaazi.jpg"
                alt="Ishaazi Logo"
                className="h-12 w-12 rounded-lg object-cover"
              />
              <div>
                <h3 className="text-xl font-bold text-white">
                  Ishaazi Livestock Services
                </h3>
                <p className="text-primary-200 text-sm">Agricultural Excellence</p>
              </div>
            </div>

            <p className="text-primary-100 leading-relaxed">
              Empowering farmers with cutting-edge insights, expert guidance, and innovative
              solutions for sustainable agriculture. Join our community of progressive farmers
              shaping the future of farming.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-primary-100">
                <MapPin size={18} className="text-accent-400" />
                <span>Kampala, Uganda</span>
              </div>
              <div className="flex items-center space-x-3 text-primary-100">
                <Phone size={18} className="text-accent-400" />
                <span>+256 123 456 789</span>
              </div>
              <div className="flex items-center space-x-3 text-primary-100">
                <Mail size={18} className="text-accent-400" />
                <span>info@ishaazi.com</span>
              </div>
            </div>

            {/* Social Icons */}
            <div className="flex items-center space-x-4 pt-4">
              <span className="text-primary-200 font-medium">Follow Us:</span>
              <div className="flex space-x-3">
                {socialLinks.map(({ platform, icon: Icon, url }) => (
                  <a
                    key={platform}
                    href={url}
                    className="p-2 rounded-lg bg-primary-600 text-primary-100 hover:bg-accent-500 hover:text-white transition-colors duration-200"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={platform}
                  >
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {quickLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="flex items-center space-x-2 text-primary-200 hover:text-accent-400 transition-colors duration-200"
                  >
                    <ArrowRight size={14} />
                    <span>{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">
              Resources
            </h3>
            <ul className="space-y-2">
              {resourceLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="flex items-center space-x-2 text-primary-200 hover:text-accent-400 transition-colors duration-200"
                  >
                    <ArrowRight size={14} />
                    <span>{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Newsletter Section */}
        <div className="mt-12 pt-8 border-t border-primary-600">
          <div className="max-w-md mx-auto text-center">
            <h3 className="text-xl font-semibold text-white mb-4">
              Stay Updated
            </h3>
            <p className="text-primary-200 mb-6">
              Get the latest farming insights delivered to your inbox.
            </p>

            <form onSubmit={handleSubscribe} className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 px-4 py-3 rounded-lg bg-primary-600 border border-primary-500 text-white placeholder-primary-200 focus:outline-none focus:ring-2 focus:ring-accent-500"
              />

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-accent-500 text-white font-medium rounded-lg hover:bg-accent-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={16} />
                    <span>Subscribe</span>
                  </>
                )}
              </button>
            </form>

            {message && (
              <div className={`mt-4 p-3 rounded-lg flex items-center justify-center space-x-2 ${
                message.includes('successfully') || message.includes('subscribed')
                  ? 'bg-green-500/20 text-green-300'
                  : 'bg-red-500/20 text-red-300'
              }`}>
                {message.includes('successfully') || message.includes('subscribed') ? (
                  <Check size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                <span>{message}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Copyright Section */}
      <div className="border-t border-primary-600 bg-primary-800">
        <div className="section-container py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <p className="text-primary-200 font-medium">
                &copy; 2025 Ishaazi Livestock Services
              </p>
              <p className="text-primary-300 text-sm">
                Empowering farmers with knowledge and innovation
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              {legalLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="text-primary-300 hover:text-accent-400 text-sm transition-colors duration-200"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;