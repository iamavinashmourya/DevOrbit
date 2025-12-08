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
        return <div className="text-muted-foreground flex justify-center py-8">Loading profile...</div>;
    }

    if (!profileData) {
        return <div className="text-muted-foreground flex justify-center py-8">Failed to load profile.</div>;
    }

    const { stats, recentTasks, user: userInfo } = profileData;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="card-minimal p-8 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center space-x-6">
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-4xl font-bold text-primary-foreground shadow-lg shadow-primary/20">
                            {userInfo.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground mb-2">{userInfo.name}</h1>
                            <div className="flex items-center space-x-4 text-muted-foreground text-sm">
                                <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> Joined {new Date(userInfo.joinedAt).toLocaleDateString()}</span>
                                {userInfo.integrations?.github?.username && (
                                    <span className="flex items-center text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                                        <Github className="w-3 h-3 mr-1" /> {userInfo.integrations.github.username}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex space-x-4">
                        <div className="bg-muted px-6 py-4 rounded-2xl text-center min-w-[120px] border border-border">
                            <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">Current Streak</div>
                            <div className="text-3xl font-bold text-foreground flex items-center justify-center">
                                <Flame className={`w-6 h-6 mr-2 ${stats.currentStreak > 0 ? 'text-orange-500 fill-orange-500' : 'text-muted-foreground'}`} />
                                {stats.currentStreak}
                            </div>
                        </div>
                        <div className="bg-muted px-6 py-4 rounded-2xl text-center min-w-[120px] border border-border">
                            <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">Longest Streak</div>
                            <div className="text-3xl font-bold text-foreground flex items-center justify-center">
                                <Trophy className="w-6 h-6 mr-2 text-yellow-500" />
                                {stats.longestStreak}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Monthly Activity Section */}
            <div className="card-minimal p-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-foreground flex items-center">
                        <Calendar className="w-5 h-5 mr-3 text-primary" />
                        Monthly Activity
                    </h2>
                    <div className="text-muted-foreground text-sm font-medium">
                        {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-xs text-muted-foreground font-medium py-2">
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

                            let bgClass = 'bg-muted hover:bg-zinc-200 dark:hover:bg-zinc-800';
                            let textClass = 'text-muted-foreground';

                            // Logic for heatmap coloring - adapts to Primary color
                            if (count > 0) {
                                bgClass = 'bg-primary/40 border border-primary/30';
                                textClass = 'text-primary-foreground';
                            }
                            if (count > 2) bgClass = 'bg-primary/60 border border-primary/50';
                            if (count > 5) bgClass = 'bg-primary/80 border border-primary/60';

                            if (isToday) {
                                bgClass += ' ring-2 ring-primary ring-offset-2 ring-offset-background';
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
                                                <div key={i} className="w-1 h-1 rounded-full bg-primary-foreground/50"></div>
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
            <div className="card-minimal p-8">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center">
                    <Zap className="w-5 h-5 mr-3 text-yellow-400" />
                    Recent Tasks
                </h2>

                <div className="space-y-4">
                    {recentTasks.length === 0 ? (
                        <p className="text-muted-foreground italic">No activities recorded today.</p>
                    ) : (
                        recentTasks.map((task: any) => (
                            <div key={task._id} className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors border border-border group">
                                <div className="flex items-center space-x-4">
                                    <div className={`p-2 rounded-lg ${task.type === 'learn' ? 'bg-blue-500/10 text-blue-500' :
                                        task.type === 'dsa' ? 'bg-green-500/10 text-green-500' :
                                            task.type === 'project' ? 'bg-purple-500/10 text-purple-500' :
                                                'bg-muted text-muted-foreground'
                                        }`}>
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-foreground font-medium">{task.title || 'Untitled Activity'}</h3>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">{task.type}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-foreground font-mono font-medium">{task.durationMinutes}m</div>
                                    <div className="text-xs text-muted-foreground">{new Date(task.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
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
