// SearchComponent.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import SearchBar from '../components/SearchBar';
import SearchResults from '../pages/SearchResults';
import FilterPanel from '../components/FilterPanel';

// Create a mock for axios
const mock = new MockAdapter(axios);

// Mock data setup
const mockCategories = ['Livestock', 'Crops', 'Machinery'];
const mockTags = ['milk production', 'cattle feed', 'dairy farming'];
const mockSearchResults = {
  success: true,
  message: 'Search completed successfully',
  data: {
    results: [
      {
        _id: '1',
        title: 'Dairy Farming Best Practices',
        contentType: 'dairy',
        description: 'Learn about the best practices in dairy farming',
        createdAt: '2025-01-15T12:00:00.000Z',
        category: 'Livestock',
        tags: ['dairy farming', 'milk production']
      },
      {
        _id: '2',
        title: 'Modern Techniques for Crop Management',
        contentType: 'blog',
        description: 'Discover modern techniques for crop management',
        createdAt: '2025-02-20T12:00:00.000Z',
        category: 'Crops',
        tags: ['crop management', 'farm technology']
      }
    ],
    total: 2,
    page: 1,
    limit: 10,
    contentTypeCounts: {
      dairy: 1,
      blog: 1
    }
  }
};

// Setup mock responses
beforeEach(() => {
  mock.reset();
  // Mock categories endpoint
  mock.onGet(/\/api\/search\/categories\//).reply(200, {
    success: true,
    data: mockCategories
  });
  
  // Mock tags endpoint
  mock.onGet(/\/api\/search\/tags\//).reply(200, {
    success: true,
    data: mockTags
  });
  
  // Mock search results endpoint
  mock.onGet(/\/api\/search\/all/).reply(200, mockSearchResults);
  
  // Mock filter endpoint
  mock.onGet(/\/api\/search\/filter/).reply(200, mockSearchResults);
});

// SearchBar Component Tests
describe('SearchBar Component', () => {
  test('renders correctly', () => {
    render(
      <BrowserRouter>
        <SearchBar />
      </BrowserRouter>
    );
    expect(screen.getByPlaceholderText(/search all content/i)).toBeInTheDocument();
  });

  test('handles input change', () => {
    render(
      <BrowserRouter>
        <SearchBar />
      </BrowserRouter>
    );
    const input = screen.getByPlaceholderText(/search all content/i);
    fireEvent.change(input, { target: { value: 'dairy farming' } });
    expect(input.value).toBe('dairy farming');
  });
});

// FilterPanel Component Tests
describe('FilterPanel Component', () => {
  test('renders correctly', async () => {
    const handleFilterChange = jest.fn();
    
    render(
      <FilterPanel 
        contentType="dairy" 
        onFilterChange={handleFilterChange} 
        initialFilters={{
          categories: [],
          tags: [],
          dateFrom: '',
          dateTo: '',
          sortBy: 'createdAt',
          sortOrder: 'desc'
        }}
      />
    );
    
    // Check if "Filters" button is rendered
    expect(screen.getByText(/filters/i)).toBeInTheDocument();
    
    // Open the filter panel
    fireEvent.click(screen.getByText(/filters/i));
    
    // Wait for categories and tags to load
    await waitFor(() => {
      expect(screen.getByText(/categories/i)).toBeInTheDocument();
    });
  });
});

// SearchResults Page Tests
describe('SearchResults Page', () => {
  test('shows loading state initially', () => {
    // Mock URL params
    const originalLocation = window.location;
    delete window.location;
    window.location = new URL('http://localhost/?q=dairy');
    
    render(
      <BrowserRouter>
        <SearchResults />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/searching/i)).toBeInTheDocument();
    
    // Restore location
    window.location = originalLocation;
  });
  
  test('displays search results after loading', async () => {
    // Mock URL params
    const originalLocation = window.location;
    delete window.location;
    window.location = new URL('http://localhost/?q=dairy');
    
    render(
      <BrowserRouter>
        <SearchResults />
      </BrowserRouter>
    );
    
    // Wait for results to load
    await waitFor(() => {
      expect(screen.getByText('Dairy Farming Best Practices')).toBeInTheDocument();
      expect(screen.getByText('Modern Techniques for Crop Management')).toBeInTheDocument();
    });
    
    // Restore location
    window.location = originalLocation;
  });
});
