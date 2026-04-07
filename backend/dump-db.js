import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/forgeweb-lms';

async function dump() {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;

    const expenses = await db.collection('expenses').find({}).sort({date: -1}).toArray();
    console.log('--- ALL EXPENSES ---');
    expenses.forEach(e => {
        console.log(`[${e.category}] "${e.title}" - ₹${e.amount} - Date: ${new Date(e.date).toISOString().slice(0,10)} - SalaryMonth: ${e.salaryMonth || 'NONE'}`);
    });

    const payments = await db.collection('salarypayments').find({}).sort({date: -1}).toArray();
    console.log('\n--- ALL SALARY PAYMENTS ---');
    payments.forEach(p => {
        console.log(`${p.personName} - ₹${p.amount} - Paid: ${new Date(p.date).toISOString().slice(0,10)} - SalaryMonth: ${p.salaryMonth || 'NONE'}`);
    });

    await mongoose.disconnect();
}

dump().catch(console.error);
