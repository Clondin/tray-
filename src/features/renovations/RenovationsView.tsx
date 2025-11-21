
import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { SectionCard } from '../../components/common/SectionCard';
import { KpiCard, KpiValue } from '../../components/common/KpiCard';
import { fmt, fmtPct } from '../../utils/formatters';
import { Hammer, TrendingUp, DollarSign, Check, AlertTriangle } from '../../components/icons';
import { DataTable, DataTableHeader, DataTableHeaderCell, DataTableBody, DataTableRow, DataTableCell } from '../../components/common/DataTable';

const RenovationsView: React.FC = () => {
    const { 
        currentPortfolio, 
        calculatedProperties, 
        assumptions, 
        setAssumptions,
        openPropertyModal,
        setRenovationOverride
    } = useAppStore(state => ({
        currentPortfolio: state.currentPortfolio,
        calculatedProperties: state.calculatedProperties,
        assumptions: state.assumptions,
        setAssumptions: state.setAssumptions,
        openPropertyModal: state.openPropertyModal,
        setRenovationOverride: state.setRenovationOverride
    }));

    const [filterText, setFilterText] = useState('');

    if (!currentPortfolio) return <div>Loading...</div>;

    const properties = calculatedProperties.filter(p => 
        currentPortfolio.propertyIds.includes(p.id) && 
        p.address.toLowerCase().includes(filterText.toLowerCase())
    );

    const totalUnitsInPortfolio = currentPortfolio.totalRooms;
    const unitsRenovated = properties.reduce((sum, p) => sum + (p.renovation.enabled ? p.renovation.unitsToRenovate : 0), 0);
    const totalCapEx = currentPortfolio.renovation.totalCapEx;
    const totalValueCreation = currentPortfolio.renovation.totalValueCreation;
    const portfolioROI = currentPortfolio.renovation.roi;

    const handleToggleProperty = (propId: number, currentEnabled: boolean) => {
        setRenovationOverride(propId, { enabled: !currentEnabled });
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
             <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-primary">Renovations & Value-Add</h2>
                    <p className="text-secondary text-sm mt-1">Plan unit upgrades, estimate CapEx budgets, and project ROI from rent premiums.</p>
                </div>
            </header>

            {/* Global Renovation Assumptions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <SectionCard title="Global Renovation Assumptions" className="h-full">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">Renovation Cost per Unit</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
                                <input 
                                    type="number" 
                                    value={assumptions.renovationCostPerUnit}
                                    onChange={e => setAssumptions({ renovationCostPerUnit: parseFloat(e.target.value) || 0 })}
                                    className="form-input pl-7 font-semibold text-primary"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">Rent Premium per Unit</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
                                <input 
                                    type="number" 
                                    value={assumptions.renovationRentPremium}
                                    onChange={e => setAssumptions({ renovationRentPremium: parseFloat(e.target.value) || 0 })}
                                    className="form-input pl-7 font-semibold text-success"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-xs">/mo</span>
                            </div>
                        </div>
                        <div className="p-3 bg-surface-subtle rounded-lg border border-border text-xs text-secondary leading-relaxed">
                            <strong>Note:</strong> These defaults apply to all properties unless overridden specifically at the property level.
                        </div>
                    </div>
                </SectionCard>

                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                     <KpiCard 
                        label="Total Reno Budget" 
                        value={<KpiValue value={totalCapEx} formatter={fmt} />}
                        subValue={`${unitsRenovated} of ${totalUnitsInPortfolio} Units`}
                        icon={<Hammer className="w-5 h-5" />}
                    />
                    <KpiCard 
                        label="Value Creation" 
                        value={<KpiValue value={totalValueCreation} formatter={fmt} />}
                        subValue="Incremental Value"
                        icon={<TrendingUp className="w-5 h-5" />}
                        highlight
                    />
                    <KpiCard 
                        label="Return on Cost (ROI)" 
                        value={fmtPct(portfolioROI * 100)}
                        subValue="Value Created / CapEx"
                        icon={<DollarSign className="w-5 h-5" />}
                    />
                     <SectionCard className="flex flex-col justify-center h-full">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-secondary">Annual Rent Lift</span>
                                <span className="font-bold text-success">+{fmt(unitsRenovated * assumptions.renovationRentPremium * 12)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-secondary">Avg. Premium</span>
                                <span className="font-medium text-primary">{fmt(assumptions.renovationRentPremium)} / unit</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-secondary">Exit Cap Rate</span>
                                <span className="font-medium text-primary">{fmtPct(assumptions.capRate)}</span>
                            </div>
                        </div>
                    </SectionCard>
                </div>
            </div>

            {/* Property Table */}
            <SectionCard title="Renovation Plan by Property">
                <div className="overflow-x-auto">
                    <DataTable>
                        <DataTableHeader>
                            <DataTableHeaderCell align="center" className="w-16">Active</DataTableHeaderCell>
                            <DataTableHeaderCell>Property</DataTableHeaderCell>
                            <DataTableHeaderCell align="center">Units</DataTableHeaderCell>
                            <DataTableHeaderCell align="right">Budget / Unit</DataTableHeaderCell>
                            <DataTableHeaderCell align="right">Premium / Unit</DataTableHeaderCell>
                            <DataTableHeaderCell align="right">Total CapEx</DataTableHeaderCell>
                            <DataTableHeaderCell align="right">ROI</DataTableHeaderCell>
                            <DataTableHeaderCell align="center">Actions</DataTableHeaderCell>
                        </DataTableHeader>
                        <DataTableBody>
                            {properties.map(prop => (
                                <DataTableRow key={prop.id} className={prop.renovation.enabled ? 'bg-white' : 'bg-gray-50/50'}>
                                    <DataTableCell align="center">
                                        <button 
                                            onClick={() => handleToggleProperty(prop.id, prop.renovation.enabled)}
                                            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${prop.renovation.enabled ? 'bg-accent border-accent text-white' : 'bg-white border-border text-transparent hover:border-accent'}`}
                                        >
                                            <Check className="w-3 h-3" />
                                        </button>
                                    </DataTableCell>
                                    <DataTableCell>
                                        <span className={`font-medium ${prop.renovation.enabled ? 'text-primary' : 'text-muted'}`}>
                                            {prop.address.split(',')[0]}
                                        </span>
                                    </DataTableCell>
                                    <DataTableCell align="center">
                                        <span className="text-sm text-secondary">
                                            {prop.renovation.enabled ? prop.renovation.unitsToRenovate : '-'} <span className="text-muted text-xs">/ {prop.rooms}</span>
                                        </span>
                                    </DataTableCell>
                                    <DataTableCell align="right">
                                        {prop.renovation.enabled ? fmt(prop.renovation.costPerUnit) : '-'}
                                    </DataTableCell>
                                     <DataTableCell align="right" className="text-success font-medium">
                                        {prop.renovation.enabled ? `+${fmt(prop.renovation.rentPremiumPerUnit)}` : '-'}
                                    </DataTableCell>
                                    <DataTableCell align="right" className="font-bold text-primary">
                                        {prop.renovation.enabled ? fmt(prop.renovation.totalCapEx) : '-'}
                                    </DataTableCell>
                                    <DataTableCell align="right">
                                        {prop.renovation.enabled ? <span className="text-xs font-bold bg-surface-subtle px-2 py-1 rounded text-primary">{fmtPct(prop.renovation.roi * 100)}</span> : '-'}
                                    </DataTableCell>
                                    <DataTableCell align="center">
                                        <button 
                                            onClick={() => openPropertyModal(prop.id)}
                                            className="text-xs font-medium text-accent hover:text-accent-hover underline"
                                        >
                                            Edit Plan
                                        </button>
                                    </DataTableCell>
                                </DataTableRow>
                            ))}
                        </DataTableBody>
                    </DataTable>
                </div>
            </SectionCard>
        </div>
    );
};

export default RenovationsView;
