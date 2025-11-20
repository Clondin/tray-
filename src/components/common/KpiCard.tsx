import React from 'react';
import { ArrowUpRight, ArrowDownRight } from '../icons';
import { useCountUp } from '../../utils/animations';

interface KpiCardProps {
    label: string;
    value: React.ReactNode;
    subValue?: string;
    trend?: number;
    icon?: React.ReactNode;
    highlight?: boolean;
    onClick?: () => void;
    className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({ label, value, subValue, trend, icon, highlight = false, onClick, className = '' }) => {

    const renderTrend = () => {
        if (trend === undefined || !isFinite(trend)) return null;
        const isPositive = trend >= 0;
        return (
            <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                isPositive 
                ? 'text-success' 
                : 'text-danger'
            }`}>
                {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(trend).toFixed(1)}%
            </span>
        );
    };

    return (
        <div 
            onClick={onClick}
            className={`
            relative overflow-hidden rounded-xl border p-5 transition-all duration-300
            ${highlight 
                ? 'bg-primary border-primary text-white shadow-lg' 
                : 'bg-white border-border shadow-card'}
            ${onClick 
                ? 'cursor-pointer hover:-translate-y-1 hover:shadow-card-hover hover:border-accent/30' 
                : ''}
            ${className}
        `}>
            <div className="flex flex-col h-full justify-between gap-4">
                <div className="flex items-start justify-between">
                    <span className={`text-sm font-medium ${highlight ? 'text-slate-300' : 'text-secondary'}`}>{label}</span>
                    {icon && (
                        <div className={`p-2 rounded-lg ${highlight ? 'bg-white/10 text-white' : 'bg-surface-subtle text-secondary'}`}>
                            {icon}
                        </div>
                    )}
                </div>
                
                <div>
                    <div className={`text-2xl font-bold tracking-tight ${highlight ? 'text-white' : 'text-primary'}`}>
                        {value}
                    </div>
                    <div className="flex items-center gap-2 mt-1 min-h-[1.25rem]">
                        {subValue && (
                            <span className={`text-xs ${highlight ? 'text-slate-400' : 'text-muted'}`}>
                                {subValue}
                            </span>
                        )}
                        {renderTrend()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const KpiValue: React.FC<{value: number, formatter: (val: number) => string}> = ({ value, formatter }) => {
    const animatedValue = useCountUp(value);
    return <span>{formatter(animatedValue)}</span>;
}