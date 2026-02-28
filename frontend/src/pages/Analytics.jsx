import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { calcCoreMetrics, buildMonthlyTimeline } from '../utils/calculations';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend
} from 'recharts';
import {
    Users, TrendingUp, Target, Zap, Globe, FolderGit2,
    ArrowUpRight, ArrowDownRight, BarChart3, Filter
} from 'lucide-react';

const ACCENT = ['#6366f1', '#10b981', '#f59e0b', '#0ea5e9', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6'];

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

const MiniCard = ({ label, value, icon: Icon, trend, color = 'indigo' }) => {
    const colorMap = {
        indigo: 'bg-indigo-50 text-indigo-500 border-indigo-100',
        emerald: 'bg-emerald-50 text-emerald-500 border-emerald-100',
        amber: 'bg-amber-50 text-amber-500 border-amber-100',
        sky: 'bg-sky-50 text-sky-500 border-sky-100',
        violet: 'bg-violet-50 text-violet-500 border-violet-100',
    };

    return (
        <div className="group bg-white rounded-[20px] p-5 border border-slate-100/80 hover:border-slate-200 transition-all duration-400 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.06)] cursor-default relative overflow-hidden">
            <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-[12px] border flex items-center justify-center ${colorMap[color]} group-hover:scale-105 transition-transform duration-300`}>
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
        </div>
    );
};

const ChartBox = ({ title, icon: Icon, iconColor = 'indigo', badge, children, className = '' }) => {
    const iconBg = {
        indigo: 'bg-indigo-50 border-indigo-100 text-indigo-500',
        emerald: 'bg-emerald-50 border-emerald-100 text-emerald-500',
        amber: 'bg-amber-50 border-amber-100 text-amber-500',
        sky: 'bg-sky-50 border-sky-100 text-sky-500',
        violet: 'bg-violet-50 border-violet-100 text-violet-500',
    };

    return (
        <div className={`bg-white rounded-[22px] p-6 border border-slate-100/80 relative overflow-hidden ${className}`}>
            <h3 className="text-[13px] font-black text-slate-700 mb-5 flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${iconBg[iconColor]}`}>
                    <Icon className="w-4 h-4" strokeWidth={2.2} />
                </div>
                {title}
                {badge && <span className="ml-auto text-[11px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">{badge}</span>}
            </h3>
            {children}
        </div>
    );
};

const Analytics = () => {
    const { raw, graphs: globalGraphs, metrics: globalMetrics, loading } = useData();
    const [dateRange, setDateRange] = useState('12'); // months

    const { metrics, graphs } = useMemo(() => {
        if (!raw) return { metrics: globalMetrics, graphs: globalGraphs };

        let filteredLeads = raw.leads;
        let filteredClients = raw.clients;
        let filteredProjects = raw.projects;
        let filteredPayments = raw.payments;

        if (dateRange !== 'all') {
            const months = parseInt(dateRange);
            const cutoff = new Date();
            cutoff.setMonth(cutoff.getMonth() - months);

            filteredLeads = raw.leads.filter(l => new Date(l.createdAt) >= cutoff);
            filteredClients = raw.clients.filter(c => new Date(c.createdAt) >= cutoff);
            filteredProjects = raw.projects.filter(p => new Date(p.createdAt) >= cutoff);
            filteredPayments = raw.payments.filter(p => new Date(p.paymentDate || p.createdAt) >= cutoff);
        }

        const now = new Date();
        const m = calcCoreMetrics(filteredClients, filteredLeads, filteredProjects, filteredPayments, raw.expenses, raw.tasks, now);

        return { metrics: m, graphs: globalGraphs };
    }, [raw, dateRange, globalMetrics, globalGraphs]);

    if (loading || !metrics) return (
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
            <div className="w-14 h-14 rounded-full border-[3px] border-violet-500 border-t-transparent animate-spin" />
        </div>
    );

    const pieColors = {
        'Ongoing': '#f59e0b', 'Completed': '#10b981', 'On Hold': '#8b5cf6', 'No Projects': '#e2e8f0',
        'Active': '#10b981', 'Inactive': '#f43f5e', 'No Clients': '#e2e8f0',
        'Converted': '#6366f1', 'Pipeline': '#e2e8f0', 'No Leads': '#e2e8f0',
    };

    const completionRate = metrics.totalProjects > 0 ? ((metrics.completedProjects / metrics.totalProjects) * 100).toFixed(1) : 0;

    return (
        <div className="space-y-7 animate-fadeIn pb-12">
            {/* ─── HEADER WITH FILTERS ─── */}
            <div className="relative bg-white rounded-[26px] p-7 border border-slate-100/80 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-400" />
                <div className="absolute -right-20 -top-20 w-60 h-60 bg-gradient-to-br from-violet-500/5 to-sky-500/5 rounded-full blur-3xl" />
                <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-[28px] font-black text-slate-800 tracking-tight flex items-center gap-2.5">
                            Deep Insights
                        </h1>
                        <p className="text-[13px] font-medium text-slate-400 mt-1">Growth trends & acquisition performance</p>
                    </div>

                    {/* Deep Filtering Context */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="bg-transparent text-[13px] font-bold text-slate-600 outline-none cursor-pointer">
                                <option value="3">Last 3 Months</option>
                                <option value="6">Last 6 Months</option>
                                <option value="12">Last 12 Months</option>
                                <option value="all">All Time</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── KEY PERFORMANCE INDICATORS ─── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MiniCard label="Lead Conversion" value={`${metrics.conversionRate}%`} icon={Target} color="violet" />
                <MiniCard label="Revenue Growth" value={`${metrics.revenueGrowth}%`} icon={TrendingUp} color="emerald" trend={metrics.revenueGrowth} />
                <MiniCard label="Client Acquisition" value={metrics.totalClients} icon={Users} color="sky" sub="Total clients" />
                <MiniCard label="Project Completion" value={`${completionRate}%`} icon={FolderGit2} color="amber" />
            </div>

            {/* ─── GROWTH & TRENDS ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                {/* Annual / Yearly Growth rate */}
                <ChartBox title="Annual Revenue Growth" icon={TrendingUp} iconColor="emerald" className="lg:col-span-3">
                    <div className="w-full" style={{ minHeight: '260px' }}>
                        <ResponsiveContainer width="100%" height={260}>
                            <LineChart data={graphs.yearlyRevenue} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} dy={8} />
                                <YAxis tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`₹${v.toLocaleString()}`, 'Annual Revenue']} cursor={{ stroke: '#e2e8f0', strokeDasharray: '4 4' }} />
                                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 5, fill: '#10b981', strokeWidth: 2.5, stroke: '#fff' }} activeDot={{ r: 7, fill: '#10b981', stroke: '#fff', strokeWidth: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </ChartBox>

                {/* Lead Conversion Distribution Donut */}
                <div className="lg:col-span-2 bg-white rounded-[22px] p-6 border border-slate-100/80 relative flex flex-col">
                    <h3 className="text-[13px] font-black text-slate-700 mb-5 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                            <Target className="w-4 h-4 text-violet-500" />
                        </div>
                        Lead Conversion Quality
                    </h3>
                    <div className="flex-1 flex items-center justify-center relative min-h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={graphs.leadConversionDist} cx="50%" cy="50%" outerRadius={85} innerRadius={55} paddingAngle={4} dataKey="value" stroke="none">
                                    {graphs.leadConversionDist.map((entry, i) => (
                                        <Cell key={i} fill={pieColors[entry.name] || '#e2e8f0'} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={tooltipStyle} />
                                <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700, marginTop: '20px' }} iconType="circle" iconSize={8} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mt-[-10px]">
                            <p className="text-3xl font-black text-slate-800">{metrics.conversionRate}%</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Rate</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── ACQUISITION CHANNELS ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <ChartBox title="Client Acquisition Trend" icon={Users} iconColor="sky">
                    <div className="w-full" style={{ minHeight: '240px' }}>
                        <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={graphs.monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="clientGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.25} />
                                        <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} dy={8} />
                                <YAxis tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, 'Clients Added']} cursor={{ stroke: '#e2e8f0' }} />
                                <Area type="monotone" dataKey="clientsAdded" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#clientGrad)" dot={{ r: 3, fill: '#0ea5e9' }} activeDot={{ r: 5 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </ChartBox>

                <ChartBox title="Lead Source Performance" icon={Globe} iconColor="amber">
                    {graphs.leadSourceDist?.length > 0 ? (
                        <div className="space-y-4 pt-2">
                            {graphs.leadSourceDist.map((src, i) => {
                                const total = graphs.leadSourceDist.reduce((s, d) => s + d.value, 0);
                                const pct = total > 0 ? ((src.value / total) * 100).toFixed(0) : 0;
                                return (
                                    <div key={i} className="group">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-[12px] font-bold text-slate-700">{src.name}</span>
                                            <span className="text-[12px] font-black text-slate-400">{src.value} <span className="text-slate-300 ml-1 font-semibold">({pct}%)</span></span>
                                        </div>
                                        <div className="w-full h-[8px] bg-slate-100/80 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-1000 ease-out group-hover:opacity-80" style={{ width: `${pct}%`, backgroundColor: ACCENT[i % ACCENT.length] }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full pb-8 opacity-40">
                            <Globe className="w-10 h-10 text-slate-300 mb-2" />
                            <p className="text-sm font-bold text-slate-400">No lead source data</p>
                        </div>
                    )}
                </ChartBox>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <ChartBox title="Lead Generation Momentum" icon={Target} iconColor="indigo">
                    <div className="w-full" style={{ minHeight: '240px' }}>
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={graphs.monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="leadAcqGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.6} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} dy={8} />
                                <YAxis tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, 'Leads Added']} cursor={{ fill: 'rgba(99,102,241,0.04)' }} />
                                <Bar dataKey="leadsAdded" fill="url(#leadAcqGrad)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </ChartBox>

                <ChartBox title="Client Status" icon={Users} iconColor="emerald">
                    <div className="flex flex-col items-center justify-center p-2">
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={graphs.clientStatusDist} cx="50%" cy="50%" outerRadius={85} innerRadius={55} paddingAngle={4} dataKey="value" stroke="none">
                                    {graphs.clientStatusDist.map((entry, i) => (
                                        <Cell key={i} fill={pieColors[entry.name] || '#94a3b8'} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={tooltipStyle} />
                                <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: '10px' }} iconType="circle" iconSize={8} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </ChartBox>
            </div>
        </div>
    );
};

export default Analytics;
