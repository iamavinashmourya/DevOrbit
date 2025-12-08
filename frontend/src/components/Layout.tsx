import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300">
            <Sidebar
                isOpen={isMobileSidebarOpen}
                onClose={() => setIsMobileSidebarOpen(false)}
            />

            <div className="md:pl-64 flex flex-col min-h-screen transition-all duration-300">
                <Topbar onMenuClick={() => setIsMobileSidebarOpen(true)} />
                <main className="flex-1 p-4 md:p-8 pt-6 relative z-10 max-w-7xl mx-auto w-full">
                    {children}
                </main>
            </div>

            {/* Mobile Overlay */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm animate-in fade-in"
                    onClick={() => setIsMobileSidebarOpen(false)}
                ></div>
            )}
        </div>
    );
};

export default Layout;
