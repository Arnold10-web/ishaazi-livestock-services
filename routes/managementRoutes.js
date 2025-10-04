/**
 * @file Management Routes
 * @description Routes for system admin dashboard management features
 * @module routes/managementRoutes
 */

import express from 'express';
import { authenticateToken, requireRole } from '../middleware/enhancedAuthMiddleware.js';

// Import management controllers
import * as emailManagementController from '../controllers/emailManagementController.js';
import { getOverallEmailAnalytics } from '../controllers/emailTrackingController.js';
import * as fileManagementController from '../controllers/fileManagementController.js';
import * as pushNotificationManagementController from '../controllers/pushNotificationManagementController.js';
import * as backupManagementController from '../controllers/backupManagementController.js';
import * as dataExportController from '../controllers/dataExportController.js';
import * as adminDashboardOverviewController from '../controllers/adminDashboardOverviewController.js';

const router = express.Router();

// Middleware for system admin only
const requireSystemAdmin = [
    authenticateToken,
    requireRole(['system_admin'])
];

// Dashboard Overview Routes
router.get('/dashboard/overview', requireSystemAdmin, adminDashboardOverviewController.getDashboardOverview);
router.get('/dashboard/metrics', requireSystemAdmin, adminDashboardOverviewController.getSystemMetrics);

// Email Management Routes
router.get('/email/templates', requireSystemAdmin, emailManagementController.getEmailTemplates);
router.post('/email/templates', requireSystemAdmin, emailManagementController.createEmailTemplate);
router.put('/email/templates/:id', requireSystemAdmin, emailManagementController.updateEmailTemplate);
router.delete('/email/templates/:id', requireSystemAdmin, emailManagementController.deleteEmailTemplate);
router.get('/email/stats', requireSystemAdmin, getOverallEmailAnalytics);  // Enhanced SendGrid analytics
router.get('/email/basic-stats', requireSystemAdmin, emailManagementController.getEmailStats);  // Basic stats
router.post('/email/test', requireSystemAdmin, emailManagementController.testEmailTemplate);
router.get('/email/tracking', requireSystemAdmin, emailManagementController.getEmailTracking);
router.get('/email/health', requireSystemAdmin, emailManagementController.getEmailSystemHealth);

// File Management Routes
router.get('/files', requireSystemAdmin, fileManagementController.getFiles);
router.get('/files/:id', requireSystemAdmin, fileManagementController.getFileDetails);
router.delete('/files/:id', requireSystemAdmin, fileManagementController.deleteFile);
router.post('/files/bulk-delete', requireSystemAdmin, fileManagementController.bulkDeleteFiles);
router.get('/files/stats/storage', requireSystemAdmin, fileManagementController.getStorageStats);
router.post('/files/cleanup/orphaned', requireSystemAdmin, fileManagementController.cleanupOrphanedFiles);

// Push Notification Management Routes
router.get('/push/vapid-keys', requireSystemAdmin, pushNotificationManagementController.getVAPIDKeys);
router.post('/push/vapid-keys/generate', requireSystemAdmin, pushNotificationManagementController.generateVAPIDKeys);
router.get('/push/stats', requireSystemAdmin, pushNotificationManagementController.getPushNotificationStats);
router.post('/push/test', requireSystemAdmin, pushNotificationManagementController.testPushNotification);
router.get('/push/delivery-reports', requireSystemAdmin, pushNotificationManagementController.getPushDeliveryReports);
router.get('/push/health', requireSystemAdmin, pushNotificationManagementController.getPushSystemHealth);

// Backup Management Routes
router.post('/backups', requireSystemAdmin, backupManagementController.createBackup);
router.get('/backups', requireSystemAdmin, backupManagementController.getBackups);
router.delete('/backups/:id', requireSystemAdmin, backupManagementController.deleteBackup);
router.get('/backups/:id', requireSystemAdmin, backupManagementController.getBackupDetails);
router.get('/backups/stats/overview', requireSystemAdmin, backupManagementController.getBackupStats);
router.post('/backups/schedule', requireSystemAdmin, backupManagementController.scheduleBackup);
router.post('/backups/validate-cron', requireSystemAdmin, backupManagementController.validateCronExpression);

// Data Export Routes
router.get('/export/users', requireSystemAdmin, dataExportController.exportUsers);
router.get('/export/activity-logs', requireSystemAdmin, dataExportController.exportActivityLogs);
router.get('/export/content-analytics', requireSystemAdmin, dataExportController.exportContentAnalytics);
router.get('/export/subscribers', requireSystemAdmin, dataExportController.exportSubscribers);
router.get('/export/notifications', requireSystemAdmin, dataExportController.exportNotifications);
router.get('/export/system-report', requireSystemAdmin, dataExportController.generateSystemReport);

export default router;
