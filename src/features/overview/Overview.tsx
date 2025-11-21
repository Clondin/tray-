
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/appStore';
import { KpiCard, KpiValue } from '../../components/common/KpiCard';
import { SectionCard } from '../../components/common/SectionCard';
import { fmt, fmtPct } from '../../utils/formatters';
import { Building2, DollarSign, Target, TrendingUp, PieChart, FileText, SlidersHorizontal, Check, Layers, X } from '../../components/icons';
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

// Global Assumptions Modal
const GlobalAssumptionsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { assumptions, setAssumptions } = useAppStore(state => ({
        assumptions: state.assumptions,
        setAssumptions: state.setAssumptions
    }));

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4 py-6">
             <div className="absolute inset-0 bg-primary/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
             <div className="relative bg-white w-full max-w-lg rounded-xl shadow-2xl border border-border overflow-hidden animate-fade-in">
                <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-surface-subtle">
                    <h3 className="text-lg font-bold text-primary">Global Assumptions</h3>
                    <button onClick={onClose} className="text-secondary hover:text-primary"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-secondary uppercase mb-1.5">Market Rent (Base)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
                                <input 
                                    type="number" 
                                    value={assumptions.marketRent}
                                    onChange={e => setAssumptions({ marketRent: parseFloat(e.target.value) || 0})}
                                    className="form-input pl-6"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-secondary uppercase mb-1.5">Exit Cap Rate</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    value={assumptions.capRate}
                                    onChange={e => setAssumptions({ capRate: parseFloat(e.target.value) || 0})}
                                    className="form-input pr-8"
                                    step={0.1}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">%</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-surface-subtle rounded-lg border border-border space-y-4">
                        <h4 className="text-sm font-semibold text-primary border-b border-border-subtle pb-2">Pro Forma Growth Rates</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-secondary mb-1">Annual Rent Growth</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        value={assumptions.rentGrowth}
                                        onChange={e => setAssumptions({ rentGrowth: parseFloat(e.target.value) || 0})}
                                        className="form-input pr-8"
                                        step={0.25}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-secondary mb-1">Annual OpEx Growth</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        value={assumptions.opexGrowth}
                                        onChange={e => setAssumptions({ opexGrowth: parseFloat(e.target.value) || 0})}
                                        className="form-input pr-8"
                                        step={0.25}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-surface-subtle border-t border-border flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
                        Close
                    </button>
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
  const [isAssumptionsOpen, setIsAssumptionsOpen] = useState(false);

  // Calculate Debt & Returns for KPI display
  const loanCalcs = useMemo(() => {
    if (!currentPortfolio) return null;
    return runDebtSizingEngine(financingScenario, currentPortfolio);
  }, [currentPortfolio, financingScenario]);

  const returnMetrics = useMemo(() => {
    if (!currentPortfolio || !loanCalcs) return null;
    const returns = calculateInvestorReturns(currentPortfolio, loanCalcs, assumptions, investorReturnsScenario, financingScenario);
    return returns ? returns.lp : null;
  }, [currentPortfolio, loanCalcs, assumptions, investorReturnsScenario, financingScenario]);

  // Generate and download executive summary
  const handleDownloadSummary = () => {
      if (!currentPortfolio || !loanCalcs) return;
      
      // Create a beautiful HTML print view
      const printContent = `
        <html>
          <head>
            <title>Executive Summary - ${currentPortfolio.name}</title>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.5; padding: 40px; max-width: 800px; margin: 0 auto; }
              h1 { color: #0f172a; border-bottom: 2px solid #e11d48; padding-bottom: 10px; margin-bottom: 30px; }
              h2 { color: #334155; margin-top: 25px; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 20px; }
              .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
              .label { color: #64748b; font-weight: 500; }
              .value { font-weight: 700; color: #0f172a; }
              .highlight { color: #e11d48; }
              .section { margin-bottom: 30px; }
              .footer { margin-top: 50px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px;}
            </style>
          </head>
          <body>
            <h1>Executive Summary</h1>
            
            <div class="section">
                <div class="row">
                    <span class="label">Portfolio Name</span>
                    <span class="value">${currentPortfolio.name}</span>
                </div>
                 <div class="row">
                    <span class="label">Properties / Units</span>
                    <span class="value">${currentPortfolio.propertyCount} Properties / ${currentPortfolio.totalRooms} Keys</span>
                </div>
            </div>

            <div class="grid">
                <div>
                    <h2>Valuation</h2>
                    <div class="row"><span class="label">Purchase Price</span><span class="value">${fmt(currentPortfolio.valuation.askingPrice)}</span></div>
                    <div class="row"><span class="label">Total Project Cost</span><span class="value">${fmt(loanCalcs?.totalCost)}</span></div>
                    <div class="row"><span class="label">Stabilized Value</span><span class="value">${fmt(currentPortfolio.valuation.stabilizedValue)}</span></div>
                    <div class="row"><span class="label">Upside Potential</span><span class="value highlight">${fmtPct(currentPortfolio.valuation.upside)}</span></div>
                </div>
                <div>
                     <h2>Financial Performance</h2>
                    <div class="row"><span class="label">Current NOI</span><span class="value">${fmt(currentPortfolio.current.noi)}</span></div>
                    <div class="row"><span class="label">Stabilized NOI</span><span class="value">${fmt(currentPortfolio.stabilized.noi)}</span></div>
                    <div class="row"><span class="label">Entry Cap Rate</span><span class="value">${fmtPct(currentPortfolio.current.capRate)}</span></div>
                    <div class="row"><span class="label">Stabilized Cap Rate</span><span class="value">${fmtPct(currentPortfolio.stabilized.capRate)}</span></div>
                </div>
            </div>

            <div class="grid">
                <div>
                    <h2>Financing Structure</h2>
                    <div class="row"><span class="label">Loan Amount</span><span class="value">${fmt(loanCalcs?.effectiveLoanAmount)}</span></div>
                    <div class="row"><span class="label">LTV</span><span class="value">${fmtPct(loanCalcs?.loanToValue)}</span></div>
                    <div class="row"><span class="label">Equity Required</span><span class="value">${fmt(loanCalcs?.equityRequired)}</span></div>
                    <div class="row"><span class="label">Interest Rate</span><span class="value">${financingScenario.interestRate}%</span></div>
                </div>
                <div>
                    <h2>Projected Returns (LP)</h2>
                    <div class="row"><span class="label">IRR</span><span class="value">${fmtPct(returnMetrics?.irr)}</span></div>
                    <div class="row"><span class="label">Equity Multiple</span><span class="value">${returnMetrics?.equityMultiple?.toFixed(2)}x</span></div>
                    <div class="row"><span class="label">Avg. Cash-on-Cash</span><span class="value">${fmtPct((returnMetrics?.averageCashOnCash || 0) * 100)}</span></div>
                </div>
            </div>

             <div class="footer">
                Generated by TRAY Holdings Underwriting Model on ${new Date().toLocaleDateString()}
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `;

      const win = window.open('', '_blank');
      if (win) {
        win.document.write(printContent);
        win.document.close();
      }
  };

  if (!currentPortfolio) return null;
  
  // Prepare Data for KPI Cards
  const purchasePriceVal = currentPortfolio.valuation?.askingPrice || 0;
  const totalProjectCost = loanCalcs?.totalCost || 0;

  const kpiData: Record<DashboardKPI, { label: string, value: number | React.ReactNode, format: (v: number) => string, subValue?: string | React.ReactNode, icon?: React.ReactNode }> = {
      purchasePrice: { 
          label: "Purchase Price", 
          value: purchasePriceVal, 
          format: fmt, 
          // Show Total Cost as Sub Value
          subValue: (
            <span className="flex flex-col text-xs text-muted">
                <span>Acquisition Only</span>
                <span className="font-semibold text-secondary mt-0.5">All-in: {fmt(totalProjectCost)}</span>
            </span>
          ),
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
                    value={
                        typeof data.value === 'number' 
                        ? <KpiValue value={data.value} formatter={data.format} /> 
                        : data.value
                    }
                    subValue={data.subValue as string} // Casting due to ReactNode complexity in prop
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
                    <button 
                        onClick={handleDownloadSummary}
                        className="flex-1 flex items-center justify-center gap-2 p-3 border border-border rounded-lg hover:bg-surface-subtle transition-colors text-sm font-medium text-primary"
                    >
                        <FileText className="w-4 h-4 text-accent" />
                        Print Executive Summary (PDF)
                    </button>
                     <button 
                        onClick={() => setIsAssumptionsOpen(true)}
                        className="flex-1 flex items-center justify-center gap-2 p-3 border border-border rounded-lg hover:bg-surface-subtle transition-colors text-sm font-medium text-primary"
                    >
                        <SlidersHorizontal className="w-4 h-4 text-secondary" />
                        Adjust Global Assumptions
                    </button>
                </div>
            </SectionCard>
      </div>

      <DashboardConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
      <GlobalAssumptionsModal isOpen={isAssumptionsOpen} onClose={() => setIsAssumptionsOpen(false)} />

    </div>
  );
};

export default Overview;
