import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const Modal = ({ isOpen, onClose, title, children, footer, maxWidth = 'max-w-2xl' }) => {
    const overlayRef = useRef(null);
    const modalRef = useRef(null);

    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    // Close on ESC key
    useEffect(() => {
        if (!isOpen) return;
        const handleEsc = (e) => { if (e.key === 'Escape') onCloseRef.current(); };
        document.addEventListener('keydown', handleEsc);
        document.body.style.overflow = 'hidden';

        // Focus the modal container initially so ESC key works immediately
        if (modalRef.current && !modalRef.current.contains(document.activeElement)) {
            modalRef.current.focus();
        }

        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div
            ref={overlayRef}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
            role="dialog"
            aria-modal="true"
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md modal-overlay-bg" />

            {/* Modal Content */}
            <div
                ref={modalRef}
                tabIndex={-1}
                className={`relative w-full ${maxWidth} bg-white/95 backdrop-blur-xl rounded-[24px] shadow-2xl flex flex-col max-h-[90vh] modal-content outline-none border border-white/60 ring-1 ring-slate-900/5`}
            >
                {/* Sticky Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 shrink-0">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">{title}</h3>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all duration-200"
                        aria-label="Close modal"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto px-8 py-6">
                    {children}
                </div>

                {/* Sticky Footer */}
                {footer && (
                    <div className="flex items-center justify-end gap-3 px-8 py-5 bg-slate-50/50 border-t border-slate-100 shrink-0 rounded-b-[24px]">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default Modal;
