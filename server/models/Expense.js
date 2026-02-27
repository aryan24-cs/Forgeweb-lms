import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    category: {
        type: String,
        enum: ['Developer Payout', 'Hosting', 'Marketing', 'Software', 'Office', 'Travel', 'Other'],
        default: 'Other'
    },
    description: { type: String, default: '' },
    date: { type: Date, default: Date.now },
    recurring: { type: Boolean, default: false },
    recurringInterval: { type: String, enum: ['Monthly', 'Quarterly', 'Yearly', 'None'], default: 'None' },
    vendor: { type: String, default: '' },
    receipt: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('Expense', expenseSchema);
