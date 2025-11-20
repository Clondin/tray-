
import React, { useState, useCallback } from 'react';
import { useAppStore } from '../../store/appStore';
import type { ExpenseDetail, CalculatedProperty } from '../../types';
import { ArrowUpRight, Search } from '../../components/icons';
import { fmt } from '../../utils/formatters';

// Helper for cell inputs
const TableInput: React.FC<{ 
    value: number; 
    onChange: (val: number) => void; 
    placeholder?: string;
    isGlobal?: boolean;
    disabled?: boolean;
}> = ({ value, onChange, placeholder, isGlobal, disabled }) => {
    const [localVal, setLocalVal] = useState(value ? Math.round(value).toString() : '');

    // Sync if value changes externally
    React.useEffect(() => {
        setLocalVal(value ? Math.round(value).toString() : '');
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        setLocalVal(raw);
        const num = parseFloat(raw);
        if (!isNaN(num)) {
            onChange(num);
        } else {
             onChange(0);
        }
    };

    if (disabled) {
        return (
             <div className={`w-full text-right py-1.5 px-2 text-xs ${isGlobal ? 'text-rose-700 font-bold' : 'text-gray-400'}`}>
                {value === 0 ? '-' : Math.round(value).toLocaleString()}
            </div>
        );
    }

    return (
        <input 
            type="number"
            value={localVal}
            onChange={handleChange}
            placeholder={placeholder}
            className={`
                w-full text-right py-1.5 px-2 text-xs focus:outline-none transition-all rounded
                ${isGlobal 
                    ? 'bg-white border border-rose-200 text-rose-700 font-bold focus:ring-2 focus:ring-rose-500/20 placeholder-rose-300' 
                    : 'bg-transparent border border-transparent hover:border-border focus:bg-white focus:border-accent text-gray-700'}
            `}
        />
    );
};

// Memoized Row Component
const ExpenseRow = React.memo(({ 
    prop, 
    expenseFields, 
    onNavigate,
    mode,
    year,
    growthRate,
    onUpdate
}: {
    prop: CalculatedProperty;
    expenseFields: (keyof ExpenseDetail)[];
    onNavigate: (id: number) => void;
    mode: 't12' | 'proforma';
    year: number;
    growthRate: number;
    onUpdate: (propId: number, field: keyof ExpenseDetail, val: number) => void;
}) => {
    const details = mode === 't12' ? prop.currentExpenseDetail : prop.stabilizedExpenseDetail;
    
    // Calculate Projection
    const isProjection = mode === 'proforma' && year > 1;
    const multiplier = isProjection ? Math.pow(1 + growthRate, year - 1) : 1;

    // Calculate row total
    let rowTotal = 0;
    
    return (
        <tr className="group border-b border-border/50 last:border-b-0 hover:bg-gray-50 transition-colors">
            <td className="p-3 sticky left-0 bg-white group-hover:bg-gray-50 z-10 border-r border-transparent group-hover:border-border/50 transition-colors">
                <button 
                    onClick={() => onNavigate(prop.id)}
                    className="flex items-center justify-between w-full text-left group/btn"
                >
                    <div className="flex flex-col">
                        <span className="font-semibold text-gray-700 text-sm truncate max-w-[180px] group-hover/btn:text-accent transition-colors">{prop.address.split(',')[0]}</span>
                        <span className="text-[10px] text-gray-400">{prop.city} • {prop.rooms} Units</span>
                    </div>
                </button>
            </td>
            {expenseFields.map(key => {
                const baseVal = details[key];
                const projectedVal = baseVal * multiplier;
                rowTotal += projectedVal;
                
                return (
                    <td key={key} className={`p-1 min-w-[90px] ${isProjection ? 'bg-gray-50/30' : ''}`}>
                        <TableInput 
                            value={projectedVal} 
                            onChange={(val) => onUpdate(prop.id, key, val)}
                            disabled={isProjection} // Disable inputs for projection years
                        />
                    </td>
                );
            })}
            <td className="p-3 text-right font-medium text-gray-900 sticky right-0 bg-white group-hover:bg-gray-50 z-10 border-l border-border/50 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                {fmt(rowTotal)}
            </td>
        </tr>
    );
});


const StressTest: React.FC = () => {
    const {
        currentPortfolio, calculatedProperties, openPropertyModal, setPropertyViewTab,
        setT12ExpenseOverride, setExpenseOverride,
        globalT12PerRoom, globalProFormaPerRoom,
        setGlobalT12PerRoom, setGlobalProFormaPerRoom,
        assumptions
    } = useAppStore(state => ({
        currentPortfolio: state.currentPortfolio,
        calculatedProperties: state.calculatedProperties,
        openPropertyModal: state.openPropertyModal,
        setPropertyViewTab: state.setPropertyViewTab,
        setT12ExpenseOverride: state.setT12ExpenseOverride,
        setExpenseOverride: state.setExpenseOverride,
        globalT12PerRoom: state.globalT12PerRoom,
        globalProFormaPerRoom: state.globalProFormaPerRoom,
        setGlobalT12PerRoom: state.setGlobalT12PerRoom,
        setGlobalProFormaPerRoom: state.setGlobalProFormaPerRoom,
        assumptions: state.assumptions
    }));

    const [expenseTab, setExpenseTab] = useState<'t12' | 'proforma'>('t12');
    const [proFormaYear, setProFormaYear] = useState<number>(1);
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
    
    const handleNavigateToProperty = useCallback((propId: number) => {
        setPropertyViewTab('expenses');
        openPropertyModal(propId);
    }, [setPropertyViewTab, openPropertyModal]);

    const handlePropertyUpdate = useCallback((propId: number, field: keyof ExpenseDetail, val: number) => {
        if (expenseTab === 't12') {
            setT12ExpenseOverride(propId, field, val);
        } else {
            // Only update if Year 1 (Base Pro Forma)
            if (proFormaYear === 1) {
                setExpenseOverride(propId, field, val);
            }
        }
    }, [expenseTab, proFormaYear, setT12ExpenseOverride, setExpenseOverride]);

    const handleGlobalUpdate = (field: keyof ExpenseDetail, val: number) => {
        if (expenseTab === 't12') {
            setGlobalT12PerRoom(field, val);
        } else {
             if (proFormaYear === 1) {
                setGlobalProFormaPerRoom(field, val);
             }
        }
    };

    // Calculate Multipliers
    const annualGrowthRate = assumptions.opexGrowth / 100;
    const isProjection = expenseTab === 'proforma' && proFormaYear > 1;
    const multiplier = isProjection ? Math.pow(1 + annualGrowthRate, proFormaYear - 1) : 1;

    // Global Row Values
    const activeGlobalPerRoom = expenseTab === 't12' ? globalT12PerRoom : globalProFormaPerRoom;

    // Totals for Footer
    const totalDetails: Record<string, number> = {};
    expenseFields.forEach(key => totalDetails[key] = 0);
    let grandTotal = 0;

    properties.forEach(p => {
        const det = expenseTab === 't12' ? p.currentExpenseDetail : p.stabilizedExpenseDetail;
        expenseFields.forEach(key => {
            const projectedVal = det[key] * multiplier;
            totalDetails[key] += projectedVal;
            grandTotal += projectedVal;
        });
    });

    return (
        <div className="space-y-4 animate-fade-in pb-8">
            
            {/* Header / Toolbar */}
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-white p-2 rounded-xl border border-border shadow-sm">
                
                <div className="flex items-center gap-3">
                    {/* Mode Toggle */}
                    <div className="flex bg-surface-subtle p-1 rounded-lg border border-border">
                        <button 
                            onClick={() => { setExpenseTab('t12'); setProFormaYear(1); }}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${expenseTab === 't12' ? 'bg-white shadow-sm text-primary ring-1 ring-black/5' : 'text-secondary hover:text-primary'}`}
                        >
                            T12 / Actuals
                        </button>
                        <button 
                            onClick={() => setExpenseTab('proforma')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${expenseTab === 'proforma' ? 'bg-white shadow-sm text-primary ring-1 ring-black/5' : 'text-secondary hover:text-primary'}`}
                        >
                            Pro Forma
                        </button>
                    </div>

                    {/* Year Selector (Pro Forma Only) */}
                    {expenseTab === 'proforma' && (
                         <div className="flex bg-surface-subtle p-1 rounded-lg border border-border animate-fade-in">
                            {[1, 2, 3, 4, 5].map(year => (
                                <button
                                    key={year}
                                    onClick={() => setProFormaYear(year)}
                                    className={`
                                        px-3 py-1.5 text-xs font-bold rounded-md transition-all min-w-[40px]
                                        ${proFormaYear === year 
                                            ? 'bg-white text-rose-600 shadow-sm ring-1 ring-black/5' 
                                            : 'text-secondary hover:bg-white/50 hover:text-primary'}
                                    `}
                                >
                                    Yr {year}
                                </button>
                            ))}
                         </div>
                    )}
                </div>
                
                <div className="flex items-center gap-6 w-full xl:w-auto justify-end">
                     {/* Full Names Toggle */}
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <span className="text-xs font-semibold text-secondary group-hover:text-primary transition-colors">Full Names</span>
                        <div className="relative">
                            <input type="checkbox" className="sr-only peer" checked={showFullHeaders} onChange={() => setShowFullHeaders(!showFullHeaders)} />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                        </div>
                    </label>

                    {/* Search */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
                        <input 
                            type="text" 
                            placeholder="Filter properties..." 
                            className="w-full pl-9 pr-4 py-1.5 text-sm border border-border rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all bg-surface-subtle focus:bg-white"
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Main Expense Table */}
            <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden flex flex-col h-[calc(100vh-240px)]">
                <div className="overflow-auto flex-1 relative">
                    <table className="w-full text-sm border-collapse">
                        <thead className="sticky top-0 z-30">
                            <tr className="bg-gray-50 border-b border-border shadow-sm">
                                <th className="p-3 text-left font-bold text-gray-500 uppercase tracking-wider text-xs sticky left-0 z-30 bg-gray-50 min-w-[200px] border-r border-border/50">
                                    Property
                                </th>
                                {expenseFields.map(key => (
                                    <th key={key} className="p-3 text-right font-bold text-gray-500 text-xs whitespace-nowrap min-w-[100px]">
                                        {showFullHeaders ? fullLabels[key] : shortLabels[key]}
                                    </th>
                                ))}
                                <th className="p-3 text-right font-bold text-gray-900 text-xs sticky right-0 z-30 bg-gray-50 min-w-[120px] border-l border-border/50 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                                    Total
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                             {/* Global Deal Defaults Row - Pink Highlight */}
                             <tr className="bg-rose-50/80 border-b-2 border-rose-100">
                                <td className="p-3 sticky left-0 bg-rose-50 z-20 border-r border-rose-100 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                                    <div className="font-bold text-rose-700 text-sm">Deal Defaults</div>
                                    <div className="text-[10px] font-medium text-rose-500 uppercase tracking-wider mt-0.5">$/Unit/Year</div>
                                </td>
                                {expenseFields.map(key => {
                                    const val = (activeGlobalPerRoom[key] || 0) * multiplier;
                                    return (
                                        <td key={key} className="p-1">
                                            <TableInput 
                                                value={val}
                                                onChange={(v) => handleGlobalUpdate(key, v)}
                                                isGlobal
                                                disabled={isProjection}
                                            />
                                        </td>
                                    );
                                })}
                                <td className="p-3 text-right font-bold text-rose-700 sticky right-0 bg-rose-50 z-20 border-l border-rose-100">
                                     -
                                </td>
                            </tr>

                            {/* Property Rows */}
                            {properties.map(prop => (
                                <ExpenseRow 
                                    key={prop.id}
                                    prop={prop}
                                    expenseFields={expenseFields}
                                    onNavigate={handleNavigateToProperty}
                                    mode={expenseTab}
                                    year={proFormaYear}
                                    growthRate={annualGrowthRate}
                                    onUpdate={handlePropertyUpdate}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* Footer Totals */}
                <div className="border-t border-border bg-white p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
                     <div className="flex items-center justify-between text-sm">
                         <span className="font-bold text-primary">Portfolio Totals</span>
                         <div className="flex gap-8">
                            <div className="text-right">
                                <span className="text-xs text-secondary uppercase tracking-wider block mb-1">Total Expenses</span>
                                <span className="text-lg font-bold text-primary">{fmt(grandTotal)}</span>
                            </div>
                         </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default StressTest;
