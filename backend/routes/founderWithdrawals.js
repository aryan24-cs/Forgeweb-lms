import express from 'express';
import FounderWithdrawal from '../models/FounderWithdrawal.js';
import { auth, authorize } from '../middleware/auth.js';
import { logActivity } from '../utils/helpers.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
    try {
        const withdrawals = await FounderWithdrawal.find().populate('addedBy', 'name').sort('-date');
        res.json(withdrawals);
    } catch (err) {
        if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
        res.status(500).json({ message: err.message });
    }
});

router.post('/', auth, authorize('admin'), async (req, res) => {
    try {
        const withdrawal = await FounderWithdrawal.create({ ...req.body, addedBy: req.user._id });
        await logActivity(req.user._id, 'Added founder withdrawal', 'FounderWithdrawal', withdrawal._id, `₹${withdrawal.amount} for ${withdrawal.founderName}`);
        res.status(201).json(withdrawal);
    } catch (err) {
        if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
        res.status(500).json({ message: err.message });
    }
});

router.put('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const withdrawal = await FounderWithdrawal.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(withdrawal);
    } catch (err) {
        if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
        res.status(500).json({ message: err.message });
    }
});

router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        await FounderWithdrawal.findByIdAndDelete(req.params.id);
        res.json({ message: 'Withdrawal deleted' });
    } catch (err) {
        if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
        res.status(500).json({ message: err.message });
    }
});

export default router;
