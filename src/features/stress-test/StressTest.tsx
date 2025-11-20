
import React, { useState, useCallback } from 'react';
import { useAppStore } from '../../store/appStore';
import type { ExpenseDetail, CalculatedProperty } from '../../types';
import { ArrowUpRight, Search } from '../../components/icons';
import { SectionCard } from '../../components/common/SectionCard';
import { fmt } from '../../utils/formatters';

// Helper for cell inputs
const TableInput: React.FC<{ 
    value: number; 
    onChange: (val: number) => void; 
    placeholder?: string;
    isGlobal?: boolean;
}> = ({ value, onChange, placeholder, isGlobal }) => {
    const [localVal, setLocalVal] = useState(value ? value.toString() : '');

    // Sync if value changes externally (e.g. global update affecting calculated total)
    React.useEffect(() => {
        if (document.activeElement !== document.getElementById(`input-${value}`)) {
             setLocalVal(value ? Math.round(value).toString() : '');
        }
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

    return (
        <input 
            type="number"
            value={localVal}
            onChange={handleChange}
            placeholder={placeholder}
            className={`
                w-full bg-transparent border-b border-transparent text-right p-1 text-xs focus:outline-none focus:border-accent transition-colors
                ${isGlobal ? 'font-bold text-accent placeholder-accent/50' : 'text-secondary focus:bg-white'}
            `}
        />
    );
};

// Memoized Row Component to prevent lag
const ExpenseRow = React.memo(({ 
    prop, 
    expenseFields, 
    onNavigate,
    mode,
    onUpdate
}: {
    prop: CalculatedProperty;
    expenseFields: (keyof ExpenseDetail)[];
    onNavigate: (id: number) => void;
    mode: 't12' | 'proforma';
    onUpdate: (propId: number, field: keyof ExpenseDetail, val: number) => void;
}) => {
    const details = mode === 't12' ? prop.currentExpenseDetail : prop.stabilizedExpenseDetail;
    const total = Object.values(details).reduce((sum, v) => sum + v, 0);

    return (
        <tr className="border-b border-border hover:bg-surface-hover last:border-b-0 group">
            <td className="p-3 sticky left-0 bg-white z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                <button 
                    onClick={() => onNavigate(prop.id)}
                    className="flex items-center justify-between w-full text-left font-medium text-primary hover:text-accent transition-colors"
                >
                    <div className="flex flex-col">
                        <span className="truncate max-w-[160px]" title={prop.address}>{prop.address}</span>
                        <span className="text-[10px] text-muted">{prop.rooms} Units</span>
                    </div>
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            </td>
            {expenseFields.map(key => (
                <td key={key} className="p-1 min-w-[80px]">
                    <TableInput 
                        value={details[key]} 
                        onChange={(val) => onUpdate(prop.id, key, val)}
                    />
                </td>
            ))}
            <td className="p-3 text-right font-bold text-primary sticky right-0 bg-white z-10 shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">
                {fmt(total)}
            </td>
        </tr>
    );
});


const StressTest: React.FC = () => {
    const {
        currentPortfolio, calculatedProperties, openPropertyModal, setPropertyViewTab,
        setT12ExpenseOverride, setExpenseOverride,
        globalT12PerRoom, globalProFormaPerRoom,
        setGlobalT12PerRoom, setGlobalProFormaPerRoom
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
        setGlobalProFormaPerRoom: state.setGlobalProFormaPerRoom
    }));

    const [expenseTab, setExpenseTab] = useState<'t12' | 'proforma'>('t12');
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
            setExpenseOverride(propId, field, val);
        }
    }, [expenseTab, setT12ExpenseOverride, setExpenseOverride]);

    const handleGlobalUpdate = (field: keyof ExpenseDetail, val: number) => {
        if (expenseTab === 't12') {
            setGlobalT12PerRoom(field, val);
        } else {
            setGlobalProFormaPerRoom(field, val);
        }
    };

    // Totals for Footer
    const totalDetails: Record<string, number> = {};
    expenseFields.forEach(key => totalDetails[key] = 0);
    let grandTotal = 0;

    properties.forEach(p => {
        const det = expenseTab === 't12' ? p.currentExpenseDetail : p.stabilizedExpenseDetail;
        expenseFields.forEach(key => {
            totalDetails[key] += det[key];
            grandTotal += det[key];
        });
    });

    const activeGlobalPerRoom = expenseTab === 't12' ? globalT12PerRoom : globalProFormaPerRoom;

    return (
        <div className="space-y-6 animate-fade-in pb-8">
            
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-primary">Expense Manager</h2>
                    <p className="text-secondary text-sm mt-1">Detailed control over property-level operating expenses.</p>
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
                                <th className="p-3 text-left font-bold text-secondary sticky top-0 left-0 z-30 bg-surface-subtle shadow-[2px_2px_5px_rgba(0,0,0,0.05)] min-w-[180px]">
                                    Property / Global Input
                                </th>
                                {expenseFields.map(key => (
                                    <th key={key} className="p-3 text-right font-bold text-secondary whitespace-nowrap min-w-[80px] sticky top-0 z-20 bg-surface-subtle">
                                        {showFullHeaders ? fullLabels[key] : shortLabels[key]}
                                    </th>
                                ))}
                                <th className="p-3 text-right font-bold text-primary sticky top-0 right-0 z-30 bg-surface-subtle shadow-[-2px_2px_5px_rgba(0,0,0,0.05)] min-w-[100px]">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                             {/* Global Inputs Row */}
                             <tr className="bg-accent-light/30 border-b-2 border-accent/20">
                                <td className="p-3 sticky left-0 bg-accent-light/30 z-10 border-r border-accent/10">
                                    <div className="font-bold text-accent text-xs uppercase tracking-wider">Global Per Unit</div>
                                    <div className="text-[10px] text-accent-hover">Applies to all ({expenseTab})</div>
                                </td>
                                {expenseFields.map(key => (
                                    <td key={key} className="p-1">
                                        <TableInput 
                                            value={activeGlobalPerRoom[key] || 0}
                                            onChange={(val) => handleGlobalUpdate(key, val)}
                                            isGlobal
                                        />
                                    </td>
                                ))}
                                <td className="p-3 text-right font-bold text-accent sticky right-0 bg-accent-light/30 z-10">
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
                                    onUpdate={handlePropertyUpdate}
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
                                        {Math.round(totalDetails[key]).toLocaleString()}
                                    </td>
                                ))}
                                <td className="p-3 text-right text-sm text-accent-light sticky bottom-0 right-0 bg-primary z-30 shadow-[-2px_0_5px_rgba(0,0,0,0.2)]">
                                    {fmt(grandTotal)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

            </SectionCard>
        </div>
    );
};

export default StressTest;
