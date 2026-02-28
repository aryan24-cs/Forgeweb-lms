import express from 'express';
import Payment from '../models/Payment.js';
import { auth } from '../middleware/auth.js';
import { logActivity } from '../utils/helpers.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
    try {
        const { month, year, status } = req.query;
        let filter = {};
        if (status) filter.status = status;
        if (month && year) {
            const start = new Date(year, month - 1, 1);
            const end = new Date(year, month, 0, 23, 59, 59);
            filter.createdAt = { $gte: start, $lte: end };
        }
        const payments = await Payment.find(filter).populate('client', 'name businessName').populate('project', 'name').sort('-createdAt');
        res.json(payments);
    } catch (err) {
        if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
        res.status(500).json({ message: err.message });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const payment = await Payment.create(req.body);
        await logActivity(req.user._id, 'Recorded payment', 'Payment', payment._id, `₹${payment.paidAmount}`);
        res.status(201).json(payment);
    } catch (err) {
        console.error('Payment Error:', err);
        if (err.name === 'ValidationError' || err.name === 'CastError') return res.status(400).json({ message: err.message });
        res.status(500).json({ message: err.message });
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        Object.assign(payment, req.body);
        await payment.save();
        await logActivity(req.user._id, 'Updated payment', 'Payment', payment._id);
        res.json(payment);
    } catch (err) {
        console.error('Payment Error:', err);
        if (err.name === 'ValidationError' || err.name === 'CastError') return res.status(400).json({ message: err.message });
        res.status(500).json({ message: err.message });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        await Payment.findByIdAndDelete(req.params.id);
        await logActivity(req.user._id, 'Deleted payment', 'Payment', req.params.id);
        res.json({ message: 'Payment deleted' });
    } catch (err) {
        if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
        res.status(500).json({ message: err.message });
    }
});

export default router;
