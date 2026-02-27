import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    createdAt: { type: Date, default: Date.now }
});

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['To Do', 'In Progress', 'Testing', 'Client Review', 'Completed'], default: 'To Do' },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
    dueDate: { type: Date },
    estimatedHours: { type: Number, default: 0 },
    loggedHours: { type: Number, default: 0 },
    // Relations
    relatedLead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    relatedClient: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    relatedProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    // Dependencies
    dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
    // Task board position
    order: { type: Number, default: 0 },
    // Attachments & comments
    attachments: [{ name: String, url: String, uploadedAt: { type: Date, default: Date.now } }],
    comments: [commentSchema],
}, { timestamps: true });

export default mongoose.model('Task', taskSchema);
