import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../db/init.js';
import { User } from '../db/models/user.js';
import {
  AlumniProfile, StudentProfile, Post, JobOpportunity,
  Event, Connection, Notification,
} from '../db/models/index.js';
import logger from '../utils/logger.js';

const SEED_USERS = [
  { firstName: 'Admin', lastName: 'User', email: 'admin@unialum.com', password: 'Admin@123456', role: 'admin' },
  { firstName: 'Arjun', lastName: 'Kaunteya', email: 'arjun@example.com', password: 'Password@123', role: 'alumni', bio: 'Freelance UX/UI designer, 80+ projects in web design, mobile apps (iOS & Android) and creative projects. Open to offers.', location: 'Faridabad, Haryana' },
  { firstName: 'Theresa', lastName: 'Steward', email: 'theresa@example.com', password: 'Password@123', role: 'alumni', bio: 'iOS developer', location: 'San Francisco, CA' },
  { firstName: 'Brandon', lastName: 'Wilson', email: 'brandon@example.com', password: 'Password@123', role: 'alumni', bio: 'Senior UX designer' },
  { firstName: 'Kyle', lastName: 'Fisher', email: 'kyle@example.com', password: 'Password@123', role: 'alumni', bio: 'Product designer at Commandor Corp' },
  { firstName: 'Audrey', lastName: 'Alexander', email: 'audrey@example.com', password: 'Password@123', role: 'alumni', bio: 'Team lead at Google' },
  { firstName: 'Darlene', lastName: 'Black', email: 'darlene@example.com', password: 'Password@123', role: 'student', bio: 'HR-manager, 10,000 connections' },
  { firstName: 'Eduardo', lastName: 'Russell', email: 'eduardo@example.com', password: 'Password@123', role: 'student', bio: 'Full stack developer at Yandex' },
];

const SEED_JOBS = [
  { title: 'UX/UI Designer', company: 'Upwork', location: 'Remote only', type: 'remote', description: 'On Upwork you\'ll find a range of top freelancers and agencies, from developers and development agencies to designers and creative agencies, copywriters.' },
  { title: 'Product Designer', company: 'Facebook', location: 'CA, USA', type: 'full-time', description: 'Founded in 2004, Facebook\'s mission is to give people the power to build community and bring the world closer together.' },
  { title: 'Part-time UX Designer', company: 'Google', location: 'International', type: 'part-time', description: 'Search the world\'s information, including webpages, images, videos and more.' },
  { title: 'Web Designer', company: 'LinkedIn', location: 'CA, USA', type: 'full-time', description: 'LinkedIn, the world\'s largest professional network. The mission of LinkedIn is simple: connect the world\'s professional.' },
  { title: 'UI Designer', company: 'Instagram', location: 'CA, USA', type: 'full-time', description: 'Instagram is a photo and video-sharing social networking service owned by Facebook, Inc.' },
];

const SEED_POSTS = [
  { content: 'What did the Dursleys care if Harry lost his place on the House Quidditch team because he hadn\'t practiced all summer? What was it to the Dursleys if Harry went back to school without any of his homework done? The Dursleys didn\'t want Harry practicing magic at home. And they were so mean...', tags: ['general'] },
  { content: 'How\'s your day going, guys?', tags: ['general', 'social'] },
  { content: 'There is some new guidelines for iOS. iOS 11 guidelines for users and developers are now available. Check them out!', tags: ['ios', 'development'] },
  { content: 'The bun runs along the road and meets a wolf. «Little bun, little bun, I want to eat you!» says the wolf. «I ran away from Grandfather, I ran away from Grandmother, I ran away from the hare. And I can run away from you, grey wolf!» says the bun and runs away.', tags: ['story'] },
];

async function seed() {
  await connectDB();
  logger.info('Starting database seed...');

  try {
    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      AlumniProfile.deleteMany({}),
      StudentProfile.deleteMany({}),
      Post.deleteMany({}),
      JobOpportunity.deleteMany({}),
      Event.deleteMany({}),
      Connection.deleteMany({}),
      Notification.deleteMany({}),
    ]);
    logger.info('Cleared existing data');

    // Create users
    const createdUsers = [];
    for (const userData of SEED_USERS) {
      const user = await User.create({ ...userData, isEmailVerified: true, isActive: true });
      createdUsers.push(user);

      if (userData.role === 'alumni') {
        await AlumniProfile.create({
          user: user._id,
          graduationYear: 2018 + Math.floor(Math.random() * 5),
          currentCompany: ['Google', 'Facebook', 'Upwork', 'Commandor Corp'][Math.floor(Math.random() * 4)],
          currentPosition: 'Senior Designer',
          mentorshipAvailable: true,
          expertise: ['UX Design', 'Product Design', 'Mobile Design'],
        });
      } else if (userData.role === 'student') {
        await StudentProfile.create({
          user: user._id,
          program: 'Computer Science',
          year: 2 + Math.floor(Math.random() * 3),
          skills: ['JavaScript', 'React', 'Node.js'],
        });
      }
    }
    logger.info(`Created ${createdUsers.length} users`);

    const adminUser = createdUsers[0];
    const alumniUsers = createdUsers.filter(u => u.role === 'alumni');

    // Create posts
    for (let i = 0; i < SEED_POSTS.length; i++) {
      const author = alumniUsers[i % alumniUsers.length];
      await Post.create({
        ...SEED_POSTS[i],
        author: author._id,
        likes: alumniUsers.slice(0, 3).map(u => u._id),
      });
    }
    logger.info(`Created ${SEED_POSTS.length} posts`);

    // Create jobs
    for (const jobData of SEED_JOBS) {
      await JobOpportunity.create({ ...jobData, postedBy: alumniUsers[0]._id, isActive: true });
    }
    logger.info(`Created ${SEED_JOBS.length} jobs`);

    // Create connections between some users
    await Connection.create({ requester: alumniUsers[0]._id, recipient: alumniUsers[1]._id, status: 'accepted' });
    await Connection.create({ requester: alumniUsers[1]._id, recipient: alumniUsers[2]._id, status: 'accepted' });
    await Connection.create({ requester: createdUsers[6]._id, recipient: alumniUsers[0]._id, status: 'pending', message: 'Hey, I saw your works. I like it! Can we do something together?' });
    logger.info('Created connections');

    // Create events
    await Event.create({
      title: 'Annual Alumni Tech Summit 2025',
      description: 'Join us for the annual alumni technology summit. Network with industry leaders, attend workshops, and discover new opportunities.',
      organizer: alumniUsers[0]._id,
      startDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      endDate: new Date(Date.now() + 7 * 24 * 3600 * 1000 + 3600 * 1000 * 3),
      isVirtual: true,
      meetingLink: 'https://meet.google.com/example',
      tags: ['technology', 'networking'],
    });
    logger.info('Created events');

    // Create notifications
    await Notification.create([
      {
        recipient: alumniUsers[0]._id,
        type: 'system',
        title: 'You appeared in 9 searches',
        message: 'this week',
      },
      {
        recipient: alumniUsers[0]._id,
        sender: alumniUsers[1]._id,
        type: 'connection_request',
        title: 'Audrey Alexander and 10 others',
        message: 'viewed your profile',
      },
    ]);
    logger.info('Created notifications');

    logger.info('✅ Seed completed successfully!');
    logger.info(`\n Admin: admin@unialum.com / Admin@123456`);
    logger.info(`Alumni: arjun@example.com / Password@123`);

  } catch (err) {
    logger.error('Seed failed', err);
    throw err;
  } finally {
    await disconnectDB();
  }
}

seed().catch(() => process.exit(1));
