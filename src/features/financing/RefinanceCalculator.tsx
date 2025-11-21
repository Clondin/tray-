
import React, { useMemo, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { SectionCard } from '../../components/common/SectionCard';
import { fmt, fmtPct } from '../../utils/formatters';
import { calculateAnnualDebtConstant } from '../../utils/loanCalculations';
import { AlertTriangle, Check, TrendingUp, DollarSign, Calculator } from '../../components/icons';
import { runDebtSizingEngine } from '../../utils/loanCalculations';

const InputField: React.FC<{ 
    label: string, 
    value: number, 
    onChange: (val: number) => void, 
    type?: 'currency' | 'percent' | 'number',
    disabled?: boolean,
    step?: number
}> = ({ label, value, onChange, type = 'number', disabled, step }) => (
    <div>
        <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${disabled ? 'text-muted' : 'text-secondary'}`}>{label}</label>
        <div className="relative">
            {type === 'currency' && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>}
            <input 
                type="number" 
                value={value}
                step={step}
                disabled={disabled}
                onChange={e => onChange(parseFloat(e.target.value) || 0)}
                className={`w-full pl-${type === 'currency' ? '7' : '3'} pr-${type === 'percent' ? '7' : '3'} py-2 text-sm font-semibold rounded-lg border transition-all ${disabled ? 'bg-surface-subtle border-transparent text-muted' : 'bg-white border-border hover:border-border-hover focus:ring-2 focus:ring-accent/20 focus:border-accent text-primary'}`}
            />
            {type === 'percent' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">%</span>}
        </div>
    </div>
);

const TimelineSlider: React.FC<{ value: number, onChange: (val: number) => void, max: number }> = ({ value, onChange, max }) => {
    const year = Math.ceil(value / 12);
    
    return (
        <div className="space-y-3 pt-2">
            <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-secondary uppercase tracking-wider">Event Timing</span>
                <div className="text-right">
                    <span className="text-2xl font-bold text-accent">Month {value}</span>
                    <span className="text-sm text-muted ml-2">(Year {year})</span>
                </div>
            </div>
            <div className="relative h-8">
                {/* Track background */}
                <div className="absolute top-1/2 left-0 w-full h-2 bg-surface-subtle border border-border rounded-full -translate-y-1/2"></div>
                
                {/* Ticks */}
                <div className="absolute top-1/2 left-0 w-full h-full -translate-y-1/2 pointer-events-none px-2">
                    {[12, 36, 60, 84, 108].map((m) => {
                        const leftPct = ((m - 1) / (max - 1)) * 100;
                        return (
                            <div key={m} className="absolute top-1/2 w-px h-4 bg-border -translate-y-1/2" style={{ left: `${leftPct}%` }}>
                                <span className="absolute top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted">Yr {m/12}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Actual Slider */}
                <input 
                    type="range" 
                    min={1} 
                    max={max} 
                    step={1} 
                    value={value}
                    onChange={e => onChange(parseInt(e.target.value))}
                    className="absolute top-1/2 left-0 w-full h-full opacity-0 cursor-pointer -translate-y-1/2 z-10"
                />
                
                {/* Custom Thumb (Visual) - Approximate position */}
                <div 
                    className="absolute top-1/2 w-5 h-5 bg-white border-2 border-accent rounded-full shadow-md -translate-y-1/2 pointer-events-none transition-all"
                    style={{ left: `calc(${((value - 1) / (max - 1)) * 100}% - 10px)` }}
                ></div>
            </div>
        </div>
    );
};

const RefinanceCalculator: React.FC = () => {
    const { 
        refinanceScenario, 
        setRefinanceScenario, 
        currentPortfolio, 
        assumptions,
        financingScenario
    } = useAppStore(state => ({
        refinanceScenario: state.refinanceScenario,
        setRefinanceScenario: state.setRefinanceScenario,
        currentPortfolio: state.currentPortfolio,
        assumptions: state.assumptions,
        financingScenario: state.financingScenario
    }));

    const [activeTab, setActiveTab] = useState<'params' | 'costs'>('params');

    const toggleRefi = () => setRefinanceScenario({ enabled: !refinanceScenario.enabled });

    const handleCostChange = (field: keyof typeof refinanceScenario.costs, value: number) => {
        setRefinanceScenario({ costs: { ...refinanceScenario.costs, [field]: value } });
    };

    // --- Calculate Projected Metrics for Refi Year ---
    const projectedMetrics = useMemo(() => {
        if (!currentPortfolio) return null;

        // Get base Loan Calc for payoff info
        const baseLoan = runDebtSizingEngine(financingScenario, currentPortfolio);
        if (!baseLoan) return null;

        const refiYear = Math.ceil(refinanceScenario.refinanceMonth / 12);
        
        // Project NOI - Align with Investor Returns Logic
        // Year 1 uses Current, Year 2+ uses Stabilized
        const rentGrowthRate = (assumptions.rentGrowth || 0) / 100;
        const opexGrowthRate = (assumptions.opexGrowth || 0) / 100;
        
        let baseGRI = 0;
        let baseOpEx = 0;

        if (refiYear === 1) {
             baseGRI = currentPortfolio.current?.gri || 0;
             baseOpEx = currentPortfolio.current?.opex || 0;
        } else {
             baseGRI = currentPortfolio.stabilized?.gri || 0;
             baseOpEx = currentPortfolio.stabilized?.opex || 0;
        }

        const projectedGRI = baseGRI * Math.pow(1 + rentGrowthRate, refiYear - 1);
        const projectedOpEx = baseOpEx * Math.pow(1 + opexGrowthRate, refiYear - 1);
        const projectedNOI = projectedGRI - projectedOpEx;
        
        // Project Value
        const projectedValue = projectedNOI / (refinanceScenario.valuationCapRate / 100);
        
        // Size New Loan
        const maxLoanLTV = projectedValue * (refinanceScenario.maxLTV / 100);
        const refiConstant = calculateAnnualDebtConstant(refinanceScenario.interestRate, refinanceScenario.amortizationYears);
        const maxLoanDSCR = refiConstant > 0 ? projectedNOI / (refinanceScenario.minDSCR * refiConstant) : 0;
        
        const newLoanAmount = Math.min(maxLoanLTV, maxLoanDSCR);
        
        // Payoff Logic
        let balance = baseLoan.effectiveLoanAmount;
        const monthlyRate = financingScenario.interestRate / 100 / 12;
        const monthlyPmt = baseLoan.monthlyPAndIPayment;
        
        for(let m=1; m <= refinanceScenario.refinanceMonth; m++) {
            const interest = balance * monthlyRate;
            let principal = 0;
            if (m > financingScenario.ioPeriodMonths) {
                principal = monthlyPmt - interest;
            }
            balance -= principal;
        }
        const payoffAmount = balance;

        // Calculate Costs
        const refiCosts = refinanceScenario.costs;
        const originationAmt = newLoanAmount * (refiCosts.origination / 100);
        const totalRefiCosts = originationAmt + refiCosts.legal + refiCosts.title + refiCosts.appraisal + refiCosts.mortgageFees + refiCosts.reserves + refiCosts.thirdParty + refiCosts.misc;

        const netProceeds = newLoanAmount - payoffAmount - totalRefiCosts;
        
        // New Payment
        const newMonthlyRate = refinanceScenario.interestRate / 100 / 12;
        const newNumPmts = refinanceScenario.amortizationYears * 12;
        const newFactor = (newMonthlyRate * Math.pow(1 + newMonthlyRate, newNumPmts)) / (Math.pow(1 + newMonthlyRate, newNumPmts) - 1);
        const newMonthlyPayment = newLoanAmount * newFactor;

        return {
            refiYear,
            projectedNOI,
            projectedValue,
            newLoanAmount,
            payoffAmount,
            netProceeds,
            newMonthlyPayment,
            newDSCR: projectedNOI / (newMonthlyPayment * 12),
            isCashOut: netProceeds > 0,
            totalRefiCosts,
            originationAmt
        };

    }, [currentPortfolio, refinanceScenario, assumptions, financingScenario]);

    if (!currentPortfolio) return <div>Loading...</div>;

    return (
        <div className="space-y-6 animate-fade-in">
             {/* Header Toggle */}
            <div 
                onClick={toggleRefi}
                className={`
                    flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all
                    ${refinanceScenario.enabled 
                        ? 'bg-white border-accent shadow-md' 
                        : 'bg-surface-subtle border-border hover:border-secondary/30'}
                `}
            >
                <div className="flex items-center gap-4">
                    <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center transition-colors
                        ${refinanceScenario.enabled ? 'bg-accent text-white' : 'bg-gray-200 text-gray-400'}
                    `}>
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold ${refinanceScenario.enabled ? 'text-primary' : 'text-muted'}`}>Refinance Strategy</h3>
                        <p className="text-xs text-secondary">
                            {refinanceScenario.enabled 
                                ? `Active: Refinancing in Month ${refinanceScenario.refinanceMonth} (Year ${Math.ceil(refinanceScenario.refinanceMonth/12)})` 
                                : "Click to enable a future refinance event"}
                        </p>
                    </div>
                </div>
                <div className={`
                    w-14 h-8 rounded-full p-1 transition-colors flex items-center
                    ${refinanceScenario.enabled ? 'bg-accent justify-end' : 'bg-gray-300 justify-start'}
                `}>
                    <div className="w-6 h-6 bg-white rounded-full shadow-sm"></div>
                </div>
            </div>

            {refinanceScenario.enabled && projectedMetrics && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-up">
                    
                    {/* Left: Inputs */}
                    <SectionCard 
                        title={
                            <div className="flex gap-2">
                                <button onClick={() => setActiveTab('params')} className={`text-sm font-bold ${activeTab === 'params' ? 'text-primary border-b-2 border-accent' : 'text-muted hover:text-secondary'}`}>Parameters</button>
                                <span className="text-border">|</span>
                                <button onClick={() => setActiveTab('costs')} className={`text-sm font-bold ${activeTab === 'costs' ? 'text-primary border-b-2 border-accent' : 'text-muted hover:text-secondary'}`}>Closing Costs</button>
                            </div>
                        }
                        action={activeTab === 'costs' && <span className="text-xs font-bold bg-surface-subtle px-2 py-1 rounded text-primary">{fmt(projectedMetrics.totalRefiCosts)}</span>}
                    >
                        {activeTab === 'params' ? (
                            <div className="space-y-8">
                                <TimelineSlider 
                                    value={refinanceScenario.refinanceMonth} 
                                    onChange={v => setRefinanceScenario({ refinanceMonth: v })} 
                                    max={120}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Interest Rate" value={refinanceScenario.interestRate} onChange={v => setRefinanceScenario({ interestRate: v })} type="percent" step={0.125} />
                                    <InputField label="Amortization" value={refinanceScenario.amortizationYears} onChange={v => setRefinanceScenario({ amortizationYears: v })} type="number" />
                                    <InputField label="Max LTV" value={refinanceScenario.maxLTV} onChange={v => setRefinanceScenario({ maxLTV: v })} type="percent" />
                                    <InputField label="Min DSCR" value={refinanceScenario.minDSCR} onChange={v => setRefinanceScenario({ minDSCR: v })} type="number" step={0.05} />
                                    <div className="col-span-2">
                                        <InputField label="Valuation Cap Rate" value={refinanceScenario.valuationCapRate} onChange={v => setRefinanceScenario({ valuationCapRate: v })} type="percent" step={0.1} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-3 bg-surface-subtle rounded-lg border border-border flex justify-between items-center">
                                    <div>
                                        <div className="text-[10px] font-bold text-secondary uppercase">Origination Fee</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <input 
                                                type="number" 
                                                value={refinanceScenario.costs.origination}
                                                onChange={e => handleCostChange('origination', parseFloat(e.target.value) || 0)}
                                                className="w-16 py-1 px-2 text-sm font-bold border border-border rounded focus:ring-1 focus:ring-accent"
                                                step={0.1}
                                            />
                                            <span className="text-sm text-muted">%</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-primary">{fmt(projectedMetrics.originationAmt)}</div>
                                        <div className="text-[10px] text-muted">of New Loan</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Legal" value={refinanceScenario.costs.legal} onChange={v => handleCostChange('legal', v)} type="currency" />
                                    <InputField label="Title" value={refinanceScenario.costs.title} onChange={v => handleCostChange('title', v)} type="currency" />
                                    <InputField label="Appraisal" value={refinanceScenario.costs.appraisal} onChange={v => handleCostChange('appraisal', v)} type="currency" />
                                    <InputField label="Mortgage Fees" value={refinanceScenario.costs.mortgageFees} onChange={v => handleCostChange('mortgageFees', v)} type="currency" />
                                    <InputField label="Reserves" value={refinanceScenario.costs.reserves} onChange={v => handleCostChange('reserves', v)} type="currency" />
                                    <InputField label="Third Party" value={refinanceScenario.costs.thirdParty} onChange={v => handleCostChange('thirdParty', v)} type="currency" />
                                    <div className="col-span-2">
                                        <InputField label="Misc / Other" value={refinanceScenario.costs.misc} onChange={v => handleCostChange('misc', v)} type="currency" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </SectionCard>

                    {/* Right: Results */}
                    <div className="space-y-6">
                        <SectionCard title="Projected Refinance Outcome">
                            <div className="space-y-4">
                                 {/* Top Line Result */}
                                <div className={`p-5 rounded-xl border flex items-center gap-4 ${projectedMetrics.isCashOut ? 'bg-success-light/30 border-success-light' : 'bg-warning-light/30 border-warning-light'}`}>
                                    <div className={`p-3 rounded-full ${projectedMetrics.isCashOut ? 'bg-success text-white' : 'bg-warning text-white'}`}>
                                        <DollarSign className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold uppercase tracking-wider text-secondary">
                                            {projectedMetrics.isCashOut ? "Net Cash Out Proceeds" : "Capital Call Required"}
                                        </div>
                                        <div className={`text-2xl font-bold ${projectedMetrics.isCashOut ? 'text-success-dark' : 'text-warning-dark'}`}>
                                            {fmt(projectedMetrics.netProceeds)}
                                        </div>
                                        <div className="text-xs text-muted">
                                            Distributed to investors in Year {projectedMetrics.refiYear}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-white border border-border rounded-lg">
                                        <div className="text-xs text-secondary mb-1">New Loan Amount</div>
                                        <div className="text-lg font-bold text-primary">{fmt(projectedMetrics.newLoanAmount)}</div>
                                        <div className="text-xs text-muted mt-1">
                                            vs Payoff: {fmt(projectedMetrics.payoffAmount)}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-white border border-border rounded-lg">
                                        <div className="text-xs text-secondary mb-1">Valuation at Refi</div>
                                        <div className="text-lg font-bold text-primary">{fmt(projectedMetrics.projectedValue)}</div>
                                        <div className="text-xs text-muted mt-1">
                                            NOI: {fmt(projectedMetrics.projectedNOI)}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-white border border-border rounded-lg">
                                        <div className="text-xs text-secondary mb-1">New Monthly Payment</div>
                                        <div className="text-lg font-bold text-primary">{fmt(projectedMetrics.newMonthlyPayment)}</div>
                                    </div>
                                    <div className="p-4 bg-white border border-border rounded-lg">
                                        <div className="text-xs text-secondary mb-1">New DSCR</div>
                                        <div className={`text-lg font-bold ${projectedMetrics.newDSCR >= 1.25 ? 'text-success' : 'text-warning'}`}>
                                            {projectedMetrics.newDSCR.toFixed(2)}x
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </SectionCard>

                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-800 leading-relaxed flex gap-2">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <div>
                                <strong>Impact on Returns:</strong> Enabling this strategy will update the Investor Returns waterfall. 
                                The <strong>Net Proceeds</strong> will be treated as a capital event in Year {projectedMetrics.refiYear}, 
                                and debt service for subsequent years will adjust to <strong>{fmt(projectedMetrics.newMonthlyPayment * 12)}/yr</strong>.
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RefinanceCalculator;
