import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { setupTestDB, teardownTestDB, clearTestDB, createTestUser, createTestAlumni, createTestAdmin } from '../testUtils.js';
import { getDashboardStats, getAllUsers, updateUserStatus, getActivityLogs, globalSearch } from '../../services/userService.js';
import { createPost } from '../../services/coreServices.js';
import { logActivity } from '../../utils/activityTracker.js';

beforeAll(setupTestDB);
afterAll(teardownTestDB);
beforeEach(clearTestDB);

describe('AdminService - getDashboardStats', () => {
  it('should return correct counts', async () => {
    await createTestUser({ email: 'stu1@ex.com' });
    await createTestUser({ email: 'stu2@ex.com' });
    await createTestAlumni({ email: 'al1@ex.com' });

    const stats = await getDashboardStats();
    expect(stats.totalUsers).toBeGreaterThanOrEqual(3);
    expect(stats.totalStudents).toBeGreaterThanOrEqual(2);
    expect(stats.totalAlumni).toBeGreaterThanOrEqual(1);
    expect(stats.activeUsers).toBeGreaterThanOrEqual(3);
    expect(typeof stats.totalPosts).toBe('number');
    expect(typeof stats.totalJobs).toBe('number');
    expect(typeof stats.totalEvents).toBe('number');
    expect(typeof stats.totalConnections).toBe('number');
    expect(typeof stats.recentSignups).toBe('number');
  });

  it('should count recent signups correctly', async () => {
    await createTestUser({ email: 'recent@ex.com' });
    const stats = await getDashboardStats();
    expect(stats.recentSignups).toBeGreaterThan(0);
  });
});

describe('AdminService - getAllUsers', () => {
  beforeEach(async () => {
    await createTestUser({ email: 'stu@ex.com' });
    await createTestAlumni({ email: 'alum@ex.com' });
    await createTestAdmin({ email: 'adm@ex.com' });
  });

  it('should return all users paginated', async () => {
    const result = await getAllUsers({}, { page: '1', limit: '10' });
    expect(result.data.length).toBeGreaterThanOrEqual(3);
    expect(result.pagination.total).toBeGreaterThanOrEqual(3);
  });

  it('should filter by role', async () => {
    const result = await getAllUsers({ role: 'student' }, { page: '1', limit: '10' });
    result.data.forEach(u => expect(u.role).toBe('student'));
  });

  it('should filter active users', async () => {
    const result = await getAllUsers({ status: 'active' }, { page: '1', limit: '10' });
    result.data.forEach(u => expect(u.isActive).toBe(true));
  });

  it('should search by name or email', async () => {
    await createTestUser({ email: 'findme@ex.com', firstName: 'Unique', lastName: 'Person' });
    const result = await getAllUsers({ q: 'Unique' }, { page: '1', limit: '10' });
    expect(result.data.some(u => u.firstName === 'Unique')).toBe(true);
  });
});

describe('AdminService - updateUserStatus', () => {
  it('should deactivate a user', async () => {
    const user = await createTestUser({ email: 'deact@ex.com' });
    const updated = await updateUserStatus(user._id, false);
    expect(updated.isActive).toBe(false);
  });

  it('should reactivate a user', async () => {
    const user = await createTestUser({ email: 'react@ex.com', isActive: false });
    const updated = await updateUserStatus(user._id, true);
    expect(updated.isActive).toBe(true);
  });

  it('should throw for invalid user ID', async () => {
    await expect(updateUserStatus('000000000000000000000000', true))
      .rejects.toThrow('User not found');
  });
});

describe('AdminService - getActivityLogs', () => {
  it('should return activity logs', async () => {
    const user = await createTestUser({ email: 'loguser@ex.com' });
    await logActivity({ user: user._id, activityType: 'login', description: 'User logged in' });

    const result = await getActivityLogs({}, { page: '1', limit: '10' });
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].activityType).toBe('login');
  });

  it('should filter by activityType', async () => {
    const user = await createTestUser({ email: 'loguser2@ex.com' });
    await logActivity({ user: user._id, activityType: 'post_create', description: 'Created post' });
    await logActivity({ user: user._id, activityType: 'login', description: 'Logged in' });

    const result = await getActivityLogs({ type: 'post_create' }, { page: '1', limit: '10' });
    result.data.forEach(l => expect(l.activityType).toBe('post_create'));
  });
});

describe('AdminService - globalSearch', () => {
  it('should search across users, posts, jobs', async () => {
    const user = await createTestAlumni({ email: 'searchable@ex.com', firstName: 'SearchableName', lastName: 'Person' });
    await createPost(user._id, { content: 'Unique searchable content here' });

    const results = await globalSearch('SearchableName');
    expect(results.users.some(u => u.firstName === 'SearchableName')).toBe(true);
    expect(results.total).toBeGreaterThan(0);
  });

  it('should return empty results for short query', async () => {
    const results = await globalSearch('a');
    expect(results.total).toBe(0);
  });

  it('should return empty for null query', async () => {
    const results = await globalSearch('');
    expect(results.total).toBe(0);
  });
});
