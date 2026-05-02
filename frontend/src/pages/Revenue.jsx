import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import {
    Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, CreditCard, 
    Calendar, Users, IndianRupee, ArrowRight, Download
} from 'lucide-react';
import PageLoader from '../components/ui/PageLoader';

const PILL_COLORS = {
    emerald: { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    primary: { bg: 'bg-primary', light: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
    amber: { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
    rose: { bg: 'bg-rose-500', light: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100' },
    sky: { bg: 'bg-sky-500', light: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-100' },
    violet: { bg: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100' },
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
    if (val === undefined || val === null) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
    return `₹${val.toLocaleString()}`;
};

const RevenueCard = ({ label, value, icon: Icon, color = 'primary', trend, sub }) => {
    const c = PILL_COLORS[color];
    return (
        <div className="group relative bg-white rounded-[24px] p-6 border border-slate-100/80 hover:border-slate-200 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] overflow-hidden">
            <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full ${c.bg} opacity-[0.04] blur-2xl group-hover:opacity-[0.08] transition-all duration-700`} />
            
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl ${c.light} border ${c.border} flex items-center justify-center transition-transform duration-500 group-hover:scale-110`}>
                    <Icon className={`w-6 h-6 ${c.text}`} strokeWidth={2} />
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            
            <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <h2 className="text-3xl font-black text-[#111111] tracking-tight">{value}</h2>
                {sub && <p className="text-[12px] font-semibold text-slate-400 mt-2 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-slate-300" /> {sub}
                </p>}
            </div>
        </div>
    );
};

const Revenue = () => {
    const { metrics: m, graphs: g, raw, loading } = useData();
    const { user } = useAuth();

    const topClientsData = useMemo(() => {
        if (!g?.topClients) return [];
        return g.topClients.map(c => ({
            name: c.name.length > 12 ? c.name.substring(0, 10) + '...' : c.name,
            fullName: c.name,
            value: c.value
        }));
    }, [g]);

    const recentPayments = useMemo(() => {
        if (!raw?.payments) return [];
        return [...raw.payments]
            .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
            .slice(0, 8);
    }, [raw?.payments]);

    if (loading) return <PageLoader label="Aggregating Revenue Intelligence..." />;

    return (
        <div className="space-y-8 pb-12 animate-fadeIn">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <IndianRupee className="w-5 h-5 text-primary" />
                        </div>
                        <h1 className="text-3xl font-black text-[#111111] tracking-tight">Revenue Insights</h1>
                    </div>
                    <p className="text-[13px] font-medium text-slate-400">
                        Financial health overview and revenue performance analytics
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                        <Download className="w-4 h-4" /> Export Data
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                        <TrendingUp className="w-4 h-4" /> Reports
                    </button>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <RevenueCard 
                    label="Total Revenue" 
                    value={fmt(m.totalRevenue)} 
                    icon={Wallet} 
                    color="primary" 
                    trend={m.revenueGrowth}
                    sub="Lifetime earnings"
                />
                <RevenueCard 
                    label="This Month" 
                    value={fmt(m.thisMonthRevenue)} 
                    icon={Calendar} 
                    color="emerald" 
                    sub={`${fmt(m.lastMonthRevenue)} last month`}
                />
                <RevenueCard 
                    label="Pending Collection" 
                    value={fmt(m.pendingPayments)} 
                    icon={CreditCard} 
                    color="amber" 
                    sub={`${m.overduePayments > 0 ? fmt(m.overduePayments) + ' overdue' : 'Healthy flow'}`}
                />
                <RevenueCard 
                    label="Avg Deal Value" 
                    value={fmt(m.avgDealValue)} 
                    icon={Users} 
                    color="sky" 
                    sub="Per client average"
                />
            </div>

            {/* Main Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Over Time (Area Chart) */}
                <div className="lg:col-span-2 bg-white rounded-[32px] p-8 border border-slate-100/80 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8">
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-50 rounded-full border border-slate-100 text-[11px] font-bold text-slate-400">
                            <span className="w-2 h-2 rounded-full bg-primary" /> 12 Month Trend
                        </div>
                    </div>
                    <div className="mb-8">
                        <h3 className="text-lg font-black text-[#111111]">Revenue Trajectory</h3>
                        <p className="text-sm text-slate-400">Monthly breakdown of incoming capital</p>
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={g.monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0047FF" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#0047FF" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="month" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                                    tickFormatter={(value) => `₹${value >= 1000 ? value / 1000 + 'k' : value}`}
                                />
                                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
                                <Area 
                                    type="monotone" 
                                    dataKey="revenue" 
                                    stroke="#0047FF" 
                                    strokeWidth={3} 
                                    fillOpacity={1} 
                                    fill="url(#revenueGradient)" 
                                    activeDot={{ r: 6, fill: '#0047FF', stroke: '#fff', strokeWidth: 2 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right Column: Payment Modes & Top Clients */}
                <div className="flex flex-col gap-8">
                    {/* Payment Modes Pie Chart */}
                    <div className="bg-white rounded-[32px] p-8 border border-slate-100/80 shadow-sm">
                        <h3 className="text-lg font-black text-[#111111] mb-6">Payment Channels</h3>
                        <div className="h-[220px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={g.paymentModeDist}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={85}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {g.paymentModeDist.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#0047FF', '#10b981', '#f59e0b', '#8b5cf6'][index % 4]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-3 mt-4">
                            {g.paymentModeDist.map((item, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#0047FF', '#10b981', '#f59e0b', '#8b5cf6'][index % 4] }} />
                                        <span className="text-xs font-bold text-slate-600">{item.name}</span>
                                    </div>
                                    <span className="text-xs font-black text-slate-900">{fmt(item.value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Clients Mini List */}
                    <div className="bg-white rounded-[32px] p-8 border border-slate-100/80 shadow-sm flex-1">
                        <h3 className="text-lg font-black text-[#111111] mb-5">Top Revenue Sources</h3>
                        <div className="space-y-4">
                            {topClientsData.map((client, i) => (
                                <div key={i} className="group/item">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-sm font-bold text-slate-700 group-hover/item:text-primary transition-colors">{client.fullName}</span>
                                        <span className="text-sm font-black text-slate-900">{fmt(client.value)}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-primary rounded-full transition-all duration-1000" 
                                            style={{ width: `${(client.value / topClientsData[0].value) * 100}%` }} 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Recent Transactions */}
            <div className="bg-white rounded-[32px] border border-slate-100/80 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-black text-[#111111]">Recent Payments</h3>
                        <p className="text-sm text-slate-400">Latest incoming transactions across the platform</p>
                    </div>
                    <button className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
                        View All Payments <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                                <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Channel</th>
                                <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {recentPayments.map((p, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-black">
                                                {p.client?.name?.charAt(0) || 'C'}
                                            </div>
                                            <span className="text-sm font-bold text-[#111111]">{p.client?.name || 'Unknown Client'}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-sm font-medium text-slate-500">{new Date(p.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-sm font-black text-[#111111]">₹{p.paidAmount?.toLocaleString()}</span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="px-3 py-1 rounded-lg bg-slate-100 text-[11px] font-bold text-slate-600">{p.paymentMode}</span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold ${
                                            p.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 
                                            p.status === 'Partial' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                                        }`}>
                                            {p.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Revenue;
