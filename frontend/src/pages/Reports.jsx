import React, { useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Helper to flatten nested object for tabular displays
const flattenData = (data) => {
    if (!data || data.length === 0) return [];
    return data.map(item => {
        const flatItem = {};
        for (const [key, value] of Object.entries(item)) {
            // Ignore system keys and sensitive info
            if (key.startsWith('_') || key === 'password' || key === '__v') continue;

            if (value && typeof value === 'object' && !Array.isArray(value)) {
                // Populate deeply nested common properties like client.name, user.name
                flatItem[key] = value.name || value.title || value.founderName || value._id || JSON.stringify(value);
            } else if (Array.isArray(value)) {
                flatItem[key] = value.map(v => (v && typeof v === 'object') ? (v.name || v._id) : v).join(', ');
            } else if (key.toLowerCase().includes('date') && value) {
                const dateVal = new Date(value);
                flatItem[key] = isNaN(dateVal) ? value : dateVal.toLocaleDateString();
            } else {
                flatItem[key] = value ?? '—';
            }
        }
        return flatItem;
    });
};

const Reports = () => {
    const [loading, setLoading] = useState(false);

    const fetchData = async (endpoint, title) => {
        try {
            const res = await api.get(endpoint);
            const data = Array.isArray(res.data) ? res.data : [res.data];

            if (data.length === 0) {
                toast.error(`No data available for ${title}.`);
                return null;
            }
            return flattenData(data);
        } catch (error) {
            console.error(error);
            toast.error('Report generation failed. Please try again.');
            return null;
        }
    };

    const downloadCSV = async (endpoint, filename) => {
        setLoading(true);
        const data = await fetchData(endpoint, filename);
        if (data && data.length > 0) {
            try {
                const csv = Papa.unparse(data);
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                saveAs(blob, `${filename}.csv`);
                toast.success(`${filename}.csv extracted`);
            } catch (err) {
                toast.error('Report generation failed. Please try again.');
            }
        }
        setLoading(false);
    };

    const downloadExcel = async (endpoint, filename) => {
        setLoading(true);
        const data = await fetchData(endpoint, filename);
        if (data && data.length > 0) {
            try {
                const worksheet = XLSX.utils.json_to_sheet(data);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, filename.substring(0, 31)); // Max 31 chars for sheet name
                XLSX.writeFile(workbook, `${filename}.xlsx`);
                toast.success(`${filename}.xlsx compiled`);
            } catch (err) {
                toast.error('Report generation failed. Please try again.');
            }
        }
        setLoading(false);
    };

    const downloadPDF = async (title, endpoint) => {
        setLoading(true);
        const data = await fetchData(endpoint, title);
        if (data && data.length > 0) {
            try {
                const doc = new jsPDF('landscape'); // Landscape holds more columns
                doc.setFontSize(18);
                doc.text(`Agency Command - ${title}`, 14, 22);
                doc.setFontSize(10);
                doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

                const headers = Object.keys(data[0]).map(k => k.charAt(0).toUpperCase() + k.slice(1));
                const rows = data.map(item => Object.values(item).map(String));

                doc.autoTable({
                    head: [headers],
                    body: rows,
                    startY: 38,
                    styles: { fontSize: 8, overflow: 'linebreak', cellWidth: 'wrap' },
                    headStyles: { fillColor: [79, 70, 229] }
                });

                doc.save(`${title.replace(/\s/g, '_')}.pdf`);
                toast.success('PDF report compiled');
            } catch (error) {
                console.error(error);
                toast.error('Report generation failed. Please try again.');
            }
        }
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
        },
        {
            title: 'Expense Operations & Outflows',
            desc: 'Consolidated report parsing internal expenses, overhead limits, and third-party vendor sums.',
            endpoint: '/expenses',
            icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            color: 'text-rose-600',
            bg: 'bg-rose-50'
        },
        {
            title: 'Founder Profit & Withdrawals',
            desc: 'Formal declaration of executive share splits and completed capital withdrawals.',
            endpoint: '/founder-withdrawals',
            icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
            color: 'text-fuchsia-600',
            bg: 'bg-fuchsia-50'
        },
        {
            title: 'Salary Dispensation Log',
            desc: 'Comprehensive records detailing payouts, roles, and monthly compensation.',
            endpoint: '/salaries/payments',
            icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
            color: 'text-teal-600',
            bg: 'bg-teal-50'
        }
    ];

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Intelligence Reports</h1>
                <p className="text-base text-slate-500 mt-1 font-medium text-balance max-w-lg">Export structured data matrices to comma-separated models, spreadsheets, or formalized portable documents.</p>
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

                            <div className="grid grid-cols-3 gap-2 mt-auto w-full pt-4 border-t border-slate-100">
                                <button disabled={loading} onClick={() => downloadCSV(r.endpoint, r.title)} className="flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50 group-hover:bg-slate-800 group-hover:text-white">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                    CSV
                                </button>
                                <button disabled={loading} onClick={() => downloadExcel(r.endpoint, r.title)} className="flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-50">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    XLSX
                                </button>
                                <button disabled={loading} onClick={() => downloadPDF(r.title, r.endpoint)} className="flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
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
