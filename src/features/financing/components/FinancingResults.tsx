
import React from 'react';
import { useAppStore } from '../../../store/appStore';
import { ResultTile } from './ResultTile';
import { fmt, fmtPct } from '../../../utils/formatters';
import { Save } from '../../../components/icons';

interface FinancingResultsProps {
    results: any;
}

const FinancingResults: React.FC<FinancingResultsProps> = ({ results }) => {
    const { saveCurrentScenario } = useAppStore(state => ({
        saveCurrentScenario: state.saveCurrentScenario
    }));

    if (!results) {
        return (
            <div className="bg-bg-surface rounded-lg border border-border-subtle p-8 flex items-center justify-center h-full">
                <p className="text-text-muted">Enter loan inputs to see results.</p>
            </div>
        );
    }
    
    const handleSave = () => {
        const scenarioName = prompt("Enter a name for this scenario:", "Base Case");
        if(scenarioName) {
            saveCurrentScenario(scenarioName, results);
            alert(`Scenario "${scenarioName}" saved!`);
        }
    };

    // Safe formatter for generic numbers like DSCR
    const fmtX = (v: number | null | undefined) => {
        if (v === null || v === undefined || typeof v !== 'number') return '-';
        return v.toFixed(2) + 'x';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-body font-semibold text-text-primary">Scenario Results</h3>
                <button 
                    onClick={handleSave}
                    className="inline-flex items-center justify-center gap-2 px-3 py-1.5 border border-border-subtle text-small font-semibold rounded-md shadow-sm text-text-secondary bg-white hover:bg-bg-surface-soft"
                >
                    <Save className="w-4 h-4" /> Save Scenario
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <ResultTile
                    label="Effective Loan Amount"
                    value={results.effectiveLoanAmount}
                    formatter={fmt}
                    subValue={
                        <>
                            <span>LTV: {fmtPct(results.loanToValue)}</span>
                            <span>LTC: {fmtPct(results.loanToCost)}</span>
                        </>
                    }
                />
                <ResultTile
                    label="Equity Required"
                    value={results.equityRequired}
                    formatter={fmt}
                    subValue={`Total Cost: ${fmt(results.totalCost)}`}
                />
                <ResultTile
                    label="Total Closing Costs"
                    value={results.totalClosingCosts}
                    formatter={fmt}
                    subValue="Includes Origination"
                />
                <ResultTile
                    label="Annual Debt Service"
                    value={results.annualDebtService}
                    formatter={fmt}
                    subValue={`P&I: ${fmt(results.pAndIPayment)}/mo`}
                />
                 <ResultTile
                    label="I/O Payment"
                    value={results.ioPayment}
                    formatter={fmt}
                    subValue="per month, during I/O period"
                />
                <ResultTile
                    label="DSCR (Stabilized)"
                    value={results.dscrStabilized}
                    formatter={fmtX}
                    variant={results.dscrStabilized >= 1.25 ? 'success' : 'warning'}
                />
                <ResultTile
                    label="DSCR (Current)"
                    value={results.dscrCurrent}
                    formatter={fmtX}
                    variant={results.dscrCurrent >= 1.1 ? 'success' : 'danger'}
                />
                <ResultTile
                    label="Max Loan by DSCR"
                    value={results.maxLoanByDSCR}
                    formatter={fmt}
                />
                <ResultTile
                    label="Max Loan by LTV"
                    value={results.maxLoanByLTV}
                    formatter={fmt}
                />
                <ResultTile
                    label="Balloon at Maturity"
                    value={results.balloonPayment}
                    formatter={fmt}
                    colSpan={2}
                />
            </div>
        </div>
    );
};

export default FinancingResults;
