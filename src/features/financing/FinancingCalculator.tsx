
import React, { useMemo, useState, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import type { FinancingScenario } from '../../types';
import { runDebtSizingEngine } from '../../utils/loanCalculations';
import { KpiValue } from '../../components/common/KpiCard';
import { SectionCard } from '../../components/common/SectionCard';
import { fmt, fmtPct } from '../../utils/formatters';
import { Calculator, PieChart, TrendingUp, DollarSign } from '../../components/icons';

const InputGroup: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="space-y-3">
        <h4 className="text-xs font-bold text-secondary uppercase tracking-wider border-b border-border pb-1">{title}</h4>
        <div className="space-y-4">{children}</div>
    </div>
);

// Specialized Input for large monetary values to prevent cursor jumping and improve UX
const PriceInput = ({ value, onChange }: { value: number, onChange: (val: number) => void }) => {
    // Local state to handle typing without jitter
    const [localVal, setLocalVal] = useState<string>('');
    const [focused, setFocused] = useState(false);

    // Sync from parent when not editing
    useEffect(() => {
        if (!focused) {
             // Format with commas for display
            setLocalVal(value ? value.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '');
        }
    }, [value, focused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/,/g, '');
        
        // Allow only numbers
        if (!/^\d*\.?\d*$/.test(raw)) return;

        setLocalVal(raw); // Keep exactly what user types in state for smooth experience
        
        const num = parseFloat(raw);
        if (!isNaN(num)) {
            onChange(num);
        } else if (raw === '') {
            onChange(0);
        }
    };

    const handleBlur = () => {
        setFocused(false);
        // On blur, we let the useEffect re-format the valid number
    };

    const handleFocus = () => {
        setFocused(true);
        // On focus, remove commas for easy editing
        const raw = localVal.replace(/,/g, '');
        setLocalVal(raw);
    };

    return (
         <div className={`relative bg-white rounded-xl border-2 transition-all duration-200 ${focused ? 'border-accent shadow-[0_0_0_4px_rgba(225,29,72,0.1)]' : 'border-border hover:border-border-hover'} p-4 group`}>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2 group-hover:text-primary transition-colors">
                Purchase Price (Global)
            </label>
            <div className="flex items-baseline">
                <span className={`text-2xl font-bold mr-2 transition-colors ${focused ? 'text-accent' : 'text-muted'}`}>$</span>
                <input 
                    type="text" 
                    value={localVal}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    className="w-full bg-transparent border-none p-0 text-3xl font-bold text-primary focus:ring-0 placeholder-muted/30"
                    placeholder="0"
                />
            </div>
             <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                 <div className="p-1.5 bg-surface-subtle rounded-md text-[10px] font-semibold text-secondary border border-border uppercase tracking-wide">
                     Edit Value
                 </div>
             </div>
        </div>
    );
};

const FloatingLabelInput: React.FC<{ label: string; value: number; onChange: (val: number) => void; type?: 'currency' | 'percent' | 'number' | 'years' | 'months'; step?: number; disabled?: boolean }> = ({ label, value, onChange, type = 'number', step, disabled = false }) => {
    const prefix = type === 'currency' ? '$' : '';
    const suffix = type === 'percent' ? '%' : type === 'years' ? ' yrs' : type === 'months' ? ' mo' : '';
    
    return (
        <div className={`relative bg-surface-subtle rounded-lg border border-border transition-all ${disabled ? 'opacity-70 cursor-not-allowed' : 'focus-within:border-accent focus-within:ring-1 focus-within:ring-accent'}`}>
            <label className="absolute top-1 left-3 text-[10px] font-semibold text-secondary uppercase">{label}</label>
            <div className="flex items-center px-3 pt-4 pb-1">
                {prefix && <span className="text-sm text-muted mr-1">{prefix}</span>}
                <input 
                    type="number" 
                    step={step || 'any'}
                    value={value}
                    disabled={disabled}
                    onChange={e => onChange(parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent border-none p-0 text-sm font-bold text-primary focus:ring-0 placeholder-muted/50"
                />
                {suffix && <span className="text-sm text-muted ml-1">{suffix}</span>}
            </div>
        </div>
    );
};

const CapitalStackBar: React.FC<{ equity: number; debt: number; total: number }> = ({ equity, debt, total }) => {
    const debtPct = total > 0 ? (debt / total) * 100 : 0;
    const equityPct = total > 0 ? (equity / total) * 100 : 0;

    return (
        <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-secondary">
                <span>Capital Stack</span>
                <span>{fmt(total)} Total Uses</span>
            </div>
            <div className="flex h-8 rounded-lg overflow-hidden w-full bg-surface-subtle">
                {total > 0 ? (
                    <>
                        <div style={{ width: `${debtPct}%` }} className="bg-primary flex items-center justify-center text-[10px] font-bold text-white relative group transition-all duration-500">
                            {debtPct > 10 && <span className="z-10 truncate px-1">Debt {debtPct.toFixed(0)}%</span>}
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                        <div style={{ width: `${equityPct}%` }} className="bg-accent flex items-center justify-center text-[10px] font-bold text-white relative group transition-all duration-500">
                            {equityPct > 10 && <span className="z-10 truncate px-1">Equity {equityPct.toFixed(0)}%</span>}
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                    </>
                ) : <div className="w-full h-full flex items-center justify-center text-xs text-muted">No Data</div>}
            </div>
            <div className="flex justify-between text-xs">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="text-primary font-medium">Loan: {fmt(debt)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-accent"></div>
                    <span className="text-primary font-medium">Equity: {fmt(equity)}</span>
                </div>
            </div>
        </div>
    );
};

const FinancingCalculator: React.FC = () => {
    const { currentPortfolio, financingScenario, setFinancingScenario, setGlobalPortfolioPrice } = useAppStore(state => ({
        currentPortfolio: state.currentPortfolio,
        financingScenario: state.financingScenario,
        setFinancingScenario: state.setFinancingScenario,
        setGlobalPortfolioPrice: state.setGlobalPortfolioPrice,
    }));

    const loanCalcs = useMemo(() => {
        if (!currentPortfolio) return null;
        return runDebtSizingEngine(financingScenario, currentPortfolio);
    }, [financingScenario, currentPortfolio]);

    const handleParamChange = (field: keyof FinancingScenario, value: any) => {
        setFinancingScenario({ [field]: value });
    };
    
    const handleCostChange = (field: keyof typeof financingScenario.costs, value: number) => {
        setFinancingScenario({ costs: { ...financingScenario.costs, [field]: value } });
    };

    if (!currentPortfolio) return <div>Loading...</div>;

    return (
        <div className="animate-fade-in space-y-8 pb-10">
            <header>
                <h2 className="text-2xl font-bold text-primary">Capital Markets & Financing</h2>
                <p className="text-secondary text-sm mt-1">Structure debt, analyze leverage, and calculate returns on equity.</p>
            </header>

            {/* Dominant Top Row: 3 Key Aspect Squares */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Valuation Square */}
                <SectionCard title="1. Valuation" className="bg-white h-full border-t-4 border-t-primary">
                    <div className="space-y-6">
                        <PriceInput 
                            value={currentPortfolio.valuation?.askingPrice || 0} 
                            onChange={setGlobalPortfolioPrice} 
                        />
                        
                        <div className="grid grid-cols-2 gap-4 p-4 bg-surface-subtle rounded-xl border border-border">
                            <div>
                                <div className="text-xs text-secondary uppercase">Entry Cap</div>
                                <div className="text-lg font-bold text-primary">{fmtPct(currentPortfolio.current?.capRate)}</div>
                            </div>
                            <div>
                                <div className="text-xs text-secondary uppercase">Stabilized Cap</div>
                                <div className="text-lg font-bold text-success">{fmtPct(currentPortfolio.stabilized?.capRate)}</div>
                            </div>
                        </div>
                    </div>
                </SectionCard>

                {/* 2. Loan Structure Square */}
                <SectionCard title="2. Loan Structure" className="bg-white h-full border-t-4 border-t-accent">
                     <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                             <div className="col-span-2">
                                <div className="bg-surface-subtle p-2 rounded-lg border border-border mb-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-medium text-secondary">Target LTV</span>
                                        <span className="text-sm font-bold text-primary">{financingScenario.targetLTV}%</span>
                                    </div>
                                    <input 
                                        type="range" min={10} max={85} step={1} 
                                        value={financingScenario.targetLTV} 
                                        onChange={(e) => handleParamChange('targetLTV', parseFloat(e.target.value))}
                                        className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
                                    />
                                </div>
                             </div>
                             <FloatingLabelInput label="Interest Rate" value={financingScenario.interestRate} onChange={v => handleParamChange('interestRate', v)} type="percent" step={0.125} />
                             <FloatingLabelInput label="Amortization" value={financingScenario.amortizationYears} onChange={v => handleParamChange('amortizationYears', v)} type="years" />
                             <FloatingLabelInput label="Loan Term" value={financingScenario.termYears} onChange={v => handleParamChange('termYears', v)} type="years" />
                             <FloatingLabelInput label="I/O Period" value={financingScenario.ioPeriodMonths} onChange={v => handleParamChange('ioPeriodMonths', v)} type="months" />
                             <div className="col-span-2">
                                 <FloatingLabelInput label="Min DSCR Constraint" value={financingScenario.targetDSCR} onChange={v => handleParamChange('targetDSCR', v)} step={0.05} />
                             </div>
                        </div>
                    </div>
                </SectionCard>

                {/* 3. Closing Costs Square */}
                <SectionCard 
                    title="3. Closing Costs" 
                    className="bg-white h-full border-t-4 border-t-secondary"
                    action={<span className="text-xs font-bold text-primary bg-surface-subtle px-2 py-1 rounded border border-border">Total: {fmt(loanCalcs?.totalClosingCosts || 0)}</span>}
                >
                    <div className="space-y-3">
                         <div className="grid grid-cols-2 gap-3">
                            <FloatingLabelInput label="Origination %" value={financingScenario.costs.origination} onChange={v => handleCostChange('origination', v)} type="percent" step={0.1} />
                            <FloatingLabelInput label="Mortgage Fees" value={financingScenario.costs.mortgageFees} onChange={v => handleCostChange('mortgageFees', v)} type="currency" />
                            <FloatingLabelInput label="Legal" value={financingScenario.costs.legal} onChange={v => handleCostChange('legal', v)} type="currency" />
                            <FloatingLabelInput label="Title" value={financingScenario.costs.title} onChange={v => handleCostChange('title', v)} type="currency" />
                            <FloatingLabelInput label="Inspection" value={financingScenario.costs.inspection} onChange={v => handleCostChange('inspection', v)} type="currency" />
                            <FloatingLabelInput label="Appraisal" value={financingScenario.costs.appraisal} onChange={v => handleCostChange('appraisal', v)} type="currency" />
                            <FloatingLabelInput label="Acq. Fee" value={financingScenario.costs.acquisitionFee} onChange={v => handleCostChange('acquisitionFee', v)} type="currency" />
                            <FloatingLabelInput label="Reserves" value={financingScenario.costs.reserves} onChange={v => handleCostChange('reserves', v)} type="currency" />
                        </div>
                    </div>
                </SectionCard>

            </div>

            {/* Bottom Analysis Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Sources & Uses / Capital Stack */}
                <div className="lg:col-span-8">
                    <SectionCard title="Sources & Uses Analysis" className="h-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full">
                            <div className="space-y-4 text-sm">
                                <div className="flex justify-between py-2 border-b border-border-subtle">
                                    <span className="text-secondary">Purchase Price</span>
                                    <span className="font-medium text-primary">{fmt(loanCalcs?.totalCost - (loanCalcs?.totalClosingCosts || 0))}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-border-subtle">
                                    <span className="text-secondary">Closing Costs</span>
                                    <span className="font-medium text-primary">{fmt(loanCalcs?.totalClosingCosts)}</span>
                                </div>
                                <div className="flex justify-between py-2 text-primary font-bold bg-surface-subtle px-2 -mx-2 rounded">
                                    <span>Total Project Cost</span>
                                    <span>{fmt(loanCalcs?.totalCost)}</span>
                                </div>
                            </div>
                            <div className="bg-surface-subtle p-6 rounded-xl border border-border">
                                <CapitalStackBar 
                                    equity={loanCalcs?.equityRequired || 0} 
                                    debt={loanCalcs?.effectiveLoanAmount || 0} 
                                    total={loanCalcs?.totalCost || 0} 
                                />
                                <div className="mt-6 grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <div className="text-xs text-secondary uppercase tracking-wider">Loan-to-Cost</div>
                                        <div className="text-xl font-bold text-primary">{fmtPct(loanCalcs?.loanToCost)}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-secondary uppercase tracking-wider">Levered Yield</div>
                                        <div className="text-xl font-bold text-success">{fmtPct(loanCalcs?.cashOnCashReturn)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SectionCard>
                </div>

                {/* Debt Service & Ratios */}
                <div className="lg:col-span-4">
                    <div className="space-y-6 h-full flex flex-col">
                         <SectionCard title="Debt Service Obligation" className="flex-1">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-primary/5 rounded-full text-primary"><Calculator className="w-6 h-6" /></div>
                                <div>
                                    <div className="text-2xl font-bold text-primary">{fmt(loanCalcs?.monthlyPAndIPayment)}</div>
                                    <div className="text-xs text-secondary">Monthly P&I Payment</div>
                                </div>
                            </div>
                             {financingScenario.ioPeriodMonths > 0 && (
                                <div className="flex items-center justify-between p-3 bg-accent/5 border border-accent/10 rounded-lg mb-4">
                                    <span className="text-sm font-medium text-accent">Interest Only Phase</span>
                                    <span className="text-sm font-bold text-accent">{fmt(loanCalcs?.monthlyIOPayment)} / mo</span>
                                </div>
                            )}
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-secondary">Annual Debt Service</span>
                                    <span className="font-medium">{fmt(loanCalcs?.annualDebtService)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-secondary">Balloon Payment (Yr {financingScenario.termYears})</span>
                                    <span className="font-medium">{fmt(loanCalcs?.balloonPayment)}</span>
                                </div>
                            </div>
                        </SectionCard>

                        <SectionCard title="Coverage Ratios">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="p-4 rounded-lg bg-surface-subtle border border-border text-center">
                                    <div className={`text-2xl font-bold ${loanCalcs?.dscrStabilized >= 1.25 ? 'text-success' : 'text-warning'}`}>
                                        {loanCalcs?.dscrStabilized.toFixed(2)}x
                                    </div>
                                    <div className="text-xs text-secondary mt-1">DSCR (Stabilized)</div>
                                </div>
                                <div className="p-4 rounded-lg bg-surface-subtle border border-border text-center">
                                    <div className={`text-2xl font-bold ${loanCalcs?.dscrCurrent >= 1.0 ? 'text-primary' : 'text-danger'}`}>
                                        {loanCalcs?.dscrCurrent.toFixed(2)}x
                                    </div>
                                    <div className="text-xs text-secondary mt-1">DSCR (Current)</div>
                                </div>
                            </div>
                        </SectionCard>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default FinancingCalculator;
