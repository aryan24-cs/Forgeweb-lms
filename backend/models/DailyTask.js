import mongoose from 'mongoose';

const dailyTaskSchema = new mongoose.Schema({
    name: { type: String, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('DailyTask', dailyTaskSchema);
