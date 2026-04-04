import express from 'express';
import DailyRecord from '../models/DailyRecord.js';
import DailyTask from '../models/DailyTask.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get records for a specific month (YYY-MM prefix)
router.get('/:month', auth, async (req, res) => {
    try {
        const { month } = req.params;
        const records = await DailyRecord.find({
            date: { $regex: `^${month}` }
        });
        res.json(records);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Toggle a task on a specific date
router.put('/:date/toggle', auth, async (req, res) => {
    try {
        const { date } = req.params;
        const { taskId, completed } = req.body;

        let record = await DailyRecord.findOne({ date });

        if (!record) {
            // Create a new record with a snapshot of CURRENT active tasks
            const activeTasks = await DailyTask.find({ isActive: true }).sort('order');
            const tasksSnapshot = activeTasks.map(t => ({
                taskId: t._id,
                name: t.name,
                completed: false
            }));

            record = new DailyRecord({
                date,
                tasks: tasksSnapshot
            });
        }

        // Update the specific task
        const taskInRecord = record.tasks.find(t => t.taskId.toString() === taskId);
        if (taskInRecord) {
            taskInRecord.completed = completed;
        } else {
            // Task might have been deleted from master but we're toggling it in an old record?
            // Or it's a new task added to master and we want to add it to today's already existing record?
            // Let's handle adding newly added master tasks to an existing record if they don't exist.
            const masterTask = await DailyTask.findById(taskId);
            if (masterTask) {
                record.tasks.push({
                    taskId: masterTask._id,
                    name: masterTask.name,
                    completed: completed
                });
            }
        }

        await record.save();
        res.json(record);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Mark all tasks for a day
router.put('/:date/mark-all', auth, async (req, res) => {
    try {
        const { date } = req.params;
        const { completed } = req.body;

        let record = await DailyRecord.findOne({ date });

        if (!record) {
            const activeTasks = await DailyTask.find({ isActive: true }).sort('order');
            const tasksSnapshot = activeTasks.map(t => ({
                taskId: t._id,
                name: t.name,
                completed: completed
            }));

            record = new DailyRecord({
                date,
                tasks: tasksSnapshot
            });
        } else {
            record.tasks.forEach(t => t.completed = completed);
        }

        await record.save();
        res.json(record);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
