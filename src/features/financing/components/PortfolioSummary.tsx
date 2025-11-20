import React from 'react';
import { useAppStore } from '../../../store/appStore';
import { SectionCard } from '../../../components/common/SectionCard';
import { fmt, fmtPct } from '../../../utils/formatters';
import { Download } from '../../../components/icons';

const MetricRow: React.FC<{ label: string, value: string | number }> = ({ label, value }) => (
    <div className="flex justify-between items-center py-2 text-small">
        <span className="text-text-muted">{label}</span>
        <span className="font-semibold text-text-primary">{value}</span>
    </div>
);

const PortfolioSummary: React.FC = () => {
    const { portfolios, currentPortfolio, setSelectedPortfolioId } = useAppStore(state => ({
        portfolios: state.portfolios,
        currentPortfolio: state.currentPortfolio,
        setSelectedPortfolioId: state.setSelectedPortfolioId,
    }));
    
    if (!currentPortfolio) {
        return <SectionCard>Loading portfolio...</SectionCard>;
    }

    return (
        <div className="space-y-6">
            <div>
                <label htmlFor="financing-portfolio-select" className="text-small font-semibold text-text-muted uppercase tracking-wider mb-2 block">
                    Portfolio
                </label>
                <select 
                    id="financing-portfolio-select" 
                    value={currentPortfolio.id} 
                    onChange={(e) => setSelectedPortfolioId(e.target.value)} 
                    className="form-select w-full"
                >
                    {portfolios.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>
            
            <div className="bg-bg-surface rounded-lg border border-border-subtle p-4 space-y-2">
                <h3 className="text-body font-semibold text-text-primary pb-2 border-b border-border-subtle">{currentPortfolio.name}</h3>
                <MetricRow label="Acquisition Price" value={fmt(currentPortfolio.valuation?.askingPrice)} />
                <MetricRow label="Total Rooms" value={currentPortfolio.totalRooms} />
                <MetricRow label="Wgt. Occupancy" value={fmtPct(currentPortfolio.current?.occupancy)} />
                <MetricRow label="Current NOI" value={fmt(currentPortfolio.current?.noi)} />
                <MetricRow label="Stabilized NOI" value={fmt(currentPortfolio.stabilized?.noi)} />
                <MetricRow label="NOI Upside" value={`${fmtPct(currentPortfolio.valuation?.upside)}`} />
                <MetricRow label="Yield on Cost" value={fmtPct(currentPortfolio.stabilized?.capRate)} />
            </div>

            <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-border-subtle text-body font-medium rounded-md shadow-sm text-text-secondary bg-white hover:bg-bg-surface-soft">
                <Download className="w-4 h-4 mr-2" />Export Summary
            </button>
        </div>
    );
};

export default PortfolioSummary;
