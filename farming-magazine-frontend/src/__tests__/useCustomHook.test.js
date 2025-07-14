/**
 * Hook Test for a Custom React Hook
 */

import { renderHook, act } from '@testing-library/react-hooks';
import useCustomHook from '../hooks/useCustomHook';

test('should use custom hook and update state', () => {
  const { result } = renderHook(() => useCustomHook());

  expect(result.current.value).toBe(0);

  act(() => {
    result.current.increment();
  });

  expect(result.current.value).toBe(1);
});
