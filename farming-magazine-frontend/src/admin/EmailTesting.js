// admin/EmailTesting.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import API_ENDPOINTS from '../config/apiConfig';
import { getAuthHeader } from '../utils/auth';

const EmailTesting = ({ darkMode }) => {
  const [configStatus, setConfigStatus] = useState(null);
  const [testEmail, setTestEmail] = useState('');
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 5000);
  };

  const fetchConfigStatus = useCallback(async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.EMAIL_CONFIG_STATUS, {
        headers: getAuthHeader()
      });
      setConfigStatus(response.data.data);
    } catch (error) {
      console.error('Error fetching email config status:', error);
      showNotification('Failed to fetch email configuration status', 'error');
    }
  }, []);

  useEffect(() => {
    fetchConfigStatus();
  }, [fetchConfigStatus]);

  const handleTestConfig = async () => {
    setLoading(prev => ({ ...prev, config: true }));
    try {
      const response = await axios.get(API_ENDPOINTS.EMAIL_TEST_CONFIG, {
        headers: getAuthHeader()
      });
      setTestResults(prev => ({ ...prev, config: response.data }));
      showNotification(response.data.message, response.data.success ? 'success' : 'error');
    } catch (error) {
      showNotification(error.response?.data?.message || 'Configuration test failed', 'error');
    } finally {
      setLoading(prev => ({ ...prev, config: false }));
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      showNotification('Please enter a test email address', 'error');
      return;
    }

    setLoading(prev => ({ ...prev, testEmail: true }));
    try {
      const response = await axios.post(API_ENDPOINTS.EMAIL_TEST_SEND, 
        { email: testEmail },
        { headers: getAuthHeader() }
      );
      setTestResults(prev => ({ ...prev, testEmail: response.data }));
      showNotification(response.data.message, response.data.success ? 'success' : 'error');
    } catch (error) {
      showNotification(error.response?.data?.message || 'Test email failed', 'error');
    } finally {
      setLoading(prev => ({ ...prev, testEmail: false }));
    }
  };

  const handleTestWelcomeEmail = async () => {
    if (!testEmail) {
      showNotification('Please enter a test email address', 'error');
      return;
    }

    setLoading(prev => ({ ...prev, welcomeEmail: true }));
    try {
      const response = await axios.post(API_ENDPOINTS.EMAIL_TEST_WELCOME, 
        { email: testEmail, subscriptionType: 'all' },
        { headers: getAuthHeader() }
      );
      setTestResults(prev => ({ ...prev, welcomeEmail: response.data }));
      showNotification(response.data.message, response.data.success ? 'success' : 'error');
    } catch (error) {
      showNotification(error.response?.data?.message || 'Welcome email test failed', 'error');
    } finally {
      setLoading(prev => ({ ...prev, welcomeEmail: false }));
    }
  };

  const handleHealthCheck = async () => {
    setLoading(prev => ({ ...prev, healthCheck: true }));
    try {
      const response = await axios.post(API_ENDPOINTS.EMAIL_HEALTH_CHECK, 
        testEmail ? { email: testEmail } : {},
        { headers: getAuthHeader() }
      );
      setTestResults(prev => ({ ...prev, healthCheck: response.data }));
      showNotification(response.data.message, response.data.success ? 'success' : 'error');
    } catch (error) {
      showNotification(error.response?.data?.message || 'Health check failed', 'error');
    } finally {
      setLoading(prev => ({ ...prev, healthCheck: false }));
    }
  };

  const getStatusIndicator = (configured) => {
    return configured ? (
      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        <i className="fas fa-check-circle mr-1"></i>
        Configured
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
        <i className="fas fa-exclamation-triangle mr-1"></i>
        Not Configured
      </span>
    );
  };

  const getTestResultIcon = (result) => {
    if (!result) return null;
    return result.success ? (
      <i className="fas fa-check-circle text-green-500"></i>
    ) : (
      <i className="fas fa-times-circle text-red-500"></i>
    );
  };

  return (
    <div className={`p-6 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-lg shadow-sm`}>
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-100 border-green-500 text-green-700' 
            : 'bg-red-100 border-red-500 text-red-700'
        } border-l-4`}>
          <div className="flex items-center">
            <i className={`fas fa-${notification.type === 'success' ? 'check-circle' : 'exclamation-triangle'} mr-2`}></i>
            {notification.message}
          </div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center">
          <i className="fas fa-envelope-open-text mr-3 text-blue-500"></i>
          Email System Testing
        </h2>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Test and verify your email configuration and newsletter functionality
        </p>
      </div>

      {/* Configuration Status */}
      <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-6 mb-6`}>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <i className="fas fa-cog mr-2 text-gray-500"></i>
          Configuration Status
        </h3>
        
        {configStatus ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span>Email Service</span>
              {getStatusIndicator(configStatus.configured)}
            </div>
            <div className="flex items-center justify-between">
              <span>Service Type</span>
              <span className={`font-mono text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {configStatus.serviceType || 'Not Set'}
              </span>
            </div>
            {configStatus.missing && Array.isArray(configStatus.missing) && configStatus.missing.length > 0 && (
              <div className="md:col-span-2">
                <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
                  <div className="flex items-center mb-2">
                    <i className="fas fa-exclamation-triangle text-yellow-600 dark:text-yellow-400 mr-2"></i>
                    <span className="font-medium text-yellow-800 dark:text-yellow-200">Missing Configuration</span>
                  </div>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside">
                    {configStatus.missing.map((item, index) => (
                      <li key={index}>
                        {typeof item === 'string' ? item : (item?.name || item?.title || 'Invalid configuration item')}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading configuration status...</span>
          </div>
        )}
      </div>

      {/* Test Email Input */}
      <div className="mb-6">
        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
          Test Email Address
        </label>
        <input
          type="email"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          placeholder="Enter email address for testing"
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            darkMode 
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        />
        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Used for sending test emails and welcome email tests
        </p>
      </div>

      {/* Test Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <button
          onClick={handleTestConfig}
          disabled={loading.config}
          className="flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading.config ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <i className="fas fa-cog mr-2"></i>
          )}
          Test Config
        </button>

        <button
          onClick={handleSendTestEmail}
          disabled={loading.testEmail || !testEmail}
          className="flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading.testEmail ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <i className="fas fa-paper-plane mr-2"></i>
          )}
          Send Test
        </button>

        <button
          onClick={handleTestWelcomeEmail}
          disabled={loading.welcomeEmail || !testEmail}
          className="flex items-center justify-center px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading.welcomeEmail ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <i className="fas fa-envelope-circle-check mr-2"></i>
          )}
          Test Welcome
        </button>

        <button
          onClick={handleHealthCheck}
          disabled={loading.healthCheck}
          className="flex items-center justify-center px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading.healthCheck ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <i className="fas fa-heartbeat mr-2"></i>
          )}
          Health Check
        </button>
      </div>

      {/* Test Results */}
      {Object.keys(testResults).length > 0 && (
        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-6`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <i className="fas fa-clipboard-list mr-2 text-gray-500"></i>
            Test Results
          </h3>

          <div className="space-y-4">
            {testResults.config && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <span className="font-medium">Configuration Test</span>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {testResults.config.message}
                  </p>
                </div>
                {getTestResultIcon(testResults.config)}
              </div>
            )}

            {testResults.testEmail && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <span className="font-medium">Test Email</span>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {testResults.testEmail.message}
                  </p>
                </div>
                {getTestResultIcon(testResults.testEmail)}
              </div>
            )}

            {testResults.welcomeEmail && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <span className="font-medium">Welcome Email Test</span>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {testResults.welcomeEmail.message}
                  </p>
                </div>
                {getTestResultIcon(testResults.welcomeEmail)}
              </div>
            )}

            {testResults.healthCheck && (
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Health Check</span>
                  {getTestResultIcon(testResults.healthCheck)}
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                  {testResults.healthCheck.message}
                </p>
                {testResults.healthCheck.data && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center">
                      <span className="mr-2">Config:</span>
                      {testResults.healthCheck.data.configuration?.success ? (
                        <span className="text-green-600">✓ Pass</span>
                      ) : (
                        <span className="text-red-600">✗ Fail</span>
                      )}
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2">Send Test:</span>
                      {testResults.healthCheck.data.testEmail?.success ? (
                        <span className="text-green-600">✓ Pass</span>
                      ) : testResults.healthCheck.data.testEmail ? (
                        <span className="text-red-600">✗ Fail</span>
                      ) : (
                        <span className="text-gray-500">⏭ Skip</span>
                      )}
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2">Welcome:</span>
                      {testResults.healthCheck.data.welcomeEmail?.success ? (
                        <span className="text-green-600">✓ Pass</span>
                      ) : testResults.healthCheck.data.welcomeEmail ? (
                        <span className="text-red-600">✗ Fail</span>
                      ) : (
                        <span className="text-gray-500">⏭ Skip</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Setup Instructions */}
      {configStatus && !configStatus.configured && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Setup Instructions</h4>
          <ol className="text-sm text-blue-700 dark:text-blue-300 list-decimal list-inside space-y-1">
            <li>Create a <code>.env</code> file in your project root</li>
            <li>Add EMAIL_USER=your-email@gmail.com</li>
            <li>Add EMAIL_PASS=your-app-password (not regular password)</li>
            <li>For Gmail, enable 2FA and generate an App Password</li>
            <li>Restart your server after updating .env</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default EmailTesting;
