import mongoose from 'mongoose';

const salarySchema = new mongoose.Schema({
    personName: { type: String, required: true },
    role: { type: String, enum: ['Employee', 'Founder'], required: true },
    designation: { type: String, default: '' },
    monthlySalary: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true });

export default mongoose.model('Salary', salarySchema);
