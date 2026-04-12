import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    color: { type: String, default: '#ffffff' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPublic: { type: Boolean, default: false },
    pinned: { type: Boolean, default: false },
    tags: [{ type: String }],
}, { timestamps: true });

export default mongoose.model('Note', noteSchema);
