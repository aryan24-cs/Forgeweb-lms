import React, { useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Reports = () => {
    const [loading, setLoading] = useState(false);

    const downloadCSV = async (endpoint, filename) => {
        setLoading(true);
        try {
            const res = await api.get(endpoint);
            const data = Array.isArray(res.data) ? res.data : [res.data];
            const csv = Papa.unparse(data);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            saveAs(blob, `${filename}.csv`);
            toast.success(`${filename}.csv extracted`);
        } catch { toast.error('Extraction Failed'); }
        setLoading(false);
    };

    const downloadPDF = async (title, endpoint) => {
        setLoading(true);
        try {
            const res = await api.get(endpoint);
            const data = Array.isArray(res.data) ? res.data : [res.data];
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text(`Agency Command - ${title}`, 14, 22);
            doc.setFontSize(10);
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

            if (data.length > 0) {
                const keys = Object.keys(data[0]).filter(k => !k.startsWith('_') && k !== 'password' && k !== '__v');
                const headers = keys.map(k => k.charAt(0).toUpperCase() + k.slice(1));
                const rows = data.map(item => keys.map(k => {
                    const v = item[k];
                    if (typeof v === 'object' && v !== null) return v.name || v._id || JSON.stringify(v);
                    return String(v ?? '');
                }));
                // Using the theme's primary color (#4f46e5)
                doc.autoTable({ head: [headers], body: rows, startY: 38, styles: { fontSize: 8 }, headStyles: { fillColor: [79, 70, 229] } });
            }
            doc.save(`${title.replace(/\s/g, '_')}.pdf`);
            toast.success('PDF report compiled');
        } catch { toast.error('Compilation Failed'); }
        setLoading(false);
    };

    const reports = [
        {
            title: 'Lead Conversion Matrix',
            desc: 'Aggregate pipeline data including origin vectors, fiscal capacity, and progression status.',
            endpoint: '/leads',
            icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50'
        },
        {
            title: 'Client Nexus Log',
            desc: 'Complete overview of active engagements, project timelines, and operative attachments.',
            endpoint: '/clients',
            icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50'
        },
        {
            title: 'Fiscal Revenue Ledgers',
            desc: 'Detailed chronological registry of all inflows, outflows, and billing records.',
            endpoint: '/payments',
            icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            color: 'text-amber-600',
            bg: 'bg-amber-50'
        },
        {
            title: 'Project Tracking Sheet',
            desc: 'Macroscopic breakdown of development phases, velocity, and temporal deadlines.',
            endpoint: '/projects',
            icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
            color: 'text-sky-600',
            bg: 'bg-sky-50'
        },
        {
            title: 'Objective / Task Execution',
            desc: 'Microscopic operative data isolating bottlenecks, workloads, and individual output.',
            endpoint: '/tasks',
            icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
            color: 'text-violet-600',
            bg: 'bg-violet-50'
        }
    ];

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Intelligence Reports</h1>
                <p className="text-base text-slate-500 mt-1 font-medium text-balance max-w-lg">Export structured data matrices to comma-separated models or formalized portable documents.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map((r, i) => (
                    <div key={i} className="fw-card border border-slate-200/80 p-6 flex flex-col items-start bg-white group hover:border-indigo-200 hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_12px_24px_-8px_rgba(79,70,229,0.15)] relative overflow-hidden">
                        {/* Decorative Background Blob */}
                        <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-0 transition-all duration-500 group-hover:scale-150 group-hover:opacity-20 ${r.bg}`}></div>

                        <div className="relative z-10 w-full h-full flex flex-col">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-sm transition-colors duration-300 ${r.bg} ${r.color}`}>
                                {r.icon}
                            </div>

                            <h3 className="font-black text-[16px] text-slate-800 tracking-tight leading-tight">{r.title}</h3>
                            <p className="text-[13px] text-slate-500 mt-2 mb-6 font-medium leading-relaxed flex-1">{r.desc}</p>

                            <div className="grid grid-cols-2 gap-3 mt-auto w-full pt-4 border-t border-slate-100">
                                <button disabled={loading} onClick={() => downloadCSV(r.endpoint, r.title)} className="flex items-center justify-center gap-2 py-2.5 text-[12px] font-bold uppercase tracking-widest rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50 group-hover:bg-slate-800 group-hover:text-white">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                    CSV
                                </button>
                                <button disabled={loading} onClick={() => downloadPDF(r.title, r.endpoint)} className="flex items-center justify-center gap-2 py-2.5 text-[12px] font-bold uppercase tracking-widest rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    PDF
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Reports;
