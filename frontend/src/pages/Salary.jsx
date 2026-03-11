import React, { useState, useMemo } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Users, Briefcase, Plus, Edit3, Trash2, DollarSign, Wallet, Calendar, Clock } from 'lucide-react';

const fmt = (val) => {
    if (!val || val === 0) return '₹0';
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
    return `₹${val.toLocaleString()}`;
};

const FinanceCard = ({ label, value, icon: Icon, color = 'indigo', sub }) => {
    const colorMap = {
        emerald: { light: 'bg-emerald-50', text: 'text-emerald-500', border: 'border-emerald-100' },
        indigo: { light: 'bg-indigo-50', text: 'text-indigo-500', border: 'border-indigo-100' },
        rose: { light: 'bg-rose-50', text: 'text-rose-500', border: 'border-rose-100' },
        amber: { light: 'bg-amber-50', text: 'text-amber-500', border: 'border-amber-100' },
        sky: { light: 'bg-sky-50', text: 'text-sky-500', border: 'border-sky-100' }
    };
    const c = colorMap[color] || colorMap.indigo;

    return (
        <div className="group bg-white rounded-[20px] p-5 border border-slate-100/80 hover:border-slate-200 transition-all duration-400 hover:-translate-y-0.5 cursor-default relative overflow-hidden">
            <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-[12px] border flex items-center justify-center ${c.light} ${c.border} ${c.text} group-hover:scale-105 transition-transform duration-300`}>
                    <Icon className="w-[17px] h-[17px]" strokeWidth={2.2} />
                </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.12em] mb-0.5">{label}</p>
            <p className="text-[22px] font-black text-slate-800 tracking-tight">{value}</p>
            {sub && <p className="text-[11px] font-semibold text-slate-400 mt-1">{sub}</p>}
        </div>
    );
};

const Salary = () => {
    const { raw, refreshData } = useData();
    const { user } = useAuth();
    
    const [tab, setTab] = useState('setup'); // 'setup', 'history'

    // Form Modals
    const [configModal, setConfigModal] = useState(false);
    const [paymentModal, setPaymentModal] = useState(false);
    
    const [editConfigId, setEditConfigId] = useState(null);
    const [configForm, setConfigForm] = useState({ personName: '', role: 'Employee', designation: '', monthlySalary: 0, status: 'Active' });
    
    // For paying salary
    const [selectedConfig, setSelectedConfig] = useState(null);
    const [payForm, setPayForm] = useState({ 
        month: '', 
        fromDate: '',
        toDate: '',
        amount: 0, 
        paymentMethod: 'Bank Transfer', 
        notes: '', 
        date: '' 
    });

    const configData = raw?.salaryConfig || [];
    const paymentsData = raw?.salaryPayments || [];

    const employees = configData.filter(c => c.role === 'Employee');
    const founders = configData.filter(c => c.role === 'Founder');

    // Metrics (based on configurations for total monthly commitment)
    const totalEmpSalary = employees.reduce((acc, curr) => acc + (curr.monthlySalary || 0), 0);
    const totalFounderSalary = founders.reduce((acc, curr) => acc + (curr.monthlySalary || 0), 0);
    const totalMonthlySalary = totalEmpSalary + totalFounderSalary;

    // Config CRUD
    const openConfigAdd = () => {
        setConfigForm({ personName: '', role: 'Employee', designation: '', monthlySalary: 0, status: 'Active' });
        setEditConfigId(null);
        setConfigModal(true);
    };

    const openConfigEdit = (c) => {
        setConfigForm({ ...c });
        setEditConfigId(c._id);
        setConfigModal(true);
    };

    const saveConfig = async (e) => {
        e.preventDefault();
        try {
            if (editConfigId) {
                await api.put(`/salaries/config/${editConfigId}`, configForm);
                toast.success('Salary updated');
            } else {
                await api.post('/salaries/config', configForm);
                toast.success('Salary added');
            }
            refreshData();
            setConfigModal(false);
        } catch (err) {
            toast.error('Failed to save salary info');
        }
    };

    // Payment Logic
    const openPayModal = (c) => {
        setSelectedConfig(c);
        
        // Auto select current month format: March 2026
        const date = new Date();
        const monthName = date.toLocaleString('default', { month: 'long' });
        const year = date.getFullYear();
        
        const firstDay = new Date(year, date.getMonth(), 1).toISOString().slice(0, 10);
        const lastDay = new Date(year, date.getMonth() + 1, 0).toISOString().slice(0, 10);

        setPayForm({
            month: `${monthName} ${year}`,
            fromDate: firstDay,
            toDate: lastDay,
            amount: c.monthlySalary,
            paymentMethod: 'Bank Transfer',
            notes: `Salary for ${monthName} ${year}`,
            date: new Date().toISOString().slice(0, 10)
        });
        setPaymentModal(true);
    };

    const savePayment = async (e) => {
        e.preventDefault();
        try {
            await api.post('/salaries/payments', {
                personName: selectedConfig.personName,
                role: selectedConfig.role,
                ...payForm
            });
            toast.success('Salary payment recorded & expense updated');
            refreshData();
            setPaymentModal(false);
        } catch (err) {
            console.error(err.response?.data || err);
            toast.error(err.response?.data?.message || 'Failed to record payment');
        }
    };

    const removePayment = async (id) => {
        if (!window.confirm('Delete this salary payment? This will also remove the linked expense.')) return;
        try {
            await api.delete(`/salaries/payments/${id}`);
            toast.success('Payment deleted');
            refreshData();
        } catch (err) {
            toast.error('Failed to delete payment');
        }
    };

    return (
        <div className="space-y-7 animate-fadeIn pb-12">
            {/* HEADER */}
            <div className="relative bg-white rounded-[26px] p-7 border border-slate-100/80 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-400 to-sky-500" />
                <div className="absolute -right-20 -top-20 w-60 h-60 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-full blur-3xl" />
                <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-[28px] font-black text-slate-800 tracking-tight flex items-center gap-2.5">
                            Salary Management
                        </h1>
                        <p className="text-[13px] font-medium text-slate-400 mt-1">Manage employee and founder compensation</p>
                    </div>
                    {user?.role === 'admin' && (
                        <button onClick={openConfigAdd} className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-[12px] font-bold rounded-xl border border-indigo-200 transition-all">
                            <Plus className="w-3.5 h-3.5" /> Assign New Salary
                        </button>
                    )}
                </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FinanceCard label="Total Monthly Salaries" value={fmt(totalMonthlySalary)} icon={Wallet} color="indigo" sub="Expected total outgo" />
                <FinanceCard label="Employee Salaries" value={fmt(totalEmpSalary)} icon={Users} color="emerald" sub="Total monthly commitment" />
                <FinanceCard label="Founder Salaries" value={fmt(totalFounderSalary)} icon={Briefcase} color="amber" sub="Total monthly commitment" />
            </div>

            {/* TAB NAVIGATION */}
            <div className="max-w-full overflow-x-auto pb-2 -mb-2 custom-scrollbar">
                <div className="inline-flex items-center gap-1.5 p-1.5 bg-slate-50 rounded-2xl border border-slate-100 w-max">
                    {[
                        { id: 'setup', label: 'Salary Setup', icon: Briefcase },
                        { id: 'history', label: 'Payment History', icon: Clock }
                    ].map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-5 py-2.5 text-[13px] font-bold rounded-xl transition-all duration-200 whitespace-nowrap shrink-0 ${tab === t.id ? 'bg-white text-slate-800 shadow-sm border border-slate-200/60' : 'text-slate-400 hover:text-slate-600'}`}>
                            <t.icon className="w-4 h-4" />
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ═══ TABS ═══ */}
            {tab === 'setup' && (
                <div className="space-y-6 animate-slideIn">
                    {/* Employees */}
                    <div className="bg-white rounded-[22px] overflow-hidden border border-slate-100/80">
                        <div className="px-6 py-5 border-b border-slate-100">
                            <h3 className="text-[14px] font-black text-slate-700">Employee Salaries</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-100">
                                        {['Employee Name', 'Designation', 'Monthly Salary', 'Status', 'Action'].map(h => (
                                            <th key={h} className="text-left px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.map(c => (
                                        <tr key={c._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <td className="px-5 py-3.5"><span className="font-bold text-[13px] text-slate-800">{c.personName}</span></td>
                                            <td className="px-5 py-3.5 text-[12px] font-medium text-slate-500">{c.designation || '—'}</td>
                                            <td className="px-5 py-3.5 text-[13px] font-extrabold text-indigo-600">₹{c.monthlySalary?.toLocaleString()}</td>
                                            <td className="px-5 py-3.5">
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${c.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 flex gap-2">
                                                {user?.role === 'admin' && (
                                                    <>
                                                        <button onClick={() => openConfigEdit(c)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-500 transition-colors">
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => openPayModal(c)} className="flex items-center gap-1 px-3 h-8 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-[11px] font-bold rounded-lg transition-colors">
                                                            <DollarSign className="w-3 h-3" /> Pay Source
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {employees.length === 0 && (
                                        <tr><td colSpan="5" className="text-center py-10 text-slate-400 text-[13px] font-medium">No employees added yet</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Founders */}
                    <div className="bg-white rounded-[22px] overflow-hidden border border-slate-100/80">
                        <div className="px-6 py-5 border-b border-slate-100">
                            <h3 className="text-[14px] font-black text-slate-700">Founder Salaries</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-100">
                                        {['Founder Name', 'Monthly Salary', 'Status', 'Action'].map(h => (
                                            <th key={h} className="text-left px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {founders.map(c => (
                                        <tr key={c._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <td className="px-5 py-3.5"><span className="font-bold text-[13px] text-slate-800">{c.personName}</span></td>
                                            <td className="px-5 py-3.5 text-[13px] font-extrabold text-indigo-600">₹{c.monthlySalary?.toLocaleString()}</td>
                                            <td className="px-5 py-3.5">
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${c.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 flex gap-2">
                                                {user?.role === 'admin' && (
                                                    <>
                                                        <button onClick={() => openConfigEdit(c)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-500 transition-colors">
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => openPayModal(c)} className="flex items-center gap-1 px-3 h-8 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-[11px] font-bold rounded-lg transition-colors">
                                                            <DollarSign className="w-3 h-3" /> Pay Source
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {founders.length === 0 && (
                                         <tr><td colSpan="4" className="text-center py-10 text-slate-400 text-[13px] font-medium">No founders added yet</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'history' && (
                <div className="bg-white rounded-[22px] overflow-hidden border border-slate-100/80 animate-slideIn">
                    <div className="px-6 py-5 border-b border-slate-100">
                        <h3 className="text-[14px] font-black text-slate-700">Salary Payment History</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100">
                                    {['Date', 'Name', 'Role', 'Month', 'Amount', 'Method', 'Notes', 'Added By', ''].map(h => (
                                        <th key={h} className="text-left px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paymentsData.map(p => (
                                    <tr key={p._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-5 py-3.5 text-[12px] font-medium text-slate-400">{p.date ? new Date(p.date).toLocaleDateString() : '—'}</td>
                                        <td className="px-5 py-3.5"><span className="font-bold text-[13px] text-slate-800">{p.personName}</span></td>
                                        <td className="px-5 py-3.5 text-[12px] font-semibold text-slate-500">{p.role}</td>
                                        <td className="px-5 py-3.5 text-[12px] font-bold text-slate-700">
                                            <div className="bg-slate-50/50 rounded-lg px-2 flex flex-col gap-0.5">
                                                <span className="text-indigo-600 block">{p.month}</span>
                                                {p.fromDate && p.toDate && (
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                        {new Date(p.fromDate).toLocaleDateString()} - {new Date(p.toDate).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-[13px] font-extrabold text-emerald-600">₹{p.amount?.toLocaleString()}</td>
                                        <td className="px-5 py-3.5 text-[12px] font-medium text-slate-500">{p.paymentMethod || '—'}</td>
                                        <td className="px-5 py-3.5 text-[12px] font-medium text-slate-500 max-w-[150px] truncate">{p.notes || '—'}</td>
                                        <td className="px-5 py-3.5 text-[12px] font-medium text-slate-400">{p.addedBy?.name || '—'}</td>
                                        <td className="px-5 py-3.5">
                                            {user?.role === 'admin' && (
                                                <button onClick={() => removePayment(p._id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {paymentsData.length === 0 && (
                                    <tr><td colSpan="9" className="text-center py-16 text-slate-400 text-[13px] font-medium">No salary payments recorded yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODALS */}
            
            {/* Setup Salary Modal */}
            <Modal isOpen={configModal} onClose={() => setConfigModal(false)} title={editConfigId ? 'Edit Salary' : 'Assign New Salary'} maxWidth="max-w-md">
                <form onSubmit={saveConfig} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Role</label>
                            <select className="fw-input py-2.5 text-sm" value={configForm.role} onChange={e => setConfigForm({ ...configForm, role: e.target.value })} required>
                                <option value="Employee">Employee</option>
                                <option value="Founder">Founder</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Status</label>
                            <select className="fw-input py-2.5 text-sm" value={configForm.status} onChange={e => setConfigForm({ ...configForm, status: e.target.value })} required>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Name</label>
                        <input type="text" className="fw-input py-2.5 text-sm" value={configForm.personName} onChange={e => setConfigForm({ ...configForm, personName: e.target.value })} placeholder="e.g Rahul" required />
                    </div>
                    {configForm.role === 'Employee' && (
                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Designation</label>
                            <input type="text" className="fw-input py-2.5 text-sm" value={configForm.designation} onChange={e => setConfigForm({ ...configForm, designation: e.target.value })} placeholder="e.g Developer" />
                        </div>
                    )}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Monthly Salary</label>
                        <input type="number" className="fw-input py-2.5 text-sm" value={configForm.monthlySalary} onChange={e => setConfigForm({ ...configForm, monthlySalary: Number(e.target.value) })} required />
                    </div>
                    
                    <div className="flex gap-3 justify-end mt-6">
                        <button type="button" onClick={() => setConfigModal(false)} className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[13px] font-bold text-slate-600 transition">Cancel</button>
                        <button type="submit" className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-[13px] font-bold rounded-xl shadow-[0_8px_20px_-4px_rgba(99,102,241,0.25)] transition">Save Setup</button>
                    </div>
                </form>
            </Modal>

            {/* Pay Salary Modal */}
            <Modal isOpen={paymentModal} onClose={() => setPaymentModal(false)} title="Pay Salary" maxWidth="max-w-md">
                {selectedConfig && (
                    <form onSubmit={savePayment} className="space-y-4">
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex justify-between items-center mb-2">
                            <div>
                                <p className="text-[14px] font-black text-slate-800">{selectedConfig.personName}</p>
                                <p className="text-[11px] font-bold text-slate-400 uppercase">{selectedConfig.role}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[14px] font-black text-indigo-600">₹{selectedConfig.monthlySalary?.toLocaleString()}</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Salary Month Label</label>
                            <input type="text" className="fw-input py-2.5 text-sm" value={payForm.month} onChange={e => setPayForm({ ...payForm, month: e.target.value })} placeholder="e.g March 2026" required />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Work Period Start</label>
                                <input type="date" className="fw-input py-2.5 text-sm" value={payForm.fromDate} onChange={e => setPayForm({ ...payForm, fromDate: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Work Period End</label>
                                <input type="date" className="fw-input py-2.5 text-sm" value={payForm.toDate} onChange={e => setPayForm({ ...payForm, toDate: e.target.value })} required />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Amount Paid</label>
                                <input type="number" className="fw-input py-2.5 text-sm" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: Number(e.target.value) })} required />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Date</label>
                                <input type="date" className="fw-input py-2.5 text-sm" value={payForm.date} onChange={e => setPayForm({ ...payForm, date: e.target.value })} required />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Payment Method</label>
                            <select className="fw-input py-2.5 text-sm" value={payForm.paymentMethod} onChange={e => setPayForm({ ...payForm, paymentMethod: e.target.value })}>
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="UPI">UPI</option>
                                <option value="Cash">Cash</option>
                                <option value="Cheque">Cheque</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Admin Notes</label>
                            <textarea className="fw-input py-2.5 text-sm" value={payForm.notes} onChange={e => setPayForm({ ...payForm, notes: e.target.value })} rows="2"></textarea>
                        </div>

                        <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 flex items-start gap-2">
                            <Calendar className="w-5 h-5 text-amber-500 shrink-0" />
                            <p className="text-[11px] font-semibold text-amber-600 mt-0.5 leading-tight">Paying this salary will automatically record an expense inside the Finance system.</p>
                        </div>

                        <div className="flex gap-3 justify-end mt-4">
                            <button type="button" onClick={() => setPaymentModal(false)} className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[13px] font-bold text-slate-600 transition">Cancel</button>
                            <button type="submit" className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-bold rounded-xl shadow-[0_8px_20px_-4px_rgba(16,185,129,0.25)] transition">Confirm Payment</button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
};

export default Salary;
