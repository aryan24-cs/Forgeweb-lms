import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import { 
    Calendar, 
    Settings, 
    Plus, 
    Trash2, 
    GripVertical, 
    Download, 
    CheckCircle2, 
    Circle, 
    ChevronLeft, 
    ChevronRight,
    Search,
    Edit3,
    Clock,
    LayoutGrid,
    MoreHorizontal
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameMonth, addMonths, subMonths, parseISO, isAfter } from 'date-fns';
import * as XLSX from 'xlsx';

const DailyChecklist = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [masterTasks, setMasterTasks] = useState([]);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [manageModal, setManageModal] = useState(false);
    
    const todayDesktopRef = useRef(null);
    const todayMobileRef = useRef(null);

    // Task Management State
    const [newTaskName, setNewTaskName] = useState('');
    const [editingTask, setEditingTask] = useState(null);

    const monthStr = format(currentMonth, 'yyyy-MM');
    const daysInMonth = useMemo(() => {
        return eachDayOfInterval({
            start: startOfMonth(currentMonth),
            end: endOfMonth(currentMonth)
        });
    }, [currentMonth]);

    useEffect(() => {
        fetchData();
    }, [currentMonth]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tasksRes, recordsRes] = await Promise.all([
                api.get('/daily-tasks'),
                api.get(`/daily-records/${monthStr}`)
            ]);
            setMasterTasks(tasksRes.data);
            setRecords(recordsRes.data);
        } catch (err) {
            toast.error('Failed to load checklist data');
        } finally {
            setLoading(false);
            // Auto scroll to today
            setTimeout(() => {
                if (window.innerWidth < 768 && todayMobileRef.current) {
                    todayMobileRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else if (todayDesktopRef.current) {
                    todayDesktopRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 300);
        }
    };

    const handleToggle = async (dateStr, taskId, currentStatus) => {
        const newStatus = !currentStatus;
        
        // Optimistic UI Update
        setRecords(prev => {
            const idx = prev.findIndex(r => r.date === dateStr);
            const newRecords = [...prev];
            if (idx > -1) {
                const record = { ...newRecords[idx], tasks: [...newRecords[idx].tasks] };
                const taskIdx = record.tasks.findIndex(t => t.taskId === taskId);
                if (taskIdx > -1) {
                    record.tasks[taskIdx] = { ...record.tasks[taskIdx], completed: newStatus };
                } else {
                    record.tasks.push({ taskId, completed: newStatus });
                }
                newRecords[idx] = record;
            } else {
                newRecords.push({ date: dateStr, tasks: [{ taskId, completed: newStatus }] });
            }
            return newRecords;
        });

        try {
            await api.put(`/daily-records/${dateStr}/toggle`, {
                taskId,
                completed: newStatus
            });
        } catch (err) {
            toast.error('Update failed');
            fetchData(); // Rollback on error
        }
    };

    const handleMarkAll = async (dateStr, allCompleted) => {
        const newStatus = !allCompleted;
        
        // Optimistic UI Update
        setRecords(prev => {
            const idx = prev.findIndex(r => r.date === dateStr);
            const newRecords = [...prev];
            const updatedTasks = masterTasks.map(t => ({ taskId: t._id, completed: newStatus }));
            
            if (idx > -1) {
                newRecords[idx] = { ...newRecords[idx], tasks: updatedTasks };
            } else {
                newRecords.push({ date: dateStr, tasks: updatedTasks });
            }
            return newRecords;
        });

        try {
            await api.put(`/daily-records/${dateStr}/mark-all`, {
                completed: newStatus
            });
            toast.success(newStatus ? 'Day completed!' : 'Day unmarked');
        } catch (err) {
            toast.error('Bulk update failed');
            fetchData(); // Rollback on error
        }
    };

    // Task Management Methods
    const addMasterTask = async () => {
        if (!newTaskName.trim()) return;
        try {
            const res = await api.post('/daily-tasks', { name: newTaskName, order: masterTasks.length });
            setMasterTasks([...masterTasks, res.data]);
            setNewTaskName('');
            toast.success('Task added to future rosters');
        } catch (err) {
            toast.error('Failed to add task');
        }
    };

    const updateMasterTask = async (id, updates) => {
        try {
            const res = await api.put(`/daily-tasks/${id}`, updates);
            setMasterTasks(masterTasks.map(t => t._id === id ? res.data : t));
            setEditingTask(null);
            toast.success('Task recalibrated');
        } catch (err) {
            toast.error('Update failed');
        }
    };

    const deleteMasterTask = async (id) => {
        if (!confirm('Remove this task from future checklists? Past records remain safe.')) return;
        try {
            await api.delete(`/daily-tasks/${id}`);
            setMasterTasks(masterTasks.filter(t => t._id !== id));
            toast.success('Task retired');
        } catch (err) {
            toast.error('Deletion failed');
        }
    };

    const exportExcel = () => {
        const data = daysInMonth.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const record = records.find(r => r.date === dateStr);
            const row = { Date: dateStr };
            
            // For export, we use the master tasks or the record tasks
            const displayTasks = record ? record.tasks : masterTasks;
            displayTasks.forEach(t => {
                row[t.name] = record ? (record.tasks.find(rt => rt.taskId === (t.taskId || t._id))?.completed ? 'YES' : 'NO') : '-';
            });
            return row;
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Task Record");
        XLSX.writeFile(wb, `Task_Record_${monthStr}.xlsx`);
    };

    const getStat = (dateStr) => {
        const record = records.find(r => r.date === dateStr);
        if (!record) return { done: 0, total: masterTasks.length };
        return {
            done: record.tasks.filter(t => t.completed).length,
            total: record.tasks.length
        };
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-10">
            {/* Header / Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Task Records</h1>
                        <p className="text-sm text-slate-500 font-medium">Monitoring operational consistency</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center bg-slate-50 p-1.5 rounded-xl border border-slate-200 shadow-sm">
                        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-500"><ChevronLeft className="w-5 h-5"/></button>
                        <div className="px-4 text-sm font-black text-slate-700 uppercase tracking-widest min-w-[140px] text-center">
                            {format(currentMonth, 'MMMM yyyy')}
                        </div>
                        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-500"><ChevronRight className="w-5 h-5"/></button>
                    </div>

                    <button onClick={() => setManageModal(true)} className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                        <Settings className="w-4 h-4" /> Manage Tasks
                    </button>
                    
                    <button onClick={exportExcel} className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-[0_8px_20px_-4px_rgba(79,70,229,0.3)]">
                        <Download className="w-4 h-4" /> Export
                    </button>
                </div>
            </div>

            {/* Grid View (Desktop) & Card View (Mobile) */}
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)] overflow-hidden">
                
                {/* Desktop View (Matrix) */}
                <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-[70vh] custom-scrollbar relative">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 sticky top-0 z-30">
                                <th className="p-6 sticky left-0 z-40 bg-slate-100 border-r border-slate-200/60 min-w-[160px] shadow-[4px_0_10px_rgba(0,0,0,0.02)]">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Date / Matrix</span>
                                    </div>
                                </th>
                                {masterTasks.map(task => (
                                    <th key={task._id} className="p-4 border-b border-slate-200/60 min-w-[180px] group">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-6 rounded-full bg-indigo-500/10 group-hover:bg-indigo-500 transition-colors"></div>
                                            <span className="text-[13px] font-bold text-slate-700 line-clamp-1" title={task.name}>{task.name}</span>
                                        </div>
                                    </th>
                                ))}
                                <th className="p-4 border-b border-slate-200/60 min-w-[140px] text-center">
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Efficiency</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {daysInMonth.map((day, dIdx) => {
                                const dateStr = format(day, 'yyyy-MM-dd');
                                const record = records.find(r => r.date === dateStr);
                                const { done, total } = getStat(dateStr);
                                const isDayToday = isToday(day);
                                const isDayFuture = isAfter(day, new Date()) && !isDayToday;
                                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                const allDone = total > 0 && done === total;

                                return (
                                    <tr key={dateStr} ref={isDayToday ? todayDesktopRef : null} className={`group hover:bg-slate-50/50 transition-colors ${isDayToday ? 'bg-indigo-50/30' : ''}`}>
                                        <td className={`p-4 px-6 sticky left-0 z-20 transition-all border-r border-slate-100/50 ${isDayToday ? 'bg-indigo-50/80 border-indigo-100' : 'bg-white shadow-[2px_0_8px_rgba(0,0,0,0.01)]'} group-hover:bg-slate-50`}>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[15px] font-black ${isDayToday ? 'text-indigo-600' : 'text-slate-800'}`}>{format(day, 'dd')}</span>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isWeekend ? 'text-rose-500' : 'text-slate-400'}`}>{format(day, 'EEE')}</span>
                                                    {isDayToday && <div className="px-1.5 py-0.5 rounded-full bg-indigo-600 text-[8px] text-white font-black uppercase tracking-tighter shadow-sm animate-pulse">Live</div>}
                                                </div>
                                                <button 
                                                    onClick={() => handleMarkAll(dateStr, allDone)}
                                                    className={`mt-1.5 text-[9px] font-black uppercase tracking-widest py-1 px-2 rounded-lg border transition-all w-fit
                                                        ${allDone 
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                            : 'bg-white text-slate-400 border-slate-200 hover:text-indigo-600 hover:border-indigo-300'
                                                        }`}
                                                >
                                                    {allDone ? 'Day Locked' : 'Mark Day'}
                                                </button>
                                            </div>
                                        </td>
                                        {masterTasks.map(task => {
                                            const taskInRecord = record?.tasks.find(rt => rt.taskId === task._id);
                                            const isChecked = taskInRecord ? taskInRecord.completed : false;
                                            
                                            // Handle case where record exists but task isn't in it (e.g. newly added task)
                                            // We show it as incomplete even if record doesn't have it yet.
                                            return (
                                                <td key={task._id} className="p-4 py-8 text-center">
                                                    <div className="relative inline-flex items-center justify-center">
                                                        <input 
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            disabled={isDayFuture}
                                                            onChange={() => handleToggle(dateStr, task._id, isChecked)}
                                                            className="w-7 h-7 rounded-lg text-indigo-600 border-slate-200 focus:ring-0 focus:ring-offset-0 cursor-pointer disabled:cursor-not-allowed transition-all checked:animate-pop appearance-none border-2 checked:border-0 checked:bg-indigo-600 relative overflow-hidden group"
                                                        />
                                                        {isChecked && (
                                                            <div className="absolute pointer-events-none text-white transition-opacity">
                                                                <CheckCircle2 className="w-5 h-5" />
                                                            </div>
                                                        )}
                                                        {!isChecked && !isDayFuture && (
                                                            <div className="absolute pointer-events-none opacity-0 group-hover:opacity-10 text-slate-300">
                                                                <Circle className="w-5 h-5 fill-current" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                        <td className="p-4 px-6">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <div className="w-full max-w-[80px] h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200/10">
                                                    <div 
                                                        className={`h-full transition-all duration-500 rounded-full shadow-sm ${allDone ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-indigo-600 to-indigo-400'}`} 
                                                        style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
                                                    ></div>
                                                </div>
                                                <span className={`text-[10px] font-black uppercase tracking-tight ${allDone ? 'text-emerald-600' : 'text-slate-500'}`}>
                                                    {done}/{total} Done
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View (Cards) */}
                <div className="md:hidden overflow-y-auto max-h-[75vh] custom-scrollbar bg-slate-50/50 p-4 space-y-4">
                    {daysInMonth.map((day) => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const record = records.find(r => r.date === dateStr);
                        const { done, total } = getStat(dateStr);
                        const isDayToday = isToday(day);
                        const isDayFuture = isAfter(day, new Date()) && !isDayToday;
                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                        const allDone = total > 0 && done === total;

                        return (
                            <div key={dateStr} ref={isDayToday ? todayMobileRef : null} className={`bg-white rounded-2xl border ${isDayToday ? 'border-indigo-200 shadow-md ring-1 ring-indigo-50' : 'border-slate-100 shadow-sm'} p-4 transition-all relative overflow-hidden`}>
                                {isDayToday && <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>}
                                
                                {/* Card Header */}
                                <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center ${isDayToday ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-700'}`}>
                                            <span className="text-lg font-black leading-none">{format(day, 'dd')}</span>
                                            <span className={`text-[9px] font-black uppercase tracking-widest mt-1 ${isWeekend ? 'text-rose-500' : 'text-slate-400'}`}>{format(day, 'EEE')}</span>
                                        </div>
                                        {isDayToday && (
                                            <div className="px-2 py-0.5 rounded-md bg-indigo-600 text-[9px] text-white font-black uppercase tracking-widest shadow-sm animate-pulse">Live</div>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                            <span className={`text-[10px] font-black uppercase tracking-tight ${allDone ? 'text-emerald-600' : 'text-slate-500'}`}>
                                                {done}/{total} Done
                                            </span>
                                        </div>
                                        <button 
                                            onClick={() => handleMarkAll(dateStr, allDone)}
                                            disabled={isDayFuture}
                                            className={`text-[9px] font-black uppercase tracking-widest py-1 px-2.5 rounded-lg border transition-all ${isDayFuture ? 'opacity-50 cursor-not-allowed hidden' : ''}
                                                ${allDone 
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                    : 'bg-white text-slate-500 border-slate-200 hover:text-indigo-600 hover:border-indigo-300'
                                                }`}
                                        >
                                            {allDone ? 'Locked' : 'Mark All'}
                                        </button>
                                    </div>
                                </div>

                                {/* Task List */}
                                <div className="space-y-2">
                                    {masterTasks.map(task => {
                                        const taskInRecord = record?.tasks.find(rt => rt.taskId === task._id);
                                        const isChecked = taskInRecord ? taskInRecord.completed : false;
                                        return (
                                            <div key={task._id} className="flex items-center justify-between group">
                                                <span className={`text-sm font-semibold transition-colors ${isChecked ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                                    {task.name}
                                                </span>
                                                <div className="relative inline-flex items-center justify-center scale-90">
                                                    <input 
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        disabled={isDayFuture}
                                                        onChange={() => handleToggle(dateStr, task._id, isChecked)}
                                                        className="w-7 h-7 rounded-lg text-indigo-600 border-slate-200 focus:ring-0 focus:ring-offset-0 cursor-pointer disabled:cursor-not-allowed transition-all checked:animate-pop appearance-none border-2 checked:border-0 checked:bg-indigo-600 relative overflow-hidden"
                                                    />
                                                    {isChecked && (
                                                        <div className="absolute pointer-events-none text-white">
                                                            <CheckCircle2 className="w-5 h-5" />
                                                        </div>
                                                    )}
                                                    {!isChecked && !isDayFuture && (
                                                        <div className="absolute pointer-events-none opacity-0 group-hover:opacity-10 text-slate-300">
                                                            <Circle className="w-5 h-5 fill-current" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>


                {loading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-50">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Parsing Archive...</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Manage Tasks Modal */}
            <Modal isOpen={manageModal} onClose={() => setManageModal(false)} title="Operational Protocol Tuning" maxWidth="max-w-xl">
                <div className="p-2 space-y-8">
                    {/* Add New Task */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 shadow-inner">
                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Initialize New Directive</h4>
                        <div className="flex gap-2">
                            <input 
                                value={newTaskName}
                                onChange={e => setNewTaskName(e.target.value)}
                                placeholder="E.g., Generate Day Breakdown"
                                className="fw-input flex-1 font-bold text-sm bg-white"
                                onKeyDown={e => e.key === 'Enter' && addMasterTask()}
                            />
                            <button onClick={addMasterTask} className="px-5 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all font-black text-sm">
                                <Plus className="w-5 h-5"/>
                            </button>
                        </div>
                        <p className="mt-4 text-[10px] italic text-slate-400 leading-relaxed font-medium">✨ New tasks will automatically be appended to all future rosters. Existing records remain locked for compliance.</p>
                    </div>

                    {/* Current Master List */}
                    <div className="space-y-4">
                        <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] px-1">Active Protocols ({masterTasks.length})</h4>
                        <div className="space-y-2.5">
                            {masterTasks.map((task, index) => (
                                <div key={task._id} className="group flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.03)]">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[11px] font-black text-slate-400 border border-slate-200/50">
                                        {index + 1}
                                    </div>
                                    
                                    {editingTask === task._id ? (
                                        <input 
                                            autoFocus
                                            defaultValue={task.name}
                                            className="flex-1 bg-slate-50 border-none rounded-lg px-3 py-1 font-bold text-sm focus:ring-2 focus:ring-indigo-100"
                                            onBlur={e => updateMasterTask(task._id, { name: e.target.value })}
                                            onKeyDown={e => e.key === 'Enter' && updateMasterTask(task._id, { name: e.target.value })}
                                        />
                                    ) : (
                                        <p className="flex-1 text-[13px] font-bold text-slate-700">{task.name}</p>
                                    )}

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                        <button onClick={() => setEditingTask(task._id)} className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"><Edit3 className="w-4 h-4" /></button>
                                        <button onClick={() => deleteMasterTask(task._id)} className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                        <div className="p-2 text-slate-300 cursor-move"><GripVertical className="w-4 h-4" /></div>
                                    </div>
                                </div>
                            ))}
                            {masterTasks.length === 0 && (
                                <div className="py-12 text-center text-slate-400 font-bold border-2 border-dashed border-slate-100 rounded-3xl">
                                    No active protocols defined.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>
            
            <style jsx>{`
                @keyframes pop {
                    0% { transform: scale(0.9); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
                .animate-pop {
                    animation: pop 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .appearance-none {
                    -webkit-appearance: none;
                    appearance: none;
                }
                .divide-y-custom > :not([hidden]) ~ :not([hidden]) {
                    border-top-width: 1px;
                }
            `}</style>
        </div>
    );
};

export default DailyChecklist;
