
import React from 'react';
import { useAppStore } from '../../../store/appStore';
import type { FinancingScenario } from '../../../types';
import { fmt } from '../../../utils/formatters';

interface InputProps<T> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  type?: 'number' | 'select';
  prefix?: string;
  suffix?: string;
  options?: { value: string | number; label: string }[];
  step?: number;
  disabled?: boolean;
}

function FinanceInput<T extends string | number>({ label, value, onChange, type = 'number', prefix, suffix, options, step, disabled }: InputProps<T>) {
    return (
        <div>
            <label className="block text-small font-medium text-text-secondary mb-1.5">{label}</label>
            <div className="relative">
                {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-small">{prefix}</span>}
                 {type === 'number' ? (
                    <input
                        type="number"
                        value={value}
                        step={step || 'any'}
                        onChange={e => onChange(parseFloat(e.target.value) as T)}
                        disabled={disabled}
                        className={`form-input w-full text-body ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-8' : ''} ${disabled ? 'bg-bg-surface-soft cursor-not-allowed' : ''}`}
                    />
                 ) : (
                    <select
                        value={value}
                        onChange={e => onChange(e.target.value as T)}
                        disabled={disabled}
                        className="form-select w-full"
                    >
                        {options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                 )}
                {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-small">{suffix}</span>}
            </div>
        </div>
    );
}

const InputSection: React.FC<{ title: string; children: React.ReactNode; rightElement?: React.ReactNode }> = ({ title, children, rightElement }) => (
    <div className="space-y-4">
        <div className="flex justify-between items-baseline">
            <h3 className="text-body font-semibold text-text-primary">{title}</h3>
            {rightElement}
        </div>
        <div className="p-4 bg-bg-surface rounded-lg border border-border-subtle space-y-4">
            {children}
        </div>
    </div>
);

const FinancingInputs: React.FC<{ activeTab: 'current' | 'stabilized', setActiveTab: (tab: 'current' | 'stabilized') => void }> = ({ activeTab, setActiveTab }) => {
    const { financingScenario, setFinancingScenario, assumptions, setAssumptions } = useAppStore(state => ({
        financingScenario: state.financingScenario,
        setFinancingScenario: state.setFinancingScenario,
        assumptions: state.assumptions,
        setAssumptions: state.setAssumptions
    }));

    const handleInputChange = (key: keyof FinancingScenario, value: any) => {
        setFinancingScenario({ [key]: value });
    };

    const handleCostChange = (key: keyof FinancingScenario['costs'], value: number) => {
        setFinancingScenario({ costs: { ...financingScenario.costs, [key]: value }});
    };
    
    const isManualSizing = financingScenario.sizingMethod === 'manual';

    // Calculate total closing costs (excluding origination for raw sum display)
    const rawClosingSum = 
        (financingScenario.costs.legal || 0) +
        (financingScenario.costs.title || 0) +
        (financingScenario.costs.inspection || 0) +
        (financingScenario.costs.appraisal || 0) +
        (financingScenario.costs.mortgageFees || 0) +
        (financingScenario.costs.acquisitionFee || 0) +
        (financingScenario.costs.reserves || 0) +
        (financingScenario.costs.thirdParty || 0) +
        (financingScenario.costs.misc || 0);

    return (
        <div className="space-y-8">
            {/* Main Loan Inputs */}
            <div className="space-y-6">
                <InputSection title="Loan Sizing Strategy">
                    <FinanceInput
                        label="Sizing Method"
                        type="select"
                        value={financingScenario.sizingMethod}
                        onChange={v => handleInputChange('sizingMethod', v)}
                        options={[
                            { value: 'lower_dscr_ltv', label: 'Lower of DSCR & LTV' },
                            { value: 'dscr', label: 'Size by DSCR' },
                            { value: 'ltv', label: 'Size by LTV' },
                            { value: 'manual', label: 'Manual Loan Amount' },
                        ]}
                    />
                    <div className="p-2 bg-accent-soft rounded-md text-center text-small text-accent-primary font-medium">
                        Sizing based on <span className="font-bold uppercase">{activeTab}</span> NOI
                    </div>
                    <FinanceInput label="Target DSCR" value={financingScenario.targetDSCR} onChange={v => handleInputChange('targetDSCR', v)} step={0.05} disabled={isManualSizing} />
                    <FinanceInput label="Target LTV" value={financingScenario.targetLTV} onChange={v => handleInputChange('targetLTV', v)} suffix="%" disabled={isManualSizing} />
                    <FinanceInput label="Loan Amount" value={financingScenario.manualLoanAmount} onChange={v => handleInputChange('manualLoanAmount', v)} prefix="$" disabled={!isManualSizing} />
                </InputSection>
                
                <InputSection title="Loan Structure">
                    <FinanceInput label="Interest Rate" value={financingScenario.interestRate} onChange={v => handleInputChange('interestRate', v)} suffix="%" step={0.125} />
                    <FinanceInput label="Interest-Only Period" value={financingScenario.ioPeriodMonths} onChange={v => handleInputChange('ioPeriodMonths', v)} suffix="months" />
                    <FinanceInput 
                        label="Amortization" 
                        type="select" 
                        value={financingScenario.amortizationYears} 
                        onChange={v => handleInputChange('amortizationYears', Number(v))}
                        options={[{value: 20, label: '20 Years'}, {value: 25, label: '25 Years'}, {value: 30, label: '30 Years'}]}
                    />
                    <FinanceInput 
                        label="Term"
                        type="select"
                        value={financingScenario.termYears}
                        onChange={v => handleInputChange('termYears', Number(v))}
                        options={[{value: 3, label: '3 Years'}, {value: 5, label: '5 Years'}, {value: 7, label: '7 Years'}, {value: 10, label: '10 Years'}]}
                    />
                </InputSection>
            </div>

            {/* Pro Forma Growth Rates */}
            <InputSection title="Pro Forma Growth Rates">
                <div className="grid grid-cols-2 gap-4">
                    <FinanceInput 
                        label="Rent Growth (Year 2+)" 
                        value={assumptions.rentGrowth} 
                        onChange={v => setAssumptions({ rentGrowth: v })} 
                        suffix="%" 
                        step={0.5} 
                    />
                    <FinanceInput 
                        label="OpEx Growth (Year 2+)" 
                        value={assumptions.opexGrowth} 
                        onChange={v => setAssumptions({ opexGrowth: v })} 
                        suffix="%" 
                        step={0.5} 
                    />
                </div>
                <p className="text-xs text-text-muted italic">
                    These rates apply to the multi-year cash flow analysis for investor returns.
                </p>
            </InputSection>

            {/* Closing Costs Section */}
            <div className="bg-white rounded-xl border border-border shadow-card">
                <div className="px-6 py-5 border-b border-border bg-surface-subtle/50 flex justify-between items-center">
                    <h3 className="text-base font-semibold text-primary">Closing Costs</h3>
                    <span className="text-sm font-bold text-primary">{fmt(rawClosingSum)} <span className="text-xs font-normal text-muted">+ Origination</span></span>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-4">
                         <h4 className="text-xs font-bold text-secondary uppercase tracking-wider border-b border-border-subtle pb-1">Third Party Reports & Legal</h4>
                         <div className="grid grid-cols-2 gap-4">
                            <FinanceInput label="Legal" value={financingScenario.costs.legal} onChange={v => handleCostChange('legal', v)} prefix="$" />
                            <FinanceInput label="Title" value={financingScenario.costs.title} onChange={v => handleCostChange('title', v)} prefix="$" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FinanceInput label="Inspection" value={financingScenario.costs.inspection} onChange={v => handleCostChange('inspection', v)} prefix="$" />
                            <FinanceInput label="Appraisal" value={financingScenario.costs.appraisal} onChange={v => handleCostChange('appraisal', v)} prefix="$" />
                        </div>
                    </div>

                    <div className="space-y-4 pt-2">
                        <h4 className="text-xs font-bold text-secondary uppercase tracking-wider border-b border-border-subtle pb-1">Lender & Acquisition</h4>
                         <div className="grid grid-cols-2 gap-4">
                            <FinanceInput label="Mortgage Fees" value={financingScenario.costs.mortgageFees} onChange={v => handleCostChange('mortgageFees', v)} prefix="$" />
                            <FinanceInput label="Acquisition Fee" value={financingScenario.costs.acquisitionFee} onChange={v => handleCostChange('acquisitionFee', v)} prefix="$" />
                        </div>
                         <FinanceInput label="Origination Fee" value={financingScenario.costs.origination} onChange={v => handleCostChange('origination', v)} suffix="%" step={0.25} />
                    </div>

                    <div className="space-y-4 pt-2">
                        <h4 className="text-xs font-bold text-secondary uppercase tracking-wider border-b border-border-subtle pb-1">CapEx & Misc</h4>
                        <FinanceInput label="Cap Ex / Reserves" value={financingScenario.costs.reserves} onChange={v => handleCostChange('reserves', v)} prefix="$" />
                        <FinanceInput label="Other / Misc" value={financingScenario.costs.misc} onChange={v => handleCostChange('misc', v)} prefix="$" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinancingInputs;
