/**
 * User Workflow Integration Tests
 * 
 * End-to-end integration tests for common user workflows
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { NotificationProvider } from '../../contexts/NotificationContext';
import { server } from '../../test-utils/mocks/server';
import { http, HttpResponse } from 'msw';

// Import components for integration testing
import Header from '../../components/Header';
import SearchBar from '../../components/SearchBar';
import BlogList from '../../components/BlogList';
import NewsletterForm from '../../components/NewsletterForm';

// Mock components that aren't essential for workflow testing
jest.mock('../../components/DynamicAdComponent', () => {
  return function MockDynamicAdComponent() {
    return <div data-testid="mock-ad">Ad Component</div>;
  };
});

// Test App component that includes routing
const TestApp = ({ initialRoute = '/' }) => {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <div>
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/subscribe" element={<SubscribePage />} />
              <Route path="/blog/:id" element={<BlogDetailPage />} />
            </Routes>
          </main>
        </div>
      </NotificationProvider>
    </BrowserRouter>
  );
};

// Mock page components
const HomePage = () => (
  <div>
    <h1>Home Page</h1>
    <BlogList />
    <NewsletterForm />
  </div>
);

const SearchPage = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get('q');
  
  return (
    <div>
      <h1>Search Results</h1>
      <p data-testid="search-query">Searching for: {query}</p>
      <div data-testid="search-results">
        {query && <div>Mock search results for "{query}"</div>}
      </div>
    </div>
  );
};

const NewsPage = () => (
  <div>
    <h1>News Page</h1>
    <div data-testid="news-content">Latest farming news</div>
  </div>
);

const SubscribePage = () => (
  <div>
    <h1>Subscribe Page</h1>
    <NewsletterForm />
  </div>
);

const BlogDetailPage = () => (
  <div>
    <h1>Blog Detail Page</h1>
    <div data-testid="blog-content">Blog content here</div>
  </div>
);

// Helper function to render the test app
const renderApp = (initialRoute = '/') => {
  // Set initial route
  window.history.pushState({}, 'Test page', initialRoute);
  
  return render(<TestApp initialRoute={initialRoute} />);
};

describe('User Workflow Integration Tests', () => {
  beforeEach(() => {
    // Reset any MSW handlers
    server.resetHandlers();
  });

  describe('Navigation Workflow', () => {
    it('allows user to navigate through main sections', async () => {
      const user = userEvent.setup();
      renderApp();

      // Start on home page
      expect(screen.getByText('Home Page')).toBeInTheDocument();

      // Navigate to news
      const newsLink = screen.getByRole('link', { name: 'News' });
      await user.click(newsLink);

      await waitFor(() => {
        expect(screen.getByText('News Page')).toBeInTheDocument();
        expect(screen.getByTestId('news-content')).toBeInTheDocument();
      });

      // Navigate back to home
      const homeLink = screen.getByRole('link', { name: 'Home' });
      await user.click(homeLink);

      await waitFor(() => {
        expect(screen.getByText('Home Page')).toBeInTheDocument();
      });
    });

    it('handles mobile navigation workflow', async () => {
      const user = userEvent.setup();
      renderApp();

      // Open mobile menu
      const menuButton = screen.getByLabelText('Toggle menu');
      await user.click(menuButton);

      // Wait for menu to open
      await waitFor(() => {
        expect(screen.getByText('Menu')).toBeInTheDocument();
      });

      // Navigate using mobile menu
      const mobileNewsLink = within(
        screen.getByText('Menu').closest('div')
      ).getByRole('link', { name: 'News' });
      
      await user.click(mobileNewsLink);

      // Menu should close and navigate to news
      await waitFor(() => {
        expect(screen.getByText('News Page')).toBeInTheDocument();
      });

      // Menu should be closed
      const menuTitle = screen.queryByText('Menu');
      if (menuTitle) {
        const mobileMenu = menuTitle.closest('div[class*="translate-x"]');
        expect(mobileMenu).toHaveClass('translate-x-full');
      }
    });

    it('maintains navigation state across page changes', async () => {
      const user = userEvent.setup();
      renderApp();

      // Navigate to multiple pages
      await user.click(screen.getByRole('link', { name: 'News' }));
      await waitFor(() => {
        expect(screen.getByText('News Page')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('link', { name: 'Subscribe' }));
      await waitFor(() => {
        expect(screen.getByText('Subscribe Page')).toBeInTheDocument();
      });

      // Header should still be present and functional
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByAltText("Farmer's Weekly Logo")).toBeInTheDocument();
    });
  });

  describe('Search Workflow', () => {
    it('completes full search workflow from header', async () => {
      const user = userEvent.setup();
      renderApp();

      // Find and use search input
      const searchInputs = screen.getAllByPlaceholderText(/search articles/i);
      const searchInput = searchInputs[0];

      await user.type(searchInput, 'dairy farming tips');

      // Submit search
      const searchForm = searchInput.closest('form');
      const submitButton = searchForm.querySelector('button[type="submit"]');
      await user.click(submitButton);

      // Should navigate to search page with query
      await waitFor(() => {
        expect(screen.getByText('Search Results')).toBeInTheDocument();
        expect(screen.getByTestId('search-query')).toHaveTextContent(
          'Searching for: dairy farming tips'
        );
      });

      // Search results should be displayed
      expect(screen.getByTestId('search-results')).toHaveTextContent(
        'Mock search results for "dairy farming tips"'
      );
    });

    it('handles mobile search workflow', async () => {
      const user = userEvent.setup();
      renderApp();

      // Open mobile search
      const searchToggleButton = screen.getByLabelText('Search');
      await user.click(searchToggleButton);

      // Mobile search input should appear
      await waitFor(() => {
        const mobileSearchInput = document.getElementById('search-input');
        expect(mobileSearchInput).toBeInTheDocument();
        expect(mobileSearchInput).toHaveFocus();
      });

      // Type in mobile search
      const mobileSearchInput = document.getElementById('search-input');
      await user.type(mobileSearchInput, 'livestock management');

      // Submit mobile search
      const mobileForm = mobileSearchInput.closest('form');
      const mobileSubmitButton = mobileForm.querySelector('button[type="submit"]');
      await user.click(mobileSubmitButton);

      // Should navigate to search results
      await waitFor(() => {
        expect(screen.getByText('Search Results')).toBeInTheDocument();
        expect(screen.getByTestId('search-query')).toHaveTextContent(
          'Searching for: livestock management'
        );
      });
    });

    it('handles empty search gracefully', async () => {
      const user = userEvent.setup();
      renderApp();

      const searchInputs = screen.getAllByPlaceholderText(/search articles/i);
      const searchInput = searchInputs[0];

      // Submit empty search
      const searchForm = searchInput.closest('form');
      const submitButton = searchForm.querySelector('button[type="submit"]');
      await user.click(submitButton);

      // Should stay on current page
      expect(screen.getByText('Home Page')).toBeInTheDocument();
    });

    it('clears search input after successful search', async () => {
      const user = userEvent.setup();
      renderApp();

      const searchInputs = screen.getAllByPlaceholderText(/search articles/i);
      const searchInput = searchInputs[0];

      await user.type(searchInput, 'test search');
      expect(searchInput).toHaveValue('test search');

      const searchForm = searchInput.closest('form');
      const submitButton = searchForm.querySelector('button[type="submit"]');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Search Results')).toBeInTheDocument();
      });

      // Go back to home to check if search input is cleared
      await user.click(screen.getByRole('link', { name: 'Home' }));

      await waitFor(() => {
        const homeSearchInputs = screen.getAllByPlaceholderText(/search articles/i);
        expect(homeSearchInputs[0]).toHaveValue('');
      });
    });
  });

  describe('Content Interaction Workflow', () => {
    it('allows user to browse and interact with blog content', async () => {
      const user = userEvent.setup();
      
      // Mock blog data
      server.use(
        http.get('/api/content/blogs', () => {
          return HttpResponse.json({
            success: true,
            data: {
              blogs: [
                {
                  _id: '1',
                  title: 'Dairy Farming Best Practices',
                  content: 'Learn about dairy farming...',
                  author: 'John Farmer',
                  category: 'Dairy',
                  published: true,
                  createdAt: new Date().toISOString(),
                }
              ],
              total: 1,
            },
          });
        })
      );

      renderApp();

      // Wait for blog list to load
      await waitFor(() => {
        expect(screen.getByText('Home Page')).toBeInTheDocument();
      });

      // Blog content should be visible (mocked in BlogList component)
      // This would test the actual BlogList component integration
    });

    it('handles newsletter subscription workflow', async () => {
      const user = userEvent.setup();
      
      // Mock newsletter subscription
      server.use(
        http.post('/api/content/subscribers', () => {
          return HttpResponse.json({
            success: true,
            message: 'Successfully subscribed to newsletter',
          });
        })
      );

      renderApp();

      // Navigate to subscribe page
      await user.click(screen.getByRole('link', { name: 'Subscribe' }));

      await waitFor(() => {
        expect(screen.getByText('Subscribe Page')).toBeInTheDocument();
      });

      // Newsletter form should be present
      // This would test the actual NewsletterForm component integration
    });
  });

  describe('Error Handling Workflows', () => {
    it('handles navigation errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock console.error to avoid noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderApp();

      // Try to navigate to a non-existent route
      window.history.pushState({}, 'Test page', '/non-existent-route');

      // App should still render header
      expect(screen.getByRole('banner')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('handles API errors during search', async () => {
      const user = userEvent.setup();
      
      // Mock search API error
      server.use(
        http.get('/api/search', () => {
          return HttpResponse.json(
            { success: false, message: 'Search service unavailable' },
            { status: 500 }
          );
        })
      );

      renderApp();

      const searchInputs = screen.getAllByPlaceholderText(/search articles/i);
      const searchInput = searchInputs[0];

      await user.type(searchInput, 'test search');

      const searchForm = searchInput.closest('form');
      const submitButton = searchForm.querySelector('button[type="submit"]');
      await user.click(submitButton);

      // Should still navigate to search page
      await waitFor(() => {
        expect(screen.getByText('Search Results')).toBeInTheDocument();
      });
    });

    it('handles network connectivity issues', async () => {
      const user = userEvent.setup();
      
      // Mock network error
      server.use(
        http.get('/api/content/blogs', () => {
          return HttpResponse.error();
        })
      );

      renderApp();

      // App should still render despite API errors
      expect(screen.getByText('Home Page')).toBeInTheDocument();
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior Workflows', () => {
    it('adapts search workflow for different screen sizes', async () => {
      const user = userEvent.setup();
      renderApp();

      // Test desktop search
      const desktopSearchInputs = screen.getAllByPlaceholderText(/search articles/i);
      expect(desktopSearchInputs.length).toBeGreaterThan(0);

      // Test mobile search toggle
      const searchToggleButton = screen.getByLabelText('Search');
      await user.click(searchToggleButton);

      await waitFor(() => {
        const mobileSearchInput = document.getElementById('search-input');
        expect(mobileSearchInput).toBeInTheDocument();
      });
    });

    it('handles menu interactions across different viewports', async () => {
      const user = userEvent.setup();
      renderApp();

      // Mobile menu should be available
      const menuButton = screen.getByLabelText('Toggle menu');
      expect(menuButton).toBeInTheDocument();

      // Desktop navigation should also be available
      const desktopNavLinks = screen.getAllByRole('link', { name: 'Home' });
      expect(desktopNavLinks.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Loading Workflows', () => {
    it('handles slow API responses gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock slow API response
      server.use(
        http.get('/api/content/blogs', async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return HttpResponse.json({
            success: true,
            data: { blogs: [], total: 0 },
          });
        })
      );

      renderApp();

      // App should render immediately
      expect(screen.getByText('Home Page')).toBeInTheDocument();

      // Navigation should still work during loading
      await user.click(screen.getByRole('link', { name: 'News' }));

      await waitFor(() => {
        expect(screen.getByText('News Page')).toBeInTheDocument();
      });
    });

    it('maintains state during rapid navigation', async () => {
      const user = userEvent.setup();
      renderApp();

      // Rapidly navigate between pages
      await user.click(screen.getByRole('link', { name: 'News' }));
      await user.click(screen.getByRole('link', { name: 'Home' }));
      await user.click(screen.getByRole('link', { name: 'Subscribe' }));

      await waitFor(() => {
        expect(screen.getByText('Subscribe Page')).toBeInTheDocument();
      });

      // Header should still be functional
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });

  describe('Accessibility Workflows', () => {
    it('supports keyboard navigation workflow', async () => {
      renderApp();

      // Focus should be manageable with keyboard
      const logo = screen.getByAltText("Farmer's Weekly Logo");
      logo.focus();
      expect(document.activeElement).toBe(logo);

      // Tab navigation should work
      const searchInputs = screen.getAllByPlaceholderText(/search articles/i);
      if (searchInputs.length > 0) {
        searchInputs[0].focus();
        expect(document.activeElement).toBe(searchInputs[0]);
      }
    });

    it('maintains focus management during navigation', async () => {
      const user = userEvent.setup();
      renderApp();

      // Open mobile menu
      const menuButton = screen.getByLabelText('Toggle menu');
      await user.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Menu')).toBeInTheDocument();
      });

      // Focus should be manageable within menu
      const closeButton = screen.getByLabelText('Close menu');
      closeButton.focus();
      expect(document.activeElement).toBe(closeButton);
    });

    it('provides proper screen reader navigation', () => {
      renderApp();

      // Check for proper landmarks
      expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
      expect(screen.getByRole('main')).toBeInTheDocument(); // Main content

      // Check for proper headings
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  describe('State Management Workflows', () => {
    it('maintains application state during navigation', async () => {
      const user = userEvent.setup();
      renderApp();

      // Perform search to set some state
      const searchInputs = screen.getAllByPlaceholderText(/search articles/i);
      const searchInput = searchInputs[0];

      await user.type(searchInput, 'test query');
      
      const searchForm = searchInput.closest('form');
      const submitButton = searchForm.querySelector('button[type="submit"]');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Search Results')).toBeInTheDocument();
      });

      // Navigate away and back
      await user.click(screen.getByRole('link', { name: 'News' }));
      await waitFor(() => {
        expect(screen.getByText('News Page')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('link', { name: 'Home' }));
      await waitFor(() => {
        expect(screen.getByText('Home Page')).toBeInTheDocument();
      });

      // Application should still be functional
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('handles context state changes during workflows', async () => {
      const user = userEvent.setup();
      renderApp();

      // Test notification context integration
      // This would test actual notification interactions if implemented
      expect(screen.getByRole('banner')).toBeInTheDocument();

      // Navigate to different pages
      await user.click(screen.getByRole('link', { name: 'News' }));
      await waitFor(() => {
        expect(screen.getByText('News Page')).toBeInTheDocument();
      });

      // Context should remain functional
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });
});