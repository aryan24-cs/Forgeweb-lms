import React, { useState, useMemo } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import { useData } from '../context/DataContext';

const STATUS_LIST = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];
const SOURCE_LIST = ['Instagram', 'Website', 'Referral', 'Cold DM', 'LinkedIn', 'Google Ads', 'Facebook', 'Other'];
const SERVICE_LIST = ['Website', 'SEO', 'Marketing', 'Automation', 'Graphic Design', 'Social Media', 'Other'];

const STATUS_COLORS = {
    'New': 'bg-indigo-50 text-indigo-700 border border-indigo-100',
    'Contacted': 'bg-amber-50 text-amber-700 border border-amber-100',
    'Qualified': 'bg-sky-50 text-sky-700 border border-sky-100',
    'Proposal Sent': 'bg-violet-50 text-violet-700 border border-violet-100',
    'Negotiation': 'bg-orange-50 text-orange-700 border border-orange-100',
    'Won': 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    'Lost': 'bg-red-50 text-red-700 border border-red-100',
};

const emptyForm = { name: '', company: '', phone: '', email: '', source: 'Website', serviceInterested: 'Website', estimatedBudget: 0, status: 'New', notes: '', followUpDate: '' };

const Leads = () => {
    const { raw, refreshData } = useData();
    const [modal, setModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [view, setView] = useState('table');

    // Client-side filtering using SSOT global leads
    const leads = useMemo(() => {
        if (!raw?.leads) return [];
        return raw.leads.filter(l => {
            const matchSearch = search ? l.name?.toLowerCase().includes(search.toLowerCase()) || l.company?.toLowerCase().includes(search.toLowerCase()) : true;
            const matchStatus = filterStatus ? l.status === filterStatus : true;
            return matchSearch && matchStatus;
        });
    }, [raw?.leads, search, filterStatus]);

    const openAdd = () => { setForm(emptyForm); setEditId(null); setModal(true); };
    const openEdit = (lead) => {
        setForm({ ...lead, followUpDate: lead.followUpDate ? lead.followUpDate.slice(0, 10) : '' });
        setEditId(lead._id);
        setModal(true);
    };

    const save = async (e) => {
        e.preventDefault();
        try {
            if (editId) await api.put(`/leads/${editId}`, form);
            else await api.post('/leads', form);
            toast.success(editId ? 'Lead updated successfully!' : 'New lead captured!');
            setModal(false);
            refreshData(); // 🔥 Update Global SSOT
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed processing lead');
        }
    };

    const remove = async (id) => {
        if (!confirm('Are you sure you want to permanently delete this lead?')) return;
        await api.delete(`/leads/${id}`);
        toast.success('Lead permanently deleted');
        refreshData();
    };

    const convert = async (id) => {
        if (!confirm('Convert this lead to an active client?')) return;
        await api.post(`/leads/${id}/convert`);
        toast.success('Lead successfully converted to Client!');
        refreshData(); // 🔥 Instantly reflects in Clients page and Dashboard Net Profit / Conversions!
    };

    const label = "block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide";

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Sales Pipeline</h1>
                    <p className="text-base text-slate-500 mt-1 font-medium">{leads.length} active opportunities tracked</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setView(view === 'table' ? 'kanban' : 'table')} className="px-5 py-2.5 text-[13px] font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm transition-all uppercase tracking-wider">
                        {view === 'table' ? 'Board View' : 'List View'}
                    </button>
                    <button onClick={openAdd} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold rounded-xl shadow-[0_8px_20px_-4px_rgba(79,70,229,0.3)] hover:shadow-[0_12px_24px_-6px_rgba(79,70,229,0.4)] transition-all uppercase tracking-wider">
                        + New Lead
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 bg-white/50 backdrop-blur-md p-4 rounded-2xl border border-slate-200/50 shadow-sm">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <svg className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search opportunities..." className="fw-input pl-11 !bg-white" />
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="fw-input max-w-[200px] !bg-white cursor-pointer appearance-none select-wrapper">
                    <option value="">All Stages</option>
                    {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
                </select>
            </div>

            {/* Table View */}
            {view === 'table' && (
                <div className="fw-card overflow-hidden border-transparent shadow-[0_8px_30px_rgba(0,0,0,0.04)] ring-1 ring-slate-200">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200">
                                    {['Opportunity', 'Company', 'Source', 'Service', 'Value', 'Pipeline Stage', ''].map(h => (
                                        <th key={h} className="text-left px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {leads.map(l => (
                                    <tr key={l._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 cursor-pointer" onClick={() => openEdit(l)}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center text-white text-[14px] font-bold shadow-md shadow-indigo-500/20">{l.name?.charAt(0)}</div>
                                                <div>
                                                    <p className="font-bold text-[14px] text-slate-800 leading-tight">{l.name}</p>
                                                    <p className="text-[12px] font-medium text-slate-500 mt-0.5">{l.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-[14px] font-semibold text-slate-600">{l.company || '-'}</td>
                                        <td className="px-6 py-4"><span className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600">{l.source}</span></td>
                                        <td className="px-6 py-4 text-[14px] font-semibold text-slate-600">{l.serviceInterested}</td>
                                        <td className="px-6 py-4 text-[14px] font-black text-indigo-600">₹{(l.estimatedBudget || 0).toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[11px] font-bold px-3 py-1.5 rounded-lg ${STATUS_COLORS[l.status] || ''}`}>{l.status}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEdit(l)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-500 hover:text-indigo-600 transition" title="Edit">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </button>
                                                {l.status !== 'Won' && l.status !== 'Lost' && (
                                                    <button onClick={() => convert(l._id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-emerald-100 text-slate-500 hover:text-emerald-600 transition" title="Win & Convert to Client">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    </button>
                                                )}
                                                <button onClick={() => remove(l._id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 text-slate-500 hover:text-red-600 transition" title="Delete">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {leads.length === 0 && (
                                    <tr><td colSpan="7" className="text-center py-20 text-slate-400 text-[14px] font-semibold">Pipeline empty. Start acquiring new leads!</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Kanban View */}
            {view === 'kanban' && (
                <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar">
                    {STATUS_LIST.map(status => (
                        <div key={status} className="min-w-[320px] w-[320px] flex-shrink-0 flex flex-col">
                            <div className="flex items-center justify-between mb-4 bg-slate-100/80 px-4 py-3 rounded-xl border border-slate-200/60">
                                <span className={`text-[11px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest ${STATUS_COLORS[status]}`}>{status}</span>
                                <span className="text-[13px] font-bold text-slate-500">{leads.filter(l => l.status === status).length} deals</span>
                            </div>
                            <div className="space-y-4 flex-1">
                                {leads.filter(l => l.status === status).map(l => (
                                    <div key={l._id} className="bg-white rounded-2xl border border-slate-200/80 p-5 group hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_12px_24px_-8px_rgba(79,70,229,0.15)] transition-all duration-300 relative">
                                        <div className="flex justify-between items-start mb-3 cursor-pointer" onClick={() => openEdit(l)}>
                                            <p className="font-bold text-[15px] text-slate-800 leading-tight">{l.name}</p>
                                            <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-500 uppercase tracking-widest">{l.source}</span>
                                        </div>
                                        <p className="text-[13px] font-medium text-slate-500 mb-4 cursor-pointer" onClick={() => openEdit(l)}>{l.company || 'Independent Lead'}</p>
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                            <span className="text-[14px] font-black text-indigo-600">₹{(l.estimatedBudget || 0).toLocaleString()}</span>
                                            {l.serviceInterested && <span className="text-[12px] font-semibold text-slate-400">{l.serviceInterested}</span>}
                                        </div>
                                        <div className="absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {l.status !== 'Won' && l.status !== 'Lost' && (
                                                <button onClick={() => convert(l._id)} className="w-8 h-8 bg-white border border-slate-200 shadow-sm flex items-center justify-center rounded-lg hover:bg-emerald-100 text-emerald-500 transition" title="Win & Convert to Client">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                </button>
                                            )}
                                            <button onClick={() => remove(l._id)} className="w-8 h-8 bg-white border border-slate-200 shadow-sm flex items-center justify-center rounded-lg hover:bg-red-100 text-red-500 transition" title="Delete">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {leads.filter(l => l.status === status).length === 0 && (
                                    <div className="h-24 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-[13px] font-semibold text-slate-400">
                                        Drop to {status}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <Modal
                isOpen={modal}
                onClose={() => setModal(false)}
                title={editId ? 'Modify Opportunity' : 'New Opportunity'}
                footer={
                    <>
                        <button type="button" onClick={() => setModal(false)} className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-bold text-slate-600 transition">Discard</button>
                        <button type="submit" form="lead-form" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-[0_8px_20px_-4px_rgba(79,70,229,0.3)] transition">
                            {editId ? 'Update Sequence' : 'Commit to Pipeline'}
                        </button>
                    </>
                }
            >
                <form id="lead-form" onSubmit={save} className="space-y-6 px-1 py-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className={label}>Client Name *</label>
                            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="fw-input" placeholder="E.g. Elon Musk" />
                        </div>
                        <div>
                            <label className={label}>Business / Company</label>
                            <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="fw-input" placeholder="X Corp" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className={label}>Phone</label>
                            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="fw-input" placeholder="+91 98765 43210" />
                        </div>
                        <div>
                            <label className={label}>Email</label>
                            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="fw-input" placeholder="elon@x.com" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className={label}>Intake Source</label>
                            <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className="fw-input cursor-pointer appearance-none select-wrapper">
                                {SOURCE_LIST.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={label}>Desired Service</label>
                            <select value={form.serviceInterested} onChange={e => setForm({ ...form, serviceInterested: e.target.value })} className="fw-input cursor-pointer appearance-none select-wrapper">
                                {SERVICE_LIST.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className={label}>Projected Value (₹)</label>
                            <input type="number" value={form.estimatedBudget} onChange={e => setForm({ ...form, estimatedBudget: Number(e.target.value) })} className="fw-input font-semibold text-indigo-700" />
                        </div>
                        <div>
                            <label className={label}>Pipeline Stage</label>
                            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="fw-input bg-slate-50 border-slate-300 font-bold focus:bg-white cursor-pointer appearance-none select-wrapper">
                                {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className={label}>Scheduled Follow-up</label>
                        <input type="date" value={form.followUpDate} onChange={e => setForm({ ...form, followUpDate: e.target.value })} className="fw-input w-full cursor-pointer" />
                    </div>
                    <div>
                        <label className={label}>Interaction Notes</label>
                        <textarea rows={4} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="fw-input resize-y" placeholder="Summarize discovery calls here..."></textarea>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Leads;
