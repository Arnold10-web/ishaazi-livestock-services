/**
 * Database Migration Routes
 * Admin-only routes for managing database migrations
 */

import express from 'express';
import { authenticateAdmin } from '../middleware/enhancedAuthMiddleware.js';
import migrationManager from '../utils/migrationManager.js';
import logger from '../utils/logger.js';
import ActivityLog from '../models/ActivityLog.js';

const router = express.Router();

/**
 * Get migration status
 */
router.get('/status', authenticateAdmin, async (req, res) => {
    try {
        const migrations = migrationManager.migrations;
        const migrationStatus = [];

        for (const migration of migrations) {
            const hasRun = await migrationManager.hasMigrationRun(migration.id);
            migrationStatus.push({
                id: migration.id,
                description: migration.description,
                version: migration.version,
                status: hasRun ? 'completed' : 'pending'
            });
        }

        await ActivityLog.logActivity({
            userId: req.user._id,
            username: req.user.companyEmail || req.user.username,
            userRole: req.user.role,
            action: 'migration_status_check',
            resource: 'database',
            details: { migrationsChecked: migrations.length },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            status: 'success'
        });

        res.json({
            success: true,
            migrations: migrationStatus,
            totalMigrations: migrations.length
        });
    } catch (error) {
        logger.error('Error getting migration status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get migration status',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * Run all pending migrations manually
 */
router.post('/run', authenticateAdmin, async (req, res) => {
    try {
        await migrationManager.runMigrations();

        await ActivityLog.logActivity({
            userId: req.user._id,
            username: req.user.companyEmail || req.user.username,
            userRole: req.user.role,
            action: 'manual_migration_run',
            resource: 'database',
            details: { triggeredBy: 'admin_request' },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            status: 'success'
        });

        res.json({
            success: true,
            message: 'Database migrations completed successfully'
        });
    } catch (error) {
        logger.error('Error running migrations:', error);
        
        await ActivityLog.logActivity({
            userId: req.user._id,
            username: req.user.companyEmail || req.user.username,
            userRole: req.user.role,
            action: 'manual_migration_run',
            resource: 'database',
            details: { error: error.message },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            status: 'failure'
        });

        res.status(500).json({
            success: false,
            message: 'Failed to run migrations',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

export default router;
