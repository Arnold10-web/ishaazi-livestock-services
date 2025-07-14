/**
 * API Integration Tests using MSW
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App';

const server = setupServer(
  rest.get('/api/data', (req, res, ctx) => {
    return res(ctx.json({ data: 'mocked data' }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('fetches and displays data from API', async () => {
  render(<App />);
  await waitFor(() => screen.getByText(/mocked data/i));
  expect(screen.getByText(/mocked data/i)).toBeInTheDocument();
});
