import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Upload, BarChart2, LogOut, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar: React.FC = () => {
    const location = useLocation();
    const { logout } = useAuth();

    const isActive = (path: string) => location.pathname === path;

    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/import', label: 'Import Data', icon: Upload },
        { path: '/reports', label: 'Reports', icon: BarChart2 },
        { path: '/profile', label: 'Profile', icon: Zap },
    ];

    return (
        <div className="h-screen w-72 fixed left-0 top-0 z-50 p-4">
            <div className="h-full glass-panel rounded-3xl flex flex-col overflow-hidden relative">
                {/* Glow effect */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>

                <div className="p-8">
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-2 rounded-lg shadow-lg shadow-cyan-500/20">
                            <Zap className="text-white w-6 h-6" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-white">
                            Study<span className="text-cyan-400">Track</span>
                        </h1>
                    </div>

                    <nav className="space-y-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${active
                                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_-3px_rgba(6,182,212,0.15)]'
                                        : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                                        }`}
                                >
                                    {active && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 rounded-r-full shadow-[0_0_10px_2px_rgba(6,182,212,0.5)]"></div>
                                    )}
                                    <Icon className={`w-5 h-5 transition-colors ${active ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="mt-auto p-6 border-t border-white/5 bg-black/20">
                    <button
                        onClick={logout}
                        className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all group"
                    >
                        <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
