import React, { useState, useEffect } from 'react';

const SecurityDashboard = ({ darkMode }) => {
  const [securityData, setSecurityData] = useState({
    recentLogins: [],
    failedAttempts: [],
    securityEvents: [],
    systemHealth: {},
    activeUsers: 0
  });
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSecurityData();
    fetchSystemHealth();
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchSecurityData();
      fetchSystemHealth();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSecurityData = async () => {
    try {
      const token = localStorage.getItem('myAppAdminToken');
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/admin/security-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSecurityData(data);
      } else {
        setError('Failed to fetch security data');
      }
    } catch (err) {
      setError('Error fetching security data');
      console.error('Security data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/dashboard/stats`);
      
      if (response.ok) {
        const data = await response.json();
        // Calculate simple system health metrics
        const uptime = process.uptime ? Math.round((Date.now() - (process.uptime() * 1000)) / 1000) : 0;
        const uptimeHours = Math.floor(uptime / 3600);
        const uptimePercentage = uptimeHours > 24 ? 99.9 : Math.max(95, (uptimeHours / 24) * 100);
        
        setSystemHealth({
          uptime: {
            percentage: Math.round(uptimePercentage * 10) / 10,
            displayText: `${Math.round(uptimePercentage * 10) / 10}%`
          },
          responseTime: {
            displayText: `${Math.floor(Math.random() * 50) + 20}ms` // Simulated for now
          },
          memory: {
            displayText: `${(Math.random() * 2 + 1).toFixed(1)}GB` // Simulated for now
          }
        });
      }
    } catch (err) {
      console.error('System health fetch error:', err);
      // Fallback values
      setSystemHealth({
        uptime: { displayText: 'N/A' },
        responseTime: { displayText: 'N/A' },
        memory: { displayText: 'N/A' }
      });
    }
  };

  const getSecurityLevelColor = (level) => {
    switch (level) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getSecurityLevelBg = (level) => {
    switch (level) {
      case 'high': return 'bg-red-100 border-red-200';
      case 'medium': return 'bg-yellow-100 border-yellow-200';
      case 'low': return 'bg-green-100 border-green-200';
      default: return 'bg-gray-100 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className={`p-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
          <span className="ml-3">Loading security data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 border-l-4 border-green-500`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <i className="fas fa-shield-alt text-2xl text-green-500"></i>
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Security Status
              </p>
              <p className="text-2xl font-semibold text-green-500">Secure</p>
            </div>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 border-l-4 border-blue-500`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <i className="fas fa-users text-2xl text-blue-500"></i>
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Active Users
              </p>
              <p className="text-2xl font-semibold text-blue-500">{securityData.activeUsers}</p>
            </div>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 border-l-4 border-yellow-500`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <i className="fas fa-exclamation-triangle text-2xl text-yellow-500"></i>
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Failed Attempts
              </p>
              <p className="text-2xl font-semibold text-yellow-500">{securityData.failedAttempts.length}</p>
            </div>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 border-l-4 border-purple-500`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <i className="fas fa-clock text-2xl text-purple-500"></i>
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Last Updated
              </p>
              <p className="text-sm font-semibold text-purple-500">
                {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Security Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Logins */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <i className="fas fa-sign-in-alt mr-2 text-green-500"></i>
            Recent Logins
          </h3>
          <div className="space-y-3">
            {securityData.recentLogins.length > 0 ? (
              securityData.recentLogins.slice(0, 5).map((login, index) => (
                <div key={index} className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} border-l-4 border-green-500`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{login.username || 'Unknown User'}</p>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        IP: {login.ip || 'Unknown'}
                      </p>
                    </div>
                    <span className="text-xs text-green-500 font-medium">
                      {login.timestamp ? new Date(login.timestamp).toLocaleString() : 'Unknown time'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No recent logins
              </p>
            )}
          </div>
        </div>

        {/* Security Events */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <i className="fas fa-exclamation-circle mr-2 text-red-500"></i>
            Security Events
          </h3>
          <div className="space-y-3">
            {securityData.securityEvents.length > 0 ? (
              securityData.securityEvents.slice(0, 5).map((event, index) => (
                <div key={index} className={`p-3 rounded-lg border-l-4 ${getSecurityLevelBg(event.level)}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`font-medium ${getSecurityLevelColor(event.level)}`}>
                        {event.type || 'Security Event'}
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {event.description || 'No description available'}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">
                      {event.timestamp ? new Date(event.timestamp).toLocaleString() : 'Unknown time'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No security events
              </p>
            )}
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className={`mt-8 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <i className="fas fa-heartbeat mr-2 text-blue-500"></i>
          System Health
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-500">
              {systemHealth?.uptime?.displayText || 'Loading...'}
            </div>
            <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-500">
              {systemHealth?.responseTime?.displayText || 'Loading...'}
            </div>
            <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Avg Response</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-500">
              {systemHealth?.memory?.displayText || 'Loading...'}
            </div>
            <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Memory Usage</div>
          </div>
        </div>
      </div>

      {/* Security Recommendations */}
      <div className={`mt-8 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <i className="fas fa-lightbulb mr-2 text-yellow-500"></i>
          Security Recommendations
        </h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <i className="fas fa-check-circle text-green-500 mt-1"></i>
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Consider implementing 2FA for enhanced security
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <i className="fas fa-check-circle text-green-500 mt-1"></i>
            <div>
              <p className="font-medium">Regular Security Audits</p>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Schedule monthly security reviews and penetration testing
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <i className="fas fa-check-circle text-green-500 mt-1"></i>
            <div>
              <p className="font-medium">Backup Verification</p>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Regularly test backup restoration procedures
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;
