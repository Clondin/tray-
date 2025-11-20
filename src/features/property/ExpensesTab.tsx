
import React from 'react';
import { useAppStore } from '../../store/appStore';
import type { CalculatedProperty, ExpenseDetail } from '../../types';
import { fmt, fmtPct } from '../../utils/formatters';
import { DataTable, DataTableHeader, DataTableHeaderCell, DataTableBody, DataTableRow, DataTableCell } from '../../components/common/DataTable';
import { TrendingUp } from '../../components/icons';

export const ExpensesTab: React.FC<{ property: CalculatedProperty }> = ({ property }) => {
    const { setExpenseOverride, setT12ExpenseOverride, assumptions, setAssumptions } = useAppStore(state => ({
        setExpenseOverride: state.setExpenseOverride,
        setT12ExpenseOverride: state.setT12ExpenseOverride,
        assumptions: state.assumptions,
        setAssumptions: state.setAssumptions,
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
                    <p className="text-sm text-secondary">Compare historical T12 actuals against stabilized Pro Forma targets.</p>
                </div>
                
                {/* Growth Rate Control */}
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-border shadow-sm">
                    <div className="p-1.5 bg-accent-light text-accent rounded-md">
                        <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-secondary uppercase tracking-wider">Annual OpEx Growth</div>
                        <div className="flex items-center gap-1">
                            <input 
                                type="number" 
                                value={assumptions.opexGrowth}
                                onChange={(e) => setAssumptions({ opexGrowth: parseFloat(e.target.value) || 0 })}
                                step={0.25}
                                className="w-12 text-right font-bold text-primary bg-transparent border-none p-0 focus:ring-0 text-sm"
                            />
                            <span className="text-sm font-medium text-muted">%</span>
                        </div>
                    </div>
                </div>
             </div>

             <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                <DataTable>
                    <DataTableHeader>
                        <DataTableHeaderCell>Expense Item</DataTableHeaderCell>
                        <DataTableHeaderCell align="right">T12 Actuals (Annual)</DataTableHeaderCell>
                        <DataTableHeaderCell align="right">Pro Forma (Annual)</DataTableHeaderCell>
                        <DataTableHeaderCell align="right">Delta</DataTableHeaderCell>
                    </DataTableHeader>
                    <DataTableBody>
                        {expenseFields.map(key => {
                            const t12Val = property.currentExpenseDetail[key] || 0;
                            const proFormaVal = property.stabilizedExpenseDetail[key] || 0;
                            const delta = proFormaVal - t12Val;
                            
                            return (
                                <DataTableRow key={key}>
                                    <DataTableCell className="font-medium text-secondary">
                                        {labels[key]}
                                    </DataTableCell>
                                    <DataTableCell align="right">
                                         <input 
                                            type="number" 
                                            value={property.currentExpenseDetail[key] || ''} 
                                            onChange={(e) => setT12ExpenseOverride(property.id, key, parseFloat(e.target.value) || 0)}
                                            placeholder="-"
                                            className="w-32 text-right p-1.5 text-sm bg-surface-subtle border border-border rounded focus:border-accent focus:ring-1 focus:ring-accent outline-none"
                                        />
                                    </DataTableCell>
                                    <DataTableCell align="right">
                                        <input 
                                            type="number" 
                                            value={property.stabilizedExpenseDetail[key] || ''} 
                                            onChange={(e) => setExpenseOverride(property.id, key, parseFloat(e.target.value) || 0)}
                                            placeholder="-"
                                            className="w-32 text-right p-1.5 text-sm bg-white border border-border rounded focus:border-accent focus:ring-1 focus:ring-accent outline-none font-medium text-primary"
                                        />
                                    </DataTableCell>
                                    <DataTableCell align="right">
                                        <span className={`text-xs font-medium ${delta > 0 ? 'text-warning' : delta < 0 ? 'text-success' : 'text-muted'}`}>
                                            {delta === 0 ? '-' : fmt(delta)}
                                        </span>
                                    </DataTableCell>
                                </DataTableRow>
                            );
                        })}
                        <DataTableRow className="bg-surface-subtle border-t-2 border-border font-bold">
                            <DataTableCell className="text-primary">Total Operating Expenses</DataTableCell>
                            <DataTableCell align="right" className="text-primary">{fmt(property.current.opex)}</DataTableCell>
                            <DataTableCell align="right" className="text-accent">{fmt(property.stabilized.opex)}</DataTableCell>
                            <DataTableCell align="right">
                                <span className="text-xs font-medium text-muted">
                                    {fmtPct(((property.stabilized.opex - property.current.opex) / (property.current.opex || 1)) * 100)}
                                </span>
                            </DataTableCell>
                        </DataTableRow>
                    </DataTableBody>
                </DataTable>
             </div>
        </div>
    );
};
