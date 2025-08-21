import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            dbName: process.env.DB_NAME, // Explicitly set the database name
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            bufferCommands: false, // Disable mongoose buffering
            bufferMaxEntries: 0 // Disable mongoose buffering
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return true;
    } catch (err) {
        console.error('Database connection failed:', err.message);
        throw err; // Let caller handle the error
    }
};

export default connectDB;