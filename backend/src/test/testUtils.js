import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '../db/models/user.js';
import { generateToken } from '../middleware/auth.js';

let mongoServer;

export async function setupTestDB() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}

export async function teardownTestDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongoServer) await mongoServer.stop();
}

export async function clearTestDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

export async function createTestUser(overrides = {}) {
  const defaults = {
    firstName: 'Test',
    lastName: 'User',
    email: `test_${Date.now()}@example.com`,
    password: 'Password@123',
    role: 'student',
    isActive: true,
    isEmailVerified: true,
  };
  return User.create({ ...defaults, ...overrides });
}

export async function createTestAlumni(overrides = {}) {
  return createTestUser({ role: 'alumni', firstName: 'Alumni', lastName: 'Test', ...overrides });
}

export async function createTestAdmin(overrides = {}) {
  return createTestUser({ role: 'admin', firstName: 'Admin', lastName: 'Test', email: `admin_${Date.now()}@example.com`, ...overrides });
}

export function getAuthHeader(user) {
  const token = generateToken(user._id, user.role);
  return { Authorization: `Bearer ${token}` };
}

export function getAuthToken(user) {
  return generateToken(user._id, user.role);
}

export function mockRequest(overrides = {}) {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ...overrides,
  };
}

export function mockResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

export const mockNext = jest.fn();
