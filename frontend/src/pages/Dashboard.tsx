import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useRefresh } from '../context/RefreshContext';
import { useLocation, useNavigate } from 'react-router-dom';
import SummaryCard from '../components/SummaryCard';
import QuickAdd from '../components/QuickAdd';
import Timeline from '../components/Timeline';
import { BookOpen, Code, Clock, AlertCircle, Github, CheckCircle, Loader2 } from 'lucide-react';
import { formatDuration } from '../utils/format';

const Dashboard: React.FC = () => {
    const { user, updateUser } = useAuth();
    const { refreshKey } = useRefresh();
    const location = useLocation();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        studyMinutes: 0,
        dsaCount: 0,
        timepassMinutes: 0,
    });
    const [activities, setActivities] = useState([]);
    const [githubLoading, setGithubLoading] = useState(false);
    const [githubConnected, setGithubConnected] = useState(false);
    const [githubActivity, setGithubActivity] = useState([]);

    useEffect(() => {
        const fetchTodayData = async () => {
            try {
                const today = new Date();
                const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
                const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

                const { data } = await axios.get('http://localhost:4000/api/v1/activities', {
                    headers: { Authorization: `Bearer ${user?.token}` },
                    params: {
                        start: startOfDay,
                        end: endOfDay,
                        _t: new Date().getTime() // Cache buster
                    },
                });

                const acts = data.activities;
                setActivities(acts);

                let studyMins = 0;
                let dsa = 0;
                let timepass = 0;

                acts.forEach((act: any) => {
                    if (act.type === 'learn' || act.type === 'project' || act.type === 'assignment') {
                        studyMins += act.durationMinutes || 0;
                    }
                    if (act.type === 'dsa') {
                        dsa += 1;
                    }
                    if (act.type === 'timepass' || act.type === 'app_usage') {
                        timepass += act.durationMinutes || 0;
                    }
                });

                setStats({
                    studyMinutes: studyMins,
                    dsaCount: dsa,
                    timepassMinutes: timepass,
                });
            } catch (error) {
                console.error('Error fetching data', error);
            }
        };

        if (user) {
            fetchTodayData();
            if (user.integrations?.github?.username) {
                setGithubConnected(true);
            }
        }
    }, [user, refreshKey]);

    const processingRef = React.useRef(false);

    // Handle GitHub Callback
    useEffect(() => {
        const query = new URLSearchParams(location.search);
        const githubCode = query.get('github_code');

        if (githubCode && !githubConnected && !processingRef.current) {
            processingRef.current = true;
            const connectGithub = async () => {
                setGithubLoading(true);
                try {
                    const { data } = await axios.post('http://localhost:4000/api/v1/auth/github/connect',
                        { code: githubCode },
                        { headers: { Authorization: `Bearer ${user?.token}` } }
                    );
                    setGithubConnected(true);

                    if (user) {
                        const updatedUser = {
                            ...user,
                            integrations: {
                                ...user.integrations,
                                github: {
                                    username: data.username,
                                    connectedAt: new Date().toISOString()
                                }
                            }
                        };
                        updateUser(updatedUser);
                    }

                    navigate('/', { replace: true });
                } catch (error) {
                    console.error('GitHub Connect Error', error);
                    alert('Failed to connect GitHub. The code might have expired. Please try again.');
                    navigate('/', { replace: true });
                } finally {
                    setGithubLoading(false);
                    processingRef.current = false;
                }
            };
            connectGithub();
        }
    }, [location, user, navigate, githubConnected, updateUser]);

    // Fetch GitHub Activity
    useEffect(() => {
        if (githubConnected && user) {
            const fetchGithubActivity = async () => {
                try {
                    const { data } = await axios.get('http://localhost:4000/api/v1/auth/github/activity', {
                        headers: { Authorization: `Bearer ${user.token}` }
                    });
                    setGithubActivity(data);
                } catch (error) {
                    console.error('Error fetching GitHub activity', error);
                }
            };
            fetchGithubActivity();
        }
    }, [githubConnected, user]);

    // Temporary helper to trigger refresh locally if needed in children, 
    // though QuickAdd should ideally use Context too. 
    // For now we rely on the fact that adding activity is separate or we can refactor QuickAdd later.
    // Actually, QuickAdd prop onActivityAdded is used. We can just leverage it to re-fetch?
    // Dashboard handles fetching. So onActivityAdded could trigger a re-fetch.
    // But since `refreshKey` is global, we can't easily set it from here without `triggerRefresh`.
    // Let's grab `triggerRefresh` as well to support QuickAdd.
    const { triggerRefresh } = useRefresh();

    const handleActivityAdded = () => {
        triggerRefresh();
    };

    const handleGithubConnect = () => {
        const clientId = 'Ov23li7TjBbWfPYo2MqK';
        window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo,user`;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-end border-b border-border pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">
                        Overview
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm">
                        Welcome back, <span className="text-foreground font-medium">{user?.name}</span>. Here's your progress today.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <p className="text-sm text-muted-foreground font-mono tracking-wide hidden md:block">
                        {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard
                    title="Study Time"
                    value={formatDuration(stats.studyMinutes)}
                    icon={BookOpen}
                    color="blue"
                    trend="12%"
                    trendUp={true}
                />
                <SummaryCard
                    title="DSA Problems"
                    value={stats.dsaCount}
                    icon={Code}
                    color="green"
                    trend="5%"
                    trendUp={true}
                />
                <SummaryCard
                    title="Timepass"
                    value={formatDuration(stats.timepassMinutes)}
                    icon={AlertCircle}
                    color="red"
                    trend="2%"
                    trendUp={false}
                />
                <SummaryCard
                    title="Productivity"
                    value="85%"
                    icon={Clock}
                    color="purple"
                    trend="Stable"
                    trendUp={true}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Timeline activities={activities} />
                </div>
                <div className="space-y-6">
                    <QuickAdd onActivityAdded={handleActivityAdded} />

                    {/* GitHub Connect Card */}
                    <div className="card-minimal p-6 relative group">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-foreground flex items-center tracking-wide">
                                <Github className="w-4 h-4 mr-2 text-muted-foreground" />
                                GITHUB SYNC
                            </h3>
                            {githubConnected && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                        </div>

                        {githubConnected ? (
                            <div>
                                <p className="text-sm text-muted-foreground mb-6">
                                    Connected as <span className="text-foreground font-medium">{user?.integrations?.github?.username}</span>
                                </p>

                                <div className="space-y-2 mb-6">
                                    {githubActivity.slice(0, 3).map((event: any) => (
                                        <div key={event.id} className="text-xs p-3 rounded bg-muted/50 border border-border flex justify-between items-start">
                                            <div>
                                                <div className="text-foreground font-medium mb-1">
                                                    {event.type === 'PushEvent' ? 'Pushed commits' : event.type}
                                                </div>
                                                <div className="text-muted-foreground">{event.repo}</div>
                                            </div>
                                            <span className="text-muted-foreground font-mono">{new Date(event.createdAt).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}</span>
                                        </div>
                                    ))}
                                    {githubActivity.length === 0 && (
                                        <div className="text-center py-4 bg-muted/50 rounded border border-border border-dashed">
                                            <p className="text-xs text-muted-foreground">No recent activity detected.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center space-x-2 text-xs text-emerald-500 bg-emerald-500/10 px-3 py-2 rounded border border-emerald-500/20 justify-center">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                    <span className="font-medium tracking-wide uppercase">Sync Active</span>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                                    Link your GitHub to automatically track coding streaks and contribution activity.
                                </p>
                                <button
                                    onClick={handleGithubConnect}
                                    disabled={githubLoading}
                                    className="w-full py-2.5 rounded-lg bg-foreground text-background text-sm font-bold hover:opacity-90 transition-colors flex items-center justify-center space-x-2 shadow-sm"
                                >
                                    {githubLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Github className="w-4 h-4" />
                                    )}
                                    <span>{githubLoading ? 'CONNECTING...' : 'CONNECT GITHUB'}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
