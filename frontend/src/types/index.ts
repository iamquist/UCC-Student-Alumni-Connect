// Core user types
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'student' | 'alumni' | 'admin';
  profilePicture?: string;
  coverPhoto?: string;
  bio?: string;
  location?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
  viewsToday?: number;
  postViews?: number;
  searchAppearances?: number;
}

export interface StudentProfile {
  _id: string;
  user: User | string;
  program: string;
  year: number;
  gpa?: number;
  skills: string[];
  interests: string[];
  careerGoals?: string;
  portfolio?: string;
  github?: string;
  linkedin?: string;
}

export interface AlumniProfile {
  _id: string;
  user: User | string;
  graduationYear: number;
  currentCompany?: string;
  currentPosition?: string;
  industry?: string;
  yearsExperience?: number;
  expertise: string[];
  mentorshipAvailable: boolean;
  linkedin?: string;
  github?: string;
  website?: string;
}

// Post types
export interface Post {
  _id: string;
  author: User;
  content: string;
  images?: string[];
  files?: PostFile[];
  likes: string[];
  comments: Comment[];
  tags?: string[];
  visibility: 'public' | 'connections' | 'private';
  createdAt: string;
  updatedAt: string;
}

export interface PostFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface Comment {
  _id: string;
  author: User;
  content: string;
  likes: string[];
  createdAt: string;
}

// Connection types
export interface Connection {
  _id: string;
  requester: User;
  recipient: User;
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  createdAt: string;
  updatedAt: string;
}

// Message / Chat types
export interface Conversation {
  _id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: User;
  content: string;
  attachments?: string[];
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

// Notification types
export interface Notification {
  _id: string;
  recipient: string;
  sender?: User;
  type: 'connection_request' | 'connection_accepted' | 'post_like' | 'post_comment' | 'mentorship_request' | 'mentorship_accepted' | 'job_match' | 'event_reminder' | 'message' | 'profile_view' | 'system';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

// Job types
export interface Job {
  _id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote';
  description: string;
  requirements: string[];
  salary?: { min: number; max: number; currency: string };
  postedBy: User;
  applications: JobApplication[];
  deadline?: string;
  createdAt: string;
}

export interface JobApplication {
  _id: string;
  job: string;
  applicant: User;
  coverLetter?: string;
  resume?: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired';
  createdAt: string;
}

// Event types
export interface Event {
  _id: string;
  title: string;
  description: string;
  organizer: User;
  startDate: string;
  endDate: string;
  location?: string;
  isVirtual: boolean;
  meetingLink?: string;
  image?: string;
  attendees: (string | User)[];
  maxAttendees?: number;
  tags?: string[];
  createdAt: string;
}

// Mentorship types
export interface MentorshipRequest {
  _id: string;
  student: User;
  alumni: User;
  topic: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  responseMessage?: string;
  scheduledAt?: string;
  createdAt: string;
}

// Question types
export interface Question {
  _id: string;
  student: User;
  title: string;
  content: string;
  tags?: string[];
  responses: QuestionResponse[];
  likes: string[];
  isResolved: boolean;
  createdAt: string;
}

export interface QuestionResponse {
  _id: string;
  alumni: User;
  content: string;
  likes: string[];
  createdAt: string;
}

// Skill types
export interface Skill {
  _id: string;
  user: string;
  name: string;
  category: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  progress: number;
  endorsements?: string[];
  createdAt: string;
}

// Analytics / Admin types
export interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalAlumni: number;
  activeUsers: number;
  totalPosts: number;
  totalJobs: number;
  totalEvents: number;
  totalConnections: number;
  totalMentorships: number;
  recentSignups: number;
}

export interface ActivityLog {
  _id: string;
  user: User;
  activityType: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// Pagination
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// Auth types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'student' | 'alumni';
  phone?: string;
}

// API response
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

// Search
export interface SearchResults {
  jobs: Job[];
  users: User[];
  posts: Post[];
  events: Event[];
  total: number;
}

// Settings
export interface SystemSettings {
  _id: string;
  maintenanceMode: boolean;
  registrationOpen: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
}

// Socket events
export type SocketEvent =
  | { type: 'message:new'; data: Message }
  | { type: 'message:read'; data: { conversationId: string; userId: string } }
  | { type: 'notification:new'; data: Notification }
  | { type: 'user:online'; data: { userId: string } }
  | { type: 'user:offline'; data: { userId: string } }
  | { type: 'typing:start'; data: { conversationId: string; userId: string } }
  | { type: 'typing:stop'; data: { conversationId: string; userId: string } };
