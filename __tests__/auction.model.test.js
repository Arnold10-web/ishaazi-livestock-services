import mongoose from 'mongoose';
import Auction from '../models/Auction.js';

describe('Auction Model Tests', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/trial_test');
    }
  });

  beforeEach(async () => {
    await Auction.deleteMany({});
  });

  afterAll(async () => {
    await Auction.deleteMany({});
    await mongoose.connection.close();
  });

  // Helper function to create valid auction data
  const createValidAuctionData = (overrides = {}) => ({
    title: 'Test Auction',
    description: 'Test description',
    location: 'Test Location',
    date: new Date('2025-06-15T10:00:00.000Z'),
    startTime: '10:00',
    endTime: '16:00',
    livestock: [{
      category: 'cattle',
      breed: 'Angus',
      quantity: 1,
      startingPrice: 1000,
      description: 'Test cattle'
    }],
    auctioneer: {
      name: 'John Doe',
      contact: {
        phone: '123-456-7890',
        email: 'john@example.com'
      }
    },
    ...overrides
  });

  describe('Auction Creation', () => {
    test('should create auction with valid data', async () => {
      const auctionData = createValidAuctionData({
        title: 'Premium Cattle Auction',
        description: 'High-quality cattle for auction',
        livestock: [{
          category: 'cattle',
          breed: 'Angus',
          quantity: 20,
          startingPrice: 1500,
          description: 'Premium quality cattle'
        }]
      });

      const auction = new Auction(auctionData);
      const savedAuction = await auction.save();

      expect(savedAuction._id).toBeDefined();
      expect(savedAuction.title).toBe(auctionData.title);
      expect(savedAuction.livestock[0].category).toBe(auctionData.livestock[0].category);
      expect(savedAuction.status).toBe('upcoming'); // Default status
    });

    test('should fail to create auction without required fields', async () => {
      const auction = new Auction({
        title: 'Incomplete Auction'
        // Missing required fields
      });

      await expect(auction.save()).rejects.toThrow();
    });

    test('should validate livestock category', async () => {
      const auctionData = createValidAuctionData({
        livestock: [{
          category: 'invalid_category',
          breed: 'Angus',
          quantity: 1,
          startingPrice: 1000,
          description: 'Test cattle'
        }]
      });

      const auction = new Auction(auctionData);
      await expect(auction.save()).rejects.toThrow();
    });

    test('should validate status', async () => {
      const auctionData = createValidAuctionData({
        status: 'invalid_status'
      });

      const auction = new Auction(auctionData);
      await expect(auction.save()).rejects.toThrow();
    });

    test('should validate minimum estimated price', async () => {
      const auctionData = createValidAuctionData({
        livestock: [{
          category: 'cattle',
          breed: 'Angus',
          quantity: 1,
          startingPrice: -100, // Negative price
          description: 'Test cattle'
        }]
      });

      const auction = new Auction(auctionData);
      await expect(auction.save()).rejects.toThrow();
    });

    test('should validate minimum views', async () => {
      const auctionData = createValidAuctionData({
        views: -5 // Negative views
      });

      const auction = new Auction(auctionData);
      await expect(auction.save()).rejects.toThrow();
    });
  });

  describe('Auction Methods', () => {
    test('should add interested buyer', async () => {
      const auction = new Auction(createValidAuctionData());
      const savedAuction = await auction.save();

      // Add interested buyer
      const buyerData = {
        name: 'Test Buyer',
        email: 'buyer@test.com',
        phone: '123-456-7890'
      };

      savedAuction.interestedBuyers.push(buyerData);
      await savedAuction.save();

      expect(savedAuction.interestedBuyers).toHaveLength(1);
      expect(savedAuction.interestedBuyers[0].email).toBe('buyer@test.com');
    });

    test('should validate interested buyer email format', async () => {
      const auctionData = createValidAuctionData({
        interestedBuyers: [{
          name: 'Test Buyer',
          email: 'invalid-email', // Invalid email format
          phone: '123-456-7890'
        }]
      });

      const auction = new Auction(auctionData);
      await expect(auction.save()).rejects.toThrow();
    });

    test('should increment views', async () => {
      const auction = new Auction(createValidAuctionData());
      const savedAuction = await auction.save();

      const initialViews = savedAuction.views || 0;
      
      // Increment views
      savedAuction.views = initialViews + 1;
      await savedAuction.save();

      expect(savedAuction.views).toBe(initialViews + 1);
    });
  });

  describe('Auction Queries', () => {
    beforeEach(async () => {
      // Create test auctions
      const auctions = [
        createValidAuctionData({
          title: 'Cattle Auction 1',
          livestock: [{ category: 'cattle', breed: 'Angus', quantity: 10, startingPrice: 1500, description: 'Premium cattle' }],
          location: 'Farm A'
        }),
        createValidAuctionData({
          title: 'Goat Auction 1',
          livestock: [{ category: 'goats', breed: 'Boer', quantity: 5, startingPrice: 800, description: 'Quality goats' }],
          location: 'Farm B'
        }),
        createValidAuctionData({
          title: 'Cattle Auction 2',
          livestock: [{ category: 'cattle', breed: 'Holstein', quantity: 15, startingPrice: 2000, description: 'Dairy cattle' }],
          status: 'upcoming',
          views: 100
        })
      ];

      await Auction.insertMany(auctions);
    });

    test('should find auctions by category', async () => {
      const cattleAuctions = await Auction.find({ 'livestock.category': 'cattle' });
      expect(cattleAuctions).toHaveLength(2);
    });

    test('should find auctions by status', async () => {
      const activeAuctions = await Auction.find({ status: 'active' });
      expect(activeAuctions).toHaveLength(1);
    });

    test('should find auctions by location', async () => {
      const farmAAuctions = await Auction.find({ location: 'Farm A' });
      expect(farmAAuctions).toHaveLength(1);
    });

    test('should find upcoming auctions by date', async () => {
      const upcomingAuctions = await Auction.find({ 
        date: { $gte: new Date() },
        status: 'upcoming'
      });
      expect(upcomingAuctions.length).toBeGreaterThan(0);
    });

    test('should sort auctions by views', async () => {
      const sortedAuctions = await Auction.find({}).sort({ views: -1 });
      expect(sortedAuctions[0].views).toBeGreaterThanOrEqual(sortedAuctions[1]?.views || 0);
    });

    test('should search auctions by title', async () => {
      const searchResults = await Auction.find({ 
        title: { $regex: 'Cattle', $options: 'i' } 
      });
      expect(searchResults).toHaveLength(2);
    });
  });

  describe('Auction Timestamps', () => {
    test('should have createdAt and updatedAt timestamps', async () => {
      const auction = new Auction(createValidAuctionData());
      const savedAuction = await auction.save();

      expect(savedAuction.createdAt).toBeDefined();
      expect(savedAuction.updatedAt).toBeDefined();
      expect(savedAuction.createdAt).toBeInstanceOf(Date);
      expect(savedAuction.updatedAt).toBeInstanceOf(Date);
    });

    test('should update updatedAt on modification', async () => {
      const auction = new Auction(createValidAuctionData());
      const savedAuction = await auction.save();
      const originalUpdatedAt = savedAuction.updatedAt;

      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      savedAuction.title = 'Updated Title';
      await savedAuction.save();

      expect(savedAuction.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});
