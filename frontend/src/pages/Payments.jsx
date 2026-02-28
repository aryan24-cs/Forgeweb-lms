import React, { useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import { useData } from '../context/DataContext';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import {
    Wallet, TrendingUp, CreditCard, Clock, ArrowDownCircle, Zap,
    ArrowUpRight, ArrowDownRight, Receipt, PieChart as PieIcon, Plus,
    Trash2, Edit3, CheckCircle, AlertCircle, DollarSign
} from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#0ea5e9', '#f43f5e', '#64748b'];
const tooltipStyle = {
    background: 'rgba(255,255,255,0.96)',
    border: 'none',
    borderRadius: '16px',
    color: '#0f172a',
    fontSize: '13px',
    fontWeight: '700',
    boxShadow: '0 20px 60px -15px rgba(0,0,0,0.15)',
    padding: '12px 16px',
};

const emptyExpense = { title: '', amount: 0, category: 'Other', description: '', date: '', recurring: false, recurringInterval: 'None', vendor: '' };
const CATEGORIES = ['Developer Payout', 'Hosting', 'Marketing', 'Software', 'Office', 'Travel', 'Other'];

const fmt = (val) => {
    if (!val || val === 0) return '₹0';
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
    return `₹${val.toLocaleString()}`;
};

const FinanceCard = ({ label, value, icon: Icon, color = 'indigo', trend, sub }) => {
    const colorMap = {
        emerald: { light: 'bg-emerald-50', text: 'text-emerald-500', border: 'border-emerald-100' },
        indigo: { light: 'bg-indigo-50', text: 'text-indigo-500', border: 'border-indigo-100' },
        amber: { light: 'bg-amber-50', text: 'text-amber-500', border: 'border-amber-100' },
        rose: { light: 'bg-rose-50', text: 'text-rose-500', border: 'border-rose-100' },
        red: { light: 'bg-red-50', text: 'text-red-500', border: 'border-red-100' },
        sky: { light: 'bg-sky-50', text: 'text-sky-500', border: 'border-sky-100' },
        violet: { light: 'bg-violet-50', text: 'text-violet-500', border: 'border-violet-100' },
    };
    const c = colorMap[color] || colorMap.indigo;

    return (
        <div className="group bg-white rounded-[20px] p-5 border border-slate-100/80 hover:border-slate-200 transition-all duration-400 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.06)] cursor-default relative overflow-hidden">
            <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-[12px] border flex items-center justify-center ${c.light} ${c.border} ${c.text} group-hover:scale-105 transition-transform duration-300`}>
                    <Icon className="w-[17px] h-[17px]" strokeWidth={2.2} />
                </div>
                {trend !== undefined && trend !== null && (
                    <div className={`flex items-center gap-0.5 text-[10px] font-extrabold tracking-wider ${Number(trend) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {Number(trend) >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.12em] mb-0.5">{label}</p>
            <p className="text-[22px] font-black text-slate-800 tracking-tight">{value}</p>
            {sub && <p className="text-[11px] font-semibold text-slate-400 mt-1">{sub}</p>}
        </div>
    );
};

const Payments = () => {
    const { raw, metrics, graphs: fg, loading, refreshData } = useData();
    const [tab, setTab] = useState('overview');

    // Modals & Forms
    const [paymentModal, setPaymentModal] = useState(false);
    const [expenseModal, setExpenseModal] = useState(false);
    const [editPayId, setEditPayId] = useState(null);
    const [editExpId, setEditExpId] = useState(null);
    const [payForm, setPayForm] = useState({ client: '', project: '', totalAmount: 0, paidAmount: 0, paymentMode: 'UPI', transactionId: '', invoiceNumber: '', paymentDate: '', dueDate: '' });
    const [expForm, setExpForm] = useState(emptyExpense);

    if (loading || !metrics) return (
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
            <div className="w-14 h-14 rounded-full border-[3px] border-emerald-500 border-t-transparent animate-spin" />
        </div>
    );

    const payments = raw.payments;
    const expenses = raw.expenses;
    const clients = raw.clients;
    const projects = raw.projects;

    // Payment CRUD
    const openPayAdd = () => { setPayForm({ client: '', project: '', totalAmount: 0, paidAmount: 0, paymentMode: 'UPI', transactionId: '', invoiceNumber: '', paymentDate: '', dueDate: '' }); setEditPayId(null); setPaymentModal(true); };
    const openPayEdit = (p) => {
        setPayForm({ ...p, client: p.client?._id || '', project: p.project?._id || '', paymentDate: p.paymentDate?.slice(0, 10) || '', dueDate: p.dueDate?.slice(0, 10) || '' });
        setEditPayId(p._id); setPaymentModal(true);
    };
    const savePay = async (e) => {
        e.preventDefault();
        try {
            // Sanitize payload: Mongoose ObjectIds and Dates don't like empty strings
            const payload = { ...payForm };
            if (!payload.project) delete payload.project;
            if (!payload.paymentDate) delete payload.paymentDate;
            if (!payload.dueDate) delete payload.dueDate;
            if (!payload.transactionId) delete payload.transactionId;
            if (!payload.invoiceNumber) delete payload.invoiceNumber;

            if (editPayId) await api.put(`/payments/${editPayId}`, payload);
            else await api.post('/payments', payload);
            toast.success(editPayId ? 'Payment updated' : 'Payment recorded');
            setPaymentModal(false);
            refreshData();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to save payment');
        }
    };
    const removePay = async (id) => { if (!confirm('Delete this payment?')) return; await api.delete(`/payments/${id}`); toast.success('Payment deleted'); refreshData(); };

    // Expense CRUD
    const openExpAdd = () => { setExpForm(emptyExpense); setEditExpId(null); setExpenseModal(true); };
    const openExpEdit = (e) => {
        setExpForm({ ...e, date: e.date?.slice(0, 10) || '' });
        setEditExpId(e._id); setExpenseModal(true);
    };
    const saveExp = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...expForm };
            if (!payload.date) delete payload.date;
            if (!payload.vendor) delete payload.vendor;

            if (editExpId) await api.put(`/expenses/${editExpId}`, payload);
            else await api.post('/expenses', payload);
            toast.success(editExpId ? 'Expense updated' : 'Expense recorded');
            setExpenseModal(false);
            refreshData();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to save expense');
        }
    };
    const removeExp = async (id) => { if (!confirm('Delete this expense?')) return; await api.delete(`/expenses/${id}`); toast.success('Expense deleted'); refreshData(); };

    const statusBadge = (s) => {
        const map = {
            'Paid': 'bg-emerald-50 text-emerald-600 border-emerald-100',
            'Partial': 'bg-amber-50 text-amber-600 border-amber-100',
            'Overdue': 'bg-red-50 text-red-600 border-red-100',
            'Pending': 'bg-slate-50 text-slate-500 border-slate-200',
        };
        return map[s] || map.Pending;
    };

    const statusIcon = (s) => {
        if (s === 'Paid') return <CheckCircle className="w-3.5 h-3.5" />;
        if (s === 'Overdue') return <AlertCircle className="w-3.5 h-3.5" />;
        return <Clock className="w-3.5 h-3.5" />;
    };

    const label = "block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider";

    const tabs = [
        { id: 'overview', label: 'Overview', icon: PieIcon },
        { id: 'payments', label: 'Payments', icon: CreditCard },
        { id: 'expenses', label: 'Expenses', icon: ArrowDownCircle },
    ];

    return (
        <div className="space-y-7 animate-fadeIn pb-12">
            {/* ─── HEADER ─── */}
            <div className="relative bg-white rounded-[26px] p-7 border border-slate-100/80 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500" />
                <div className="absolute -right-20 -top-20 w-60 h-60 bg-gradient-to-br from-emerald-500/5 to-amber-500/5 rounded-full blur-3xl" />
                <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-[28px] font-black text-slate-800 tracking-tight flex items-center gap-2.5">
                            Finance Center
                        </h1>
                        <p className="text-[13px] font-medium text-slate-400 mt-1">Revenue, expenses & cash flow intelligence</p>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <button onClick={openPayAdd} className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-[12px] font-bold rounded-xl border border-emerald-200 transition-all">
                            <Plus className="w-3.5 h-3.5" /> Log Payment
                        </button>
                        <button onClick={openExpAdd} className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[12px] font-bold rounded-xl transition-all">
                            <Plus className="w-3.5 h-3.5" /> Log Expense
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── 5 FINANCE KPI CARDS ─── */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <FinanceCard label="Total Revenue" value={fmt(metrics.totalRevenue)} icon={Wallet} color="emerald" trend={metrics.revenueGrowth} />
                <FinanceCard label="Expenses" value={fmt(metrics.totalExpenses)} icon={ArrowDownCircle} color="red" />
                <FinanceCard label="Net Profit" value={fmt(metrics.netProfit)} icon={TrendingUp} color={metrics.netProfit >= 0 ? 'emerald' : 'rose'} sub={`${metrics.profitMargin}% margin`} />
                <FinanceCard label="Pending" value={fmt(metrics.pendingPayments)} icon={Clock} color="amber" sub={metrics.overduePayments > 0 ? `₹${metrics.overduePayments.toLocaleString()} overdue` : 'No overdue'} />
                <FinanceCard label="This Month" value={fmt(metrics.thisMonthRevenue)} icon={DollarSign} color="indigo" />
            </div>

            {/* ─── TAB NAVIGATION ─── */}
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-50 rounded-2xl border border-slate-100 w-fit">
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-5 py-2.5 text-[13px] font-bold rounded-xl transition-all duration-200 ${tab === t.id ? 'bg-white text-slate-800 shadow-sm border border-slate-200/60' : 'text-slate-400 hover:text-slate-600'}`}>
                        <t.icon className="w-4 h-4" />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ═══ OVERVIEW TAB ═══ */}
            {tab === 'overview' && (
                <div className="space-y-6 animate-slideIn">
                    {/* Revenue vs Expenses */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                        <div className="lg:col-span-3 bg-white rounded-[22px] p-6 border border-slate-100/80">
                            <h3 className="text-[13px] font-black text-slate-700 mb-5 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                                    <Wallet className="w-4 h-4 text-indigo-500" />
                                </div>
                                Cash Flow (Revenue vs Expenses)
                                <span className="ml-auto text-[11px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">12 months</span>
                            </h3>
                            <div className="w-full" style={{ minHeight: '280px' }}>
                                <ResponsiveContainer width="100%" height={280}>
                                    <AreaChart data={fg.monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="finRevGrad2" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                                                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="finExpGrad2" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.15} />
                                                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} dy={8} />
                                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                                        <Tooltip contentStyle={tooltipStyle} formatter={v => `₹${v.toLocaleString()}`} cursor={{ stroke: '#e2e8f0' }} />
                                        <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} iconType="circle" iconSize={8} />
                                        <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#finRevGrad2)" strokeWidth={2.5} name="Revenue" dot={false} />
                                        <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#finExpGrad2)" strokeWidth={2.5} name="Expenses" dot={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Profit Trend */}
                        <div className="lg:col-span-2 bg-white rounded-[22px] p-6 border border-slate-100/80">
                            <h3 className="text-[13px] font-black text-slate-700 mb-5 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                                    <TrendingUp className="w-4 h-4 text-violet-500" />
                                </div>
                                Profit Trend
                            </h3>
                            <div className="w-full" style={{ minHeight: '280px' }}>
                                <ResponsiveContainer width="100%" height={280}>
                                    <LineChart data={fg.monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} dy={8} />
                                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                                        <Tooltip contentStyle={tooltipStyle} formatter={v => `₹${v.toLocaleString()}`} />
                                        <Line type="monotone" dataKey="profit" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        {/* Invoice Status */}
                        <div className="bg-white rounded-[22px] p-6 border border-slate-100/80">
                            <h3 className="text-[13px] font-black text-slate-700 mb-5 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                    <Receipt className="w-4 h-4 text-emerald-500" />
                                </div>
                                Payment Status
                            </h3>
                            <div className="flex items-center justify-center relative w-full" style={{ minHeight: '220px' }}>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={fg.paymentStatusDist} cx="50%" cy="50%" outerRadius={85} innerRadius={55} paddingAngle={3} dataKey="value" stroke="none">
                                            {fg.paymentStatusDist.map((entry, i) => {
                                                const colorMap = { 'Paid': '#10b981', 'Partial': '#f59e0b', 'Pending': '#6366f1', 'Overdue': '#ef4444' };
                                                return <Cell key={i} fill={colorMap[entry.name] || '#94a3b8'} />;
                                            })}
                                        </Pie>
                                        <Tooltip contentStyle={tooltipStyle} formatter={v => `₹${v.toLocaleString()}`} />
                                        <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700 }} iconType="circle" iconSize={7} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Expense Breakdown */}
                        <div className="bg-white rounded-[22px] p-6 border border-slate-100/80">
                            <h3 className="text-[13px] font-black text-slate-700 mb-5 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                                    <ArrowDownCircle className="w-4 h-4 text-rose-500" />
                                </div>
                                Expense Distrubution
                            </h3>
                            {fg.expenseCategoryDist?.length > 0 ? (
                                <div className="space-y-3.5 pt-2">
                                    {fg.expenseCategoryDist.map((cat, i) => {
                                        const total = fg.expenseCategoryDist.reduce((s, d) => s + d.value, 0);
                                        const pct = total > 0 ? ((cat.value / total) * 100).toFixed(0) : 0;
                                        return (
                                            <div key={i}>
                                                <div className="flex justify-between mb-1.5">
                                                    <span className="text-[12px] font-bold text-slate-600">{cat.name}</span>
                                                    <span className="text-[11px] font-extrabold text-slate-400">{fmt(cat.value)}</span>
                                                </div>
                                                <div className="w-full h-[6px] bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-40 opacity-40">
                                    <ArrowDownCircle className="w-8 h-8 text-slate-300 mb-2" />
                                    <p className="text-sm font-bold text-slate-400">No expenses logged</p>
                                </div>
                            )}
                        </div>

                        {/* Top Clients */}
                        <div className="bg-white rounded-[22px] p-6 border border-slate-100/80">
                            <h3 className="text-[13px] font-black text-slate-700 mb-5 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                                    <DollarSign className="w-4 h-4 text-indigo-500" />
                                </div>
                                Top Accounts
                            </h3>
                            <div className="flex flex-col gap-3">
                                {fg.topClients?.map((client, i) => (
                                    <div key={i} className="relative p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/60 transition-colors group">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/60 flex items-center justify-center text-[12px] font-black text-indigo-500 shadow-sm">
                                                    {i + 1}
                                                </div>
                                                <p className="text-[13px] font-bold text-slate-700 truncate">{client.name}</p>
                                            </div>
                                            <p className="text-[12px] font-extrabold text-emerald-500">{fmt(client.value)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ PAYMENTS TAB ═══ */}
            {tab === 'payments' && (
                <div className="bg-white rounded-[22px] overflow-hidden border border-slate-100/80 animate-slideIn">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100">
                                    {['Client', 'Total', 'Paid', 'Remaining', 'Mode', 'Status', ''].map(h => (
                                        <th key={h} className="text-left px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map(p => (
                                    <tr key={p._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => openPayEdit(p)}>
                                        <td className="px-5 py-3.5">
                                            <span className="font-bold text-[13px] text-slate-800">{p.client?.name || 'Unknown'}</span>
                                        </td>
                                        <td className="px-5 py-3.5 text-[13px] font-semibold text-slate-500">₹{p.totalAmount?.toLocaleString()}</td>
                                        <td className="px-5 py-3.5 text-[13px] font-extrabold text-emerald-600">₹{p.paidAmount?.toLocaleString()}</td>
                                        <td className="px-5 py-3.5 text-[13px] font-bold text-red-500">₹{p.remainingAmount?.toLocaleString()}</td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-50 text-slate-500 border border-slate-100">{p.paymentMode}</span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg border ${statusBadge(p.status)}`}>
                                                {statusIcon(p.status)} {p.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <button onClick={(e) => { e.stopPropagation(); removePay(p._id); }} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {payments.length === 0 && (
                                    <tr><td colSpan="7" className="text-center py-16 text-slate-400 text-[13px] font-medium">No payments recorded yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ═══ EXPENSES TAB ═══ */}
            {tab === 'expenses' && (
                <div className="bg-white rounded-[22px] overflow-hidden border border-slate-100/80 animate-slideIn">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100">
                                    {['Title', 'Amount', 'Category', 'Vendor', 'Date', 'Recurring', ''].map(h => (
                                        <th key={h} className="text-left px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map(e => (
                                    <tr key={e._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => openExpEdit(e)}>
                                        <td className="px-5 py-3.5"><span className="font-bold text-[13px] text-slate-800">{e.title}</span></td>
                                        <td className="px-5 py-3.5 text-[13px] font-extrabold text-red-500">₹{e.amount?.toLocaleString()}</td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-50 text-slate-500 border border-slate-100">{e.category}</span>
                                        </td>
                                        <td className="px-5 py-3.5 text-[13px] font-medium text-slate-500">{e.vendor || '—'}</td>
                                        <td className="px-5 py-3.5 text-[12px] font-medium text-slate-400">{e.date ? new Date(e.date).toLocaleDateString() : '—'}</td>
                                        <td className="px-5 py-3.5">
                                            {e.recurring ? (
                                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-violet-50 text-violet-600 border border-violet-100">{e.recurringInterval}</span>
                                            ) : <span className="text-slate-300 text-[12px]">—</span>}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <button onClick={(ev) => { ev.stopPropagation(); removeExp(e._id); }} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {expenses.length === 0 && (
                                    <tr><td colSpan="7" className="text-center py-16 text-slate-400 text-[13px] font-medium">No expenses recorded yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ─── PAYMENT MODAL ─── */}
            <Modal isOpen={paymentModal} onClose={() => setPaymentModal(false)} title={editPayId ? 'Edit Payment' : 'Record Payment'} maxWidth="max-w-2xl"
                footer={<>
                    <button type="button" onClick={() => setPaymentModal(false)} className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[13px] font-bold text-slate-600 transition">Cancel</button>
                    <button type="submit" form="pay-form" className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-bold rounded-xl shadow-[0_8px_20px_-4px_rgba(16,185,129,0.25)] transition">{editPayId ? 'Update' : 'Save'}</button>
                </>}
            >
                <form id="pay-form" onSubmit={savePay} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className={label}>Client *</label><select required value={payForm.client} onChange={e => setPayForm({ ...payForm, client: e.target.value })} className="fw-input cursor-pointer"><option value="">Select Client</option>{clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
                        <div><label className={label}>Project</label><select value={payForm.project} onChange={e => setPayForm({ ...payForm, project: e.target.value })} className="fw-input cursor-pointer"><option value="">General</option>{projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}</select></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div><label className={label}>Total Amount (₹)</label><input type="number" value={payForm.totalAmount} onChange={e => setPayForm({ ...payForm, totalAmount: Number(e.target.value) })} className="fw-input font-bold" /></div>
                        <div><label className={label}>Paid Amount (₹)</label><input type="number" value={payForm.paidAmount} onChange={e => setPayForm({ ...payForm, paidAmount: Number(e.target.value) })} className="fw-input font-bold text-emerald-600" /></div>
                        <div><label className={label}>Payment Mode</label><select value={payForm.paymentMode} onChange={e => setPayForm({ ...payForm, paymentMode: e.target.value })} className="fw-input cursor-pointer"><option>UPI</option><option>Bank Transfer</option><option>Cash</option><option>Cheque</option><option>Other</option></select></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className={label}>Payment Date</label><input type="date" value={payForm.paymentDate} onChange={e => setPayForm({ ...payForm, paymentDate: e.target.value })} className="fw-input cursor-pointer" /></div>
                        <div><label className={label}>Due Date</label><input type="date" value={payForm.dueDate} onChange={e => setPayForm({ ...payForm, dueDate: e.target.value })} className="fw-input cursor-pointer" /></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className={label}>Transaction ID</label><input value={payForm.transactionId} onChange={e => setPayForm({ ...payForm, transactionId: e.target.value })} className="fw-input" placeholder="TRX-..." /></div>
                        <div><label className={label}>Invoice #</label><input value={payForm.invoiceNumber} onChange={e => setPayForm({ ...payForm, invoiceNumber: e.target.value })} className="fw-input" placeholder="INV-..." /></div>
                    </div>
                </form>
            </Modal>

            {/* ─── EXPENSE MODAL ─── */}
            <Modal isOpen={expenseModal} onClose={() => setExpenseModal(false)} title={editExpId ? 'Edit Expense' : 'Log Expense'} maxWidth="max-w-md"
                footer={<>
                    <button type="button" onClick={() => setExpenseModal(false)} className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[13px] font-bold text-slate-600 transition">Cancel</button>
                    <button type="submit" form="exp-form" className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white text-[13px] font-bold rounded-xl shadow-[0_8px_20px_-4px_rgba(239,68,68,0.25)] transition">{editExpId ? 'Update' : 'Save'}</button>
                </>}
            >
                <form id="exp-form" onSubmit={saveExp} className="space-y-5">
                    <div><label className={label}>Title *</label><input required value={expForm.title} onChange={e => setExpForm({ ...expForm, title: e.target.value })} className="fw-input" placeholder="e.g. AWS Hosting" /></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className={label}>Amount (₹)</label><input type="number" required value={expForm.amount} onChange={e => setExpForm({ ...expForm, amount: Number(e.target.value) })} className="fw-input font-bold text-red-600" /></div>
                        <div><label className={label}>Category</label><select value={expForm.category} onChange={e => setExpForm({ ...expForm, category: e.target.value })} className="fw-input cursor-pointer">{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className={label}>Date</label><input type="date" value={expForm.date} onChange={e => setExpForm({ ...expForm, date: e.target.value })} className="fw-input cursor-pointer" /></div>
                        <div><label className={label}>Vendor</label><input value={expForm.vendor} onChange={e => setExpForm({ ...expForm, vendor: e.target.value })} className="fw-input" placeholder="e.g. Amazon" /></div>
                    </div>
                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                        <label className="flex items-center gap-3 cursor-pointer text-[13px] font-bold text-slate-700">
                            <input type="checkbox" checked={expForm.recurring} onChange={e => setExpForm({ ...expForm, recurring: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer" />
                            Recurring expense
                        </label>
                        {expForm.recurring && (
                            <div className="mt-3 pt-3 border-t border-slate-100">
                                <label className={label}>Frequency</label>
                                <select value={expForm.recurringInterval} onChange={e => setExpForm({ ...expForm, recurringInterval: e.target.value })} className="fw-input cursor-pointer">
                                    <option>Monthly</option><option>Quarterly</option><option>Yearly</option>
                                </select>
                            </div>
                        )}
                    </div>
                    <div><label className={label}>Description</label><textarea rows={2} value={expForm.description} onChange={e => setExpForm({ ...expForm, description: e.target.value })} className="fw-input resize-y" placeholder="Optional notes..." /></div>
                </form>
            </Modal>
        </div>
    );
};

export default Payments;
