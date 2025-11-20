
import React, { useMemo } from 'react';
import { useAppStore } from '../../store/appStore';
import { SectionCard } from '../../components/common/SectionCard';
import { fmt, fmtPct } from '../../utils/formatters';
import { runDebtSizingEngine } from '../../utils/loanCalculations';
import { calculateInvestorReturns } from '../../utils/investorReturnsCalculations';

const Step: React.FC<{ label: string, value: string | number, formula: string, resultType?: 'currency' | 'percent' | 'number' }> = ({ label, value, formula, resultType = 'number' }) => {
    const formattedValue = resultType === 'currency' ? fmt(Number(value)) : resultType === 'percent' ? fmtPct(Number(value)) : value;
    return (
        <div className="p-4 bg-surface-subtle border border-border rounded-lg space-y-2">
            <div className="flex justify-between items-start">
                <span className="font-semibold text-primary text-sm">{label}</span>
                <span className="font-mono font-bold text-accent">{formattedValue}</span>
            </div>
            <div className="text-xs font-mono text-muted bg-white p-2 rounded border border-border-subtle break-all">
                {formula}
            </div>
        </div>
    );
};

const MathAudit: React.FC = () => {
    const { 
        currentPortfolio, 
        assumptions, 
        financingScenario,
        investorReturnsScenario
    } = useAppStore(state => ({
        currentPortfolio: state.currentPortfolio,
        assumptions: state.assumptions,
        financingScenario: state.financingScenario,
        investorReturnsScenario: state.investorReturnsScenario
    }));

    const loanCalcs = useMemo(() => {
        if (!currentPortfolio) return null;
        return runDebtSizingEngine(financingScenario, currentPortfolio);
    }, [financingScenario, currentPortfolio]);

    const dealReturns = useMemo(() => {
        if (!currentPortfolio || !loanCalcs) return null;
        return calculateInvestorReturns(currentPortfolio, loanCalcs, assumptions, investorReturnsScenario, financingScenario);
    }, [currentPortfolio, loanCalcs, assumptions, investorReturnsScenario, financingScenario]);

    if (!currentPortfolio || !loanCalcs || !dealReturns) return <div>Loading Data...</div>;

    const totalRooms = currentPortfolio.totalRooms;
    const price = currentPortfolio.valuation.askingPrice;
    const stabilizedNOI = currentPortfolio.stabilized.noi;
    
    return (
        <div className="space-y-8 animate-fade-in pb-12">
             <header>
                <h2 className="text-2xl font-bold text-primary">Math Audit & Verification</h2>
                <p className="text-secondary text-sm mt-1">Transparent breakdown of all core calculations driving the model.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* 0. Operational Calculations */}
                <SectionCard title="1. Operational NOI Logic">
                    <div className="space-y-4">
                         <Step 
                            label="Potential Gross Income (Stabilized)"
                            value={currentPortfolio.stabilized.gri / (currentPortfolio.stabilized.occupancy / 100)}
                            resultType="currency"
                            formula={`Sum(Unit Pro Forma Rents) × 12`}
                        />
                        <Step 
                            label="Effective Gross Income (EGI)"
                            value={currentPortfolio.stabilized.gri}
                            resultType="currency"
                            formula={`Potential Gross Income × Stabilized Occupancy [${fmtPct(currentPortfolio.stabilized.occupancy)}]`}
                        />
                        <Step 
                            label="Operating Expenses"
                            value={currentPortfolio.stabilized.opex}
                            resultType="currency"
                            formula={`Sum(Taxes + Insurance + Admin + Repairs + Mgmt + Utilities...)`}
                        />
                        <Step 
                            label="Net Operating Income (NOI)"
                            value={stabilizedNOI}
                            resultType="currency"
                            formula={`EGI [${fmt(currentPortfolio.stabilized.gri)}] - OpEx [${fmt(currentPortfolio.stabilized.opex)}]`}
                        />
                    </div>
                </SectionCard>
                
                {/* 1. Valuation & NOI */}
                <SectionCard title="2. Valuation & Exit">
                    <div className="space-y-4">
                        <Step 
                            label="NOI Growth Projection (Operating Leverage)"
                            value="Variable"
                            resultType="number"
                            formula={`NOI_Year_N = (GRI × (1 + ${assumptions.rentGrowth}%)^n) - (OpEx × (1 + ${assumptions.opexGrowth}%)^n)`}
                        />
                        <Step 
                            label="Stabilized Valuation (Exit Price)"
                            value={currentPortfolio.valuation.stabilizedValue}
                            resultType="currency"
                            formula={`NOI [${fmt(stabilizedNOI)}] / Exit Cap Rate [${fmtPct(assumptions.capRate)}]`}
                        />
                         <Step 
                            label="Yield on Cost (Cap Rate)"
                            value={currentPortfolio.stabilized.capRate}
                            resultType="percent"
                            formula={`NOI [${fmt(stabilizedNOI)}] / Purchase Price [${fmt(price)}]`}
                        />
                    </div>
                </SectionCard>

                {/* 2. Loan Sizing */}
                <SectionCard title="3. Debt Sizing & Service">
                    <div className="space-y-4">
                        <Step 
                            label="Constraint: Max Loan by LTV"
                            value={loanCalcs.maxLoanByLTV}
                            resultType="currency"
                            formula={`Purchase Price [${fmt(price)}] × Target LTV [${financingScenario.targetLTV}%]`}
                        />
                        <Step 
                            label="Constraint: Max Loan by DSCR"
                            value={loanCalcs.maxLoanByDSCR}
                            resultType="currency"
                            formula={`NOI [${fmt(stabilizedNOI)}] / (Target DSCR [${financingScenario.targetDSCR}] × Debt Constant)`}
                        />
                        <Step 
                            label="Effective Loan Amount"
                            value={loanCalcs.effectiveLoanAmount}
                            resultType="currency"
                            formula={`Sizing Method: ${financingScenario.sizingMethod.toUpperCase()}`}
                        />
                         <Step 
                            label="Annual Debt Service"
                            value={loanCalcs.annualDebtService}
                            resultType="currency"
                            formula={`Loan Amount × Annual Debt Constant (derived from ${financingScenario.interestRate}% Rate)`}
                        />
                    </div>
                </SectionCard>

                {/* 3. Closing Costs Breakdown */}
                <SectionCard title="4. Transaction Costs Breakdown">
                     <div className="space-y-4">
                        <Step 
                            label="Origination Fee"
                            value={loanCalcs.effectiveLoanAmount * (financingScenario.costs.origination / 100)}
                            resultType="currency"
                            formula={`Loan Amount [${fmt(loanCalcs.effectiveLoanAmount)}] × ${financingScenario.costs.origination}%`}
                        />
                        <Step 
                            label="Total Closing Costs"
                            value={loanCalcs.totalClosingCosts}
                            resultType="currency"
                            formula={`Origination + Legal + Title + Reports + Reserves + Misc (Sum of all input fields)`}
                        />
                        <Step 
                            label="Total Project Cost (All In)"
                            value={loanCalcs.totalCost}
                            resultType="currency"
                            formula={`Purchase Price [${fmt(price)}] + Total Closing Costs [${fmt(loanCalcs.totalClosingCosts)}]`}
                        />
                         <Step 
                            label="Equity Required"
                            value={loanCalcs.equityRequired}
                            resultType="currency"
                            formula={`Total Project Cost [${fmt(loanCalcs.totalCost)}] - Loan Amount [${fmt(loanCalcs.effectiveLoanAmount)}]`}
                        />
                     </div>
                </SectionCard>

                {/* 4. Investor Returns & Waterfall */}
                <SectionCard title="5. Returns Waterfall">
                    <div className="space-y-4">
                         <Step 
                            label="Distributable Cash (Operating)"
                            value="Variable"
                            resultType="currency"
                            formula={`Yearly NOI - Yearly Debt Service (excludes Sale Proceeds)`}
                        />
                        <Step 
                            label="Step 1: LP Preferred Return"
                            value={investorReturnsScenario.lpPreferredReturnRate * 100}
                            resultType="percent"
                            formula={`LP Contribution [${fmt(dealReturns.lp.capitalContribution)}] × Pref Rate`}
                        />
                         <Step 
                            label="Step 2: Residual Split"
                            value="Split"
                            resultType="number"
                            formula={`Remaining Cash × LP (${investorReturnsScenario.lpOwnershipPercent * 100}%) / GP (${investorReturnsScenario.gpOwnershipPercent * 100}%)`}
                        />
                        <Step 
                            label="Avg. Cash-on-Cash"
                            value={dealReturns.lp.averageCashOnCash * 100}
                            resultType="percent"
                            formula={`Average of (Annual Operating Distribution / Initial LP Capital). Excludes Sale.`}
                        />
                        <Step 
                            label="Equity Multiple"
                            value={dealReturns.lp.equityMultiple}
                            resultType="number"
                            formula={`Total Distributions (Ops + Sale) / Contribution [${fmt(dealReturns.lp.capitalContribution)}]`}
                        />
                    </div>
                </SectionCard>

                {/* 5. Amortization Logic */}
                <SectionCard title="6. Amortization & Balance">
                    <div className="space-y-4">
                        <Step 
                            label="Monthly Payment"
                            value={loanCalcs.monthlyPAndIPayment}
                            resultType="currency"
                            formula={`PMT(rate=${(financingScenario.interestRate/12/100).toFixed(4)}, nper=${financingScenario.amortizationYears * 12}, pv=${fmt(loanCalcs.effectiveLoanAmount)})`}
                        />
                         <Step 
                            label="Balloon Payment"
                            value={loanCalcs.balloonPayment}
                            resultType="currency"
                            formula={`Remaining Principal Balance at End of Term (Year ${financingScenario.termYears})`}
                        />
                    </div>
                </SectionCard>

            </div>
        </div>
    );
};

export default MathAudit;
