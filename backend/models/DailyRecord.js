import mongoose from 'mongoose';

const dailyRecordSchema = new mongoose.Schema({
    date: { type: String, required: true, unique: true }, // Format: YYYY-MM-DD
    tasks: [{
        taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'DailyTask' },
        name: { type: String, required: true },
        completed: { type: Boolean, default: false },
    }],
}, { timestamps: true });

export default mongoose.model('DailyRecord', dailyRecordSchema);
