import React, { useState } from 'react';
import { format } from 'date-fns';
import { Clock, BookOpen, Code, Terminal, Coffee, FileText, X, ExternalLink } from 'lucide-react';

interface HistoryItem {
    title: string;
    url?: string;
    timestamp: Date;
    duration?: number;
}

interface Activity {
    _id: string;
    type: string;
    title: string;
    startTime: string;
    durationMinutes: number;
    history?: HistoryItem[];
    metadata?: {
        domain?: string;
        url?: string;
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

const getActivityColor = (type: string) => {
    switch (type) {
        case 'learn': return 'text-cyan-400 border-cyan-500/50 shadow-cyan-500/20';
        case 'dsa': return 'text-green-400 border-green-500/50 shadow-green-500/20';
        case 'project': return 'text-purple-400 border-purple-500/50 shadow-purple-500/20';
        case 'timepass': return 'text-red-400 border-red-500/50 shadow-red-500/20';
        case 'assignment': return 'text-orange-400 border-orange-500/50 shadow-orange-500/20';
        default: return 'text-slate-400 border-slate-500/50 shadow-slate-500/20';
    }
};

const Timeline: React.FC<TimelineProps> = ({ activities }) => {
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

    return (
        <div className="glass-panel p-6 rounded-2xl relative">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-cyan-400" />
                Activity Timeline
            </h2>
            <div className="space-y-6 relative">
                {/* Vertical Line */}
                <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-cyan-500/50 via-purple-500/50 to-transparent"></div>

                {activities.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <p>No activities recorded today.</p>
                    </div>
                ) : (
                    activities.map((act) => {
                        const Icon = getActivityIcon(act.type);
                        const colorClass = getActivityColor(act.type);
                        const hasHistory = act.history && act.history.length > 0;

                        return (
                            <div
                                key={act._id}
                                className="relative pl-10 group cursor-pointer"
                                onClick={() => setSelectedActivity(act)}
                            >
                                <div className={`absolute left-0 top-0 w-8 h-8 rounded-full bg-slate-900 border flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10 transition-all duration-300 group-hover:scale-110 ${colorClass}`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div className="glass-card p-4 rounded-xl hover:bg-white/5 transition-all duration-300 group-hover:translate-x-1 group-active:scale-[0.99]">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-slate-200 group-hover:text-white transition-colors flex items-center gap-2">
                                                {act.metadata?.domain || act.title}
                                                {hasHistory && act.history && act.history.length > 1 && (
                                                    <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-full">
                                                        +{act.history.length}
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="text-xs text-slate-400 uppercase tracking-wider mt-1 font-mono">
                                                {act.type.replace('_', ' ')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-medium text-slate-500 block">
                                                {format(new Date(act.startTime), 'h:mm a')}
                                            </span>
                                            <span className="text-xs font-bold text-slate-900 bg-cyan-400 px-2 py-0.5 rounded-full mt-1 inline-block shadow-[0_0_10px_rgba(34,211,238,0.4)]">
                                                {act.durationMinutes}m
                                            </span>
                                        </div>
                                    </div>
                                    {/* Preview of latest history item if available */}
                                    {hasHistory && (
                                        <div className="mt-2 text-xs text-slate-500 truncate border-t border-slate-700/50 pt-2">
                                            Latest: {act.title}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* History Details Modal */}
            {selectedActivity && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedActivity(null)}>
                    <div className="glass-panel p-6 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col relative animate-in fade-in zoom-in duration-200 shadow-2xl border border-slate-700" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                {(() => {
                                    const Icon = getActivityIcon(selectedActivity.type);
                                    const colorClass = getActivityColor(selectedActivity.type).split(' ')[0];
                                    return <Icon className={`w-6 h-6 ${colorClass}`} />;
                                })()}
                                <span>{selectedActivity.metadata?.domain || selectedActivity.title}</span>
                            </h3>
                            <button
                                onClick={() => setSelectedActivity(null)}
                                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                            {!selectedActivity.history || selectedActivity.history.length === 0 ? (
                                <div className="text-slate-400 text-center py-4">
                                    <p>No detailed history available.</p>
                                    <p className="text-xs text-slate-600 mt-2">Only activities starting now will track detailed history.</p>
                                </div>
                            ) : (
                                selectedActivity.history.slice().reverse().map((item, idx) => (
                                    <div key={idx} className="p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-slate-200 font-medium truncate" title={item.title}>
                                                    {item.title}
                                                </p>
                                                <div className="flex items-center gap-3 mt-1.5 align-middle">
                                                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {format(new Date(item.timestamp), 'h:mm:ss a')}
                                                    </span>

                                                    {/* Duration Badge */}
                                                    {item.duration !== undefined && (
                                                        <span className="text-[10px] text-slate-300 bg-slate-700 px-1.5 py-0.5 rounded-md flex items-center font-bold">
                                                            {item.duration} min
                                                        </span>
                                                    )}

                                                    {/* Category Badge */}
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getActivityColor(selectedActivity.type).replace('shadow-', '').replace('text-', 'bg-').split(' ')[0]}/10 border-${getActivityColor(selectedActivity.type).split(' ')[0]}/20 text-${getActivityColor(selectedActivity.type).split(' ')[0].split('-')[1]}-300`}>
                                                        {selectedActivity.type.toUpperCase()}
                                                    </span>

                                                    {item.url && (
                                                        <a
                                                            href={item.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
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

                        <div className="mt-6 pt-4 border-t border-slate-700 flex justify-between items-center text-sm text-slate-400">
                            <span>Total Duration: <span className="text-white font-bold">{selectedActivity.durationMinutes}m</span></span>
                            <span>{selectedActivity.history?.length || 0} entries</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Timeline;
