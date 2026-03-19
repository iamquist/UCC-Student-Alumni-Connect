import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Avatar from '@/components/shared/Avatar';
import { useAuthStore } from '@/store/authStore';

// ── Avatar component tests ────────────────────────────────────
describe('Avatar Component', () => {
  it('renders initials when no profile picture', () => {
    const user = { firstName: 'John', lastName: 'Doe', _id: 'abc123' };
    render(<Avatar user={user} />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders image when profile picture is provided', () => {
    const user = {
      firstName: 'Jane',
      lastName: 'Smith',
      profilePicture: 'https://example.com/avatar.jpg',
      _id: 'def456',
    };
    render(<Avatar user={user} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    expect(img).toHaveAttribute('alt', 'Jane Smith');
  });

  it('shows online indicator when online=true', () => {
    const user = { firstName: 'Bob', lastName: 'Jones', _id: 'ghi789' };
    const { container } = render(<Avatar user={user} online={true} />);
    // The online dot has bg-green-400 class
    const dot = container.querySelector('.bg-green-400');
    expect(dot).toBeInTheDocument();
  });

  it('shows offline indicator when online=false', () => {
    const user = { firstName: 'Bob', lastName: 'Jones', _id: 'ghi789' };
    const { container } = render(<Avatar user={user} online={false} />);
    const dot = container.querySelector('.bg-gray-300');
    expect(dot).toBeInTheDocument();
  });

  it('applies size class correctly', () => {
    const user = { firstName: 'A', lastName: 'B', _id: 'abc' };
    const { container } = render(<Avatar user={user} size="lg" />);
    const el = container.firstChild?.firstChild;
    expect(el?.className).toMatch(/w-12/);
  });

  it('renders ? for null user', () => {
    render(<Avatar user={null} />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('renders with custom src', () => {
    render(<Avatar src="https://example.com/custom.jpg" name="Custom User" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/custom.jpg');
  });
});

// ── Auth store tests ──────────────────────────────────────────
describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('has correct initial state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it('logout clears auth state', () => {
    useAuthStore.setState({
      user: { _id: '1', firstName: 'Test', lastName: 'User' } as never,
      token: 'test-token',
      isAuthenticated: true,
    });
    localStorage.setItem('unialum_token', 'test-token');

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(localStorage.getItem('unialum_token')).toBeNull();
  });

  it('updateUser merges user data', () => {
    useAuthStore.setState({
      user: { _id: '1', firstName: 'Old', lastName: 'Name', bio: '' } as never,
      isAuthenticated: true,
    });

    useAuthStore.getState().updateUser({ firstName: 'New', bio: 'Updated bio' });

    const state = useAuthStore.getState();
    expect(state.user?.firstName).toBe('New');
    expect(state.user?.lastName).toBe('Name'); // unchanged
    expect(state.user?.bio).toBe('Updated bio');
  });

  it('setLoading updates loading state', () => {
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);

    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});

// ── API mock integration test ─────────────────────────────────
describe('API Service', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('includes Authorization header when token is in localStorage', async () => {
    localStorage.setItem('unialum_token', 'my-test-token');
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, message: 'OK', data: [] }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { postsApi } = await import('@/services/api');
    await postsApi.getPosts();

    const call = mockFetch.mock.calls[0];
    const options = call[1];
    expect(options.headers.Authorization).toBe('Bearer my-test-token');
  });

  it('throws ApiError for non-OK responses', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ success: false, message: 'Unauthorized', data: null }),
    });
    vi.stubGlobal('fetch', mockFetch);
    localStorage.removeItem('unialum_token');

    const { authApi } = await import('@/services/api');
    await expect(authApi.getCurrentUser()).rejects.toThrow('Unauthorized');
  });
});
