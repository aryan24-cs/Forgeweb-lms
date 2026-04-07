import mongoose from 'mongoose';

const salaryPaymentSchema = new mongoose.Schema({
    personName: { type: String, required: true },
    role: { type: String, enum: ['Employee', 'Founder'], required: true },
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

// Prevent duplicate salary payment for the same person in the same salary month
salaryPaymentSchema.index({ personName: 1, salaryMonth: 1 }, { unique: true, partialFilterExpression: { salaryMonth: { $ne: '' } } });

export default mongoose.model('SalaryPayment', salaryPaymentSchema);
