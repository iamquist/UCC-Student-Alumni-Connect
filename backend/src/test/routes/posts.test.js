import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { setupTestDB, teardownTestDB, clearTestDB, createTestUser, createTestAlumni, getAuthToken } from '../testUtils.js';
import { createPost } from '../../services/coreServices.js';

beforeAll(setupTestDB);
afterAll(teardownTestDB);
beforeEach(clearTestDB);

describe('Post Routes', () => {
  let user, token;

  beforeEach(async () => {
    user = await createTestAlumni({ email: 'postuser@ex.com' });
    token = getAuthToken(user);
  });

  describe('GET /api/v1/posts', () => {
    it('should return paginated posts', async () => {
      await createPost(user._id, { content: 'Post 1' });
      await createPost(user._id, { content: 'Post 2' });

      const res = await request(app)
        .get('/api/v1/posts')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination).toBeDefined();
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/v1/posts');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/posts', () => {
    it('should create a new post', async () => {
      const res = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'My first post!', tags: ['test'] });

      expect(res.status).toBe(201);
      expect(res.body.data.content).toBe('My first post!');
      expect(res.body.data.author).toBeDefined();
    });

    it('should reject empty content', async () => {
      const res = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: '' });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/v1/posts/:id/like', () => {
    it('should toggle like on a post', async () => {
      const post = await createPost(user._id, { content: 'Like me' });
      const res = await request(app)
        .post(`/api/v1/posts/${post._id}/like`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.liked).toBeDefined();
    });
  });

  describe('DELETE /api/v1/posts/:id', () => {
    it('should delete own post', async () => {
      const post = await createPost(user._id, { content: 'Delete me' });
      const res = await request(app)
        .delete(`/api/v1/posts/${post._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should not allow deleting another user\'s post', async () => {
      const otherUser = await createTestUser({ email: 'other@ex.com' });
      const post = await createPost(otherUser._id, { content: 'Not yours' });

      const res = await request(app)
        .delete(`/api/v1/posts/${post._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });
});

describe('Connection Routes', () => {
  let user1, user2, token1;

  beforeEach(async () => {
    user1 = await createTestUser({ email: 'conn1@ex.com' });
    user2 = await createTestUser({ email: 'conn2@ex.com' });
    token1 = getAuthToken(user1);
  });

  describe('POST /api/v1/connections/request', () => {
    it('should send a connection request', async () => {
      const res = await request(app)
        .post('/api/v1/connections/request')
        .set('Authorization', `Bearer ${token1}`)
        .send({ recipientId: user2._id.toString(), message: 'Hi!' });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('pending');
    });

    it('should reject self-connection', async () => {
      const res = await request(app)
        .post('/api/v1/connections/request')
        .set('Authorization', `Bearer ${token1}`)
        .send({ recipientId: user1._id.toString() });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/connections', () => {
    it('should return empty list for new user', async () => {
      const res = await request(app)
        .get('/api/v1/connections')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });
  });
});
