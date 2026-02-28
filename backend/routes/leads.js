import express from 'express';
import Lead from '../models/Lead.js';
import Client from '../models/Client.js';
import { auth } from '../middleware/auth.js';
import { logActivity } from '../utils/helpers.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
    try {
        const { status, source, search } = req.query;
        let filter = {};
        if (status) filter.status = status;
        if (source) filter.source = source;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }
        const leads = await Lead.find(filter).populate('assignedTo', 'name').sort('-createdAt');
        res.json(leads);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const lead = await Lead.create(req.body);
        await logActivity(req.user._id, 'Created lead', 'Lead', lead._id, lead.name);
        res.status(201).json(lead);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('assignedTo', 'name');
        await logActivity(req.user._id, 'Updated lead', 'Lead', lead._id, lead.name);
        res.json(lead);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        await Lead.findByIdAndDelete(req.params.id);
        await logActivity(req.user._id, 'Deleted lead', 'Lead', req.params.id);
        res.json({ message: 'Lead deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Convert Lead to Client
router.post('/:id/convert', auth, async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (!lead) return res.status(404).json({ message: 'Lead not found' });
        const client = await Client.create({
            name: lead.name,
            businessName: lead.company,
            phone: lead.phone,
            email: lead.email,
            totalDealValue: lead.estimatedBudget,
            leadRef: lead._id,
        });
        lead.status = 'Won';
        lead.convertedToClient = client._id;
        await lead.save();
        await logActivity(req.user._id, 'Converted lead to client', 'Lead', lead._id, `${lead.name} → Client`);
        res.json({ lead, client });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
