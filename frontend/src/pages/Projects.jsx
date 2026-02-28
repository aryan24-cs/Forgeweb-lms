import React, { useEffect, useState, useMemo } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import { useData } from '../context/DataContext';

const STATUSES = ['Planning', 'In Progress', 'Testing', 'Client Review', 'Completed', 'On Hold'];
const STATUS_COLORS = {
    'Planning': 'bg-indigo-50 text-indigo-700 border border-indigo-100',
    'In Progress': 'bg-violet-50 text-violet-700 border border-violet-100',
    'Testing': 'bg-amber-50 text-amber-700 border border-amber-100',
    'Client Review': 'bg-orange-50 text-orange-700 border border-orange-100',
    'Completed': 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    'On Hold': 'bg-slate-50 text-slate-700 border border-slate-200',
};

const emptyForm = { name: '', description: '', client: '', serviceType: '', totalValue: 0, startDate: '', deadline: '', status: 'Planning', teamMembers: [], deliverables: '' };

const Projects = () => {
    const { raw, refreshData } = useData();
    const projects = raw?.projects || [];
    const clients = raw?.clients || [];

    const [users, setUsers] = useState([]);
    const [modal, setModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [view, setView] = useState('grid');
    const [detailProjectId, setDetailProjectId] = useState(null);
    const [milestoneTitle, setMilestoneTitle] = useState('');
    const [milestoneDue, setMilestoneDue] = useState('');

    const currentProject = useMemo(() => {
        return projects.find(p => p._id === detailProjectId) || null;
    }, [projects, detailProjectId]);

    useEffect(() => {
        api.get('/auth/users').then(r => setUsers(r.data)).catch(() => { });
    }, []);

    const openAdd = () => { setForm(emptyForm); setEditId(null); setModal(true); };
    const openEdit = (p) => {
        setForm({
            ...p,
            client: p.client?._id || p.client || '',
            teamMembers: p.teamMembers?.map(u => typeof u === 'object' ? u._id : u) || [],
            startDate: p.startDate ? p.startDate.slice(0, 10) : '',
            deadline: p.deadline ? p.deadline.slice(0, 10) : '',
        });
        setEditId(p._id);
        setModal(true);
    };

    const save = async (e) => {
        e.preventDefault();
        try {
            if (editId) await api.put(`/projects/${editId}`, form);
            else await api.post('/projects', form);
            toast.success(editId ? 'Project sequence updated' : 'New project instantiated');
            setModal(false);
            refreshData();
        } catch { toast.error('Failed to configure project'); }
    };

    const remove = async (id) => {
        if (!confirm('Permanently delete this project?')) return;
        await api.delete(`/projects/${id}`);
        toast.success('Project eradicated');
        refreshData();
    };

    const updateStatus = async (id, status) => {
        await api.put(`/projects/${id}`, { status });
        toast.success('Phase transitioned');
        refreshData();
    };

    const viewDetail = (p) => setDetailProjectId(p._id);

    const addMilestone = async () => {
        if (!milestoneTitle || !currentProject) return;
        const updated = [...(currentProject.milestones || []), { title: milestoneTitle, dueDate: milestoneDue || null, completed: false }];
        await api.put(`/projects/${currentProject._id}`, { milestones: updated });
        toast.success('Milestone synchronized');
        setMilestoneTitle(''); setMilestoneDue('');
        await refreshData();
    };

    const toggleMilestone = async (idx) => {
        if (!currentProject) return;
        const updated = currentProject.milestones.map((m, i) => i === idx ? { ...m, completed: !m.completed } : m);
        await api.put(`/projects/${currentProject._id}`, { milestones: updated });
        await refreshData();
    };

    const progressCalc = (p) => {
        if (!p.milestones?.length) return p.progress || 0;
        return Math.round((p.milestones.filter(m => m.completed).length / p.milestones.length) * 100);
    };

    const label = "block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide";

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Project Matrix</h1>
                    <p className="text-base text-slate-500 mt-1 font-medium">{projects.length} Total Deployed • <span className="text-indigo-600 font-bold">{projects.filter(p => ['Planning', 'In Progress', 'Testing', 'Client Review'].includes(p.status)).length} Active</span></p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setView(view === 'kanban' ? 'grid' : 'kanban')} className="px-5 py-2.5 text-[13px] font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm transition-all uppercase tracking-wider">
                        {view === 'kanban' ? 'Grid Matrix' : 'Kanban Stream'}
                    </button>
                    <button onClick={openAdd} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold rounded-xl shadow-[0_8px_20px_-4px_rgba(79,70,229,0.3)] hover:-translate-y-0.5 transition-all uppercase tracking-wider">+ Deploy Project</button>
                </div>
            </div>

            {/* Kanban Stream */}
            {view === 'kanban' && (
                <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar">
                    {STATUSES.filter(s => s !== 'On Hold').map(status => (
                        <div key={status} className="min-w-[340px] w-[340px] shrink-0"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={async (e) => { const id = e.dataTransfer.getData('projectId'); if (id) await updateStatus(id, status); }}
                        >
                            <div className="flex items-center justify-between mb-4 bg-slate-100/80 px-4 py-3 rounded-xl border border-slate-200/60">
                                <span className={`text-[11px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest ${STATUS_COLORS[status]}`}>{status}</span>
                                <span className="text-[13px] font-bold text-slate-500">{projects.filter(p => p.status === status).length} active</span>
                            </div>
                            <div className="space-y-4">
                                {projects.filter(p => p.status === status).map(p => (
                                    <div key={p._id} draggable onDragStart={(e) => e.dataTransfer.setData('projectId', p._id)}
                                        className="bg-white rounded-2xl border border-slate-200/80 p-5 cursor-grab active:cursor-grabbing hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_12px_24px_-8px_rgba(79,70,229,0.15)] transition-all duration-300"
                                        onClick={() => viewDetail(p)}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-[16px] text-slate-800 leading-tight">{p.name}</h4>
                                        </div>
                                        <p className="text-[12px] font-semibold text-slate-400 mb-4">{p.client?.name || 'Unassigned Client'}</p>

                                        {/* Progress Block */}
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progress</span>
                                                <span className="text-[11px] font-black text-indigo-600">{progressCalc(p)}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progressCalc(p)}%` }}></div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-auto border-t border-slate-100 pt-3">
                                            <div className="flex -space-x-2">
                                                {p.teamMembers?.slice(0, 4).map((m, i) => (
                                                    <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-slate-800 flex items-center justify-center text-[10px] text-white font-bold tracking-wider">{m.name?.slice(0, 2).toUpperCase()}</div>
                                                ))}
                                                {(!p.teamMembers || p.teamMembers.length === 0) && <span className="text-[11px] text-slate-400 font-medium italic">Empty</span>}
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                                                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                {p.deadline ? <span className="text-[11px] font-bold text-slate-600">{new Date(p.deadline).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span> : <span className="text-[11px] text-slate-400">TBD</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {projects.filter(p => p.status === status).length === 0 && (
                                    <div className="h-24 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-[13px] font-semibold text-slate-400">
                                        Dock Project Here
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Grid Matrix */}
            {view === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-slideIn">
                    {projects.map(p => (
                        <div key={p._id} className="fw-card p-6 flex flex-col cursor-pointer group hover:border-indigo-200" onClick={() => viewDetail(p)}>
                            <div className="flex items-start justify-between mb-2">
                                <div className="pr-2">
                                    <h3 className="font-bold text-[16px] text-slate-800 leading-tight mb-1 group-hover:text-indigo-600 transition-colors">{p.name}</h3>
                                    <p className="text-[12px] font-semibold text-slate-400">{p.client?.name || 'Unassigned'}</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                </div>
                            </div>

                            <div className="mt-4 mb-5">
                                <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest ${STATUS_COLORS[p.status]}`}>{p.status}</span>
                            </div>

                            <div className="mt-auto mb-4">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progress Base</span>
                                    <span className="text-[12px] font-black text-indigo-600">{progressCalc(p)}%</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                    <div className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 rounded-full transition-all duration-500" style={{ width: `${progressCalc(p)}%` }}></div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-[13px] font-semibold text-slate-500 mb-4 pb-4 border-b border-slate-100">
                                <span>{p.serviceType || 'General'}</span>
                                <span className="font-black text-slate-800">₹{(p.totalValue || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <button onClick={(e) => { e.stopPropagation(); openEdit(p); }} className="text-[12px] font-bold text-slate-400 hover:text-indigo-600 transition-colors">Modify Specs</button>
                                <button onClick={(e) => { e.stopPropagation(); remove(p._id); }} className="text-[12px] font-bold text-slate-400 hover:text-red-500 transition-colors">Eradicate</button>
                            </div>
                        </div>
                    ))}
                    {projects.length === 0 && <div className="col-span-full py-20 text-center text-slate-400 text-[14px] font-semibold">Matrix Empty. Deploy new infrastructure.</div>}
                </div>
            )}

            {/* Project Deep Dive Modal */}
            {currentProject && (
                <Modal isOpen={true} onClose={() => setDetailProjectId(null)} title="Command Center" maxWidth="max-w-4xl">
                    <div className="flex items-start justify-between mb-8 pb-6 border-b border-slate-100">
                        <div>
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight">{currentProject.name}</h2>
                            <p className="text-sm font-semibold text-slate-500 mt-1">Client Pipeline: <span className="text-slate-800">{currentProject.client?.name || 'Internal / General'}</span></p>
                        </div>
                        <span className={`text-[12px] font-black px-4 py-2 rounded-xl uppercase tracking-widest ${STATUS_COLORS[currentProject.status]}`}>{currentProject.status}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="fw-card border-slate-100 p-6 flex flex-col items-center justify-center text-center bg-white">
                            <p className="text-[11px] text-slate-400 uppercase tracking-widest font-bold mb-2">Completion Net</p>
                            <p className="text-4xl font-black text-indigo-600">{progressCalc(currentProject)}%</p>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-4 shadow-inner">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progressCalc(currentProject)}%` }}></div>
                            </div>
                        </div>
                        <div className="fw-card border-slate-100 p-6 flex flex-col items-center justify-center text-center bg-white">
                            <p className="text-[11px] text-slate-400 uppercase tracking-widest font-bold mb-2">Total Yield Evaluated</p>
                            <p className="text-3xl font-black text-slate-800">₹{(currentProject.totalValue || 0).toLocaleString()}</p>
                            <p className="text-xs font-semibold text-emerald-500 mt-2 bg-emerald-50 px-2 py-1 rounded-md">{currentProject.serviceType || 'Standard Rate'}</p>
                        </div>
                        <div className="fw-card border-slate-100 p-6 flex flex-col justify-center bg-white space-y-4">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Launch Date</p>
                                <p className="text-[14px] font-semibold text-slate-800">{currentProject.startDate ? new Date(currentProject.startDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Pending Initialization'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Terminal Deadline</p>
                                <p className="text-[14px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-md inline-block">{currentProject.deadline ? new Date(currentProject.deadline).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Open-Ended'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Milestones Panel */}
                        <div className="lg:col-span-2">
                            <h4 className="text-[14px] font-black text-slate-800 mb-4 border-b border-slate-100 pb-2">Milestone Tracks</h4>
                            <div className="space-y-3 mb-6">
                                {currentProject.milestones?.map((m, idx) => (
                                    <div key={idx} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${m.completed ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 shadow-sm'}`}>
                                        <button onClick={() => toggleMilestone(idx)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${m.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 hover:border-indigo-400'}`}>
                                            {m.completed && <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                        </button>
                                        <div className="flex-1">
                                            <p className={`text-[14px] font-bold ${m.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{m.title}</p>
                                            {m.dueDate && <span className="text-[11px] font-semibold text-slate-400 mt-1 block">Due: {new Date(m.dueDate).toLocaleDateString()}</span>}
                                        </div>
                                    </div>
                                ))}
                                {(!currentProject.milestones || currentProject.milestones.length === 0) && (
                                    <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                                        <p className="text-[13px] font-bold text-slate-400">No milestones established. Define tracks below.</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
                                <input value={milestoneTitle} onChange={e => setMilestoneTitle(e.target.value)} placeholder="E.g. Wireframes Approved" className="fw-input flex-1 !bg-white" />
                                <input type="date" value={milestoneDue} onChange={e => setMilestoneDue(e.target.value)} className="fw-input w-full sm:w-40 !bg-white cursor-pointer" />
                                <button onClick={addMilestone} className="px-5 py-2.5 bg-indigo-600 text-white text-[13px] font-bold rounded-xl shadow-[0_4px_12px_rgba(79,70,229,0.2)] hover:-translate-y-0.5 transition-all whitespace-nowrap">Bind Track</button>
                            </div>
                        </div>

                        {/* Operative Team Panel */}
                        <div>
                            <h4 className="text-[14px] font-black text-slate-800 mb-4 border-b border-slate-100 pb-2">Assigned Operatives</h4>
                            <div className="space-y-3">
                                {currentProject.teamMembers?.map((m, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center text-[12px] text-white font-black shadow-sm shadow-indigo-500/20">{m.name?.charAt(0)}</div>
                                        <div>
                                            <p className="text-[14px] font-bold text-slate-800 leading-tight">{m.name}</p>
                                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{m.role || 'Operative'}</span>
                                        </div>
                                    </div>
                                ))}
                                {(!currentProject.teamMembers || currentProject.teamMembers.length === 0) && (
                                    <div className="p-4 bg-slate-50 text-center rounded-xl border border-slate-200">
                                        <p className="text-[12px] font-semibold text-slate-500">Fleet unassigned.</p>
                                    </div>
                                )}
                            </div>

                            {currentProject.description && (
                                <div className="mt-8">
                                    <h4 className="text-[14px] font-black text-slate-800 mb-3">Core Directive</h4>
                                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                                        <p className="text-[13px] font-medium text-amber-900 leading-relaxed">{currentProject.description}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Modal>
            )}

            {/* Create/Edit Matrix Modal */}
            <Modal isOpen={modal} onClose={() => setModal(false)} title={editId ? 'Recalibrate Project' : 'Generate New Matrix'} maxWidth="max-w-3xl"
                footer={<>
                    <button type="button" onClick={() => setModal(false)} className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-bold text-slate-600 transition">Abort</button>
                    <button type="submit" form="project-form" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-[0_8px_20px_-4px_rgba(79,70,229,0.3)] transition">{editId ? 'Lock Calibration' : 'Initialize Launch'}</button>
                </>}
            >
                <form id="project-form" onSubmit={save} className="space-y-6 px-1 py-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div><label className={label}>Project Designation *</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="fw-input" placeholder="E.g. Project Apollo" /></div>
                        <div><label className={label}>Client Nexus *</label>
                            <select required value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} className="fw-input cursor-pointer appearance-none select-wrapper">
                                <option value="">Select Target Nexus</option>
                                {clients.map(c => <option key={c._id} value={c._id}>{c.name} {c.businessName ? `(${c.businessName})` : ''}</option>)}
                            </select>
                        </div>
                    </div>
                    <div><label className={label}>Directive Detail</label><textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="fw-input resize-y" placeholder="Summarize core objectives..." /></div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div><label className={label}>Architecture Stack</label><input value={form.serviceType} onChange={e => setForm({ ...form, serviceType: e.target.value })} className="fw-input" placeholder="Web, AI, Mobile..." /></div>
                        <div><label className={label}>Projected Yield (₹)</label><input type="number" value={form.totalValue} onChange={e => setForm({ ...form, totalValue: Number(e.target.value) })} className="fw-input font-bold text-indigo-700" /></div>
                        <div><label className={label}>Phase Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="fw-input cursor-pointer appearance-none select-wrapper">{STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div><label className={label}>Launch Protocol</label><input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="fw-input cursor-pointer" /></div>
                        <div><label className={label}>Critical Deadline</label><input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} className="fw-input cursor-pointer" /></div>
                    </div>

                    <div className="fw-card border border-slate-200/60 p-5">
                        <label className={label}>Operative Roster</label>
                        <div className="flex flex-wrap gap-3 mt-3">
                            {users.filter(u => u.role !== 'client').map(u => (
                                <label key={u._id} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-bold border cursor-pointer transition-colors shadow-sm ${form.teamMembers.includes(u._id) ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-300'}`}>
                                    <input type="checkbox" checked={form.teamMembers.includes(u._id)} onChange={(e) => {
                                        if (e.target.checked) setForm({ ...form, teamMembers: [...form.teamMembers, u._id] });
                                        else setForm({ ...form, teamMembers: form.teamMembers.filter(id => id !== u._id) });
                                    }} className="hidden" />
                                    <div className="w-5 h-5 rounded border border-current flex items-center justify-center shrink-0 bg-white">
                                        {form.teamMembers.includes(u._id) && <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                    </div>
                                    {u.name}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div><label className={label}>Expected Artifacts</label><textarea rows={3} value={form.deliverables} onChange={e => setForm({ ...form, deliverables: e.target.value })} className="fw-input resize-y" placeholder="List of deliverables..." /></div>
                </form>
            </Modal>
        </div>
    );
};

export default Projects;
