/**
 * @file Reset System Admin Script
 * @description Script to delete existing system admin and create a new one with company email
 * 
 * This script will:
 * 1. Delete any existing system admin
 * 2. Create a new system admin with the company email
 * 
 * @author Ishaazi Livestock Services Development Team
 * @lastUpdated July 31, 2025
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

/**
 * Connect to MongoDB database
 */
async function connectDB() {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ishaazi-livestock';
        
        console.log('🔗 Connecting to MongoDB...');
        console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
        console.log('🎯 Database URI:', mongoURI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs
        
        await mongoose.connect(mongoURI);
        console.log('✅ Connected to MongoDB successfully');
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        process.exit(1);
    }
}

/**
 * Delete existing system admin(s)
 */
async function deleteExistingAdmin() {
    try {
        console.log('🔍 Checking for existing system admin(s)...');
        
        // Find all system admins
        const existingAdmins = await User.find({ role: 'system_admin' });
        
        if (existingAdmins.length === 0) {
            console.log('📝 No existing system admin found.');
            return;
        }
        
        console.log(`🗑️  Found ${existingAdmins.length} existing system admin(s). Deleting...`);
        
        for (const admin of existingAdmins) {
            console.log(`   - Deleting admin: ${admin.companyEmail || admin.email} (${admin.username})`);
            
            // Log the deletion activity
            await ActivityLog.logActivity({
                userId: admin._id,
                username: admin.username,
                userRole: admin.role,
                action: 'system_admin_deleted',
                resource: 'user',
                details: {
                    deletedAdmin: {
                        id: admin._id,
                        username: admin.username,
                        email: admin.companyEmail || admin.email,
                        role: admin.role
                    },
                    reason: 'System admin reset - creating new admin with company email'
                },
                status: 'success',
                severity: 4
            });
        }
        
        // Delete all system admins
        const deleteResult = await User.deleteMany({ role: 'system_admin' });
        console.log(`✅ Deleted ${deleteResult.deletedCount} system admin(s) successfully.`);
        
    } catch (error) {
        console.error('❌ Error deleting existing admin:', error.message);
        throw error;
    }
}

/**
 * Create new system admin with company email
 */
async function createNewSystemAdmin() {
    try {
        console.log('👤 Creating NEW system admin with company email...');
        
        // Use the company email from environment or default
        const companyEmail = process.env.EMAIL_USER || 'admin@ishaazilivestockservices.com';
        
        console.log('📧 Using company email:', companyEmail);
        console.log('🔧 EMAIL_USER env var:', process.env.EMAIL_USER ? '[SET]' : '[NOT SET - using default]');
        console.log('');
        
        const adminData = {
            username: 'sysadmin',
            companyEmail: companyEmail,
            password: 'Admin@2025!',
            role: 'system_admin',
            firstName: 'System',
            lastName: 'Administrator',
            isActive: true,
            hasSetPassword: true,
            permissions: [
                'manage_users',
                'manage_content', 
                'manage_subscribers',
                'manage_newsletters',
                'manage_events',
                'manage_auctions',
                'view_analytics',
                'manage_system_settings',
                'manage_notifications',
                'manage_push_subscriptions',
                'manage_email_tracking',
                'manage_activity_logs',
                'manage_security',
                'manage_backups',
                'manage_files',
                'export_data',
                'system_monitoring',
                'user_impersonation'
            ]
        };

        console.log('📋 Creating NEW system admin with the following details:');
        console.log('🏢 Company Email:', adminData.companyEmail);
        console.log('👤 Username:', adminData.username);
        console.log('🔐 Password:', adminData.password);
        console.log('');

        // Create the system admin user
        const systemAdmin = await User.createSystemAdmin(adminData);

        console.log('✅ NEW System admin created successfully!');
        console.log('');
        console.log('🎯 LOGIN DETAILS:');
        console.log('================');
        console.log('👤 Username:', systemAdmin.username);
        console.log('🏢 Company Email:', systemAdmin.companyEmail);
        console.log('🔐 Password:', adminData.password);
        console.log('🌐 Login URL: https://ishaazilivestockservices.com/login');
        console.log('');
        console.log('⚠️  IMPORTANT SECURITY NOTES:');
        console.log('1. Change the default password immediately after first login');
        console.log('2. Use a strong, unique password for production');
        console.log('3. Enable two-factor authentication if available');
        console.log('4. Never share these credentials');
        console.log('');
        console.log('📋 NEXT STEPS:');
        console.log('1. Login to the system admin dashboard');
        console.log('2. Change the default password');
        console.log('3. Configure email settings if needed');
        console.log('4. Create editor accounts for your team');
        console.log('5. Configure system settings');
        
        // Log the creation activity
        await ActivityLog.logActivity({
            userId: systemAdmin._id,
            username: systemAdmin.username,
            userRole: systemAdmin.role,
            action: 'system_admin_created',
            resource: 'user',
            details: {
                newAdmin: {
                    id: systemAdmin._id,
                    username: systemAdmin.username,
                    email: systemAdmin.companyEmail,
                    role: systemAdmin.role
                },
                reason: 'System admin reset - new admin created with company email'
            },
            status: 'success',
            severity: 3
        });

    } catch (error) {
        console.error('❌ Error creating system admin:', error.message);
        
        if (error.code === 11000) {
            console.log('\n💡 This usually means a user with this email or username already exists.');
            console.log('   Check the database for existing admin users.');
        }
        throw error;
    }
}

/**
 * Check final result
 */
async function verifyNewAdmin() {
    try {
        console.log('🔍 Verifying new system admin...');
        
        const newAdmin = await User.findOne({ role: 'system_admin' });
        
        if (newAdmin) {
            console.log('✅ System admin verification successful:');
            console.log(`   - ID: ${newAdmin._id}`);
            console.log(`   - Username: ${newAdmin.username}`);
            console.log(`   - Company Email: ${newAdmin.companyEmail}`);
            console.log(`   - Role: ${newAdmin.role}`);
            console.log(`   - Active: ${newAdmin.isActive}`);
            console.log(`   - Created: ${newAdmin.createdAt}`);
        } else {
            console.log('❌ No system admin found after creation!');
        }
    } catch (error) {
        console.error('❌ Error verifying new admin:', error.message);
    }
}

/**
 * Main execution function
 */
async function main() {
    try {
        console.log('🔄 RESETTING SYSTEM ADMIN');
        console.log('=========================');
        console.log('');
        
        await connectDB();
        await deleteExistingAdmin();
        await createNewSystemAdmin();
        await verifyNewAdmin();
        
        console.log('');
        console.log('🎉 System admin reset completed successfully!');
        
    } catch (error) {
        console.error('❌ Script execution failed:', error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Database connection closed');
        process.exit(0);
    }
}

// Run the script
main();
