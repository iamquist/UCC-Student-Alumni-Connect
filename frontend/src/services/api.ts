import type { ApiResponse, PaginatedResponse } from '@/types';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

class ApiError extends Error {
  constructor(public status: number, message: string, public errors?: string[]) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('unialum_token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data: ApiResponse<T> = await response.json();

  if (!response.ok) {
    throw new ApiError(response.status, data.message || 'Request failed', data.errors);
  }

  return data.data;
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    request<{ user: import('@/types').User; token: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: import('@/types').RegisterData) =>
    request<{ user: import('@/types').User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCurrentUser: () =>
    request<import('@/types').User>('/auth/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<void>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  forgotPassword: (email: string) =>
    request<void>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, newPassword: string) =>
    request<void>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),

  verifyEmail: (token: string) =>
    request<void>(`/auth/verify-email/${token}`),

  sendPhoneVerification: (phone: string) =>
    request<void>('/auth/send-phone-verification', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  verifyPhone: (phone: string, code: string) =>
    request<void>('/auth/verify-phone', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    }),
};

// Users API
export const usersApi = {
  getProfile: () => request<import('@/types').User>('/users/profile'),
  
  updateProfile: (data: Partial<import('@/types').User>) =>
    request<import('@/types').User>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getUserById: (id: string) =>
    request<{ user: import('@/types').User; profile: import('@/types').StudentProfile | import('@/types').AlumniProfile }>(`/users/${id}`),

  searchUsers: (params: { q?: string; role?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<PaginatedResponse<import('@/types').User>>(`/users/search?${qs}`);
  },
};

// Posts API
export const postsApi = {
  getPosts: (params?: { page?: number; limit?: number; sort?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<PaginatedResponse<import('@/types').Post>>(`/posts?${qs}`);
  },

  getPostById: (id: string) => request<import('@/types').Post>(`/posts/${id}`),

  createPost: (data: { content: string; images?: string[]; tags?: string[] }) =>
    request<import('@/types').Post>('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  likePost: (id: string) =>
    request<{ liked: boolean; count: number }>(`/posts/${id}/like`, { method: 'POST' }),

  commentOnPost: (id: string, content: string) =>
    request<import('@/types').Comment>(`/posts/${id}/comment`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  deletePost: (id: string) =>
    request<void>(`/posts/${id}`, { method: 'DELETE' }),
};

// Connections API
export const connectionsApi = {
  sendRequest: (recipientId: string, message?: string) =>
    request<import('@/types').Connection>('/connections/request', {
      method: 'POST',
      body: JSON.stringify({ recipientId, message }),
    }),

  getRequests: (type: 'received' | 'sent' = 'received') =>
    request<PaginatedResponse<import('@/types').Connection>>(`/connections/requests?type=${type}`),

  acceptRequest: (requestId: string) =>
    request<import('@/types').Connection>(`/connections/${requestId}/accept`, { method: 'PUT' }),

  declineRequest: (requestId: string) =>
    request<void>(`/connections/${requestId}/decline`, { method: 'PUT' }),

  getConnections: (page = 1) =>
    request<PaginatedResponse<import('@/types').User>>(`/connections?page=${page}`),
};

// Messages API
export const messagesApi = {
  getConversations: () =>
    request<import('@/types').Conversation[]>('/messages/conversations'),

  getOrCreateConversation: (participantId: string) =>
    request<import('@/types').Conversation>('/messages/conversations', {
      method: 'POST',
      body: JSON.stringify({ participantId }),
    }),

  getMessages: (conversationId: string, page = 1) =>
    request<PaginatedResponse<import('@/types').Message>>(`/messages/conversations/${conversationId}/messages?page=${page}`),

  sendMessage: (conversationId: string, content: string, attachments?: string[]) =>
    request<import('@/types').Message>('/messages', {
      method: 'POST',
      body: JSON.stringify({ conversationId, content, attachments }),
    }),

  markAsRead: (conversationId: string) =>
    request<void>(`/messages/conversations/${conversationId}/read`, { method: 'PUT' }),

  deleteMessage: (messageId: string) =>
    request<void>(`/messages/${messageId}`, { method: 'DELETE' }),
};

// Notifications API
export const notificationsApi = {
  getNotifications: (params?: { page?: number; limit?: number }) => {
    const qs = new URLSearchParams(params as Record<string, string> || {}).toString();
    return request<PaginatedResponse<import('@/types').Notification>>(`/notifications?${qs}`);
  },

  markAsRead: (id: string) =>
    request<void>(`/notifications/${id}/read`, { method: 'PUT' }),

  markAllAsRead: () =>
    request<void>('/notifications/read-all', { method: 'PUT' }),

  deleteNotification: (id: string) =>
    request<void>(`/notifications/${id}`, { method: 'DELETE' }),
};

// Jobs API
export const jobsApi = {
  getJobs: (params?: { q?: string; type?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<PaginatedResponse<import('@/types').Job>>(`/jobs?${qs}`);
  },

  getJobById: (id: string) => request<import('@/types').Job>(`/jobs/${id}`),

  postJob: (data: Partial<import('@/types').Job>) =>
    request<import('@/types').Job>('/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  applyForJob: (jobId: string, data: { coverLetter?: string; resume?: string }) =>
    request<import('@/types').JobApplication>(`/jobs/${jobId}/apply`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  saveJob: (jobId: string) =>
    request<{ saved: boolean }>(`/jobs/${jobId}/save`, { method: 'POST' }),
};

// Events API
export const eventsApi = {
  getEvents: (params?: { page?: number; upcoming?: boolean }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<PaginatedResponse<import('@/types').Event>>(`/events?${qs}`);
  },

  getEventById: (id: string) => request<import('@/types').Event>(`/events/${id}`),

  createEvent: (data: Partial<import('@/types').Event>) =>
    request<import('@/types').Event>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  registerForEvent: (eventId: string) =>
    request<void>(`/events/${eventId}/register`, { method: 'POST' }),

  cancelRegistration: (eventId: string) =>
    request<void>(`/events/${eventId}/cancel`, { method: 'DELETE' }),
};

// Mentorship API
export const mentorshipApi = {
  sendRequest: (alumniId: string, topic: string, message: string) =>
    request<import('@/types').MentorshipRequest>('/mentorship/request', {
      method: 'POST',
      body: JSON.stringify({ alumniId, topic, message }),
    }),

  getRequests: (filters?: { status?: string }) => {
    const qs = new URLSearchParams(filters as Record<string, string>).toString();
    return request<PaginatedResponse<import('@/types').MentorshipRequest>>(`/mentorship/requests?${qs}`);
  },

  getMyRequests: () =>
    request<PaginatedResponse<import('@/types').MentorshipRequest>>('/mentorship/my-requests'),

  acceptRequest: (requestId: string, responseMessage?: string) =>
    request<import('@/types').MentorshipRequest>(`/mentorship/${requestId}/accept`, {
      method: 'PUT',
      body: JSON.stringify({ responseMessage }),
    }),

  declineRequest: (requestId: string, responseMessage?: string) =>
    request<void>(`/mentorship/${requestId}/decline`, {
      method: 'PUT',
      body: JSON.stringify({ responseMessage }),
    }),
};

// Questions API
export const questionsApi = {
  getQuestions: (params?: { page?: number; tags?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<PaginatedResponse<import('@/types').Question>>(`/questions?${qs}`);
  },

  askQuestion: (title: string, content: string, tags?: string[]) =>
    request<import('@/types').Question>('/questions', {
      method: 'POST',
      body: JSON.stringify({ title, content, tags }),
    }),

  respondToQuestion: (questionId: string, content: string) =>
    request<import('@/types').QuestionResponse>(`/questions/${questionId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  likeQuestion: (questionId: string) =>
    request<{ liked: boolean }>(`/questions/${questionId}/like`, { method: 'POST' }),

  markResolved: (questionId: string) =>
    request<void>(`/questions/${questionId}/resolve`, { method: 'PUT' }),
};

// Skills API
export const skillsApi = {
  getSkills: () => request<import('@/types').Skill[]>('/skills'),

  addSkill: (data: Partial<import('@/types').Skill>) =>
    request<import('@/types').Skill>('/skills', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProgress: (skillId: string, progress: number) =>
    request<import('@/types').Skill>(`/skills/${skillId}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ progress }),
    }),

  deleteSkill: (skillId: string) =>
    request<void>(`/skills/${skillId}`, { method: 'DELETE' }),
};

// Admin API
export const adminApi = {
  getDashboardStats: () =>
    request<import('@/types').DashboardStats>('/admin/dashboard'),

  getAllUsers: (params?: { page?: number; role?: string; status?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<PaginatedResponse<import('@/types').User>>(`/admin/users?${qs}`);
  },

  updateUserStatus: (userId: string, isActive: boolean) =>
    request<void>(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    }),

  getModerationQueue: () =>
    request<PaginatedResponse<unknown>>('/admin/moderation'),

  getActivityLogs: (params?: { page?: number }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<PaginatedResponse<import('@/types').ActivityLog>>(`/admin/activity-logs?${qs}`);
  },

  getSettings: () => request<import('@/types').SystemSettings>('/admin/settings'),

  updateSettings: (settings: Partial<import('@/types').SystemSettings>) =>
    request<import('@/types').SystemSettings>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
};

// Search API
export const searchApi = {
  search: (query: string) =>
    request<import('@/types').SearchResults>(`/search?q=${encodeURIComponent(query)}`),
};

// File upload
export const uploadApi = {
  uploadImage: async (file: File): Promise<{ url: string }> => {
    const token = localStorage.getItem('unialum_token');
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE}/upload/image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new ApiError(response.status, data.message);
    return data.data;
  },
};

export { ApiError };
