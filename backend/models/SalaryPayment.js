import mongoose from 'mongoose';

const salaryPaymentSchema = new mongoose.Schema({
    personName: { type: String, required: true },
    role: { type: String, enum: ['Employee', 'Founder', 'Intern'], required: true },
    month: { type: String, required: true },
    salaryMonth: { type: String, default: '' }, // YYYY-MM format for accrual-basis reporting
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, default: '' },
    notes: { type: String, default: '' },
    date: { type: Date, default: Date.now },
    expenseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense' },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('SalaryPayment', salaryPaymentSchema);
