import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    businessName: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    gst: { type: String, default: '' },

    // Services
    domainInfo: { type: String, default: '' },
    hostingInfo: { type: String, default: '' },
    projectType: { type: String, enum: ['Website', 'AI Tool', 'Branding', 'Marketing', 'Other', 'Not Assigned'], default: 'Not Assigned' },
    plan: { type: String, enum: ['Basic', 'Standard', 'Premium', 'Custom', 'None'], default: 'None' },

    // Status & Financials
    totalDealValue: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ['Pending', 'Partial', 'Paid'], default: 'Pending' },
    projectStatus: { type: String, enum: ['Not Started', 'In Progress', 'Testing', 'Client Review', 'Completed', 'On Hold'], default: 'Not Started' },
    contractStatus: { type: String, enum: ['Pending', 'Active', 'Completed', 'Cancelled'], default: 'Pending' },

    // Relationships
    leadRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', default: null },
    assignedDevelopers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    notes: { type: String, default: '' },

    // Timeline Tracker
    timeline: {
        proposalSent: { type: Date },
        agreementSigned: { type: Date },
        projectStart: { type: Date },
        expectedDelivery: { type: Date },
        milestones: [{ title: String, date: Date, status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' } }],
        revisions: [{ note: String, date: { type: Date, default: Date.now }, author: String }]
    },

    // Document Vault Vault reference (Files are stored separately or as URLs)
    documents: [{
        title: String,
        type: { type: String, enum: ['NDA', 'Contract', 'Asset', 'Credential', 'Other'] },
        url: String,
        uploadedAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

export default mongoose.model('Client', clientSchema);
