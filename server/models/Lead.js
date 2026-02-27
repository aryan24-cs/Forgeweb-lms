import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
    name: { type: String, required: true },
    company: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    source: {
        type: String,
        enum: ['Instagram', 'Website', 'Referral', 'Cold DM', 'LinkedIn', 'Google Ads', 'Facebook', 'Other'],
        default: 'Website'
    },
    serviceInterested: {
        type: String,
        enum: ['Website', 'SEO', 'Marketing', 'Automation', 'Graphic Design', 'Social Media', 'Other'],
        default: 'Website'
    },
    estimatedBudget: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'],
        default: 'New'
    },
    notes: { type: String, default: '' },
    followUpDate: { type: Date },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    convertedToClient: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null },
}, { timestamps: true });

export default mongoose.model('Lead', leadSchema);
