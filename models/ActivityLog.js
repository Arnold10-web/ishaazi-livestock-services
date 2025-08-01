/**
 * @file ActivityLog Model
 * @description Comprehensive activity logging for audit trails and system monitoring
 * @module models/ActivityLog
 */

import mongoose from 'mongoose';

/**
 * @constant {mongoose.Schema} ActivityLogSchema
 * @description Schema for logging all user activities in the system
 */
const ActivityLogSchema = new mongoose.Schema({
    /**
     * @property {ObjectId} userId - Reference to the user who performed the action
     */
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: false,
        index: true
    },
    
    /**
     * @property {String} username - Username/email for quick reference (denormalized)
     */
    username: {
        type: String,
        required: true
    },
    
    /**
     * @property {String} userRole - Role of the user at time of action
     */
    userRole: {
        type: String,
        enum: ['system_admin', 'editor', 'admin', 'superadmin', 'unknown'],
        required: true
    },
    
    /**
     * @property {String} action - Type of action performed
     */
    action: {
        type: String,
        enum: [
            // Authentication actions
            'login', 'logout', 'login_failed', 'password_reset', 'password_setup_required', 'account_locked',
            
            // User management actions
            'user_created', 'user_updated', 'user_deleted', 'user_activated', 'user_deactivated',
            'password_changed', 'role_changed',
            
            // Content actions
            'content_created', 'content_updated', 'content_deleted', 'content_published', 'content_unpublished',
            
            // System actions
            'settings_updated', 'security_settings_changed', 'backup_created', 'system_maintenance',
            
            // Dashboard actions
            'dashboard_accessed', 'report_generated', 'export_data',
            
            // Email actions
            'email_sent', 'bulk_email_sent', 'newsletter_sent',
            
            // General actions
            'file_uploaded', 'file_deleted', 'api_access', 'data_export', 'data_import'
        ],
        required: true,
        index: true
    },
    
    /**
     * @property {String} resource - Type of resource affected
     */
    resource: {
        type: String,
        enum: [
            'user', 'blog', 'news', 'event', 'farm', 'auction', 'newsletter', 'magazine',
            'subscriber', 'notification', 'file', 'system', 'dashboard', 'security',
            'email', 'settings', 'api', 'performance', 'analytics', 'authentication'
        ],
        index: true
    },
    
    /**
     * @property {String} resourceId - ID of the affected resource
     */
    resourceId: {
        type: String,
        index: true
    },
    
    /**
     * @property {String} resourceTitle - Title/name of resource for quick reference
     */
    resourceTitle: String,
    
    /**
     * @property {Object} details - Additional details about the action
     */
    details: {
        method: String,           // HTTP method (GET, POST, PUT, DELETE)
        path: String,            // Request path
        query: mongoose.Schema.Types.Mixed,     // Query parameters
        body: mongoose.Schema.Types.Mixed,      // Request body (sensitive data removed)
        oldValues: mongoose.Schema.Types.Mixed, // Previous values (for updates)
        newValues: mongoose.Schema.Types.Mixed, // New values (for updates)
        errorMessage: String,    // Error message if action failed
        duration: Number,        // Action duration in milliseconds
        fileSize: Number,        // File size for uploads
        emailCount: Number,      // Number of emails sent for bulk operations
        additionalInfo: mongoose.Schema.Types.Mixed // Any other relevant information
    },
    
    /**
     * @property {String} ipAddress - IP address of the user
     */
    ipAddress: {
        type: String,
        required: true,
        index: true
    },
    
    /**
     * @property {String} userAgent - User agent string
     */
    userAgent: String,
    
    /**
     * @property {String} sessionId - Session identifier
     */
    sessionId: String,
    
    /**
     * @property {String} status - Status of the action
     */
    status: {
        type: String,
        enum: ['success', 'failure', 'warning', 'info'],
        default: 'success',
        index: true
    },
    
    /**
     * @property {Number} severity - Severity level for monitoring
     */
    severity: {
        type: Number,
        min: 1,
        max: 5,
        default: 3, // 1=Low, 2=Medium, 3=Normal, 4=High, 5=Critical
        index: true
    },
    
    /**
     * @property {Array} tags - Tags for categorization and filtering
     */
    tags: [{
        type: String,
        lowercase: true,
        trim: true
    }],
    
    /**
     * @property {Date} timestamp - When the action occurred
     */
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    
    /**
     * @property {Object} metadata - Additional metadata
     */
    metadata: {
        browserInfo: mongoose.Schema.Types.Mixed,
        deviceInfo: mongoose.Schema.Types.Mixed,
        geoLocation: {
            country: String,
            region: String,
            city: String,
            latitude: Number,
            longitude: Number
        }
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

/**
 * Compound indexes for common queries
 */
ActivityLogSchema.index({ userId: 1, timestamp: -1 });
ActivityLogSchema.index({ action: 1, timestamp: -1 });
ActivityLogSchema.index({ resource: 1, resourceId: 1, timestamp: -1 });
ActivityLogSchema.index({ ipAddress: 1, timestamp: -1 });
ActivityLogSchema.index({ status: 1, severity: 1, timestamp: -1 });
ActivityLogSchema.index({ userRole: 1, action: 1, timestamp: -1 });
ActivityLogSchema.index({ timestamp: -1 }); // For general time-based queries

/**
 * Static method to log activity
 */
ActivityLogSchema.statics.logActivity = async function(activityData) {
    try {
        const log = new this(activityData);
        await log.save();
        return log;
    } catch (error) {
        console.error('Failed to log activity:', error);
        // Don't throw error to prevent disrupting main application flow
        return null;
    }
};

/**
 * Static method to get activity summary
 */
ActivityLogSchema.statics.getActivitySummary = async function(filters = {}) {
    const {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        endDate = new Date(),
        userId,
        action,
        resource,
        status
    } = filters;
    
    const matchQuery = {
        timestamp: { $gte: startDate, $lte: endDate }
    };
    
    if (userId) matchQuery.userId = userId;
    if (action) matchQuery.action = action;
    if (resource) matchQuery.resource = resource;
    if (status) matchQuery.status = status;
    
    const summary = await this.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: {
                    action: '$action',
                    status: '$status',
                    date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
                },
                count: { $sum: 1 },
                avgSeverity: { $avg: '$severity' }
            }
        },
        { $sort: { '_id.date': -1, '_id.action': 1 } }
    ]);
    
    return summary;
};

/**
 * Static method to get security events
 */
ActivityLogSchema.statics.getSecurityEvents = async function(timeframe = 24) {
    const startDate = new Date(Date.now() - timeframe * 60 * 60 * 1000);
    
    return this.find({
        timestamp: { $gte: startDate },
        $or: [
            { action: 'login_failed' },
            { action: 'account_locked' },
            { severity: { $gte: 4 } },
            { status: 'failure' }
        ]
    }).sort({ timestamp: -1 });
};

/**
 * Static method to get user activity timeline
 */
ActivityLogSchema.statics.getUserTimeline = async function(userId, limit = 50) {
    return this.find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('userId', 'username email companyEmail role');
};

/**
 * Static method to cleanup old logs
 */
ActivityLogSchema.statics.cleanupOldLogs = async function(daysToKeep = 365) {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    const result = await this.deleteMany({
        timestamp: { $lt: cutoffDate },
        severity: { $lt: 4 } // Keep critical and high severity logs longer
    });
    
    console.log(`Cleaned up ${result.deletedCount} old activity logs`);
    return result;
};

const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);

export default ActivityLog;
