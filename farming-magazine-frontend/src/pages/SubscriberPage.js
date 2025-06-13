import React, { useState } from 'react';
import axios from 'axios';
import API_ENDPOINTS from '../config/apiConfig';
import DynamicAdComponent from '../components/DynamicAdComponent';

const SubscriberPage = () => {
  const [email, setEmail] = useState('');
  const [subscriptionType, setSubscriptionType] = useState('all');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const subscriptionOptions = [
    { value: 'all', label: 'All Updates', description: 'Get all our newsletters and updates' },
    { value: 'newsletters', label: 'Newsletters Only', description: 'Weekly farming insights and tips' },
    { value: 'events', label: 'Events', description: 'Upcoming farming events and workshops' },
    { value: 'auctions', label: 'Livestock Auctions', description: 'Auction announcements and schedules' },
    { value: 'farming-tips', label: 'Farming Tips', description: 'Expert advice and best practices' },
    { value: 'livestock-updates', label: 'Livestock Updates', description: 'Animal care and management news' }
  ];

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsSuccess(false);

    // Email Validation
    const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
    if (!isValidEmail(email)) {
      setMessage('Please enter a valid email address.');
      setIsSuccess(false);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(API_ENDPOINTS.CREATE_SUBSCRIBER, { 
        email, 
        subscriptionType 
      });
      
      setMessage(response.data.message || 'Thank you for subscribing to our newsletter!');
      setIsSuccess(true);
      setEmail('');
      setSubscriptionType('all');
    } catch (error) {
      console.error('Subscription Error:', error);
      const backendMessage = error.response?.data?.message || error.message;
      setMessage(backendMessage || 'Error subscribing. Please try again.');
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Header Ad */}
      <div className="py-4">
        <DynamicAdComponent 
          adSlot="1234567890"
          adFormat="horizontal"
          adStyle={{ minHeight: '90px' }}
        />
      </div>

      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-8 text-center">
          <div className="text-white text-5xl mb-4">🌾</div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Join Our Newsletter
          </h1>
          <p className="text-green-100">
            Stay updated with the latest farming insights and livestock management tips
          </p>
        </div>

        <div className="px-6 py-8">
          <form onSubmit={handleSubscribe} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="subscriptionType" className="block text-sm font-medium text-gray-700 mb-3">
                Subscription Preferences
              </label>
              <div className="space-y-3">
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Subscribing...
                </div>
              ) : (
                'Subscribe to Newsletter'
              )}
            </button>
          </form>

          {message && (
            <div className={`mt-6 p-4 rounded-lg border ${
              isSuccess 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {isSuccess && (
                <div className="flex items-center mb-2">
                  <svg className="h-5 w-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="font-medium">Success!</span>
                </div>
              )}
              <p className="text-sm">{message}</p>
              {isSuccess && (
                <p className="text-sm mt-2 text-green-600">
                  Please check your email for a welcome message and confirmation.
                </p>
              )}
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              By subscribing, you agree to receive emails from Ishaazi Livestock Services. 
              We respect your privacy and won't share your information.
            </p>
          </div>
        </div>
      </div>

      {/* In-Content Ad */}
      <div className="py-8 max-w-md mx-auto">
        <DynamicAdComponent 
          adSlot="1122334455"
          adFormat="rectangle"
          adStyle={{ minHeight: '200px' }}
        />
      </div>
    </div>
  );
};

export default SubscriberPage;
