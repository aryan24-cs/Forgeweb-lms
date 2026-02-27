import express from 'express';
import Settings from '../models/Settings.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) settings = await Settings.create({});
        res.json(settings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/', auth, authorize('admin'), async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) settings = new Settings();
        Object.assign(settings, req.body);
        await settings.save();
        res.json(settings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
