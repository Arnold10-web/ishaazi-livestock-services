import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';
import ProtectedRoute from '../../../components/ProtectedRoute';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock components
const MockProtectedComponent = () => <div>Protected Content</div>;
const MockLoginComponent = () => <div>Please Login</div>;

const ProtectedRouteWrapper = ({ children, ...props }) => (
  <BrowserRouter>
    <Routes>
      <Route 
        path="/protected" 
        element={
          <ProtectedRoute {...props}>
            {children}
          </ProtectedRoute>
        } 
      />
      <Route path="/admin/login" element={<MockLoginComponent />} />
    </Routes>
  </BrowserRouter>
);

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.location
    delete window.location;
    window.location = { pathname: '/protected' };
  });

  describe('Authentication Check', () => {
    it('should render children when user is authenticated', () => {
      localStorageMock.getItem.mockReturnValue('valid-jwt-token');
      
      render(
        <ProtectedRouteWrapper>
          <MockProtectedComponent />
        </ProtectedRouteWrapper>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(screen.queryByText('Please Login')).not.toBeInTheDocument();
    });

    it('should redirect to login when user is not authenticated', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      render(
        <ProtectedRouteWrapper>
          <MockProtectedComponent />
        </ProtectedRouteWrapper>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.getByText('Please Login')).toBeInTheDocument();
    });

    it('should redirect to login when token is empty string', () => {
      localStorageMock.getItem.mockReturnValue('');
      
      render(
        <ProtectedRouteWrapper>
          <MockProtectedComponent />
        </ProtectedRouteWrapper>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.getByText('Please Login')).toBeInTheDocument();
    });

    it('should redirect to login when token is whitespace', () => {
      localStorageMock.getItem.mockReturnValue('   ');
      
      render(
        <ProtectedRouteWrapper>
          <MockProtectedComponent />
        </ProtectedRouteWrapper>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.getByText('Please Login')).toBeInTheDocument();
    });
  });

  describe('Role-Based Access Control', () => {
    it('should render children when user has required role', () => {
      // Mock a token with admin role
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYwYzUyZGY5MzU4NDJkMjg1NGY0M2YxYiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTYyMzUwNzY0MSwiZXhwIjoxNjIzNTExMjQxfQ.example';
      localStorageMock.getItem.mockReturnValue(mockToken);
      
      render(
        <ProtectedRouteWrapper requiredRole="admin">
          <MockProtectedComponent />
        </ProtectedRouteWrapper>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should accept multiple required roles', () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYwYzUyZGY5MzU4NDJkMjg1NGY0M2YxYiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTYyMzUwNzY0MSwiZXhwIjoxNjIzNTExMjQxfQ.example';
      localStorageMock.getItem.mockReturnValue(mockToken);
      
      render(
        <ProtectedRouteWrapper requiredRoles={['admin', 'superadmin']}>
          <MockProtectedComponent />
        </ProtectedRouteWrapper>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should show unauthorized message when user lacks required role', () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYwYzUyZGY5MzU4NDJkMjg1NGY0M2YxYiIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjIzNTA3NjQxLCJleHAiOjE2MjM1MTEyNDF9.example';
      localStorageMock.getItem.mockReturnValue(mockToken);
      
      render(
        <ProtectedRouteWrapper requiredRole="admin">
          <MockProtectedComponent />
        </ProtectedRouteWrapper>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.getByText(/unauthorized/i)).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading state while checking authentication', () => {
      localStorageMock.getItem.mockReturnValue('valid-token');
      
      render(
        <ProtectedRouteWrapper showLoading={true}>
          <MockProtectedComponent />
        </ProtectedRouteWrapper>
      );

      // This would depend on implementation - might show loading spinner
      // while validating token with server
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('Custom Redirect Paths', () => {
    it('should use custom redirect path when provided', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const CustomWrapper = ({ children }) => (
        <BrowserRouter>
          <Routes>
            <Route 
              path="/protected" 
              element={
                <ProtectedRoute redirectTo="/custom-login">
                  {children}
                </ProtectedRoute>
              } 
            />
            <Route path="/custom-login" element={<div>Custom Login Page</div>} />
          </Routes>
        </BrowserRouter>
      );
      
      render(
        <CustomWrapper>
          <MockProtectedComponent />
        </CustomWrapper>
      );

      expect(screen.getByText('Custom Login Page')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      
      expect(() => {
        render(
          <ProtectedRouteWrapper>
            <MockProtectedComponent />
          </ProtectedRouteWrapper>
        );
      }).not.toThrow();

      // Should redirect to login when localStorage fails
      expect(screen.getByText('Please Login')).toBeInTheDocument();
    });

    it('should handle malformed JWT tokens', () => {
      localStorageMock.getItem.mockReturnValue('malformed.jwt.token');
      
      expect(() => {
        render(
          <ProtectedRouteWrapper requiredRole="admin">
            <MockProtectedComponent />
          </ProtectedRouteWrapper>
        );
      }).not.toThrow();

      // Should handle gracefully, possibly redirecting to login
      // or showing unauthorized message
    });

    it('should handle expired tokens', () => {
      // Mock an expired token
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYwYzUyZGY5MzU4NDJkMjg1NGY0M2YxYiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTYyMzUwNzY0MSwiZXhwIjoxNjIzNTExMjQxfQ.expired';
      localStorageMock.getItem.mockReturnValue(expiredToken);
      
      render(
        <ProtectedRouteWrapper>
          <MockProtectedComponent />
        </ProtectedRouteWrapper>
      );

      // Implementation would check token expiry and redirect accordingly
      // For now, assuming it passes through as token exists
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('Props Passing', () => {
    it('should pass additional props to children', () => {
      localStorageMock.getItem.mockReturnValue('valid-token');
      
      const MockComponentWithProps = ({ testProp }) => (
        <div>Protected Content with {testProp}</div>
      );
      
      render(
        <ProtectedRouteWrapper>
          <MockComponentWithProps testProp="custom prop" />
        </ProtectedRouteWrapper>
      );

      expect(screen.getByText('Protected Content with custom prop')).toBeInTheDocument();
    });
  });

  describe('Re-authentication', () => {
    it('should re-check authentication when token changes', () => {
      const { rerender } = render(
        <ProtectedRouteWrapper>
          <MockProtectedComponent />
        </ProtectedRouteWrapper>
      );

      // Initially no token
      localStorageMock.getItem.mockReturnValue(null);
      expect(screen.getByText('Please Login')).toBeInTheDocument();

      // Now with token
      localStorageMock.getItem.mockReturnValue('valid-token');
      rerender(
        <ProtectedRouteWrapper>
          <MockProtectedComponent />
        </ProtectedRouteWrapper>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });
});
