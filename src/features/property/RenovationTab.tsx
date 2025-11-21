
import React from 'react';
import { useAppStore } from '../../store/appStore';
import { SectionCard } from '../../components/common/SectionCard';
import { fmt, fmtPct } from '../../utils/formatters';
import { TrendingUp, Hammer, AlertTriangle } from '../../components/icons';
import type { CalculatedProperty } from '../../types';

const EditableField: React.FC<{ 
    label: string, 
    value: string | number, 
    onChange: (val: number) => void, 
    type?: 'currency' | 'percent' | 'number', 
    placeholder: string | number, 
    disabled?: boolean,
    active?: boolean
}> = ({ label, value, onChange, type = 'number', placeholder, disabled = false, active = false }) => {
    const prefix = type === 'currency' ? '$' : '';
    const suffix = type === 'percent' ? '%' : '';
    return (
      <div className="relative">
        <label className={`block text-[10px] uppercase tracking-wider font-bold mb-1 ${active ? 'text-primary' : 'text-secondary'}`}>{label}</label>
        <div className="relative">
          {prefix && <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium select-none ${active ? 'text-primary' : 'text-muted'}`}>{prefix}</span>}
          <input
            type="number"
            value={value}
            placeholder={placeholder.toString()}
            onChange={e => onChange(parseFloat(e.target.value) || 0)}
            disabled={disabled}
            className={`
                w-full pl-3 pr-3 py-2 text-sm font-semibold rounded-lg border transition-all
                ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-8' : ''}
                ${disabled 
                    ? 'bg-transparent border-transparent text-muted cursor-default px-0 pl-0' 
                    : active 
                        ? 'bg-white border-accent focus:ring-2 focus:ring-accent/20 text-primary shadow-sm' 
                        : 'bg-surface-subtle border-border hover:border-border-hover text-secondary'}
            `}
          />
          {suffix && <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium select-none ${active ? 'text-primary' : 'text-muted'}`}>{suffix}</span>}
        </div>
      </div>
    );
  };

const StatRow: React.FC<{ label: string, value: string | number, subValue?: string, highlight?: boolean }> = ({ label, value, subValue, highlight }) => (
    <div className="flex justify-between items-baseline py-2 border-b border-border-subtle last:border-0">
        <span className="text-sm text-secondary">{label}</span>
        <div className="text-right">
            <div className={`text-sm font-bold ${highlight ? 'text-accent' : 'text-primary'}`}>{value}</div>
            {subValue && <div className="text-xs text-muted">{subValue}</div>}
        </div>
    </div>
);

export const RenovationTab: React.FC<{ property: CalculatedProperty }> = ({ property }) => {
    const { assumptions, setRenovationOverride } = useAppStore(state => ({
        assumptions: state.assumptions,
        setRenovationOverride: state.setRenovationOverride,
    }));

    const updateRenovation = (field: string, val: any) => {
        setRenovationOverride(property.id, { [field]: val });
    };

    const isEnabled = property.renovation.enabled;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            
            {/* Left Column: Inputs */}
            <div className="lg:col-span-7 space-y-6">
                <SectionCard title="Renovation Plan & Budget">
                    <div className="space-y-6">
                        {/* Toggle Switch */}
                        <div className="flex items-center justify-between p-4 bg-surface-subtle rounded-xl border border-border">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isEnabled ? 'bg-accent text-white' : 'bg-gray-200 text-gray-500'}`}>
                                    <Hammer className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-primary">Value-Add Renovation</div>
                                    <div className="text-xs text-secondary">Enable to apply CapEx and rent premiums.</div>
                                </div>
                            </div>
                            <button 
                                onClick={() => updateRenovation('enabled', !isEnabled)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isEnabled ? 'bg-accent' : 'bg-gray-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        {isEnabled ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
                                <div className="col-span-2 md:col-span-1">
                                    <EditableField 
                                        label="Scope (Units)" 
                                        value={property.renovation.unitsToRenovate} 
                                        onChange={v => updateRenovation('unitsToRenovate', Math.min(v, property.rooms))} 
                                        placeholder={property.rooms}
                                        active
                                    />
                                    <div className="text-[10px] text-muted mt-1 ml-1">Max: {property.rooms} Units</div>
                                </div>
                                <div className="hidden md:block"></div>

                                <EditableField 
                                    label="CapEx Budget / Unit" 
                                    value={property.renovation.costPerUnit} 
                                    onChange={v => updateRenovation('costPerUnit', v)} 
                                    placeholder={assumptions.renovationCostPerUnit}
                                    type="currency"
                                    active
                                />
                                <EditableField 
                                    label="Rent Premium / Unit" 
                                    value={property.renovation.rentPremiumPerUnit} 
                                    onChange={v => updateRenovation('rentPremiumPerUnit', v)} 
                                    placeholder={assumptions.renovationRentPremium}
                                    type="currency"
                                    active
                                />
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted bg-surface-subtle/30 rounded-xl border border-dashed border-border">
                                <p>Renovations are disabled for this property.</p>
                                <button onClick={() => updateRenovation('enabled', true)} className="text-accent hover:underline text-sm font-medium mt-2">Enable Plan</button>
                            </div>
                        )}
                    </div>
                </SectionCard>

                {isEnabled && (
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 items-start">
                        <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-blue-800 leading-relaxed">
                            <strong>Impact on Underwriting:</strong> Activating this plan increases the Total Project Cost by <strong>{fmt(property.renovation.totalCapEx)}</strong>. 
                            The projected premiums are added to the Pro Forma Rent Roll, increasing Stabilized NOI and Valuation.
                        </div>
                    </div>
                )}
            </div>

            {/* Right Column: Analysis */}
            <div className="lg:col-span-5 space-y-6">
                <SectionCard title="Value Creation Analysis" className={`h-full ${!isEnabled ? 'opacity-60 grayscale' : ''}`}>
                     <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-surface-subtle rounded-xl border border-border text-center">
                                <div className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Total Budget</div>
                                <div className="text-xl font-bold text-primary">{fmt(property.renovation.totalCapEx)}</div>
                            </div>
                            <div className="p-4 bg-surface-subtle rounded-xl border border-border text-center">
                                <div className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Return on Cost</div>
                                <div className={`text-xl font-bold ${property.renovation.roi > 0.2 ? 'text-success' : 'text-primary'}`}>
                                    {fmtPct(property.renovation.roi * 100)}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-border p-5 space-y-2">
                            <StatRow 
                                label="Monthly Rent Lift" 
                                value={fmt(property.renovation.unitsToRenovate * property.renovation.rentPremiumPerUnit)} 
                            />
                             <StatRow 
                                label="Annual NOI Increase" 
                                value={fmt(property.renovation.unitsToRenovate * property.renovation.rentPremiumPerUnit * 12)} 
                                highlight
                            />
                            <div className="py-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp className="w-4 h-4 text-accent" />
                                    <span className="text-xs font-bold text-accent uppercase">Value Created</span>
                                </div>
                                <div className="text-3xl font-bold text-primary tracking-tight">
                                    +{fmt(property.renovation.valueCreation)}
                                </div>
                                <div className="text-xs text-muted mt-1">
                                    @ {fmtPct(assumptions.capRate)} Exit Cap Rate
                                </div>
                            </div>
                             <StatRow 
                                label="Net Profit (Value - Cost)" 
                                value={fmt(property.renovation.valueCreation - property.renovation.totalCapEx)} 
                            />
                        </div>
                     </div>
                </SectionCard>
            </div>

        </div>
    );
};
