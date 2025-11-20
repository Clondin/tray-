
import React from 'react';
import { X, Building2 } from '../../components/icons';
import { DataTable, DataTableHeader, DataTableHeaderCell, DataTableBody, DataTableRow, DataTableCell } from '../../components/common/DataTable';
import { fmt, fmtPct } from '../../utils/formatters';
import type { DealReturns } from '../../utils/investorReturnsCalculations';

interface ReturnsDetailModalProps {
    title: string;
    dealReturns: DealReturns;
    scalar?: number; // If provided, scales the displayed values (e.g., for Individual Investor view)
    onClose: () => void;
    mode: 'lp' | 'gp' | 'waterfall' | 'individual';
}

const ReturnsDetailModal: React.FC<ReturnsDetailModalProps> = ({ title, dealReturns, scalar = 1, onClose, mode }) => {
    
    // Helper to scale and format
    const sFmt = (val: number) => fmt(val * scalar);

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4 py-6">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-primary/60 backdrop-blur-sm transition-opacity animate-fade-in" 
                onClick={onClose}
            />

            {/* Modal Window */}
            <div className="relative bg-background w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up border border-border z-10">
                
                {/* Header */}
                <header className="flex items-center justify-between px-6 py-5 border-b border-border bg-white flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-surface-subtle flex items-center justify-center text-primary border border-border">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-primary tracking-tight">{title}</h2>
                            <div className="flex items-center gap-2 text-sm text-secondary mt-0.5">
                                <span>Annual Cash Flow Analysis</span>
                                {scalar !== 1 && (
                                    <>
                                        <span className="w-1 h-1 rounded-full bg-border"></span>
                                        <span className="text-accent font-medium">Values Scaled to Investment</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-8 h-8 flex items-center justify-center rounded-full text-muted hover:bg-surface-subtle hover:text-primary transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-background">
                    <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <DataTable>
                                <DataTableHeader>
                                    <DataTableHeaderCell align="center" className="w-20">Year</DataTableHeaderCell>
                                    <DataTableHeaderCell align="right">Distributable Cash</DataTableHeaderCell>
                                    
                                    {/* LP Columns */}
                                    {(mode === 'lp' || mode === 'waterfall' || mode === 'individual') && (
                                        <>
                                            <DataTableHeaderCell align="right" className="bg-success-light/30 text-success-dark">LP Pref</DataTableHeaderCell>
                                            <DataTableHeaderCell align="right" className="bg-surface-subtle/50">LP Profit Split</DataTableHeaderCell>
                                            <DataTableHeaderCell align="right" className="bg-primary/5 text-primary font-bold">LP Total Dist</DataTableHeaderCell>
                                            <DataTableHeaderCell align="right">LP Cash-on-Cash</DataTableHeaderCell>
                                        </>
                                    )}

                                    {/* GP Columns */}
                                    {(mode === 'gp' || mode === 'waterfall') && (
                                        <>
                                            <DataTableHeaderCell align="right" className="bg-secondary/10">GP Profit Split</DataTableHeaderCell>
                                            <DataTableHeaderCell align="right" className="bg-primary/5 text-primary font-bold">GP Total Dist</DataTableHeaderCell>
                                        </>
                                    )}
                                </DataTableHeader>
                                <DataTableBody>
                                    {dealReturns.annual.map((row) => (
                                        <DataTableRow key={row.yearIndex} className="hover:bg-surface-hover">
                                            <DataTableCell align="center" className="font-medium text-secondary">
                                                Year {row.yearNumber}
                                            </DataTableCell>
                                            <DataTableCell align="right" className="font-medium">
                                                {sFmt(row.annualCashFlow)}
                                            </DataTableCell>

                                            {/* LP Data */}
                                            {(mode === 'lp' || mode === 'waterfall' || mode === 'individual') && (
                                                <>
                                                    <DataTableCell align="right" className="text-success bg-success-light/10 font-medium">
                                                        {sFmt(row.lpPref)}
                                                    </DataTableCell>
                                                    <DataTableCell align="right" className="text-secondary bg-surface-subtle/30">
                                                        {sFmt(row.lpSplit)}
                                                    </DataTableCell>
                                                    <DataTableCell align="right" className="text-primary font-bold bg-primary/5">
                                                        {sFmt(row.lpTotalDist)}
                                                    </DataTableCell>
                                                    <DataTableCell align="right" className="text-secondary text-xs">
                                                        {fmtPct(row.lpCashOnCash)}
                                                    </DataTableCell>
                                                </>
                                            )}

                                            {/* GP Data */}
                                            {(mode === 'gp' || mode === 'waterfall') && (
                                                <>
                                                    <DataTableCell align="right" className="text-secondary bg-secondary/5">
                                                        {sFmt(row.gpSplit)}
                                                    </DataTableCell>
                                                    <DataTableCell align="right" className="text-primary font-bold bg-primary/5">
                                                        {sFmt(row.gpTotalDist)}
                                                    </DataTableCell>
                                                </>
                                            )}
                                        </DataTableRow>
                                    ))}
                                    
                                    {/* Summary Row */}
                                    <DataTableRow className="bg-surface-subtle font-bold">
                                        <DataTableCell align="center">Total</DataTableCell>
                                        <DataTableCell align="right">{sFmt(dealReturns.annual.reduce((s, r) => s + r.annualCashFlow, 0))}</DataTableCell>
                                        
                                        {(mode === 'lp' || mode === 'waterfall' || mode === 'individual') && (
                                            <>
                                                <DataTableCell align="right" className="text-success">{sFmt(dealReturns.annual.reduce((s, r) => s + r.lpPref, 0))}</DataTableCell>
                                                <DataTableCell align="right" className="text-secondary">{sFmt(dealReturns.annual.reduce((s, r) => s + r.lpSplit, 0))}</DataTableCell>
                                                <DataTableCell align="right" className="text-primary">{sFmt(dealReturns.lp.totalDistributions)}</DataTableCell>
                                                <DataTableCell align="right">-</DataTableCell>
                                            </>
                                        )}

                                        {(mode === 'gp' || mode === 'waterfall') && (
                                            <>
                                                <DataTableCell align="right" className="text-secondary">{sFmt(dealReturns.annual.reduce((s, r) => s + r.gpSplit, 0))}</DataTableCell>
                                                <DataTableCell align="right" className="text-primary">{sFmt(dealReturns.gp.totalDistributions)}</DataTableCell>
                                            </>
                                        )}
                                    </DataTableRow>
                                </DataTableBody>
                            </DataTable>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="px-6 py-4 bg-white border-t border-border flex justify-between items-center flex-shrink-0">
                    <div className="text-xs text-muted">
                        {mode === 'individual' 
                            ? "Figures derived from your specific share of the LP pool based on investment amount."
                            : mode === 'gp'
                            ? "GP returns are purely performance-based with $0 initial capital contribution."
                            : "Figures represent total deal-level cash flows allocated to the respective partner class."
                        }
                    </div>
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-lg shadow-md transition-all"
                    >
                        Close
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ReturnsDetailModal;
