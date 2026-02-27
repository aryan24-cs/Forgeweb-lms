import express from 'express';
import Client from '../models/Client.js';
import Payment from '../models/Payment.js';
import Project from '../models/Project.js';
import { auth } from '../middleware/auth.js';
import { logActivity } from '../utils/helpers.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
    try {
        const { search } = req.query;
        let filter = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { businessName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }
        const clients = await Client.find(filter)
            .populate('assignedDevelopers', 'name email role')
            .sort('-createdAt');
        res.json(clients);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/:id', auth, async (req, res) => {
    try {
        const client = await Client.findById(req.params.id)
            .populate('leadRef')
            .populate('assignedDevelopers', 'name email role');
        const payments = await Payment.find({ client: req.params.id }).sort('-createdAt');
        const projects = await Project.find({ client: req.params.id }).sort('-createdAt');
        res.json({ client, payments, projects });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const client = await Client.create(req.body);
        await logActivity(req.user._id, 'Created client', 'Client', client._id, client.name);
        res.status(201).json(client);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
        await logActivity(req.user._id, 'Updated client', 'Client', client._id, client.name);
        res.json(client);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        await Client.findByIdAndDelete(req.params.id);
        await logActivity(req.user._id, 'Deleted client', 'Client', req.params.id);
        res.json({ message: 'Client deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
