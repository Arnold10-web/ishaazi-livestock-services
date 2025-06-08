import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Admin from '../models/Admin.js';
import bcrypt from 'bcryptjs';

describe('Admin Model Test', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await Admin.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('should create a valid admin', async () => {
      const validAdmin = {
        username: 'testadmin',
        email: 'test@admin.com',
        password: 'password123',
        role: 'admin'
      };

      const admin = new Admin(validAdmin);
      const savedAdmin = await admin.save();

      expect(savedAdmin._id).toBeDefined();
      expect(savedAdmin.username).toBe(validAdmin.username);
      expect(savedAdmin.email).toBe(validAdmin.email);
      expect(savedAdmin.role).toBe(validAdmin.role);
      expect(savedAdmin.password).not.toBe(validAdmin.password); // Should be hashed
    });

    it('should require username', async () => {
      const admin = new Admin({
        email: 'test@admin.com',
        password: 'password123'
      });

      let err;
      try {
        await admin.save();
      } catch (error) {
        err = error;
      }
      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.username).toBeDefined();
    });

    it('should allow admin creation without email', async () => {
      const admin = new Admin({
        username: 'testadmin',
        password: 'password123'
      });

      const savedAdmin = await admin.save();
      expect(savedAdmin._id).toBeDefined();
      expect(savedAdmin.username).toBe('testadmin');
      expect(savedAdmin.email).toBeUndefined();
      expect(savedAdmin.role).toBe('admin'); // default role
    });

    it('should require password', async () => {
      const admin = new Admin({
        username: 'testadmin',
        email: 'test@admin.com'
      });

      let err;
      try {
        await admin.save();
      } catch (error) {
        err = error;
      }
      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.password).toBeDefined();
    });

    it('should validate email format', async () => {
      const admin = new Admin({
        username: 'testadmin',
        email: 'invalid-email',
        password: 'password123'
      });

      let err;
      try {
        await admin.save();
      } catch (error) {
        err = error;
      }
      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.email).toBeDefined();
    });

    it('should enforce unique email', async () => {
      const adminData = {
        username: 'testadmin',
        email: 'test@admin.com',
        password: 'password123'
      };

      await Admin.create(adminData);

      const duplicateAdmin = new Admin({
        username: 'testadmin2',
        email: 'test@admin.com',
        password: 'password456'
      });

      let err;
      try {
        await duplicateAdmin.save();
      } catch (error) {
        err = error;
      }
      expect(err.code).toBe(11000); // Duplicate key error
    });

    it('should set default role to admin', async () => {
      const admin = new Admin({
        username: 'testadmin',
        email: 'test@admin.com',
        password: 'password123'
      });

      const savedAdmin = await admin.save();
      expect(savedAdmin.role).toBe('admin');
    });

    it('should accept different role values', async () => {
      const admin = new Admin({
        username: 'testadmin',
        email: 'test@admin.com',
        password: 'password123',
        role: 'superadmin'
      });

      const savedAdmin = await admin.save();
      expect(savedAdmin.role).toBe('superadmin');
    });
  });

  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      const plainPassword = 'password123';
      const admin = new Admin({
        username: 'testadmin',
        email: 'test@admin.com',
        password: plainPassword
      });

      const savedAdmin = await admin.save();
      expect(savedAdmin.password).not.toBe(plainPassword);
      expect(savedAdmin.password.length).toBeGreaterThan(plainPassword.length);
    });

    it('should verify password correctly', async () => {
      const plainPassword = 'password123';
      const admin = await Admin.create({
        username: 'testadmin',
        email: 'test@admin.com',
        password: plainPassword
      });

      const isMatch = await bcrypt.compare(plainPassword, admin.password);
      expect(isMatch).toBe(true);

      const isWrongMatch = await bcrypt.compare('wrongpassword', admin.password);
      expect(isWrongMatch).toBe(false);
    });
  });

  describe('Timestamps', () => {
    it('should add createdAt and updatedAt timestamps', async () => {
      const admin = await Admin.create({
        username: 'testadmin',
        email: 'test@admin.com',
        password: 'password123'
      });

      expect(admin.createdAt).toBeDefined();
      expect(admin.updatedAt).toBeDefined();
      expect(admin.createdAt).toBeInstanceOf(Date);
      expect(admin.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on modification', async () => {
      const admin = await Admin.create({
        username: 'testadmin',
        email: 'test@admin.com',
        password: 'password123'
      });

      const originalUpdatedAt = admin.updatedAt;
      
      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      admin.username = 'updatedadmin';
      await admin.save();

      expect(admin.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});
