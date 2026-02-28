import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    Users, Wallet, TrendingUp, FolderGit2, Target, CalendarCheck,
    Activity as ActivityIcon, ArrowUpRight, ArrowDownRight, Zap
} from 'lucide-react';

const PILL_COLORS = {
    emerald: { bg: 'bg-emerald-500', glow: 'shadow-emerald-500/25', light: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    indigo: { bg: 'bg-indigo-500', glow: 'shadow-indigo-500/25', light: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
    amber: { bg: 'bg-amber-500', glow: 'shadow-amber-500/25', light: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
    rose: { bg: 'bg-rose-500', glow: 'shadow-rose-500/25', light: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100' },
    sky: { bg: 'bg-sky-500', glow: 'shadow-sky-500/25', light: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-100' },
    violet: { bg: 'bg-violet-500', glow: 'shadow-violet-500/25', light: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100' },
};

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

const fmt = (val) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
    return `₹${val.toLocaleString()}`;
};

const KPICard = ({ label, value, icon: Icon, color = 'indigo', trend, sub }) => {
    const c = PILL_COLORS[color];
    return (
        <div className="group relative bg-white flex flex-col justify-between rounded-[22px] p-5 border border-slate-100/80 hover:border-slate-200 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] cursor-default overflow-hidden">
            <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full ${c.bg} opacity-[0.06] blur-2xl group-hover:opacity-[0.12] group-hover:scale-150 transition-all duration-700`} />

            <div className="relative z-10 flex items-start justify-between mb-3">
                <div className={`w-11 h-11 rounded-[14px] ${c.light} ${c.border} border flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-[18px] h-[18px] ${c.text}`} strokeWidth={2.2} />
                </div>
                {trend !== undefined && trend !== null && (
                    <div className={`flex items-center gap-0.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider ${Number(trend) >= 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                        {Number(trend) >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <div className="relative z-10">
                <p className="text-[10.5px] font-black text-slate-400 uppercase tracking-[0.12em] mb-1">{label}</p>
                <p className="text-[26px] font-black text-slate-800 tracking-tight leading-none">{value}</p>
                {sub && <p className="text-[11px] font-semibold text-slate-400 mt-1.5">{sub}</p>}
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { user } = useAuth();
    const { metrics: c, graphs: g, raw, loading } = useData();
    const isSales = user?.role === 'sales';

    if (loading || !c) return (
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
            <div className="relative">
                <div className="w-14 h-14 rounded-full border-[3px] border-slate-100" />
                <div className="absolute inset-0 w-14 h-14 rounded-full border-[3px] border-indigo-500 border-t-transparent animate-spin" />
                <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500" />
            </div>
        </div>
    );

    const pieColors = {
        'Ongoing': '#f59e0b',
        'Completed': '#10b981',
        'On Hold': '#8b5cf6',
        'No Projects': '#e2e8f0',
        'Converted': '#6366f1',
        'Pipeline': '#e2e8f0',
        'No Leads': '#e2e8f0',
    };

    return (
        <div className="space-y-7 animate-fadeIn pb-12">
            {/* ─── HEADER ─── */}
            <div className="relative bg-white rounded-[26px] p-7 border border-slate-100/80 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400" />
                <div className="absolute -right-20 -top-20 w-60 h-60 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 rounded-full blur-3xl" />
                <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <h1 className="text-[28px] font-black text-slate-800 tracking-tight flex items-center gap-2.5">
                            Command Center
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                            </span>
                        </h1>
                        <p className="text-[13px] font-medium text-slate-400 mt-1">
                            Welcome back, <span className="font-bold text-indigo-500">{user?.name}</span> — Master Overview
                        </p>
                    </div>
                </div>
            </div>

            {/* ─── SUMMARY CARDS ─── */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-4">
                <KPICard label="Total Leads" value={c.totalLeads} icon={Target} color="amber" sub={`${c.conversionRate}% conversion`} />
                <KPICard label="Total Clients" value={c.totalClients} icon={Users} color="sky" sub={`${c.activeClients} active`} />
                <KPICard label="Active Projects" value={c.ongoingProjects} icon={FolderGit2} color="indigo" sub={`${c.totalProjects} total projects`} />
                {!isSales && <KPICard label="Total Revenue" value={fmt(c.totalRevenue)} icon={Wallet} color="emerald" trend={c.revenueGrowth} />}
                {!isSales && <KPICard label="Total Expenses" value={fmt(c.totalExpenses)} icon={Wallet} color="rose" sub="All time" />}
                {!isSales && <KPICard label="Net Profit" value={fmt(c.netProfit)} icon={TrendingUp} color={c.netProfit >= 0 ? 'violet' : 'rose'} sub={`${c.profitMargin}% margin`} />}
                {!isSales && <KPICard label="Pending Payments" value={fmt(c.pendingPayments)} icon={Wallet} color="amber" sub={`₹${c.overduePayments.toLocaleString()} overdue`} />}
                <KPICard label="Tasks Due Today" value={c.tasksDueToday} icon={CalendarCheck} color="rose" sub={`${c.pendingTasks} pending total`} />
            </div>

            {/* ─── CHARTS SECTION ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Revenue Chart */}
                {!isSales && (
                    <div className="lg:col-span-2 bg-white rounded-[22px] p-6 border border-slate-100/80 relative overflow-hidden group">
                        <div className="absolute -left-20 -top-20 w-52 h-52 bg-indigo-500/[0.03] rounded-full blur-3xl group-hover:bg-indigo-500/[0.06] transition-all duration-700" />
                        <h3 className="text-[14px] font-black text-slate-700 mb-5 flex items-center gap-2 relative z-10">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-indigo-500" />
                            </div>
                            Revenue Trend
                            <span className="ml-auto text-[11px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">Last 12 months</span>
                        </h3>
                        <div className="relative z-10 w-full h-[320px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={g.monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} dy={8} />
                                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`₹${v.toLocaleString()}`, 'Revenue']} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
                                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#revGrad2)" dot={false} activeDot={{ r: 5, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Project Status Donut and Activity Feed right columns */}
                <div className={`${!isSales ? 'lg:col-span-1' : 'lg:col-span-3'} flex flex-col gap-5`}>
                    <div className="bg-white rounded-[22px] p-6 border border-slate-100/80 shrink-0">
                        <h3 className="text-[14px] font-black text-slate-700 mb-3 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                                <FolderGit2 className="w-4 h-4 text-amber-500" />
                            </div>
                            Project Status
                        </h3>
                        <div className="flex items-center justify-center h-[180px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={g.projectStatusDist} cx="50%" cy="50%" outerRadius={70} innerRadius={48} paddingAngle={3} dataKey="value" stroke="none">
                                        {g.projectStatusDist.map((entry, i) => (
                                            <Cell key={i} fill={pieColors[entry.name] || '#94a3b8'} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} iconType="circle" iconSize={8} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white rounded-[22px] p-6 border border-slate-100/80 flex flex-col flex-1 min-h-0 max-h-[350px]">
                        <h3 className="text-[14px] font-black text-slate-700 mb-3 flex items-center gap-2 shrink-0">
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                <ActivityIcon className="w-4 h-4 text-emerald-500" />
                            </div>
                            Recent Activity
                            <span className="relative flex h-2 w-2 ml-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                        </h3>
                        <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {raw.recentActivities?.length > 0 ? raw.recentActivities.map((a, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group/activity">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-500 text-[12px] font-black shrink-0 group-hover/activity:border-indigo-200 group-hover/activity:text-indigo-600 transition-colors">
                                        {a.user?.name?.[0] || '?'}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[13px] text-slate-600 leading-snug">
                                            <span className="font-bold text-slate-800">{a.user?.name}</span>{' '}
                                            <span className="font-medium">{a.action}</span>
                                        </p>
                                        {a.details && <p className="text-[11px] font-medium text-slate-400 mt-0.5 truncate">{a.details}</p>}
                                    </div>
                                </div>
                            )) : (
                                <div className="flex flex-col items-center justify-center h-full opacity-40">
                                    <ActivityIcon className="w-10 h-10 text-slate-300 mb-2" />
                                    <p className="text-sm font-bold text-slate-400">Awaiting activity...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
