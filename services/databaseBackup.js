// Automated database backup system
import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

class DatabaseBackupService {
  constructor() {
    this.backupDir = process.env.BACKUP_DIR || './backups';
    this.mongoUri = process.env.MONGO_URI;
    this.dbName = process.env.DB_NAME;
    this.maxBackups = parseInt(process.env.MAX_BACKUPS) || 7; // Keep 7 backups
    this.compressionEnabled = true;
    
    this.ensureBackupDirectory();
  }

  async ensureBackupDirectory() {
    try {
      await fs.access(this.backupDir);
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true });
      console.log(`📁 Created backup directory: ${this.backupDir}`);
    }
  }

  // Create a full database backup
  async createBackup(type = 'scheduled') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `${this.dbName}_${type}_${timestamp}`;
    const backupPath = path.join(this.backupDir, backupName);
    
    console.log(`🔄 Starting ${type} backup: ${backupName}`);
    
    try {
      // Create mongodump command
      const dumpCommand = this.buildDumpCommand(backupPath);
      
      // Execute backup
      const startTime = Date.now();
      await execAsync(dumpCommand);
      const duration = Date.now() - startTime;
      
      // Compress backup if enabled
      let finalPath = backupPath;
      if (this.compressionEnabled) {
        finalPath = await this.compressBackup(backupPath);
      }
      
      // Get backup size
      const stats = await fs.stat(finalPath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      const backupInfo = {
        name: backupName,
        path: finalPath,
        size: `${sizeInMB} MB`,
        duration: `${duration}ms`,
        timestamp: new Date(),
        type,
        compressed: this.compressionEnabled,
        success: true
      };
      
      console.log(`✅ Backup completed: ${backupName} (${sizeInMB} MB in ${duration}ms)`);
      
      // Clean up old backups
      await this.cleanupOldBackups();
      
      // Save backup metadata
      await this.saveBackupMetadata(backupInfo);
      
      return backupInfo;
      
    } catch (error) {
      console.error(`❌ Backup failed: ${error.message}`);
      
      // Clean up failed backup
      try {
        await fs.rm(backupPath, { recursive: true, force: true });
      } catch (cleanupError) {
        console.warn('Failed to cleanup incomplete backup:', cleanupError);
      }
      
      throw error;
    }
  }

  buildDumpCommand(backupPath) {
    const commands = ['mongodump'];
    
    // Add URI
    commands.push(`--uri="${this.mongoUri}"`);
    
    // Add database name
    if (this.dbName) {
      commands.push(`--db=${this.dbName}`);
    }
    
    // Add output directory
    commands.push(`--out=${backupPath}`);
    
    // Add compression
    if (this.compressionEnabled) {
      commands.push('--gzip');
    }
    
    // Add parallel collections (for performance)
    commands.push('--numParallelCollections=4');
    
    return commands.join(' ');
  }

  async compressBackup(backupPath) {
    const compressedPath = `${backupPath}.tar.gz`;
    const tarCommand = `tar -czf ${compressedPath} -C ${path.dirname(backupPath)} ${path.basename(backupPath)}`;
    
    await execAsync(tarCommand);
    
    // Remove uncompressed backup
    await fs.rm(backupPath, { recursive: true });
    
    return compressedPath;
  }

  async cleanupOldBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(file => file.startsWith(this.dbName))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file),
          time: fs.stat(path.join(this.backupDir, file)).then(stats => stats.mtime)
        }));
      
      // Resolve all stat promises
      for (const backup of backupFiles) {
        backup.time = await backup.time;
      }
      
      // Sort by modification time (newest first)
      backupFiles.sort((a, b) => b.time - a.time);
      
      // Remove old backups
      if (backupFiles.length > this.maxBackups) {
        const backupsToDelete = backupFiles.slice(this.maxBackups);
        
        for (const backup of backupsToDelete) {
          await fs.rm(backup.path, { recursive: true, force: true });
          console.log(`🗑️ Removed old backup: ${backup.name}`);
        }
      }
      
    } catch (error) {
      console.warn('Error cleaning up old backups:', error);
    }
  }

  async saveBackupMetadata(backupInfo) {
    const metadataPath = path.join(this.backupDir, 'backup-log.json');
    
    try {
      let metadata = [];
      
      // Read existing metadata
      try {
        const existingData = await fs.readFile(metadataPath, 'utf8');
        metadata = JSON.parse(existingData);
      } catch {
        // File doesn't exist, start with empty array
      }
      
      // Add new backup info
      metadata.push(backupInfo);
      
      // Keep only recent backups in metadata
      metadata = metadata.slice(-this.maxBackups * 2);
      
      // Save updated metadata
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      
    } catch (error) {
      console.warn('Failed to save backup metadata:', error);
    }
  }

  // Restore from backup
  async restoreBackup(backupPath, targetDb = null) {
    console.log(`🔄 Starting restore from: ${backupPath}`);
    
    try {
      const commands = ['mongorestore'];
      
      // Add URI
      commands.push(`--uri="${this.mongoUri}"`);
      
      // Add target database
      if (targetDb) {
        commands.push(`--db=${targetDb}`);
      }
      
      // Drop existing data
      commands.push('--drop');
      
      // Add backup path
      commands.push(backupPath);
      
      const restoreCommand = commands.join(' ');
      
      const startTime = Date.now();
      await execAsync(restoreCommand);
      const duration = Date.now() - startTime;
      
      console.log(`✅ Restore completed in ${duration}ms`);
      
      return {
        success: true,
        duration,
        source: backupPath,
        target: targetDb || this.dbName
      };
      
    } catch (error) {
      console.error(`❌ Restore failed: ${error.message}`);
      throw error;
    }
  }

  // List available backups
  async listBackups() {
    try {
      const metadataPath = path.join(this.backupDir, 'backup-log.json');
      const data = await fs.readFile(metadataPath, 'utf8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  // Schedule automatic backups
  scheduleBackups() {
    const backupInterval = process.env.BACKUP_INTERVAL || '0 2 * * *'; // Daily at 2 AM
    
    console.log(`📅 Scheduling automatic backups: ${backupInterval}`);
    
    // For production, you would use a proper cron library like node-cron
    // This is a simplified version for demonstration
    const intervalMs = 24 * 60 * 60 * 1000; // 24 hours
    
    setInterval(async () => {
      try {
        await this.createBackup('automatic');
      } catch (error) {
        console.error('Scheduled backup failed:', error);
      }
    }, intervalMs);
  }
}

export default DatabaseBackupService;
