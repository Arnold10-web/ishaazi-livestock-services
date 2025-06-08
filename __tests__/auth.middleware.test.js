import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { authenticateToken, authorize } from '../middleware/authMiddleware.js';
import Admin from '../models/Admin.js';

// Mock Express request and response objects
const mockRequest = (headers = {}, user = null) => ({
  headers,
  user
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('Authentication Middleware Test', () => {
  let mongoServer;
  let testAdmin;
  let validToken;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test admin
    testAdmin = await Admin.create({
      username: 'testadmin',
      email: 'test@admin.com',
      password: 'password123',
      role: 'admin'
    });

    // Generate valid token
    validToken = jwt.sign(
      { id: testAdmin._id, role: testAdmin.role },
      process.env.JWT_SECRET || 'testsecret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateToken middleware', () => {
    it('should authenticate valid token and add user to request', async () => {
      const req = mockRequest({
        authorization: `Bearer ${validToken}`
      });
      const res = mockResponse();
      const next = mockNext;

      await authenticateToken(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(testAdmin._id.toString());
      expect(req.user.role).toBe(testAdmin.role);
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject request without authorization header', async () => {
      const req = mockRequest({});
      const res = mockResponse();
      const next = mockNext;

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. No token provided.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with malformed authorization header', async () => {
      const req = mockRequest({
        authorization: 'InvalidFormat'
      });
      const res = mockResponse();
      const next = mockNext;

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Invalid token format.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', async () => {
      const req = mockRequest({
        authorization: 'Bearer invalidtoken'
      });
      const res = mockResponse();
      const next = mockNext;

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject expired token', async () => {
      const expiredToken = jwt.sign(
        { id: testAdmin._id, role: testAdmin.role },
        process.env.JWT_SECRET || 'testsecret',
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const req = mockRequest({
        authorization: `Bearer ${expiredToken}`
      });
      const res = mockResponse();
      const next = mockNext;

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle token signed with different secret', async () => {
      const wrongSecretToken = jwt.sign(
        { id: testAdmin._id, role: testAdmin.role },
        'wrongsecret',
        { expiresIn: '1h' }
      );

      const req = mockRequest({
        authorization: `Bearer ${wrongSecretToken}`
      });
      const res = mockResponse();
      const next = mockNext;

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle non-existent user in token', async () => {
      const fakeUserId = new mongoose.Types.ObjectId();
      const fakeUserToken = jwt.sign(
        { id: fakeUserId, role: 'admin' },
        process.env.JWT_SECRET || 'testsecret',
        { expiresIn: '1h' }
      );

      const req = mockRequest({
        authorization: `Bearer ${fakeUserToken}`
      });
      const res = mockResponse();
      const next = mockNext;

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found.'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('authorize middleware', () => {
    it('should authorize user with correct role', async () => {
      const req = mockRequest({}, {
        id: testAdmin._id.toString(),
        role: 'admin'
      });
      const res = mockResponse();
      const next = mockNext;

      const authorizeAdmin = authorize(['admin']);
      await authorizeAdmin(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should authorize user with multiple valid roles', async () => {
      const req = mockRequest({}, {
        id: testAdmin._id.toString(),
        role: 'admin'
      });
      const res = mockResponse();
      const next = mockNext;

      const authorizeMultiple = authorize(['admin', 'superadmin']);
      await authorizeMultiple(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject user with incorrect role', async () => {
      const req = mockRequest({}, {
        id: testAdmin._id.toString(),
        role: 'user'
      });
      const res = mockResponse();
      const next = mockNext;

      const authorizeSuperAdmin = authorize(['superadmin']);
      await authorizeSuperAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request without user in request object', async () => {
      const req = mockRequest({});
      const res = mockResponse();
      const next = mockNext;

      const authorizeAdmin = authorize(['admin']);
      await authorizeAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. User not authenticated.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle empty roles array', async () => {
      const req = mockRequest({}, {
        id: testAdmin._id.toString(),
        role: 'admin'
      });
      const res = mockResponse();
      const next = mockNext;

      const authorizeEmpty = authorize([]);
      await authorizeEmpty(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should be case sensitive with roles', async () => {
      const req = mockRequest({}, {
        id: testAdmin._id.toString(),
        role: 'Admin' // Capital A
      });
      const res = mockResponse();
      const next = mockNext;

      const authorizeAdmin = authorize(['admin']); // lowercase
      await authorizeAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Middleware chaining', () => {
    it('should work when authenticate and authorize are chained', async () => {
      const req = mockRequest({
        authorization: `Bearer ${validToken}`
      });
      const res = mockResponse();
      const next = mockNext;

      // First authenticate
      await authenticateToken(req, res, next);
      
      // Clear the mock for next call
      mockNext.mockClear();
      
      // Then authorize
      const authorizeAdmin = authorize(['admin']);
      await authorizeAdmin(req, res, next);

      expect(next).toHaveBeenCalledTimes(1); // Called once for authorize
      expect(req.user).toBeDefined();
      expect(req.user.role).toBe('admin');
    });

    it('should stop chain when authentication fails', async () => {
      const req = mockRequest({
        authorization: 'Bearer invalidtoken'
      });
      const res = mockResponse();
      const next = mockNext;

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });
  });
});
