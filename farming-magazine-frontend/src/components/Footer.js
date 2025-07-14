import React, { useState } from 'react';
import axios from 'axios';
import API_ENDPOINTS from '../config/apiConfig';
import { Link } from 'react-router-dom';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscriptionType, setSubscriptionType] = useState('all');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  const subscriptionOptions = [
    { value: 'all', label: 'All Updates', description: 'Get all our newsletters and updates' },
    { value: 'newsletters', label: 'Newsletters Only', description: 'Weekly farming insights and tips' },
    { value: 'events', label: 'Events', description: 'Upcoming farming events and workshops' },
    { value: 'auctions', label: 'Livestock Auctions', description: 'Auction announcements and schedules' },
    { value: 'farming-tips', label: 'Farming Tips', description: 'Expert advice and best practices' },
    { value: 'livestock-updates', label: 'Livestock Updates', description: 'Animal care and management news' }
  ];

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    
    // Email Validation
    const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
    if (!isValidEmail(email)) {
      setMessage('Please enter a valid email address.');
      setIsSuccess(false);
      setShowNotification(true);
      
      // Auto-hide error notification after 10 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 10000);
      return;
    }

    // Add hidden honeypot field for spam protection (not displayed in the form)
    const honeypotValue = document.querySelector('input[name="hidden-field"]')?.value;
    if (honeypotValue) {
      setMessage('Spam detected! Subscription not allowed.');
      setIsSuccess(false);
      setShowNotification(true);
      
      // Auto-hide error notification after 10 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 10000);
      return;
    }

    // Show preferences popup
    setShowPreferences(true);
  };

  const handleSubscribe = async () => {
    setLoading(true);
    setMessage('');
    setIsSuccess(false);

    try {
      const response = await axios.post(API_ENDPOINTS.CREATE_SUBSCRIBER, { 
        email, 
        subscriptionType 
      });
      
      setMessage(response.data.message || 'Thank you for subscribing! Welcome to our farming community.');
      setIsSuccess(true);
      setShowNotification(true);
      setEmail('');
      setSubscriptionType('all');
      setShowPreferences(false);
      
      // Auto-hide success notification after 10 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 10000);
    } catch (error) {
      console.error('Subscription Error:', error);
      
      let errorMessage = 'Subscription failed. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = 'Please check your email address and try again.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again in a moment.';
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setMessage(errorMessage);
      setIsSuccess(false);
      setShowNotification(true);
      setShowPreferences(false);
      
      // Auto-hide error notification after 10 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 10000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-green-700 text-gray-100">
      {/* Top wave separator */}
      <div className="w-full overflow-hidden">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 48" className="w-full h-12 -mb-1 text-gray-50 fill-current">
          <path d="M0,0 C480,48 960,48 1440,0 L1440,48 L0,48 Z"></path>
        </svg>
      </div>
      
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* About column */}
          <div className="lg:col-span-2">
            <h3 className="text-xl font-serif font-bold text-amber-500 mb-4">About Ishaazi Livestock Services</h3>
            <p className="text-gray-200 mb-6">
              Ishaazi Livestock Services provides insights into the latest in agriculture,
              offering expert advice and industry trends.
            </p>
            <div className="flex space-x-4 mt-4">
              <a href="https://facebook.com/ishaaziservices" className="text-gray-300 hover:text-amber-500 transition-colors duration-300" aria-label="Facebook">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
                </svg>
              </a>
              <a href="https://x.com/ishaaziservices" className="text-gray-300 hover:text-amber-500 transition-colors duration-300" aria-label="X (Twitter)">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="https://instagram.com/ishaaziservices" className="text-gray-300 hover:text-amber-500 transition-colors duration-300" aria-label="Instagram">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path>
                </svg>
              </a>
              <a href="https://wa.me/256700123456" className="text-gray-300 hover:text-amber-500 transition-colors duration-300" aria-label="WhatsApp">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"></path>
                </svg>
              </a>
            </div>
          </div>
          
          {/* Quick Links column */}
          <div>
            <h3 className="text-xl font-serif font-bold text-amber-500 mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/auctions" className="text-gray-200 hover:text-amber-500 transition-colors duration-150 flex items-center group">
                  <span className="group-hover:translate-x-0.5 transition-transform duration-150">→</span>
                  <span className="ml-2">Auctions</span>
                </Link>
              </li>
              <li>
                <Link to="/events" className="text-gray-200 hover:text-amber-500 transition-colors duration-150 flex items-center group">
                  <span className="group-hover:translate-x-0.5 transition-transform duration-150">→</span>
                  <span className="ml-2">Events</span>
                </Link>
              </li>
              <li>
                <Link to="/advertisements" className="text-gray-200 hover:text-amber-500 transition-colors duration-150 flex items-center group">
                  <span className="group-hover:translate-x-0.5 transition-transform duration-150">→</span>
                  <span className="ml-2">Advertise</span>
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-200 hover:text-amber-500 transition-colors duration-150 flex items-center group">
                  <span className="group-hover:translate-x-0.5 transition-transform duration-150">→</span>
                  <span className="ml-2">Contact Us</span>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Resources column */}
          <div>
            <h3 className="text-xl font-serif font-bold text-amber-500 mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/basic" className="text-gray-200 hover:text-amber-500 transition-colors duration-150 flex items-center group">
                  <span className="group-hover:translate-x-0.5 transition-transform duration-150">→</span>
                  <span className="ml-2">Farm Basics</span>
                </Link>
              </li>
              <li>
                <Link to="/news" className="text-gray-200 hover:text-amber-500 transition-colors duration-150 flex items-center group">
                  <span className="group-hover:translate-x-0.5 transition-transform duration-150">→</span>
                  <span className="ml-2">Agriculture News</span>
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-200 hover:text-amber-500 transition-colors duration-150 flex items-center group">
                  <span className="group-hover:translate-x-0.5 transition-transform duration-150">→</span>
                  <span className="ml-2">Farming Guides</span>
                </Link>
              </li>
              <li>
                <Link to="/farm" className="text-gray-200 hover:text-amber-500 transition-colors duration-150 flex items-center group">
                  <span className="group-hover:translate-x-0.5 transition-transform duration-150">→</span>
                  <span className="ml-2">Farms for Sale</span>
                </Link>
              </li>
              <li>
                <Link to="/rss-feeds" className="text-gray-200 hover:text-amber-500 transition-colors duration-150 flex items-center group">
                  <span className="group-hover:translate-x-0.5 transition-transform duration-150">→</span>
                  <span className="ml-2">RSS Feeds</span>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Newsletter column */}
          <div>
            <h3 className="text-xl font-serif font-bold text-amber-500 mb-4">Newsletter</h3>
            <p className="text-gray-200 mb-4">Stay updated with the latest farming news and tips. Subscribe now!</p>
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              {/* Honeypot Field for Spam Protection */}
              <input type="text" name="hidden-field" className="hidden" />
              
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  aria-label="Enter your email to subscribe"
                  className="w-full px-4 py-2 bg-green-600 text-white placeholder-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                  disabled={loading}
                />
              </div>
              
              <button 
                type="submit" 
                className="w-full bg-amber-500 hover:bg-amber-600 text-green-900 font-medium py-2 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                {loading ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>

            {/* Preferences Popup */}
            {showPreferences && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Choose Your Preferences</h3>
                    <button
                      onClick={() => setShowPreferences(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    What would you like to receive updates about?
                  </p>
                  
                  <div className="space-y-3 mb-6">
                    {subscriptionOptions.map((option) => (
                      <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="subscriptionType"
                          value={option.value}
                          checked={subscriptionType === option.value}
                          onChange={(e) => setSubscriptionType(e.target.value)}
                          className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{option.label}</div>
                          <div className="text-xs text-gray-500">{option.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowPreferences(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubscribe}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Subscribing...' : 'Subscribe'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Notification */}
            {message && showNotification && (
              <div className={`mt-4 p-4 rounded-lg border transition-all duration-300 ${
                isSuccess 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {isSuccess && (
                      <div className="flex items-center mb-2">
                        <svg className="h-5 w-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span className="font-medium">Success!</span>
                      </div>
                    )}
                    {!isSuccess && (
                      <div className="flex items-center mb-2">
                        <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span className="font-medium">Error</span>
                      </div>
                    )}
                    <p className="text-sm">{message}</p>
                  </div>
                  <button 
                    onClick={() => setShowNotification(false)}
                    className={`ml-4 ${isSuccess ? 'text-green-500 hover:text-green-700' : 'text-red-500 hover:text-red-700'}`}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer copyright */}
      <div className="border-t border-green-600 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="md:flex md:items-center md:justify-between">
            <div className="text-sm text-amber-400">&copy; 2025 Ishaazi Livestock Services. All rights reserved.</div>
            <div className="mt-4 md:mt-0">
              <ul className="flex space-x-6 text-sm">
                <li><Link to="/privacy" className="text-gray-300 hover:text-amber-500">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-gray-300 hover:text-amber-500">Terms of Service</Link></li>
                <li><Link to="/sitemap" className="text-gray-300 hover:text-amber-500">Sitemap</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;