
import React from 'react';
import { useAppStore } from '../../../store/appStore';
import type { FinancingScenario } from '../../../types';
import { fmt } from '../../../utils/formatters';
import { SectionCard } from '../../../components/common/SectionCard';

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
            <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1.5">{label}</label>
            <div className="relative">
                {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-small">{prefix}</span>}
                 {type === 'number' ? (
                    <input
                        type="number"
                        value={value}
                        step={step || 'any'}
                        onChange={e => onChange(parseFloat(e.target.value) as T)}
                        disabled={disabled}
                        className={`form-input w-full text-sm font-medium ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-8' : ''} ${disabled ? 'bg-bg-surface-soft cursor-not-allowed opacity-60' : ''}`}
                    />
                 ) : (
                    <select
                        value={value}
                        onChange={e => onChange(e.target.value as T)}
                        disabled={disabled}
                        className="form-select w-full text-sm font-medium"
                    >
                        {options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                 )}
                {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none text-small">{suffix}</span>}
            </div>
        </div>
    );
}

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
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            
            {/* Left Column: Loan Structure */}
            <SectionCard title="Loan Structure & Terms" className="h-full">
                <div className="space-y-6">
                    {/* Sizing Strategy */}
                    <div className="p-4 bg-surface-subtle rounded-lg border border-border-subtle space-y-4">
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
                        <div className="grid grid-cols-2 gap-4">
                            <FinanceInput label="Target DSCR" value={financingScenario.targetDSCR} onChange={v => handleInputChange('targetDSCR', v)} step={0.05} disabled={isManualSizing} />
                            <FinanceInput label="Target LTV" value={financingScenario.targetLTV} onChange={v => handleInputChange('targetLTV', v)} suffix="%" disabled={isManualSizing} />
                        </div>
                        <FinanceInput label="Manual Amount" value={financingScenario.manualLoanAmount} onChange={v => handleInputChange('manualLoanAmount', v)} prefix="$" disabled={!isManualSizing} />
                    </div>

                    {/* Terms */}
                    <div className="space-y-4">
                         <h4 className="text-xs font-bold text-primary border-b border-border-subtle pb-2">Terms & Rates</h4>
                         <div className="grid grid-cols-2 gap-4">
                            <FinanceInput label="Interest Rate" value={financingScenario.interestRate} onChange={v => handleInputChange('interestRate', v)} suffix="%" step={0.125} />
                            <FinanceInput label="I/O Period" value={financingScenario.ioPeriodMonths} onChange={v => handleInputChange('ioPeriodMonths', v)} suffix="months" />
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
                        </div>
                    </div>

                     {/* Growth Rates */}
                    <div className="p-4 bg-surface-subtle rounded-lg border border-border-subtle space-y-3">
                        <h4 className="text-xs font-bold text-secondary uppercase">Pro Forma Assumptions</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <FinanceInput 
                                label="Rent Growth" 
                                value={assumptions.rentGrowth} 
                                onChange={v => setAssumptions({ rentGrowth: v })} 
                                suffix="%" 
                                step={0.5} 
                            />
                            <FinanceInput 
                                label="OpEx Growth" 
                                value={assumptions.opexGrowth} 
                                onChange={v => setAssumptions({ opexGrowth: v })} 
                                suffix="%" 
                                step={0.5} 
                            />
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* Right Column: Closing Costs */}
            <SectionCard 
                title="Transaction Costs" 
                action={<span className="text-sm font-bold text-primary bg-surface-subtle px-2 py-1 rounded border border-border">{fmt(rawClosingSum)} <span className="text-xs font-normal text-muted">+ Orig.</span></span>}
                className="h-full"
            >
                <div className="space-y-6">
                    
                    {/* Lender Fees */}
                    <div>
                         <h4 className="text-xs font-bold text-primary border-b border-border-subtle pb-2 mb-4">Lender & Financing Fees</h4>
                         <div className="grid grid-cols-2 gap-4">
                            <FinanceInput label="Origination" value={financingScenario.costs.origination} onChange={v => handleCostChange('origination', v)} suffix="%" step={0.25} />
                             <FinanceInput label="Mortgage Fees" value={financingScenario.costs.mortgageFees} onChange={v => handleCostChange('mortgageFees', v)} prefix="$" />
                        </div>
                    </div>

                    {/* Third Party */}
                    <div>
                        <h4 className="text-xs font-bold text-primary border-b border-border-subtle pb-2 mb-4">Third Party Reports</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <FinanceInput label="Legal" value={financingScenario.costs.legal} onChange={v => handleCostChange('legal', v)} prefix="$" />
                            <FinanceInput label="Title" value={financingScenario.costs.title} onChange={v => handleCostChange('title', v)} prefix="$" />
                            <FinanceInput label="Inspection" value={financingScenario.costs.inspection} onChange={v => handleCostChange('inspection', v)} prefix="$" />
                            <FinanceInput label="Appraisal" value={financingScenario.costs.appraisal} onChange={v => handleCostChange('appraisal', v)} prefix="$" />
                        </div>
                    </div>

                    {/* Acquisition & Reserves */}
                    <div>
                        <h4 className="text-xs font-bold text-primary border-b border-border-subtle pb-2 mb-4">Acquisition & Reserves</h4>
                        <div className="grid grid-cols-2 gap-4">
                             <FinanceInput label="Acquisition Fee" value={financingScenario.costs.acquisitionFee} onChange={v => handleCostChange('acquisitionFee', v)} prefix="$" />
                             <FinanceInput label="CapEx Reserves" value={financingScenario.costs.reserves} onChange={v => handleCostChange('reserves', v)} prefix="$" />
                             <div className="col-span-2">
                                <FinanceInput label="Other / Misc" value={financingScenario.costs.misc} onChange={v => handleCostChange('misc', v)} prefix="$" />
                             </div>
                        </div>
                    </div>

                </div>
            </SectionCard>
        </div>
    );
};

export default FinancingInputs;
