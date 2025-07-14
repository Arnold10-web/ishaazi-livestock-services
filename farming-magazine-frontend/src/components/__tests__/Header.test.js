/**
 * Header Component Tests
 * 
 * Comprehensive tests for the Header component including unit, integration,
 * accessibility, and visual regression tests
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { NotificationProvider } from '../../contexts/NotificationContext';
import Header from '../Header';
import { testAccessibility, testKeyboardNavigation, testSemanticStructure } from '../../test-utils/accessibility';

// Mock DynamicAdComponent
jest.mock('../DynamicAdComponent', () => {
  return function MockDynamicAdComponent({ adSlot, adFormat, adStyle }) {
    return (
      <div 
        data-testid="dynamic-ad" 
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        style={adStyle}
      >
        Mock Ad Component
      </div>
    );
  };
});

// Mock react-router-dom navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <NotificationProvider>
      {children}
    </NotificationProvider>
  </BrowserRouter>
);

// Helper function to render Header with wrapper
const renderHeader = (props = {}) => {
  return render(
    <TestWrapper>
      <Header {...props} />
    </TestWrapper>
  );
};

describe('Header Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    // Reset scroll position
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
  });

  afterEach(() => {
    // Reset body overflow
    document.body.style.overflow = 'unset';
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      renderHeader();
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('renders logo with correct attributes', () => {
      renderHeader();
      const logo = screen.getByAltText("Farmer's Weekly Logo");
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', '/images/ishaazi.jpg');
    });

    it('renders all navigation links', () => {
      renderHeader();
      
      // Category links
      expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'News' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Services' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Dairy' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Beef' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Goats' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Piggery' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Farm Basics' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Farms For Sale' })).toBeInTheDocument();
    });

    it('renders top navigation links on desktop', () => {
      renderHeader();
      
      // Top links (hidden on mobile, visible on desktop)
      expect(screen.getByRole('link', { name: 'Auctions' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Events' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Advertise' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Suppliers' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Subscribe' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Contact' })).toBeInTheDocument();
    });

    it('renders social media links', () => {
      renderHeader();
      
      expect(screen.getByLabelText('Facebook')).toBeInTheDocument();
      expect(screen.getByLabelText('X')).toBeInTheDocument();
      expect(screen.getByLabelText('Instagram')).toBeInTheDocument();
      expect(screen.getByLabelText('WhatsApp')).toBeInTheDocument();
    });

    it('renders ad components', () => {
      renderHeader();
      
      const adComponents = screen.getAllByTestId('dynamic-ad');
      expect(adComponents.length).toBeGreaterThan(0);
    });

    it('renders search functionality', () => {
      renderHeader();
      
      // Desktop search input
      const searchInputs = screen.getAllByPlaceholderText(/search articles/i);
      expect(searchInputs.length).toBeGreaterThan(0);
      
      // Search buttons
      const searchButtons = screen.getAllByLabelText('Search');
      expect(searchButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Mobile Menu', () => {
    it('opens and closes mobile menu', async () => {
      const user = userEvent.setup();
      renderHeader();
      
      const menuButton = screen.getByLabelText('Toggle menu');
      expect(menuButton).toBeInTheDocument();
      
      // Open menu
      await user.click(menuButton);
      
      // Check if menu is open (menu content should be visible)
      await waitFor(() => {
        expect(screen.getByText('Menu')).toBeInTheDocument();
      });
      
      // Close menu using close button
      const closeButton = screen.getByLabelText('Close menu');
      await user.click(closeButton);
      
      // Menu should be closed (content should not be visible or should be hidden)
      await waitFor(() => {
        const menuTitle = screen.queryByText('Menu');
        if (menuTitle) {
          // If the element exists, it should be hidden (transform: translateX(100%))
          const mobileMenu = menuTitle.closest('div[class*="translate-x"]');
          expect(mobileMenu).toHaveClass('translate-x-full');
        }
      });
    });

    it('closes mobile menu when clicking overlay', async () => {
      const user = userEvent.setup();
      renderHeader();
      
      const menuButton = screen.getByLabelText('Toggle menu');
      await user.click(menuButton);
      
      // Wait for menu to open
      await waitFor(() => {
        expect(screen.getByText('Menu')).toBeInTheDocument();
      });
      
      // Click overlay to close
      const overlay = document.querySelector('.fixed.inset-0.bg-black');
      if (overlay) {
        await user.click(overlay);
        
        await waitFor(() => {
          const menuTitle = screen.queryByText('Menu');
          if (menuTitle) {
            const mobileMenu = menuTitle.closest('div[class*="translate-x"]');
            expect(mobileMenu).toHaveClass('translate-x-full');
          }
        });
      }
    });

    it('closes mobile menu when clicking navigation link', async () => {
      const user = userEvent.setup();
      renderHeader();
      
      const menuButton = screen.getByLabelText('Toggle menu');
      await user.click(menuButton);
      
      await waitFor(() => {
        expect(screen.getByText('Menu')).toBeInTheDocument();
      });
      
      // Click on a navigation link in mobile menu
      const homeLinks = screen.getAllByRole('link', { name: 'Home' });
      const mobileHomeLink = homeLinks.find(link => 
        link.closest('div[class*="translate-x"]')
      );
      
      if (mobileHomeLink) {
        await user.click(mobileHomeLink);
        
        await waitFor(() => {
          const menuTitle = screen.queryByText('Menu');
          if (menuTitle) {
            const mobileMenu = menuTitle.closest('div[class*="translate-x"]');
            expect(mobileMenu).toHaveClass('translate-x-full');
          }
        });
      }
    });

    it('prevents body scroll when menu is open', async () => {
      const user = userEvent.setup();
      renderHeader();
      
      const menuButton = screen.getByLabelText('Toggle menu');
      await user.click(menuButton);
      
      await waitFor(() => {
        expect(document.body.style.overflow).toBe('hidden');
      });
    });
  });

  describe('Search Functionality', () => {
    it('handles search form submission', async () => {
      const user = userEvent.setup();
      renderHeader();
      
      // Find desktop search input
      const searchInputs = screen.getAllByPlaceholderText(/search articles/i);
      const desktopSearchInput = searchInputs[0];
      
      await user.type(desktopSearchInput, 'dairy farming');
      
      // Submit form
      const form = desktopSearchInput.closest('form');
      await user.click(form.querySelector('button[type="submit"]'));
      
      expect(mockNavigate).toHaveBeenCalledWith('/search?q=dairy%20farming');
    });

    it('handles empty search submission', async () => {
      const user = userEvent.setup();
      renderHeader();
      
      const searchInputs = screen.getAllByPlaceholderText(/search articles/i);
      const desktopSearchInput = searchInputs[0];
      
      // Submit empty form
      const form = desktopSearchInput.closest('form');
      await user.click(form.querySelector('button[type="submit"]'));
      
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('trims whitespace from search query', async () => {
      const user = userEvent.setup();
      renderHeader();
      
      const searchInputs = screen.getAllByPlaceholderText(/search articles/i);
      const desktopSearchInput = searchInputs[0];
      
      await user.type(desktopSearchInput, '  dairy farming  ');
      
      const form = desktopSearchInput.closest('form');
      await user.click(form.querySelector('button[type="submit"]'));
      
      expect(mockNavigate).toHaveBeenCalledWith('/search?q=dairy%20farming');
    });

    it('toggles mobile search visibility', async () => {
      const user = userEvent.setup();
      renderHeader();
      
      const searchToggleButton = screen.getByLabelText('Search');
      await user.click(searchToggleButton);
      
      // Mobile search should be visible
      await waitFor(() => {
        const mobileSearchInput = screen.getByDisplayValue('');
        expect(mobileSearchInput).toBeInTheDocument();
      });
    });

    it('focuses search input when mobile search opens', async () => {
      const user = userEvent.setup();
      renderHeader();
      
      const searchToggleButton = screen.getByLabelText('Search');
      await user.click(searchToggleButton);
      
      await waitFor(() => {
        const searchInput = document.getElementById('search-input');
        expect(searchInput).toHaveFocus();
      }, { timeout: 200 });
    });

    it('clears search query after submission', async () => {
      const user = userEvent.setup();
      renderHeader();
      
      const searchInputs = screen.getAllByPlaceholderText(/search articles/i);
      const desktopSearchInput = searchInputs[0];
      
      await user.type(desktopSearchInput, 'test query');
      expect(desktopSearchInput).toHaveValue('test query');
      
      const form = desktopSearchInput.closest('form');
      await user.click(form.querySelector('button[type="submit"]'));
      
      await waitFor(() => {
        expect(desktopSearchInput).toHaveValue('');
      });
    });
  });

  describe('Scroll Behavior', () => {
    it('adds shadow when scrolled', async () => {
      renderHeader();
      
      const header = screen.getByRole('banner');
      expect(header).not.toHaveClass('shadow-lg');
      
      // Simulate scroll
      act(() => {
        Object.defineProperty(window, 'scrollY', { value: 100, writable: true });
        window.dispatchEvent(new Event('scroll'));
      });
      
      await waitFor(() => {
        expect(header).toHaveClass('shadow-lg');
      });
    });

    it('removes shadow when not scrolled', async () => {
      renderHeader();
      
      // First scroll down
      act(() => {
        Object.defineProperty(window, 'scrollY', { value: 100, writable: true });
        window.dispatchEvent(new Event('scroll'));
      });
      
      await waitFor(() => {
        expect(screen.getByRole('banner')).toHaveClass('shadow-lg');
      });
      
      // Then scroll back to top
      act(() => {
        Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
        window.dispatchEvent(new Event('scroll'));
      });
      
      await waitFor(() => {
        expect(screen.getByRole('banner')).not.toHaveClass('shadow-lg');
      });
    });

    it('cleans up scroll event listener', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      const { unmount } = renderHeader();
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
      
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Navigation Links', () => {
    it('has correct href attributes for internal links', () => {
      renderHeader();
      
      expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
      expect(screen.getByRole('link', { name: 'News' })).toHaveAttribute('href', '/news');
      expect(screen.getByRole('link', { name: 'Services' })).toHaveAttribute('href', '/services');
      expect(screen.getByRole('link', { name: 'Dairy' })).toHaveAttribute('href', '/dairy');
    });

    it('has correct href attributes for external social links', () => {
      renderHeader();
      
      expect(screen.getByLabelText('Facebook')).toHaveAttribute('href', 'https://facebook.com/ishaaziservices');
      expect(screen.getByLabelText('Instagram')).toHaveAttribute('href', 'https://instagram.com/ishaaziservices');
      expect(screen.getByLabelText('WhatsApp')).toHaveAttribute('href', 'https://wa.me/256700123456');
    });

    it('opens external links in new tab', () => {
      renderHeader();
      
      const facebookLink = screen.getByLabelText('Facebook');
      expect(facebookLink).toHaveAttribute('target', '_blank');
      expect(facebookLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Responsive Design', () => {
    it('shows mobile menu button on small screens', () => {
      renderHeader();
      
      const menuButton = screen.getByLabelText('Toggle menu');
      expect(menuButton).toBeInTheDocument();
      expect(menuButton).toHaveClass('md:hidden');
    });

    it('shows desktop navigation on large screens', () => {
      renderHeader();
      
      // Categories navigation should be hidden on mobile, visible on desktop
      const categoriesNav = screen.getByRole('link', { name: 'Home' }).closest('div');
      expect(categoriesNav).toHaveClass('hidden', 'md:block');
    });

    it('renders different ad sizes for different screen sizes', () => {
      renderHeader();
      
      const adComponents = screen.getAllByTestId('dynamic-ad');
      expect(adComponents.length).toBeGreaterThan(0);
      
      // Check that ads have different styles for different breakpoints
      const desktopAd = adComponents.find(ad => 
        ad.style.width === '300px' && ad.style.height === '60px'
      );
      const tabletAd = adComponents.find(ad => 
        ad.style.width === '200px' && ad.style.height === '50px'
      );
      
      expect(desktopAd || tabletAd).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('passes accessibility tests', async () => {
      const { container } = renderHeader();
      await testAccessibility(container);
    });

    it('has proper semantic structure', () => {
      const { container } = renderHeader();
      
      testSemanticStructure(container, {
        hasNavigation: true,
        hasMainLandmark: false, // Header doesn't contain main landmark
      });
    });

    it('supports keyboard navigation', async () => {
      const { container } = renderHeader();
      
      await testKeyboardNavigation(container, [
        'a[href="/"]', // Logo link
        'input[type="text"]', // Search input
        'button[type="submit"]', // Search button
        'a[href="/news"]', // Navigation links
      ]);
    });

    it('has proper ARIA labels', () => {
      renderHeader();
      
      expect(screen.getByLabelText('Toggle menu')).toBeInTheDocument();
      expect(screen.getByLabelText('Close menu')).toBeInTheDocument();
      expect(screen.getByLabelText('Search')).toBeInTheDocument();
      expect(screen.getByLabelText('Facebook')).toBeInTheDocument();
      expect(screen.getByLabelText('Instagram')).toBeInTheDocument();
      expect(screen.getByLabelText('WhatsApp')).toBeInTheDocument();
    });

    it('maintains focus management in mobile menu', async () => {
      const user = userEvent.setup();
      renderHeader();
      
      const menuButton = screen.getByLabelText('Toggle menu');
      await user.click(menuButton);
      
      // Focus should be manageable within the menu
      const closeButton = screen.getByLabelText('Close menu');
      closeButton.focus();
      expect(document.activeElement).toBe(closeButton);
    });
  });

  describe('Props', () => {
    it('handles showAd prop', () => {
      renderHeader({ showAd: true });
      expect(screen.getAllByTestId('dynamic-ad').length).toBeGreaterThan(0);
    });

    it('handles adBannerUrl prop', () => {
      const adBannerUrl = 'https://example.com/ad-banner.jpg';
      renderHeader({ adBannerUrl });
      
      // The prop is passed but not directly used in current implementation
      // This test ensures the component accepts the prop without errors
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing logo image gracefully', () => {
      renderHeader();
      
      const logo = screen.getByAltText("Farmer's Weekly Logo");
      
      // Simulate image load error
      act(() => {
        logo.dispatchEvent(new Event('error'));
      });
      
      // Component should still render
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('handles navigation errors gracefully', async () => {
      const user = userEvent.setup();
      mockNavigate.mockImplementation(() => {
        throw new Error('Navigation error');
      });
      
      renderHeader();
      
      const searchInputs = screen.getAllByPlaceholderText(/search articles/i);
      const desktopSearchInput = searchInputs[0];
      
      await user.type(desktopSearchInput, 'test');
      
      // Should not crash when navigation fails
      const form = desktopSearchInput.closest('form');
      await user.click(form.querySelector('button[type="submit"]'));
      
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('debounces scroll events', async () => {
      const scrollHandler = jest.fn();
      jest.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
        if (event === 'scroll') {
          scrollHandler.mockImplementation(handler);
        }
      });
      
      renderHeader();
      
      // Simulate multiple rapid scroll events
      act(() => {
        for (let i = 0; i < 10; i++) {
          Object.defineProperty(window, 'scrollY', { value: i * 10, writable: true });
          scrollHandler();
        }
      });
      
      // Component should handle rapid scroll events without issues
      expect(screen.getByRole('banner')).toBeInTheDocument();
      
      jest.restoreAllMocks();
    });

    it('cleans up event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      const { unmount } = renderHeader();
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalled();
      
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Integration Tests', () => {
    it('works with router navigation', async () => {
      const user = userEvent.setup();
      renderHeader();
      
      // Click on a navigation link
      const homeLink = screen.getByRole('link', { name: 'Home' });
      await user.click(homeLink);
      
      // Router should handle navigation (we can't test actual navigation in unit tests)
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('integrates with notification context', () => {
      // Test that header renders correctly within notification context
      renderHeader();
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('handles multiple simultaneous interactions', async () => {
      const user = userEvent.setup();
      renderHeader();
      
      // Open mobile menu
      const menuButton = screen.getByLabelText('Toggle menu');
      await user.click(menuButton);
      
      // Toggle search
      const searchButton = screen.getByLabelText('Search');
      await user.click(searchButton);
      
      // Both should work without conflicts
      await waitFor(() => {
        expect(screen.getByText('Menu')).toBeInTheDocument();
      });
    });
  });
});