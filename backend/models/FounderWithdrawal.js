import mongoose from 'mongoose';

const founderWithdrawalSchema = new mongoose.Schema({
    founderName: { type: String, required: true, enum: ['Sunil', 'Aryan'] },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    note: { type: String, default: '' },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('FounderWithdrawal', founderWithdrawalSchema);
