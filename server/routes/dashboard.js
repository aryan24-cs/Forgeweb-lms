import express from 'express';
import Lead from '../models/Lead.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import Payment from '../models/Payment.js';
import Task from '../models/Task.js';
import Activity from '../models/Activity.js';
import Expense from '../models/Expense.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// ═══════════════════════════════════════════════
// SHARED CALCULATION ENGINE
// Single source of truth for all financial math
// ═══════════════════════════════════════════════

const getMonthRange = (date, offset = 0) => {
    const d = new Date(date);
    const start = new Date(d.getFullYear(), d.getMonth() + offset, 1);
    const end = new Date(d.getFullYear(), d.getMonth() + offset + 1, 0, 23, 59, 59, 999);
    return { start, end };
};

const inRange = (dateStr, start, end) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d >= start && d <= end;
};

const sumField = (arr, field) => arr.reduce((s, item) => s + (item[field] || 0), 0);

const buildMonthlyTimeline = (now, months, payments, expenses, clients, projects, leads) => {
    const timeline = [];
    for (let i = months - 1; i >= 0; i--) {
        const { start, end } = getMonthRange(now, -i);
        const label = start.toLocaleString('default', { month: 'short', year: '2-digit' });

        const mPayments = payments.filter(p => inRange(p.paymentDate, start, end));
        const mExpenses = expenses.filter(e => inRange(e.date, start, end));
        const mClients = clients.filter(c => inRange(c.createdAt, start, end));
        const mProjects = projects.filter(p => inRange(p.createdAt, start, end));
        const mLeads = leads.filter(l => inRange(l.createdAt, start, end));

        const revenue = sumField(mPayments, 'paidAmount');
        const expenseTotal = sumField(mExpenses, 'amount');

        timeline.push({
            month: label,
            revenue,
            expenses: expenseTotal,
            profit: revenue - expenseTotal,
            clientsAdded: mClients.length,
            projectsCreated: mProjects.length,
            leadsAdded: mLeads.length,
        });
    }
    return timeline;
};

const calcCoreMetrics = (clients, leads, projects, payments, expenses, tasks, now) => {
    // ── Client Metrics ──
    const totalClients = clients.length;
    const activeClients = clients.filter(c =>
        ['Active', 'Pending'].includes(c.contractStatus) ||
        ['In Progress', 'Testing', 'Client Review'].includes(c.projectStatus)
    ).length || totalClients;

    // ── Project Metrics ──
    const totalProjects = projects.length;
    const ongoingProjects = projects.filter(p => ['Planning', 'In Progress', 'Testing', 'Client Review'].includes(p.status)).length;
    const completedProjects = projects.filter(p => p.status === 'Completed').length;

    // ── Lead Metrics ──
    const rawLeads = leads.length;
    const totalLeads = rawLeads + totalClients;
    const wonLeads = leads.filter(l => l.status === 'Won').length;
    const convertedLeads = wonLeads + totalClients;
    const conversionRate = totalLeads > 0 ? parseFloat(((convertedLeads / totalLeads) * 100).toFixed(1)) : 0;

    // ── Financial Metrics (Revenue = actual money collected via payments) ──
    const totalRevenue = sumField(payments, 'paidAmount');
    const totalExpenses = sumField(expenses, 'amount');
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? parseFloat(((netProfit / totalRevenue) * 100).toFixed(1)) : 0;

    const pendingPayments = payments
        .filter(p => p.status !== 'Paid')
        .reduce((s, p) => s + (p.remainingAmount || 0), 0);

    const overduePayments = payments
        .filter(p => p.status === 'Overdue')
        .reduce((s, p) => s + (p.remainingAmount || 0), 0);

    const totalBilled = sumField(payments, 'totalAmount');
    const collectionRate = totalBilled > 0 ? parseFloat(((totalRevenue / totalBilled) * 100).toFixed(1)) : 0;
    const avgDealValue = totalClients > 0 ? Math.round(clients.reduce((s, c) => s + (c.totalDealValue || 0), 0) / totalClients) : 0;

    // ── This Month ──
    const { start: monthStart, end: monthEnd } = getMonthRange(now);
    const thisMonthPayments = payments.filter(p => inRange(p.paymentDate, monthStart, monthEnd));
    const thisMonthExpenses = expenses.filter(e => inRange(e.date, monthStart, monthEnd));
    const thisMonthRevenue = sumField(thisMonthPayments, 'paidAmount');
    const thisMonthExpenseTotal = sumField(thisMonthExpenses, 'amount');

    // ── Last Month ──
    const { start: lastStart, end: lastEnd } = getMonthRange(now, -1);
    const lastMonthPayments = payments.filter(p => inRange(p.paymentDate, lastStart, lastEnd));
    const lastMonthRevenue = sumField(lastMonthPayments, 'paidAmount');

    // ── Growth ──
    let revenueGrowth = 0;
    if (lastMonthRevenue > 0) revenueGrowth = parseFloat((((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1));
    else if (thisMonthRevenue > 0) revenueGrowth = 100;

    // ── Task Metrics ──
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const tasksDueToday = tasks.filter(t => t.status !== 'Completed' && t.dueDate && new Date(t.dueDate) >= todayStart && new Date(t.dueDate) <= todayEnd).length;
    const pendingTasks = tasks.filter(t => t.status !== 'Completed').length;

    return {
        totalClients, activeClients,
        totalProjects, ongoingProjects, completedProjects,
        totalLeads, convertedLeads, conversionRate,
        totalRevenue, totalExpenses, netProfit, profitMargin,
        pendingPayments, overduePayments, collectionRate, avgDealValue,
        thisMonthRevenue, thisMonthExpenseTotal, lastMonthRevenue, revenueGrowth,
        tasksDueToday, pendingTasks,
        totalBilled,
    };
};


// ─────────────────────────────────────────────
// 1. COMMAND CENTER  /dashboard/stats
// ─────────────────────────────────────────────
router.get('/stats', auth, async (req, res) => {
    try {
        const [clients, leads, projects, payments, tasks, expenses] = await Promise.all([
            Client.find(), Lead.find(), Project.find(), Payment.find(), Task.find(), Expense.find()
        ]);
        const now = new Date();
        const m = calcCoreMetrics(clients, leads, projects, payments, expenses, tasks, now);

        // ── Monthly Revenue Timeline (12 months) ──
        const monthlyRevenue = buildMonthlyTimeline(now, 12, payments, expenses, clients, projects, leads);

        // ── Project Status Distribution ──
        const projectStatusDist = [
            { name: 'Ongoing', value: m.ongoingProjects },
            { name: 'Completed', value: m.completedProjects },
            { name: 'On Hold', value: projects.filter(p => p.status === 'On Hold').length }
        ].filter(d => d.value > 0);
        if (projectStatusDist.length === 0) projectStatusDist.push({ name: 'No Projects', value: 1 });

        // ── Lead Conversion Donut ──
        const leadConversionDist = [
            { name: 'Converted', value: m.convertedLeads },
            { name: 'Pipeline', value: Math.max(0, m.totalLeads - m.convertedLeads) }
        ].filter(d => d.value > 0);
        if (leadConversionDist.length === 0) leadConversionDist.push({ name: 'No Leads', value: 1 });

        // ── Lead Funnel ──
        const leadStatuses = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];
        const leadDistribution = leadStatuses
            .map(status => ({ name: status, value: leads.filter(l => l.status === status).length }))
            .filter(d => d.value > 0);
        if (leadDistribution.length === 0 && m.totalClients > 0) {
            leadDistribution.push({ name: 'Direct Client', value: m.totalClients });
        }

        // ── Activity Feed ──
        const recentActivities = await Activity.find().populate('user', 'name').sort('-createdAt').limit(15);

        res.json({
            cards: {
                totalClients: m.totalClients,
                activeClients: m.activeClients,
                totalProjects: m.totalProjects,
                ongoingProjects: m.ongoingProjects,
                completedProjects: m.completedProjects,
                totalLeads: m.totalLeads,
                conversionRate: m.conversionRate,
                totalRevenue: m.totalRevenue,
                totalExpenses: m.totalExpenses,
                netProfit: m.netProfit,
                pendingPayments: m.pendingPayments,
                thisMonthRevenue: m.thisMonthRevenue,
                revenueGrowth: m.revenueGrowth,
                tasksDueToday: m.tasksDueToday,
                pendingTasks: m.pendingTasks,
            },
            graphs: {
                monthlyRevenue,
                projectStatusDist,
                leadConversionDist,
                leadDistribution
            },
            recentActivities
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// ─────────────────────────────────────────────
// 2. FINANCE CENTER  /dashboard/finance
// ─────────────────────────────────────────────
router.get('/finance', auth, async (req, res) => {
    try {
        const [payments, expenses, clients, leads, projects, tasks] = await Promise.all([
            Payment.find().populate('client', 'name'),
            Expense.find(),
            Client.find(),
            Lead.find(),
            Project.find(),
            Task.find()
        ]);
        const now = new Date();
        const m = calcCoreMetrics(clients, leads, projects, payments, expenses, tasks, now);

        // ── Monthly Timeline (12 months) ──
        const monthlyData = buildMonthlyTimeline(now, 12, payments, expenses, clients, projects, leads);

        // ── Payment Status Distribution ──
        const paidTotal = payments.filter(p => p.status === 'Paid').reduce((s, p) => s + p.paidAmount, 0);
        const partialTotal = payments.filter(p => p.status === 'Partial').reduce((s, p) => s + p.paidAmount, 0);
        const pendingTotal = payments.filter(p => p.status === 'Pending').reduce((s, p) => s + p.totalAmount, 0);
        const overdueTotal = payments.filter(p => p.status === 'Overdue').reduce((s, p) => s + p.totalAmount, 0);
        const paymentStatusDist = [
            { name: 'Paid', value: paidTotal },
            { name: 'Partial', value: partialTotal },
            { name: 'Pending', value: pendingTotal },
            { name: 'Overdue', value: overdueTotal }
        ].filter(d => d.value > 0);
        if (paymentStatusDist.length === 0) paymentStatusDist.push({ name: 'No Payments', value: 1 });

        // ── Payment Mode Breakdown ──
        const modeMap = {};
        payments.forEach(p => { modeMap[p.paymentMode] = (modeMap[p.paymentMode] || 0) + p.paidAmount; });
        const paymentModeDist = Object.entries(modeMap).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
        if (paymentModeDist.length === 0) paymentModeDist.push({ name: 'No Data', value: 1 });

        // ── Expense Category Breakdown ──
        const catMap = {};
        expenses.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
        const expenseCategoryDist = Object.entries(catMap).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);

        // ── Top Clients by Revenue ──
        const clientRevMap = {};
        payments.forEach(p => {
            const cName = p.client?.name || 'Unknown';
            clientRevMap[cName] = (clientRevMap[cName] || 0) + p.paidAmount;
        });
        const topClients = Object.entries(clientRevMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        res.json({
            cards: {
                totalRevenue: m.totalRevenue,
                thisMonthRevenue: m.thisMonthRevenue,
                pendingPayments: m.pendingPayments,
                totalExpenses: m.totalExpenses,
                netProfit: m.netProfit,
                profitMargin: m.profitMargin,
                overduePayments: m.overduePayments,
                collectionRate: m.collectionRate,
                revenueGrowth: m.revenueGrowth,
                totalBilled: m.totalBilled,
            },
            graphs: {
                monthlyData,
                paymentStatusDist,
                paymentModeDist,
                expenseCategoryDist,
                topClients,
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// ─────────────────────────────────────────────
// 3. ANALYTICS  /dashboard/analytics
// ─────────────────────────────────────────────
router.get('/analytics', auth, async (req, res) => {
    try {
        const [clients, leads, projects, payments, expenses, tasks] = await Promise.all([
            Client.find(), Lead.find(), Project.find(), Payment.find(), Expense.find(), Task.find()
        ]);
        const now = new Date();
        const m = calcCoreMetrics(clients, leads, projects, payments, expenses, tasks, now);

        // ── Monthly Timeline (12 months) ──
        const monthlyData = buildMonthlyTimeline(now, 12, payments, expenses, clients, projects, leads);

        // ── Yearly Revenue (last 5 years) ──
        const yearlyRevenue = [];
        for (let i = 4; i >= 0; i--) {
            const year = now.getFullYear() - i;
            const start = new Date(year, 0, 1);
            const end = new Date(year, 11, 31, 23, 59, 59);
            const yPay = payments.filter(p => inRange(p.paymentDate, start, end));
            yearlyRevenue.push({
                year: year.toString(),
                revenue: sumField(yPay, 'paidAmount')
            });
        }

        // ── Project Status Distribution ──
        const projectStatusDist = [
            { name: 'Ongoing', value: m.ongoingProjects },
            { name: 'Completed', value: m.completedProjects },
            { name: 'On Hold', value: projects.filter(p => p.status === 'On Hold').length }
        ].filter(d => d.value > 0);
        if (projectStatusDist.length === 0) projectStatusDist.push({ name: 'No Projects', value: 1 });

        // ── Client Status Distribution ──
        const clientStatusDist = [
            { name: 'Active', value: m.activeClients },
            { name: 'Inactive', value: Math.max(0, m.totalClients - m.activeClients) }
        ].filter(d => d.value > 0);
        if (clientStatusDist.length === 0) clientStatusDist.push({ name: 'No Clients', value: 1 });

        // ── Lead Conversion Distribution ──
        const leadConversionDist = [
            { name: 'Converted', value: m.convertedLeads },
            { name: 'Pipeline', value: Math.max(0, m.totalLeads - m.convertedLeads) }
        ].filter(d => d.value > 0);
        if (leadConversionDist.length === 0) leadConversionDist.push({ name: 'No Leads', value: 1 });

        // ── Lead Source Breakdown ──
        const sourceMap = {};
        leads.forEach(l => { sourceMap[l.source] = (sourceMap[l.source] || 0) + 1; });
        const leadSourceDist = Object.entries(sourceMap).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);

        res.json({
            cards: {
                totalClients: m.totalClients,
                activeClients: m.activeClients,
                totalProjects: m.totalProjects,
                ongoingProjects: m.ongoingProjects,
                completedProjects: m.completedProjects,
                totalRevenue: m.totalRevenue,
                thisMonthRevenue: m.thisMonthRevenue,
                pendingPayments: m.pendingPayments,
                totalLeads: m.totalLeads,
                conversionRate: m.conversionRate,
                revenueGrowth: m.revenueGrowth,
                avgDealValue: m.avgDealValue,
            },
            graphs: {
                monthlyData,
                yearlyRevenue,
                projectStatusDist,
                clientStatusDist,
                leadConversionDist,
                leadSourceDist,
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
