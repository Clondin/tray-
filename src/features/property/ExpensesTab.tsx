
import React from 'react';
import { useAppStore } from '../../store/appStore';
import type { CalculatedProperty, ExpenseDetail } from '../../types';
import { DataTable, DataTableHeader, DataTableHeaderCell, DataTableBody, DataTableRow, DataTableCell } from '../../components/common/DataTable';
import { fmt } from '../../utils/formatters';

const ExpenseInput: React.FC<{ value: number, onChange: (val: number) => void, highlight?: boolean }> = ({ value, onChange, highlight }) => (
    <div className="relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted">$</span>
        <input 
            type="number" 
            value={value || 0} 
            onChange={e => onChange(parseFloat(e.target.value) || 0)}
            className={`
                w-full pl-5 pr-2 py-1 text-sm text-right bg-transparent border-b border-transparent
                focus:border-accent focus:outline-none focus:bg-white/50 rounded-sm transition-all
                ${highlight ? 'font-bold text-accent' : 'text-primary'}
            `}
        />
    </div>
);

export const ExpensesTab: React.FC<{ property: CalculatedProperty }> = ({ property }) => {
    const { setT12ExpenseOverride, setExpenseOverride } = useAppStore(state => ({
        setT12ExpenseOverride: state.setT12ExpenseOverride,
        setExpenseOverride: state.setExpenseOverride
    }));

    const expenseFields: (keyof ExpenseDetail)[] = [
        'taxes', 'insurance', 'exterminator', 'electric', 'waterSewer', 'gas', 'internet', 
        'generalAdmin', 'payroll', 'repairsMaint', 'pestControl', 'wasteManagement', 'management', 'other'
    ];

    const labels: Record<keyof ExpenseDetail, string> = {
        taxes: 'Real Estate Taxes', insurance: 'Insurance', exterminator: 'Exterminator', electric: 'Electric', 
        waterSewer: 'Water/Sewer', gas: 'Gas', internet: 'Internet', generalAdmin: 'G/A', 
        payroll: 'Payroll', repairsMaint: 'R/M', pestControl: 'Pest Control', 
        wasteManagement: 'Waste Management', management: 'Management Fee', other: 'Other / Misc'
    };

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex justify-between items-center p-4 bg-surface-subtle rounded-xl border border-border">
                <div>
                    <h3 className="text-lg font-bold text-primary">Operating Expenses</h3>
                    <p className="text-sm text-secondary">Detailed expense inputs per property. Defaults derived from global assumptions.</p>
                </div>
             </div>

             <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                <DataTable>
                    <DataTableHeader>
                        <DataTableHeaderCell>Expense Item</DataTableHeaderCell>
                        <DataTableHeaderCell align="right">T12 Actuals (Annual)</DataTableHeaderCell>
                        <DataTableHeaderCell align="right">Pro Forma (Annual)</DataTableHeaderCell>
                        <DataTableHeaderCell align="right">Per Unit (PF)</DataTableHeaderCell>
                    </DataTableHeader>
                    <DataTableBody>
                        {expenseFields.map(key => {
                            const t12Val = property.currentExpenseDetail[key];
                            const pfVal = property.stabilizedExpenseDetail[key];
                            return (
                                <DataTableRow key={key}>
                                    <DataTableCell className="font-medium text-secondary">
                                        {labels[key]}
                                    </DataTableCell>
                                    <DataTableCell align="right" className="w-40">
                                         <ExpenseInput 
                                            value={t12Val} 
                                            onChange={(val) => setT12ExpenseOverride(property.id, key, val)} 
                                        />
                                    </DataTableCell>
                                    <DataTableCell align="right" className="w-40 bg-surface-subtle/30">
                                        <ExpenseInput 
                                            value={pfVal} 
                                            onChange={(val) => setExpenseOverride(property.id, key, val)} 
                                            highlight
                                        />
                                    </DataTableCell>
                                    <DataTableCell align="right" className="w-32 text-xs text-muted">
                                        {fmt(pfVal / property.rooms)}
                                    </DataTableCell>
                                </DataTableRow>
                            );
                        })}
                        <DataTableRow className="bg-surface-subtle border-t-2 border-border font-bold">
                            <DataTableCell className="text-primary">Total Operating Expenses</DataTableCell>
                            <DataTableCell align="right" className="text-primary">{fmt(property.current.opex)}</DataTableCell>
                            <DataTableCell align="right" className="text-accent">{fmt(property.stabilized.opex)}</DataTableCell>
                            <DataTableCell align="right" className="text-muted">{fmt(property.stabilized.opex / property.rooms)}</DataTableCell>
                        </DataTableRow>
                    </DataTableBody>
                </DataTable>
             </div>
        </div>
    );
};
