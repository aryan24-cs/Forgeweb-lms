import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import dns from 'dns';
import fs from 'fs';
dns.setServers(['8.8.8.8', '1.1.1.1']);

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/forgeweb-lms';

async function verify() {
    await mongoose.connect(uri, { bufferCommands: false, serverSelectionTimeoutMS: 10000 });
    const db = mongoose.connection.db;

    const payments = await db.collection('salarypayments').find({}).toArray();
    const salaryExpenses = await db.collection('expenses').find({ category: 'Salary' }).toArray();
    
    const aprilStart = new Date(2026, 3, 1);
    const aprilEnd = new Date(2026, 4, 0, 23, 59, 59);
    const aprilExps = await db.collection('expenses').find({ date: { $gte: aprilStart, $lte: aprilEnd } }).toArray();

    const result = {
        salaryPayments: payments.map(p => ({
            person: p.personName,
            paidDate: new Date(p.date).toISOString().slice(0,10),
            salaryMonth: p.salaryMonth || 'MISSING',
            monthLabel: p.month,
            amount: p.amount
        })),
        salaryExpenses: salaryExpenses.map(e => ({
            title: e.title,
            date: new Date(e.date).toISOString().slice(0,10),
            salaryMonth: e.salaryMonth || 'MISSING',
            amount: e.amount
        })),
        aprilExpensesByDate: aprilExps.map(e => ({
            title: e.title,
            date: new Date(e.date).toISOString().slice(0,10),
            category: e.category,
            salaryMonth: e.salaryMonth || 'N/A',
            amount: e.amount
        })),
        aprilTotal: aprilExps.reduce((s, e) => s + (e.amount || 0), 0)
    };

    fs.writeFileSync('verify-result.json', JSON.stringify(result, null, 2));
    await mongoose.disconnect();
}

verify().catch(err => { console.error(err); process.exit(1); });
