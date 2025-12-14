import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useRefresh } from '../context/RefreshContext';
import { Bell, Search, Command, Sun, Moon, Menu, RefreshCw } from 'lucide-react';
import axios from 'axios';

interface TopbarProps {
    onMenuClick?: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { triggerRefresh } = useRefresh();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            // Trigger remote sync on Desktop
            await axios.post('http://localhost:4000/api/v1/sync/trigger', {}, {
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            console.log("Remote sync triggered");
        } catch (err) {
            console.error("Failed to trigger remote sync", err);
        }

        // Wait a bit for Desktop to flush (optimistic) then refresh UI
        setTimeout(() => {
            triggerRefresh();
            setIsRefreshing(false);
        }, 3000); // 3 seconds delay to allow Desktop to sync
    };

    return (
        <div className="h-16 border-b border-border bg-background flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 transition-colors duration-300">
            <div className="flex items-center w-full md:max-w-md gap-4">
                <button
                    onClick={onMenuClick}
                    className="md:hidden p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <div className="relative group flex-1 md:flex-none">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full bg-muted/50 border border-input text-sm text-foreground rounded-lg pl-10 pr-12 py-2 focus:border-ring focus:ring-1 focus:ring-ring outline-none transition-all placeholder:text-muted-foreground"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden md:flex items-center px-1.5 py-0.5 rounded border border-border bg-muted">
                        <Command className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground font-mono ml-1">K</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center space-x-2 md:space-x-4">
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {/* Refresh Button - Placed before Notification Bell */}
                <button
                    onClick={handleRefresh}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors hidden md:block"
                    title="Refresh Data"
                >
                    <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>

                <button className="relative p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors hidden md:block">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background"></span>
                </button>

                <div className="flex items-center space-x-3 pl-4 border-l border-border ml-2">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-foreground">{user?.name}</p>
                        <p className="text-xs text-muted-foreground">Student</p>
                    </div>
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-muted flex items-center justify-center border border-border">
                        <span className="text-muted-foreground font-bold text-sm">{user?.name?.charAt(0).toUpperCase()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Topbar;
