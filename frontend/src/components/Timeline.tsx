import React, { useState } from 'react';
import { format } from 'date-fns';
import { Clock, BookOpen, Code, Terminal, Coffee, FileText, X, ExternalLink, Monitor, Globe, Smartphone, Laptop } from 'lucide-react';
import { formatDuration } from '../utils/format';
import { getAppIconUrl } from '../utils/appIcons';

interface HistoryItem {
    title: string;
    url?: string;
    timestamp: Date;
    duration?: number;
    durationMinutes?: number;
    _originalType?: string;
}

interface Activity {
    _id: string;
    type: string;
    title: string;
    source?: string;
    startTime: string;
    durationMinutes: number;
    history?: HistoryItem[];
    metadata?: {
        domain?: string;
        url?: string;
        package?: string; // Added package support
    };
}

interface TimelineProps {
    activities: Activity[];
}

const getActivityIcon = (type: string) => {
    switch (type) {
        case 'learn': return BookOpen;
        case 'dsa': return Code;
        case 'project': return Terminal;
        case 'timepass': return Coffee;
        case 'assignment': return FileText;
        default: return Clock;
    }
};

const getSourceIcon = (source: string | undefined) => {
    switch (source) {
        case 'desktop_app': return Monitor;
        case 'mobile_app': return Smartphone;
        case 'browser_extension': return Globe;
        default: return Laptop; // Default fallback
    }
}

const getActivityColor = (type: string) => {
    switch (type) {
        case 'learn': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
        case 'dsa': return 'text-green-500 bg-green-500/10 border-green-500/20';
        case 'project': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
        case 'timepass': return 'text-muted-foreground bg-muted border-border';
        case 'assignment': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
        default: return 'text-muted-foreground bg-muted border-border';
    }
};

const AppIcon = ({ name, type, className = "w-4 h-4" }: { name: string, type: string, className?: string }) => {
    const [imgError, setImgError] = useState(false);
    const iconUrl = getAppIconUrl(name);

    if (iconUrl && !imgError) {
        return (
            <img
                src={iconUrl}
                alt={name}
                className={`${className} object-contain opacity-80`}
                onError={() => setImgError(true)}
            />
        );
    }

    const FallbackIcon = getActivityIcon(type);
    return <FallbackIcon className={className} />;
};

const Timeline: React.FC<TimelineProps> = ({ activities }) => {
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

    // Group activities by domain/title
    const groupedActivities = React.useMemo(() => {
        const groups: { [key: string]: Activity } = {};

        activities.forEach(act => {
            const key = act.metadata?.domain || act.title;

            if (!groups[key]) {
                groups[key] = {
                    ...act,
                    history: act.history ? act.history.map(h => ({ ...h, _originalType: act.type })) : []
                };
            } else {
                const existing = groups[key];
                existing.durationMinutes += act.durationMinutes;

                if (new Date(act.startTime) > new Date(existing.startTime)) {
                    existing.startTime = act.startTime;
                    existing.type = act.type;
                    existing.source = act.source;
                    // Inherit latest metadata
                    existing.metadata = { ...existing.metadata, ...act.metadata };
                }

                if (act.history) {
                    const typedHistory = act.history.map(h => ({ ...h, _originalType: act.type }));
                    existing.history = [...(existing.history || []), ...typedHistory];
                }
            }
        });

        return Object.values(groups).map(group => {
            if (group.history && group.history.length > 0) {
                group.history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                const mergedHistory: any[] = [];
                let lastItem: any = null;

                group.history.forEach((item) => {
                    if (lastItem && lastItem.title === item.title && lastItem.url === item.url) {
                        lastItem.durationMinutes = (lastItem.durationMinutes || 0) + (item.durationMinutes || 0);
                    } else {
                        mergedHistory.push(item);
                        lastItem = item;
                    }
                });
                group.history = mergedHistory;

                const latestItem = group.history[0];
                // @ts-ignore
                if (latestItem._originalType) {
                    // @ts-ignore
                    group.type = latestItem._originalType;
                }
            }
            return group;
        }).sort((a, b) =>
            new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );
    }, [activities]);

    return (
        <>
            <div className="card-minimal p-6 relative">
                <h2 className="text-lg font-bold text-foreground mb-6 flex items-center">
                    <Clock className="w-5 h-5 mr-3 text-muted-foreground" />
                    Activity Timeline
                </h2>
                <div className="space-y-6 relative">
                    <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border"></div>

                    {groupedActivities.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No activities recorded today.</p>
                        </div>
                    ) : (
                        groupedActivities.map((act) => {
                            const SourceIcon = getSourceIcon(act.source);
                            const styleClass = getActivityColor(act.type);
                            // @ts-ignore
                            const hasHistory = act.history && act.history.length > 0;

                            // Determine App Name for Icon
                            // 1. Package name (e.g. "Code", "Chrome")
                            // 2. Domain (e.g. "github", "youtube")
                            // 3. Title fallback
                            const appName = act.metadata?.package || (act.metadata?.domain ? act.metadata.domain.split('.')[0] : act.title);

                            return (
                                <div
                                    key={act._id}
                                    className="relative pl-10 group cursor-pointer"
                                    onClick={() => setSelectedActivity(act)}
                                >
                                    <div className={`absolute left-0 top-1 w-8 h-8 rounded-lg border flex items-center justify-center z-10 transition-all duration-200 group-hover:scale-105 ${styleClass}`}>
                                        <AppIcon name={appName} type={act.type} />
                                    </div>
                                    <div className="p-4 rounded-xl border border-transparent hover:bg-muted/50 transition-all duration-200 -mt-2 group-hover:border-border">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-foreground flex items-center gap-2">
                                                    {act.metadata?.domain || act.title}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                                                        {act.type.replace('_', ' ')}
                                                    </p>
                                                    <span className="text-muted-foreground/30">•</span>
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground" title={`Source: ${act.source || 'Unknown'}`}>
                                                        <SourceIcon className="w-3 h-3" />
                                                        <span className="capitalize">{act.source ? act.source.replace('_app', '').replace('browser_', '') : 'Manual'}</span>
                                                    </div>
                                                </div>

                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-medium text-muted-foreground block">
                                                    {format(new Date(act.startTime), 'h:mm a')}
                                                </span>
                                                <span className="text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded mt-1 inline-block border border-border">
                                                    {formatDuration(act.durationMinutes)}
                                                </span>
                                            </div>
                                        </div>
                                        {hasHistory && act.history && (
                                            <div className="mt-2 text-xs text-muted-foreground truncate border-t border-border pt-2">
                                                Latest: {act.history[0].title}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {selectedActivity && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setSelectedActivity(null)}>
                    <div className="bg-card border border-border p-6 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col relative shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-3">
                                {(() => {
                                    const styleClass = getActivityColor(selectedActivity.type);
                                    const appName = selectedActivity.metadata?.package || (selectedActivity.metadata?.domain ? selectedActivity.metadata.domain.split('.')[0] : selectedActivity.title);

                                    return (
                                        <div className={`p-1.5 rounded-md ${styleClass}`}>
                                            <AppIcon name={appName} type={selectedActivity.type} className="w-5 h-5" />
                                        </div>
                                    )
                                })()}
                                <span>{selectedActivity.metadata?.domain || selectedActivity.title}</span>
                            </h3>
                            <button
                                onClick={() => setSelectedActivity(null)}
                                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                            {!selectedActivity.history || selectedActivity.history.length === 0 ? (
                                <div className="text-muted-foreground text-center py-8">
                                    <p>No detailed history available.</p>
                                </div>
                            ) : (
                                selectedActivity.history.map((item, idx) => (
                                    <div key={idx} className="p-3 rounded-lg border border-border hover:bg-muted transition-colors group">
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-foreground font-medium truncate" title={item.title}>
                                                    {item.title}
                                                </p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {format(new Date(item.timestamp), 'h:mm:ss a')}
                                                    </span>

                                                    {item.duration !== undefined && (
                                                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex items-center font-medium border border-border">
                                                            {formatDuration(item.duration)}
                                                        </span>
                                                    )}

                                                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-muted text-muted-foreground">
                                                        {/* @ts-ignore */}
                                                        {(item._originalType || selectedActivity.type).toUpperCase()}
                                                    </span>

                                                    {item.url && (
                                                        <a
                                                            href={item.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[10px] text-primary hover:underline flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                                                            onClick={e => e.stopPropagation()}
                                                        >
                                                            Open <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
                            <span>Total: <span className="text-foreground font-medium">{formatDuration(selectedActivity.durationMinutes)}</span></span>
                            <span>{selectedActivity.history?.length || 0} entries</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Timeline;
