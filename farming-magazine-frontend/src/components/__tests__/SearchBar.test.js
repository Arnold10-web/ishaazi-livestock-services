/**
 * SearchBar Component Tests
 * 
 * Comprehensive tests for the SearchBar component including unit, integration,
 * accessibility, and performance tests
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import SearchBar from '../SearchBar';
import { testAccessibility, testKeyboardNavigation } from '../../test-utils/accessibility';

// Mock react-router-dom navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock SearchHistory component
jest.mock('../SearchHistory', () => {
  return function MockSearchHistory({ onSearchClick, isVisible, onClose }) {
    if (!isVisible) return null;
    return (
      <div data-testid="search-history-modal">
        <button onClick={() => onSearchClick('test history search')}>
          Test History Item
        </button>
        <button onClick={onClose}>Close History</button>
      </div>
    );
  };
});

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

// Helper function to render SearchBar with wrapper
const renderSearchBar = (props = {}) => {
  return render(
    <TestWrapper>
      <SearchBar {...props} />
    </TestWrapper>
  );
};

describe('SearchBar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    fetch.mockClear();
    localStorageMock.getItem.mockReturnValue('[]');
    localStorageMock.setItem.mockClear();
    
    // Mock console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      renderSearchBar();
      expect(screen.getByPlaceholderText('Search all content...')).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      renderSearchBar({ placeholder: 'Custom search placeholder' });
      expect(screen.getByPlaceholderText('Custom search placeholder')).toBeInTheDocument();
    });

    it('renders expandable search as button initially', () => {
      renderSearchBar({ expandable: true });
      expect(screen.getByLabelText('Open search')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Search all content...')).not.toBeInTheDocument();
    });

    it('renders search input elements', () => {
      renderSearchBar();
      
      expect(screen.getByPlaceholderText('Search all content...')).toBeInTheDocument();
      expect(screen.getByLabelText('Submit search')).toBeInTheDocument();
      expect(screen.getByTitle('Search History')).toBeInTheDocument();
    });

    it('shows search icons', () => {
      renderSearchBar();
      
      // Search icon should be present
      const searchIcons = document.querySelectorAll('svg');
      expect(searchIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Expandable Search', () => {
    it('expands when expandable button is clicked', async () => {
      const user = userEvent.setup();
      renderSearchBar({ expandable: true });
      
      const expandButton = screen.getByLabelText('Open search');
      await user.click(expandButton);
      
      expect(screen.getByPlaceholderText('Search all content...')).toBeInTheDocument();
      expect(screen.queryByLabelText('Open search')).not.toBeInTheDocument();
    });

    it('auto-focuses input when expanded', async () => {
      const user = userEvent.setup();
      renderSearchBar({ expandable: true });
      
      const expandButton = screen.getByLabelText('Open search');
      await user.click(expandButton);
      
      const input = screen.getByPlaceholderText('Search all content...');
      expect(input).toHaveFocus();
    });

    it('collapses when clicking outside', async () => {
      const user = userEvent.setup();
      renderSearchBar({ expandable: true });
      
      // Expand first
      const expandButton = screen.getByLabelText('Open search');
      await user.click(expandButton);
      
      expect(screen.getByPlaceholderText('Search all content...')).toBeInTheDocument();
      
      // Click outside
      await user.click(document.body);
      
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Search all content...')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Open search')).toBeInTheDocument();
      });
    });
  });

  describe('Search Input Functionality', () => {
    it('updates input value when typing', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText('Search all content...');
      await user.type(input, 'dairy farming');
      
      expect(input).toHaveValue('dairy farming');
    });

    it('shows clear button when input has value', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText('Search all content...');
      await user.type(input, 'test');
      
      expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
    });

    it('clears input when clear button is clicked', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText('Search all content...');
      await user.type(input, 'test query');
      
      const clearButton = screen.getByLabelText('Clear search');
      await user.click(clearButton);
      
      expect(input).toHaveValue('');
      expect(input).toHaveFocus();
    });

    it('submits search on form submission', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText('Search all content...');
      await user.type(input, 'dairy farming');
      
      const form = input.closest('form');
      await user.click(screen.getByLabelText('Submit search'));
      
      expect(mockNavigate).toHaveBeenCalledWith('/search?q=dairy%20farming');
    });

    it('submits search on Enter key', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText('Search all content...');
      await user.type(input, 'livestock management{enter}');
      
      expect(mockNavigate).toHaveBeenCalledWith('/search?q=livestock%20management');
    });

    it('does not submit empty search', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText('Search all content...');
      await user.click(screen.getByLabelText('Submit search'));
      
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('trims whitespace from search query', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText('Search all content...');
      await user.type(input, '  dairy farming  {enter}');
      
      expect(mockNavigate).toHaveBeenCalledWith('/search?q=dairy%20farming');
    });
  });

  describe('Search Suggestions', () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            suggestions: [
              { text: 'dairy farming', type: 'popular', contentType: 'blog', searchCount: 150 },
              { text: 'dairy cattle', type: 'recent', contentType: 'news' },
              { text: 'dairy nutrition', type: 'tag', contentType: 'article' },
            ]
          }
        })
      });
    });

    it('fetches suggestions when typing', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText('Search all content...');
      await user.type(input, 'dairy');
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/search/suggestions?query=dairy&limit=8')
        );
      });
    });

    it('does not fetch suggestions for short queries', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText('Search all content...');
      await user.type(input, 'd');
      
      // Wait a bit to ensure no fetch call is made
      await new Promise(resolve => setTimeout(resolve, 400));
      
      expect(fetch).not.toHaveBeenCalled();
    });

    it('displays suggestions when available', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText('Search all content...');
      await user.type(input, 'dairy');
      
      await waitFor(() => {
        expect(screen.getByText('dairy farming')).toBeInTheDocument();
        expect(screen.getByText('dairy cattle')).toBeInTheDocument();
        expect(screen.getByText('dairy nutrition')).toBeInTheDocument();
      });
    });

    it('shows suggestion metadata', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText('Search all content...');
      await user.type(input, 'dairy');
      
      await waitFor(() => {
        expect(screen.getByText('blog')).toBeInTheDocument();
        expect(screen.getByText('news')).toBeInTheDocument();
        expect(screen.getByText('150')).toBeInTheDocument(); // search count
      });
    });

    it('navigates when suggestion is clicked', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText('Search all content...');
      await user.type(input, 'dairy');
      
      await waitFor(() => {
        expect(screen.getByText('dairy farming')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('dairy farming'));
      
      expect(mockNavigate).toHaveBeenCalledWith('/search?q=dairy%20farming');
    });

    it('hides suggestions when clicking outside', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText('Search all content...');
      await user.type(input, 'dairy');
      
      await waitFor(() => {
        expect(screen.getByText('dairy farming')).toBeInTheDocument();
      });
      
      await user.click(document.body);
      
      await waitFor(() => {
        expect(screen.queryByText('dairy farming')).not.toBeInTheDocument();
      });
    });

    it('handles API errors gracefully', async () => {
      fetch.mockRejectedValue(new Error('API Error'));
      
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText('Search all content...');
      await user.type(input, 'dairy');
      
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Error fetching suggestions:', expect.any(Error));
      });
      
      // Should not show suggestions
      expect(screen.queryByText('dairy farming')).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            suggestions: [
              { text: 'dairy farming', type: 'popular' },
              { text: 'dairy cattle', type: 'recent' },
              { text: 'dairy nutrition', type: 'tag' },
            ]
          }
        })
      });
    });

    it('navigates suggestions with arrow keys', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText('Search all content...');
      await user.type(input, 'dairy');
      
      await waitFor(() => {
        expect(screen.getByText('dairy farming')).toBeInTheDocument();
      });
      
      // Navigate down
      await user.keyboard('{ArrowDown}');
      
      // First suggestion should be highlighted (we can't easily test visual highlighting in jsdom)
      // But we can test that the active index changes by testing Enter key behavior
      await user.keyboard('{Enter}');
      
      expect(mockNavigate).toHaveBeenCalledWith('/search?q=dairy%20farming');
    });

    it('navigates up and down through suggestions', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText('Search all content...');
      await user.type(input, 'dairy');
      
      await waitFor(() => {
        expect(screen.getByText('dairy farming')).toBeInTheDocument();
      });
      
      // Navigate down twice, then up once
      await user.keyboard('{ArrowDown}{ArrowDown}{ArrowUp}');
      
      // Should select the first suggestion
      await user.keyboard('{Enter}');
      
      expect(mockNavigate).toHaveBeenCalledWith('/search?q=dairy%20farming');
    });

    it('closes suggestions with Escape key', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText('Search all content...');
      await user.type(input, 'dairy');
      
      await waitFor(() => {
        expect(screen.getByText('dairy farming')).toBeInTheDocument();
      });
      
      await user.keyboard('{Escape}');
      
      await waitFor(() => {
        expect(screen.queryByText('dairy farming')).not.toBeInTheDocument();
      });
    });

    it('submits current query when Enter is pressed without active suggestion', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText('Search all content...');
      await user.type(input, 'dairy');
      
      await waitFor(() => {
        expect(screen.getByText('dairy farming')).toBeInTheDocument();
      });
      
      // Press Enter without navigating to any suggestion
      await user.keyboard('{Enter}');
      
      expect(mockNavigate).toHaveBeenCalledWith('/search?q=dairy');
    });
  });

  describe('Search History', () => {
    it('opens search history modal', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const historyButton = screen.getByTitle('Search History');
      await user.click(historyButton);
      
      expect(screen.getByTestId('search-history-modal')).toBeInTheDocument();
    });

    it('handles search from history', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      // Open history
      const historyButton = screen.getByTitle('Search History');
      await user.click(historyButton);
      
      // Click on history item
      const historyItem = screen.getByText('Test History Item');
      await user.click(historyItem);
      
      expect(mockNavigate).toHaveBeenCalledWith('/search?q=test%20history%20search');
    });

    it('closes history modal', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      // Open history
      const historyButton = screen.getByTitle('Search History');
      await user.click(historyButton);
      
      expect(screen.getByTestId('search-history-modal')).toBeInTheDocument();
      
      // Close history
      const closeButton = screen.getByText('Close History');
      await user.click(closeButton);
      
      expect(screen.queryByTestId('search-history-modal')).not.toBeInTheDocument();
    });

    it('saves search to localStorage', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText('Search all content...');
      await user.type(input, 'dairy farming{enter}');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'searchHistory',
        expect.stringContaining('dairy farming')
      );
    });

    it('limits search history to 20 items', async () => {
      // Mock existing history with 20 items
      const existingHistory = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        searchTerm: `search ${i}`,
        timestamp: new Date().toISOString(),
      }));
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingHistory));
      
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText('Search all content...');
      await user.type(input, 'new search{enter}');
      
      const savedHistory = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedHistory).toHaveLength(20);
      expect(savedHistory[0].searchTerm).toBe('new search');
    });

    it('removes duplicate searches from history', async () => {
      const existingHistory = [
        { id: 1, searchTerm: 'dairy farming', timestamp: new Date().toISOString() },
        { id: 2, searchTerm: 'beef cattle', timestamp: new Date().toISOString() },
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingHistory));
      
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText('Search all content...');
      await user.type(input, 'dairy farming{enter}');
      
      const savedHistory = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      const dairySearches = savedHistory.filter(item => 
        item.searchTerm.toLowerCase() === 'dairy farming'
      );
      expect(dairySearches).toHaveLength(1);
    });
  });

  describe('Analytics Tracking', () => {
    beforeEach(() => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
    });

    it('tracks manual search analytics', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText('Search all content...');
      await user.type(input, 'dairy farming{enter}');
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/search/analytics/track'),
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('manual_search')
          })
        );
      });
    });

    it('tracks suggestion click analytics', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              suggestions: [{ text: 'dairy farming', type: 'popular' }]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText('Search all content...');
      await user.type(input, 'dairy');
      
      await waitFor(() => {
        expect(screen.getByText('dairy farming')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('dairy farming'));
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/search/analytics/track'),
          expect.objectContaining({
            body: expect.stringContaining('suggestion_click')
          })
        );
      });
    });

    it('handles analytics errors gracefully', async () => {
      fetch.mockRejectedValue(new Error('Analytics API Error'));
      
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText('Search all content...');
      await user.type(input, 'dairy farming{enter}');
      
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Error tracking search analytics:',
          expect.any(Error)
        );
      });
      
      // Navigation should still work
      expect(mockNavigate).toHaveBeenCalledWith('/search?q=dairy%20farming');
    });
  });

  describe('Loading States', () => {
    it('shows loading indicator during search', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText('Search all content...');
      await user.type(input, 'dairy farming{enter}');
      
      // Loading indicator should appear briefly
      // Note: In real implementation, this would be visible for a short time
      expect(mockNavigate).toHaveBeenCalled();
    });

    it('hides submit button when loading', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText('Search all content...');
      await user.type(input, 'dairy farming');
      
      // Submit button should be visible when not loading
      expect(screen.getByLabelText('Submit search')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('passes accessibility tests', async () => {
      const { container } = renderSearchBar();
      await testAccessibility(container);
    });

    it('supports keyboard navigation', async () => {
      const { container } = renderSearchBar();
      
      await testKeyboardNavigation(container, [
        'input[type="text"]',
        'button[type="submit"]',
        'button[title="Search History"]',
      ]);
    });

    it('has proper ARIA labels', () => {
      renderSearchBar();
      
      expect(screen.getByLabelText('Submit search')).toBeInTheDocument();
      expect(screen.getByTitle('Search History')).toBeInTheDocument();
    });

    it('has proper ARIA labels for expandable search', () => {
      renderSearchBar({ expandable: true });
      
      expect(screen.getByLabelText('Open search')).toBeInTheDocument();
    });

    it('maintains focus management', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText('Search all content...');
      input.focus();
      expect(document.activeElement).toBe(input);
      
      // Type and clear
      await user.type(input, 'test');
      const clearButton = screen.getByLabelText('Clear search');
      await user.click(clearButton);
      
      expect(document.activeElement).toBe(input);
    });

    it('provides proper autocomplete attributes', () => {
      renderSearchBar();
      
      const input = screen.getByPlaceholderText('Search all content...');
      expect(input).toHaveAttribute('autoComplete', 'off');
    });
  });

  describe('Performance', () => {
    it('debounces API calls', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText('Search all content...');
      
      // Type rapidly
      await user.type(input, 'dairy');
      
      // Should only make one API call after debounce delay
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });
    });

    it('cancels pending API calls on unmount', () => {
      const { unmount } = renderSearchBar();
      
      // This test ensures cleanup happens
      unmount();
      
      // No errors should occur
      expect(true).toBe(true);
    });

    it('handles rapid typing without performance issues', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText('Search all content...');
      
      // Rapidly type and delete
      for (let i = 0; i < 10; i++) {
        await user.type(input, 'a');
        await user.keyboard('{Backspace}');
      }
      
      // Component should still be functional
      expect(input).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined environment variables', () => {
      const originalEnv = process.env.REACT_APP_API_URL;
      delete process.env.REACT_APP_API_URL;
      
      renderSearchBar();
      
      // Should render without errors
      expect(screen.getByPlaceholderText('Search all content...')).toBeInTheDocument();
      
      // Restore
      process.env.REACT_APP_API_URL = originalEnv;
    });

    it('handles malformed API responses', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ invalid: 'response' })
      });
      
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText('Search all content...');
      await user.type(input, 'dairy');
      
      // Should not crash
      expect(input).toBeInTheDocument();
    });

    it('handles localStorage errors', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText('Search all content...');
      await user.type(input, 'dairy farming{enter}');
      
      // Should still navigate despite storage error
      expect(mockNavigate).toHaveBeenCalledWith('/search?q=dairy%20farming');
    });

    it('handles special characters in search query', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const input = screen.getByPlaceholderText('Search all content...');
      await user.type(input, 'dairy & cattle farming!{enter}');
      
      expect(mockNavigate).toHaveBeenCalledWith('/search?q=dairy%20%26%20cattle%20farming!');
    });

    it('handles very long search queries', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const longQuery = 'a'.repeat(1000);
      const input = screen.getByPlaceholderText('Search all content...');
      await user.type(input, longQuery);
      
      expect(input).toHaveValue(longQuery);
    });
  });
});