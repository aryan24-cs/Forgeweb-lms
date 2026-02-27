import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import api from '../api';
import { useAuth } from './AuthContext';
import { calcCoreMetrics, buildMonthlyTimeline } from '../utils/calculations';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
    const { user } = useAuth();

    // Raw Data State
    const [leads, setLeads] = useState([]);
    const [clients, setClients] = useState([]);
    const [projects, setProjects] = useState([]);
    const [payments, setPayments] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);

    const [loading, setLoading] = useState(true);

    const refreshData = useCallback(async () => {
        if (!user) return;
        try {
            // Fetch all core entities + the stats route just for recent Activities if there's no dedicated route
            const [leadsRes, clientsRes, projectsRes, paymentsRes, expensesRes, tasksRes, statsRes] = await Promise.all([
                api.get('/leads').catch(() => ({ data: [] })),
                api.get('/clients').catch(() => ({ data: [] })),
                api.get('/projects').catch(() => ({ data: [] })),
                api.get('/payments').catch(() => ({ data: [] })),
                api.get('/expenses').catch(() => ({ data: [] })),
                api.get('/tasks').catch(() => ({ data: [] })),
                api.get('/dashboard/stats').catch(() => ({ data: { recentActivities: [] } }))
            ]);

            setLeads(leadsRes.data || []);
            setClients(clientsRes.data || []);
            setProjects(projectsRes.data || []);
            setPayments(paymentsRes.data || []);
            setExpenses(expensesRes.data || []);
            setTasks(tasksRes.data || []);

            if (statsRes.data?.recentActivities) {
                setRecentActivities(statsRes.data.recentActivities);
            }
        } catch (error) {
            console.error('Failed to fetch global data:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 10000); // 10 seconds polling for real-time feel
        return () => clearInterval(interval);
    }, [refreshData]);

    // Derived State (Memoized to prevent unnecessary re-calculating)
    const store = useMemo(() => {
        const now = new Date();
        const metrics = calcCoreMetrics(clients, leads, projects, payments, expenses, tasks, now);
        const monthlyData = buildMonthlyTimeline(now, 12, payments, expenses, clients, projects, leads);

        // Dynamic chart aggregations
        const projectStatusDist = [
            { name: 'Ongoing', value: metrics.ongoingProjects },
            { name: 'Completed', value: metrics.completedProjects },
            { name: 'On Hold', value: projects.filter(p => p.status === 'On Hold').length }
        ].filter(d => d.value > 0);
        if (projectStatusDist.length === 0) projectStatusDist.push({ name: 'No Projects', value: 1 });

        const leadConversionDist = [
            { name: 'Converted', value: metrics.convertedLeads },
            { name: 'Pipeline', value: Math.max(0, metrics.totalLeads - metrics.convertedLeads) }
        ].filter(d => d.value > 0);
        if (leadConversionDist.length === 0) leadConversionDist.push({ name: 'No Leads', value: 1 });

        // Yearly Revenue
        const yearlyRevenue = [];
        for (let i = 4; i >= 0; i--) {
            const year = now.getFullYear() - i;
            const start = new Date(year, 0, 1);
            const end = new Date(year, 11, 31, 23, 59, 59);
            const yPay = payments.filter(p => p.paymentDate && new Date(p.paymentDate) >= start && new Date(p.paymentDate) <= end);
            const rev = yPay.reduce((s, p) => s + (p.paidAmount || 0), 0);
            yearlyRevenue.push({ year: year.toString(), revenue: rev });
        }

        const clientStatusDist = [
            { name: 'Active', value: metrics.activeClients },
            { name: 'Inactive', value: Math.max(0, metrics.totalClients - metrics.activeClients) }
        ].filter(d => d.value > 0);
        if (clientStatusDist.length === 0) clientStatusDist.push({ name: 'No Clients', value: 1 });

        const sourceMap = {};
        leads.forEach(l => { sourceMap[l.source] = (sourceMap[l.source] || 0) + 1; });
        const leadSourceDist = Object.entries(sourceMap).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);

        // Payment status
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

        // Payment Mode
        const modeMap = {};
        payments.forEach(p => { modeMap[p.paymentMode] = (modeMap[p.paymentMode] || 0) + p.paidAmount; });
        const paymentModeDist = Object.entries(modeMap).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
        if (paymentModeDist.length === 0) paymentModeDist.push({ name: 'No Data', value: 1 });

        // Expenses
        const catMap = {};
        expenses.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
        const expenseCategoryDist = Object.entries(catMap).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);

        const clientRevMap = {};
        payments.forEach(p => {
            const cName = p.client?.name || 'Unknown';
            clientRevMap[cName] = (clientRevMap[cName] || 0) + p.paidAmount;
        });
        const topClients = Object.entries(clientRevMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        return {
            raw: { leads, clients, projects, payments, expenses, tasks, recentActivities },
            metrics,
            graphs: {
                monthlyData,
                projectStatusDist,
                leadConversionDist,
                yearlyRevenue,
                clientStatusDist,
                leadSourceDist,
                paymentStatusDist,
                paymentModeDist,
                expenseCategoryDist,
                topClients
            },
            loading,
            refreshData
        };
    }, [leads, clients, projects, payments, expenses, tasks, recentActivities, loading, refreshData]);

    return (
        <DataContext.Provider value={store}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => useContext(DataContext);
