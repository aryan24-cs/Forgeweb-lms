import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/forgeweb-lms';

async function read() {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;

    const expenses = await db.collection('expenses').find({}).toArray();
    console.log('--- DB EXPENSES ---');
    expenses.forEach(e => {
        console.log(`[${e.category}] "${e.title}" | ₹${e.amount} | Date: ${new Date(e.date).toISOString().slice(0,10)} | salaryMonth: ${e.salaryMonth || '---'}`);
    });

    await mongoose.disconnect();
}

read().catch(console.error);
