import cron from 'node-cron';
import Lead from '../models/Lead.js';
import Task from '../models/Task.js';
import Expense from '../models/Expense.js';
import Payment from '../models/Payment.js';
import Project from '../models/Project.js';
import Activity from '../models/Activity.js';
import User from '../models/User.js';

// Run every day at midnight
cron.schedule('0 0 * * *', async () => {
    console.log('[Automation] Running daily cron jobs...');
    try {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

        // 1. Process recurring expenses
        const recurringExpenses = await Expense.find({ recurring: true });
        for (const exp of recurringExpenses) {
            let shouldCreate = false;
            const lastDate = new Date(exp.date);

            if (exp.recurringInterval === 'Monthly' && now.getMonth() !== lastDate.getMonth()) {
                shouldCreate = true;
            } else if (exp.recurringInterval === 'Yearly' && now.getFullYear() !== lastDate.getFullYear()) {
                shouldCreate = true;
            }

            if (shouldCreate) {
                await Expense.create({
                    title: exp.title,
                    amount: exp.amount,
                    category: exp.category,
                    date: now,
                    recurring: true,
                    recurringInterval: exp.recurringInterval,
                    vendor: exp.vendor,
                    createdBy: exp.createdBy,
                });
                exp.date = now;
                await exp.save();
                console.log(`[Automation] Created recurring expense: ${exp.title}`);
            }
        }

        // 2. Auto-mark tasks as overdue or completed
        const overdueTasks = await Task.find({ status: { $ne: 'Completed' }, dueDate: { $lt: now } });
        for (const t of overdueTasks) {
            // Can be flagged here or just log it
            // Could add an 'Overdue' status to tasks, but 'To Do'/'In Progress' with a past dueDate is enough in UI
        }

        // 3. Mark payments as overdue if dueDate has passed and not fully paid
        const pendingPayments = await Payment.find({ status: { $in: ['Pending', 'Partial'] }, dueDate: { $lt: now } });
        for (const p of pendingPayments) {
            p.status = 'Overdue';
            await p.save();
            // log activity
            await Activity.create({
                action: 'Payment marked as Overdue',
                entityType: 'Payment',
                entityId: p._id,
                details: `Payment of ₹${p.remainingAmount} is overdue.`
            });
            console.log(`[Automation] Marked payment ${p._id} as Overdue.`);
        }

        // 4. Follow-up reminder notifications (Log as activity or notify admins)
        const leadsToFollowUp = await Lead.find({ followUpDate: { $gte: startOfToday, $lte: endOfToday } });
        for (const l of leadsToFollowUp) {
            await Activity.create({
                action: 'Lead Follow-up Reminder',
                entityType: 'Lead',
                entityId: l._id,
                details: `Follow up required today for lead: ${l.name}`
            });
        }

        // 5. Project milestone auto-updates
        // If all tasks associated with a milestone are 'Completed', auto-complete the milestone
        const activeProjects = await Project.find({ status: { $in: ['In Progress', 'Planning'] } });
        for (const p of activeProjects) {
            let updated = false;
            for (const m of p.milestones) {
                if (!m.completed && m.tasks && m.tasks.length > 0) {
                    const tasks = await Task.find({ _id: { $in: m.tasks } });
                    const allCompleted = tasks.every(t => t.status === 'Completed');
                    if (allCompleted) {
                        m.completed = true;
                        m.completedDate = now;
                        updated = true;
                        console.log(`[Automation] Auto-completed milestone: ${m.title}`);
                    }
                }
            }
            if (updated) await p.save();
        }

        console.log('[Automation] Daily cron jobs completed.');
    } catch (err) {
        console.error('[Automation Error]', err.message);
    }
});
