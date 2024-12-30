import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true, // Handles connection deprecations
        });
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('Database connection failed:', err.message);
        process.exit(1); // Exit process with failure
    }
};

export default connectDB;
