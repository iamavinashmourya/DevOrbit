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

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon: Icon, trend, trendUp }) => {
    return (
        <div className="card-minimal p-6 flex flex-col justify-between h-32 relative overflow-hidden group">
            <div className="flex justify-between items-start">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <Icon className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>

            <div className="mt-auto">
                <h3 className="text-3xl font-bold text-foreground tracking-tight">{value}</h3>
            </div>

            {trend && (
                <div className="absolute bottom-6 right-6 flex items-center text-xs">
                    <span className={`font-medium ${trendUp ? 'text-emerald-500' : 'text-destructive'} flex items-center bg-muted px-1.5 py-0.5 rounded border border-border`}>
                        {trendUp ? '↑' : '↓'} {trend}
                    </span>
                </div>
            )}
        </div>
    );
};

export default SummaryCard;
