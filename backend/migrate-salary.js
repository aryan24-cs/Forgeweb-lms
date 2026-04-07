import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import dns from 'dns';

// Fix DNS
dns.setServers(['8.8.8.8', '1.1.1.1']);

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/forgeweb-lms';

async function run() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri, { bufferCommands: false, serverSelectionTimeoutMS: 10000 });
    console.log('Connected!\n');

    const db = mongoose.connection.db;

    // 1. Fix all SalaryPayment records that don't have salaryMonth
    const salaryPayments = await db.collection('salarypayments').find({
        $or: [
            { salaryMonth: { $exists: false } },
            { salaryMonth: '' },
            { salaryMonth: null }
        ]
    }).toArray();

    console.log(`Found ${salaryPayments.length} salary payment(s) to fix.\n`);

    let fixed = 0;
    for (const payment of salaryPayments) {
        const payDate = new Date(payment.date);
        const day = payDate.getDate();

        let targetYear, targetMonth;
        if (day <= 7) {
            // Paid in first 7 days → belongs to previous month
            const prev = new Date(payDate.getFullYear(), payDate.getMonth() - 1, 1);
            targetYear = prev.getFullYear();
            targetMonth = prev.getMonth(); // 0-indexed
        } else {
            targetYear = payDate.getFullYear();
            targetMonth = payDate.getMonth();
        }

        const salaryMonth = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;
        const salaryMonthDate = new Date(targetYear, targetMonth, 1); // 1st of target month

        console.log(`  Payment: ${payment.personName} | Paid: ${payDate.toISOString().slice(0, 10)} (day ${day}) → salaryMonth: ${salaryMonth}`);

        // Update SalaryPayment
        await db.collection('salarypayments').updateOne(
            { _id: payment._id },
            { $set: { salaryMonth: salaryMonth } }
        );

        // Update linked Expense — set salaryMonth AND move the date to 1st of correct month
        if (payment.expenseId) {
            await db.collection('expenses').updateOne(
                { _id: payment.expenseId },
                { $set: { salaryMonth: salaryMonth, date: salaryMonthDate } }
            );
            console.log(`    → Also fixed linked expense (ID: ${payment.expenseId}), date moved to ${salaryMonthDate.toISOString().slice(0, 10)}`);
        }

        fixed++;
    }

    // 2. Also fix any salary-category expenses that might not be linked but are missing salaryMonth  
    const orphanExpenses = await db.collection('expenses').find({
        category: 'Salary',
        $or: [
            { salaryMonth: { $exists: false } },
            { salaryMonth: '' },
            { salaryMonth: null }
        ]
    }).toArray();

    console.log(`\nFound ${orphanExpenses.length} orphan salary expense(s) to fix.`);

    for (const exp of orphanExpenses) {
        const expDate = new Date(exp.date);
        const day = expDate.getDate();

        let targetYear, targetMonth;
        if (day <= 7) {
            const prev = new Date(expDate.getFullYear(), expDate.getMonth() - 1, 1);
            targetYear = prev.getFullYear();
            targetMonth = prev.getMonth();
        } else {
            targetYear = expDate.getFullYear();
            targetMonth = expDate.getMonth();
        }

        const salaryMonth = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;
        const salaryMonthDate = new Date(targetYear, targetMonth, 1);

        console.log(`  Expense: "${exp.title}" | Date: ${expDate.toISOString().slice(0, 10)} (day ${day}) → salaryMonth: ${salaryMonth}`);

        await db.collection('expenses').updateOne(
            { _id: exp._id },
            { $set: { salaryMonth: salaryMonth, date: salaryMonthDate } }
        );
        console.log(`    → Date moved to ${salaryMonthDate.toISOString().slice(0, 10)}`);
    }

    console.log(`\n✅ Migration complete! Fixed ${fixed} salary payment(s) + ${orphanExpenses.length} orphan expense(s).`);

    await mongoose.disconnect();
    process.exit(0);
}

run().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
