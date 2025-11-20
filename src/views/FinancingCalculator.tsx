
import React, { useState, useMemo, useEffect } from 'react';
// Fix: Corrected the import for MetricCard to be a default import.
// Fix: Import FinancingScenario to adapt to the new loan calculation engine.
import type { Portfolio, CommercialLoanParams, AmortizationEntry, FinancingScenario } from '../types';
import { Card } from '../components/Card';
import { InputSlider } from '../components/InputSlider';
import MetricCard from '../components/MetricCard';
import { fmt } from '../utils/formatters';
// Fix: Replaced the deprecated `calculateLoanMetrics` with the new `runDebtSizingEngine`.
import { runDebtSizingEngine } from '../utils/loanCalculations';
import { generateAmortizationSchedule } from '../utils/amortization';

interface FinancingCalculatorProps {
    portfolios: Portfolio[];
    calculatePortfolio: (id: string) => any;
}

const FinancingCalculator: React.FC<FinancingCalculatorProps> = ({ portfolios, calculatePortfolio }) => {
    const [financingPortfolioId, setFinancingPortfolioId] = useState('full');
    const portfolio = useMemo(() => calculatePortfolio(financingPortfolioId), [financingPortfolioId, calculatePortfolio]);
    
    const [loanParams, setLoanParams] = useState<CommercialLoanParams>({
        loanAmount: (portfolio?.valuation?.askingPrice || 0) * 0.75,
        purchasePrice: portfolio?.valuation?.askingPrice || 0,
        additionalCosts: 0,
        interestRate: 7.5,
        amortizationYears: 30,
        termYears: 10,
        ioPeriodMonths: 0,
    });
    
    useEffect(() => {
        const newPrice = portfolio?.valuation?.askingPrice || 0;
        const ltv = newPrice > 0 ? (loanParams.loanAmount / newPrice) * 100 : 0;
        setLoanParams(p => ({ 
            ...p, 
            purchasePrice: newPrice,
            loanAmount: newPrice * (ltv / 100)
        }));
    }, [portfolio, loanParams.loanAmount]);

    const handleLoanParamChange = (field: keyof CommercialLoanParams, value: number) => {
        setLoanParams(p => ({ ...p, [field]: value }));
    };

    const loanCalcs = useMemo(() => {
        if (!portfolio) return null;
        // Fix: Adapt the old loan parameters to the new financing scenario structure required by `runDebtSizingEngine`.
        const scenario: FinancingScenario = {
            sizingMethod: 'manual',
            manualLoanAmount: loanParams.loanAmount,
            interestRate: loanParams.interestRate,
            amortizationYears: loanParams.amortizationYears,
            termYears: loanParams.termYears,
            ioPeriodMonths: loanParams.ioPeriodMonths,
            targetDSCR: 1.25,
            targetLTV: 75,
            costs: {
                origination: 0,
                legal: 0,
                thirdParty: 0,
                misc: loanParams.additionalCosts,
                title: 0,
                reserves: 0,
                inspection: 0,
                appraisal: 0,
                mortgageFees: 0,
                acquisitionFee: 0
            }
        };
        return runDebtSizingEngine(scenario, portfolio);
    }, [loanParams, portfolio]);

    const amortizationSchedule = useMemo(() => {
        if (!loanCalcs) return [];
        return generateAmortizationSchedule(loanParams, loanCalcs);
    }, [loanParams, loanCalcs]);

    return (
        <div className="space-y-8 animate-fade-in">
            <header>
                <h2 className="text-2xl font-bold text-gray-900">Financing Calculator</h2>
                 <div className="flex items-center gap-4 mt-2">
                    <label htmlFor="financing-portfolio-select" className="text-sm font-medium text-gray-600">Select Portfolio:</label>
                    <select id="financing-portfolio-select" value={financingPortfolioId} onChange={(e) => setFinancingPortfolioId(e.target.value)} className="form-select block w-full max-w-xs pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm rounded-md">
                        {portfolios.map((p: Portfolio) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <Card className="lg:col-span-3 space-y-6">
                    <h3 className="font-bold text-lg">Commercial Loan Inputs</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label><input type="text" value={fmt(loanParams.purchasePrice)} disabled className="w-full form-input bg-gray-100" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Additional Costs (Closing, Rehab)</label><input type="number" value={loanParams.additionalCosts} onChange={e => handleLoanParamChange('additionalCosts', parseFloat(e.target.value) || 0)} className="w-full form-input" /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Loan Amount</label><input type="number" value={loanParams.loanAmount} onChange={e => handleLoanParamChange('loanAmount', parseFloat(e.target.value) || 0)} className="w-full form-input" /></div>
                    
                    <InputSlider label="Interest Rate" value={loanParams.interestRate} onChange={v => handleLoanParamChange('interestRate', v)} min={3} max={12} step={0.125} displayFormat={v => `${v.toFixed(3)}%`}/>
                    <InputSlider label="Interest-Only Period" value={loanParams.ioPeriodMonths} onChange={v => handleLoanParamChange('ioPeriodMonths', v)} min={0} max={loanParams.termYears * 12} step={1} displayFormat={(v) => `${v} months`}/>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Loan Term</label>
                            <select value={loanParams.termYears} onChange={e => handleLoanParamChange('termYears', parseInt(e.target.value))} className="w-full form-select">
                                {[3,5,7,10].map(y => <option key={y} value={y}>{y} Years</option>)}
                            </select>
                        </div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Amortization Period</label>
                            <select value={loanParams.amortizationYears} onChange={e => handleLoanParamChange('amortizationYears', parseInt(e.target.value))} className="w-full form-select">
                                {[20,25,30].map(y => <option key={y} value={y}>{y} Years</option>)}
                            </select>
                        </div>
                    </div>
                </Card>
                <div className="lg:col-span-2 space-y-4">
                     <h3 className="font-bold text-lg">Key Metrics</h3>
                     {loanCalcs ? (
                         <div className="grid grid-cols-2 gap-4">
                             <MetricCard label="Equity Required" value={loanCalcs.equityRequired} subValue={`${(100 - (loanParams.loanAmount / loanCalcs.totalCost * 100) || 0).toFixed(1)}% of cost`} icon={<></>} />
                             <MetricCard label="Loan-to-Value" value={((loanParams.loanAmount / loanParams.purchasePrice * 100) || 0)} subValue="Based on price" icon={<></>} />
                             <MetricCard label="DSCR (Current)" value={loanCalcs.dscrCurrent} icon={<></>} />
                             <MetricCard label="DSCR (Stabilized)" value={loanCalcs.dscrStabilized} icon={<></>} />
                             {/* Fix: Use the correct property `monthlyIOPayment` from the loan calculation results. */}
                             <MetricCard label="I/O Payment" value={loanCalcs.monthlyIOPayment} subValue="per month" icon={<></>} />
                             {/* Fix: Use the correct property `monthlyPAndIPayment` from the loan calculation results. */}
                             <MetricCard label="P&I Payment" value={loanCalcs.monthlyPAndIPayment} subValue="per month" icon={<></>} />
                             <MetricCard label="Annual Debt" value={loanCalcs.annualDebtService} icon={<></>} />
                             <MetricCard label="Balloon Payment" value={loanCalcs.balloonPayment} subValue={`@ Year ${loanParams.termYears}`} icon={<></>} />
                         </div>
                     ) : <p className="text-center text-gray-500">Enter valid loan details.</p>}
                </div>
                <Card className="lg:col-span-5">
                    <h3 className="font-bold text-lg mb-4">Amortization Schedule</h3>
                    <div className="max-h-96 overflow-y-auto border rounded-xl">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0"><tr className="text-left">
                            <th className="p-3">Year</th><th className="p-3 text-right">Principal Paid</th><th className="p-3 text-right">Interest Paid</th><th className="p-3 text-right">Remaining Balance</th>
                        </tr></thead>
                        <tbody className="divide-y">
                            {amortizationSchedule.map(row => (
                            <tr key={row.year}>
                                <td className="p-3">{row.year}</td><td className="p-3 text-right">{fmt(row.principal)}</td><td className="p-3 text-right">{fmt(row.interest)}</td><td className="p-3 text-right">{fmt(row.remainingBalance)}</td>
                            </tr>
                            ))}
                            {loanCalcs && (
                                <tr className="bg-gray-100 font-bold">
                                    <td className="p-3">End of Term ({loanParams.termYears} yrs)</td>
                                    <td colSpan={2} className="p-3 text-gray-600 text-right">Balloon Payment Due</td>
                                    <td className="p-3 text-right text-rose-600">{fmt(loanCalcs.balloonPayment)}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default FinancingCalculator;
