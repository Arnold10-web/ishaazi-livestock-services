import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import Auction from '../models/Auction.js';
import Admin from '../models/Admin.js';

// Mock file upload middleware
jest.mock('../middleware/fileUpload.js', () => ({
  single: () => (req, res, next) => {
    req.file = { filename: 'test-image.jpg' };
    next();
  }
}));

describe('Auction Controller Tests', () => {
  let adminToken;
  let adminId;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/trial_test');
    }

    // Create admin user for authentication
    const adminUser = new Admin({
      email: 'admin@test.com',
      password: 'password123',
      name: 'Test Admin'
    });
    await adminUser.save();
    adminId = adminUser._id;

    // Get admin token
    const loginResponse = await request(app)
      .post('/api/admin/login')
      .send({
        email: 'admin@test.com',
        password: 'password123'
      });
    
    adminToken = loginResponse.body.token;
  });

  beforeEach(async () => {
    // Clear auctions before each test
    await Auction.deleteMany({});
  });

  afterAll(async () => {
    // Clean up
    await Auction.deleteMany({});
    await Admin.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/auctions', () => {
    test('should create a new auction with valid data', async () => {
      const auctionData = {
        title: 'Premium Cattle Auction',
        description: 'High-quality cattle for sale',
        livestockCategory: 'cattle',
        auctioneerName: 'John Doe',
        auctioneerContact: '123-456-7890',
        location: 'Farm Valley',
        date: '2025-06-15T10:00:00.000Z',
        estimatedPrice: 5000
      };

      const response = await request(app)
        .post('/api/auctions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(auctionData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(auctionData.title);
      expect(response.body.data.livestockCategory).toBe(auctionData.livestockCategory);
    });

    test('should fail to create auction without required fields', async () => {
      const incompleteData = {
        title: 'Test Auction'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/auctions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail to create auction without authentication', async () => {
      const auctionData = {
        title: 'Test Auction',
        description: 'Test description',
        livestockCategory: 'cattle',
        auctioneerName: 'John Doe',
        auctioneerContact: '123-456-7890',
        location: 'Test Location',
        date: '2025-06-15T10:00:00.000Z'
      };

      const response = await request(app)
        .post('/api/auctions')
        .send(auctionData);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auctions', () => {
    beforeEach(async () => {
      // Create test auctions
      await Auction.create([
        {
          title: 'Cattle Auction 1',
          description: 'Cattle auction description',
          livestockCategory: 'cattle',
          auctioneerName: 'John Doe',
          auctioneerContact: '123-456-7890',
          location: 'Location 1',
          date: new Date('2025-06-15'),
          estimatedPrice: 5000,
          status: 'upcoming'
        },
        {
          title: 'Goat Auction',
          description: 'Goat auction description',
          livestockCategory: 'goats',
          auctioneerName: 'Jane Smith',
          auctioneerContact: '098-765-4321',
          location: 'Location 2',
          date: new Date('2025-06-20'),
          estimatedPrice: 2000,
          status: 'live'
        }
      ]);
    });

    test('should get all auctions', async () => {
      const response = await request(app)
        .get('/api/auctions');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    test('should filter auctions by category', async () => {
      const response = await request(app)
        .get('/api/auctions?category=cattle');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].livestockCategory).toBe('cattle');
    });

    test('should filter auctions by location', async () => {
      const response = await request(app)
        .get('/api/auctions?location=Location 1');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].location).toBe('Location 1');
    });

    test('should filter auctions by status', async () => {
      const response = await request(app)
        .get('/api/auctions?status=live');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('live');
    });

    test('should search auctions by title', async () => {
      const response = await request(app)
        .get('/api/auctions?search=Cattle');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toContain('Cattle');
    });
  });

  describe('GET /api/auctions/:id', () => {
    let auctionId;

    beforeEach(async () => {
      const auction = await Auction.create({
        title: 'Test Auction',
        description: 'Test description',
        livestockCategory: 'cattle',
        auctioneerName: 'John Doe',
        auctioneerContact: '123-456-7890',
        location: 'Test Location',
        date: new Date('2025-06-15'),
        estimatedPrice: 5000
      });
      auctionId = auction._id;
    });

    test('should get auction by ID', async () => {
      const response = await request(app)
        .get(`/api/auctions/${auctionId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Auction');
    });

    test('should return 404 for non-existent auction', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/auctions/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should increment views when getting auction', async () => {
      // Get initial views
      const initialAuction = await Auction.findById(auctionId);
      const initialViews = initialAuction.views;

      // Get auction via API
      await request(app).get(`/api/auctions/${auctionId}`);

      // Check if views incremented
      const updatedAuction = await Auction.findById(auctionId);
      expect(updatedAuction.views).toBe(initialViews + 1);
    });
  });

  describe('PUT /api/auctions/:id', () => {
    let auctionId;

    beforeEach(async () => {
      const auction = await Auction.create({
        title: 'Original Title',
        description: 'Original description',
        livestockCategory: 'cattle',
        auctioneerName: 'John Doe',
        auctioneerContact: '123-456-7890',
        location: 'Original Location',
        date: new Date('2025-06-15'),
        estimatedPrice: 5000
      });
      auctionId = auction._id;
    });

    test('should update auction with valid data', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
        estimatedPrice: 6000
      };

      const response = await request(app)
        .put(`/api/auctions/${auctionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Title');
      expect(response.body.data.estimatedPrice).toBe(6000);
    });

    test('should fail to update without authentication', async () => {
      const updateData = { title: 'Updated Title' };

      const response = await request(app)
        .put(`/api/auctions/${auctionId}`)
        .send(updateData);

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/auctions/:id', () => {
    let auctionId;

    beforeEach(async () => {
      const auction = await Auction.create({
        title: 'Test Auction',
        description: 'Test description',
        livestockCategory: 'cattle',
        auctioneerName: 'John Doe',
        auctioneerContact: '123-456-7890',
        location: 'Test Location',
        date: new Date('2025-06-15'),
        estimatedPrice: 5000
      });
      auctionId = auction._id;
    });

    test('should delete auction with valid ID', async () => {
      const response = await request(app)
        .delete(`/api/auctions/${auctionId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify auction is deleted
      const deletedAuction = await Auction.findById(auctionId);
      expect(deletedAuction).toBeNull();
    });

    test('should fail to delete without authentication', async () => {
      const response = await request(app)
        .delete(`/api/auctions/${auctionId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auctions/:id/register', () => {
    let auctionId;

    beforeEach(async () => {
      const auction = await Auction.create({
        title: 'Test Auction',
        description: 'Test description',
        livestockCategory: 'cattle',
        auctioneerName: 'John Doe',
        auctioneerContact: '123-456-7890',
        location: 'Test Location',
        date: new Date('2025-06-15'),
        estimatedPrice: 5000
      });
      auctionId = auction._id;
    });

    test('should register interest with valid data', async () => {
      const buyerData = {
        name: 'Test Buyer',
        email: 'buyer@test.com',
        phone: '123-456-7890'
      };

      const response = await request(app)
        .post(`/api/auctions/${auctionId}/register`)
        .send(buyerData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify buyer was added
      const updatedAuction = await Auction.findById(auctionId);
      expect(updatedAuction.interestedBuyers).toHaveLength(1);
      expect(updatedAuction.interestedBuyers[0].email).toBe('buyer@test.com');
    });

    test('should prevent duplicate registration', async () => {
      const buyerData = {
        name: 'Test Buyer',
        email: 'buyer@test.com',
        phone: '123-456-7890'
      };

      // Register once
      await request(app)
        .post(`/api/auctions/${auctionId}/register`)
        .send(buyerData);

      // Try to register again
      const response = await request(app)
        .post(`/api/auctions/${auctionId}/register`)
        .send(buyerData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already registered');
    });
  });

  describe('GET /api/auctions/upcoming', () => {
    beforeEach(async () => {
      // Create upcoming and past auctions
      await Auction.create([
        {
          title: 'Future Auction',
          description: 'Future auction description',
          livestockCategory: 'cattle',
          auctioneerName: 'John Doe',
          auctioneerContact: '123-456-7890',
          location: 'Future Location',
          date: new Date('2025-12-15'), // Future date
          estimatedPrice: 5000,
          status: 'upcoming'
        },
        {
          title: 'Past Auction',
          description: 'Past auction description',
          livestockCategory: 'goats',
          auctioneerName: 'Jane Smith',
          auctioneerContact: '098-765-4321',
          location: 'Past Location',
          date: new Date('2024-01-15'), // Past date
          estimatedPrice: 2000,
          status: 'completed'
        }
      ]);
    });

    test('should get only upcoming auctions', async () => {
      const response = await request(app)
        .get('/api/auctions/upcoming');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Future Auction');
    });
  });
});
