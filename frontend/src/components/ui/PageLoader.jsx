import React from 'react';
import { Zap } from 'lucide-react';

const PageLoader = ({ label = 'Loading data...' }) => (
    <div className="flex items-center justify-center h-[calc(100vh-160px)]">
        <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-5">
                <div className="absolute inset-0 rounded-full border-[3px] border-slate-100" />
                <div className="absolute inset-0 rounded-full border-[3px] border-primary border-t-transparent animate-spin" />
                <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-pulse" />
            </div>
            <p className="text-sm font-bold text-slate-400 tracking-wide">{label}</p>
        </div>
    </div>
);

export default PageLoader;
