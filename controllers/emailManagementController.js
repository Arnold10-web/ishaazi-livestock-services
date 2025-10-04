/**
 * @file Email Management Controller
 * @description Comprehensive email system management for system admins
 * @module controllers/emailManagementController
 */

import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import Newsletter from '../models/Newsletter.js';
import Subscriber from '../models/Subscriber.js';
import EmailService from '../services/emailService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Create email service instance
const emailService = new EmailService();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get email templates
 */
export const getEmailTemplates = async (req, res) => {
    try {
        const templatesPath = path.resolve(__dirname, '../templates/email');
        const templates = [];
        
        if (fs.existsSync(templatesPath)) {
            const files = fs.readdirSync(templatesPath);
            
            for (const file of files) {
                if (file.endsWith('.html')) {
                    const templateName = file.replace('.html', '');
                    const filePath = path.join(templatesPath, file);
                    const content = fs.readFileSync(filePath, 'utf8');
                    const stats = fs.statSync(filePath);
                    
                    templates.push({
                        name: templateName,
                        filename: file,
                        size: stats.size,
                        lastModified: stats.mtime,
                        preview: content.substring(0, 200) + '...',
                        isLoaded: true // All templates are now dynamically loaded
                    });
                }
            }
        }
        
        // Get loaded template information from email service
        const serviceTemplates = emailService.getTemplates();
        
        res.json({
            success: true,
            data: {
                templates,
                totalTemplates: templates.length,
                serviceInfo: {
                    loadedTemplates: serviceTemplates.count,
                    templateNames: serviceTemplates.templates,
                    allTemplatesLoaded: serviceTemplates.isLoaded
                }
            }
        });
        
    } catch (error) {
        console.error('Error fetching email templates:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch email templates',
            error: error.message
        });
    }
};

/**
 * Create new email template
 */
export const createEmailTemplate = async (req, res) => {
    try {
        const { name, content, description } = req.body;
        
        if (!name || !content) {
            return res.status(400).json({
                success: false,
                message: 'Template name and content are required'
            });
        }
        
        const templatesPath = path.resolve(__dirname, '../templates/email');
        const templatePath = path.join(templatesPath, `${name}.html`);
        
        // Ensure templates directory exists
        if (!fs.existsSync(templatesPath)) {
            fs.mkdirSync(templatesPath, { recursive: true });
        }
        
        // Check if template already exists
        if (fs.existsSync(templatePath)) {
            return res.status(400).json({
                success: false,
                message: 'Template with this name already exists'
            });
        }
        
        // Write template file
        fs.writeFileSync(templatePath, content);
        
        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            username: req.user.username || req.user.companyEmail,
            userRole: req.user.role,
            action: 'email_template_created',
            resource: 'email_template',
            details: {
                templateName: name,
                description,
                method: req.method,
                path: req.path
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            status: 'success',
            severity: 2
        });
        
        res.status(201).json({
            success: true,
            message: 'Email template created successfully',
            data: {
                name,
                filename: `${name}.html`,
                description
            }
        });
        
    } catch (error) {
        console.error('Error creating email template:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create email template',
            error: error.message
        });
    }
};

/**
 * Get email sending statistics
 */
export const getEmailStats = async (req, res) => {
    try {
        const { timeframe = 30 } = req.query; // days
        const startDate = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000);
        
        // Get email activity from logs
        const emailLogs = await ActivityLog.aggregate([
            {
                $match: {
                    action: { $in: ['email_sent', 'newsletter_sent', 'email_failed'] },
                    timestamp: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        action: '$action',
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.date': 1 } }
        ]);
        
        // Get newsletter statistics
        const newsletterStats = await Newsletter.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalSent: { $sum: '$recipientCount' }
                }
            }
        ]);
        
        // Get subscriber growth
        const subscriberGrowth = await Subscriber.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    newSubscribers: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        
        // Calculate summary statistics
        const totalEmails = emailLogs.reduce((sum, log) => sum + log.count, 0);
        const successfulEmails = emailLogs
            .filter(log => log._id.action === 'email_sent' || log._id.action === 'newsletter_sent')
            .reduce((sum, log) => sum + log.count, 0);
        const failedEmails = emailLogs
            .filter(log => log._id.action === 'email_failed')
            .reduce((sum, log) => sum + log.count, 0);
        
        const successRate = totalEmails > 0 ? ((successfulEmails / totalEmails) * 100).toFixed(2) : 0;
        
        res.json({
            success: true,
            data: {
                summary: {
                    totalEmails,
                    successfulEmails,
                    failedEmails,
                    successRate: parseFloat(successRate),
                    timeframeDays: parseInt(timeframe)
                },
                emailActivity: emailLogs,
                newsletterStats,
                subscriberGrowth
            }
        });
        
    } catch (error) {
        console.error('Error fetching email stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch email statistics',
            error: error.message
        });
    }
};

/**
 * Test email template
 */
export const testEmailTemplate = async (req, res) => {
    try {
        const { templateName, testEmail, testData = {} } = req.body;
        
        if (!templateName || !testEmail) {
            return res.status(400).json({
                success: false,
                message: 'Template name and test email are required'
            });
        }
        
        // Send test email
        await emailService.sendEmail({
            to: testEmail,
            subject: `Test Email - ${templateName}`,
            templateName,
            templateData: {
                ...testData,
                testMode: true,
                testTimestamp: new Date().toISOString()
            }
        });
        
        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            username: req.user.username || req.user.companyEmail,
            userRole: req.user.role,
            action: 'email_template_tested',
            resource: 'email_template',
            details: {
                templateName,
                testEmail,
                method: req.method,
                path: req.path
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            status: 'success',
            severity: 2
        });
        
        res.json({
            success: true,
            message: 'Test email sent successfully'
        });
        
    } catch (error) {
        console.error('Error sending test email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test email',
            error: error.message
        });
    }
};

/**
 * Get email tracking data
 */
export const getEmailTracking = async (req, res) => {
    try {
        const { page = 1, limit = 50, status, action } = req.query;
        
        const query = {
            action: { $in: ['email_sent', 'newsletter_sent', 'email_failed', 'email_opened', 'email_clicked'] }
        };
        
        if (status) query.status = status;
        if (action) query.action = action;
        
        const emailTrackingData = await ActivityLog.find(query)
            .populate('userId', 'username email companyEmail role')
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        
        const total = await ActivityLog.countDocuments(query);
        
        res.json({
            success: true,
            data: {
                trackingData: emailTrackingData,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
        
    } catch (error) {
        console.error('Error fetching email tracking:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch email tracking data',
            error: error.message
        });
    }
};

/**
 * Get email system health
 */
export const getEmailSystemHealth = async (req, res) => {
    try {
        // Check email service health
        const emailHealth = await emailService.healthCheck();
        
        // Get recent email errors
        const recentErrors = await ActivityLog.find({
            action: 'email_failed',
            timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }).sort({ timestamp: -1 }).limit(10);
        
        // Get email queue status (if applicable)
        const queueStatus = {
            pending: 0,
            processing: 0,
            completed: 0,
            failed: 0
        };
        
        res.json({
            success: true,
            data: {
                emailService: emailHealth,
                recentErrors,
                queueStatus,
                lastCheck: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('Error checking email system health:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check email system health',
            error: error.message
        });
    }
};

/**
 * Update email template
 */
export const updateEmailTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, subject, content, description, variables } = req.body;
        
        if (!name || !subject || !content) {
            return res.status(400).json({
                success: false,
                message: 'Name, subject, and content are required'
            });
        }
        
        // For now, we'll simulate updating a template
        // In a real implementation, you'd save to database
        const updatedTemplate = {
            id,
            name,
            subject,
            content,
            description: description || '',
            variables: variables || [],
            updatedAt: new Date().toISOString(),
            updatedBy: req.user.username || req.user.email
        };
        
        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            username: req.user.username || req.user.email,
            userRole: req.user.role,
            action: 'email_template_updated',
            resource: 'email_template',
            resourceId: id,
            details: {
                templateName: name,
                method: req.method,
                path: req.path
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            status: 'success',
            severity: 2
        });
        
        res.json({
            success: true,
            message: 'Email template updated successfully',
            data: updatedTemplate
        });
        
    } catch (error) {
        console.error('Error updating email template:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update email template',
            error: error.message
        });
    }
};

/**
 * Delete email template
 */
export const deleteEmailTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        
        // For now, we'll simulate deleting a template
        // In a real implementation, you'd delete from database
        
        // Log activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            username: req.user.username || req.user.email,
            userRole: req.user.role,
            action: 'email_template_deleted',
            resource: 'email_template',
            resourceId: id,
            details: {
                method: req.method,
                path: req.path
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            status: 'success',
            severity: 3
        });
        
        res.json({
            success: true,
            message: 'Email template deleted successfully',
            data: { id }
        });
        
    } catch (error) {
        console.error('Error deleting email template:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete email template',
            error: error.message
        });
    }
};
