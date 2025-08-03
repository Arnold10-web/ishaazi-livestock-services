/**
 * Database Migration System
 * Handles one-time migrations that need to run automatically
 */

import User from '../models/User.js';
import logger from '../utils/logger.js';

class MigrationManager {
    constructor() {
        this.migrations = [
            {
                id: 'fix-temporary-password-flags-v2',
                description: 'Fix users with incorrect password setup flags (both hasSetPassword and isTemporaryPassword)',
                version: '2.0.0',
                run: this.fixTemporaryPasswordFlags
            }
        ];
    }

    /**
     * Run all pending migrations
     */
    async runMigrations() {
        logger.info('🔄 Running database migrations...');
        
        for (const migration of this.migrations) {
            try {
                const hasRun = await this.hasMigrationRun(migration.id);
                
                if (!hasRun) {
                    logger.info(`⚡ Running migration: ${migration.description}`);
                    await migration.run();
                    await this.markMigrationComplete(migration.id, migration.version);
                    logger.info(`✅ Migration completed: ${migration.id}`);
                } else {
                    logger.info(`⏭️  Migration already completed: ${migration.id}`);
                }
            } catch (error) {
                logger.error(`❌ Migration failed: ${migration.id}`, error);
                // Don't throw - let other migrations continue
            }
        }
        
        logger.info('✅ Database migrations completed');
    }

    /**
     * Fix users who have password but incorrect flags
     * Cases:
     * 1. hasSetPassword=true but isTemporaryPassword=true
     * 2. hasSetPassword=false but have a real password (not temporary)
     */
    async fixTemporaryPasswordFlags() {
        // Case 1: Users with hasSetPassword=true but isTemporaryPassword=true
        const usersCase1 = await User.find({
            hasSetPassword: true,
            isTemporaryPassword: true
        });

        // Case 2: Users with hasSetPassword=false but have a real password and are not temporary
        // These users completed password setup but flags weren't updated properly
        const usersCase2 = await User.find({
            hasSetPassword: false,
            isTemporaryPassword: false,
            password: { $exists: true, $ne: null },
            // Exclude users with actual temporary passwords
            passwordChangedAt: { $exists: true }
        });

        const allUsersToFix = [...usersCase1, ...usersCase2];

        if (allUsersToFix.length === 0) {
            logger.info('🎯 No users need password flag fixes');
            return;
        }

        logger.info(`🔧 Fixing password flags for ${allUsersToFix.length} users`);

        for (const user of usersCase1) {
            await User.findByIdAndUpdate(user._id, {
                isTemporaryPassword: false
            });
            
            logger.info(`✅ Fixed Case 1 - cleared isTemporaryPassword for user: ${user.companyEmail || user.username} (${user.role})`);
        }

        for (const user of usersCase2) {
            await User.findByIdAndUpdate(user._id, {
                hasSetPassword: true,
                isTemporaryPassword: false
            });
            
            logger.info(`✅ Fixed Case 2 - set hasSetPassword=true for user: ${user.companyEmail || user.username} (${user.role})`);
        }

        logger.info(`🎉 Successfully fixed password flags for ${allUsersToFix.length} users`);
    }

    /**
     * Check if a migration has already been run
     */
    async hasMigrationRun(migrationId) {
        try {
            // Use a simple collection to track migrations
            const db = User.db;
            const migrationsCollection = db.collection('migrations');
            const migration = await migrationsCollection.findOne({ migrationId });
            return migration !== null;
        } catch (error) {
            logger.error('Error checking migration status:', error);
            return false;
        }
    }

    /**
     * Mark a migration as completed
     */
    async markMigrationComplete(migrationId, version) {
        try {
            const db = User.db;
            const migrationsCollection = db.collection('migrations');
            await migrationsCollection.insertOne({
                migrationId,
                version,
                completedAt: new Date(),
                environment: process.env.NODE_ENV || 'development'
            });
        } catch (error) {
            logger.error('Error marking migration complete:', error);
        }
    }
}

// Export singleton instance
const migrationManager = new MigrationManager();
export default migrationManager;
