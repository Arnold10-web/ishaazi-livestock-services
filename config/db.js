import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        // Log connection attempt (without exposing credentials)
        console.log('🔄 Attempting MongoDB connection...');
        // Extract database name from URI if not explicitly set
        let dbName = process.env.DB_NAME;
        if (!dbName && process.env.MONGO_URI) {
            // Extract database name from MongoDB URI
            const uriMatch = process.env.MONGO_URI.match(/\.net\/([^?]+)/);
            dbName = uriMatch ? uriMatch[1] : 'ishaazi-livestock';
        }
        dbName = dbName || 'ishaazi-livestock';
        
        console.log('Database name:', dbName);
        console.log('Connection string format:', process.env.MONGO_URI ? 'provided' : 'missing');
        
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            dbName: dbName, // Use extracted or default database name
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 30000, // Increased to 30 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            connectTimeoutMS: 30000, // How long to wait for initial connection
            bufferCommands: false, // Disable mongoose buffering
            // Removed bufferMaxEntries - may be incompatible with current mongoose version
            retryWrites: true, // Retry failed writes
            retryReads: true // Retry failed reads
        });
        
        console.log(`✅ MongoDB Connected Successfully!`);
        console.log(`📍 Host: ${conn.connection.host}`);
        console.log(`🗃️ Database: ${conn.connection.name}`);
        console.log(`🔌 Ready State: ${conn.connection.readyState}`);
        
        return true;
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        console.error('Connection error details:', {
            name: err.name,
            code: err.code,
            codeName: err.codeName
        });
        throw err; // Let caller handle the error
    }
};

export default connectDB;