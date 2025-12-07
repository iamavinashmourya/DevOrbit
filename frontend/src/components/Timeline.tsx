import React from 'react';
import { format } from 'date-fns';
import { Clock, BookOpen, Code, Terminal, Coffee, FileText } from 'lucide-react';

interface Activity {
    _id: string;
    type: string;
    title: string;
    startTime: string;
    durationMinutes: number;
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
    return (
        <div className="glass-panel p-6 rounded-2xl">
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

                        return (
                            <div key={act._id} className="relative pl-10 group">
                                <div className={`absolute left-0 top-0 w-8 h-8 rounded-full bg-slate-900 border flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10 transition-all duration-300 group-hover:scale-110 ${colorClass}`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div className="glass-card p-4 rounded-xl hover:bg-white/5 transition-all duration-300 group-hover:translate-x-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-slate-200 group-hover:text-white transition-colors">{act.title}</h3>
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
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Timeline;
