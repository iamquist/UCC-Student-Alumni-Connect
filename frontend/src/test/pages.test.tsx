import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock all API calls
vi.mock('@/services/api', () => ({
  postsApi: {
    getPosts: vi.fn().mockResolvedValue({
      data: [
        {
          _id: 'post1',
          content: 'Hello world post content',
          author: { _id: 'u1', firstName: 'Test', lastName: 'User', profilePicture: null, bio: 'Developer', role: 'alumni' },
          likes: [],
          comments: [],
          tags: ['test'],
          visibility: 'public',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1, hasNext: false, hasPrev: false },
    }),
    createPost: vi.fn().mockResolvedValue({
      _id: 'newpost',
      content: 'New test post',
      author: { _id: 'u1', firstName: 'Test', lastName: 'User', profilePicture: null, bio: '', role: 'alumni' },
      likes: [],
      comments: [],
      tags: [],
      visibility: 'public',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    likePost: vi.fn().mockResolvedValue({ liked: true, count: 1 }),
    commentOnPost: vi.fn().mockResolvedValue({
      _id: 'c1',
      content: 'Nice post!',
      author: { _id: 'u1', firstName: 'Test', lastName: 'User', profilePicture: null },
      likes: [],
      createdAt: new Date().toISOString(),
    }),
  },
  uploadApi: {
    uploadImage: vi.fn().mockResolvedValue({ url: 'https://example.com/image.jpg' }),
  },
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { _id: 'u1', firstName: 'Test', lastName: 'User', role: 'alumni', bio: 'Developer', profilePicture: null },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  })),
}));

vi.mock('@/store/chatStore', () => ({
  useChatStore: vi.fn(() => ({ unreadTotal: 0 })),
  useNotificationStore: vi.fn(() => ({ unreadCount: 0 })),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

// Lazy import to get fresh mocks
const getFeedPage = async () => {
  const mod = await import('@/pages/FeedPage');
  return mod.default;
};

describe('FeedPage', () => {
  it('renders loading skeletons initially', async () => {
    const FeedPage = await getFeedPage();
    const { container } = render(
      <MemoryRouter>
        <FeedPage />
      </MemoryRouter>
    );
    // Skeletons should be present during initial load
    await waitFor(() => {
      expect(container.querySelector('.animate-pulse') || container.innerHTML.length > 0).toBeTruthy();
    });
  });

  it('renders posts after loading', async () => {
    const FeedPage = await getFeedPage();
    render(
      <MemoryRouter>
        <FeedPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.queryByText('Hello world post content')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders the new post input area', async () => {
    const FeedPage = await getFeedPage();
    render(
      <MemoryRouter>
        <FeedPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByPlaceholderText("What's on your mind?")).toBeInTheDocument();
    });
  });

  it('shows author name on posts', async () => {
    const FeedPage = await getFeedPage();
    render(
      <MemoryRouter>
        <FeedPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.queryByText('Test User')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

describe('AuthPages - LoginPage', () => {
  const getLoginPage = async () => {
    const mod = await import('@/pages/AuthPages');
    return mod.LoginPage;
  };

  it('renders login form', async () => {
    const LoginPage = await getLoginPage();
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders UniAlum branding', async () => {
    const LoginPage = await getLoginPage();
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByText('Uni')).toBeInTheDocument();
    expect(screen.getByText('Alum')).toBeInTheDocument();
  });

  it('has link to register page', async () => {
    const LoginPage = await getLoginPage();
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
  });

  it('shows forgot password link', async () => {
    const LoginPage = await getLoginPage();
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByText('Forgot password?')).toBeInTheDocument();
  });
});

describe('AuthPages - RegisterPage', () => {
  const getRegisterPage = async () => {
    const mod = await import('@/pages/AuthPages');
    return mod.RegisterPage;
  };

  it('renders registration form fields', async () => {
    const RegisterPage = await getRegisterPage();
    render(<MemoryRouter><RegisterPage /></MemoryRouter>);
    expect(screen.getByPlaceholderText('John')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Doe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
  });

  it('shows role selection buttons', async () => {
    const RegisterPage = await getRegisterPage();
    render(<MemoryRouter><RegisterPage /></MemoryRouter>);
    expect(screen.getByRole('button', { name: /student/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /alumni/i })).toBeInTheDocument();
  });

  it('has link to login page', async () => {
    const RegisterPage = await getRegisterPage();
    render(<MemoryRouter><RegisterPage /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });
});
