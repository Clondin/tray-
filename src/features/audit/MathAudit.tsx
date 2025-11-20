
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
        <div className="space-y-8 animate-fade-in">
             <header>
                <h2 className="text-2xl font-bold text-primary">Math Audit & Verification</h2>
                <p className="text-secondary text-sm mt-1">Transparent breakdown of all core calculations driving the model.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* 1. Valuation & NOI */}
                <SectionCard title="1. Valuation & NOI Logic">
                    <div className="space-y-4">
                        <Step 
                            label="Net Operating Income (NOI)"
                            value={stabilizedNOI}
                            resultType="currency"
                            formula={`Gross Income [${fmt(currentPortfolio.stabilized.gri)}] - OpEx [${fmt(currentPortfolio.stabilized.opex)}]`}
                        />
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
                <SectionCard title="2. Debt Sizing & Service">
                    <div className="space-y-4">
                        <Step 
                            label="Effective Loan Amount"
                            value={loanCalcs.effectiveLoanAmount}
                            resultType="currency"
                            formula={`Purchase Price [${fmt(price)}] × Target LTV [${financingScenario.targetLTV}%]`}
                        />
                        <Step 
                            label="Equity Required"
                            value={loanCalcs.equityRequired}
                            resultType="currency"
                            formula={`(Price [${fmt(price)}] + Closing Costs [${fmt(loanCalcs.totalClosingCosts)}]) - Loan Amount [${fmt(loanCalcs.effectiveLoanAmount)}]`}
                        />
                         <Step 
                            label="Annual Debt Service"
                            value={loanCalcs.annualDebtService}
                            resultType="currency"
                            formula={`Loan Amount × Annual Debt Constant (derived from ${financingScenario.interestRate}% Rate)`}
                        />
                    </div>
                </SectionCard>

                {/* 3. Global Inputs Check */}
                 <SectionCard title="3. Global Inputs Check">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-secondary block">Purchase Price</span>
                            <span className="font-bold text-primary">{fmt(price)}</span>
                        </div>
                         <div>
                            <span className="text-secondary block">Total Rooms</span>
                            <span className="font-bold text-primary">{totalRooms}</span>
                        </div>
                        <div>
                            <span className="text-secondary block">Market Rent</span>
                            <span className="font-bold text-primary">{fmt(assumptions.marketRent)}/mo</span>
                        </div>
                         <div>
                            <span className="text-secondary block">OpEx</span>
                            <span className="font-bold text-primary">{fmt(assumptions.opexPerRoom)}/rm/yr</span>
                        </div>
                    </div>
                </SectionCard>

                {/* 4. Investor Returns & Waterfall */}
                <SectionCard title="4. Waterfall & Returns Engine">
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
                            label="Equity Multiple"
                            value={dealReturns.lp.equityMultiple}
                            resultType="number"
                            formula={`Total Distributions (Ops + Sale) / Contribution [${fmt(dealReturns.lp.capitalContribution)}]`}
                        />
                        <Step 
                            label="Avg. Cash-on-Cash (Operating)"
                            value={dealReturns.lp.averageCashOnCash * 100}
                            resultType="percent"
                            formula={`Average of (Operating Distribution / Capital). Excludes Sale Proceeds.`}
                        />
                    </div>
                </SectionCard>

                {/* 5. Amortization Logic */}
                <SectionCard title="5. Amortization & Balance">
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
