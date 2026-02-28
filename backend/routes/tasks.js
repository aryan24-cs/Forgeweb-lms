import express from 'express';
import Task from '../models/Task.js';
import { auth } from '../middleware/auth.js';
import { logActivity } from '../utils/helpers.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
    try {
        const { status, priority } = req.query;
        let filter = {};
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        const tasks = await Task.find(filter)
            .populate('assignedTo', 'name')
            .populate('relatedLead', 'name')
            .populate('relatedClient', 'name')
            .populate('relatedProject', 'name')
            .sort('-createdAt');
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const task = await Task.create(req.body);
        await logActivity(req.user._id, 'Created task', 'Task', task._id, task.title);
        res.status(201).json(task);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .populate('assignedTo', 'name');
        await logActivity(req.user._id, 'Updated task', 'Task', task._id, task.title);
        res.json(task);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        await Task.findByIdAndDelete(req.params.id);
        await logActivity(req.user._id, 'Deleted task', 'Task', req.params.id);
        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
