import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import request from "supertest";
import app from "../../app.js";
import {
  setupTestDB,
  teardownTestDB,
  clearTestDB,
  getAuthHeader,
} from "../testUtils.js";
import * as authService from "../../services/authService.js";
import { User } from "../../db/models/user.js";

beforeAll(setupTestDB);
afterAll(teardownTestDB);
beforeEach(clearTestDB);

describe("Auth Routes", () => {
  describe("POST /api/v1/auth/register", () => {
    it("should register a new user and return token", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          password: "Password@123",
          role: "student",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe("john@example.com");
      expect(res.body.data.user.password).toBeUndefined();
    });

    it("should reject duplicate email", async () => {
      await authService.registerUser({
        firstName: "John",
        lastName: "Doe",
        email: "dup@example.com",
        password: "Password@123",
        role: "student",
      });
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({
          firstName: "Jane",
          lastName: "Doe",
          email: "dup@example.com",
          password: "Password@123",
          role: "student",
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it("should reject missing required fields", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({ email: "missing@example.com" });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    beforeEach(async () => {
      await authService.registerUser({
        firstName: "Login",
        lastName: "Test",
        email: "login@example.com",
        password: "Password@123",
        role: "student",
      });
    });

    it("should login with valid credentials", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "login@example.com", password: "Password@123" });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it("should reject wrong password", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "login@example.com", password: "WrongPassword@123" });

      expect(res.status).toBe(401);
    });

    it("should reject non-existent user", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "nobody@example.com", password: "Password@123" });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/v1/auth/me", () => {
    it("should return current user when authenticated", async () => {
      const { user, token } = await authService.registerUser({
        firstName: "Me",
        lastName: "Test",
        email: "me@example.com",
        password: "Password@123",
        role: "student",
      });

      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe("me@example.com");
    });

    it("should return 401 without token", async () => {
      const res = await request(app).get("/api/v1/auth/me");
      expect(res.status).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", "Bearer invalid.token.here");
      expect(res.status).toBe(401);
    });
  });

  describe("PUT /api/v1/auth/change-password", () => {
    it("should change password with valid current password", async () => {
      const { token } = await authService.registerUser({
        firstName: "Pass",
        lastName: "Change",
        email: "passchange@example.com",
        password: "Password@123",
        role: "student",
      });

      const res = await request(app)
        .put("/api/v1/auth/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: "Password@123",
          newPassword: "NewPassword@456",
        });

      expect(res.status).toBe(200);
    });

    it("should reject wrong current password", async () => {
      const { token } = await authService.registerUser({
        firstName: "Pass",
        lastName: "Bad",
        email: "passbad@example.com",
        password: "Password@123",
        role: "student",
      });

      const res = await request(app)
        .put("/api/v1/auth/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send({
          currentPassword: "WrongPassword@123",
          newPassword: "New@Password456",
        });

      expect(res.status).toBe(400);
    });
  });
});
