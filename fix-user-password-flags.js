#!/usr/bin/env node

/**
 * Fix user password flags for users who completed password setup
 * but still have isTemporaryPassword = true
 */

import mongoose from 'mongoose';
import User from './models/User.js';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

async function fixUserPasswordFlags() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

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
        console.log(`Found ${allUsersToFix.length} users to fix:`);
        console.log(`- Case 1 (hasSetPassword=true, isTemporaryPassword=true): ${usersCase1.length} users`);
        console.log(`- Case 2 (hasSetPassword=false but have real password): ${usersCase2.length} users`);

        // Fix Case 1 users
        for (const user of usersCase1) {
            console.log(`- Fixing Case 1 user: ${user.companyEmail || user.username} (${user.role})`);
            
            await User.findByIdAndUpdate(user._id, {
                isTemporaryPassword: false
            });
            
            console.log(`  ✓ Cleared isTemporaryPassword flag for ${user.companyEmail || user.username}`);
        }

        // Fix Case 2 users
        for (const user of usersCase2) {
            console.log(`- Fixing Case 2 user: ${user.companyEmail || user.username} (${user.role})`);
            
            await User.findByIdAndUpdate(user._id, {
                hasSetPassword: true,
                isTemporaryPassword: false
            });
            
            console.log(`  ✓ Set hasSetPassword=true for ${user.companyEmail || user.username}`);
        }

        console.log('\n✅ All users have been fixed!');
        console.log('Users should now be able to access content management sections.');

    } catch (error) {
        console.error('❌ Error fixing user password flags:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the fix
fixUserPasswordFlags();
