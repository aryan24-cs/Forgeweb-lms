import express from 'express';
import Payment from '../models/Payment.js';
import { auth, authorize } from '../middleware/auth.js';
import { logActivity } from '../utils/helpers.js';

const router = express.Router();

router.get('/', auth, authorize('admin', 'manager'), async (req, res) => {
    try {
        const { month, year, status } = req.query;
        let filter = {};
        if (status) filter.status = status;
        if (month && year) {
            const start = new Date(year, month - 1, 1);
            const end = new Date(year, month, 0, 23, 59, 59);
            filter.createdAt = { $gte: start, $lte: end };
        }
        const payments = await Payment.find(filter).populate('client', 'name businessName totalDealValue').populate('project', 'name').sort('-createdAt');

        const clientTotals = {};
        payments.forEach(p => {
            if (p.client && !clientTotals[p.client._id]) {
                const cPayments = payments.filter(cp => cp.client && cp.client._id.toString() === p.client._id.toString());
                const totalPaid = cPayments.reduce((s, cp) => s + (cp.paidAmount || 0), 0);
                const oldTotal = cPayments.length > 0 ? Math.max(...cPayments.map(cp => cp.totalAmount || 0)) : 0;
                const dealAmount = Math.max(p.client.totalDealValue || 0, oldTotal);
                clientTotals[p.client._id] = { dealAmount, totalPaid };
            }
        });

        const formattedPayments = payments.map(p => {
            const pObj = p.toObject ? p.toObject() : p;
            if (p.client && clientTotals[p.client._id]) {
                pObj.totalAmount = clientTotals[p.client._id].dealAmount;
                pObj.remainingAmount = Math.max(0, clientTotals[p.client._id].dealAmount - clientTotals[p.client._id].totalPaid);
                if (clientTotals[p.client._id].dealAmount > 0) {
                    if (pObj.remainingAmount === 0) pObj.status = 'Paid';
                    else if (pObj.remainingAmount > 0 && clientTotals[p.client._id].totalPaid > 0) pObj.status = 'Partial';
                    else pObj.status = 'Pending';
                }
            }
            return pObj;
        });

        res.json(formattedPayments);
    } catch (err) {
        if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
        res.status(500).json({ message: err.message });
    }
});

router.post('/', auth, authorize('admin', 'manager'), async (req, res) => {
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

router.put('/:id', auth, authorize('admin', 'manager'), async (req, res) => {
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

router.delete('/:id', auth, authorize('admin', 'manager'), async (req, res) => {
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
