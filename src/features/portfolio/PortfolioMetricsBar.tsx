import React from 'react';
import { useAppStore } from '../../store/appStore';
import { fmt, fmtPct } from '../../utils/formatters';
import { KpiValue } from '../../components/common/KpiCard';

const MetricDisplay: React.FC<{ label: string, valueNode: React.ReactNode, className?: string }> = ({ label, valueNode, className }) => (
    <div className={`flex-1 p-4 group transition-colors duration-200 hover:bg-bg-surface-soft/50 ${className}`}>
        <div className="text-small text-text-muted mb-0.5">{label}</div>
        <div className="text-card font-semibold text-text-primary tracking-tight">{valueNode}</div>
    </div>
);

export const PortfolioMetricsBar: React.FC = () => {
    const { currentPortfolio } = useAppStore(state => ({
        currentPortfolio: state.currentPortfolio,
    }));

    if (!currentPortfolio) return null;

    const noiUpside = ((currentPortfolio.stabilized?.noi ?? 0) - (currentPortfolio.current?.noi ?? 0));
    const yieldOnCost = currentPortfolio.stabilized?.capRate;

    const metrics = [
        { label: "Total Price", value: currentPortfolio.valuation?.askingPrice, formatter: fmt },
        { label: "Wgt. Occupancy", value: currentPortfolio.current?.occupancy, formatter: fmtPct },
        { label: "Current NOI", value: currentPortfolio.current?.noi, formatter: fmt },
        { label: "Stabilized NOI", value: currentPortfolio.stabilized?.noi, formatter: fmt },
        { label: "NOI Upside", value: noiUpside, formatter: fmt },
        { label: "Upside %", value: currentPortfolio.valuation?.upside, formatter: fmtPct, className: "text-accent-primary" },
        { label: "Yield on Cost", value: yieldOnCost, formatter: fmtPct },
    ];

    return (
        <div className="sticky top-[70px] z-20 bg-bg-surface/90 backdrop-blur-md border border-border-subtle rounded-lg shadow-card">
            <div className="flex items-stretch divide-x divide-border-subtle">
                {metrics.map(metric => (
                    <MetricDisplay 
                        key={metric.label}
                        label={metric.label} 
                        valueNode={
                            <span className={metric.className}>
                                <KpiValue value={metric.value || 0} formatter={metric.formatter} />
                            </span>
                        }
                    />
                ))}
            </div>
        </div>
    );
};
