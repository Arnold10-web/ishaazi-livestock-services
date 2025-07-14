/**
 * Context Provider Test
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MyContextProvider, MyContext } from '../contexts/MyContext';

test('provides context value to children', () => {
  const TestComponent = () => {
    const context = React.useContext(MyContext);
    return <div>{context.value}</div>;
  };

  render(
    <MyContextProvider>
      <TestComponent />
    </MyContextProvider>
  );

  expect(screen.getByText(/some context value/i)).toBeInTheDocument();
});
