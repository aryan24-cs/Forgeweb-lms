import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    dueDate: Date,
    completedDate: Date,
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
    files: [{ name: String, url: String, uploadedAt: { type: Date, default: Date.now } }],
});

const projectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    serviceType: { type: String, default: '' },
    totalValue: { type: Number, default: 0 },
    startDate: { type: Date },
    deadline: { type: Date },
    status: { type: String, enum: ['Planning', 'In Progress', 'Testing', 'Client Review', 'Completed', 'On Hold'], default: 'Planning' },
    teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    progress: { type: Number, default: 0, min: 0, max: 100 },
    deliverables: { type: String, default: '' },
    milestones: [milestoneSchema],
    // Kanban board columns for tasks
    columns: {
        type: [String],
        default: ['To Do', 'In Progress', 'Testing', 'Client Review', 'Completed']
    },
}, { timestamps: true });

export default mongoose.model('Project', projectSchema);
