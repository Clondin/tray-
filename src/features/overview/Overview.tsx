
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/appStore';
import { KpiCard, KpiValue } from '../../components/common/KpiCard';
import { SectionCard } from '../../components/common/SectionCard';
import { fmt, fmtPct } from '../../utils/formatters';
import { Building2, DollarSign, Target, TrendingUp, PieChart, FileText, SlidersHorizontal, Check, Layers } from '../../components/icons';
import type { DashboardKPI } from '../../types';
import { runDebtSizingEngine } from '../../utils/loanCalculations';
import { calculateInvestorReturns } from '../../utils/investorReturnsCalculations';

// Configuration Modal for Dashboard
const DashboardConfigModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { visibleKPIs, setVisibleKPIs } = useAppStore(state => ({
        visibleKPIs: state.visibleKPIs,
        setVisibleKPIs: state.setVisibleKPIs
    }));

    if (!isOpen) return null;

    const availableKPIs: { id: DashboardKPI; label: string }[] = [
        { id: 'purchasePrice', label: 'Purchase Price' },
        { id: 'entryCap', label: 'Entry Cap Rate' },
        { id: 'stabilizedCap', label: 'Stabilized Cap Rate' },
        { id: 'leveredCoC', label: 'Levered Cash-on-Cash' },
        { id: 'leveredIRR', label: 'Levered IRR' },
        { id: 'noiCurrent', label: 'Current NOI' },
        { id: 'noiStabilized', label: 'Stabilized NOI' },
        { id: 'occupancyCurrent', label: 'Current Occupancy' },
        { id: 'occupancyStabilized', label: 'Stabilized Occupancy' },
        { id: 'totalUnits', label: 'Total Units' },
    ];

    const toggleKPI = (id: DashboardKPI) => {
        if (visibleKPIs.includes(id)) {
            setVisibleKPIs(visibleKPIs.filter(k => k !== id));
        } else {
            setVisibleKPIs([...visibleKPIs, id]);
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4 py-6">
             <div className="absolute inset-0 bg-primary/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
             <div className="relative bg-white w-full max-w-md rounded-xl shadow-2xl border border-border p-6 animate-fade-in">
                <h3 className="text-lg font-bold text-primary mb-4">Customize Dashboard</h3>
                <p className="text-sm text-secondary mb-6">Select the metrics you want to display on your main overview board.</p>
                
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {availableKPIs.map(kpi => {
                        const isSelected = visibleKPIs.includes(kpi.id);
                        return (
                            <div 
                                key={kpi.id} 
                                onClick={() => toggleKPI(kpi.id)}
                                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'bg-accent/5 border-accent text-primary' : 'bg-white border-border text-secondary hover:bg-surface-subtle'}`}
                            >
                                <span className="font-medium text-sm">{kpi.label}</span>
                                {isSelected && <Check className="w-4 h-4 text-accent" />}
                            </div>
                        )
                    })}
                </div>

                <div className="mt-6 pt-4 border-t border-border flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">Done</button>
                </div>
             </div>
        </div>
    );
};

const Overview: React.FC = () => {
  const { currentPortfolio, portfolios, selectedPortfolioId, setSelectedPortfolioId, visibleKPIs, financingScenario, assumptions, investorReturnsScenario } = useAppStore(state => ({
    currentPortfolio: state.currentPortfolio,
    portfolios: state.portfolios,
    selectedPortfolioId: state.selectedPortfolioId,
    setSelectedPortfolioId: state.setSelectedPortfolioId,
    visibleKPIs: state.visibleKPIs,
    financingScenario: state.financingScenario,
    assumptions: state.assumptions,
    investorReturnsScenario: state.investorReturnsScenario
  }));
  
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Calculate Returns for KPI display
  const returnMetrics = useMemo(() => {
    if (!currentPortfolio) return null;
    const loanCalcs = runDebtSizingEngine(financingScenario, currentPortfolio);
    if (!loanCalcs) return null;
    const returns = calculateInvestorReturns(currentPortfolio, loanCalcs, assumptions, investorReturnsScenario, financingScenario);
    return returns ? returns.lp : null;
  }, [currentPortfolio, financingScenario, assumptions, investorReturnsScenario]);

  if (!currentPortfolio) return null;
  
  const kpiData: Record<DashboardKPI, { label: string, value: number, format: (v: number) => string, subValue?: string, icon?: React.ReactNode }> = {
      purchasePrice: { 
          label: "Purchase Price", 
          value: currentPortfolio.valuation?.askingPrice, 
          format: fmt, 
          subValue: `${currentPortfolio.propertyCount} Properties`,
          icon: <Building2 className="w-5 h-5" /> 
      },
      entryCap: { 
          label: "Entry Cap Rate", 
          value: currentPortfolio.current?.capRate, 
          format: fmtPct,
          subValue: "Year 1 Yield",
          icon: <PieChart className="w-5 h-5" />
      },
      stabilizedCap: { 
          label: "Stabilized Cap Rate", 
          value: currentPortfolio.stabilized?.capRate, 
          format: fmtPct,
          subValue: "Fully Stabilized",
          icon: <Target className="w-5 h-5" />
      },
      leveredCoC: {
          label: "Levered Cash-on-Cash",
          value: returnMetrics ? returnMetrics.averageCashOnCash * 100 : 0,
          format: fmtPct,
          subValue: "Avg. Annual Yield",
          icon: <DollarSign className="w-5 h-5" />
      },
      leveredIRR: {
          label: "Levered IRR",
          // Ensure value is not null to prevent formatter crash
          value: (returnMetrics && returnMetrics.irr !== null) ? returnMetrics.irr : 0,
          format: fmtPct,
          subValue: "Deal Level",
          icon: <TrendingUp className="w-5 h-5" />
      },
      noiCurrent: {
          label: "Current NOI",
          value: currentPortfolio.current?.noi,
          format: fmt,
          icon: <Layers className="w-5 h-5" />
      },
      noiStabilized: {
          label: "Stabilized NOI",
          value: currentPortfolio.stabilized?.noi,
          format: fmt,
          icon: <Layers className="w-5 h-5" />
      },
      occupancyCurrent: {
          label: "Current Occupancy",
          value: currentPortfolio.current?.occupancy,
          format: fmtPct,
          icon: <Building2 className="w-5 h-5" />
      },
      occupancyStabilized: {
          label: "Stabilized Occupancy",
          value: currentPortfolio.stabilized?.occupancy,
          format: fmtPct,
          icon: <Target className="w-5 h-5" />
      },
      totalUnits: {
          label: "Total Units",
          value: currentPortfolio.totalRooms,
          format: (v) => v.toString(),
          subValue: "Keys",
          icon: <Building2 className="w-5 h-5" />
      }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
        <div>
            <h2 className="text-2xl font-bold text-primary">Executive Dashboard</h2>
            <p className="text-secondary text-sm mt-1">High-level portfolio performance and underwriting summary.</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="bg-white border border-border rounded-lg p-1 shadow-sm flex items-center">
                <span className="px-3 text-xs font-semibold text-secondary uppercase tracking-wider">View:</span>
                <select 
                    value={selectedPortfolioId} 
                    onChange={(e) => setSelectedPortfolioId(e.target.value)} 
                    className="border-0 bg-transparent py-1 pl-2 pr-8 text-sm font-medium focus:ring-0 text-primary cursor-pointer hover:bg-surface-subtle rounded-md"
                >
                    {portfolios.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>
            <button 
                onClick={() => setIsConfigOpen(true)}
                className="p-2 bg-white border border-border rounded-lg text-secondary hover:text-primary hover:border-accent hover:shadow-sm transition-all"
                title="Customize Dashboard"
            >
                <SlidersHorizontal className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* KPI Grid - Responsive layout based on visible items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visibleKPIs.map(key => {
            const data = kpiData[key];
            if (!data) return null;
            return (
                <KpiCard
                    key={key}
                    label={data.label}
                    value={<KpiValue value={data.value} formatter={data.format} />}
                    subValue={data.subValue}
                    icon={data.icon}
                    highlight={key === 'purchasePrice'} // Highlight main price card
                />
            );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard title="Current Financial Performance">
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-surface-subtle rounded-xl border border-border">
                        <div>
                            <div className="text-sm text-secondary mb-1">Effective Gross Income</div>
                            <div className="text-2xl font-bold text-primary">{fmt(currentPortfolio.current?.gri)}</div>
                        </div>
                        <div className="text-right">
                             <div className="text-xs text-secondary uppercase tracking-wide mb-1">Occupancy</div>
                             <div className={`text-lg font-bold ${currentPortfolio.current?.occupancy >= 90 ? 'text-success' : 'text-warning'}`}>
                                 {fmtPct(currentPortfolio.current?.occupancy)}
                             </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                         <div className="p-4 bg-white border border-border rounded-lg">
                            <div className="text-xs text-secondary mb-1">Operating Expenses</div>
                            <div className="font-semibold text-primary">{fmt(currentPortfolio.current?.opex)}</div>
                            <div className="text-xs text-muted mt-1">Ratio: {(currentPortfolio.current?.opex / currentPortfolio.current?.gri * 100).toFixed(1)}%</div>
                         </div>
                         <div className="p-4 bg-white border border-border rounded-lg">
                            <div className="text-xs text-secondary mb-1">Net Operating Income</div>
                            <div className="font-bold text-primary text-lg">{fmt(currentPortfolio.current?.noi)}</div>
                         </div>
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="Stabilized Pro Forma">
                 <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-success-light/30 rounded-xl border border-success/20">
                        <div>
                            <div className="text-sm text-success-dark mb-1">Potential Gross Income</div>
                            <div className="text-2xl font-bold text-success-dark">{fmt(currentPortfolio.stabilized?.gri)}</div>
                        </div>
                        <div className="text-right">
                             <div className="text-xs text-success-dark uppercase tracking-wide mb-1">Target Occ.</div>
                             <div className="text-lg font-bold text-success-dark">
                                 {fmtPct(currentPortfolio.stabilized?.occupancy)}
                             </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                         <div className="p-4 bg-white border border-border rounded-lg">
                            <div className="text-xs text-secondary mb-1">Operating Expenses</div>
                            <div className="font-semibold text-primary">{fmt(currentPortfolio.stabilized?.opex)}</div>
                            <div className="text-xs text-muted mt-1">Ratio: {(currentPortfolio.stabilized?.opex / currentPortfolio.stabilized?.gri * 100).toFixed(1)}%</div>
                         </div>
                         <div className="p-4 bg-white border border-border rounded-lg">
                            <div className="text-xs text-secondary mb-1">Net Operating Income</div>
                            <div className="font-bold text-success text-lg">{fmt(currentPortfolio.stabilized?.noi)}</div>
                         </div>
                    </div>
                </div>
            </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-6">
            <SectionCard title="Quick Actions">
                <div className="flex gap-4">
                    <button className="flex-1 flex items-center justify-center gap-2 p-3 border border-border rounded-lg hover:bg-surface-subtle transition-colors text-sm font-medium text-primary">
                        <FileText className="w-4 h-4 text-accent" />
                        Download Executive Summary
                    </button>
                     <button className="flex-1 flex items-center justify-center gap-2 p-3 border border-border rounded-lg hover:bg-surface-subtle transition-colors text-sm font-medium text-primary">
                        <SlidersHorizontal className="w-4 h-4 text-secondary" />
                        Adjust Global Assumptions
                    </button>
                </div>
            </SectionCard>
      </div>

      <DashboardConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />

    </div>
  );
};

export default Overview;
