import dotenv from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env');

// Load environment variables
const result = dotenv.config({ path: envPath });
if (result.error) {
    console.error('Error loading .env file:', result.error);
    process.exit(1);
}

// Print environment variable values for debugging
console.log('Environment variables loaded from:', envPath);
console.log('PUSH_NOTIFICATION_VAPID_PUBLIC:', process.env.PUSH_NOTIFICATION_VAPID_PUBLIC ? '[SET]' : '[NOT SET]');
console.log('PUSH_NOTIFICATION_VAPID_PRIVATE:', process.env.PUSH_NOTIFICATION_VAPID_PRIVATE ? '[SET]' : '[NOT SET]');
