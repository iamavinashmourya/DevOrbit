import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import SummaryCard from '../components/SummaryCard';
import QuickAdd from '../components/QuickAdd';
import Timeline from '../components/Timeline';
import { BookOpen, Code, Clock, AlertCircle, Github, CheckCircle, Loader2 } from 'lucide-react';

const Dashboard: React.FC = () => {
    const { user, updateUser } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        studyHours: 0,
        dsaCount: 0,
        timepassMinutes: 0,
    });
    const [activities, setActivities] = useState([]);
    const [refresh, setRefresh] = useState(0);
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
                    params: { start: startOfDay, end: endOfDay },
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
                    studyHours: parseFloat((studyMins / 60).toFixed(1)),
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
    }, [user, refresh]);

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

    const handleActivityAdded = () => {
        setRefresh((prev) => prev + 1);
    };

    const handleGithubConnect = () => {
        const clientId = 'Ov23li7TjBbWfPYo2MqK';
        window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo,user`;
    };

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">
                        Dashboard
                    </h1>
                    <p className="text-slate-400 mt-2 text-lg">
                        Welcome back, <span className="text-cyan-400 font-semibold">{user?.name}</span>.
                    </p>
                </div>
                <div className="text-right hidden md:block">
                    <p className="text-sm text-slate-500 font-mono">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SummaryCard
                    title="Study Hours"
                    value={stats.studyHours}
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
                    title="Timepass (min)"
                    value={stats.timepassMinutes}
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Timeline activities={activities} />
                </div>
                <div className="space-y-8">
                    <QuickAdd onActivityAdded={handleActivityAdded} />

                    {/* GitHub Connect Card */}
                    <div className="glass-card p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full -mr-10 -mt-10"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-white flex items-center">
                                    <Github className="w-5 h-5 mr-2" />
                                    GitHub Sync
                                </h3>
                                {githubConnected && <CheckCircle className="w-5 h-5 text-green-400" />}
                            </div>

                            {githubConnected ? (
                                <div>
                                    <p className="text-sm text-slate-400 mb-4">
                                        Your GitHub account is connected.
                                    </p>

                                    <div className="space-y-3 mb-4">
                                        {githubActivity.slice(0, 3).map((event: any) => (
                                            <div key={event.id} className="text-xs bg-white/5 p-2 rounded border border-white/5">
                                                <div className="flex justify-between text-slate-500 mb-1">
                                                    <span>{event.repo}</span>
                                                    <span>{new Date(event.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <div className="text-slate-300 truncate">
                                                    {event.type === 'PushEvent' ? `Pushed ${event.payload.size} commits` : event.type}
                                                </div>
                                            </div>
                                        ))}
                                        {githubActivity.length === 0 && (
                                            <p className="text-xs text-slate-500 italic">No recent activity found.</p>
                                        )}
                                    </div>

                                    <div className="flex items-center space-x-2 text-xs text-green-400 bg-green-400/10 px-3 py-2 rounded-lg border border-green-400/20">
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                        <span>Sync Active</span>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-sm text-slate-400 mb-4">
                                        Connect GitHub to track your coding activity and streaks.
                                    </p>
                                    <button
                                        onClick={handleGithubConnect}
                                        disabled={githubLoading}
                                        className="w-full py-2.5 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-200 transition-colors flex items-center justify-center space-x-2"
                                    >
                                        {githubLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Github className="w-4 h-4" />
                                        )}
                                        <span>{githubLoading ? 'Connecting...' : 'Connect GitHub'}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
