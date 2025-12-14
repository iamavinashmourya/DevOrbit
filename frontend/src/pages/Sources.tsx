import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import SummaryCard from '../components/SummaryCard';
import Timeline from '../components/Timeline';
import { Monitor, Smartphone, Globe } from 'lucide-react';
import { formatDuration } from '../utils/format';

const Sources: React.FC = () => {
    const { user } = useAuth();
    const [activities, setActivities] = useState<any[]>([]);
    const [stats, setStats] = useState({
        desktop: 0,
        mobile: 0,
        web: 0
    });
    const [filter, setFilter] = useState<'all' | 'desktop_app' | 'browser_extension' | 'mobile_app'>('all');
    const [refresh, setRefresh] = useState(0);

    // Auto-refresh at Midnight (IST)
    useEffect(() => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const timeUntilMidnight = tomorrow.getTime() - now.getTime();

        const timer = setTimeout(() => {
            setRefresh(prev => prev + 1);
        }, timeUntilMidnight);

        return () => clearTimeout(timer);
    }, [refresh]);

    // Real-time Polling (Every 30 seconds)
    useEffect(() => {
        const interval = setInterval(() => {
            setRefresh(prev => prev + 1);
        }, 30000); // 30 seconds
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const today = new Date();
                const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
                const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

                const { data } = await axios.get('http://localhost:4000/api/v1/activities', {
                    headers: { Authorization: `Bearer ${user?.token}` },
                    params: { start: startOfDay, end: endOfDay },
                });

                setActivities(data.activities);

                let d = 0;
                let m = 0;
                let w = 0;

                data.activities.forEach((act: any) => {
                    const duration = act.durationMinutes || 0;
                    if (act.source === 'desktop_app') d += duration;
                    else if (act.source === 'mobile_app') m += duration;
                    else if (act.source === 'browser_extension') w += duration;
                });

                setStats({ desktop: d, mobile: m, web: w });
            } catch (error) {
                console.error(error);
            }
        };

        if (user) fetchData();
    }, [user, refresh]);

    const filteredActivities = activities.filter(a => filter === 'all' || a.source === filter);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="border-b border-border pb-6">
                <h1 className="text-3xl font-bold text-foreground tracking-tight">
                    Device Usage
                </h1>
                <p className="text-muted-foreground mt-2 text-sm">
                    Breakdown of where you spent your time today.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard
                    title="Desktop App"
                    value={formatDuration(stats.desktop)}
                    icon={Monitor}
                    color="blue"
                    trend="Active"
                    trendUp={true}
                />
                <SummaryCard
                    title="Web Extension"
                    value={formatDuration(stats.web)}
                    icon={Globe}
                    color="cyan"
                    trend="Details"
                    trendUp={true}
                />
                <SummaryCard
                    title="Mobile App"
                    value={formatDuration(stats.mobile)}
                    icon={Smartphone}
                    color="purple"
                    trend="Coming Soon"
                    trendUp={false}
                />
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center space-x-2 mb-6 overflow-x-auto pb-2 md:pb-0">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                    >
                        All Devices
                    </button>
                    <button
                        onClick={() => setFilter('desktop_app')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'desktop_app' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                    >
                        <Monitor className="w-4 h-4" />
                        <span>Desktop</span>
                    </button>
                    <button
                        onClick={() => setFilter('browser_extension')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'browser_extension' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                    >
                        <Globe className="w-4 h-4" />
                        <span>Web</span>
                    </button>
                    <button
                        onClick={() => setFilter('mobile_app')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'mobile_app' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                    >
                        <Smartphone className="w-4 h-4" />
                        <span>Mobile</span>
                    </button>
                </div>

                <Timeline activities={filteredActivities} />
            </div>
        </div>
    );
};

export default Sources;
