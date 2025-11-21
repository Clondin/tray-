
import React, { useMemo, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { calculateInvestorReturns } from '../../utils/investorReturnsCalculations';
import { runDebtSizingEngine } from '../../utils/loanCalculations';
import { fmt, fmtPct } from '../../utils/formatters';
import { SectionCard } from '../../components/common/SectionCard';
import { KpiCard } from '../../components/common/KpiCard';
import { User, DollarSign, TrendingUp, Layers, BarChart } from '../../components/icons';

interface IndividualInvestorProps {
    onShowDetails: (investmentAmount: number, userShare: number) => void;
}

const IndividualInvestor: React.FC<IndividualInvestorProps> = ({ onShowDetails }) => {
    const {
        currentPortfolio,
        financingScenario,
        assumptions,
        investorReturnsScenario,
    } = useAppStore(state => ({
        currentPortfolio: state.currentPortfolio,
        financingScenario: state.financingScenario,
        assumptions: state.assumptions,
        investorReturnsScenario: state.investorReturnsScenario,
    }));

    const [investmentAmount, setInvestmentAmount] = useState(50000);

    const loanCalcs = useMemo(() => {
        if (!currentPortfolio) return null;
        return runDebtSizingEngine(financingScenario, currentPortfolio);
    }, [currentPortfolio, financingScenario]);

    const dealReturns = useMemo(() => {
        if (!currentPortfolio || !loanCalcs) return null;
        return calculateInvestorReturns(currentPortfolio, loanCalcs, assumptions, investorReturnsScenario, financingScenario);
    }, [currentPortfolio, loanCalcs, assumptions, investorReturnsScenario, financingScenario]);

    if (!dealReturns || !loanCalcs) return <div className="p-4 text-muted">Load a portfolio to see investor metrics.</div>;

    const totalEquityRequired = dealReturns.totalEquityRequired;
    
    // The LP Capital Pool is 100% of the Equity Required (LPs fund the entire equity check).
    const lpCapitalPoolSize = totalEquityRequired;
    
    // User's share of the LP Pool is simply their check size divided by total equity needed.
    // Ensure investmentAmount doesn't exceed total equity for calculation logic
    const validInvestment = Math.min(investmentAmount, lpCapitalPoolSize);
    const userShareOfLPPool = lpCapitalPoolSize > 0 ? validInvestment / lpCapitalPoolSize : 0;

    // The return metrics (cash flow) for the user are their share of the *Total LP Distributions*.
    const userTotalReturn = dealReturns.lp.totalDistributions * userShareOfLPPool;
    
    // Percentage-based metrics apply equally to the individual as they do to the LP class aggregate
    const userAvgCoC = dealReturns.lp.averageCashOnCash; 
    const userIRR = dealReturns.lp.irr;
    const userEquityMultiple = dealReturns.lp.equityMultiple;

    const handleCardClick = () => {
        onShowDetails(validInvestment, userShareOfLPPool);
    };

    const setMax = () => {
        setInvestmentAmount(totalEquityRequired);
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                <div className="md:col-span-4 space-y-4">
                    <SectionCard title="Investment Inputs">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-secondary uppercase tracking-wider">Your Check Size</label>
                                <button onClick={setMax} className="text-[10px] font-bold text-accent hover:underline uppercase">Max (100%)</button>
                            </div>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">$</div>
                                <input 
                                    type="number" 
                                    value={investmentAmount}
                                    onChange={(e) => setInvestmentAmount(parseFloat(e.target.value) || 0)}
                                    step={5000}
                                    className="w-full pl-8 pr-4 py-3 bg-white border border-border rounded-xl shadow-sm text-lg font-bold text-primary focus:ring-2 focus:ring-accent/20 focus:border-accent"
                                />
                            </div>
                            <div className="flex justify-between items-center mt-3 p-2 bg-surface-subtle rounded border border-border">
                                <span className="text-xs text-secondary">LP Pool Ownership</span>
                                {/* Multiply by 100 for display, fmtPct handles % suffix */}
                                <span className="text-xs font-bold text-primary">{fmtPct(userShareOfLPPool * 100)}</span>
                            </div>
                            <div className="flex justify-between items-center mt-1 p-2 bg-surface-subtle rounded border border-border">
                                <span className="text-xs text-secondary">Total Deal Equity</span>
                                <span className="text-xs font-medium text-secondary">{fmt(totalEquityRequired)}</span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border space-y-3">
                            <h4 className="text-sm font-semibold text-primary">Terms applied to your capital:</h4>
                            <div className="flex justify-between text-sm">
                                <span className="text-secondary">Preferred Return</span>
                                <span className="font-bold text-success bg-success-light px-2 py-0.5 rounded">{fmtPct(investorReturnsScenario.lpPreferredReturnRate * 100)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-secondary">Profit Split</span>
                                <span className="font-bold text-primary">{fmtPct(investorReturnsScenario.lpOwnershipPercent * 100)}</span>
                            </div>
                        </div>
                    </SectionCard>
                </div>

                <div className="md:col-span-8">
                     <div className="grid grid-cols-2 gap-4 mb-4">
                        <KpiCard 
                            label="Avg. Cash-on-Cash"
                            value={fmtPct(userAvgCoC * 100)}
                            subValue="Yearly Operating Yield"
                            icon={<BarChart className="w-5 h-5"/>}
                            onClick={handleCardClick}
                            className="bg-white hover:bg-white"
                        />
                        <KpiCard 
                            label="Total Distributions"
                            value={fmt(userTotalReturn)}
                            subValue="Principal + Profit"
                            icon={<DollarSign className="w-5 h-5"/>}
                            onClick={handleCardClick}
                            className="bg-white hover:bg-white"
                        />
                        <KpiCard 
                            label="IRR"
                            value={fmtPct(userIRR)}
                            subValue={`Over ${financingScenario.termYears}-Year Term`}
                            icon={<TrendingUp className="w-5 h-5"/>}
                            onClick={handleCardClick}
                            className="bg-white hover:bg-white"
                        />
                        <KpiCard 
                            label="Equity Multiple"
                            value={userEquityMultiple ? `${userEquityMultiple.toFixed(2)}x` : '0.00x'}
                            icon={<Layers className="w-5 h-5"/>}
                            onClick={handleCardClick}
                            className="bg-white hover:bg-white"
                        />
                    </div>
                    <div className="p-4 bg-blue-50 text-blue-900 text-sm rounded-lg border border-blue-100 leading-relaxed shadow-sm">
                        <strong className="block mb-1">Return Logic Verification:</strong> 
                        Your ${fmt(validInvestment)} investment represents {fmtPct(userShareOfLPPool * 100)} of the LP equity. 
                        You receive a {fmtPct(investorReturnsScenario.lpPreferredReturnRate*100)} preferred return on your capital annually (paid first). 
                        Remaining deal profits are split {fmtPct(investorReturnsScenario.lpOwnershipPercent*100)} to LPs (you) and {fmtPct(investorReturnsScenario.gpOwnershipPercent*100)} to the Sponsor.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IndividualInvestor;
