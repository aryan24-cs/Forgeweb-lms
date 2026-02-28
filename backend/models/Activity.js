import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    entityType: { type: String, enum: ['Lead', 'Client', 'Project', 'Payment', 'Task', 'User'] },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    details: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('Activity', activitySchema);
