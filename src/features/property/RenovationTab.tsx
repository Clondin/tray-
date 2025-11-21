
import React from 'react';
import { useAppStore } from '../../store/appStore';
import { SectionCard } from '../../components/common/SectionCard';
import { fmt, fmtPct } from '../../utils/formatters';
import { TrendingUp, Hammer, AlertTriangle, Check } from '../../components/icons';
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
    const { setRenovationOverride } = useAppStore(state => ({
        setRenovationOverride: state.setRenovationOverride,
    }));

    const updateRenovation = (field: string, val: any) => {
        setRenovationOverride(property.id, { [field]: val });
    };

    const vacantCount = property.units.filter(u => u.status === 'Vacant').length;
    const isProjectActive = property.renovation.totalCapEx > 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            
            {/* Left Column: Inputs */}
            <div className="lg:col-span-7 space-y-6">
                <SectionCard title="Vacant Unit Prep & Value Add">
                    <div className="space-y-6">
                        {/* Header Info */}
                        <div className="flex items-center justify-between p-4 bg-surface-subtle rounded-xl border border-border">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-accent text-white">
                                    <Hammer className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-primary">Make-Ready & Renovation</div>
                                    <div className="text-xs text-secondary">
                                        Automatically includes {vacantCount} vacant unit{vacantCount !== 1 ? 's' : ''} @ default $1,300 cost.
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="block text-xs text-secondary font-bold uppercase">Total CapEx</span>
                                <span className="text-lg font-bold text-primary">{fmt(property.renovation.totalCapEx)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
                            <div className="col-span-2 md:col-span-1">
                                <EditableField 
                                    label="Scope (Units)" 
                                    value={property.renovation.unitsToRenovate} 
                                    onChange={v => updateRenovation('unitsToRenovate', Math.min(v, property.rooms))} 
                                    placeholder={vacantCount}
                                    active
                                />
                                <div className="flex items-center gap-1 mt-1 ml-1">
                                    <Check className="w-3 h-3 text-success" />
                                    <span className="text-[10px] text-muted">Current Vacant: {vacantCount}</span>
                                </div>
                            </div>
                            <div className="hidden md:block"></div>

                            <EditableField 
                                label="Renovation Cost / Unit" 
                                value={property.renovation.costPerUnit} 
                                onChange={v => updateRenovation('costPerUnit', v)} 
                                placeholder={1300}
                                type="currency"
                                active
                            />
                            <EditableField 
                                label="Rent Premium / Unit" 
                                value={property.renovation.rentPremiumPerUnit} 
                                onChange={v => updateRenovation('rentPremiumPerUnit', v)} 
                                placeholder={0}
                                type="currency"
                                active
                            />
                        </div>
                        
                        <div className="text-xs text-muted italic p-2 bg-surface-subtle/50 rounded border border-border-subtle">
                            * System defaults to <strong>$1,300</strong> per unit for basic vacant turnover with <strong>$0</strong> rent premium (bringing rent to market rate). Increase the cost and premium above for extensive value-add renovations.
                        </div>
                    </div>
                </SectionCard>

                {isProjectActive && (
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 items-start">
                        <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-blue-800 leading-relaxed">
                            <strong>Capital Requirement:</strong> Total Project Cost will increase by <strong>{fmt(property.renovation.totalCapEx)}</strong>. 
                            Any rent premiums entered above will be added to the Pro Forma Rent Roll.
                        </div>
                    </div>
                )}
            </div>

            {/* Right Column: Analysis */}
            <div className="lg:col-span-5 space-y-6">
                <SectionCard title="Value Creation Analysis" className={`h-full ${!isProjectActive ? 'opacity-60' : ''}`}>
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
                                    Based on Exit Cap Rate
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
