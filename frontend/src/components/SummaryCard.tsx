import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    trendUp?: boolean;
    color: 'blue' | 'purple' | 'cyan' | 'green' | 'red';
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon: Icon, trend, trendUp, color }) => {
    const colorMap = {
        blue: 'from-blue-500 to-cyan-500',
        purple: 'from-purple-500 to-pink-500',
        cyan: 'from-cyan-400 to-blue-500',
        green: 'from-emerald-400 to-green-500',
        red: 'from-red-500 to-orange-500',
    };

    const glowMap = {
        blue: 'shadow-blue-500/20',
        purple: 'shadow-purple-500/20',
        cyan: 'shadow-cyan-500/20',
        green: 'shadow-green-500/20',
        red: 'shadow-red-500/20',
    };

    return (
        <div className={`glass-card p-6 rounded-2xl relative overflow-hidden group hover:shadow-xl ${glowMap[color]} transition-all duration-500`}>
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colorMap[color]} opacity-10 blur-2xl rounded-full -mr-10 -mt-10 group-hover:opacity-20 transition-opacity`}></div>

            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">{title}</p>
                    <h3 className="text-3xl font-bold text-white mt-2 tracking-tight group-hover:scale-105 transition-transform origin-left">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${colorMap[color]} bg-opacity-10 shadow-lg shadow-black/20 group-hover:shadow-${color}-500/20 transition-all`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>

            {trend && (
                <div className="mt-4 flex items-center text-sm relative z-10">
                    <span className={`font-medium ${trendUp ? 'text-emerald-400' : 'text-red-400'} flex items-center`}>
                        {trendUp ? '↑' : '↓'} {trend}
                    </span>
                    <span className="text-slate-500 ml-2">vs last week</span>
                </div>
            )}
        </div>
    );
};

export default SummaryCard;
