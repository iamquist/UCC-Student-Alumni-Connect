import { useState, useEffect, useCallback, useRef } from 'react';
import { socketService } from '@/services/socket';

// ── useDebounce ────────────────────────────────────────────────
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

// ── useAsync ───────────────────────────────────────────────────
export function useAsync<T>(
  asyncFn: () => Promise<T>,
  deps: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => { execute(); }, [execute]);

  return { data, loading, error, refetch: execute };
}

// ── usePagination ──────────────────────────────────────────────
export function usePagination<T>(
  fetchFn: (page: number) => Promise<{ data: T[]; pagination: { hasNext: boolean; total: number } }>,
  deps: unknown[] = []
) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const loadPage = useCallback(async (p: number, reset = false) => {
    setLoading(true);
    try {
      const result = await fetchFn(p);
      setItems(prev => reset ? result.data : [...prev, ...result.data]);
      setHasNext(result.pagination.hasNext);
      setTotal(result.pagination.total);
      setPage(p);
      setInitialLoaded(true);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => { loadPage(1, true); }, [loadPage]);

  const loadMore = useCallback(() => {
    if (!loading && hasNext) loadPage(page + 1);
  }, [loading, hasNext, page, loadPage]);

  const refresh = useCallback(() => loadPage(1, true), [loadPage]);

  return { items, loading, hasNext, total, loadMore, refresh, initialLoaded };
}

// ── useOnlineStatus ────────────────────────────────────────────
export function useOnlineStatus(userId: string | undefined) {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const unsubOnline = socketService.onUserOnline(({ userId: uid }) => {
      if (uid === userId) setIsOnline(true);
    });
    const unsubOffline = socketService.onUserOffline(({ userId: uid }) => {
      if (uid === userId) setIsOnline(false);
    });

    return () => { unsubOnline(); unsubOffline(); };
  }, [userId]);

  return isOnline;
}

// ── useTypingIndicator ─────────────────────────────────────────
export function useTypingIndicator(conversationId: string | null) {
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();

  const startTyping = useCallback(() => {
    if (!conversationId) return;
    if (!isTyping) {
      setIsTyping(true);
      socketService.startTyping(conversationId);
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      setIsTyping(false);
      if (conversationId) socketService.stopTyping(conversationId);
    }, 1500);
  }, [conversationId, isTyping]);

  const stopTyping = useCallback(() => {
    clearTimeout(typingTimeout.current);
    if (isTyping && conversationId) {
      setIsTyping(false);
      socketService.stopTyping(conversationId);
    }
  }, [conversationId, isTyping]);

  useEffect(() => () => clearTimeout(typingTimeout.current), []);

  return { isTyping, startTyping, stopTyping };
}

// ── useClickOutside ────────────────────────────────────────────
export function useClickOutside<T extends HTMLElement>(
  callback: () => void
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callback();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [callback]);

  return ref;
}

// ── useLocalStorage ────────────────────────────────────────────
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const set = useCallback((val: T | ((prev: T) => T)) => {
    setValue(prev => {
      const next = typeof val === 'function' ? (val as (p: T) => T)(prev) : val;
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }, [key]);

  return [value, set] as const;
}

// ── useWindowSize ──────────────────────────────────────────────
export function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return size;
}

// ── useTitle ───────────────────────────────────────────────────
export function useTitle(title: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} | UniAlum` : 'UniAlum';
    return () => { document.title = prev; };
  }, [title]);
}
