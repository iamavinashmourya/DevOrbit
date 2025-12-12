import { useState, useEffect, useRef } from 'react';
import { Activity, Monitor, AlertCircle, LogOut, Cloud, CloudUpload, CheckCircle2, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface WindowInfo {
    title: string;
    owner?: {
        name: string;
        bundleId?: string;
    };
    id?: number;
}

interface TrackedActivity {
    title: string;
    ownerName: string;
    startTime: Date;
    lastSyncTime: Date;
}

interface LastSyncedItem {
    name: string;
    time: string;
    status: 'success' | 'failed' | 'ignored';
}

const IGNORED_APPS = ['Windows Explorer', 'Command Prompt', 'Windows PowerShell', 'Task Manager', 'LockApp', 'SearchHost', 'ApplicationFrameHost', 'Notepad', 'Windows Start Experience Host', 'Control Panel', 'SystemSettings'];
const BROWSERS: string[] = []; // Allow all browsers (Backend handles deduplication)
const SELF_NAMES = ['DevOrbit', 'Electron'];

export default function Tracker() {
    const [activeWindow, setActiveWindow] = useState<WindowInfo | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSynced, setLastSynced] = useState<LastSyncedItem | null>(null);
    const [isIgnored, setIsIgnored] = useState(false);

    const navigate = useNavigate();
    const lastActivity = useRef<TrackedActivity | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const interval = setInterval(async () => {
            try {
                // @ts-ignore
                const result = await window.electron.ipcRenderer.invoke('get-active-window');

                if (result) {
                    setActiveWindow(result);
                    setError(null);
                    handleActivitySync(result);
                }
            } catch (err: any) {
                console.error(err);
                setError('Failed to track window');
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [navigate]);

    const handleActivitySync = async (current: WindowInfo) => {
        const now = new Date();
        const appName = current.owner?.name || 'Unknown';
        const title = current.title;

        // --- FILTERS ---
        // 1. Self Check
        if (SELF_NAMES.some(n => appName.includes(n))) {
            setIsIgnored(true);
            return;
        }
        // 2. System Apps
        if (IGNORED_APPS.some(n => appName.includes(n))) {
            setIsIgnored(true);
            return;
        }

        setIsIgnored(false);

        // Initialize first activity
        if (!lastActivity.current) {
            lastActivity.current = {
                title,
                ownerName: appName,
                startTime: now,
                lastSyncTime: now
            };
            return;
        }

        // Determine if we should sync (App changed OR 1 minute passed)
        const isDifferentApp = lastActivity.current.title !== title || lastActivity.current.ownerName !== appName;
        const timeSinceLastSync = (now.getTime() - lastActivity.current.lastSyncTime.getTime()) / 1000 / 60; // in minutes

        if (isDifferentApp || timeSinceLastSync >= 1) {
            const endTime = now;
            const startTime = lastActivity.current.lastSyncTime; // Sync from last success
            const durationMinutes = (endTime.getTime() - startTime.getTime()) / 1000 / 60;

            // Threshold: 2 seconds
            const shouldSync = isDifferentApp ? durationMinutes > (2 / 60) : durationMinutes > 0;

            if (shouldSync) {
                // Fix: Round to 2 decimal places to avoid floating point spam (e.g. 1.33333333m)
                const roundedDuration = Math.round(durationMinutes * 100) / 100;
                await sendActivityToBackend(lastActivity.current, startTime, endTime, roundedDuration);
                // Update sync time
                if (lastActivity.current) {
                    lastActivity.current.lastSyncTime = now;
                }
            }

            // If app changed, reset the tracking object
            if (isDifferentApp) {
                lastActivity.current = {
                    title,
                    ownerName: appName,
                    startTime: now,
                    lastSyncTime: now
                };
            }
        }
    };

    const sendActivityToBackend = async (activity: TrackedActivity, start: Date, end: Date, duration: number) => {
        setIsSyncing(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:4000/api/v1/activities', {
                type: 'app_usage',
                title: `${activity.ownerName} - ${activity.title}`,
                source: 'desktop_app',
                startTime: start,
                endTime: end,
                durationMinutes: duration,
                metadata: {
                    package: activity.ownerName,
                    device: 'Windows PC'
                }
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setLastSynced({
                name: activity.ownerName,
                time: new Date().toLocaleTimeString(),
                status: 'success'
            });

        } catch (err) {
            console.error('Sync failed', err);
            setLastSynced({
                name: activity.ownerName,
                time: new Date().toLocaleTimeString(),
                status: 'failed'
            });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-8 flex flex-col items-center justify-center relative">
            <div className="absolute top-4 right-4 flex gap-2">
                <div className={`p-2 rounded-full transition-colors ${isSyncing ? 'bg-primary/20 text-primary' : 'bg-transparent text-muted-foreground'}`}>
                    {isSyncing ? <CloudUpload className="h-4 w-4 animate-bounce" /> : <Cloud className="h-4 w-4 opacity-50" />}
                </div>
                <button
                    onClick={handleLogout}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    title="Logout"
                >
                    <LogOut className="h-5 w-5" />
                </button>
            </div>

            <div className="w-full max-w-md space-y-6">
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/20">
                        <Activity className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">DevOrbit</h2>
                    <p className="text-muted-foreground mt-2">Monitoring your active workspace</p>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="p-2 bg-secondary rounded-lg">
                            <Monitor className="h-5 w-5 text-foreground" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Current Application</p>
                            <h3 className="font-semibold text-lg max-w-[200px] truncate">{activeWindow?.owner?.name || 'Unknown'}</h3>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Window Title</p>
                            <div className="p-3 bg-secondary/50 rounded-lg border border-border/50 text-sm font-mono break-all leading-tight">
                                {activeWindow?.title || 'Waiting for activity...'}
                            </div>
                        </div>

                        {/* Ignored Warning */}
                        {isIgnored && (
                            <div className="flex items-center gap-2 text-amber-500 text-xs bg-amber-500/10 p-2 rounded-md border border-amber-500/20 animate-in fade-in">
                                <EyeOff className="h-3 w-3" />
                                <span>Tracking Paused (Restricted App)</span>
                            </div>
                        )}

                        {/* Last Sync Indicator */}
                        {lastSynced && !isIgnored && (
                            <div className="flex items-center justify-between text-xs bg-secondary/30 p-2 rounded-md border border-border/30 animate-in fade-in slide-in-from-top-2 duration-300">
                                <span className="text-muted-foreground">Last Synced:</span>
                                <div className="flex items-center gap-1.5">
                                    {lastSynced.status === 'success' ? (
                                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                                    ) : (
                                        <AlertCircle className="h-3 w-3 text-red-500" />
                                    )}
                                    <span className="font-medium truncate max-w-[120px]">{lastSynced.name}</span>
                                    <span className="text-muted-foreground opacity-70">({lastSynced.time})</span>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-2">
                            <span className="flex items-center gap-2">
                                <span className={`flex h-2 w-2 rounded-full animate-pulse ${isIgnored ? 'bg-amber-500' : 'bg-green-500'}`}></span>
                                <span className="text-xs text-muted-foreground">{isIgnored ? 'Monitoring Paused' : 'Tracking Active'}</span>
                            </span>
                            <span className="text-[10px] text-muted-foreground opacity-50">v1.2.1</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
