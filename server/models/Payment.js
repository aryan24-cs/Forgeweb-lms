import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },
    paymentMode: { type: String, enum: ['UPI', 'Bank Transfer', 'Cash', 'Cheque', 'Other'], default: 'UPI' },
    transactionId: { type: String, default: '' },
    invoiceNumber: { type: String, default: '' },
    paymentDate: { type: Date },
    dueDate: { type: Date },
    status: { type: String, enum: ['Paid', 'Partial', 'Overdue', 'Pending'], default: 'Pending' },
}, { timestamps: true });

paymentSchema.pre('save', function () {
    this.remainingAmount = this.totalAmount - (this.paidAmount || 0);
    if (this.paidAmount >= this.totalAmount) this.status = 'Paid';
    else if (this.paidAmount > 0) this.status = 'Partial';
    else if (this.dueDate && new Date() > this.dueDate) this.status = 'Overdue';
});

export default mongoose.model('Payment', paymentSchema);
