import express from 'express';
import Note from '../models/Note.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get all notes for the logged in user
router.get('/', auth, async (req, res) => {
    try {
        const notes = await Note.find({ user: req.user._id }).sort({ pinned: -1, updatedAt: -1 });
        res.json(notes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all public notes
router.get('/public', auth, async (req, res) => {
    try {
        const notes = await Note.find({ isPublic: true })
            .populate('user', 'name')
            .sort({ updatedAt: -1 });
        res.json(notes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new note
router.post('/', auth, async (req, res) => {
    try {
        const { title, content, color, tags, isPublic, pinned } = req.body;
        const note = new Note({
            title,
            content,
            color,
            tags,
            isPublic,
            pinned,
            user: req.user._id
        });
        await note.save();
        res.status(201).json(note);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a note
router.put('/:id', auth, async (req, res) => {
    try {
        const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
        if (!note) return res.status(404).json({ message: 'Note not found' });

        const { title, content, color, tags, isPublic, pinned } = req.body;
        if (title !== undefined) note.title = title;
        if (content !== undefined) note.content = content;
        if (color !== undefined) note.color = color;
        if (tags !== undefined) note.tags = tags;
        if (isPublic !== undefined) note.isPublic = isPublic;
        if (pinned !== undefined) note.pinned = pinned;

        await note.save();
        res.json(note);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a note
router.delete('/:id', auth, async (req, res) => {
    try {
        const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!note) return res.status(404).json({ message: 'Note not found' });
        res.json({ message: 'Note deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
