/**
 * Basic Test to Verify Setup
 * 
 * Simple test to ensure the testing environment is working correctly
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

// Simple test component
const TestComponent = ({ message = 'Hello, Testing!' }) => {
  return (
    <div>
      <h1>Test Component</h1>
      <p data-testid="message">{message}</p>
      <button>Click me</button>
    </div>
  );
};

describe('Basic Test Setup', () => {
  it('renders without crashing', () => {
    render(<TestComponent />);
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  it('displays the correct message', () => {
    render(<TestComponent message="Custom message" />);
    expect(screen.getByTestId('message')).toHaveTextContent('Custom message');
  });

  it('has a button element', () => {
    render(<TestComponent />);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('passes basic accessibility test', () => {
    render(<TestComponent />);
    
    // Check for heading
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    
    // Check for button
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});

describe('Testing Environment', () => {
  it('has jest-dom matchers available', () => {
    render(<TestComponent />);
    const element = screen.getByText('Test Component');
    
    // These matchers come from @testing-library/jest-dom
    expect(element).toBeInTheDocument();
    expect(element).toBeVisible();
  });

  it('has global mocks available', () => {
    // Test that our global mocks are working
    expect(global.localStorage).toBeDefined();
    expect(global.localStorage.getItem).toBeInstanceOf(Function);
    
    expect(window.matchMedia).toBeDefined();
    expect(window.matchMedia).toBeInstanceOf(Function);
  });

  it('can mock functions', () => {
    const mockFn = jest.fn();
    mockFn('test');
    
    expect(mockFn).toHaveBeenCalledWith('test');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});