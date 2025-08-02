
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
import cronParser from 'cron-parser';
import ActivityLog from '../models/ActivityLog.js';
import User from '../models/User.js';
import { promisify } from 'util';

const { parseExpression } = cronParser;

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Backup storage directory - configurable via environment variable
const BACKUP_DIR = process.env.BACKUP_DIR || path.resolve(__dirname, '../backups');

// Initialize backup directory asynchronously
export const initializeBackupDirectory = async () => {
    try {
        await fs.promises.mkdir(BACKUP_DIR, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') {
            throw error;
        }
    }
};

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
        await fs.promises.mkdir(backupPath, { recursive: true });
        
        // Get MongoDB connection details
        const mongoUri = process.env.MONGO_URI;
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
        const getDirectorySize = async (dirPath) => {
            let totalSize = 0;
            const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
            
            for (const file of files) {
                const filePath = path.join(dirPath, file.name);
                if (file.isDirectory()) {
                    totalSize += await getDirectorySize(filePath);
                } else {
                    const stats = await fs.promises.stat(filePath);
                    totalSize += stats.size;
                }
            }
            
            return totalSize;
        };
        
        const backupSize = await getDirectorySize(dumpPath);
        
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
        await fs.promises.writeFile(
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
        const backupDirs = (await fs.promises.readdir(BACKUP_DIR, { withFileTypes: true }))
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        
        const backups = [];
        
        for (const backupDir of backupDirs) {
            const metadataPath = path.join(BACKUP_DIR, backupDir, 'metadata.json');
            
            try {
                const metadata = JSON.parse(await fs.promises.readFile(metadataPath, 'utf8'));
                
                // Apply type filter
                if (!type || metadata.type === type) {
                    backups.push({
                        ...metadata,
                        sizeFormatted: formatSize(metadata.size),
                        durationFormatted: formatDuration(metadata.duration)
                    });
                }
            } catch (error) {
                if (error.code !== 'ENOENT') {
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
        
        // Check if backup exists
        try {
            await fs.promises.access(backupPath);
        } catch (error) {
            return res.status(404).json({
                success: false,
                message: 'Backup not found'
            });
        }
        
        // Read metadata before deletion
        const metadataPath = path.join(backupPath, 'metadata.json');
        let metadata = {};
        
        try {
            metadata = JSON.parse(await fs.promises.readFile(metadataPath, 'utf8'));
        } catch (error) {
            // Metadata file might not exist, continue with deletion
        }
        
        // Delete backup directory recursively
        await fs.promises.rm(backupPath, { recursive: true, force: true });
        
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
        
        // Check if backup and metadata exist
        try {
            await fs.promises.access(backupPath);
            await fs.promises.access(metadataPath);
        } catch (error) {
            return res.status(404).json({
                success: false,
                message: 'Backup not found'
            });
        }
        
        const metadata = JSON.parse(await fs.promises.readFile(metadataPath, 'utf8'));
        
        // Get backup contents
        const dumpPath = path.join(backupPath, 'dump');
        const collections = [];
        
        try {
            const dbDirs = (await fs.promises.readdir(dumpPath, { withFileTypes: true }))
                .filter(dirent => dirent.isDirectory());
            
            for (const dbDir of dbDirs) {
                const dbPath = path.join(dumpPath, dbDir.name);
                const files = await fs.promises.readdir(dbPath);
                
                const collectionFiles = files.filter(file => file.endsWith('.bson'));
                
                for (const file of collectionFiles) {
                    const collectionName = file.replace('.bson', '');
                    const filePath = path.join(dbPath, file);
                    const stats = await fs.promises.stat(filePath);
                    
                    collections.push({
                        name: collectionName,
                        size: stats.size,
                        sizeFormatted: formatSize(stats.size)
                    });
                }
            }
        } catch (error) {
            // Dump directory might not exist or be accessible
            console.error('Error reading backup contents:', error);
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
        const backupDirs = (await fs.promises.readdir(BACKUP_DIR, { withFileTypes: true }))
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        
        const backups = [];
        let totalSize = 0;
        
        for (const backupDir of backupDirs) {
            const metadataPath = path.join(BACKUP_DIR, backupDir, 'metadata.json');
            
            try {
                const metadata = JSON.parse(await fs.promises.readFile(metadataPath, 'utf8'));
                backups.push(metadata);
                totalSize += metadata.size || 0;
            } catch (error) {
                if (error.code !== 'ENOENT') {
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
        
        // Validate cron expression
        if (!schedule || typeof schedule !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Schedule is required and must be a valid cron expression'
            });
        }

        // Validate cron expression format using cron-parser
        let nextRun;
        try {
            const interval = parseExpression(schedule);
            nextRun = interval.next().toISOString();
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: `Invalid cron expression: ${error.message}`
            });
        }
        
        // Security: Validate description
        if (description && (typeof description !== 'string' || description.length > 500)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid description. Must be a string under 500 characters.'
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
            nextRun,
            isValid: true // Mark as validated
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

/**
 * Validate cron expression
 */
export const validateCronExpression = async (req, res) => {
    try {
        const { expression } = req.body;
        
        if (!expression || typeof expression !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Cron expression is required'
            });
        }
        
        try {
            const interval = parseExpression(expression);
            const nextRuns = [];
            
            // Get next 5 execution times
            for (let i = 0; i < 5; i++) {
                nextRuns.push({
                    date: interval.next().toDate(),
                    formatted: interval.prev().toDate().toLocaleString()
                });
            }
            
            res.json({
                success: true,
                message: 'Cron expression is valid',
                data: {
                    expression,
                    isValid: true,
                    nextExecutions: nextRuns,
                    description: getCronDescription(expression)
                }
            });
            
        } catch (error) {
            res.status(400).json({
                success: false,
                message: 'Invalid cron expression',
                error: error.message,
                data: {
                    expression,
                    isValid: false,
                    suggestions: [
                        '0 2 * * * - Daily at 2:00 AM',
                        '0 2 * * 0 - Weekly on Sunday at 2:00 AM',
                        '0 2 1 * * - Monthly on 1st at 2:00 AM',
                        '0 */6 * * * - Every 6 hours'
                    ]
                }
            });
        }
        
    } catch (error) {
        console.error('Error validating cron expression:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate cron expression',
            error: error.message
        });
    }
};

// Helper function to provide human-readable cron descriptions
function getCronDescription(cronExpression) {
    const parts = cronExpression.trim().split(/\s+/);
    if (parts.length !== 5) return 'Custom schedule';
    
    const [minute, hour, day, month, dayOfWeek] = parts;
    
    // Simple descriptions for common patterns
    if (cronExpression === '0 2 * * *') return 'Daily at 2:00 AM';
    if (cronExpression === '0 2 * * 0') return 'Weekly on Sunday at 2:00 AM';
    if (cronExpression === '0 2 1 * *') return 'Monthly on the 1st at 2:00 AM';
    if (cronExpression === '0 */6 * * *') return 'Every 6 hours';
    if (cronExpression === '0 */12 * * *') return 'Every 12 hours';
    if (cronExpression === '*/30 * * * *') return 'Every 30 minutes';
    
    return `Custom: ${minute} ${hour} ${day} ${month} ${dayOfWeek}`;
}
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
    try {
        const interval = parseExpression(cronExpression);
        return interval.next().toISOString();
    } catch (error) {
        throw new Error(`Invalid cron expression: ${error.message}`);
    }
}

// Enhanced cron validation using cron-parser
function isValidCronExpression(cron) {
    if (!cron || typeof cron !== 'string') return false;
    
    // Additional validation to prevent injection
    const safeChars = /^[0-9\*\/\-\,\s]+$/;
    if (!safeChars.test(cron) || cron.length > 50) return false;
    
    // Use cron-parser for actual validation
    try {
        parseExpression(cron);
        return true;
    } catch (error) {
        return false;
    }
}
