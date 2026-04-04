import express from 'express';
import Salary from '../models/Salary.js';
import SalaryPayment from '../models/SalaryPayment.js';
import Expense from '../models/Expense.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET all configurations
router.get('/config', auth, authorize('admin', 'manager'), async (req, res) => {
    try {
        const salaries = await Salary.find().sort({ createdAt: -1 });
        res.json(salaries);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST new config
router.post('/config', auth, authorize('admin', 'manager'), async (req, res) => {
    try {
        const salary = new Salary(req.body);
        const saved = await salary.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT update config
router.put('/config/:id', auth, authorize('admin', 'manager'), async (req, res) => {
    try {
        const salary = await Salary.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(salary);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// GET all payments
router.get('/payments', auth, authorize('admin', 'manager'), async (req, res) => {
    try {
        const payments = await SalaryPayment.find().populate('addedBy', 'name').sort({ date: -1 });
        res.json(payments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST new payment
router.post('/payments', auth, authorize('admin', 'manager'), async (req, res) => {
    try {
        const payment = new SalaryPayment({
            ...req.body,
            addedBy: req.user._id
        });

        // Auto-create expense
        const expense = new Expense({
            title: `${payment.role} Salary - ${payment.personName} (${payment.month})`,
            amount: payment.amount,
            category: 'Salary',
            description: payment.notes || 'Monthly Salary Payment',
            date: payment.date || new Date(),
            createdBy: req.user._id
        });

        const savedExpense = await expense.save();
        payment.expenseId = savedExpense._id;

        const savedPayment = await payment.save();
        res.status(201).json(savedPayment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE payment
router.delete('/payments/:id', auth, authorize('admin', 'manager'), async (req, res) => {
    try {
        const payment = await SalaryPayment.findById(req.params.id);
        if (!payment) return res.status(404).json({ message: 'Not found' });

        if (payment.expenseId) {
            await Expense.findByIdAndDelete(payment.expenseId);
        }
        await SalaryPayment.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

export default router;
