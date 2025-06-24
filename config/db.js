import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            dbName: process.env.DB_NAME // Explicitly set the database name
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error('Database connection failed:', err.message);
        process.exit(1); // Exit process with failure
    }
};

export default connectDB;