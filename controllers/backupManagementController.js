
/**
 * @file Backup Management Controller
 * @description Database backup scheduling and monitoring
 * @module controllers/backupManagementController
 */

import mongoose from 'mongoose';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ActivityLog from '../models/ActivityLog.js';
import User from '../models/User.js';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Backup storage directory
const BACKUP_DIR = path.resolve(__dirname, '../backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Create database backup
 */
export const createBackup = async (req, res) => {
    try {
        const { description, type = 'manual' } = req.body;

        // Validate inputs
        if (description && (typeof description !== 'string' || description.length > 500)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid description. Must be a string under 500 characters.'
            });
        }

        if (type && !['manual', 'scheduled', 'automatic'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid backup type. Must be: manual, scheduled, or automatic'
            });
        }
        
        // Security: Sanitize description to prevent injection
        const sanitizedDescription = description ? description.replace(/[<>]/g, '') : null;
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `backup-${timestamp}`;
        const backupPath = path.join(BACKUP_DIR, backupName);
        
        // Create backup directory
        fs.mkdirSync(backupPath, { recursive: true });
        
        // Get MongoDB connection details
        const mongoUri = process.env.MONGODB_URI;
        const dbName = mongoose.connection.name;
        
        if (!mongoUri) {
            return res.status(500).json({
                success: false,
                message: 'MongoDB URI not configured'
            });
        }
        
        // Security: Sanitize database name to prevent injection
        const sanitizedDbName = dbName ? dbName.replace(/[^a-zA-Z0-9_-]/g, '') : 'unknown';
        
        // Generate mongodump command with proper escaping
        const dumpPath = path.join(backupPath, 'dump');
        let command;
        
        if (mongoUri.includes('mongodb+srv://') || mongoUri.includes('mongodb://')) {
            // For Atlas or remote MongoDB - use URI (already secured via environment)
            // Escape the URI properly to prevent command injection
            const escapedUri = mongoUri.replace(/"/g, '\\"');
            command = `mongodump --uri="${escapedUri}" --out="${dumpPath}"`;
        } else {
            // For local MongoDB - use database name (sanitized)
            command = `mongodump --db="${sanitizedDbName}" --out="${dumpPath}"`;
        }
        
        console.log('Starting backup creation...');
        
        // Execute backup command
        const startTime = Date.now();
        await execAsync(command);
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Get backup size
        const getDirectorySize = (dirPath) => {
            let totalSize = 0;
            const files = fs.readdirSync(dirPath, { withFileTypes: true });
            
            for (const file of files) {
                const filePath = path.join(dirPath, file.name);
                if (file.isDirectory()) {
                    totalSize += getDirectorySize(filePath);
                } else {
                    totalSize += fs.statSync(filePath).size;
                }
            }
            
            return totalSize;
        };
        
        const backupSize = getDirectorySize(dumpPath);
        
        // Create backup metadata
        const metadata = {
            name: backupName,
            description: sanitizedDescription || `${type} backup created on ${new Date().toISOString()}`,
            type,
            createdAt: new Date().toISOString(),
            createdBy: req.user._id,
            database: sanitizedDbName,
            size: backupSize,
            duration,
            path: backupPath,
            status: 'completed'
        };
        
        // Save metadata file
        fs.writeFileSync(
            path.join(backupPath, 'metadata.json'),
            JSON.stringify(metadata, null, 2)
        );
        
        // Log backup activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            username: req.user.username || req.user.companyEmail,
            userRole: req.user.role,
            action: 'database_backup_created',
            resource: 'backup',
            details: {
                backupName,
                type,
                description,
                size: backupSize,
                duration,
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
            message: 'Database backup created successfully',
            data: {
                ...metadata,
                sizeFormatted: formatSize(backupSize),
                durationFormatted: formatDuration(duration)
            }
        });
        
    } catch (error) {
        console.error('Error creating backup:', error);
        
        // Log failed backup
        await ActivityLog.logActivity({
            userId: req.user._id,
            username: req.user.username || req.user.companyEmail,
            userRole: req.user.role,
            action: 'database_backup_failed',
            resource: 'backup',
            details: {
                error: error.message,
                method: req.method,
                path: req.path
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            status: 'failure',
            severity: 4
        });
        
        res.status(500).json({
            success: false,
            message: 'Failed to create database backup',
            error: error.message
        });
    }
};

/**
 * Get all backups
 */
export const getBackups = async (req, res) => {
    try {
        const { page = 1, limit = 20, type } = req.query;
        
        // Read backup directories
        const backupDirs = fs.readdirSync(BACKUP_DIR, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        
        const backups = [];
        
        for (const backupDir of backupDirs) {
            const metadataPath = path.join(BACKUP_DIR, backupDir, 'metadata.json');
            
            if (fs.existsSync(metadataPath)) {
                try {
                    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
                    
                    // Apply type filter
                    if (!type || metadata.type === type) {
                        backups.push({
                            ...metadata,
                            sizeFormatted: formatSize(metadata.size),
                            durationFormatted: formatDuration(metadata.duration)
                        });
                    }
                } catch (error) {
                    console.error(`Error reading metadata for ${backupDir}:`, error);
                }
            }
        }
        
        // Sort by creation date (newest first)
        backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedBackups = backups.slice(startIndex, endIndex);
        
        res.json({
            success: true,
            data: {
                backups: paginatedBackups,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: backups.length,
                    pages: Math.ceil(backups.length / limit)
                }
            }
        });
        
    } catch (error) {
        console.error('Error fetching backups:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch backups',
            error: error.message
        });
    }
};

/**
 * Delete backup
 */
export const deleteBackup = async (req, res) => {
    try {
        const { backupName } = req.params;
        
        // Security: Validate backup name to prevent directory traversal
        if (!backupName || 
            backupName.includes('..') || 
            backupName.includes('/') || 
            backupName.includes('\\') ||
            backupName.includes('~') ||
            !backupName.match(/^backup-[\w-]+$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid backup name format'
            });
        }
        
        const backupPath = path.join(BACKUP_DIR, backupName);
        
        // Security: Ensure the resolved path is within the backup directory
        const resolvedPath = path.resolve(backupPath);
        const resolvedBackupDir = path.resolve(BACKUP_DIR);
        
        if (!resolvedPath.startsWith(resolvedBackupDir + path.sep)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid backup path'
            });
        }
        
        if (!fs.existsSync(backupPath)) {
            return res.status(404).json({
                success: false,
                message: 'Backup not found'
            });
        }
        
        // Read metadata before deletion
        const metadataPath = path.join(backupPath, 'metadata.json');
        let metadata = {};
        
        if (fs.existsSync(metadataPath)) {
            metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        }
        
        // Delete backup directory recursively
        fs.rmSync(backupPath, { recursive: true, force: true });
        
        // Log deletion activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            username: req.user.username || req.user.companyEmail,
            userRole: req.user.role,
            action: 'database_backup_deleted',
            resource: 'backup',
            details: {
                backupName,
                deletedMetadata: metadata,
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
            message: 'Backup deleted successfully',
            data: {
                deletedBackup: backupName
            }
        });
        
    } catch (error) {
        console.error('Error deleting backup:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete backup',
            error: error.message
        });
    }
};

/**
 * Get backup details
 */
export const getBackupDetails = async (req, res) => {
    try {
        const { backupName } = req.params;
        
        // Security: Validate backup name to prevent directory traversal
        if (!backupName || 
            backupName.includes('..') || 
            backupName.includes('/') || 
            backupName.includes('\\') ||
            backupName.includes('~') ||
            !backupName.match(/^backup-[\w-]+$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid backup name format'
            });
        }
        
        const backupPath = path.join(BACKUP_DIR, backupName);
        
        // Security: Ensure the resolved path is within the backup directory
        const resolvedPath = path.resolve(backupPath);
        const resolvedBackupDir = path.resolve(BACKUP_DIR);
        
        if (!resolvedPath.startsWith(resolvedBackupDir + path.sep)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid backup path'
            });
        }
        
        const metadataPath = path.join(backupPath, 'metadata.json');
        
        if (!fs.existsSync(backupPath) || !fs.existsSync(metadataPath)) {
            return res.status(404).json({
                success: false,
                message: 'Backup not found'
            });
        }
        
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        
        // Get backup contents
        const dumpPath = path.join(backupPath, 'dump');
        const collections = [];
        
        if (fs.existsSync(dumpPath)) {
            const dbDirs = fs.readdirSync(dumpPath, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory());
            
            for (const dbDir of dbDirs) {
                const dbPath = path.join(dumpPath, dbDir.name);
                const files = fs.readdirSync(dbPath);
                
                const collectionFiles = files.filter(file => file.endsWith('.bson'));
                
                for (const file of collectionFiles) {
                    const collectionName = file.replace('.bson', '');
                    const filePath = path.join(dbPath, file);
                    const stats = fs.statSync(filePath);
                    
                    collections.push({
                        name: collectionName,
                        size: stats.size,
                        sizeFormatted: formatSize(stats.size)
                    });
                }
            }
        }
        
        res.json({
            success: true,
            data: {
                ...metadata,
                sizeFormatted: formatSize(metadata.size),
                durationFormatted: formatDuration(metadata.duration),
                collections
            }
        });
        
    } catch (error) {
        console.error('Error fetching backup details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch backup details',
            error: error.message
        });
    }
};

/**
 * Get backup statistics
 */
export const getBackupStats = async (req, res) => {
    try {
        // Read all backup metadata
        const backupDirs = fs.readdirSync(BACKUP_DIR, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        
        const backups = [];
        let totalSize = 0;
        
        for (const backupDir of backupDirs) {
            const metadataPath = path.join(BACKUP_DIR, backupDir, 'metadata.json');
            
            if (fs.existsSync(metadataPath)) {
                try {
                    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
                    backups.push(metadata);
                    totalSize += metadata.size || 0;
                } catch (error) {
                    console.error(`Error reading metadata for ${backupDir}:`, error);
                }
            }
        }
        
        // Calculate statistics
        const stats = {
            totalBackups: backups.length,
            totalSize,
            totalSizeFormatted: formatSize(totalSize),
            byType: {},
            timeline: []
        };
        
        // Group by type
        backups.forEach(backup => {
            const type = backup.type || 'unknown';
            if (!stats.byType[type]) {
                stats.byType[type] = { count: 0, size: 0 };
            }
            stats.byType[type].count++;
            stats.byType[type].size += backup.size || 0;
        });
        
        // Format type statistics
        Object.keys(stats.byType).forEach(type => {
            stats.byType[type].sizeFormatted = formatSize(stats.byType[type].size);
        });
        
        // Create timeline (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentBackups = backups.filter(backup => 
            new Date(backup.createdAt) >= thirtyDaysAgo
        );
        
        const timelineMap = {};
        recentBackups.forEach(backup => {
            const date = new Date(backup.createdAt).toISOString().split('T')[0];
            if (!timelineMap[date]) {
                timelineMap[date] = { date, count: 0, size: 0 };
            }
            timelineMap[date].count++;
            timelineMap[date].size += backup.size || 0;
        });
        
        stats.timeline = Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date));
        
        res.json({
            success: true,
            data: stats
        });
        
    } catch (error) {
        console.error('Error fetching backup stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch backup statistics',
            error: error.message
        });
    }
};

/**
 * Schedule automatic backup
 */
export const scheduleBackup = async (req, res) => {
    try {
        const { schedule, description, enabled = true } = req.body;
        
        // Security: Validate cron expression format
        if (!schedule || typeof schedule !== 'string' || !isValidCronExpression(schedule)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid cron schedule format'
            });
        }
        
        // Security: Validate description
        if (description && (typeof description !== 'string' || description.length > 500)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid description'
            });
        }
        
        // This is a placeholder for backup scheduling
        // In a real implementation, you would integrate with a job scheduler like node-cron
        
        const scheduleConfig = {
            id: Date.now().toString(),
            schedule, // cron expression
            description: description || 'Scheduled backup',
            enabled: Boolean(enabled),
            createdBy: req.user._id,
            createdAt: new Date().toISOString(),
            nextRun: calculateNextRun(schedule)
        };
        
        // Log scheduling activity
        await ActivityLog.logActivity({
            userId: req.user._id,
            username: req.user.username || req.user.companyEmail,
            userRole: req.user.role,
            action: 'backup_scheduled',
            resource: 'backup',
            details: {
                schedule,
                description,
                enabled,
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
            message: 'Backup scheduled successfully',
            data: scheduleConfig
        });
        
    } catch (error) {
        console.error('Error scheduling backup:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to schedule backup',
            error: error.message
        });
    }
};

// Helper functions
function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}

function calculateNextRun(cronExpression) {
    // Placeholder for cron calculation
    // In a real implementation, use a cron parser library
    return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Next day
}

// Security helper function to validate cron expressions
function isValidCronExpression(cron) {
    // Basic cron validation (5 or 6 fields)
    const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;
    
    if (!cron || typeof cron !== 'string') return false;
    
    const parts = cron.trim().split(/\s+/);
    if (parts.length !== 5 && parts.length !== 6) return false;
    
    // Additional validation to prevent injection
    const safeChars = /^[0-9\*\/\-\,\s]+$/;
    return safeChars.test(cron) && cron.length <= 50;
}
