import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { setupTestDB, teardownTestDB, clearTestDB, createTestUser } from '../testUtils.js';
import * as authService from '../../services/authService.js';
import { User } from '../../db/models/user.js';

beforeAll(setupTestDB);
afterAll(teardownTestDB);
beforeEach(clearTestDB);

describe('AuthService', () => {
  describe('registerUser', () => {
    it('should register a new student successfully', async () => {
      const result = await authService.registerUser({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password@123',
        role: 'student',
      });

      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe('john@example.com');
      expect(result.user.role).toBe('student');
      expect(result.user.password).toBeUndefined();
    });

    it('should register a new alumni successfully', async () => {
      const result = await authService.registerUser({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        password: 'Password@123',
        role: 'alumni',
      });

      expect(result.user.role).toBe('alumni');
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw error for duplicate email', async () => {
      await authService.registerUser({
        firstName: 'John',
        lastName: 'Doe',
        email: 'duplicate@example.com',
        password: 'Password@123',
        role: 'student',
      });

      await expect(authService.registerUser({
        firstName: 'John2',
        lastName: 'Doe2',
        email: 'duplicate@example.com',
        password: 'Password@123',
        role: 'student',
      })).rejects.toThrow('Email already registered');
    });

    it('should normalize email to lowercase', async () => {
      const result = await authService.registerUser({
        firstName: 'John',
        lastName: 'Doe',
        email: 'JOHN@EXAMPLE.COM',
        password: 'Password@123',
        role: 'student',
      });

      expect(result.user.email).toBe('john@example.com');
    });
  });

  describe('loginUser', () => {
    beforeEach(async () => {
      await authService.registerUser({
        firstName: 'Login',
        lastName: 'Test',
        email: 'logintest@example.com',
        password: 'Password@123',
        role: 'student',
      });
    });

    it('should login with correct credentials', async () => {
      const result = await authService.loginUser('logintest@example.com', 'Password@123');
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe('logintest@example.com');
    });

    it('should throw error for wrong password', async () => {
      await expect(authService.loginUser('logintest@example.com', 'WrongPassword@123'))
        .rejects.toThrow('Invalid email or password');
    });

    it('should throw error for non-existent email', async () => {
      await expect(authService.loginUser('noexist@example.com', 'Password@123'))
        .rejects.toThrow('Invalid email or password');
    });

    it('should reject inactive users', async () => {
      await User.findOneAndUpdate({ email: 'logintest@example.com' }, { isActive: false });
      await expect(authService.loginUser('logintest@example.com', 'Password@123'))
        .rejects.toThrow('Account has been deactivated');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const user = await createTestUser({ email: 'changepass@example.com' });
      await authService.changePassword(user._id, 'Password@123', 'NewPassword@456');

      const updated = await User.findById(user._id).select('+password');
      const isMatch = await updated.comparePassword('NewPassword@456');
      expect(isMatch).toBe(true);
    });

    it('should reject wrong current password', async () => {
      const user = await createTestUser({ email: 'changepass2@example.com' });
      await expect(authService.changePassword(user._id, 'WrongPassword', 'New@123456'))
        .rejects.toThrow('Current password is incorrect');
    });
  });

  describe('generatePasswordResetToken', () => {
    it('should generate reset token for valid email', async () => {
      await createTestUser({ email: 'reset@example.com' });
      const result = await authService.generatePasswordResetToken('reset@example.com');
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe('reset@example.com');
    });

    it('should throw error for non-existent email', async () => {
      await expect(authService.generatePasswordResetToken('noexist@example.com'))
        .rejects.toThrow('No account with that email');
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      const { user, token } = await (async () => {
        const reg = await authService.registerUser({
          firstName: 'Verify',
          lastName: 'Email',
          email: 'verify@example.com',
          password: 'Password@123',
          role: 'student',
        });
        const dbUser = await User.findById(reg.user._id).select('+emailVerificationToken');
        return { user: dbUser, token: dbUser.emailVerificationToken };
      })();

      await authService.verifyEmail(token);
      const updated = await User.findById(user._id);
      expect(updated.isEmailVerified).toBe(true);
    });

    it('should throw error for invalid token', async () => {
      await expect(authService.verifyEmail('invalid-token'))
        .rejects.toThrow('Invalid or expired verification token');
    });
  });
});
