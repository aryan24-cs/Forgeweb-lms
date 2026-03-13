import mongoose from 'mongoose';
import dns from 'dns';

// Fix for Node.js DNS SRV EREFUSED errors on Windows / certain ISPs
dns.setServers(['8.8.8.8', '1.1.1.1']);

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            serverSelectionTimeoutMS: 10000,
        };
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/forgeweb-lms';
        cached.promise = mongoose.connect(uri, opts).then((mongoose) => {
            console.log(`MongoDB Connected: ${mongoose.connection.host}`);
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
        return cached.conn;
    } catch (error) {
        cached.promise = null;
        console.error(`MongoDB Error: ${error.message}`);
        throw error;
    }
};

export default connectDB;
