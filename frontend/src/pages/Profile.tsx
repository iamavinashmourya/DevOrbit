import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Flame, Calendar, Trophy, Clock, Github, Zap } from 'lucide-react';

const Profile: React.FC = () => {
    const { user } = useAuth();
    const [profileData, setProfileData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await axios.get('http://localhost:4000/api/v1/profile', {
                    headers: { Authorization: `Bearer ${user?.token}` }
                });
                setProfileData(data);
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchProfile();
        }
    }, [user]);

    if (loading) {
        return <div className="text-white">Loading profile...</div>;
    }

    if (!profileData) {
        return <div className="text-white">Failed to load profile.</div>;
    }

    const { stats, recentTasks, user: userInfo } = profileData;

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="glass-panel p-8 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-3xl rounded-full -mr-20 -mt-20"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center space-x-6">
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-4xl font-bold text-white shadow-lg shadow-cyan-500/20">
                            {userInfo.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">{userInfo.name}</h1>
                            <div className="flex items-center space-x-4 text-slate-400 text-sm">
                                <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> Joined {new Date(userInfo.joinedAt).toLocaleDateString()}</span>
                                {userInfo.integrations?.github?.username && (
                                    <span className="flex items-center text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20">
                                        <Github className="w-3 h-3 mr-1" /> {userInfo.integrations.github.username}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex space-x-4">
                        <div className="glass-card px-6 py-4 rounded-2xl text-center min-w-[120px]">
                            <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Current Streak</div>
                            <div className="text-3xl font-bold text-white flex items-center justify-center">
                                <Flame className={`w-6 h-6 mr-2 ${stats.currentStreak > 0 ? 'text-orange-500 fill-orange-500' : 'text-slate-600'}`} />
                                {stats.currentStreak}
                            </div>
                        </div>
                        <div className="glass-card px-6 py-4 rounded-2xl text-center min-w-[120px]">
                            <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Longest Streak</div>
                            <div className="text-3xl font-bold text-white flex items-center justify-center">
                                <Trophy className="w-6 h-6 mr-2 text-yellow-500" />
                                {stats.longestStreak}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Monthly Activity Section */}
            <div className="glass-panel p-8 rounded-3xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <Calendar className="w-5 h-5 mr-3 text-cyan-400" />
                        Monthly Activity
                    </h2>
                    <div className="text-slate-400 text-sm font-medium">
                        {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-xs text-slate-500 font-medium py-2">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {(() => {
                        const today = new Date();
                        const year = today.getFullYear();
                        const month = today.getMonth();

                        const firstDay = new Date(year, month, 1);
                        const lastDay = new Date(year, month + 1, 0);

                        const daysInMonth = lastDay.getDate();
                        const startingDayIndex = firstDay.getDay(); // 0 = Sunday

                        const calendarCells = [];

                        // Empty cells for days before start of month
                        for (let i = 0; i < startingDayIndex; i++) {
                            calendarCells.push(<div key={`empty-${i}`} className="aspect-square"></div>);
                        }

                        // Days of the month
                        for (let day = 1; day <= daysInMonth; day++) {
                            const date = new Date(year, month, day);
                            const dateStr = date.toISOString().split('T')[0];
                            const count = stats.heatmap[dateStr] || 0;
                            const isToday = day === today.getDate();

                            let bgClass = 'bg-white/5 hover:bg-white/10';
                            let textClass = 'text-slate-400';

                            if (count > 0) {
                                bgClass = 'bg-cyan-900/40 border border-cyan-500/30';
                                textClass = 'text-cyan-100';
                            }
                            if (count > 2) bgClass = 'bg-cyan-700/60 border border-cyan-400/50';
                            if (count > 5) bgClass = 'bg-cyan-500 border border-cyan-300/50';

                            if (isToday) {
                                bgClass += ' ring-2 ring-cyan-400 ring-offset-2 ring-offset-black';
                            }

                            calendarCells.push(
                                <div
                                    key={day}
                                    className={`aspect-square rounded-xl flex flex-col items-center justify-center relative group transition-all ${bgClass}`}
                                    title={`${dateStr}: ${count} activities`}
                                >
                                    <span className={`text-sm font-medium ${textClass}`}>{day}</span>
                                    {count > 0 && (
                                        <div className="mt-1 flex gap-0.5">
                                            {[...Array(Math.min(count, 3))].map((_, i) => (
                                                <div key={i} className="w-1 h-1 rounded-full bg-cyan-300"></div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        return calendarCells;
                    })()}
                </div>
            </div>

            {/* Recent Tasks */}
            <div className="glass-panel p-8 rounded-3xl">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                    <Zap className="w-5 h-5 mr-3 text-yellow-400" />
                    Recent Tasks
                </h2>

                <div className="space-y-4">
                    {recentTasks.length === 0 ? (
                        <p className="text-slate-500 italic">No activities recorded today.</p>
                    ) : (
                        recentTasks.map((task: any) => (
                            <div key={task._id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 group">
                                <div className="flex items-center space-x-4">
                                    <div className={`p-2 rounded-lg ${task.type === 'learn' ? 'bg-blue-500/20 text-blue-400' :
                                            task.type === 'dsa' ? 'bg-green-500/20 text-green-400' :
                                                task.type === 'project' ? 'bg-purple-500/20 text-purple-400' :
                                                    'bg-slate-500/20 text-slate-400'
                                        }`}>
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium">{task.title || 'Untitled Activity'}</h3>
                                        <p className="text-xs text-slate-400 uppercase tracking-wider mt-0.5">{task.type}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-white font-mono font-medium">{task.durationMinutes}m</div>
                                    <div className="text-xs text-slate-500">{new Date(task.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
