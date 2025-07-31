/**
 * @file Create System Admin Script
 * @description Script to create the first system admin user for the Ishaazi Livestock Services platform
 * Run this script to set up your initial system admin account
 * 
 * PRODUCTION USAGE (Railway):
 * ==========================
 * 1. Deploy your code to Railway first
 * 2. In Railway dashboard: Project → Settings → Variables (ensure MONGODB_URI is set)
 * 3. In Railway dashboard: Project → Deployments → Click on latest deployment
 * 4. In Railway dashboard: Click "View Logs" or "Open Terminal" 
 * 5. Run: node scripts/createSystemAdmin.js
 * 
 * LOCAL USAGE:
 * ============
 * node scripts/createSystemAdmin.js
 * 
 * @author Ishaazi Livestock Services Development Team
 * @lastUpdated July 30, 2025
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import User from '../models/User.js';

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
 * Create the first system admin user
 */
async function createSystemAdmin() {
    try {
        console.log('🚀 Starting system admin creation...\n');

        // Delete any existing system admin
        const existingAdmin = await User.findOne({ role: 'system_admin' });
        if (existingAdmin) {
            console.log('🗑️  Found existing system admin, deleting...');
            console.log('📧 Old Email:', existingAdmin.email);
            console.log('👤 Old Username:', existingAdmin.username);
            await User.deleteOne({ _id: existingAdmin._id });
            console.log('✅ Existing system admin deleted');
            console.log('');
        }

        // System admin credentials
        const adminData = {
            username: 'sysadmin',
            companyEmail: 'admin@ishaazilivestockservices.com', // Primary company email
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

        console.log('👤 Creating NEW system admin with the following details:');
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
        console.log('3. Create editor accounts for your team');
        console.log('4. Configure system settings');
        console.log('5. DISABLE auto-creation by setting AUTO_CREATE_ADMIN=false in environment variables');
        console.log('   (This prevents recreating admin on every server restart)');

    } catch (error) {
        console.error('❌ Error creating system admin:', error.message);
        
        if (error.code === 11000) {
            console.log('\n💡 This usually means a user with this email or username already exists.');
            console.log('   Check the database for existing admin users.');
        }
    }
}

/**
 * Check existing users in the database
 */
async function checkExistingUsers() {
    try {
        const allUsers = await User.find({}).select('username email role createdAt').sort({ createdAt: -1 });
        
        if (allUsers.length === 0) {
            console.log('📊 No users found in database. This will be the first user.');
            return;
        }

        console.log('📊 EXISTING USERS IN DATABASE:');
        console.log('===============================');
        allUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.role.toUpperCase()}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Username: ${user.username || 'N/A'}`);
            console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
            console.log('');
        });
    } catch (error) {
        console.error('❌ Error checking existing users:', error.message);
    }
}

/**
 * Main execution function
 */
async function main() {
    try {
        await connectDB();
        await checkExistingUsers();
        await createSystemAdmin();
    } catch (error) {
        console.error('❌ Script execution failed:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Database connection closed');
        process.exit(0);
    }
}

// Run the script
main();
