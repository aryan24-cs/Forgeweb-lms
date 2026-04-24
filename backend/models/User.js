import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    plainPassword: { type: String, default: '' }, // Stored for admin visibility
    role: { type: String, enum: ['admin', 'manager', 'sales', 'developer', 'client', 'employee', 'intern'], default: 'sales' },
    avatar: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    // Internship/Employment details
    joiningDate: { type: Date, default: Date.now },
    internshipDuration: { type: String, default: '' }, // e.g. "3 months"
    internshipEndDate: { type: Date },
    // Client portal link
    linkedClient: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null },
    // Permissions override (optional fine-grained control)
    permissions: [{ type: String }],
}, { timestamps: true });

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
