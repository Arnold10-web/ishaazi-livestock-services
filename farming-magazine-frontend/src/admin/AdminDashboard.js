/**
 * Enhanced AdminDashboard Component
 * 
 * Main dashboard component that routes users to role-specific dashboards
 * based on their authentication role (System Admin or Editor).
 * Provides seamless navigation and role-based access control.
 */
import React, { useState, Suspense, lazy, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Import role-specific dashboards
const SystemAdminDashboard = lazy(() => import('./SystemAdminDashboard'));
const EditorDashboard = lazy(() => import('./EditorDashboard'));

const AdminDashboard = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeDashboard = () => {
      const token = localStorage.getItem('myAppAdminToken');
      if (!token) {
        navigate('/login');
        return;
      }

      // Get user info from localStorage
      const storedUserInfo = localStorage.getItem('adminUserInfo');
      if (storedUserInfo) {
        try {
          const parsed = JSON.parse(storedUserInfo);
          setUserInfo(parsed);
          setLoading(false);
        } catch (error) {
          console.error('Error parsing user info:', error);
          navigate('/login');
        }
      } else {
        // If no user info stored, redirect to login to get fresh data
        console.warn('No user info found, redirecting to login');
        navigate('/login');
      }
    };

    initializeDashboard();
  }, [navigate]);

  // Loading state while user info is being loaded
  if (loading || !userInfo) {
    return <DashboardLoader />;
  }

  // Route to appropriate dashboard based on user role
  const renderRoleDashboard = () => {
    switch (userInfo.role) {
      case 'system_admin':
        return (
          <Suspense fallback={<DashboardLoader />}>
            <SystemAdminDashboard userInfo={userInfo} />
          </Suspense>
        );
      case 'editor':
        return (
          <Suspense fallback={<DashboardLoader />}>
            <EditorDashboard userInfo={userInfo} />
          </Suspense>
        );
      default:
        // Fallback for unknown roles
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                <h2 className="text-lg font-semibold text-red-900 mb-2">Access Denied</h2>
                <p className="text-red-700 mb-4">
                  Unknown user role: {userInfo.role}. Please contact your administrator.
                </p>
                <button
                  onClick={() => {
                    localStorage.removeItem('myAppAdminToken');
                    localStorage.removeItem('adminUserInfo');
                    navigate('/login');
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Return to Login
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return renderRoleDashboard();
};

// Loading component for dashboard transitions
const DashboardLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading dashboard...</p>
      <p className="text-sm text-gray-500 mt-2">Preparing your personalized experience</p>
    </div>
  </div>
);

export default AdminDashboard;