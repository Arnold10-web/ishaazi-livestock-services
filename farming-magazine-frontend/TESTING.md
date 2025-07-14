# Frontend Testing Strategy

This document outlines the comprehensive testing strategy for the Farming Magazine Frontend application, including setup, execution, and best practices.

## Table of Contents

- [Overview](#overview)
- [Testing Stack](#testing-stack)
- [Test Categories](#test-categories)
- [Getting Started](#getting-started)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Coverage Requirements](#coverage-requirements)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Our testing strategy follows a comprehensive approach that includes:

- **Unit Tests**: Testing individual components, hooks, and utilities in isolation
- **Integration Tests**: Testing user workflows and component interactions
- **Accessibility Tests**: Ensuring WCAG compliance and keyboard navigation
- **Visual Regression Tests**: Detecting unintended visual changes
- **API Integration Tests**: Testing API interactions with MSW (Mock Service Worker)

## Testing Stack

### Core Testing Libraries

- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **MSW (Mock Service Worker)**: API mocking
- **jest-axe**: Accessibility testing
- **Puppeteer**: Visual regression testing
- **@testing-library/user-event**: User interaction simulation

### Additional Tools

- **Framer Motion**: Animation testing utilities
- **React Router**: Navigation testing
- **Axios**: HTTP client testing

## Test Categories

### 1. Unit Tests

Test individual components, hooks, and utilities in isolation.

**Location**: `src/**/__tests__/*.test.js`

**Coverage**: 
- Component rendering
- Props handling
- State management
- Event handlers
- Error boundaries

### 2. Integration Tests

Test user workflows and component interactions.

**Location**: `src/__tests__/integration/*.test.js`

**Coverage**:
- Navigation workflows
- Search functionality
- Content interaction
- Form submissions
- Error handling

### 3. Hook Tests

Test custom React hooks in isolation.

**Location**: `src/hooks/__tests__/*.test.js`

**Coverage**:
- Hook state management
- Side effects
- Dependencies
- Error handling
- Performance

### 4. Context Tests

Test React context providers and consumers.

**Location**: `src/contexts/__tests__/*.test.js`

**Coverage**:
- Provider functionality
- State updates
- Consumer behavior
- Error boundaries

### 5. Accessibility Tests

Ensure WCAG compliance and keyboard navigation.

**Tools**: jest-axe, custom accessibility utilities

**Coverage**:
- ARIA attributes
- Keyboard navigation
- Screen reader compatibility
- Color contrast
- Semantic HTML

### 6. Visual Regression Tests

Detect unintended visual changes across different viewports.

**Tools**: Puppeteer, custom visual testing utilities

**Coverage**:
- Component appearance
- Responsive design
- Animation states
- Theme variations

## Getting Started

### Prerequisites

```bash
# Install dependencies
npm install

# Ensure all testing dependencies are installed
npm install --dev
```

### Environment Setup

1. **Environment Variables**: Copy `.env.example` to `.env.test` and configure test-specific variables.

2. **Test Database**: Ensure test database is set up (if applicable).

3. **Mock Service Worker**: MSW is configured automatically in `src/setupTests.js`.

## Running Tests

### Quick Commands

```bash
# Run all tests
npm test

# Run comprehensive test suite
npm run test:all

# Run tests in parallel (faster)
npm run test:all:parallel

# Quick test run (skip visual and coverage)
npm run test:quick
```

### Category-Specific Tests

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# Component tests
npm run test:components

# Hook tests
npm run test:hooks

# Context tests
npm run test:contexts

# Accessibility tests
npm run test:accessibility

# Visual regression tests
npm run test:visual
```

### Development Commands

```bash
# Watch mode for components
npm run test:components:watch

# Watch mode for hooks
npm run test:hooks:watch

# Debug tests
npm run test:debug

# Update snapshots
npm run test:update-snapshots

# Clear test cache
npm run test:clear-cache
```

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# CI coverage (no watch mode)
npm run test:ci
```

## Writing Tests

### Component Tests

```javascript
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { NotificationProvider } from '../../contexts/NotificationContext';
import MyComponent from '../MyComponent';
import { testAccessibility } from '../../test-utils/accessibility';

// Test wrapper with providers
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <NotificationProvider>
      {children}
    </NotificationProvider>
  </BrowserRouter>
);

describe('MyComponent', () => {
  it('renders without crashing', () => {
    render(
      <TestWrapper>
        <MyComponent />
      </TestWrapper>
    );
    
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles user interactions', async () => {
    const user = userEvent.setup();
    const mockHandler = jest.fn();
    
    render(
      <TestWrapper>
        <MyComponent onSubmit={mockHandler} />
      </TestWrapper>
    );
    
    await user.click(screen.getByRole('button'));
    expect(mockHandler).toHaveBeenCalled();
  });

  it('passes accessibility tests', async () => {
    const { container } = render(
      <TestWrapper>
        <MyComponent />
      </TestWrapper>
    );
    
    await testAccessibility(container);
  });
});
```

### Hook Tests

```javascript
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from '../useMyHook';

describe('useMyHook', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useMyHook());
    
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('handles state updates', async () => {
    const { result } = renderHook(() => useMyHook());
    
    await act(async () => {
      await result.current.fetchData();
    });
    
    expect(result.current.data).toBeDefined();
  });
});
```

### Integration Tests

```javascript
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import App from '../../App';

describe('User Workflows', () => {
  it('completes search workflow', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    // Type in search
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'dairy farming');
    
    // Submit search
    await user.keyboard('{Enter}');
    
    // Verify navigation
    await waitFor(() => {
      expect(screen.getByText(/search results/i)).toBeInTheDocument();
    });
  });
});
```

### Visual Regression Tests

Visual tests are automatically run with the visual regression script:

```bash
# Run all visual tests
npm run test:visual

# Run specific component
npm run test:visual -- --component Header

# Run specific viewport
npm run test:visual -- --viewport mobile

# Update baseline images
npm run test:visual -- --update-baseline
```

## Coverage Requirements

### Global Coverage Thresholds

- **Statements**: 85%
- **Branches**: 80%
- **Functions**: 85%
- **Lines**: 85%

### Component-Specific Thresholds

- **Components**: 80% (all metrics)
- **Hooks**: 90% (all metrics)
- **Contexts**: 95% (all metrics)
- **Utilities**: 90% (all metrics)

### Coverage Reports

Coverage reports are generated in:
- **HTML**: `coverage/lcov-report/index.html`
- **JSON**: `coverage/coverage-final.json`
- **LCOV**: `coverage/lcov.info`

## CI/CD Integration

### GitHub Actions

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run test suite
        run: npm run test:ci
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

### Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:quick",
      "pre-push": "npm run test:ci"
    }
  }
}
```

## Best Practices

### 1. Test Structure

- **Arrange**: Set up test data and environment
- **Act**: Execute the functionality being tested
- **Assert**: Verify the expected outcome

### 2. Test Naming

```javascript
// Good
it('displays error message when API call fails')
it('navigates to search results when form is submitted')

// Bad
it('should work')
it('test component')
```

### 3. Test Data

- Use factories for consistent test data
- Keep test data minimal and focused
- Use realistic data that matches production

### 4. Mocking

- Mock external dependencies
- Use MSW for API mocking
- Mock only what's necessary

### 5. Accessibility Testing

- Test keyboard navigation
- Verify ARIA attributes
- Check semantic HTML structure
- Test with screen readers (manual)

### 6. Performance Testing

- Test component render times
- Monitor memory usage
- Test with large datasets

## Troubleshooting

### Common Issues

#### 1. Tests Timing Out

```javascript
// Increase timeout for specific tests
it('handles slow operation', async () => {
  // Test code
}, 10000); // 10 second timeout
```

#### 2. MSW Not Working

Check that MSW is properly set up in `setupTests.js`:

```javascript
import { server } from './test-utils/mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

#### 3. Visual Tests Failing

```bash
# Update baseline images
npm run test:visual -- --update-baseline

# Check for environment differences
npm run test:visual -- --component Header --viewport desktop
```

#### 4. Coverage Issues

```bash
# Clear coverage cache
npm run test:clear-cache

# Run coverage with verbose output
npm run test:coverage -- --verbose
```

### Debug Mode

```bash
# Run tests in debug mode
npm run test:debug

# Debug specific test file
npm run test:debug -- --testNamePattern="MyComponent"
```

### Environment Issues

1. **Node Version**: Ensure Node.js 18+ is installed
2. **Dependencies**: Run `npm ci` for clean install
3. **Cache**: Clear cache with `npm run test:clear-cache`
4. **Environment Variables**: Check `.env.test` configuration

## Test Utilities

### Custom Matchers

```javascript
// Available custom matchers
expect(element).toBeVisible();
expect(container).toHaveLoadingState();
expect(container).toHaveErrorState();
```

### Test Helpers

```javascript
import { 
  mockData, 
  testScenarios, 
  createMockResponse 
} from '../test-utils/test-config';

// Use predefined mock data
const blog = mockData.blog;

// Use test scenarios
const loadingState = testScenarios.loading;
const successState = testScenarios.success(data);
```

### Accessibility Helpers

```javascript
import { 
  testAccessibility, 
  testKeyboardNavigation,
  testSemanticStructure 
} from '../test-utils/accessibility';

// Test accessibility
await testAccessibility(container);

// Test keyboard navigation
await testKeyboardNavigation(container, [
  'input[type="text"]',
  'button[type="submit"]'
]);

// Test semantic structure
testSemanticStructure(container, {
  hasNavigation: true,
  hasHeadings: true
});
```

## Continuous Improvement

### Metrics to Monitor

- Test coverage percentage
- Test execution time
- Flaky test rate
- Visual regression failures

### Regular Tasks

- Review and update test data
- Refactor slow or flaky tests
- Update accessibility requirements
- Review coverage reports

### Team Practices

- Code review includes test review
- Pair programming on complex tests
- Regular testing workshops
- Documentation updates

---

For questions or issues with testing, please refer to the team documentation or create an issue in the project repository.