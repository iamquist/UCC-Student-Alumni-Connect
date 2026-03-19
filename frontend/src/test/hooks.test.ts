import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDebounce, useLocalStorage, useTitle, usePagination } from '@/hooks/index';

vi.mock('@/services/socket', () => ({
  socketService: {
    onUserOnline: vi.fn(() => vi.fn()),
    onUserOffline: vi.fn(() => vi.fn()),
    startTyping: vi.fn(),
    stopTyping: vi.fn(),
  },
}));

describe('useDebounce', () => {
  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300));
    expect(result.current).toBe('hello');
  });

  it('debounces value updates', async () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'initial' },
    });

    rerender({ value: 'updated' });
    expect(result.current).toBe('initial');

    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe('updated');
    vi.useRealTimers();
  });

  it('does not update if value reverts within delay', async () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'initial' },
    });

    rerender({ value: 'changed' });
    act(() => vi.advanceTimersByTime(100));
    rerender({ value: 'initial' });
    act(() => vi.advanceTimersByTime(300));

    expect(result.current).toBe('initial');
    vi.useRealTimers();
  });
});

describe('useLocalStorage', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('returns initial value when key does not exist', () => {
    const { result } = renderHook(() => useLocalStorage('testKey', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('persists value to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('testKey2', ''));
    act(() => result.current[1]('saved value'));
    expect(localStorage.getItem('testKey2')).toBe('"saved value"');
  });

  it('reads existing value from localStorage', () => {
    localStorage.setItem('existingKey', JSON.stringify('stored'));
    const { result } = renderHook(() => useLocalStorage('existingKey', 'default'));
    expect(result.current[0]).toBe('stored');
  });

  it('supports object values', () => {
    const { result } = renderHook(() => useLocalStorage('objKey', { count: 0 }));
    act(() => result.current[1]({ count: 5 }));
    expect(result.current[0]).toEqual({ count: 5 });
  });

  it('supports functional updates', () => {
    const { result } = renderHook(() => useLocalStorage('numKey', 0));
    act(() => result.current[1](prev => prev + 1));
    expect(result.current[0]).toBe(1);
  });
});

describe('useTitle', () => {
  it('sets document title', () => {
    renderHook(() => useTitle('Test Page'));
    expect(document.title).toBe('Test Page | UniAlum');
  });

  it('sets default title when empty string', () => {
    renderHook(() => useTitle(''));
    expect(document.title).toBe('UniAlum');
  });

  it('restores previous title on unmount', () => {
    document.title = 'Previous Title';
    const { unmount } = renderHook(() => useTitle('New Title'));
    expect(document.title).toBe('New Title | UniAlum');
    unmount();
    expect(document.title).toBe('Previous Title');
  });
});

describe('usePagination', () => {
  it('loads initial data', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      data: ['item1', 'item2', 'item3'],
      pagination: { hasNext: false, total: 3 },
    });

    const { result } = renderHook(() => usePagination(fetchFn));

    await waitFor(() => expect(result.current.initialLoaded).toBe(true));

    expect(result.current.items).toEqual(['item1', 'item2', 'item3']);
    expect(result.current.total).toBe(3);
    expect(result.current.hasNext).toBe(false);
    expect(fetchFn).toHaveBeenCalledWith(1);
  });

  it('loads more items', async () => {
    const fetchFn = vi.fn()
      .mockResolvedValueOnce({ data: ['a', 'b'], pagination: { hasNext: true, total: 4 } })
      .mockResolvedValueOnce({ data: ['c', 'd'], pagination: { hasNext: false, total: 4 } });

    const { result } = renderHook(() => usePagination(fetchFn));
    await waitFor(() => expect(result.current.initialLoaded).toBe(true));

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.items).toHaveLength(4));
    expect(result.current.items).toEqual(['a', 'b', 'c', 'd']);
  });

  it('refresh resets items', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      data: ['fresh1', 'fresh2'],
      pagination: { hasNext: false, total: 2 },
    });

    const { result } = renderHook(() => usePagination(fetchFn));
    await waitFor(() => expect(result.current.initialLoaded).toBe(true));

    act(() => result.current.refresh());
    await waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(2));
    expect(result.current.items).toEqual(['fresh1', 'fresh2']);
  });
});
