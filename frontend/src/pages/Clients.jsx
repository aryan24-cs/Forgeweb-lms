import React, { useEffect, useState, useMemo } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import { useData } from '../context/DataContext';

const emptyForm = {
    name: '', businessName: '', phone: '', email: '', address: '', gst: '',
    domainInfo: '', hostingInfo: '', projectType: 'Not Assigned', plan: 'None',
    totalDealValue: 0, paymentStatus: 'Pending', projectStatus: 'Not Started', contractStatus: 'Pending',
    notes: '', assignedDevelopers: []
};

const Clients = () => {
    const { raw, refreshData } = useData();
    const [modal, setModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [search, setSearch] = useState('');
    const [detailView, setDetailView] = useState(null);
    const [activeTab, setActiveTab] = useState('profile');
    const [users, setUsers] = useState([]);

    const clients = useMemo(() => {
        if (!raw?.clients) return [];
        return raw.clients.filter(c => {
            if (!search) return true;
            return c.name?.toLowerCase().includes(search.toLowerCase()) ||
                c.businessName?.toLowerCase().includes(search.toLowerCase());
        });
    }, [raw?.clients, search]);

    const fetchUsers = () => api.get('/auth/users').then(r => setUsers(r.data)).catch(() => { });

    useEffect(() => { fetchUsers(); }, []);

    const openAdd = () => { setForm(emptyForm); setEditId(null); setModal(true); };
    const openEdit = (c) => {
        setForm({
            ...c,
            assignedDevelopers: c.assignedDevelopers?.map(u => typeof u === 'object' ? u._id : u) || []
        });
        setEditId(c._id);
        setModal(true);
    };

    const save = async (e) => {
        e.preventDefault();
        try {
            if (editId) await api.put(`/clients/${editId}`, form);
            else await api.post('/clients', form);
            toast.success(editId ? 'Nexus profile updated' : 'New client nexus established');
            setModal(false);
            refreshData(); // 🔥 Update Global Source of Truth
            if (detailView) viewProfile(detailView.client._id);
        } catch { toast.error('Failed modifying client registry'); }
    };

    const remove = async (id) => {
        if (!confirm('Permanently eradicate this client record?')) return;
        await api.delete(`/clients/${id}`);
        toast.success('Record eradicated');
        refreshData();
    };

    const viewProfile = async (id) => {
        const r = await api.get(`/clients/${id}`);
        setDetailView(r.data);
        setActiveTab('profile');
    };

    const label = "block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wide";

    const getStatusStyle = (s) => {
        if (['Paid', 'Completed', 'Active'].includes(s)) return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
        if (['Partial', 'In Progress', 'Testing', 'Client Review'].includes(s)) return 'bg-amber-50 text-amber-700 border border-amber-100';
        return 'bg-slate-50 text-slate-700 border border-slate-200';
    };

    // Document Vault logic
    const handleAddDocument = async () => {
        const title = prompt('Document Designation (e.g. NDA, Signed Contract):');
        if (!title) return;
        const url = prompt('Encrypted Drive Link / URL:');
        if (!url) return;

        try {
            const updatedDocs = [...(detailView.client.documents || []), { title, url, type: 'Other', uploadedAt: new Date() }];
            await api.put(`/clients/${detailView.client._id}`, { documents: updatedDocs });
            toast.success('Document encrypted and bound');
            refreshData();
            viewProfile(detailView.client._id);
        } catch { toast.error('Encryption Failed'); }
    };

    // Timeline Tracker logic
    const handleUpdateTimeline = async (field, dateVal) => {
        try {
            const newTimeline = { ...(detailView.client.timeline || {}), [field]: dateVal };
            await api.put(`/clients/${detailView.client._id}`, { timeline: newTimeline });
            toast.success('Vector timeline updated');
            refreshData();
            viewProfile(detailView.client._id);
        } catch { toast.error('Temporal shift failed'); }
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Client Hub</h1>
                    <p className="text-base text-slate-500 mt-1 font-medium text-balance max-w-lg">Manage relationships, vector timelines, secure document vaults, and operational tracking.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search registry..." className="fw-input pl-9 max-w-[220px] bg-white border border-slate-200 shadow-sm" />
                    </div>
                    <button onClick={openAdd} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold rounded-xl shadow-[0_8px_20px_-4px_rgba(79,70,229,0.3)] hover:-translate-y-0.5 transition-all uppercase tracking-wider whitespace-nowrap">+ Client Vector</button>
                </div>
            </div>

            {/* Matrix Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {clients.map(c => (
                    <div key={c._id} className="fw-card p-6 flex flex-col cursor-pointer group hover:border-indigo-200 transition-all duration-300 transform hover:-translate-y-1" onClick={() => viewProfile(c._id)}>
                        <div className="flex items-start justify-between mb-4">
                            <div className="pr-4">
                                <h3 className="font-bold text-[16px] text-slate-800 leading-tight mb-1 group-hover:text-indigo-600 transition-colors">{c.name}</h3>
                                <p className="text-[12px] font-semibold text-slate-400">{c.businessName || 'Independent Entity'}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shadow-sm">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" /></svg>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mb-6 flex-wrap">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${getStatusStyle(c.projectStatus)}`}>{c.projectStatus}</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${getStatusStyle(c.paymentStatus)}`}>{c.paymentStatus}</span>
                        </div>

                        <div className="mt-auto border-t border-slate-100 pt-4 flex items-center justify-between">
                            <div className="flex -space-x-2">
                                {c.assignedDevelopers?.length > 0 ? c.assignedDevelopers.map((d, i) => (
                                    <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-slate-800 flex items-center justify-center text-[10px] text-white font-bold tracking-widest shadow-sm" title={d.name}>{d.name?.slice(0, 2).toUpperCase()}</div>
                                )) : <span className="text-[12px] font-medium text-slate-400 italic">Unassigned</span>}
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={(e) => { e.stopPropagation(); openEdit(c); }} className="text-[12px] font-bold text-slate-400 hover:text-indigo-600 transition-colors">Modify Specs</button>
                                <button onClick={(e) => { e.stopPropagation(); remove(c._id); }} className="text-[12px] font-bold text-slate-400 hover:text-red-500 transition-colors">Eradicate</button>
                            </div>
                        </div>
                    </div>
                ))}
                {clients.length === 0 && <div className="col-span-full py-20 text-center text-slate-400 text-[14px] font-semibold">Matrix Empty. Record your first nexus target.</div>}
            </div>

            {/* Deep Hub Modal */}
            {detailView && (
                <Modal isOpen={true} onClose={() => setDetailView(null)} title={`${detailView.client.name} — Command Hub`} maxWidth="max-w-4xl">
                    <div className="border-b border-slate-100 mb-8 flex gap-8 z-20">
                        {['profile', 'timeline', 'vault', 'projects'].map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 text-[13px] font-bold uppercase tracking-widest transition-colors border-b-2 ${activeTab === tab ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-400 hover:text-indigo-500 hover:border-indigo-200'}`}>
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Tab: Profile Block */}
                    {activeTab === 'profile' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-4 animate-slideIn">
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-[14px] font-black text-slate-800 mb-4 tracking-tight border-b border-slate-100 pb-2">Comms & Intel</h4>
                                    <div className="bg-slate-50/80 rounded-2xl p-5 text-[14px] space-y-3 border border-slate-100">
                                        <p className="flex justify-between border-b border-slate-200/60 pb-2"><span className="text-slate-500 font-semibold">Net Address</span> <span className="font-bold text-slate-800">{detailView.client.email || '—'}</span></p>
                                        <p className="flex justify-between border-b border-slate-200/60 pb-2"><span className="text-slate-500 font-semibold">Comm Relay</span> <span className="font-bold text-slate-800">{detailView.client.phone || '—'}</span></p>
                                        <p className="flex justify-between border-b border-slate-200/60 pb-2"><span className="text-slate-500 font-semibold">Entity</span> <span className="font-bold text-slate-800">{detailView.client.businessName || '—'}</span></p>
                                        <p className="flex justify-between border-b border-slate-200/60 pb-2"><span className="text-slate-500 font-semibold">Physical Vector</span> <span className="font-bold text-slate-800 truncate max-w-[150px] text-right">{detailView.client.address || '—'}</span></p>
                                        <p className="flex justify-between"><span className="text-slate-500 font-semibold">Tax Code (GSTIN)</span> <span className="font-bold text-slate-800">{detailView.client.gst || '—'}</span></p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[14px] font-black text-slate-800 mb-4 tracking-tight border-b border-slate-100 pb-2">Tech Architecture</h4>
                                    <div className="bg-slate-50/80 rounded-2xl p-5 text-[14px] space-y-3 border border-slate-100">
                                        <p className="flex justify-between border-b border-slate-200/60 pb-2"><span className="text-slate-500 font-semibold">Stream Matrix</span> <span className="font-black text-indigo-600 uppercase tracking-wide text-[11px]">{detailView.client.projectType}</span></p>
                                        <p className="flex justify-between border-b border-slate-200/60 pb-2"><span className="text-slate-500 font-semibold">System Tier</span> <span className="font-bold text-slate-800">{detailView.client.plan}</span></p>
                                        <p className="flex justify-between border-b border-slate-200/60 pb-2"><span className="text-slate-500 font-semibold">DNS Binding</span> <span className="font-bold text-sky-600">{detailView.client.domainInfo || 'Floating'}</span></p>
                                        <p className="flex justify-between"><span className="text-slate-500 font-semibold">Cloud Frame</span> <span className="font-bold text-slate-800">{detailView.client.hostingInfo || 'Unassigned'}</span></p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-[14px] font-black text-slate-800 mb-4 tracking-tight border-b border-slate-100 pb-2">Fiscal & Contract</h4>
                                    <div className="bg-slate-50/80 rounded-2xl p-5 text-[14px] space-y-3 border border-slate-100">
                                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-2"><span className="text-slate-500 font-semibold">Legal Vector</span> <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${getStatusStyle(detailView.client.contractStatus)}`}>{detailView.client.contractStatus}</span></div>
                                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-2"><span className="text-slate-500 font-semibold">Ledger Transfer</span> <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${getStatusStyle(detailView.client.paymentStatus)}`}>{detailView.client.paymentStatus}</span></div>
                                        <div className="flex items-center justify-between"><span className="text-slate-500 font-semibold mt-1">Acquisition Power</span> <span className="font-black text-2xl text-emerald-600">₹{(detailView.client.totalDealValue || 0).toLocaleString()}</span></div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[14px] font-black text-slate-800 mb-4 tracking-tight border-b border-slate-100 pb-2">Operative Attachment</h4>
                                    <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 flex gap-3 flex-wrap">
                                        {detailView.client.assignedDevelopers?.length > 0 ? detailView.client.assignedDevelopers.map((d, i) => (
                                            <div key={i} className="flex items-center gap-2.5 bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-100">
                                                <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center text-[10px] text-white font-black">{d.name?.charAt(0)}</div>
                                                <span className="font-bold text-[13px] text-slate-700">{d.name}</span>
                                            </div>
                                        )) : <p className="text-sm font-semibold text-slate-400 italic">Ghosts. No human presence tracked.</p>}
                                    </div>
                                </div>

                                {detailView.client.notes && (
                                    <div>
                                        <h4 className="text-[14px] font-black text-slate-800 mb-4 tracking-tight border-b border-slate-100 pb-2">Classified Logs</h4>
                                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-[14px] font-medium text-amber-900 leading-relaxed shadow-inner">
                                            {detailView.client.notes}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tab: Timeline */}
                    {activeTab === 'timeline' && (
                        <div className="max-w-2xl mx-auto py-8 animate-slideIn">
                            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-indigo-100 before:via-indigo-300 before:to-transparent">
                                {[
                                    { label: 'Proposal Encrypted', field: 'proposalSent', color: 'bg-indigo-500 border-indigo-200' },
                                    { label: 'Vector Sealed', field: 'agreementSigned', color: 'bg-violet-500 border-violet-200' },
                                    { label: 'Phase 1 Init', field: 'projectStart', color: 'bg-amber-500 border-amber-200' },
                                    { label: 'Terminal Payload', field: 'expectedDelivery', color: 'bg-emerald-500 border-emerald-200' },
                                ].map((step, idx) => (
                                    <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                        <div className={`w-10 h-10 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 rounded-full border-[3px] flex items-center justify-center z-10 shadow-md ${detailView.client.timeline?.[step.field] ? step.color : 'bg-slate-50 border-slate-200'}`}>
                                            <div className="w-3.5 h-3.5 rounded-full bg-white font-black text-xs text-center flex items-center justify-center"></div>
                                        </div>
                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-5 rounded-2xl border border-slate-200 shadow-[0_8px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_24px_rgba(79,70,229,0.06)] hover:border-indigo-100 transition-all">
                                            <h4 className="font-bold text-[14px] text-slate-800 mb-1 tracking-tight">{step.label}</h4>
                                            {detailView.client.timeline?.[step.field] ? (
                                                <p className="text-[12px] font-bold text-indigo-600 flex items-center gap-1.5 uppercase tracking-wide">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                    {new Date(detailView.client.timeline[step.field]).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            ) : (
                                                <input type="date" className="mt-2 text-[12px] font-bold py-2 px-3 rounded-lg border border-slate-200 bg-slate-50 outline-none w-full text-slate-600 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition" onChange={(e) => handleUpdateTimeline(step.field, e.target.value)} />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tab: Vault */}
                    {activeTab === 'vault' && (
                        <div className="animate-slideIn">
                            <div className="flex justify-between items-end mb-8 border-b border-slate-100 pb-4">
                                <div>
                                    <h4 className="text-[14px] font-black text-slate-800 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                        Impenetrable Vault
                                    </h4>
                                    <p className="text-xs text-slate-400 font-semibold mt-1">End-to-End bound external links.</p>
                                </div>
                                <button onClick={handleAddDocument} className="px-4 py-2 bg-slate-800 text-white text-[12px] font-bold rounded-lg shadow-md hover:bg-slate-900 transition-colors uppercase tracking-widest">+ Link Sequence</button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {detailView.client.documents?.length > 0 ? detailView.client.documents.map((doc, idx) => (
                                    <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col items-start gap-4 relative group hover:border-indigo-200 hover:shadow-lg transition-all">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        </div>
                                        <div className="min-w-0 w-full mb-2">
                                            <h5 className="font-bold text-[14px] text-slate-800 truncate" title={doc.title}>{doc.title}</h5>
                                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Bound: {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                                        </div>
                                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="w-full text-center block py-2 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-bold text-slate-600 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 group-hover:-translate-y-0.5 transition-all cursor-pointer">
                                            Decrypt Access
                                        </a>
                                    </div>
                                )) : (
                                    <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                                        <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                                        <p className="text-slate-400 text-[14px] font-bold">Vault is sterile. Awaiting encryption link.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tab: Matrix Operations */}
                    {activeTab === 'projects' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-4 animate-slideIn">
                            <div>
                                <h4 className="font-black text-[14px] text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">Operative Matrix <span className="text-[11px] px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md font-black">{detailView.projects?.length || 0} Lines</span></h4>
                                <div className="space-y-3">
                                    {detailView.projects?.map(p => (
                                        <div key={p._id} className="flex justify-between items-center p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
                                            <span className="font-bold text-[14px] text-slate-800">{p.name}</span>
                                            <span className={`text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-md ${getStatusStyle(p.status)}`}>{p.status}</span>
                                        </div>
                                    ))}
                                    {!detailView.projects?.length && <p className="text-[13px] text-slate-400 font-semibold italic text-center py-6 border-2 border-dashed border-slate-100 rounded-xl">Network dormant.</p>}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-black text-[14px] text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">Fiscal Ledger <span className="text-[11px] px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md font-black">{detailView.payments?.length || 0} Logs</span></h4>
                                <div className="space-y-3">
                                    {detailView.payments?.map(p => (
                                        <div key={p._id} className="flex justify-between items-center p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-emerald-200 transition-colors">
                                            <div>
                                                <span className="font-black text-[15px] text-emerald-600">₹{p.paidAmount?.toLocaleString()}</span>
                                                <span className="text-slate-400 text-[12px] font-semibold tracking-wide ml-1 border-l border-slate-300 pl-1">₹{p.totalAmount?.toLocaleString()}</span>
                                            </div>
                                            <span className={`text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-md ${getStatusStyle(p.status)}`}>{p.status}</span>
                                        </div>
                                    ))}
                                    {!detailView.payments?.length && <p className="text-[13px] text-slate-400 font-semibold italic text-center py-6 border-2 border-dashed border-slate-100 rounded-xl">Ledger pristine.</p>}
                                </div>
                            </div>
                        </div>
                    )}
                </Modal>
            )}

            {/* Hub Modify Modal */}
            <Modal isOpen={modal} onClose={() => setModal(false)} title={editId ? 'Recalibrate Target Nexus' : 'Forge Target Nexus'} maxWidth="max-w-4xl" footer={<>
                <button type="button" onClick={() => setModal(false)} className="px-6 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">Abort</button>
                <button type="submit" form="client-form" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-[0_8px_20px_-4px_rgba(79,70,229,0.3)] transition ml-3">{editId ? 'Lock Specs' : 'Initialize Bond'}</button>
            </>}>
                <form id="client-form" onSubmit={save} className="space-y-6 px-1 py-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div><label className={label}>Vanguard Designation *</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="fw-input" placeholder="Name or Alias" /></div>
                        <div><label className={label}>Corporate Entity</label><input value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })} className="fw-input" placeholder="Company Name" /></div>
                        <div><label className={label}>Comm Route</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="fw-input" placeholder="Number Dial" /></div>
                        <div><label className={label}>IP Mail</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="fw-input" placeholder="target@domain.net" /></div>

                        <div className="md:col-span-2"><label className={label}>Physical Pinpoint</label><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="fw-input bg-slate-50/50" placeholder="Address..." /></div>

                        <div><label className={label}>DNS Structure</label><input value={form.domainInfo} onChange={e => setForm({ ...form, domainInfo: e.target.value })} className="fw-input" placeholder="Registered Domain" /></div>
                        <div><label className={label}>Cloud Frame Array</label><input value={form.hostingInfo} onChange={e => setForm({ ...form, hostingInfo: e.target.value })} className="fw-input" placeholder="AWS / Vercel" /></div>

                        <div><label className={label}>Architecture Stack</label><select value={form.projectType} onChange={e => setForm({ ...form, projectType: e.target.value })} className="fw-input cursor-pointer appearance-none select-wrapper"><option>Not Assigned</option><option>Website</option><option>AI Tool</option><option>Branding</option><option>Marketing</option><option>Other</option></select></div>
                        <div><label className={label}>Compute Tier</label><select value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })} className="fw-input cursor-pointer appearance-none select-wrapper"><option value="None">None</option><option value="Basic">Basic Frame</option><option value="Standard">Standard Node</option><option value="Premium">Premium Array</option><option value="Custom">Custom Forge</option></select></div>

                        <div><label className={label}>Legal Protocol</label><select value={form.contractStatus} onChange={e => setForm({ ...form, contractStatus: e.target.value })} className="fw-input cursor-pointer appearance-none select-wrapper"><option>Pending</option><option>Active</option><option>Completed</option><option>Cancelled</option></select></div>
                        <div><label className={label}>Phase Logic</label><select value={form.projectStatus} onChange={e => setForm({ ...form, projectStatus: e.target.value })} className="fw-input cursor-pointer appearance-none select-wrapper"><option>Not Started</option><option>In Progress</option><option>Testing</option><option>Client Review</option><option>Completed</option><option>On Hold</option></select></div>

                        <div><label className={label}>Ledger Flow</label><select value={form.paymentStatus} onChange={e => setForm({ ...form, paymentStatus: e.target.value })} className="fw-input cursor-pointer appearance-none select-wrapper bg-slate-50"><option>Pending</option><option>Partial</option><option>Paid</option></select></div>
                        <div><label className={label}>Capture Index (₹)</label><input type="number" value={form.totalDealValue} onChange={e => setForm({ ...form, totalDealValue: Number(e.target.value) })} className="fw-input font-black text-indigo-700" /></div>

                        <div className="md:col-span-2 fw-card p-5 border border-slate-200/60"><label className={label}>Vector Fleet Attachments</label>
                            <div className="flex flex-wrap gap-3 mt-3">
                                {users.filter(u => u.role !== 'client').map(u => (
                                    <label key={u._id} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-bold border cursor-pointer transition-colors shadow-sm ${form.assignedDevelopers.includes(u._id) ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-300'}`}>
                                        <input type="checkbox" checked={form.assignedDevelopers.includes(u._id)} onChange={(e) => {
                                            if (e.target.checked) setForm({ ...form, assignedDevelopers: [...form.assignedDevelopers, u._id] });
                                            else setForm({ ...form, assignedDevelopers: form.assignedDevelopers.filter(id => id !== u._id) });
                                        }} className="hidden" />
                                        <div className="w-5 h-5 rounded border border-current flex items-center justify-center shrink-0 bg-white">
                                            {form.assignedDevelopers.includes(u._id) && <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                        </div>
                                        {u.name}
                                    </label>
                                ))}
                                {users.filter(u => u.role !== 'client').length === 0 && <p className="text-[12px] font-semibold text-slate-400">Terminal fleet offline.</p>}
                            </div>
                        </div>

                        <div className="md:col-span-2"><label className={label}>Secured Notes Base</label><textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="fw-input resize-y" placeholder="Upload additional context tracking..."></textarea></div>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Clients;
