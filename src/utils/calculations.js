export const getMonthRange = (date, offset = 0) => {
    const d = new Date(date);
    const start = new Date(d.getFullYear(), d.getMonth() + offset, 1);
    const end = new Date(d.getFullYear(), d.getMonth() + offset + 1, 0, 23, 59, 59, 999);
    return { start, end };
};

export const inRange = (dateStr, start, end) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d >= start && d <= end;
};

export const sumField = (arr, field) => arr.reduce((s, item) => s + (Number(item[field]) || 0), 0);

export const buildMonthlyTimeline = (now, months, payments = [], expenses = [], clients = [], projects = [], leads = []) => {
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

export const calcCoreMetrics = (clients = [], leads = [], projects = [], payments = [], expenses = [], tasks = [], now = new Date()) => {
    const totalClients = clients.length;
    const activeClients = clients.filter(c =>
        ['Active', 'Pending'].includes(c.contractStatus) ||
        ['In Progress', 'Testing', 'Client Review'].includes(c.projectStatus)
    ).length || totalClients;

    const totalProjects = projects.length;
    const ongoingProjects = projects.filter(p => ['Planning', 'In Progress', 'Testing', 'Client Review'].includes(p.status)).length;
    const completedProjects = projects.filter(p => p.status === 'Completed').length;

    const rawLeads = leads.length;
    const totalLeads = rawLeads + totalClients; // considering clients came from leads
    const wonLeads = leads.filter(l => l.status === 'Won').length;
    const convertedLeads = wonLeads + totalClients;
    const conversionRate = totalLeads > 0 ? parseFloat(((convertedLeads / totalLeads) * 100).toFixed(1)) : 0;

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

    const { start: monthStart, end: monthEnd } = getMonthRange(now);
    const thisMonthPayments = payments.filter(p => inRange(p.paymentDate, monthStart, monthEnd));
    const thisMonthExpenses = expenses.filter(e => inRange(e.date, monthStart, monthEnd));
    const thisMonthRevenue = sumField(thisMonthPayments, 'paidAmount');
    const thisMonthExpenseTotal = sumField(thisMonthExpenses, 'amount');

    const { start: lastStart, end: lastEnd } = getMonthRange(now, -1);
    const lastMonthPayments = payments.filter(p => inRange(p.paymentDate, lastStart, lastEnd));
    const lastMonthRevenue = sumField(lastMonthPayments, 'paidAmount');

    let revenueGrowth = 0;
    if (lastMonthRevenue > 0) {
        revenueGrowth = parseFloat((((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1));
    } else if (thisMonthRevenue > 0) {
        revenueGrowth = 100;
    }

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
