import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Header from '../../../components/Header';

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

const HeaderWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render header with logo and navigation', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      render(
        <HeaderWrapper>
          <Header />
        </HeaderWrapper>
      );

      expect(screen.getByText(/farming magazine/i)).toBeInTheDocument();
      expect(screen.getByText(/home/i)).toBeInTheDocument();
      expect(screen.getByText(/news/i)).toBeInTheDocument();
      expect(screen.getByText(/auctions/i)).toBeInTheDocument();
      expect(screen.getByText(/livestock/i)).toBeInTheDocument();
    });

    it('should render login button when user is not authenticated', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      render(
        <HeaderWrapper>
          <Header />
        </HeaderWrapper>
      );

      expect(screen.getByText(/login/i)).toBeInTheDocument();
      expect(screen.queryByText(/admin panel/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/logout/i)).not.toBeInTheDocument();
    });

    it('should render admin panel and logout when user is authenticated', () => {
      localStorageMock.getItem.mockReturnValue('fake-jwt-token');
      
      render(
        <HeaderWrapper>
          <Header />
        </HeaderWrapper>
      );

      expect(screen.getByText(/admin panel/i)).toBeInTheDocument();
      expect(screen.getByText(/logout/i)).toBeInTheDocument();
      expect(screen.queryByText(/login/i)).not.toBeInTheDocument();
    });

    it('should render mobile menu toggle button', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      render(
        <HeaderWrapper>
          <Header />
        </HeaderWrapper>
      );

      const mobileMenuButton = screen.getByRole('button', { name: /toggle mobile menu/i });
      expect(mobileMenuButton).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate to home when logo is clicked', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      render(
        <HeaderWrapper>
          <Header />
        </HeaderWrapper>
      );

      const logo = screen.getByText(/farming magazine/i);
      fireEvent.click(logo);

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should navigate to news when news link is clicked', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      render(
        <HeaderWrapper>
          <Header />
        </HeaderWrapper>
      );

      const newsLink = screen.getByText(/news/i);
      fireEvent.click(newsLink);

      expect(mockNavigate).toHaveBeenCalledWith('/news');
    });

    it('should navigate to auctions when auctions link is clicked', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      render(
        <HeaderWrapper>
          <Header />
        </HeaderWrapper>
      );

      const auctionsLink = screen.getByText(/auctions/i);
      fireEvent.click(auctionsLink);

      expect(mockNavigate).toHaveBeenCalledWith('/auctions');
    });

    it('should navigate to admin panel when authenticated', () => {
      localStorageMock.getItem.mockReturnValue('fake-jwt-token');
      
      render(
        <HeaderWrapper>
          <Header />
        </HeaderWrapper>
      );

      const adminLink = screen.getByText(/admin panel/i);
      fireEvent.click(adminLink);

      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
  });

  describe('Mobile Menu', () => {
    it('should toggle mobile menu when button is clicked', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      render(
        <HeaderWrapper>
          <Header />
        </HeaderWrapper>
      );

      const mobileMenuButton = screen.getByRole('button', { name: /toggle mobile menu/i });
      
      // Initially menu should be closed
      expect(screen.queryByTestId('mobile-menu')).not.toBeVisible();
      
      // Click to open
      fireEvent.click(mobileMenuButton);
      expect(screen.getByTestId('mobile-menu')).toBeVisible();
      
      // Click to close
      fireEvent.click(mobileMenuButton);
      expect(screen.queryByTestId('mobile-menu')).not.toBeVisible();
    });

    it('should close mobile menu when navigation item is clicked', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      render(
        <HeaderWrapper>
          <Header />
        </HeaderWrapper>
      );

      const mobileMenuButton = screen.getByRole('button', { name: /toggle mobile menu/i });
      
      // Open mobile menu
      fireEvent.click(mobileMenuButton);
      expect(screen.getByTestId('mobile-menu')).toBeVisible();
      
      // Click on a navigation item
      const newsLink = screen.getAllByText(/news/i)[1]; // Get the mobile menu version
      fireEvent.click(newsLink);
      
      // Menu should close
      expect(screen.queryByTestId('mobile-menu')).not.toBeVisible();
    });
  });

  describe('Authentication Actions', () => {
    it('should handle logout correctly', async () => {
      localStorageMock.getItem.mockReturnValue('fake-jwt-token');
      
      render(
        <HeaderWrapper>
          <Header />
        </HeaderWrapper>
      );

      const logoutButton = screen.getByText(/logout/i);
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('should navigate to login when login button is clicked', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      render(
        <HeaderWrapper>
          <Header />
        </HeaderWrapper>
      );

      const loginButton = screen.getByText(/login/i);
      fireEvent.click(loginButton);

      expect(mockNavigate).toHaveBeenCalledWith('/admin/login');
    });
  });

  describe('Responsive Design', () => {
    it('should show desktop navigation on large screens', () => {
      // Mock window.innerWidth for desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      localStorageMock.getItem.mockReturnValue(null);
      
      render(
        <HeaderWrapper>
          <Header />
        </HeaderWrapper>
      );

      const desktopNav = screen.getByTestId('desktop-navigation');
      expect(desktopNav).toBeVisible();
    });

    it('should show mobile menu button on small screens', () => {
      // Mock window.innerWidth for mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      localStorageMock.getItem.mockReturnValue(null);
      
      render(
        <HeaderWrapper>
          <Header />
        </HeaderWrapper>
      );

      const mobileMenuButton = screen.getByRole('button', { name: /toggle mobile menu/i });
      expect(mobileMenuButton).toBeVisible();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      render(
        <HeaderWrapper>
          <Header />
        </HeaderWrapper>
      );

      const mobileMenuButton = screen.getByRole('button', { name: /toggle mobile menu/i });
      expect(mobileMenuButton).toHaveAttribute('aria-label');
    });

    it('should be keyboard navigable', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      render(
        <HeaderWrapper>
          <Header />
        </HeaderWrapper>
      );

      const homeLink = screen.getByText(/home/i);
      homeLink.focus();
      expect(homeLink).toHaveFocus();

      // Tab to next element
      fireEvent.keyDown(homeLink, { key: 'Tab' });
      const newsLink = screen.getByText(/news/i);
      expect(newsLink).toHaveFocus();
    });

    it('should handle Enter key for mobile menu toggle', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      render(
        <HeaderWrapper>
          <Header />
        </HeaderWrapper>
      );

      const mobileMenuButton = screen.getByRole('button', { name: /toggle mobile menu/i });
      
      fireEvent.keyDown(mobileMenuButton, { key: 'Enter' });
      expect(screen.getByTestId('mobile-menu')).toBeVisible();
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      
      expect(() => {
        render(
          <HeaderWrapper>
            <Header />
          </HeaderWrapper>
        );
      }).not.toThrow();

      // Should default to unauthenticated state
      expect(screen.getByText(/login/i)).toBeInTheDocument();
    });

    it('should handle invalid token in localStorage', () => {
      localStorageMock.getItem.mockReturnValue('invalid-token');
      
      render(
        <HeaderWrapper>
          <Header />
        </HeaderWrapper>
      );

      // Should still show authenticated state even with invalid token
      // (Token validation happens on API calls, not in component)
      expect(screen.getByText(/admin panel/i)).toBeInTheDocument();
    });
  });
});
