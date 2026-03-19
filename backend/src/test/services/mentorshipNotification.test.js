import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { setupTestDB, teardownTestDB, clearTestDB, createTestUser, createTestAlumni } from '../testUtils.js';
import { sendMentorshipRequest, getMentorshipRequests, acceptMentorshipRequest, declineMentorshipRequest, getMyMentorshipRequests } from '../../services/mentorshipService.js';
import { createNotification, getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, getUnreadCount } from '../../services/notificationService.js';
import { MentorshipRequest, Notification } from '../../db/models/index.js';

beforeAll(setupTestDB);
afterAll(teardownTestDB);
beforeEach(clearTestDB);

describe('MentorshipService', () => {
  let student, alumni;

  beforeEach(async () => {
    student = await createTestUser({ email: 'student@ex.com' });
    alumni = await createTestAlumni({ email: 'alumni@ex.com' });
  });

  it('should send a mentorship request', async () => {
    const req = await sendMentorshipRequest(student._id, {
      alumniId: alumni._id, topic: 'Career guidance', message: 'I need help with my career path',
    });
    expect(req.status).toBe('pending');
    expect(req.topic).toBe('Career guidance');
    expect(req.student._id.toString()).toBe(student._id.toString());
  });

  it('should reject non-alumni as mentorship target', async () => {
    const otherStudent = await createTestUser({ email: 'other@ex.com' });
    await expect(sendMentorshipRequest(student._id, {
      alumniId: otherStudent._id, topic: 'Help', message: 'Please help',
    })).rejects.toThrow('Alumni not found');
  });

  it('should reject duplicate pending request', async () => {
    await sendMentorshipRequest(student._id, { alumniId: alumni._id, topic: 'Topic', message: 'Msg' });
    await expect(sendMentorshipRequest(student._id, {
      alumniId: alumni._id, topic: 'Another', message: 'Another msg',
    })).rejects.toThrow('already have a pending request');
  });

  it('should list requests for alumni', async () => {
    await sendMentorshipRequest(student._id, { alumniId: alumni._id, topic: 'Topic', message: 'Msg' });
    const result = await getMentorshipRequests(alumni._id, {}, {});
    expect(result.data.length).toBe(1);
  });

  it('should accept a mentorship request', async () => {
    const req = await sendMentorshipRequest(student._id, { alumniId: alumni._id, topic: 'Career', message: 'Help' });
    const accepted = await acceptMentorshipRequest(req._id, alumni._id, { responseMessage: 'Happy to help!' });
    expect(accepted.status).toBe('accepted');
    expect(accepted.responseMessage).toBe('Happy to help!');
  });

  it('should decline a mentorship request', async () => {
    const req = await sendMentorshipRequest(student._id, { alumniId: alumni._id, topic: 'Career', message: 'Help' });
    const declined = await declineMentorshipRequest(req._id, alumni._id, 'Not available');
    expect(declined.status).toBe('declined');
  });

  it('should only let the assigned alumni accept/decline', async () => {
    const otherAlumni = await createTestAlumni({ email: 'otheralumni@ex.com' });
    const req = await sendMentorshipRequest(student._id, { alumniId: alumni._id, topic: 'Career', message: 'Help' });
    await expect(acceptMentorshipRequest(req._id, otherAlumni._id, {}))
      .rejects.toThrow('Mentorship request not found');
  });

  it('should list student\'s own requests', async () => {
    await sendMentorshipRequest(student._id, { alumniId: alumni._id, topic: 'Career', message: 'Help' });
    const result = await getMyMentorshipRequests(student._id, {}, {});
    expect(result.data.length).toBe(1);
  });
});

describe('NotificationService', () => {
  let user, sender;

  beforeEach(async () => {
    user = await createTestUser({ email: 'notifuser@ex.com' });
    sender = await createTestUser({ email: 'sender@ex.com' });
  });

  it('should create a notification', async () => {
    const n = await createNotification({
      recipient: user._id,
      sender: sender._id,
      type: 'connection_request',
      title: 'New Connection',
      message: 'wants to connect',
    });
    expect(n).toBeDefined();
    expect(n.read).toBe(false);
    expect(n.type).toBe('connection_request');
  });

  it('should get user notifications paginated', async () => {
    await createNotification({ recipient: user._id, type: 'system', title: 'T1', message: 'M1' });
    await createNotification({ recipient: user._id, type: 'system', title: 'T2', message: 'M2' });

    const result = await getUserNotifications(user._id, {});
    expect(result.data.length).toBe(2);
    expect(result.pagination.total).toBe(2);
  });

  it('should mark a notification as read', async () => {
    const n = await createNotification({ recipient: user._id, type: 'system', title: 'T', message: 'M' });
    await markNotificationAsRead(n._id, user._id);
    const updated = await Notification.findById(n._id);
    expect(updated.read).toBe(true);
  });

  it('should mark all notifications as read', async () => {
    await createNotification({ recipient: user._id, type: 'system', title: 'T1', message: 'M1' });
    await createNotification({ recipient: user._id, type: 'system', title: 'T2', message: 'M2' });
    await markAllNotificationsAsRead(user._id);

    const unread = await Notification.countDocuments({ recipient: user._id, read: false });
    expect(unread).toBe(0);
  });

  it('should delete a notification', async () => {
    const n = await createNotification({ recipient: user._id, type: 'system', title: 'T', message: 'M' });
    await deleteNotification(n._id, user._id);
    const found = await Notification.findById(n._id);
    expect(found).toBeNull();
  });

  it('should not delete another user\'s notification', async () => {
    const n = await createNotification({ recipient: user._id, type: 'system', title: 'T', message: 'M' });
    await expect(deleteNotification(n._id, sender._id)).rejects.toThrow('Notification not found');
  });

  it('should return correct unread count', async () => {
    await createNotification({ recipient: user._id, type: 'system', title: 'T1', message: 'M1' });
    await createNotification({ recipient: user._id, type: 'system', title: 'T2', message: 'M2' });
    const n3 = await createNotification({ recipient: user._id, type: 'system', title: 'T3', message: 'M3' });
    await markNotificationAsRead(n3._id, user._id);

    const count = await getUnreadCount(user._id);
    expect(count).toBe(2);
  });
});
