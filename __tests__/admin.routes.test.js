import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import adminRoutes from '../routes/adminRoutes.js';
import Admin from '../models/Admin.js';

const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);

describe('Admin Routes Test', () => {
  let mongoServer;
  let adminToken;
  let adminUser;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test admin user
    adminUser = await Admin.create({
      username: 'testadmin',
      email: 'test@admin.com',
      password: 'password123',
      role: 'admin'
    });

    // Generate token for authentication
    adminToken = jwt.sign(
      { id: adminUser._id, role: adminUser.role },
      process.env.JWT_SECRET || 'testsecret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    // Clean up test data except the admin user
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      if (key !== 'admins') {
        await collections[key].deleteMany({});
      }
    }
  });

  describe('POST /api/admin/login', () => {
    it('should login admin with valid credentials', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({
          email: 'test@admin.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.admin).toBeDefined();
      expect(response.body.admin.email).toBe('test@admin.com');
      expect(response.body.admin.password).toBeUndefined(); // Password should not be returned
    });

    it('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({
          email: 'invalid@admin.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({
          email: 'test@admin.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should reject login with missing fields', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({
          email: 'test@admin.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/admin/register', () => {
    it('should register new admin with valid data', async () => {
      const response = await request(app)
        .post('/api/admin/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'newadmin',
          email: 'new@admin.com',
          password: 'newpassword123',
          role: 'admin'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.admin).toBeDefined();
      expect(response.body.admin.email).toBe('new@admin.com');
      expect(response.body.admin.password).toBeUndefined();
    });

    it('should reject registration without authentication', async () => {
      const response = await request(app)
        .post('/api/admin/register')
        .send({
          username: 'newadmin',
          email: 'new@admin.com',
          password: 'newpassword123'
        });

      expect(response.status).toBe(401);
    });

    it('should reject registration with duplicate email', async () => {
      const response = await request(app)
        .post('/api/admin/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'duplicateadmin',
          email: 'test@admin.com', // Same as existing admin
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email');
    });

    it('should reject registration with missing required fields', async () => {
      const response = await request(app)
        .post('/api/admin/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'incompleteadmin'
          // Missing email and password
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/profile', () => {
    it('should get admin profile with valid token', async () => {
      const response = await request(app)
        .get('/api/admin/profile')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.admin).toBeDefined();
      expect(response.body.admin.email).toBe('test@admin.com');
      expect(response.body.admin.password).toBeUndefined();
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/admin/profile');

      expect(response.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/admin/profile')
        .set('Authorization', 'Bearer invalidtoken');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/admin/profile', () => {
    it('should update admin profile with valid data', async () => {
      const response = await request(app)
        .put('/api/admin/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'updatedadmin',
          email: 'updated@admin.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.admin.username).toBe('updatedadmin');
      expect(response.body.admin.email).toBe('updated@admin.com');
    });

    it('should reject update without authentication', async () => {
      const response = await request(app)
        .put('/api/admin/profile')
        .send({
          username: 'updatedadmin'
        });

      expect(response.status).toBe(401);
    });

    it('should reject update with invalid email format', async () => {
      const response = await request(app)
        .put('/api/admin/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'invalid-email-format'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/admin/:id', () => {
    let secondAdmin;
    let superAdminToken;

    beforeEach(async () => {
      // Create second admin to delete
      secondAdmin = await Admin.create({
        username: 'deleteadmin',
        email: 'delete@admin.com',
        password: 'password123',
        role: 'admin'
      });

      // Create superadmin for deletion permissions
      const superAdmin = await Admin.create({
        username: 'superadmin',
        email: 'super@admin.com',
        password: 'password123',
        role: 'superadmin'
      });

      superAdminToken = jwt.sign(
        { id: superAdmin._id, role: superAdmin.role },
        process.env.JWT_SECRET || 'testsecret',
        { expiresIn: '1h' }
      );
    });

    it('should delete admin with superadmin permissions', async () => {
      const response = await request(app)
        .delete(`/api/admin/${secondAdmin._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify admin is deleted
      const deletedAdmin = await Admin.findById(secondAdmin._id);
      expect(deletedAdmin).toBeNull();
    });

    it('should reject deletion without proper permissions', async () => {
      const response = await request(app)
        .delete(`/api/admin/${secondAdmin._id}`)
        .set('Authorization', `Bearer ${adminToken}`); // Regular admin, not superadmin

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should reject deletion without authentication', async () => {
      const response = await request(app)
        .delete(`/api/admin/${secondAdmin._id}`);

      expect(response.status).toBe(401);
    });

    it('should handle deletion of non-existent admin', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/admin/${fakeId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/stats', () => {
    it('should get admin dashboard stats', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.stats).toBeDefined();
      expect(typeof response.body.stats).toBe('object');
    });

    it('should reject stats request without authentication', async () => {
      const response = await request(app)
        .get('/api/admin/stats');

      expect(response.status).toBe(401);
    });
  });
});
