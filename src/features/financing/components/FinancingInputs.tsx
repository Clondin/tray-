
import React from 'react';
import { useAppStore } from '../../../store/appStore';
import type { FinancingScenario } from '../../../types';
import { fmt } from '../../../utils/formatters';
import { SectionCard } from '../../../components/common/SectionCard';

// Helper component for the "Box" style inputs seen in the requested design
const BoxInput: React.FC<{
    label: string;
    value: number;
    onChange: (val: number) => void;
    unit?: string;
    step?: number;
    min?: number;
    max?: number;
    disabled?: boolean;
}> = ({ label, value, onChange, unit, step = 1, min, max, disabled }) => (
    <div className={`bg-surface-subtle rounded-lg px-4 py-3 border border-border hover:border-accent/50 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/20 transition-all ${disabled ? 'opacity-60' : ''}`}>
        <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">{label}</label>
        <div className="flex items-baseline justify-between">
            <input 
                type="number"
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                step={step}
                min={min}
                max={max}
                disabled={disabled}
                className="bg-transparent border-none p-0 text-lg font-bold text-primary focus:ring-0 w-full"
            />
            {unit && <span className="text-sm font-medium text-muted ml-2">{unit}</span>}
        </div>
    </div>
);

// Specific Slider component for the LTV bar
const LtvSlider: React.FC<{ value: number, onChange: (val: number) => void, disabled?: boolean }> = ({ value, onChange, disabled }) => (
    <div className={`bg-surface-subtle rounded-xl p-4 border border-border ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-bold text-secondary">Target LTV</label>
            <span className="text-lg font-bold text-primary">{value.toFixed(0)}%</span>
        </div>
        <input 
            type="range" 
            min="50" 
            max="90" 
            step="5" 
            value={value} 
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-accent"
        />
    </div>
);

// Standard financing input for the Right Column (Closing Costs) reuse
const FinanceInput: React.FC<{
    label: string;
    value: string | number;
    onChange?: (val: any) => void;
    prefix?: string;
    suffix?: string;
    calculatedValueDisplay?: string;
    disabled?: boolean;
}> = ({ label, value, onChange, prefix, suffix, calculatedValueDisplay, disabled }) => (
    <div>
        <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">{label}</label>
        <div className="relative">
            {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs">{prefix}</span>}
            <input
                type="text"
                value={value}
                onChange={e => onChange && onChange(e.target.value)}
                disabled={disabled || !!calculatedValueDisplay}
                className={`
                    form-input w-full text-sm font-medium 
                    ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-8' : ''} 
                    ${disabled || calculatedValueDisplay ? 'bg-surface-subtle cursor-not-allowed text-muted' : ''}
                `}
            />
            {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-xs">{suffix}</span>}
            
            {calculatedValueDisplay && (
                <div className="absolute inset-0 bg-surface-subtle border border-border rounded-lg flex items-center justify-between px-3 text-sm text-primary font-semibold cursor-not-allowed">
                    <span>{value}</span>
                    <span className="text-[10px] uppercase tracking-wider text-accent font-bold">{calculatedValueDisplay}</span>
                </div>
            )}
        </div>
    </div>
);

const FinancingInputs: React.FC<{ loanCalcs: any }> = ({ loanCalcs }) => {
    const { financingScenario, setFinancingScenario } = useAppStore(state => ({
        financingScenario: state.financingScenario,
        setFinancingScenario: state.setFinancingScenario,
    }));

    const handleInputChange = (key: keyof FinancingScenario, value: any) => {
        setFinancingScenario({ [key]: value });
    };

    const handleCostChange = (key: keyof FinancingScenario['costs'], value: number) => {
        setFinancingScenario({ costs: { ...financingScenario.costs, [key]: value }});
    };
    
    const isManualSizing = financingScenario.sizingMethod === 'manual';
    const isLtvActive = financingScenario.sizingMethod === 'ltv' || financingScenario.sizingMethod === 'lower_dscr_ltv';

    // Calculated values from the debt engine
    const calcAcqFee = loanCalcs?.calculatedCosts?.acquisitionFee;
    const calcReserves = loanCalcs?.calculatedCosts?.reserves;
    const calcEscrows = loanCalcs?.calculatedCosts?.escrows;
    const calcOriginationDollar = loanCalcs?.calculatedCosts?.originationFee;

    return (
        <>
            {/* Left Column: Loan Structure - Designed to match the specific user request */}
            <SectionCard title="2. Loan Structure" className="bg-white h-full border-t-4 border-t-accent">
                <div className="space-y-6">
                    
                    {/* Sizing Method Selector - Kept simple at top */}
                    <div>
                        <select 
                            value={financingScenario.sizingMethod} 
                            onChange={e => handleInputChange('sizingMethod', e.target.value)} 
                            className="form-select w-full text-sm font-medium border-border bg-surface-subtle"
                        >
                            <option value="lower_dscr_ltv">Strategy: Lower of DSCR & LTV</option>
                            <option value="dscr">Strategy: DSCR Only</option>
                            <option value="ltv">Strategy: LTV Only</option>
                            <option value="manual">Strategy: Manual Entry</option>
                        </select>
                    </div>

                    {/* Target LTV Slider - Prominent */}
                    <LtvSlider 
                        value={financingScenario.targetLTV} 
                        onChange={v => handleInputChange('targetLTV', v)}
                        disabled={isManualSizing}
                    />

                    {/* 2x2 Grid for Core Terms */}
                    <div className="grid grid-cols-2 gap-4">
                        <BoxInput 
                            label="Interest Rate" 
                            value={financingScenario.interestRate} 
                            onChange={v => handleInputChange('interestRate', v)}
                            unit="%"
                            step={0.125}
                        />
                        <BoxInput 
                            label="Amortization" 
                            value={financingScenario.amortizationYears} 
                            onChange={v => handleInputChange('amortizationYears', v)}
                            unit="yrs"
                        />
                        <BoxInput 
                            label="Loan Term" 
                            value={financingScenario.termYears} 
                            onChange={v => handleInputChange('termYears', v)}
                            unit="yrs"
                        />
                        <BoxInput 
                            label="I/O Period" 
                            value={financingScenario.ioPeriodMonths} 
                            onChange={v => handleInputChange('ioPeriodMonths', v)}
                            unit="mo"
                        />
                    </div>

                    {/* DSCR Constraint - Full Width Bottom */}
                    <div className={`bg-surface-subtle rounded-lg px-4 py-3 border border-border ${isManualSizing ? 'opacity-50' : ''}`}>
                        <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Min DSCR Constraint</label>
                        <input 
                            type="number"
                            value={financingScenario.targetDSCR}
                            onChange={(e) => handleInputChange('targetDSCR', parseFloat(e.target.value) || 0)}
                            step={0.05}
                            disabled={isManualSizing}
                            className="bg-transparent border-none p-0 text-lg font-bold text-primary focus:ring-0 w-full"
                        />
                    </div>

                    {/* Manual Loan Amount (Only shows if Manual mode selected) */}
                    {isManualSizing && (
                        <div className="bg-accent/5 border border-accent/20 rounded-lg px-4 py-3 animate-fade-in">
                            <label className="block text-[10px] font-bold text-accent uppercase tracking-wider mb-1">Manual Loan Amount</label>
                            <div className="flex items-center">
                                <span className="text-lg font-bold text-accent mr-1">$</span>
                                <input 
                                    type="number"
                                    value={financingScenario.manualLoanAmount}
                                    onChange={(e) => handleInputChange('manualLoanAmount', parseFloat(e.target.value) || 0)}
                                    className="bg-transparent border-none p-0 text-lg font-bold text-accent focus:ring-0 w-full"
                                />
                            </div>
                        </div>
                    )}

                </div>
            </SectionCard>

            {/* Right Column: Closing Costs (Preserved new logic) */}
            <SectionCard 
                title="3. Closing Costs" 
                action={<span className="text-xs font-bold text-primary bg-surface-subtle px-2 py-1 rounded border border-border">Total: {fmt(loanCalcs?.totalClosingCosts || 0)}</span>}
                className="bg-white h-full border-t-4 border-t-secondary"
            >
                <div className="space-y-4">
                    {/* Lender Fees */}
                    <div>
                         <h4 className="text-[10px] font-bold text-secondary border-b border-border-subtle pb-1 mb-3 uppercase">Financing Fees</h4>
                         <div className="grid grid-cols-2 gap-3">
                            {/* Origination */}
                            <div>
                                <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">Origination</label>
                                <div className="relative flex items-center">
                                    <input
                                        type="number"
                                        step={0.25}
                                        value={financingScenario.costs.origination}
                                        onChange={e => handleCostChange('origination', parseFloat(e.target.value))}
                                        className="form-input w-16 text-sm font-medium pr-1 mr-2"
                                    />
                                    <span className="text-xs text-muted mr-2">%</span>
                                    <span className="text-sm font-bold text-primary bg-surface-subtle px-2 py-1 rounded flex-1 text-right border border-border truncate">
                                        {fmt(calcOriginationDollar)}
                                    </span>
                                </div>
                            </div>
                             <FinanceInput 
                                label="Mortgage Fees" 
                                value={financingScenario.costs.mortgageFees} 
                                onChange={v => handleCostChange('mortgageFees', parseFloat(v))} 
                                prefix="$" 
                            />
                        </div>
                    </div>

                    {/* Deal Level Costs */}
                    <div>
                        <h4 className="text-[10px] font-bold text-secondary border-b border-border-subtle pb-1 mb-3 uppercase">Deal Costs (Fixed)</h4>
                        <div className="grid grid-cols-2 gap-3">
                             <FinanceInput 
                                label="Acquisition Fee" 
                                value={fmt(calcAcqFee)} 
                                calculatedValueDisplay="1.0% of PP"
                            />
                             <FinanceInput 
                                label="Reserves" 
                                value={fmt(calcReserves)} 
                                calculatedValueDisplay="$1k/Unit"
                            />
                             <FinanceInput 
                                label="Escrows" 
                                value={fmt(calcEscrows)} 
                                calculatedValueDisplay="6 Mo Debt Svc"
                            />
                             <FinanceInput 
                                label="Other / Misc" 
                                value={financingScenario.costs.misc} 
                                onChange={v => handleCostChange('misc', parseFloat(v))} 
                                prefix="$" 
                            />
                        </div>
                    </div>

                    {/* Third Party */}
                    <div>
                        <h4 className="text-[10px] font-bold text-secondary border-b border-border-subtle pb-1 mb-3 uppercase">Third Party Reports</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <FinanceInput label="Legal" value={financingScenario.costs.legal} onChange={v => handleCostChange('legal', parseFloat(v))} prefix="$" />
                            <FinanceInput label="Title" value={financingScenario.costs.title} onChange={v => handleCostChange('title', parseFloat(v))} prefix="$" />
                            <FinanceInput label="Inspection" value={financingScenario.costs.inspection} onChange={v => handleCostChange('inspection', parseFloat(v))} prefix="$" />
                            <FinanceInput label="Appraisal" value={financingScenario.costs.appraisal} onChange={v => handleCostChange('appraisal', parseFloat(v))} prefix="$" />
                        </div>
                    </div>

                </div>
            </SectionCard>
        </>
    );
};

export default FinancingInputs;
