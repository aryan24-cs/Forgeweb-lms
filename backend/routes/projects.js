import express from 'express';
import Project from '../models/Project.js';
import { auth } from '../middleware/auth.js';
import { logActivity } from '../utils/helpers.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
    try {
        const projects = await Project.find().populate('client', 'name businessName').populate('teamMembers', 'name').sort('-createdAt');
        res.json(projects);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const project = await Project.create(req.body);
        await logActivity(req.user._id, 'Created project', 'Project', project._id, project.name);
        res.status(201).json(project);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('client', 'name businessName').populate('teamMembers', 'name');
        await logActivity(req.user._id, 'Updated project', 'Project', project._id, project.name);
        res.json(project);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        await Project.findByIdAndDelete(req.params.id);
        await logActivity(req.user._id, 'Deleted project', 'Project', req.params.id);
        res.json({ message: 'Project deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
