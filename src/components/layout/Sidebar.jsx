import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const icons = {
    dashboard: <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" /></svg>,
    leads: <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    clients: <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    projects: <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
    payments: <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    analytics: <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    tasks: <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
    reports: <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    settings: <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
};

const navItems = [
    { to: '/', label: 'Overview', icon: 'dashboard' },
    { to: '/leads', label: 'Leads', icon: 'leads' },
    { to: '/clients', label: 'Clients', icon: 'clients' },
    { to: '/projects', label: 'Projects', icon: 'projects' },
    { to: '/payments', label: 'Finance', icon: 'payments' },
    { to: '/analytics', label: 'Analytics', icon: 'analytics' },
    { to: '/tasks', label: 'Tasks', icon: 'tasks' },
    { to: '/reports', label: 'Reports', icon: 'reports' },
    { to: '/settings', label: 'Settings', icon: 'settings' },
];

const Sidebar = () => {
    const [collapsed, setCollapsed] = useState(false);
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => { logout(); navigate('/login'); };

    const isSales = user?.role === 'sales';
    const visibleNavItems = navItems.filter(item => {
        if (isSales && ['/payments', '/analytics', '/reports'].includes(item.to)) return false;
        return true;
    });

    const [mobileMore, setMobileMore] = useState(false);

    // Click outside to close mobile more menu
    React.useEffect(() => {
        const closeMenu = (e) => {
            if (!e.target.closest('.mobile-more-container')) {
                setMobileMore(false);
            }
        };
        document.addEventListener('mousedown', closeMenu);
        return () => document.removeEventListener('mousedown', closeMenu);
    }, []);

    return (
        <>
            {/* Desktop Sidebar (hidden on mobile) */}
            <aside className={`max-md:hidden ${collapsed ? 'w-[88px]' : 'w-[280px]'} h-screen bg-white border-r border-slate-200/60 flex flex-col transition-all duration-300 shrink-0 z-40 relative shadow-[4px_0_24px_rgba(0,0,0,0.02)]`}>
                {/* Logo */}
                <div className={`h-[72px] flex items-center border-b border-slate-200/50 shrink-0 transition-all duration-300 ${collapsed ? 'justify-center px-4' : 'px-8'}`}>
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg shadow-indigo-600/20">FW</div>
                    {!collapsed && <span className="ml-4 font-black text-xl tracking-tight text-slate-800">ForgeWeb</span>}
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-4 overflow-y-auto hide-scrollbar">
                    <div className="space-y-1.5">
                        {!collapsed && <p className="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Main Menu</p>}
                        {visibleNavItems.map(item => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.to === '/'}
                                className={({ isActive }) =>
                                    `flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-[14px] font-semibold transition-all duration-200
                                    ${isActive
                                        ? 'bg-indigo-50 text-indigo-700 shadow-[inset_4px_0_0_0_rgba(79,70,229,1)]'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 group'
                                    }
                                    ${collapsed ? 'justify-center !px-0 shadow-none' : ''}`
                                }
                                title={collapsed ? item.label : ''}
                            >
                                {({ isActive }) => (
                                    <>
                                        <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                            {icons[item.icon]}
                                        </div>
                                        {!collapsed && <span>{item.label}</span>}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </div>
                </nav>

                {/* Bottom Actions for Desktop */}
                <div className="p-4 border-t border-slate-200/50 space-y-2 shrink-0 bg-slate-50/50">
                    <button
                        onClick={handleLogout}
                        className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-[14px] font-semibold w-full text-red-500 hover:bg-red-50 transition-all duration-200 group ${collapsed ? 'justify-center !px-2' : ''}`}
                    >
                        <svg className="w-[22px] h-[22px] transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        {!collapsed && <span>Logout</span>}
                    </button>
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-[14px] font-semibold w-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all duration-200 group ${collapsed ? 'justify-center !px-2' : ''}`}
                    >
                        <svg className="w-[22px] h-[22px] transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            {collapsed
                                ? <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                : <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            }
                        </svg>
                        {!collapsed && <span>Collapse</span>}
                    </button>
                </div>
            </aside>

            {/* Mobile Bottom Navigation (hidden on desktop) */}
            <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200/60 z-50 flex justify-around items-center px-2 py-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
                {visibleNavItems.slice(0, 4).map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        onClick={() => setMobileMore(false)}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center gap-1 p-2 rounded-xl flex-1 max-w-[72px] transition-all duration-200
                            ${isActive
                                ? 'text-indigo-600'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                                    {icons[item.icon]}
                                </div>
                                <span className={`text-[10px] font-bold leading-none ${isActive ? 'text-indigo-600' : 'text-slate-500'}`}>{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}

                {/* Mobile More Button */}
                {visibleNavItems.length > 4 && (
                    <div className="relative flex-1 max-w-[72px] flex justify-center mobile-more-container">
                        <button
                            onClick={() => setMobileMore(!mobileMore)}
                            className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl w-full transition-all duration-200
                            ${mobileMore ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                        >
                            <svg className={`w-[22px] h-[22px] transition-transform duration-200 ${mobileMore ? 'scale-110' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            <span className={`text-[10px] font-bold leading-none ${mobileMore ? 'text-indigo-600' : 'text-slate-500'}`}>More</span>
                        </button>

                        {/* Floating More Menu */}
                        {mobileMore && (
                            <div className="absolute bottom-[100%] right-0 mb-3 w-48 bg-white rounded-2xl shadow-[0_15px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-100 overflow-hidden animate-slideIn origin-bottom-right">
                                <div className="py-2">
                                    <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/50 mb-1 border-b border-slate-100">More Tools</div>
                                    {visibleNavItems.slice(4).map(item => (
                                        <NavLink
                                            key={item.to}
                                            to={item.to}
                                            end={item.to === '/'}
                                            onClick={() => setMobileMore(false)}
                                            className={({ isActive }) => `flex items-center gap-3 px-4 py-3.5 text-[14px] font-semibold transition-all ${isActive ? 'bg-indigo-50 text-indigo-700 shadow-[inset_4px_0_0_0_rgba(79,70,229,1)]' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}`}
                                        >
                                            {({ isActive }) => (
                                                <>
                                                    <div className={isActive ? 'text-indigo-600' : 'text-slate-400'}>{icons[item.icon]}</div>
                                                    {item.label}
                                                </>
                                            )}
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </nav>
        </>
    );
};

export default Sidebar;
