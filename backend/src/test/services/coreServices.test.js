import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { setupTestDB, teardownTestDB, clearTestDB, createTestUser, createTestAlumni } from '../testUtils.js';
import {
  createPost, getPosts, togglePostLike, commentOnPost, deletePost,
  sendConnectionRequest, acceptConnectionRequest, declineConnectionRequest, getConnections,
  postJob, getJobs, applyForJob, saveJob,
} from '../../services/coreServices.js';
import { Post, Connection, JobOpportunity } from '../../db/models/index.js';

beforeAll(setupTestDB);
afterAll(teardownTestDB);
beforeEach(clearTestDB);

describe('PostService', () => {
  let author, otherUser;

  beforeEach(async () => {
    author = await createTestAlumni({ email: 'author@ex.com' });
    otherUser = await createTestUser({ email: 'other@ex.com' });
  });

  it('should create a post', async () => {
    const post = await createPost(author._id, { content: 'Hello world', tags: ['test'] });
    expect(post.content).toBe('Hello world');
    expect(post.author._id.toString()).toBe(author._id.toString());
  });

  it('should paginate posts', async () => {
    for (let i = 0; i < 5; i++) {
      await createPost(author._id, { content: `Post ${i}` });
    }
    const result = await getPosts({}, { page: '1', limit: '3' });
    expect(result.data).toHaveLength(3);
    expect(result.pagination.total).toBe(5);
    expect(result.pagination.hasNext).toBe(true);
  });

  it('should toggle like on a post', async () => {
    const post = await createPost(author._id, { content: 'Like me' });
    const liked = await togglePostLike(post._id, otherUser._id);
    expect(liked.liked).toBe(true);
    expect(liked.count).toBe(1);

    const unliked = await togglePostLike(post._id, otherUser._id);
    expect(unliked.liked).toBe(false);
    expect(unliked.count).toBe(0);
  });

  it('should add a comment to a post', async () => {
    const post = await createPost(author._id, { content: 'Comment on me' });
    const comment = await commentOnPost(post._id, otherUser._id, 'Great post!');
    expect(comment.content).toBe('Great post!');
  });

  it('should delete own post', async () => {
    const post = await createPost(author._id, { content: 'Delete me' });
    await deletePost(post._id, author._id);
    const found = await Post.findById(post._id);
    expect(found).toBeNull();
  });

  it('should not allow deleting another user\'s post', async () => {
    const post = await createPost(author._id, { content: 'Not yours' });
    await expect(deletePost(post._id, otherUser._id)).rejects.toThrow('Not authorized');
  });
});

describe('ConnectionService', () => {
  let user1, user2;

  beforeEach(async () => {
    user1 = await createTestUser({ email: 'conn1@ex.com' });
    user2 = await createTestUser({ email: 'conn2@ex.com' });
  });

  it('should send a connection request', async () => {
    const conn = await sendConnectionRequest(user1._id, user2._id, 'Hi!');
    expect(conn.status).toBe('pending');
    expect(conn.requester._id.toString()).toBe(user1._id.toString());
  });

  it('should not allow connecting with self', async () => {
    await expect(sendConnectionRequest(user1._id, user1._id))
      .rejects.toThrow('Cannot connect with yourself');
  });

  it('should not allow duplicate connection requests', async () => {
    await sendConnectionRequest(user1._id, user2._id);
    await expect(sendConnectionRequest(user1._id, user2._id))
      .rejects.toThrow('Request already sent');
  });

  it('should accept a connection request', async () => {
    const req = await sendConnectionRequest(user1._id, user2._id);
    const conn = await acceptConnectionRequest(req._id, user2._id);
    expect(conn.status).toBe('accepted');
  });

  it('should decline a connection request', async () => {
    const req = await sendConnectionRequest(user1._id, user2._id);
    const conn = await declineConnectionRequest(req._id, user2._id);
    expect(conn.status).toBe('declined');
  });

  it('should not allow wrong user to accept request', async () => {
    const user3 = await createTestUser({ email: 'conn3@ex.com' });
    const req = await sendConnectionRequest(user1._id, user2._id);
    await expect(acceptConnectionRequest(req._id, user3._id))
      .rejects.toThrow('Connection request not found');
  });

  it('should return list of accepted connections', async () => {
    const req = await sendConnectionRequest(user1._id, user2._id);
    await acceptConnectionRequest(req._id, user2._id);

    const result = await getConnections(user1._id, {});
    expect(result.data).toHaveLength(1);
    expect(result.data[0]._id.toString()).toBe(user2._id.toString());
  });
});

describe('JobService', () => {
  let alumni, student;

  beforeEach(async () => {
    alumni = await createTestAlumni({ email: 'jobposter@ex.com' });
    student = await createTestUser({ email: 'applicant@ex.com' });
  });

  it('should create a job posting', async () => {
    const job = await postJob(alumni._id, {
      title: 'Senior Designer',
      company: 'TechCorp',
      location: 'Remote',
      type: 'remote',
      description: 'Join our team',
    });
    expect(job.title).toBe('Senior Designer');
    expect(job.postedBy._id.toString()).toBe(alumni._id.toString());
  });

  it('should retrieve active jobs', async () => {
    await postJob(alumni._id, { title: 'Job 1', company: 'C1', location: 'L1', type: 'full-time', description: 'D1' });
    await postJob(alumni._id, { title: 'Job 2', company: 'C2', location: 'L2', type: 'part-time', description: 'D2' });

    const result = await getJobs({}, { page: '1', limit: '10' });
    expect(result.data.length).toBeGreaterThanOrEqual(2);
  });

  it('should apply for a job', async () => {
    const job = await postJob(alumni._id, { title: 'Dev', company: 'Co', location: 'Remote', type: 'remote', description: 'Desc' });
    const app = await applyForJob(job._id, student._id, { coverLetter: 'I am the best!' });
    expect(app.applicant.toString()).toBe(student._id.toString());
    expect(app.status).toBe('pending');
  });

  it('should not allow applying twice', async () => {
    const job = await postJob(alumni._id, { title: 'Dev2', company: 'Co', location: 'Remote', type: 'remote', description: 'Desc' });
    await applyForJob(job._id, student._id, {});
    await expect(applyForJob(job._id, student._id, {})).rejects.toThrow('Already applied');
  });

  it('should save and unsave a job', async () => {
    const job = await postJob(alumni._id, { title: 'Save Me', company: 'Co', location: 'Remote', type: 'remote', description: 'Desc' });
    const saved = await saveJob(job._id, student._id);
    expect(saved.saved).toBe(true);

    const unsaved = await saveJob(job._id, student._id);
    expect(unsaved.saved).toBe(false);
  });
});
