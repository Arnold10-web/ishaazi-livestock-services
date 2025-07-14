/**
 * Component Unit Test for App.js
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

test('renders the app component', () => {
  render(<App />);
  const linkElement = screen.getByText(/farming magazine/i);
  expect(linkElement).toBeInTheDocument();
});
