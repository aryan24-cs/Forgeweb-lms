import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'forgeweb_secret_2026';

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        if (!user.isActive) return res.status(403).json({ message: 'Account disabled' });
        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Register (admin only)
router.post('/register', auth, authorize('admin'), async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already exists' });
        const user = await User.create({ name, email, password, role: role || 'sales' });
        res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get current user
router.get('/me', auth, (req, res) => {
    res.json(req.user);
});

// Get all users (auth required - limited fields for non-admin)
router.get('/users', auth, async (req, res) => {
    try {
        const isAdmin = ['admin', 'manager'].includes(req.user.role);
        const fields = isAdmin ? '-password' : 'name email role _id';
        const users = await User.find().select(fields).sort('-createdAt');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update user
router.put('/users/:id', auth, authorize('admin'), async (req, res) => {
    try {
        const { name, email, role, isActive } = req.body;
        const user = await User.findByIdAndUpdate(req.params.id, { name, email, role, isActive }, { new: true }).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
