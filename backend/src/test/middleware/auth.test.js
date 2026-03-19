import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  jest,
} from "@jest/globals";
import {
  setupTestDB,
  teardownTestDB,
  clearTestDB,
  createTestUser,
  createTestAdmin,
  mockRequest,
  mockResponse,
  mockNext,
} from "../testUtils.js";
import {
  requireAuth,
  generateToken,
  verifyToken,
} from "../../middleware/auth.js";
import { requireRole, requireAdmin } from "../../middleware/roleCheck.js";

beforeAll(setupTestDB);
afterAll(teardownTestDB);
beforeEach(clearTestDB);

describe("Auth Middleware", () => {
  describe("generateToken and verifyToken", () => {
    it("should generate and verify a valid token", () => {
      const userId = "507f1f77bcf86cd799439011";
      const token = generateToken(userId, "student");
      const decoded = verifyToken(token);
      expect(decoded.userId).toBe(userId);
      expect(decoded.role).toBe("student");
    });

    it("should throw for an invalid token", () => {
      expect(() => verifyToken("invalid.token.here")).toThrow();
    });

    it("should throw for tampered token", () => {
      const token = generateToken("someId", "admin");
      const parts = token.split(".");
      parts[1] = Buffer.from(
        JSON.stringify({ userId: "hackedId", role: "admin" }),
      ).toString("base64");
      expect(() => verifyToken(parts.join("."))).toThrow();
    });
  });

  describe("requireAuth middleware", () => {
    it("should attach user to request for valid token", async () => {
      const user = await createTestUser({ email: "auth@ex.com" });
      const token = generateToken(user._id, user.role);
      const req = mockRequest({
        headers: { authorization: `Bearer ${token}` },
      });
      const res = mockResponse();
      const next = jest.fn();

      await requireAuth(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.user).toBeDefined();
      expect(req.user._id.toString()).toBe(user._id.toString());
    });

    it("should return 401 for missing token", async () => {
      const req = mockRequest({ headers: {} });
      const res = mockResponse();
      const next = jest.fn();

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 for invalid token format", async () => {
      const req = mockRequest({ headers: { authorization: "InvalidToken" } });
      const res = mockResponse();
      const next = jest.fn();

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should return 403 for deactivated user", async () => {
      const user = await createTestUser({
        email: "inactive@ex.com",
        isActive: false,
      });
      const token = generateToken(user._id, user.role);
      const req = mockRequest({
        headers: { authorization: `Bearer ${token}` },
      });
      const res = mockResponse();
      const next = jest.fn();

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});

describe("Role Check Middleware", () => {
  it("should allow access for correct role", () => {
    const req = mockRequest({ user: { role: "admin" } });
    const res = mockResponse();
    const next = jest.fn();

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("should deny access for wrong role", () => {
    const req = mockRequest({ user: { role: "student" } });
    const res = mockResponse();
    const next = jest.fn();

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("should allow multiple roles with requireRole", () => {
    const middleware = requireRole(["student", "alumni"]);
    const req = mockRequest({ user: { role: "alumni" } });
    const res = mockResponse();
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("should return 403 when no user is attached", () => {
    const req = mockRequest({ user: null });
    const res = mockResponse();
    const next = jest.fn();

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
