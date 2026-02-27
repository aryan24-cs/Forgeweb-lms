import React, { useEffect, useState, useMemo } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import { useData } from '../context/DataContext';

const COLUMNS = ['To Do', 'In Progress', 'Testing', 'Client Review', 'Completed'];
const COL_COLORS = {
    'To Do': 'bg-slate-50 text-slate-700 border border-slate-200',
    'In Progress': 'bg-indigo-50 text-indigo-700 border border-indigo-100',
    'Testing': 'bg-amber-50 text-amber-700 border border-amber-100',
    'Client Review': 'bg-violet-50 text-violet-700 border border-violet-100',
    'Completed': 'bg-emerald-50 text-emerald-700 border border-emerald-100',
};
const PRIORITY_COLORS = { Low: 'text-slate-400', Medium: 'text-indigo-500', High: 'text-orange-500', Urgent: 'text-red-500' };

const emptyForm = { title: '', description: '', assignedTo: '', status: 'To Do', priority: 'Medium', dueDate: '', estimatedHours: 0, relatedProject: '', relatedClient: '' };

const Tasks = () => {
    const { raw, refreshData } = useData();
    const tasks = raw?.tasks || [];
    const projects = raw?.projects || [];
    const clients = raw?.clients || [];

    const [users, setUsers] = useState([]);
    const [modal, setModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [view, setView] = useState('kanban');
    const [filterProject, setFilterProject] = useState('');
    const [filterUser, setFilterUser] = useState('');

    useEffect(() => {
        api.get('/auth/users').then(r => setUsers(r.data)).catch(() => { });
    }, []);

    const openAdd = () => { setForm(emptyForm); setEditId(null); setModal(true); };
    const openEdit = (t) => {
        setForm({
            ...t,
            assignedTo: t.assignedTo?._id || '',
            relatedProject: t.relatedProject?._id || '',
            relatedClient: t.relatedClient?._id || '',
            dueDate: t.dueDate ? t.dueDate.slice(0, 10) : '',
        });
        setEditId(t._id);
        setModal(true);
    };

    const save = async (e) => {
        e.preventDefault();
        try {
            if (editId) await api.put(`/tasks/${editId}`, form);
            else await api.post('/tasks', form);
            toast.success(editId ? 'Task objective updated' : 'New objective locked');
            setModal(false);
            refreshData();
        } catch { toast.error('Failed modifying objective'); }
    };

    const remove = async (id) => {
        if (!confirm('Eliminate this assigned objective?')) return;
        await api.delete(`/tasks/${id}`);
        toast.success('Objective eliminated');
        refreshData();
    };

    const updateStatus = async (id, status) => {
        await api.put(`/tasks/${id}`, { status });
        toast.success('Pipeline advanced');
        refreshData();
    };

    const filtered = useMemo(() => {
        return tasks.filter(t => {
            if (filterProject && (t.relatedProject?._id || t.relatedProject) !== filterProject) return false;
            if (filterUser && (t.assignedTo?._id || t.assignedTo) !== filterUser) return false;
            return true;
        });
    }, [tasks, filterProject, filterUser]);

    const label = "block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide";

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Active Objectives</h1>
                    <p className="text-base text-slate-500 mt-1 font-medium">{tasks.length} Deployed • <span className="text-indigo-600 font-bold">{tasks.filter(t => t.status !== 'Completed').length} Pending</span></p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="fw-input max-w-[180px] bg-white text-[13px] font-bold cursor-pointer appearance-none select-wrapper text-slate-600">
                        <option value="">Matrix: All Streams</option>
                        {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                    <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className="fw-input max-w-[170px] bg-white text-[13px] font-bold cursor-pointer appearance-none select-wrapper text-slate-600">
                        <option value="">Agent: All Operatives</option>
                        {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                    </select>
                    <button onClick={() => setView(view === 'kanban' ? 'list' : 'kanban')} className="px-5 py-2.5 text-[13px] font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm transition-all uppercase tracking-wider">
                        {view === 'kanban' ? 'List Directory' : 'Kanban Stream'}
                    </button>
                    <button onClick={openAdd} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold rounded-xl shadow-[0_8px_20px_-4px_rgba(79,70,229,0.3)] hover:-translate-y-0.5 transition-all uppercase tracking-wider">+ Authorize Task</button>
                </div>
            </div>

            {/* Kanban */}
            {view === 'kanban' && (
                <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar">
                    {COLUMNS.map(col => (
                        <div key={col} className="min-w-[320px] w-[320px] shrink-0"
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => { const id = e.dataTransfer.getData('taskId'); if (id) updateStatus(id, col); }}
                        >
                            <div className="flex items-center justify-between mb-4 bg-slate-100/80 px-4 py-3 rounded-xl border border-slate-200/60">
                                <span className={`text-[11px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest ${COL_COLORS[col]}`}>{col}</span>
                                <span className="text-[13px] font-bold text-slate-500">{filtered.filter(t => t.status === col).length} nodes</span>
                            </div>
                            <div className="space-y-4">
                                {filtered.filter(t => t.status === col).map(t => (
                                    <div key={t._id} draggable onDragStart={e => e.dataTransfer.setData('taskId', t._id)}
                                        className="bg-white rounded-2xl border border-slate-200/80 p-5 cursor-grab active:cursor-grabbing hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_12px_24px_-8px_rgba(79,70,229,0.15)] transition-all duration-300"
                                        onClick={() => openEdit(t)}
                                    >
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <h4 className="font-bold text-[15px] leading-snug text-slate-800">{t.title}</h4>
                                            <span className={`text-[10px] font-black uppercase tracking-widest shrink-0 ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
                                        </div>
                                        {t.relatedProject && <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mb-3">{t.relatedProject.name}</p>}
                                        {t.description && <p className="text-[13px] font-medium text-slate-500 mb-4 line-clamp-2 leading-relaxed">{t.description}</p>}

                                        <div className="flex items-center justify-between mt-auto border-t border-slate-100 pt-3">
                                            {t.assignedTo ? (
                                                <div className="flex items-center gap-2 bg-slate-50 px-2 py-1.5 rounded-lg shadow-sm">
                                                    <div className="w-5 h-5 rounded-md bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center text-[10px] text-white font-black">{t.assignedTo.name?.charAt(0)}</div>
                                                    <span className="text-[11px] font-bold text-slate-700">{t.assignedTo.name.split(' ')[0]}</span>
                                                </div>
                                            ) : <span className="text-[11px] font-bold text-slate-400 italic">Unassigned</span>}

                                            {t.dueDate && (
                                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    {new Date(t.dueDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {filtered.filter(t => t.status === col).length === 0 && (
                                    <div className="h-20 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-[13px] font-semibold text-slate-400">
                                        Drop to lock
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* List */}
            {view === 'list' && (
                <div className="fw-card overflow-hidden border-transparent shadow-[0_8px_30px_rgba(0,0,0,0.04)] ring-1 ring-slate-200 animate-slideIn">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead><tr className="bg-slate-50/80 border-b border-slate-200">
                                {['Target / Directive', 'Assigned Operative', 'Project Stream', 'Risk Priority', 'Deadline', 'Status', ''].map(h => <th key={h} className="text-left px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}
                            </tr></thead>
                            <tbody>{filtered.map(t => (
                                <tr key={t._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => openEdit(t)}>
                                    <td className="px-6 py-4"><span className="font-bold text-[14px] text-slate-800">{t.title}</span></td>
                                    <td className="px-6 py-4">
                                        {t.assignedTo ? (
                                            <div className="flex items-center gap-2 text-[14px] font-semibold text-slate-600">
                                                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center text-[10px] text-white font-black shadow-sm">{t.assignedTo.name?.charAt(0)}</div>
                                                {t.assignedTo.name}
                                            </div>
                                        ) : <span className="text-[13px] font-medium text-slate-400 italic">Unassigned</span>}
                                    </td>
                                    <td className="px-6 py-4 text-[13px] font-bold text-indigo-600">{t.relatedProject?.name || 'General Operations'}</td>
                                    <td className="px-6 py-4"><span className={`text-[11px] font-black uppercase tracking-widest ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span></td>
                                    <td className="px-6 py-4 text-[13px] font-medium text-slate-500">{t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</td>
                                    <td className="px-6 py-4"><span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-widest inline-block ${COL_COLORS[t.status]}`}>{t.status}</span></td>
                                    <td className="px-6 py-4">
                                        <button onClick={(e) => { e.stopPropagation(); remove(t._id); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600 transition opacity-0 group-hover:opacity-100">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                                {filtered.length === 0 && <tr><td colSpan="7" className="text-center py-20 text-slate-400 text-[14px] font-semibold">No operational objectives match the matrix filter.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal */}
            <Modal isOpen={modal} onClose={() => setModal(false)} title={editId ? 'Recalibrate Objective' : 'New Tactical Objective'} maxWidth="max-w-2xl"
                footer={<>
                    <button type="button" onClick={() => setModal(false)} className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-bold text-slate-600 transition">Discard</button>
                    {editId && <button type="button" onClick={() => { remove(editId); setModal(false); }} className="px-6 py-3 rounded-xl bg-red-50 hover:bg-red-100 text-sm font-bold text-red-600 border border-red-200 transition ml-2">Eradicate Node</button>}
                    <button type="submit" form="task-form" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-[0_8px_20px_-4px_rgba(79,70,229,0.3)] transition ml-2">{editId ? 'Lock Calibration' : 'Authorize Objective'}</button>
                </>}
            >
                <form id="task-form" onSubmit={save} className="space-y-6 px-1 py-1">
                    <div><label className={label}>Objective Designation *</label><input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="fw-input font-bold" placeholder="Design UI Wireframes" /></div>
                    <div><label className={label}>Operational Details</label><textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="fw-input resize-y" placeholder="Summarize specifics of the mission..." /></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div><label className={label}>Assigned Operative</label><select value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })} className="fw-input cursor-pointer appearance-none select-wrapper"><option value="">Unassigned Pool</option>{users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}</select></div>
                        <div><label className={label}>Risk Priority</label><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="fw-input cursor-pointer appearance-none select-wrapper text-slate-800 font-bold"><option>Low</option><option>Medium</option><option>High</option><option className="text-red-600">Urgent</option></select></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div><label className={label}>Current Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="fw-input cursor-pointer appearance-none select-wrapper bg-slate-50">{COLUMNS.map(s => <option key={s}>{s}</option>)}</select></div>
                        <div><label className={label}>Target Completion</label><input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="fw-input cursor-pointer" /></div>
                        <div><label className={label}>Est. Time (Hours)</label><input type="number" value={form.estimatedHours} onChange={e => setForm({ ...form, estimatedHours: Number(e.target.value) })} className="fw-input" /></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div><label className={label}>Project Stream</label><select value={form.relatedProject} onChange={e => setForm({ ...form, relatedProject: e.target.value })} className="fw-input cursor-pointer appearance-none select-wrapper"><option value="">Standalone Routine</option>{projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}</select></div>
                        <div><label className={label}>Client Nexus</label><select value={form.relatedClient} onChange={e => setForm({ ...form, relatedClient: e.target.value })} className="fw-input cursor-pointer appearance-none select-wrapper"><option value="">Internal Operation</option>{clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Tasks;
