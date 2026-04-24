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
        const { name, email, password, role, joiningDate, internshipDuration, internshipEndDate } = req.body;
        if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already exists' });
        const user = await User.create({ 
            name, 
            email, 
            password, 
            plainPassword: password, // Store plain text for admin visibility
            role: role || 'sales',
            joiningDate,
            internshipDuration,
            internshipEndDate
        });
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
        const isAdmin = req.user.role === 'admin';
        const isManager = req.user.role === 'manager';
        let fields;
        if (isAdmin) {
            fields = '-password'; // Admin gets everything except hashed password (plainPassword included)
        } else if (isManager) {
            fields = 'name email role _id isActive joiningDate internshipDuration internshipEndDate';
        } else {
            fields = 'name email role _id';
        }
        const users = await User.find().select(fields).sort('-createdAt');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update user (admin or self) — supports password and avatar change
router.put('/users/:id', auth, async (req, res) => {
    try {
        const isAdmin = req.user.role === 'admin';
        const isSelf = req.user.id === req.params.id;

        if (!isAdmin && !isSelf) {
            return res.status(403).json({ message: 'Access denied. You can only update your own profile.' });
        }

        const { name, email, role, isActive, joiningDate, internshipDuration, internshipEndDate, password, avatar } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Update fields allowed for self
        if (name !== undefined) user.name = name;
        if (avatar !== undefined) user.avatar = avatar;

        // Fields strictly for admin
        if (isAdmin) {
            if (email !== undefined) user.email = email;
            if (role !== undefined) user.role = role;
            if (isActive !== undefined) user.isActive = isActive;
            if (joiningDate !== undefined) user.joiningDate = joiningDate;
            if (internshipDuration !== undefined) user.internshipDuration = internshipDuration;
            if (internshipEndDate !== undefined) user.internshipEndDate = internshipEndDate;
        }

        // Handle password change — .save() triggers the bcrypt pre-hook
        if (password && password.trim()) {
            user.password = password;
            user.plainPassword = password;
        }

        await user.save();
        const result = user.toObject();
        delete result.password;
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete user
router.delete('/users/:id', auth, authorize('admin'), async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
