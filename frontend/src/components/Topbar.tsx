import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Search, Command } from 'lucide-react';

const Topbar: React.FC = () => {
    const { user } = useAuth();

    return (
        <div className="h-24 fixed top-0 right-0 left-72 z-40 flex items-center justify-between px-8 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-xl">
                <div className="glass-card rounded-2xl px-4 py-2.5 flex items-center space-x-3 text-slate-400 focus-within:text-cyan-400 focus-within:border-cyan-500/30 transition-all">
                    <Search className="w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search activities..."
                        className="bg-transparent border-none focus:outline-none text-sm w-full text-slate-200 placeholder:text-slate-600"
                    />
                    <div className="flex items-center space-x-1 px-2 py-1 bg-white/5 rounded text-xs font-mono border border-white/5">
                        <Command className="w-3 h-3" />
                        <span>K</span>
                    </div>
                </div>
            </div>

            <div className="pointer-events-auto flex items-center space-x-6 pl-8">
                <button className="relative p-3 rounded-xl hover:bg-white/5 text-slate-400 hover:text-cyan-400 transition-colors group">
                    <Bell className="w-5 h-5 group-hover:animate-pulse" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.6)]"></span>
                </button>

                <div className="flex items-center space-x-4 pl-6 border-l border-white/10">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-semibold text-slate-200">{user?.name}</p>
                        <p className="text-xs text-cyan-500/80">Pro Member</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-[2px] shadow-lg shadow-cyan-500/20">
                        <div className="w-full h-full rounded-[10px] bg-slate-900 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{user?.name?.charAt(0).toUpperCase()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Topbar;
