import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const Layout = ({ children }) => {
    return (
        <div className="flex flex-col md:flex-row h-screen bg-transparent overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
            {/* Nav container acting as bottom bar on mobile and sidebar on desktop */}
            <div className="order-2 md:order-1 z-40 bg-white md:bg-transparent shrink-0">
                <Sidebar />
            </div>

            {/* Main Content Area */}
            <div className="order-1 md:order-2 flex-1 flex flex-col min-w-0 overflow-hidden bg-transparent z-10">
                <Topbar />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative">
                    <div className="max-w-[1400px] mx-auto w-full relative z-10 animate-fadeIn fade-in-up pb-[100px] md:pb-0">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
