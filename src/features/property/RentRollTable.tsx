
import React, { useCallback } from 'react';
import { useAppStore } from '../../store/appStore';
import type { CalculatedProperty, Unit } from '../../types';
import { DataTable, DataTableHeader, DataTableHeaderCell, DataTableBody, DataTableRow, DataTableCell } from '../../components/common/DataTable';
import { fmt, fmtPct } from '../../utils/formatters';

const EditableCell: React.FC<{ 
    value: string | number, 
    onChange: (val: any) => void, 
    type?: 'text' | 'number' | 'select',
    options?: string[],
    disabled?: boolean
}> = ({ value, onChange, type = 'text', options, disabled }) => {
    
    if (type === 'select' && options) {
        return (
            <select 
                value={value} 
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="w-full bg-transparent border-none p-1 text-sm focus:ring-1 focus:ring-accent rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        );
    }

    return (
        <input 
            type={type} 
            value={value} 
            onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) : e.target.value)}
            disabled={disabled}
            className={`
                w-full bg-transparent border-b border-transparent p-1 text-sm transition-colors text-right
                ${disabled 
                    ? 'text-muted cursor-not-allowed border-dashed border-border-subtle' 
                    : 'hover:border-border focus:border-accent focus:outline-none'}
            `}
        />
    );
};

// Memoized Row Component
const RentRollRow = React.memo(({ unit, onUpdate }: { 
    unit: Unit; 
    onUpdate: (unitId: string, field: keyof Unit, value: any) => void 
}) => {
    const isVacant = unit.status === 'Vacant';
    
    // Helper to avoid inline arrow functions in render if strictly needed, 
    // but mostly just need to avoid re-rendering the whole parent list.
    
    return (
        <DataTableRow>
            <DataTableCell className="font-medium text-primary w-24">{unit.unitId}</DataTableCell>
            
            {/* Tenant Name */}
            <DataTableCell>
                <div className="border-b border-transparent hover:border-border transition-colors">
                    <input 
                        type="text" 
                        value={unit.tenantName || ''} 
                        onChange={(e) => onUpdate(unit.unitId, 'tenantName', e.target.value)}
                        className="w-full bg-transparent focus:outline-none text-sm"
                        placeholder="-"
                    />
                </div>
            </DataTableCell>

            {/* Status */}
            <DataTableCell align="center" className="w-32">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${!isVacant ? 'bg-success-light text-success' : 'bg-surface-subtle text-muted'}`}>
                    <select 
                        value={unit.status} 
                        onChange={(e) => onUpdate(unit.unitId, 'status', e.target.value)}
                        className="bg-transparent border-none focus:ring-0 p-0 text-xs font-medium cursor-pointer"
                    >
                        <option value="Occupied">Occupied</option>
                        <option value="Vacant">Vacant</option>
                    </select>
                </span>
            </DataTableCell>

            {/* Current Rent */}
            <DataTableCell align="right" className="w-32">
                <div className={`flex items-center justify-end gap-1 ${isVacant ? 'opacity-40' : ''}`}>
                    <span className="text-muted text-xs">$</span>
                    <EditableCell 
                        value={unit.currentRent} 
                        onChange={(val) => onUpdate(unit.unitId, 'currentRent', val)} 
                        type="number" 
                        disabled={isVacant}
                    />
                </div>
            </DataTableCell>

            {/* Pro Forma Rent */}
            <DataTableCell align="right" className="w-32 bg-surface-subtle/30">
                <div className="flex items-center justify-end gap-1 font-medium text-accent">
                    <span className="text-accent/50 text-xs">$</span>
                    <EditableCell 
                        value={unit.proFormaRent} 
                        onChange={(val) => onUpdate(unit.unitId, 'proFormaRent', val)} 
                        type="number" 
                    />
                </div>
            </DataTableCell>
        </DataTableRow>
    );
}, (prev, next) => {
    // Comparator: Only re-render if specific unit fields change
    return (
        prev.unit.unitId === next.unit.unitId &&
        prev.unit.tenantName === next.unit.tenantName &&
        prev.unit.status === next.unit.status &&
        prev.unit.currentRent === next.unit.currentRent &&
        prev.unit.proFormaRent === next.unit.proFormaRent
    );
});

interface RentRollTableProps {
    property: CalculatedProperty;
}

export const RentRollTable: React.FC<RentRollTableProps> = ({ property }) => {
    const setUnitOverride = useAppStore(state => state.setUnitOverride);

    // Stable update handler
    const handleUpdate = useCallback((unitId: string, field: keyof Unit, value: any) => {
        setUnitOverride(property.id, unitId, { [field]: value });
    }, [property.id, setUnitOverride]);

    // Calculations for Summary
    const totalUnits = property.units.length;
    const occupiedUnits = property.units.filter(u => u.status === 'Occupied').length;
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
    
    const totalCurrentRent = property.units.reduce((sum, u) => sum + (u.currentRent || 0), 0);
    const totalProFormaRent = property.units.reduce((sum, u) => sum + (u.proFormaRent || 0), 0);

    if (property.units.length === 0) {
        return <div className="p-8 text-center text-muted italic">No rent roll data available.</div>;
    }

    return (
        <div className="space-y-4">
            {/* Summary Header */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-surface-subtle rounded-xl border border-border">
                <div className="text-center border-r border-border-subtle last:border-r-0">
                    <div className="text-xs text-secondary uppercase tracking-wider font-semibold mb-1">Total Current Rent</div>
                    <div className="text-lg font-bold text-primary">{fmt(totalCurrentRent)}<span className="text-xs font-normal text-muted"> /mo</span></div>
                </div>
                <div className="text-center border-r border-border-subtle last:border-r-0">
                    <div className="text-xs text-secondary uppercase tracking-wider font-semibold mb-1">Total Pro Forma</div>
                    <div className="text-lg font-bold text-accent">{fmt(totalProFormaRent)}<span className="text-xs font-normal text-muted"> /mo</span></div>
                </div>
                <div className="text-center">
                    <div className="text-xs text-secondary uppercase tracking-wider font-semibold mb-1">Occupancy</div>
                    <div className="text-lg font-bold text-primary">
                        {occupiedUnits} <span className="text-sm font-normal text-muted">/ {totalUnits}</span>
                        <span className={`ml-2 text-sm font-medium ${occupancyRate >= 90 ? 'text-success' : occupancyRate >= 70 ? 'text-warning' : 'text-danger'}`}>
                            ({fmtPct(occupancyRate)})
                        </span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                <DataTable>
                    <DataTableHeader>
                        <DataTableHeaderCell>Unit</DataTableHeaderCell>
                        <DataTableHeaderCell>Tenant Name</DataTableHeaderCell>
                        <DataTableHeaderCell align="center">Status</DataTableHeaderCell>
                        <DataTableHeaderCell align="right">Current Rent</DataTableHeaderCell>
                        <DataTableHeaderCell align="right">Pro Forma Rent</DataTableHeaderCell>
                    </DataTableHeader>
                    <DataTableBody>
                        {property.units.map((unit: Unit, idx: number) => (
                            <RentRollRow 
                                key={unit.unitId || idx} 
                                unit={unit} 
                                onUpdate={handleUpdate} 
                            />
                        ))}
                    </DataTableBody>
                </DataTable>
            </div>
        </div>
    );
};
