import express from 'express';
import Expense from '../models/Expense.js';
import { auth, authorize } from '../middleware/auth.js';
import { logActivity } from '../utils/helpers.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
    try {
        const { category, month, year } = req.query;
        let filter = {};
        if (category) filter.category = category;
        if (month && year) {
            const salaryMonthKey = `${year}-${String(month).padStart(2, '0')}`;
            const start = new Date(year, month - 1, 1);
            const end = new Date(year, month, 0, 23, 59, 59);
            // For salary-type expenses, match by salaryMonth field; for others, match by date
            filter = {
                ...filter,
                $or: [
                    { category: 'Salary', salaryMonth: salaryMonthKey },
                    { category: { $ne: 'Salary' }, date: { $gte: start, $lte: end } },
                    { category: 'Salary', salaryMonth: { $in: ['', null] }, date: { $gte: start, $lte: end } }
                ]
            };
        }
        const expenses = await Expense.find(filter).populate('createdBy', 'name').sort('-date');
        res.json(expenses);
    } catch (err) {
        if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
        res.status(500).json({ message: err.message });
    }
});

router.post('/', auth, authorize('admin', 'manager'), async (req, res) => {
    try {
        const expense = await Expense.create({ ...req.body, createdBy: req.user._id });
        await logActivity(req.user._id, 'Added expense', 'Expense', expense._id, `₹${expense.amount}`);
        res.status(201).json(expense);
    } catch (err) {
        if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
        res.status(500).json({ message: err.message });
    }
});

router.put('/:id', auth, authorize('admin', 'manager'), async (req, res) => {
    try {
        const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(expense);
    } catch (err) {
        if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
        res.status(500).json({ message: err.message });
    }
});

router.delete('/:id', auth, authorize('admin', 'manager'), async (req, res) => {
    try {
        await Expense.findByIdAndDelete(req.params.id);
        res.json({ message: 'Expense deleted' });
    } catch (err) {
        if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
        res.status(500).json({ message: err.message });
    }
});

export default router;
