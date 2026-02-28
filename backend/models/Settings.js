import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
    agencyName: { type: String, default: 'ForgeWeb' },
    logo: { type: String, default: '' },
    gst: { type: String, default: '' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    website: { type: String, default: 'https://www.forgeweb.in' },
    monthlyExpenses: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Settings', settingsSchema);
