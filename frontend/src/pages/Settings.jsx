import React, { useEffect, useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';

const ROLES = ['admin', 'manager', 'sales', 'developer', 'client'];
const ROLE_LABELS = { admin: 'Admin', manager: 'Project Manager', sales: 'Sales', developer: 'Developer', client: 'Client' };
const ROLE_COLORS = {
    admin: 'bg-red-50 text-red-600 border border-red-100',
    manager: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
    sales: 'bg-sky-50 text-sky-600 border border-sky-100',
    developer: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    client: 'bg-amber-50 text-amber-600 border border-amber-100',
};
const ROLE_PERMISSIONS = {
    admin: ['Full access to all modules', 'Manage users & roles', 'View & edit finances', 'Delete records', 'System settings'],
    manager: ['Manage clients & projects', 'Assign tasks', 'View finances (read-only)', 'Manage team members'],
    sales: ['Manage leads', 'View clients', 'View projects', 'Create tasks'],
    developer: ['View assigned tasks', 'Update task status', 'Upload files', 'Log hours'],
    client: ['View own project progress', 'View milestones', 'Upload files', 'View invoices', 'Approve deliverables'],
};

const Settings = () => {
    const { user } = useAuth();
    const [tab, setTab] = useState('general');
    const [users, setUsers] = useState([]);
    const [settings, setSettings] = useState({ agencyName: '', monthlyExpenses: 0 });
    const [userModal, setUserModal] = useState(false);
    const [editUserId, setEditUserId] = useState(null);
    const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'sales' });

    const fetchUsers = () => api.get('/auth/users').then(r => setUsers(r.data)).catch(console.error);
    const fetchSettings = () => api.get('/settings').then(r => { if (r.data) setSettings(r.data); }).catch(() => { });

    useEffect(() => { fetchUsers(); fetchSettings(); }, []);

    const saveSettings = async () => {
        try {
            await api.put('/settings', settings);
            toast.success('Settings incredibly saved');
        } catch { toast.error('Failed to update Settings'); }
    };

    const openAddUser = () => { setUserForm({ name: '', email: '', password: '', role: 'sales' }); setEditUserId(null); setUserModal(true); };
    const openEditUser = (u) => { setUserForm({ name: u.name, email: u.email, password: '', role: u.role }); setEditUserId(u._id); setUserModal(true); };

    const saveUser = async (e) => {
        e.preventDefault();
        try {
            const body = { ...userForm };
            if (editUserId && !body.password) delete body.password;
            if (editUserId) await api.put(`/auth/users/${editUserId}`, body);
            else await api.post('/auth/register', body);
            toast.success(editUserId ? 'User updated successfully' : 'New user onboarded');
            setUserModal(false); fetchUsers();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed processing user'); }
    };

    const toggleActive = async (u) => {
        await api.put(`/auth/users/${u._id}`, { isActive: !u.isActive });
        toast.success(`User ${u.isActive ? 'deactivated' : 'activated'}`);
        fetchUsers();
    };

    const label = "block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide";

    return (
        <div className="space-y-8 animate-fadeIn">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">System Settings</h1>
                <p className="text-base text-slate-500 mt-1 font-medium">Fine-tune the platform, manage access roles, and invite your team.</p>
            </div>

            {/* Premium Tabs */}
            <div className="flex gap-2 border-b border-slate-200/60 pb-1">
                {['general', 'users', 'roles', 'permissions'].map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`px-5 py-2.5 text-[14px] font-bold capitalize rounded-xl transition-all duration-200 ${tab === t ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover hover '}`}>{t}</button>
                ))}
            </div>

            {/* General */}
            {tab === 'general' && (
                <div className="max-w-2xl space-y-6">
                    {user?.role === 'admin' ? (
                        <div className="fw-card p-8 space-y-6">
                            <h3 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-4">Brand Identity</h3>
                            <div><label className={label}>Agency Master Name</label><input value={settings.agencyName} onChange={e => setSettings({ ...settings, agencyName: e.target.value })} className="fw-input" placeholder="Enter full agency name" /></div>
                            <div><label className={label}>Operating Monthly Baseline (₹)</label><input type="number" value={settings.monthlyExpenses} onChange={e => setSettings({ ...settings, monthlyExpenses: Number(e.target.value) })} className="fw-input" placeholder="e.g. 50000" /></div>
                            <div className="pt-4"><button onClick={saveSettings} className="px-6 py-3 bg-indigo-600 hover text-white text-[14px] font-bold rounded-xl shadow-[0_8px_20px_-4px_rgba(79,70,229,0.3)] hover _12px_24px_-6px_rgba(79,70,229,0.4)] transition-all hover .5">Commit Changes</button></div>
                        </div>
                    ) : (
                        <div className="fw-card p-8 text-center text-slate-500 font-medium">General settings are heavily restricted to administrators only.</div>
                    )}
                </div>
            )}

            {/* Users */}
            {tab === 'users' && (
                <div className="space-y-6 animate-slideIn">
                    <div className="flex justify-between items-center bg-white/50 backdrop-blur-md p-4 rounded-2xl border border-slate-200/50 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 flex items-center justify-center rounded-xl">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 leading-tight">Team Members</h3>
                                <p className="text-xs font-semibold text-slate-500">{users.length} active licenses</p>
                            </div>
                        </div>
                        {user?.role === 'admin' && (
                            <button onClick={openAddUser} className="px-5 py-2.5 bg-indigo-600 hover text-white text-[13px] font-bold rounded-xl shadow-[0_8px_20px_-4px_rgba(79,70,229,0.3)] transition-all">Invite User</button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md xl gap-5">
                        {users.map(u => (
                            <div key={u._id} className={`fw-card p-6 ${!u.isActive ? 'opacity-50 grayscale' : ''}`}>
                                <div className="flex items-start justify-between mb-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-500/20">{u.name?.charAt(0)}</div>
                                        <div>
                                            <h4 className="font-bold text-[16px] text-slate-800 leading-tight mb-1">{u.name}</h4>
                                            <p className="text-[13px] font-medium text-slate-500">{u.email}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                                    <span className={`text-[11px] font-bold px-3 py-1 rounded-lg uppercase tracking-wider ${ROLE_COLORS[u.role]}`}>{ROLE_LABELS[u.role]}</span>
                                    {user?.role === 'admin' && (
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => toggleActive(u)} className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition ${u.isActive ? 'text-red-600 bg-red-50 hover ' : 'text-emerald-600 bg-emerald-50 hover '}`}>
                                                {u.isActive ? 'Suspend' : 'Activate'}
                                            </button>
                                            <button onClick={() => openEditUser(u)} className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 hover transition">Edit</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Roles */}
            {tab === 'roles' && (
                <div className="grid grid-cols-1 lg xl gap-6 animate-slideIn">
                    {ROLES.map(role => (
                        <div key={role} className="fw-card p-8 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                                <span className={`text-[12px] font-black px-4 py-1.5 rounded-xl uppercase tracking-widest ${ROLE_COLORS[role]}`}>{ROLE_LABELS[role]}</span>
                                <span className="text-[12px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{users.filter(u => u.role === role).length} seats</span>
                            </div>
                            <div className="space-y-4 flex-1">
                                {ROLE_PERMISSIONS[role].map((perm, i) => (
                                    <div key={i} className="flex items-start gap-4 text-[14px]">
                                        <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        <span className="text-slate-700 font-medium leading-relaxed">{perm}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Permissions Matrix */}
            {tab === 'permissions' && (
                <div className="fw-card overflow-hidden animate-slideIn border-transparent shadow-[0_8px_30px_rgba(0,0,0,0.04)] ring-1 ring-slate-200">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead><tr className="bg-slate-50/80 border-b border-slate-200">
                                <th className="text-left px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Platform Module</th>
                                {ROLES.map(r => <th key={r} className="text-center px-4 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">{ROLE_LABELS[r]}</th>)}
                            </tr></thead>
                            <tbody>
                                {[
                                    { module: 'Dashboard intelligence', perms: { admin: 'full', manager: 'full', sales: 'limited', developer: 'limited', client: 'own' } },
                                    { module: 'Sales Pipeline (CRM)', perms: { admin: 'full', manager: 'full', sales: 'full', developer: 'none', client: 'none' } },
                                    { module: 'Client Roster', perms: { admin: 'full', manager: 'full', sales: 'view', developer: 'view', client: 'own' } },
                                    { module: 'Project Vaults', perms: { admin: 'full', manager: 'full', sales: 'view', developer: 'assigned', client: 'own' } },
                                    { module: 'Task Delegation', perms: { admin: 'full', manager: 'full', sales: 'create', developer: 'assigned', client: 'none' } },
                                    { module: 'Financial Suite', perms: { admin: 'full', manager: 'view', sales: 'none', developer: 'none', client: 'invoices' } },
                                    { module: 'Global Analytics', perms: { admin: 'full', manager: 'full', sales: 'none', developer: 'none', client: 'none' } },
                                    { module: 'Access Protocol', perms: { admin: 'full', manager: 'limited', sales: 'own', developer: 'own', client: 'own' } },
                                ].map((row, i) => (
                                    <tr key={i} className="border-b border-slate-50 hover transition-colors">
                                        <td className="px-6 py-4 text-[14px] font-bold text-slate-800">{row.module}</td>
                                        {ROLES.map(r => {
                                            const p = row.perms[r];
                                            const style = p === 'full' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                p === 'none' ? 'bg-red-50 text-red-600 border border-red-100' :
                                                    'bg-amber-50 text-amber-600 border border-amber-100';
                                            return <td key={r} className="px-4 py-4 text-center"><span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wide inline-block w-[72px] ${style}`}>{p}</span></td>;
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* User Modal */}
            <Modal isOpen={userModal} onClose={() => setUserModal(false)} title={editUserId ? 'Modify License' : 'Issue New License'} maxWidth="max-w-md"
                footer={<>
                    <button type="button" onClick={() => setUserModal(false)} className="px-6 py-3 rounded-xl bg-slate-100 hover text-sm font-bold text-slate-600 transition duration-200">Discard</button>
                    <button type="submit" form="user-form" className="px-6 py-3 bg-indigo-600 hover text-white text-sm font-bold rounded-xl shadow-[0_8px_20px_-4px_rgba(79,70,229,0.3)] transition duration-200">{editUserId ? 'Update License' : 'Confirm Provision'}</button>
                </>}
            >
                <form id="user-form" onSubmit={saveUser} className="space-y-5 px-1 py-1">
                    <div><label className={label}>Identified Name</label><input required value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} className="fw-input" placeholder="E.g. John Doe" /></div>
                    <div><label className={label}>Corporate Email</label><input required type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} className="fw-input" placeholder="john@agency.com" /></div>
                    <div><label className={label}>{editUserId ? 'Override Security Key (Blank to bypass)' : 'Initial Security Key'}</label><input type="password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} className="fw-input" placeholder="••••••••" {...(!editUserId ? { required: true } : {})} /></div>
                    <div><label className={label}>Assigned Role Tier</label>
                        <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })} className="fw-input appearance-none bg-slate-50 focus cursor-pointer select-wrapper relative">
                            {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                        </select>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Settings;
