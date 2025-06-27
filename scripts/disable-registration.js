#!/usr/bin/env node

/**
 * @file Disable Registration Script
 * @description Utility script to disable user registration
 * @usage node scripts/disable-registration.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function disableRegistration() {
    try {
        const envPath = path.join(__dirname, '../.env');
        
        // Check if .env file exists
        if (!fs.existsSync(envPath)) {
            console.log('❌ .env file not found. Creating one...');
            fs.writeFileSync(envPath, '# Environment Variables\n');
        }
        
        // Read current .env file
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        // Check if DISABLE_REGISTRATION already exists
        if (envContent.includes('DISABLE_REGISTRATION=')) {
            // Update existing value
            envContent = envContent.replace(/DISABLE_REGISTRATION=.*/g, 'DISABLE_REGISTRATION=true');
            console.log('✅ Updated DISABLE_REGISTRATION to true in .env file');
        } else {
            // Add new environment variable
            envContent += '\n# Disable user registration endpoint\nDISABLE_REGISTRATION=true\n';
            console.log('✅ Added DISABLE_REGISTRATION=true to .env file');
        }
        
        // Write back to .env file
        fs.writeFileSync(envPath, envContent);
        
        console.log('\n📋 Registration Status:');
        console.log('   - Registration endpoint is now DISABLED');
        console.log('   - Only existing users can log in');
        console.log('   - No new registrations will be accepted');
        console.log('\n🔄 Please restart your server for changes to take effect:');
        console.log('   npm restart  or  node server.js');
        
    } catch (error) {
        console.error('❌ Error disabling registration:', error.message);
        process.exit(1);
    }
}

async function enableRegistration() {
    try {
        const envPath = path.join(__dirname, '../.env');
        
        if (!fs.existsSync(envPath)) {
            console.log('❌ .env file not found. Registration is enabled by default.');
            return;
        }
        
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        if (envContent.includes('DISABLE_REGISTRATION=')) {
            envContent = envContent.replace(/DISABLE_REGISTRATION=.*/g, 'DISABLE_REGISTRATION=false');
            fs.writeFileSync(envPath, envContent);
            console.log('✅ Registration has been enabled');
        } else {
            console.log('✅ Registration is already enabled (no DISABLE_REGISTRATION found)');
        }
        
        console.log('\n🔄 Please restart your server for changes to take effect');
        
    } catch (error) {
        console.error('❌ Error enabling registration:', error.message);
        process.exit(1);
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
const action = args[0];

if (action === 'enable') {
    enableRegistration();
} else if (action === 'disable' || action === undefined) {
    disableRegistration();
} else {
    console.log('Usage:');
    console.log('  node scripts/disable-registration.js          # Disable registration');
    console.log('  node scripts/disable-registration.js disable  # Disable registration');
    console.log('  node scripts/disable-registration.js enable   # Enable registration');
}
