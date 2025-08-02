// 🎯 Auction Registration Controller - Buyer registration management
import Auction from '../models/Auction.js';
import ActivityLog from '../models/ActivityLog.js';
import { sendEmail } from '../services/emailService.js';

// Create registration endpoint
export const createRegistration = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const {
      buyerName,
      buyerEmail,
      buyerPhone,
      buyerCompany,
      paymentMethod,
      specialRequirements
    } = req.body;

    // Validate required fields
    if (!buyerName || !buyerEmail || !buyerPhone) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and phone are required'
      });
    }

    // Find auction
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      });
    }

    // Check if registration is still open
    const now = new Date();
    const auctionDate = new Date(auction.date);
    if (auctionDate <= now) {
      return res.status(400).json({
        success: false,
        message: 'Registration is closed for this auction'
      });
    }

    // Check if buyer already registered
    const existingRegistration = auction.registrations.find(
      reg => reg.buyerEmail === buyerEmail
    );

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You have already registered for this auction'
      });
    }

    // Create registration
    const registration = {
      buyerName,
      buyerEmail,
      buyerPhone,
      buyerCompany: buyerCompany || '',
      paymentMethod: paymentMethod || 'cash',
      specialRequirements: specialRequirements || '',
      status: 'pending',
      registeredAt: new Date(),
      paymentStatus: 'pending'
    };

    auction.registrations.push(registration);
    await auction.save();

    // Log activity
    await ActivityLog.logActivity({
      userId: req.user?.id || null,
      username: buyerName,
      userRole: 'buyer',
      action: 'auction_registration_created',
      resource: 'auction',
      resourceId: auctionId,
      details: {
        auctionTitle: auction.title,
        buyerEmail,
        buyerPhone
      }
    });

    // Send confirmation email
    try {
      await sendEmail({
        to: buyerEmail,
        subject: 'Auction Registration Received',
        templateName: 'auction-registration-confirmation',
        templateData: {
          buyerName,
          auctionTitle: auction.title,
          auctionDate: auction.date,
          auctionLocation: auction.location,
          registrationFee: auction.registrationFee || 0,
          registrationId: registration._id
        }
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully',
      registration: {
        id: registration._id,
        status: registration.status,
        registeredAt: registration.registeredAt
      }
    });

  } catch (error) {
    console.error('Error creating registration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all registrations (admin only)
export const getAllRegistrations = async (req, res) => {
  try {
    const { auctionId, status, page = 1, limit = 50 } = req.query;
    
    const filter = {};
    if (auctionId && auctionId !== 'all') {
      filter._id = auctionId;
    }

    const auctions = await Auction.find(filter)
      .populate('registrations')
      .sort({ date: -1 });

    let allRegistrations = [];
    auctions.forEach(auction => {
      const registrations = auction.registrations.map(reg => ({
        ...reg.toObject(),
        auction: {
          _id: auction._id,
          title: auction.title,
          date: auction.date,
          location: auction.location,
          registrationFee: auction.registrationFee
        }
      }));
      allRegistrations = allRegistrations.concat(registrations);
    });

    // Filter by status if provided
    if (status && status !== 'all') {
      allRegistrations = allRegistrations.filter(reg => reg.status === status);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedRegistrations = allRegistrations.slice(startIndex, endIndex);

    // Calculate stats
    const stats = {
      total: allRegistrations.length,
      pending: allRegistrations.filter(r => r.status === 'pending').length,
      approved: allRegistrations.filter(r => r.status === 'approved').length,
      rejected: allRegistrations.filter(r => r.status === 'rejected').length
    };

    res.json({
      success: true,
      registrations: paginatedRegistrations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: allRegistrations.length,
        pages: Math.ceil(allRegistrations.length / limit)
      },
      stats
    });

  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch registrations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Approve registration
export const approveRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;

    // Find auction with the registration
    const auction = await Auction.findOne({
      'registrations._id': registrationId
    });

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    const registration = auction.registrations.id(registrationId);
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    registration.status = 'approved';
    registration.approvedAt = new Date();
    registration.approvedBy = req.user.id;

    await auction.save();

    // Log activity
    await ActivityLog.logActivity({
      userId: req.user.id,
      username: req.user.username,
      userRole: req.user.role,
      action: 'auction_registration_approved',
      resource: 'auction',
      resourceId: auction._id,
      details: {
        auctionTitle: auction.title,
        buyerName: registration.buyerName,
        buyerEmail: registration.buyerEmail
      }
    });

    // Send approval email
    try {
      await sendEmail({
        to: registration.buyerEmail,
        subject: 'Auction Registration Approved',
        templateName: 'auction-registration-approved',
        templateData: {
          buyerName: registration.buyerName,
          auctionTitle: auction.title,
          auctionDate: auction.date,
          auctionLocation: auction.location,
          bidderNumber: registration._id.toString().slice(-6).toUpperCase()
        }
      });
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError);
    }

    res.json({
      success: true,
      message: 'Registration approved successfully'
    });

  } catch (error) {
    console.error('Error approving registration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Reject registration
export const rejectRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { reason } = req.body;

    // Find auction with the registration
    const auction = await Auction.findOne({
      'registrations._id': registrationId
    });

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    const registration = auction.registrations.id(registrationId);
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    registration.status = 'rejected';
    registration.rejectedAt = new Date();
    registration.rejectedBy = req.user.id;
    registration.rejectionReason = reason || '';

    await auction.save();

    // Log activity
    await ActivityLog.logActivity({
      userId: req.user.id,
      username: req.user.username,
      userRole: req.user.role,
      action: 'auction_registration_rejected',
      resource: 'auction',
      resourceId: auction._id,
      details: {
        auctionTitle: auction.title,
        buyerName: registration.buyerName,
        buyerEmail: registration.buyerEmail,
        reason: reason || 'No reason provided'
      }
    });

    // Send rejection email
    try {
      await sendEmail({
        to: registration.buyerEmail,
        subject: 'Auction Registration Update',
        templateName: 'auction-registration-rejected',
        templateData: {
          buyerName: registration.buyerName,
          auctionTitle: auction.title,
          reason: reason || 'Please contact us for more information'
        }
      });
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
    }

    res.json({
      success: true,
      message: 'Registration rejected'
    });

  } catch (error) {
    console.error('Error rejecting registration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Export registrations to CSV
export const exportRegistrations = async (req, res) => {
  try {
    const { auctionId } = req.query;
    
    const filter = {};
    if (auctionId && auctionId !== 'all') {
      filter._id = auctionId;
    }

    const auctions = await Auction.find(filter)
      .populate('registrations')
      .sort({ date: -1 });

    let allRegistrations = [];
    auctions.forEach(auction => {
      const registrations = auction.registrations.map(reg => ({
        auctionTitle: auction.title,
        auctionDate: auction.date,
        auctionLocation: auction.location,
        buyerName: reg.buyerName,
        buyerEmail: reg.buyerEmail,
        buyerPhone: reg.buyerPhone,
        buyerCompany: reg.buyerCompany || '',
        status: reg.status,
        registeredAt: reg.registeredAt,
        paymentMethod: reg.paymentMethod || '',
        paymentStatus: reg.paymentStatus || 'pending',
        specialRequirements: reg.specialRequirements || ''
      }));
      allRegistrations = allRegistrations.concat(registrations);
    });

    // Create CSV content
    const headers = [
      'Auction Title',
      'Auction Date',
      'Location',
      'Buyer Name',
      'Email',
      'Phone',
      'Company',
      'Status',
      'Registered Date',
      'Payment Method',
      'Payment Status',
      'Special Requirements'
    ];

    let csvContent = headers.join(',') + '\n';
    
    allRegistrations.forEach(reg => {
      const row = [
        `"${reg.auctionTitle}"`,
        `"${new Date(reg.auctionDate).toLocaleDateString()}"`,
        `"${reg.auctionLocation}"`,
        `"${reg.buyerName}"`,
        `"${reg.buyerEmail}"`,
        `"${reg.buyerPhone}"`,
        `"${reg.buyerCompany}"`,
        `"${reg.status}"`,
        `"${new Date(reg.registeredAt).toLocaleDateString()}"`,
        `"${reg.paymentMethod}"`,
        `"${reg.paymentStatus}"`,
        `"${reg.specialRequirements}"`
      ];
      csvContent += row.join(',') + '\n';
    });

    // Log activity
    await ActivityLog.logActivity({
      userId: req.user.id,
      username: req.user.username,
      userRole: req.user.role,
      action: 'auction_registrations_exported',
      resource: 'auction',
      details: {
        exportCount: allRegistrations.length,
        auctionFilter: auctionId || 'all'
      }
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="auction-registrations-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);

  } catch (error) {
    console.error('Error exporting registrations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export registrations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get auction statistics
export const getAuctionStats = async (req, res) => {
  try {
    const now = new Date();
    
    // Get all auctions
    const auctions = await Auction.find({});
    
    // Calculate statistics
    const stats = {
      totalAuctions: auctions.length,
      activeAuctions: auctions.filter(a => {
        const auctionDate = new Date(a.date);
        return auctionDate > now && a.status === 'active';
      }).length,
      upcomingAuctions: auctions.filter(a => {
        const auctionDate = new Date(a.date);
        return auctionDate > now;
      }).length,
      completedAuctions: auctions.filter(a => a.status === 'completed').length,
      cancelledAuctions: auctions.filter(a => a.status === 'cancelled').length,
      totalRegistrations: auctions.reduce((total, auction) => total + auction.registrations.length, 0),
      totalRevenue: auctions.reduce((total, auction) => {
        const auctionRevenue = auction.items?.reduce((sum, item) => sum + (item.finalPrice || 0), 0) || 0;
        return total + auctionRevenue;
      }, 0)
    };

    res.json(stats);

  } catch (error) {
    console.error('Error fetching auction stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch auction statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get recent activity
export const getRecentActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    const activities = await ActivityLog.find({
      action: {
        $in: [
          'auction_created',
          'auction_updated',
          'auction_cancelled',
          'auction_completed',
          'auction_registration_created',
          'auction_registration_approved',
          'auction_registration_rejected'
        ]
      }
    })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();

    // Format activities
    const formattedActivities = activities.map(activity => ({
      type: activity.action,
      description: getActivityDescription(activity),
      timestamp: activity.timestamp,
      auctionTitle: activity.details?.auctionTitle,
      buyerName: activity.details?.buyerName
    }));

    res.json({
      success: true,
      activity: formattedActivities
    });

  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activity',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get performance data
export const getPerformanceData = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const auctions = await Auction.find({
      createdAt: { $gte: sixMonthsAgo }
    });

    // Group by month
    const monthlyData = {};
    const registrationData = {};

    auctions.forEach(auction => {
      const month = auction.createdAt.toISOString().slice(0, 7); // YYYY-MM
      
      if (!monthlyData[month]) {
        monthlyData[month] = { auctions: 0, revenue: 0 };
      }
      if (!registrationData[month]) {
        registrationData[month] = { registrations: 0, approved: 0 };
      }

      monthlyData[month].auctions += 1;
      monthlyData[month].revenue += auction.items?.reduce((sum, item) => sum + (item.finalPrice || 0), 0) || 0;
      
      registrationData[month].registrations += auction.registrations.length;
      registrationData[month].approved += auction.registrations.filter(r => r.status === 'approved').length;
    });

    // Convert to arrays
    const months = Object.keys(monthlyData).sort();
    const performanceData = months.map(month => ({
      month: month,
      auctions: monthlyData[month].auctions,
      revenue: monthlyData[month].revenue
    }));

    const registrationTrends = months.map(month => ({
      month: month,
      registrations: registrationData[month]?.registrations || 0,
      approved: registrationData[month]?.approved || 0
    }));

    res.json({
      success: true,
      monthly: performanceData,
      registrations: registrationTrends
    });

  } catch (error) {
    console.error('Error fetching performance data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to format activity descriptions
function getActivityDescription(activity) {
  switch (activity.action) {
    case 'auction_created':
      return `New auction "${activity.details?.auctionTitle}" was created`;
    case 'auction_updated':
      return `Auction "${activity.details?.auctionTitle}" was updated`;
    case 'auction_cancelled':
      return `Auction "${activity.details?.auctionTitle}" was cancelled`;
    case 'auction_completed':
      return `Auction "${activity.details?.auctionTitle}" was completed`;
    case 'auction_registration_created':
      return `${activity.details?.buyerName} registered for "${activity.details?.auctionTitle}"`;
    case 'auction_registration_approved':
      return `Registration approved for ${activity.details?.buyerName} in "${activity.details?.auctionTitle}"`;
    case 'auction_registration_rejected':
      return `Registration rejected for ${activity.details?.buyerName} in "${activity.details?.auctionTitle}"`;
    default:
      return 'Unknown activity';
  }
}
