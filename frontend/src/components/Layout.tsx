import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-cyan-500/30">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/20 blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-900/20 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <Sidebar />
            <Topbar />

            <main className="pl-72 pt-24 min-h-screen relative z-10">
                <div className="p-8 max-w-7xl mx-auto animate-float" style={{ animationDuration: '10s' }}>
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
