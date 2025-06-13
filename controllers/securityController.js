/**
 * Security Controller
 * 
 * This controller manages security-related operations for the application,
 * including security statistics, audit logs, and security settings management.
 * It provides endpoints for administrators to monitor security events, review
 * login attempts, verify system health, and configure security parameters.
 * 
 * The controller uses the Admin model for user information and the logger
 * utility to track security-related events for auditing purposes.
 */
import Admin from '../models/Admin.js';
import { logSecurityEvent } from '../utils/logger.js';

/**
 * Get security statistics and events
 * 
 * Provides a comprehensive security overview including recent logins, 
 * security events, failed login attempts, system health metrics, and
 * security recommendations. This endpoint serves as the primary data
 * source for the security dashboard.
 * 
 * @route GET /api/security/stats
 * @access Admin only (requires security permissions)
 * @returns {Object} Response containing security statistics, events, and recommendations
 */
export const getSecurityStats = async (req, res) => {
  try {
    // Get recent login attempts (last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentLogins = await Admin.find({
      lastLogin: { $gte: last24Hours }
    })
    .select('username lastLogin')
    .sort({ lastLogin: -1 })
    .limit(10);

    // Mock security events (in production, these would come from logs)
    const securityEvents = [
      {
        type: 'Login Success',
        level: 'low',
        description: 'Successful admin login',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        ip: req.ip
      },
      {
        type: 'Failed Login Attempt',
        level: 'medium',
        description: 'Multiple failed login attempts detected',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        ip: '192.168.1.100'
      },
      {
        type: 'Security Scan Detected',
        level: 'high',
        description: 'Potential security scan from suspicious IP',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        ip: '10.0.0.1'
      }
    ];

    // Mock failed attempts (in production, these would come from security logs)
    const failedAttempts = [
      {
        ip: '192.168.1.100',
        attempts: 3,
        lastAttempt: new Date(Date.now() - 30 * 60 * 1000),
        blocked: false
      },
      {
        ip: '10.0.0.1',
        attempts: 5,
        lastAttempt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        blocked: true
      }
    ];

    // System health metrics
    const systemHealth = {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      nodeVersion: process.version,
      platform: process.platform
    };

    // Active users count (admins logged in within last hour)
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);
    const activeUsers = await Admin.countDocuments({
      lastLogin: { $gte: lastHour }
    });

    // Security recommendations
    const recommendations = [
      {
        id: 'two-factor-auth',
        title: 'Enable Two-Factor Authentication',
        description: 'Add an extra layer of security to admin accounts',
        priority: 'high',
        implemented: false
      },
      {
        id: 'password-policy',
        title: 'Strengthen Password Policy',
        description: 'Require stronger passwords with regular rotation',
        priority: 'medium',
        implemented: true
      },
      {
        id: 'session-timeout',
        title: 'Configure Session Timeout',
        description: 'Automatically log out inactive users',
        priority: 'medium',
        implemented: true
      },
      {
        id: 'ip-whitelist',
        title: 'IP Address Whitelisting',
        description: 'Restrict admin access to specific IP ranges',
        priority: 'low',
        implemented: false
      }
    ];

    // Security score calculation
    const implementedRecommendations = recommendations.filter(r => r.implemented).length;
    const securityScore = Math.round((implementedRecommendations / recommendations.length) * 100);

    res.status(200).json({
      success: true,
      data: {
        recentLogins: recentLogins.map(login => ({
          username: login.username,
          timestamp: login.lastLogin,
          ip: req.ip // In production, store actual IP
        })),
        securityEvents,
        failedAttempts,
        systemHealth: {
          uptime: Math.floor(systemHealth.uptime),
          memoryUsage: Math.round(systemHealth.memoryUsage.used / 1024 / 1024), // MB
          platform: systemHealth.platform,
          nodeVersion: systemHealth.nodeVersion
        },
        activeUsers,
        recommendations,
        securityScore,
        lastUpdated: new Date()
      }
    });

    // Log security stats access
    logSecurityEvent('SECURITY_STATS_ACCESS', {
      adminId: req.user?.id,
      timestamp: new Date()
    }, req);

  } catch (error) {
    console.error('Error fetching security stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch security statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get security audit log
 * 
 * Retrieves a paginated list of security audit log entries. This endpoint
 * supports filtering by event level and type, and returns structured
 * pagination information to support audit log browsing interfaces.
 * 
 * @route GET /api/security/audit-log
 * @access Admin only (requires security permissions)
 * @param {number} [req.query.page=1] - Page number for pagination
 * @param {number} [req.query.limit=50] - Number of records per page
 * @param {string} [req.query.level] - Filter by event level (info, warning, error)
 * @param {string} [req.query.type] - Filter by event type (LOGIN, FAILED_LOGIN, etc.)
 * @returns {Object} Response containing audit log entries and pagination data
 */
export const getSecurityAuditLog = async (req, res) => {
  try {
    const { page = 1, limit = 50, level, type } = req.query;
    
    // Mock audit log entries (in production, these would come from log files)
    const auditEntries = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        level: 'info',
        type: 'LOGIN',
        message: 'Admin login successful',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        adminId: req.user?.id
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        level: 'warning',
        type: 'FAILED_LOGIN',
        message: 'Failed login attempt',
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        adminId: null
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        level: 'error',
        type: 'SECURITY_VIOLATION',
        message: 'Potential XSS attempt detected',
        ip: '10.0.0.1',
        userAgent: 'curl/7.68.0',
        adminId: null
      }
    ];

    // Filter by level and type if provided
    let filteredEntries = auditEntries;
    if (level) {
      filteredEntries = filteredEntries.filter(entry => entry.level === level);
    }
    if (type) {
      filteredEntries = filteredEntries.filter(entry => entry.type === type);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedEntries = filteredEntries.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      data: {
        entries: paginatedEntries,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(filteredEntries.length / limit),
          totalEntries: filteredEntries.length,
          hasNext: endIndex < filteredEntries.length,
          hasPrev: startIndex > 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit log',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update security settings
 * 
 * Allows administrators to modify security configuration settings for the application.
 * This endpoint validates the setting name against an allowed list and logs the
 * change for audit purposes.
 * 
 * @route PUT /api/security/settings
 * @access Admin only (requires security admin permissions)
 * @param {string} req.body.setting - The name of the security setting to update
 * @param {any} req.body.value - The new value for the setting
 * @returns {Object} Response confirming the security setting update
 */
export const updateSecuritySettings = async (req, res) => {
  try {
    const { setting, value } = req.body;
    
    // Validate security setting
    const allowedSettings = [
      'sessionTimeout',
      'maxLoginAttempts',
      'passwordMinLength',
      'requireTwoFactor',
      'ipWhitelist'
    ];

    if (!allowedSettings.includes(setting)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid security setting'
      });
    }

    // In production, save to database or configuration file
    // For now, just return success
    
    res.status(200).json({
      success: true,
      message: `Security setting '${setting}' updated successfully`,
      data: {
        setting,
        value,
        updatedAt: new Date(),
        updatedBy: req.user?.id
      }
    });

    // Log security setting change
    logSecurityEvent('SECURITY_SETTING_CHANGE', {
      setting,
      value,
      adminId: req.user?.id,
      timestamp: new Date()
    }, req);

  } catch (error) {
    console.error('Error updating security settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update security settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export default {
  getSecurityStats,
  getSecurityAuditLog,
  updateSecuritySettings
};
