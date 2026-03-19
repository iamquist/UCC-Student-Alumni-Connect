import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { setupTestDB, teardownTestDB, clearTestDB, createTestAlumni, createTestUser, getAuthToken } from '../testUtils.js';
import { postJob, createEvent } from '../../services/coreServices.js';
import * as authService from '../../services/authService.js';

beforeAll(setupTestDB);
afterAll(teardownTestDB);
beforeEach(clearTestDB);

describe('Job Routes', () => {
  let alumni, student, alumniToken, studentToken;

  beforeEach(async () => {
    alumni = await createTestAlumni({ email: 'alumni@ex.com' });
    student = await createTestUser({ email: 'student@ex.com' });
    alumniToken = getAuthToken(alumni);
    studentToken = getAuthToken(student);
  });

  it('GET /api/v1/jobs - should list active jobs', async () => {
    await postJob(alumni._id, { title: 'Dev', company: 'Corp', location: 'Remote', type: 'remote', description: 'Desc' });
    const res = await request(app).get('/api/v1/jobs').set('Authorization', `Bearer ${alumniToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('POST /api/v1/jobs - should create a job', async () => {
    const res = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${alumniToken}`)
      .send({ title: 'Designer', company: 'Studio', location: 'Remote', type: 'remote', description: 'Creative role' });
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Designer');
  });

  it('POST /api/v1/jobs/:id/apply - should apply for job', async () => {
    const job = await postJob(alumni._id, { title: 'Dev', company: 'Corp', location: 'Remote', type: 'remote', description: 'Dev role' });
    const res = await request(app)
      .post(`/api/v1/jobs/${job._id}/apply`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ coverLetter: 'I am interested' });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('pending');
  });

  it('POST /api/v1/jobs/:id/save - should save a job', async () => {
    const job = await postJob(alumni._id, { title: 'Dev', company: 'Corp', location: 'Remote', type: 'remote', description: 'Desc' });
    const res = await request(app)
      .post(`/api/v1/jobs/${job._id}/save`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.saved).toBe(true);
  });
});

describe('Event Routes', () => {
  let alumni, token;

  beforeEach(async () => {
    alumni = await createTestAlumni({ email: 'evtalumni@ex.com' });
    token = getAuthToken(alumni);
  });

  it('GET /api/v1/events - should list events', async () => {
    await createEvent(alumni._id, {
      title: 'Test Event',
      description: 'A test event',
      startDate: new Date(Date.now() + 86400000),
      endDate: new Date(Date.now() + 90000000),
      isVirtual: true,
    });
    const res = await request(app).get('/api/v1/events').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('POST /api/v1/events - should create an event', async () => {
    const res = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'My Event',
        description: 'An event for testing',
        startDate: new Date(Date.now() + 86400000),
        endDate: new Date(Date.now() + 90000000),
        isVirtual: true,
      });
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('My Event');
  });
});

describe('Notification Routes', () => {
  let user, token;

  beforeEach(async () => {
    const result = await authService.registerUser({ firstName: 'Notif', lastName: 'User', email: 'notifuser@ex.com', password: 'Password@123', role: 'student' });
    user = result.user;
    token = result.token;
  });

  it('GET /api/v1/notifications - should list notifications', async () => {
    const res = await request(app).get('/api/v1/notifications').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('PUT /api/v1/notifications/read-all - should mark all as read', async () => {
    const res = await request(app)
      .put('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

describe('Search Routes', () => {
  let token;

  beforeEach(async () => {
    const result = await authService.registerUser({ firstName: 'Search', lastName: 'User', email: 'searchuser@ex.com', password: 'Password@123', role: 'student' });
    token = result.token;
  });

  it('GET /api/v1/search - should return results', async () => {
    const res = await request(app)
      .get('/api/v1/search?q=test')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
  });

  it('GET /api/v1/search - should handle empty query', async () => {
    const res = await request(app)
      .get('/api/v1/search?q=')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
