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

        // Find users who have set their password but still have isTemporaryPassword = true
        const usersToFix = await User.find({
            hasSetPassword: true,
            isTemporaryPassword: true
        });

        console.log(`Found ${usersToFix.length} users to fix:`);

        for (const user of usersToFix) {
            console.log(`- Fixing user: ${user.companyEmail || user.username} (${user.role})`);
            
            // Update the user to clear the temporary password flag
            await User.findByIdAndUpdate(user._id, {
                isTemporaryPassword: false
            });
            
            console.log(`  ✓ Updated user ${user.companyEmail || user.username}`);
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
