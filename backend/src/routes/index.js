import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roleCheck.js';
import { authLimiter, registerLimiter, messageLimiter, postLimiter } from '../middleware/rateLimiter.js';
import {
  authController, userController, postController, connectionController,
  jobController, eventController, messageController, notificationController,
  adminController, searchController,
} from '../controllers/index.js';
import extendedRoutes from './extended.js';

const router = Router();

// ── Auth routes ────────────────────────────────────────────────
const auth = Router();
auth.post('/register', registerLimiter, authController.register);
auth.post('/login', authLimiter, authController.login);
auth.get('/me', requireAuth, authController.getCurrentUser);
auth.put('/change-password', requireAuth, authController.changePassword);
auth.post('/forgot-password', authController.forgotPassword);
auth.post('/reset-password', authController.resetPassword);
auth.get('/verify-email/:token', authController.verifyEmail);
auth.post('/send-phone-verification', requireAuth, authController.sendPhoneVerification);
auth.post('/verify-phone', requireAuth, authController.verifyPhone);

// ── User routes ────────────────────────────────────────────────
const users = Router();
users.get('/profile', requireAuth, userController.getProfile);
users.put('/profile', requireAuth, userController.updateProfile);
users.get('/search', requireAuth, userController.searchUsers);
users.get('/:id', requireAuth, userController.getUserById);

// ── Post routes ────────────────────────────────────────────────
const posts = Router();
posts.get('/', requireAuth, postController.getPosts);
posts.post('/', requireAuth, postLimiter, postController.createPost);
posts.get('/:id', requireAuth, postController.getPostById);
posts.post('/:id/like', requireAuth, postController.likePost);
posts.post('/:id/comment', requireAuth, postController.commentOnPost);
posts.delete('/:id', requireAuth, postController.deletePost);

// ── Connection routes ──────────────────────────────────────────
const connections = Router();
connections.get('/', requireAuth, connectionController.getConnections);
connections.post('/request', requireAuth, connectionController.sendRequest);
connections.get('/requests', requireAuth, connectionController.getRequests);
connections.put('/:id/accept', requireAuth, connectionController.acceptRequest);
connections.put('/:id/decline', requireAuth, connectionController.declineRequest);

// ── Job routes ─────────────────────────────────────────────────
const jobs = Router();
jobs.get('/', requireAuth, jobController.getJobs);
jobs.post('/', requireAuth, jobController.postJob);
jobs.get('/:id', requireAuth, jobController.getJobById);
jobs.post('/:id/apply', requireAuth, jobController.applyForJob);
jobs.post('/:id/save', requireAuth, jobController.saveJob);

// ── Event routes ───────────────────────────────────────────────
const events = Router();
events.get('/', requireAuth, eventController.getEvents);
events.post('/', requireAuth, eventController.createEvent);
events.get('/:id', requireAuth, eventController.getEventById);
events.post('/:id/register', requireAuth, eventController.registerForEvent);
events.delete('/:id/cancel', requireAuth, eventController.cancelRegistration);

// ── Message routes ─────────────────────────────────────────────
const messages = Router();
messages.get('/conversations', requireAuth, messageController.getConversations);
messages.post('/conversations', requireAuth, messageController.getOrCreateConversation);
messages.get('/conversations/:id/messages', requireAuth, messageController.getMessages);
messages.put('/conversations/:id/read', requireAuth, messageController.markAsRead);
messages.post('/', requireAuth, messageLimiter, messageController.sendMessage);
messages.delete('/:id', requireAuth, messageController.deleteMessage);

// ── Notification routes ────────────────────────────────────────
const notifications = Router();
notifications.get('/', requireAuth, notificationController.getNotifications);
notifications.put('/read-all', requireAuth, notificationController.markAllAsRead);
notifications.put('/:id/read', requireAuth, notificationController.markAsRead);
notifications.delete('/:id', requireAuth, notificationController.deleteNotification);

// ── Admin routes ───────────────────────────────────────────────
const admin = Router();
admin.use(requireAuth, requireAdmin);
admin.get('/dashboard', adminController.getDashboardStats);
admin.get('/users', adminController.getAllUsers);
admin.put('/users/:id/status', adminController.updateUserStatus);
admin.get('/activity-logs', adminController.getActivityLogs);

// ── Search route ───────────────────────────────────────────────
const search = Router();
search.get('/', requireAuth, searchController.search);

// Mount all
router.use('/auth', auth);
router.use('/users', users);
router.use('/posts', posts);
router.use('/connections', connections);
router.use('/jobs', jobs);
router.use('/events', events);
router.use('/messages', messages);
router.use('/notifications', notifications);
router.use('/admin', admin);
router.use('/search', search);

// Extended routes (mentorship, questions, skills, settings, alumni, upload)
router.use('/', extendedRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'UniAlum API is running', timestamp: new Date().toISOString() });
});

export default router;
