
import React, { useState, useCallback } from 'react';
import { useAppStore } from '../../store/appStore';
import type { ExpenseDetail, CalculatedProperty } from '../../types';
import { fmt } from '../../utils/formatters';
import { ArrowUpRight, Search } from '../../components/icons';
import { SectionCard } from '../../components/common/SectionCard';

const CompactControl: React.FC<{ label: string, value: number, onChange: (val: number) => void, type: 'percent' | 'currency', step?: number, min?: number, max?: number }> = ({ label, value, onChange, type, step, min, max }) => {
    return (
        <div className="flex flex-col">
            <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-secondary uppercase tracking-wider">{label}</label>
                <span className="text-sm font-bold text-primary bg-surface-subtle px-2 py-0.5 rounded border border-border-subtle">
                    {type === 'currency' ? fmt(value) : `${value}%`}
                </span>
            </div>
            <input 
                type="range" 
                min={min} 
                max={max} 
                step={step} 
                value={value} 
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-surface-subtle rounded-lg appearance-none cursor-pointer accent-accent"
            />
        </div>
    );
}

// Memoized Row Component to prevent lag
const ExpenseRow = React.memo(({ 
    prop, 
    expenseFields, 
    isT12, 
    isProjection, 
    growthFactor, 
    updateFn, 
    onNavigate 
}: {
    prop: CalculatedProperty;
    expenseFields: (keyof ExpenseDetail)[];
    isT12: boolean;
    isProjection: boolean;
    growthFactor: number;
    updateFn: (id: number, key: keyof ExpenseDetail, val: number) => void;
    onNavigate: (id: number) => void;
}) => {
    const baseDetail = isT12 ? prop.currentExpenseDetail : prop.stabilizedExpenseDetail;
    
    // Calculate row total safely
    const totalBase = Object.values(baseDetail || {}).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
    const rowTotal = totalBase * growthFactor;

    return (
        <tr className="border-b border-border hover:bg-surface-hover last:border-b-0">
            <td className="p-3 sticky left-0 bg-white z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)] group">
                <button 
                    onClick={() => onNavigate(prop.id)}
                    className="flex items-center justify-between w-full text-left font-medium text-primary hover:text-accent transition-colors"
                >
                    <div className="truncate max-w-[160px]" title={prop.address}>{prop.address}</div>
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            </td>
            {expenseFields.map(key => {
                // Safe access with optional chaining
                const baseVal = baseDetail?.[key] || 0;
                const projectedVal = baseVal * growthFactor;

                return (
                    <td key={key} className="p-1">
                        {isProjection ? (
                            <div className="w-full text-right p-1 text-xs text-muted italic">
                                {fmt(projectedVal)}
                            </div>
                        ) : (
                            <input 
                                type="number" 
                                value={baseVal || ''} 
                                onChange={(e) => updateFn(prop.id, key, parseFloat(e.target.value) || 0)}
                                className="w-full text-right p-1 border border-transparent hover:border-border focus:border-accent rounded text-xs focus:outline-none bg-transparent transition-colors"
                                placeholder="-"
                            />
                        )}
                    </td>
                );
            })}
            <td className="p-3 text-right font-bold text-primary sticky right-0 bg-white z-10 shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">
                {fmt(rowTotal)}
            </td>
        </tr>
    );
}, (prev, next) => {
    // Custom comparison function for React.memo
    if (prev.prop.id !== next.prop.id) return false;
    if (prev.isT12 !== next.isT12) return false;
    if (prev.isProjection !== next.isProjection) return false;
    if (prev.growthFactor !== next.growthFactor) return false;

    const prevDetail = prev.isT12 ? prev.prop.currentExpenseDetail : prev.prop.stabilizedExpenseDetail;
    const nextDetail = next.isT12 ? next.prop.currentExpenseDetail : next.prop.stabilizedExpenseDetail;

    // If details are missing (unlikely), re-render
    if (!prevDetail || !nextDetail) return false;

    // Compare all expense fields values
    for (const key of prev.expenseFields) {
        if (prevDetail[key] !== nextDetail[key]) return false;
    }
    
    return true; 
});


const StressTest: React.FC = () => {
    const {
        assumptions, setAssumptions, currentPortfolio, calculatedProperties, setExpenseOverride, setT12ExpenseOverride, 
        globalT12PerRoom, globalProFormaPerRoom, setGlobalT12PerRoom, setGlobalProFormaPerRoom,
        openPropertyModal, setPropertyViewTab
    } = useAppStore(state => ({
        assumptions: state.assumptions,
        setAssumptions: state.setAssumptions,
        currentPortfolio: state.currentPortfolio,
        calculatedProperties: state.calculatedProperties,
        setExpenseOverride: state.setExpenseOverride,
        setT12ExpenseOverride: state.setT12ExpenseOverride,
        globalT12PerRoom: state.globalT12PerRoom,
        globalProFormaPerRoom: state.globalProFormaPerRoom,
        setGlobalT12PerRoom: state.setGlobalT12PerRoom,
        setGlobalProFormaPerRoom: state.setGlobalProFormaPerRoom,
        openPropertyModal: state.openPropertyModal,
        setPropertyViewTab: state.setPropertyViewTab,
    }));

    const [expenseTab, setExpenseTab] = useState<'t12' | 'proforma'>('t12');
    const [proFormaYear, setProFormaYear] = useState<1 | 2 | 3 | 4 | 5>(1);
    const [showFullHeaders, setShowFullHeaders] = useState(false);
    const [filterText, setFilterText] = useState('');

    if (!currentPortfolio) return <div>Loading...</div>;

    const properties = calculatedProperties.filter(p => 
        currentPortfolio.propertyIds.includes(p.id) && 
        p.address.toLowerCase().includes(filterText.toLowerCase())
    );
    
    const expenseFields: (keyof ExpenseDetail)[] = [
        'taxes', 'insurance', 'exterminator', 'electric', 'waterSewer', 'gas', 'internet', 
        'generalAdmin', 'payroll', 'repairsMaint', 'pestControl', 'wasteManagement', 'management', 'other'
    ];

    const shortLabels: Record<keyof ExpenseDetail, string> = {
        taxes: 'RET', insurance: 'Ins', exterminator: 'Ext', electric: 'Elec', 
        waterSewer: 'W/S', gas: 'Gas', internet: 'Int', generalAdmin: 'G/A', payroll: 'Pay', 
        repairsMaint: 'R/M', pestControl: 'Pest', wasteManagement: 'Waste', 
        management: 'Mgmt', other: 'Misc'
    };
    
    const fullLabels: Record<keyof ExpenseDetail, string> = {
        taxes: 'Real Estate Taxes', insurance: 'Insurance', exterminator: 'Exterminator', electric: 'Electric', 
        waterSewer: 'Water/Sewer', gas: 'Gas', internet: 'Internet', generalAdmin: 'General & Admin', payroll: 'Payroll', 
        repairsMaint: 'Repairs & Maintenance', pestControl: 'Pest Control', wasteManagement: 'Waste Management', 
        management: 'Management Fee', other: 'Other / Miscellaneous'
    };
    
    const isT12 = expenseTab === 't12';
    const globalSettings = isT12 ? globalT12PerRoom : globalProFormaPerRoom;
    const updateGlobal = isT12 ? setGlobalT12PerRoom : setGlobalProFormaPerRoom;

    // Multi-Year Logic
    const growthFactor = Math.pow(1 + (assumptions.opexGrowth / 100), proFormaYear - 1);
    const isProjection = !isT12 && proFormaYear > 1;

    const handleNavigateToProperty = useCallback((propId: number) => {
        setPropertyViewTab('expenses');
        openPropertyModal(propId);
    }, [setPropertyViewTab, openPropertyModal]);

    // Stable update function reference not strictly required for memo of row as set* from zustand is stable,
    // but logic toggles between two functions based on isT12 state which is passed to row.
    const updateFn = isT12 ? setT12ExpenseOverride : setExpenseOverride;

    // Calculate Totals Safe
    const columnTotals = expenseFields.reduce((acc, key) => {
        acc[key] = properties.reduce((sum, prop) => {
            const baseDetail = isT12 ? prop.currentExpenseDetail : prop.stabilizedExpenseDetail;
            
            // Hardening: ensure baseDetail exists before accessing key
            if (!baseDetail) return sum;

            const baseVal = baseDetail[key];
            // Hardening: ensure value is a finite number
            const safeBaseVal = (typeof baseVal === 'number' && isFinite(baseVal)) ? baseVal : 0;
            
            const projectedVal = safeBaseVal * growthFactor;
            return sum + projectedVal;
        }, 0);
        return acc;
    }, {} as Record<keyof ExpenseDetail, number>);

    const grandTotal = Object.values(columnTotals).reduce((sum, val) => sum + val, 0);

    return (
        <div className="space-y-6 animate-fade-in pb-8">
            
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-primary">Expense Manager</h2>
                    <p className="text-secondary text-sm mt-1">Detailed control over property-level operating expenses and global assumptions.</p>
                </div>
            </div>

            {/* Compact Global Drivers */}
            <div className="p-5 bg-white rounded-xl border border-border shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <CompactControl 
                        label="Global Market Rent" 
                        value={assumptions.marketRent} 
                        onChange={(v) => setAssumptions({ marketRent: v })} 
                        type="currency" 
                        min={500} max={2500} step={25}
                    />
                    <CompactControl 
                        label="Stabilized Occupancy" 
                        value={assumptions.stabilizedOccupancy} 
                        onChange={(v) => setAssumptions({ stabilizedOccupancy: v })} 
                        type="percent" 
                        min={50} max={100} step={1}
                    />
                    <CompactControl 
                        label="OpEx Growth Rate" 
                        value={assumptions.opexGrowth} 
                        onChange={(v) => setAssumptions({ opexGrowth: v })} 
                        type="percent" 
                        min={0} max={10} step={0.25}
                    />
                    <CompactControl 
                        label="Exit Cap Rate" 
                        value={assumptions.capRate} 
                        onChange={(v) => setAssumptions({ capRate: v })} 
                        type="percent" 
                        min={3} max={12} step={0.1}
                    />
                </div>
            </div>

            {/* Main Expense Table Section */}
            <SectionCard className="overflow-hidden">
                
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        {/* View Toggle */}
                        <div className="flex bg-surface-subtle p-1 rounded-lg border border-border">
                            <button 
                                onClick={() => setExpenseTab('t12')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${expenseTab === 't12' ? 'bg-white shadow text-primary' : 'text-secondary hover:text-primary'}`}
                            >
                                T12 / Actuals
                            </button>
                            <button 
                                onClick={() => setExpenseTab('proforma')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${expenseTab === 'proforma' ? 'bg-white shadow text-primary' : 'text-secondary hover:text-primary'}`}
                            >
                                Pro Forma
                            </button>
                        </div>

                        {/* Pro Forma Year Tabs */}
                        {expenseTab === 'proforma' && (
                            <div className="flex bg-surface-subtle p-1 rounded-lg border border-border">
                                {[1,2,3,4,5].map(year => (
                                    <button
                                        key={year}
                                        onClick={() => setProFormaYear(year as any)}
                                        className={`px-3 py-2 text-xs font-bold rounded-md transition-all ${proFormaYear === year ? 'bg-white shadow text-accent' : 'text-muted hover:text-primary'}`}
                                    >
                                        Yr {year}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                         {/* Header Toggle */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-secondary">Full Names</span>
                            <button 
                                onClick={() => setShowFullHeaders(!showFullHeaders)}
                                className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors duration-300 ${showFullHeaders ? 'bg-accent' : 'bg-gray-300'}`}
                            >
                                <div className={`bg-white w-3 h-3 rounded-full shadow-sm transform duration-300 ${showFullHeaders ? 'translate-x-5' : ''}`}></div>
                            </button>
                        </div>

                         <div className="relative w-full sm:w-48">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                            <input 
                                type="text" 
                                placeholder="Filter..." 
                                className="w-full pl-9 pr-4 py-1.5 text-sm border border-border rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto border border-border rounded-lg max-h-[60vh]">
                    <table className="w-full text-sm border-collapse relative">
                        <thead>
                            <tr className="bg-surface-subtle border-b border-border">
                                <th className="p-3 text-left font-bold text-secondary sticky top-0 left-0 z-30 bg-surface-subtle shadow-[2px_2px_5px_rgba(0,0,0,0.05)] min-w-[180px]">Property</th>
                                {expenseFields.map(key => (
                                    <th key={key} className="p-3 text-right font-bold text-secondary whitespace-nowrap min-w-[80px] sticky top-0 z-20 bg-surface-subtle">
                                        {showFullHeaders ? fullLabels[key] : shortLabels[key]}
                                    </th>
                                ))}
                                <th className="p-3 text-right font-bold text-primary sticky top-0 right-0 z-30 bg-surface-subtle shadow-[-2px_2px_5px_rgba(0,0,0,0.05)] min-w-[100px]">Total</th>
                            </tr>
                            {/* Global / Deal Level Input Row (Only visible on editable baseline years) */}
                            {!isProjection && (
                                <tr className="bg-accent/5 border-b border-accent/20">
                                    <td className="p-3 font-bold text-accent sticky left-0 bg-accent/5 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                        <div className="flex flex-col">
                                            <span>Deal Defaults</span>
                                            <span className="text-[10px] font-normal text-accent/70">$/Unit/Yr</span>
                                        </div>
                                    </td>
                                    {expenseFields.map(key => (
                                        <td key={key} className="p-1">
                                            <input 
                                                type="number" 
                                                value={globalSettings[key] || ''} 
                                                onChange={(e) => updateGlobal(key, parseFloat(e.target.value) || 0)}
                                                className="w-full text-right p-1 border border-accent/20 hover:border-accent focus:border-accent rounded text-xs focus:outline-none bg-white text-accent font-semibold"
                                                placeholder="Global"
                                            />
                                        </td>
                                    ))}
                                    <td className="p-3 sticky right-0 bg-accent/5 z-10 shadow-[-2px_0_5px_rgba(0,0,0,0.05)]"></td>
                                </tr>
                            )}
                        </thead>
                        <tbody>
                            {properties.map(prop => (
                                <ExpenseRow 
                                    key={prop.id}
                                    prop={prop}
                                    expenseFields={expenseFields}
                                    isT12={isT12}
                                    isProjection={isProjection}
                                    growthFactor={growthFactor}
                                    updateFn={updateFn}
                                    onNavigate={handleNavigateToProperty}
                                />
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-primary text-white font-bold shadow-inner border-t-2 border-primary/20">
                                <td className="p-3 sticky bottom-0 left-0 bg-primary z-30 text-sm uppercase tracking-wide shadow-[2px_0_5px_rgba(0,0,0,0.2)]">
                                    Portfolio Total
                                </td>
                                {expenseFields.map(key => (
                                    <td key={key} className="p-3 text-right text-xs whitespace-nowrap sticky bottom-0 bg-primary z-20">
                                        {fmt(columnTotals[key] || 0)}
                                    </td>
                                ))}
                                <td className="p-3 text-right text-sm text-accent-light sticky bottom-0 right-0 bg-primary z-30 shadow-[-2px_0_5px_rgba(0,0,0,0.2)]">
                                    {fmt(grandTotal || 0)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                
                 <div className="mt-4 text-xs text-muted italic flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-accent"></span>
                   {isProjection 
                     ? `Values for Year ${proFormaYear} are calculated based on Year 1 numbers grown by ${assumptions.opexGrowth}% annually.`
                     : 'Enter Year 1 Pro Forma baselines. Future years will be projected using the global OpEx Growth Rate.'
                   }
                </div>

            </SectionCard>
        </div>
    );
};

export default StressTest;
