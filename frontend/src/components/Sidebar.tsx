import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Upload, BarChart2, LogOut, Zap, BookOpen, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const location = useLocation();
    const { logout } = useAuth();

    const isActive = (path: string) => location.pathname === path;

    const navItems = [
        { path: '/', label: 'Overview', icon: LayoutDashboard },
        { path: '/sources', label: 'Devices', icon: Zap },
        { path: '/import', label: 'Import Data', icon: Upload },
        { path: '/reports', label: 'Reports', icon: BarChart2 },
        { path: '/profile', label: 'Profile', icon: BookOpen },
    ];

    // Mobile classes: Fixed, transform-based animation
    // Desktop classes: Fixed, always visible (handled by md:flex)
    const containerClasses = `
        fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-border transition-transform duration-300 ease-in-out md:translate-x-0 flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `;

    return (
        <div className={containerClasses}>
            <div className="p-6">
                <div className="flex items-center justify-between mb-10 pl-2">
                    <div className="flex items-center space-x-3">
                        <div className="bg-primary rounded-lg p-1.5 shadow-sm">
                            <BookOpen className="text-primary-foreground w-5 h-5" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground">
                            StudyTrack
                        </h1>
                    </div>
                    <button
                        onClick={onClose}
                        className="md:hidden p-1 text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => onClose && onClose()}
                                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 group ${active
                                    ? 'bg-secondary text-secondary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                    }`}
                            >
                                <Icon className={`w-4 h-4 transition-colors ${active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                                <span className={`text-sm font-medium ${active ? 'text-foreground' : ''}`}>{item.label}</span>
                                {active && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"></div>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto p-4 border-t border-border">
                <button
                    onClick={logout}
                    className="flex items-center space-x-3 px-3 py-2 w-full rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors group"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
