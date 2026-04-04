import express from 'express';
import DailyTask from '../models/DailyTask.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get all master tasks
router.get('/', auth, async (req, res) => {
    try {
        const tasks = await DailyTask.find().sort('order');
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add new master task
router.post('/', auth, async (req, res) => {
    try {
        const task = await DailyTask.create(req.body);
        res.status(201).json(task);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update master task
router.put('/:id', auth, async (req, res) => {
    try {
        const task = await DailyTask.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(task);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete master task
router.delete('/:id', auth, async (req, res) => {
    try {
        await DailyTask.findByIdAndDelete(req.params.id);
        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
