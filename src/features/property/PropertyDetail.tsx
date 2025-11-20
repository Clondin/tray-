
import React, { useState, useEffect } from 'react';
import type { CalculatedProperty, PropertyTab } from '../../types';
import { useAppStore } from '../../store/appStore';
import { SectionCard } from '../../components/common/SectionCard';
import { KpiCard, KpiValue } from '../../components/common/KpiCard';
import { fmt, fmtPct } from '../../utils/formatters';
import { RentRollTable } from './RentRollTable';
import { ExpensesTab } from './ExpensesTab';
import { Layers, FileText, Calculator } from '../../components/icons';

interface PropertyDetailProps {
    prop: CalculatedProperty;
}

const PropertyDetail: React.FC<PropertyDetailProps> = ({ prop }) => {
    const { setView, assumptions, propertyViewTab, setPropertyViewTab } = useAppStore(state => ({ 
        setView: state.setView, 
        assumptions: state.assumptions,
        propertyViewTab: state.propertyViewTab,
        setPropertyViewTab: state.setPropertyViewTab
    }));
    
    // Local state acts as a proxy, synced with global state on mount/change
    const [activeTab, setActiveTab] = useState<PropertyTab>(propertyViewTab);

    useEffect(() => {
        setActiveTab(propertyViewTab);
    }, [propertyViewTab]);

    const handleTabChange = (tab: PropertyTab) => {
        setActiveTab(tab);
        setPropertyViewTab(tab);
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <header>
                <button onClick={() => setView('overview')} className="text-body font-medium text-accent-primary hover:opacity-80 mb-2">← Back to Overview</button>
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-display font-bold text-text-primary">{prop.address}</h2>
                        <p className="text-text-secondary">{prop.rooms} Rooms • {prop.city}, NJ</p>
                    </div>
                    <div className="flex bg-surface-subtle p-1 rounded-lg border border-border">
                        <button 
                            onClick={() => handleTabChange('overview')}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'overview' ? 'bg-white shadow-sm text-primary' : 'text-secondary hover:text-primary'}`}
                        >
                            <Layers className="w-4 h-4" /> Overview
                        </button>
                        <button 
                            onClick={() => handleTabChange('expenses')}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'expenses' ? 'bg-white shadow-sm text-primary' : 'text-secondary hover:text-primary'}`}
                        >
                            <Calculator className="w-4 h-4" /> Expenses
                        </button>
                        <button 
                            onClick={() => handleTabChange('rentroll')}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'rentroll' ? 'bg-white shadow-sm text-primary' : 'text-secondary hover:text-primary'}`}
                        >
                            <FileText className="w-4 h-4" /> Rent Roll
                        </button>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard label="Asking Price" value={<KpiValue value={prop.valuation.askingPrice} formatter={fmt} />} subValue={`${fmt(prop.valuation.pricePerRoom)}/room`} />
                <KpiCard label="Current Cap Rate" value={fmtPct(prop.current.capRate)} subValue={`${fmt(prop.current.noi)} NOI`} />
                <KpiCard label="Stabilized Cap Rate" value={fmtPct(prop.stabilized.capRate)} subValue={`${fmt(prop.stabilized.noi)} NOI`} />
                <KpiCard label="Stabilized Value" value={<KpiValue value={prop.valuation.stabilizedValue} formatter={fmt} />} subValue={`@ ${fmtPct(assumptions.capRate)} cap`} />
            </div>

            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SectionCard title="Current Performance">
                    <dl className="space-y-3 text-body">
                        <div className="flex justify-between items-center py-2 border-b border-border-subtle"><dt className="text-text-secondary">Total Rooms</dt><dd className="font-medium text-text-primary">{prop.rooms}</dd></div>
                        <div className="flex justify-between items-center py-2 border-b border-border-subtle"><dt className="text-text-secondary">Occupied Rooms</dt><dd className="font-medium text-text-primary">{prop.current.occupiedRooms}</dd></div>
                        <div className="flex justify-between items-center py-2 border-b border-border-subtle"><dt className="text-text-secondary">Occupancy Rate</dt><dd className="font-medium text-text-primary">{fmtPct(prop.current.occupancy)}</dd></div>
                        <div className="flex justify-between items-center py-2 border-b border-border-subtle"><dt className="text-text-secondary">Gross Rental Income</dt><dd className="font-medium text-text-primary">{fmt(prop.current.gri)}</dd></div>
                        <div className="flex justify-between items-center py-2 border-b border-border-subtle"><dt className="text-text-secondary">Operating Expenses</dt><dd className="font-medium text-text-primary">({fmt(prop.current.opex)})</dd></div>
                        <div className="flex justify-between items-center py-3 bg-bg-surface-soft px-3 -mx-3 rounded-md"><dt className="font-bold text-text-primary">Net Operating Income</dt><dd className="font-bold text-lg text-text-primary">{fmt(prop.current.noi)}</dd></div>
                    </dl>
                    </SectionCard>
                    <SectionCard title="Stabilized Performance">
                    <dl className="space-y-3 text-body">
                        <div className="flex justify-between items-center py-2 border-b border-border-subtle"><dt className="text-text-secondary">Total Rooms</dt><dd className="font-medium text-text-primary">{prop.rooms}</dd></div>
                        <div className="flex justify-between items-center py-2 border-b border-border-subtle"><dt className="text-text-secondary">Occupied Rooms</dt><dd className="font-medium text-status-success">{prop.stabilized.occupiedRooms}</dd></div>
                        <div className="flex justify-between items-center py-2 border-b border-border-subtle"><dt className="text-text-secondary">Occupancy Rate</dt><dd className="font-medium text-status-success">{fmtPct(prop.stabilized.occupancy)}</dd></div>
                        <div className="flex justify-between items-center py-2 border-b border-border-subtle"><dt className="text-text-secondary">Potential Gross Income</dt><dd className="font-medium text-status-success">{fmt(prop.stabilized.gri / (prop.stabilized.occupancy/100))}</dd></div>
                        <div className="flex justify-between items-center py-2 border-b border-border-subtle"><dt className="text-text-secondary">Effective Gross Income</dt><dd className="font-medium text-status-success">{fmt(prop.stabilized.gri)}</dd></div>
                        <div className="flex justify-between items-center py-2 border-b border-border-subtle"><dt className="text-text-secondary">Operating Expenses</dt><dd className="font-medium text-text-primary">({fmt(prop.stabilized.opex)})</dd></div>
                        <div className="flex justify-between items-center py-3 bg-status-success-soft px-3 -mx-3 rounded-md"><dt className="font-bold text-status-success">Net Operating Income</dt><dd className="font-bold text-lg text-status-success">{fmt(prop.stabilized.noi)}</dd></div>
                    </dl>
                    </SectionCard>
                </div>
            )}

            {activeTab === 'expenses' && (
                 <SectionCard title="Operating Expenses">
                    <ExpensesTab property={prop} />
                 </SectionCard>
            )}

            {activeTab === 'rentroll' && (
                <SectionCard title={`Rent Roll (${prop.units.length} Units)`}>
                    <RentRollTable property={prop} />
                </SectionCard>
            )}
        </div>
    );
};

export default PropertyDetail;
