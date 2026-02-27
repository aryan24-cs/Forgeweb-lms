import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useNavigate } from 'react-router-dom';

const Topbar = () => {
    const { user } = useAuth();
    const { raw } = useData();
    const navigate = useNavigate();

    const [search, setSearch] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Global Search Logic
    const results = useMemo(() => {
        if (!search || !raw) return { leads: [], clients: [], projects: [], tasks: [] };
        const q = search.toLowerCase();

        return {
            leads: (raw.leads || []).filter(l => l.name?.toLowerCase().includes(q) || l.company?.toLowerCase().includes(q)).slice(0, 3),
            clients: (raw.clients || []).filter(c => c.name?.toLowerCase().includes(q) || c.businessName?.toLowerCase().includes(q)).slice(0, 3),
            projects: (raw.projects || []).filter(p => p.name?.toLowerCase().includes(q)).slice(0, 3),
            tasks: (raw.tasks || []).filter(t => t.title?.toLowerCase().includes(q)).slice(0, 3)
        };
    }, [search, raw]);

    const handleNavigate = (path) => {
        navigate(path);
        setSearch('');
        setShowDropdown(false);
    };

    const hasResults = results.leads.length > 0 || results.clients.length > 0 || results.projects.length > 0 || results.tasks.length > 0;

    return (
        <header className="h-[72px] fw-topbar flex items-center justify-between px-8 border-b border-slate-200/50 shrink-0 z-30 sticky top-0">
            {/* Search */}
            <div className="flex items-center gap-4 flex-1">
                <div className="relative max-w-md w-full" ref={dropdownRef}>
                    <svg className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search leads, projects, teammates..."
                        className="fw-input pl-11 py-2.5 bg-slate-50/50 border-transparent hover focus transition-all duration-300"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                    />

                    {/* Search Dropdown */}
                    {showDropdown && search && (
                        <div className="absolute top-[calc(100%+8px)] left-0 w-[400px] bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden z-50 animate-slideIn">
                            {hasResults ? (
                                <div className="max-h-[400px] overflow-y-auto p-2">
                                    {/* Clients */}
                                    {results.clients.length > 0 && (
                                        <div className="mb-2">
                                            <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Clients</div>
                                            {results.clients.map(c => (
                                                <div key={c._id} onClick={() => handleNavigate('/clients')} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl cursor-pointer group transition-colors">
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">{c.name?.charAt(0)}</div>
                                                    <div>
                                                        <p className="text-[13px] font-bold text-slate-800 leading-tight group-hover:text-emerald-600 transition-colors">{c.name}</p>
                                                        <p className="text-[11px] font-semibold text-slate-400">{c.businessName || 'Independent'}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Leads */}
                                    {results.leads.length > 0 && (
                                        <div className="mb-2">
                                            <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Leads</div>
                                            {results.leads.map(l => (
                                                <div key={l._id} onClick={() => handleNavigate('/leads')} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl cursor-pointer group transition-colors">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">{l.name?.charAt(0)}</div>
                                                    <div>
                                                        <p className="text-[13px] font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">{l.name}</p>
                                                        <p className="text-[11px] font-semibold text-slate-400">{l.company || 'Opportunity'}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Projects */}
                                    {results.projects.length > 0 && (
                                        <div className="mb-2">
                                            <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Projects</div>
                                            {results.projects.map(p => (
                                                <div key={p._id} onClick={() => handleNavigate('/projects')} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl cursor-pointer group transition-colors">
                                                    <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-bold text-slate-800 leading-tight group-hover:text-sky-600 transition-colors">{p.name}</p>
                                                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{p.status}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Tasks */}
                                    {results.tasks.length > 0 && (
                                        <div className="mb-2">
                                            <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Tasks</div>
                                            {results.tasks.map(t => (
                                                <div key={t._id} onClick={() => handleNavigate('/tasks')} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl cursor-pointer group transition-colors">
                                                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-bold text-slate-800 leading-tight group-hover:text-amber-600 transition-colors">{t.title}</p>
                                                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t.status}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-8 text-center flex flex-col items-center">
                                    <svg className="w-10 h-10 text-slate-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    <p className="text-[13px] font-bold text-slate-600">No signals intercepted.</p>
                                    <p className="text-[11px] font-semibold text-slate-400 mt-1">Try expanding your search parameters.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
                {/* Notifications */}
                <button className="p-2.5 rounded-xl hover text-slate-500 hover transition-colors relative">
                    <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                </button>

                {/* Divider */}
                <div className="h-6 w-px bg-slate-200 mx-1"></div>

                {/* Profile */}
                <div className="flex items-center gap-3 p-1.5 pr-2 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-indigo-500/20">
                        {user?.name?.[0] || 'A'}
                    </div>
                    <div className="hidden lg:block text-left">
                        <p className="text-sm font-bold text-slate-800 leading-none mb-1">{user?.name || 'Admin'}</p>
                        <p className="text-[11px] font-semibold text-slate-500 capitalize tracking-wide">{user?.role || 'admin'}</p>
                    </div>
                </div>

                {/* Logout Button (Desktop & Mobile accessible) */}
                <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className="p-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                    title="Logout"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </div>
        </header>
    );
};

export default Topbar;
