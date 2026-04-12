import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';
import Modal from '../components/ui/Modal';
import { 
    Plus, 
    Search, 
    Pin, 
    Trash2, 
    Edit3, 
    Tag, 
    Palette, 
    Check, 
    X,
    LayoutGrid,
    List,
    BookOpen,
    Star,
    Clock,
    User,
    Share2,
    StickyNote
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const COLORS = [
    { name: 'Default', value: 'bg-white', accent: 'from-slate-200 to-slate-100', border: 'border-slate-200' },
    { name: 'Blue', value: 'bg-blue-50/40', accent: 'from-blue-500 to-sky-400', border: 'border-blue-100' },
    { name: 'Emerald', value: 'bg-emerald-50/40', accent: 'from-emerald-500 to-teal-400', border: 'border-emerald-100' },
    { name: 'Amber', value: 'bg-amber-50/40', accent: 'from-amber-500 to-orange-400', border: 'border-amber-100' },
    { name: 'Purple', value: 'bg-purple-50/40', accent: 'from-purple-500 to-violet-400', border: 'border-purple-100' },
    { name: 'Rose', value: 'bg-rose-50/40', accent: 'from-rose-500 to-pink-400', border: 'border-rose-100' },
    { name: 'Indigo', value: 'bg-indigo-50/40', accent: 'from-indigo-500 to-blue-400', border: 'border-indigo-100' },
];

const Notes = () => {
    const [notes, setNotes] = useState([]);
    const [publicNotes, setPublicNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [activeTab, setActiveTab] = useState('mine');
    const [currentNote, setCurrentNote] = useState({
        title: '',
        content: '',
        color: 'bg-white',
        pinned: false,
        isPublic: false,
        tags: []
    });

    useEffect(() => {
        fetchNotes();
        fetchPublicNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            setLoading(true);
            const res = await api.get('/notes');
            setNotes(res.data);
        } catch (err) {
            toast.error('Failed to fetch your notes');
        } finally {
            setLoading(false);
        }
    };

    const fetchPublicNotes = async () => {
        try {
            const res = await api.get('/notes/public');
            setPublicNotes(res.data);
        } catch (err) {
            console.error('Error fetching public notes', err);
        }
    };

    const handleSaveNote = async (e) => {
        if (e) e.preventDefault();
        if (!currentNote.title || !currentNote.content) {
            toast.error('Title and content are required');
            return;
        }

        try {
            const noteData = {
                ...currentNote,
                color: currentNote.color || 'bg-white'
            };

            if (currentNote._id) {
                await api.put(`/notes/${currentNote._id}`, noteData);
                setNotes(notes.map(n => n._id === currentNote._id ? { ...noteData, updatedAt: new Date() } : n));
                toast.success('Note updated');
            } else {
                const res = await api.post('/notes', noteData);
                setNotes([res.data, ...notes]);
                toast.success('Note created');
            }
            if (currentNote.isPublic) fetchPublicNotes();
            setIsEditing(false);
            resetCurrentNote();
        } catch (err) {
            toast.error('Error saving note');
        }
    };

    const handleDeleteNote = async (id) => {
        if (!window.confirm('Delete this note?')) return;
        try {
            await api.delete(`/notes/${id}`);
            setNotes(notes.filter(n => n._id !== id));
            setPublicNotes(publicNotes.filter(n => n._id !== id));
            toast.success('Note deleted');
        } catch (err) {
            toast.error('Error deleting note');
        }
    };

    const togglePin = async (note) => {
        try {
            const updated = { ...note, pinned: !note.pinned };
            await api.put(`/notes/${note._id}`, { pinned: updated.pinned });
            setNotes(notes.map(n => n._id === note._id ? updated : n).sort((a, b) => b.pinned - a.pinned || new Date(b.updatedAt) - new Date(a.updatedAt)));
        } catch (err) {
            toast.error('Error updating note');
        }
    };

    const resetCurrentNote = () => {
        setCurrentNote({
            title: '',
            content: '',
            color: 'bg-white',
            pinned: false,
            isPublic: false,
            tags: []
        });
    };

    const openEdit = (note) => {
        setCurrentNote(note);
        setIsEditing(true);
    };

    const currentDisplayNotes = activeTab === 'mine' ? notes : publicNotes;

    const filteredNotes = useMemo(() => {
        return currentDisplayNotes.filter(n => 
            n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [currentDisplayNotes, searchQuery]);

    const pinnedNotes = filteredNotes.filter(n => n.pinned);
    const otherNotes = filteredNotes.filter(n => !n.pinned);

    if (loading && notes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
                </div>
                <p className="text-sm text-slate-400 font-medium animate-pulse">Loading core notes...</p>
            </div>
        );
    }

    const labelStyle = "block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide";

    return (
        <div className="space-y-7 pb-20 animate-fadeIn">
            {/* Header section — Aligned with Forgeweb SSOT pattern */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                        {activeTab === 'mine' ? 'Knowledge Base' : 'Shared Intelligence'}
                    </h1>
                    <p className="text-base text-slate-500 mt-1 font-medium">
                        {activeTab === 'mine' 
                            ? `${notes.length} internal notes documented`
                            : `${publicNotes.length} team assets available`
                        }
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Activity Tabs */}
                    <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
                        <button 
                            onClick={() => setActiveTab('mine')}
                            className={`px-4 py-2 text-[12px] font-bold rounded-lg transition-all ${
                                activeTab === 'mine' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Personal
                        </button>
                        <button 
                            onClick={() => setActiveTab('public')}
                            className={`px-4 py-2 text-[12px] font-bold rounded-lg transition-all ${
                                activeTab === 'public' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Global
                        </button>
                    </div>

                    <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block" />

                    <button 
                        onClick={() => { resetCurrentNote(); setIsEditing(true); }}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold rounded-xl shadow-[0_8px_20px_-4px_rgba(79,70,229,0.3)] transition-all uppercase tracking-wider flex items-center gap-2"
                    >
                        <Plus size={16} strokeWidth={3} />
                        New Note
                    </button>
                </div>
            </div>

            {/* Utility Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-2">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search documentation..."
                        className="fw-input pl-10 text-[13px] bg-white border-slate-200"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Empty State */}
            {filteredNotes.length === 0 && (
                <div className="bg-white rounded-[22px] border border-dashed border-slate-200 p-20 text-center shadow-sm">
                    <div className="w-20 h-20 rounded-[22px] bg-slate-50 flex items-center justify-center mx-auto mb-6">
                        <BookOpen size={32} className="text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Workspace library is empty</h3>
                    <p className="text-[14px] text-slate-500 mb-8 max-w-sm mx-auto font-medium leading-relaxed">
                        {searchQuery 
                            ? `Found no results matching "${searchQuery}".`
                            : "Initialize your documentation by creating your first note."
                        }
                    </p>
                    {activeTab === 'mine' && !searchQuery && (
                        <button 
                            onClick={() => { resetCurrentNote(); setIsEditing(true); }}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
                        >
                            Capture First Thought
                        </button>
                    )}
                </div>
            )}

            {/* Content Sections */}
            <div className="space-y-10">
                {pinnedNotes.length > 0 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Prioritized</span>
                            <div className="h-px flex-1 bg-slate-100" />
                        </div>
                        <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5" : "flex flex-col gap-4"}>
                            {pinnedNotes.map((note) => (
                                <NoteCard 
                                    key={note._id} 
                                    note={note} 
                                    onEdit={openEdit} 
                                    onDelete={handleDeleteNote} 
                                    onPin={() => togglePin(note)}
                                    viewMode={viewMode}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {otherNotes.length > 0 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Residuals</span>
                            <div className="h-px flex-1 bg-slate-100" />
                        </div>
                        <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5" : "flex flex-col gap-4"}>
                            {otherNotes.map((note) => (
                                <NoteCard 
                                    key={note._id} 
                                    note={note} 
                                    onEdit={openEdit} 
                                    onDelete={handleDeleteNote} 
                                    onPin={() => togglePin(note)}
                                    viewMode={viewMode}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Note Editor Modal (Standardized Forgeweb UI) */}
            <Modal
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
                title={currentNote._id ? 'Refine Documentation' : 'Capture Asset'}
                footer={
                    <>
                        <div className="flex-1">
                            <label className="flex items-center gap-3 cursor-pointer group w-fit">
                                <div className={`w-10 h-5.5 rounded-full relative transition-all duration-300 ${currentNote.isPublic ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                    <div className={`absolute top-1 left-1 w-3.5 h-3.5 bg-white rounded-full transition-all duration-300 shadow-sm ${currentNote.isPublic ? 'translate-x-4.5' : ''}`} />
                                </div>
                                <input 
                                    type="checkbox" 
                                    className="hidden" 
                                    checked={currentNote.isPublic}
                                    onChange={(e) => setCurrentNote({...currentNote, isPublic: e.target.checked})}
                                />
                                <span className="text-[13px] font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">Shared Access</span>
                            </label>
                        </div>
                        <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[13px] font-bold text-slate-600 transition">Discard</button>
                        <button onClick={handleSaveNote} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold rounded-xl shadow-[0_8px_20px_-4px_rgba(79,70,229,0.3)] transition uppercase tracking-wider">
                            {currentNote._id ? 'Update Vault' : 'Commit Asset'}
                        </button>
                    </>
                }
            >
                <form className="space-y-7" onSubmit={handleSaveNote}>
                    <div className="space-y-4">
                        <div>
                            <label className={labelStyle}>Header Title *</label>
                            <input
                                required
                                value={currentNote.title}
                                onChange={(e) => setCurrentNote({ ...currentNote, title: e.target.value })}
                                className="fw-input font-bold text-slate-800"
                                placeholder="E.g. Onboarding Flow V2"
                            />
                        </div>
                        
                        <div>
                            <label className={labelStyle}>Context Body *</label>
                            <textarea
                                required
                                value={currentNote.content}
                                onChange={(e) => setCurrentNote({ ...currentNote, content: e.target.value })}
                                className="fw-input !rounded-lg min-h-[220px] resize-none leading-relaxed font-medium text-slate-600"
                                placeholder="Detail your thoughts or technical requirements..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-50">
                        <div className="space-y-4">
                            <label className={labelStyle}>Atmosphere Filter</label>
                            <div className="flex flex-wrap items-center gap-2.5">
                                {COLORS.map((c) => (
                                    <button
                                        key={c.name}
                                        type="button"
                                        onClick={() => setCurrentNote({ ...currentNote, color: c.value })}
                                        className={`w-9 h-9 rounded-xl border-2 transition-all hover:scale-110 flex items-center justify-center shadow-sm ${c.value} ${c.border} ${currentNote.color === c.value ? 'border-indigo-600 ring-4 ring-indigo-50' : 'border-slate-50'}`}
                                        title={c.name}
                                    >
                                        {currentNote.color === c.value && <Check size={14} className="text-indigo-600" strokeWidth={3} />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className={labelStyle}>Category Tags</label>
                            <div className="flex flex-wrap gap-2 p-2.5 bg-slate-50 rounded-xl border border-indigo-100">
                                {currentNote.tags.map(tag => (
                                    <span key={tag} className="flex items-center gap-2 pl-2.5 pr-1.5 py-1 bg-indigo-50/30 text-indigo-600 border border-indigo-200 rounded-lg text-[10px] font-black uppercase shadow-sm">
                                        #{tag}
                                        <X 
                                            size={12} 
                                            className="cursor-pointer text-indigo-400 hover:text-red-500" 
                                            onClick={() => setCurrentNote({...currentNote, tags: currentNote.tags.filter(t => t !== tag)})} 
                                        />
                                    </span>
                                ))}
                                <input 
                                    className="bg-transparent border-none outline-none text-[12px] focus:ring-0 flex-1 min-w-[80px] p-0 placeholder:text-slate-300 font-bold"
                                    placeholder={currentNote.tags.length === 0 ? "Add tags..." : "+"}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && e.target.value.trim()) {
                                            e.preventDefault();
                                            setCurrentNote({...currentNote, tags: [...new Set([...currentNote.tags, e.target.value.toLowerCase().trim()])]});
                                            e.target.value = '';
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

const NoteCard = ({ note, onEdit, onDelete, onPin, viewMode }) => {
    const isGrid = viewMode === 'grid';
    const currentUser = JSON.parse(localStorage.getItem('fw_user') || '{}');
    const isOwner = note.user === currentUser._id || note.user?._id === currentUser._id;
    
    const colorConfig = COLORS.find(c => c.value === note.color) || COLORS[0];

    return (
        <div 
            onClick={() => isOwner && onEdit(note)}
            className={`group relative overflow-hidden bg-white rounded-[22px] border border-slate-100/80 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)] active:scale-95 ${
                isGrid ? 'min-h-[220px] p-6 flex flex-col' : 'p-4 flex items-center gap-6'
            } ${note.pinned ? 'ring-2 ring-indigo-100 bg-indigo-50/5' : ''}`}
        >
            {/* Color Accent */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colorConfig.accent} opacity-60`} />
            
            {/* Pin Status */}
            {note.pinned && (
                <div className="absolute top-2.5 right-2.5 w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center shadow-lg z-10 transition-transform group-hover:scale-110">
                    <Pin size={13} className="text-white fill-white rotate-45" />
                </div>
            )}

            {/* Actions for Owners */}
            {isOwner && (
                <div className={`absolute top-3 left-3 flex items-center gap-1.5 z-10 transition-all ${isGrid ? 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0' : 'opacity-100'}`}>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onPin(); }}
                        className={`p-2 rounded-lg transition-all shadow-sm border ${note.pinned ? 'bg-amber-100 border-amber-200 text-amber-600' : 'bg-white border-slate-100 text-slate-300 hover:text-indigo-600'}`}
                    >
                        <Pin size={13} className="rotate-45" strokeWidth={2.5} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(note._id); }}
                        className="p-2 bg-white border border-slate-100 text-slate-300 hover:text-red-500 rounded-lg shadow-sm transition-all"
                    >
                        <Trash2 size={13} strokeWidth={2.5} />
                    </button>
                </div>
            )}

            {/* Body */}
            <div className={`flex-1 ${isGrid ? 'mt-4' : 'flex items-center gap-8 w-full'}`}>
                <div className={isGrid ? 'mb-4' : 'w-1/3 min-w-[200px]'}>
                    <h4 className={`text-[17px] font-black text-slate-800 leading-tight mb-2 line-clamp-2 ${isGrid && isOwner ? 'pr-10' : ''}`}>
                        {note.title}
                    </h4>
                    {!isGrid && note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {note.tags.slice(0, 2).map(tag => (
                                <span key={tag} className="text-[9px] font-black text-indigo-600 px-2 py-0.5 bg-indigo-50 rounded-md uppercase tracking-wider">#{tag}</span>
                            ))}
                        </div>
                    )}
                </div>
                
                <p className={`text-[13.5px] font-medium text-slate-500 leading-relaxed overflow-hidden ${isGrid ? 'line-clamp-4' : 'line-clamp-1 flex-1 pr-10'}`}>
                    {note.content}
                </p>
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-between border-t border-slate-50 mt-auto pt-4 ${!isGrid && 'hidden sm:flex ml-auto min-w-[150px]'}`}>
                <div className="flex items-center gap-3">
                    {note.isPublic ? (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-violet-50 text-violet-600 rounded-lg">
                            <Share2 size={11} strokeWidth={3} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Global</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 text-slate-400 rounded-lg">
                            <Clock size={11} strokeWidth={3} />
                            <span className="text-[9px] font-black uppercase tracking-widest">
                                {new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                    )}
                </div>

                {note.isPublic && note.user?.name && !isOwner && (
                    <div className="flex items-center gap-2 group/author">
                        <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white shadow-sm transition-transform group-hover/author:scale-110">
                            {note.user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[11px] font-bold text-slate-500">{note.user.name}</span>
                    </div>
                )}
            </div>

            {/* Grid Tags */}
            {isGrid && note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                    {note.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                            #{tag}
                        </span>
                    ))}
                    {note.tags.length > 3 && (
                        <span className="text-[10px] font-bold text-slate-300">+{note.tags.length - 3}</span>
                    )}
                </div>
            )}
        </div>
    );
};

export default Notes;
