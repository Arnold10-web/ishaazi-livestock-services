/**
 * Enhanced AdminAuth Component
 * 
 * Updated authentication component for dual-role admin system.
 * Supports both System Admins (username) and Editors (company email).
 * Features role detection, appropriate validation, and enhanced UX.
 * 
 * @module components/AdminAuth
 */
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_ENDPOINTS from '../config/apiConfig';

/**
 * Component for enhanced admin authentication
 * 
 * @param {Object} props - Component props
 * @param {string} props.type - Authentication type ('login' or 'register')
 * @returns {JSX.Element} Enhanced admin authentication form
 */
const AdminAuth = ({ type }) => {
  // Form state
  const [identifier, setIdentifier] = useState(''); // Can be username or email
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('editor'); // Default to editor for registration
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Navigation hook
  const navigate = useNavigate();

  // Detect if identifier is email or username
  const isEmail = (str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
  
  // Validate company email for editors
  const isCompanyEmail = (email) => {
    const companyDomains = ['farmingmagazine.com', 'onlinefarming.com'];
    return companyDomains.some(domain => email.endsWith(`@${domain}`));
  };

  // Real-time validation feedback
  const getIdentifierValidation = () => {
    if (!identifier) return '';
    
    if (isEmail(identifier)) {
      if (isCompanyEmail(identifier)) {
        return { type: 'success', message: '✓ Valid company email (Editor access)' };
      } else {
        return { type: 'warning', message: '⚠ Non-company email (limited access)' };
      }
    } else {
      return { type: 'info', message: 'ℹ Username format (System Admin access)' };
    }
  };

  const validation = getIdentifierValidation();

  /**
   * Handle form submission for login or registration
   * Enhanced to support dual-role authentication system
   *
   * @param {Event} e - Form submission event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    // Validation for registration
    if (type === 'register') {
      if (password !== confirmPassword) {
        setMessage('Passwords do not match');
        setIsLoading(false);
        return;
      }

      // Validate role-specific requirements
      if (role === 'editor' && !isCompanyEmail(identifier)) {
        setMessage('Editors must use a company email address');
        setIsLoading(false);
        return;
      }

      if (role === 'system_admin' && isEmail(identifier)) {
        setMessage('System Admins should use a username, not an email');
        setIsLoading(false);
        return;
      }
    }

    try {
      // Select endpoint based on authentication type
      const endpoint = type === 'login' ? API_ENDPOINTS.ADMIN_LOGIN : API_ENDPOINTS.ADMIN_REGISTER;
      
      // Prepare request data
      const requestData = { identifier, password };
      if (type === 'register') {
        requestData.role = role;
        if (role === 'editor') {
          requestData.email = identifier; // For editors, identifier is email
        } else {
          requestData.username = identifier; // For system_admin, identifier is username
        }
      }

      const response = await axios.post(endpoint, requestData);
      
      // Handle successful response
      if (response.data.success !== false) {
        setMessage(response.data.message || 'Success!');

        // Handle successful login with enhanced token storage and navigation
        if (type === 'login' && response.data.token) {
          localStorage.setItem('myAppAdminToken', response.data.token);
          
          // Store user info for role-based UI
          localStorage.setItem('adminUserInfo', JSON.stringify({
            role: response.data.user?.role,
            username: response.data.user?.username,
            email: response.data.user?.email,
            permissions: response.data.user?.permissions
          }));

          console.log('Enhanced login successful:', response.data.user);
          
          // Role-based dashboard navigation
          const dashboardPath = response.data.user?.role === 'system_admin' 
            ? '/dashboard?tab=security' 
            : '/dashboard?tab=overview';
          
          navigate(dashboardPath);
        } else if (type === 'register') {
          // Redirect to login after successful registration
          setTimeout(() => navigate('/login'), 2000);
        }
      } else {
        setMessage(response.data.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'An error occurred during authentication';
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center bg-green-600 rounded-full">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {type === 'login' ? 'Sign in to your account' : 'Create admin account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {type === 'login' 
              ? 'Access the Farming Magazine admin dashboard' 
              : 'Register as a System Admin or Editor'
            }
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
                {type === 'login' ? 'Username or Email' : 'Username/Email'}
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder={type === 'login' ? 'Enter username or email' : 'admin@farmingmagazine.com or AdminUser'}
              />
              {validation && (
                <p className={`text-xs mt-1 ${
                  validation.type === 'success' ? 'text-green-600' : 
                  validation.type === 'warning' ? 'text-yellow-600' : 
                  'text-blue-600'
                }`}>
                  {validation.message}
                </p>
              )}
            </div>

            {type === 'register' && (
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1 mt-4">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="editor">Editor (Company Email Required)</option>
                  <option value="system_admin">System Admin (Username Required)</option>
                </select>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 mt-4">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Enter password"
              />
            </div>

            {type === 'register' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1 mt-4">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm password"
                />
              </div>
            )}
          </div>

          {message && (
            <div className={`rounded-md p-4 ${
              message.includes('successful') || message.includes('Success') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              <p className="text-sm">{message}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                type === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </div>

          <div className="text-center">
            <span className="text-sm text-gray-600">
              {type === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => navigate(type === 'login' ? '/register' : '/login')}
                className="font-medium text-green-600 hover:text-green-500"
              >
                {type === 'login' ? 'Register here' : 'Sign in here'}
              </button>
            </span>
          </div>
        </form>

        {/* Role Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm">
          <h4 className="font-medium text-blue-900 mb-2">Role Information:</h4>
          <ul className="text-blue-700 space-y-1">
            <li><strong>System Admin:</strong> Full system access, user management, security dashboard</li>
            <li><strong>Editor:</strong> Content management, editor dashboard (requires company email)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminAuth;
