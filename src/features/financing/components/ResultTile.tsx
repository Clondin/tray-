import React from 'react';
import { KpiValue } from '../../../components/common/KpiCard';

interface ResultTileProps {
    label: string;
    value: number;
    formatter: (val: number) => string;
    subValue?: React.ReactNode;
    variant?: 'success' | 'warning' | 'danger' | 'default';
    colSpan?: number;
}

export const ResultTile: React.FC<ResultTileProps> = ({
    label,
    value,
    formatter,
    subValue,
    variant = 'default',
    colSpan = 1
}) => {
    
    const variantClasses = {
        success: 'border-status-success/50 bg-status-success-soft/30',
        warning: 'border-status-warning/50 bg-status-warning-soft/30',
        danger: 'border-status-danger/50 bg-status-danger-soft/30',
        default: 'border-border-subtle bg-bg-surface'
    };

    return (
        <div className={`
            p-4 rounded-lg border transition-all duration-300
            hover:-translate-y-0.5 hover:shadow-card-hover
            ${variantClasses[variant]}
            ${colSpan === 2 ? 'col-span-2' : ''}
        `}>
            <div className="flex flex-col gap-1">
                <span className="text-small font-medium text-text-secondary">{label}</span>
                <div className="text-section font-bold text-text-primary leading-none tracking-tight">
                    <KpiValue value={value} formatter={formatter} />
                </div>
                {subValue && (
                    <div className="flex items-center gap-2 text-small h-5 text-text-muted">
                        {subValue}
                    </div>
                )}
            </div>
        </div>
    );
};
