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

// POST new payment (with salaryMonth accrual-basis support)
router.post('/payments', auth, authorize('admin', 'manager'), async (req, res) => {
    try {
        const { salaryMonth, personName } = req.body;

        // Validate salaryMonth format (YYYY-MM)
        if (!salaryMonth || !/^\d{4}-\d{2}$/.test(salaryMonth)) {
            return res.status(400).json({ message: 'salaryMonth is required in YYYY-MM format' });
        }

        // Duplicate check: prevent paying same person for same salary month
        const existing = await SalaryPayment.findOne({ personName, salaryMonth });
        if (existing) {
            return res.status(409).json({ message: `Salary for ${personName} for ${salaryMonth} already exists` });
        }

        const payment = new SalaryPayment({
            ...req.body,
            addedBy: req.user._id
        });

        // Auto-create expense with salaryMonth and date set to 1st of salary month
        const [smYear, smMonth] = salaryMonth.split('-').map(Number);
        const salaryMonthDate = new Date(smYear, smMonth - 1, 1); // 1st day of salary month

        const expense = new Expense({
            title: `${payment.role} Salary - ${payment.personName} (${payment.month})`,
            amount: payment.amount,
            category: 'Salary',
            description: payment.notes || 'Monthly Salary Payment',
            date: salaryMonthDate, // Set to 1st of salary month for correct bucketing
            salaryMonth: salaryMonth,
            createdBy: req.user._id
        });

        const savedExpense = await expense.save();
        payment.expenseId = savedExpense._id;

        const savedPayment = await payment.save();
        res.status(201).json(savedPayment);
    } catch (err) {
        // Handle mongoose unique index violation
        if (err.code === 11000) {
            return res.status(409).json({ message: 'Duplicate salary payment for this person and month' });
        }
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

// ═══════════════════════════════════════════════
// MIGRATION: Backfill salaryMonth on old records
// ═══════════════════════════════════════════════
// Rule: If payment was made in the first 7 days → salary belongs to previous month
//       Otherwise → salary belongs to the same month as payment
router.get('/migrate-salary-months', auth, authorize('admin'), async (req, res) => {
    try {
        const payments = await SalaryPayment.find({ $or: [{ salaryMonth: '' }, { salaryMonth: { $exists: false } }] });

        let migrated = 0;
        for (const payment of payments) {
            const payDate = new Date(payment.date);
            const day = payDate.getDate();

            let targetYear, targetMonth;
            if (day <= 7) {
                // Salary belongs to previous month
                const prev = new Date(payDate.getFullYear(), payDate.getMonth() - 1, 1);
                targetYear = prev.getFullYear();
                targetMonth = prev.getMonth(); // 0-indexed
            } else {
                targetYear = payDate.getFullYear();
                targetMonth = payDate.getMonth();
            }

            const salaryMonth = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;
            const salaryMonthDate = new Date(targetYear, targetMonth, 1);

            // Update the SalaryPayment
            await SalaryPayment.findByIdAndUpdate(payment._id, { salaryMonth });

            // Also update the linked Expense
            if (payment.expenseId) {
                await Expense.findByIdAndUpdate(payment.expenseId, {
                    salaryMonth,
                    date: salaryMonthDate // Reset expense date to 1st of the correct month
                });
            }

            migrated++;
        }

        res.json({ message: `Migration complete. ${migrated} records updated.`, migrated });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;

