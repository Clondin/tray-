
import React, { useMemo, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { runDebtSizingEngine } from '../../utils/loanCalculations';
import { calculateInvestorReturns } from '../../utils/investorReturnsCalculations';
import { SectionCard } from '../../components/common/SectionCard';
import { KpiCard } from '../../components/common/KpiCard';
import { fmt, fmtPct } from '../../utils/formatters';
import { User, DollarSign, TrendingUp, Building2, Layers, BarChart, Briefcase } from '../../components/icons';
import IndividualInvestor from '../individual/IndividualInvestor';
import ReturnsDetailModal from './ReturnsDetailModal';

const WaterfallYearCard: React.FC<{ yearData: any, onClick: () => void }> = ({ yearData, onClick }) => (
    <div 
        onClick={onClick}
        className="flex flex-col p-3 bg-white rounded-lg border border-border shadow-sm min-w-[140px] space-y-2 cursor-pointer hover:border-accent hover:shadow-md transition-all"
    >
        <div className="text-xs font-bold text-secondary uppercase tracking-wider border-b border-border-subtle pb-1">Year {yearData.yearNumber}</div>
        
        <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
                <span className="text-muted">Cash Flow</span>
                <span className="font-medium text-primary">{fmt(yearData.annualCashFlow)}</span>
            </div>
            <div className="flex justify-between text-[10px]">
                <span className="text-success">LP Pref</span>
                <span className="font-medium text-success">{fmt(yearData.lpPref)}</span>
            </div>
             <div className="flex justify-between text-[10px]">
                <span className="text-secondary">LP Split</span>
                <span className="font-medium text-secondary">{fmt(yearData.lpSplit)}</span>
            </div>
             <div className="flex justify-between text-[10px]">
                <span className="text-secondary">GP Split</span>
                <span className="font-medium text-secondary">{fmt(yearData.gpSplit)}</span>
            </div>
        </div>
        
        <div className="pt-2 border-t border-border-subtle mt-auto">
            <div className="flex justify-between text-xs font-bold">
                <span className="text-primary">LP Total</span>
                <span className="text-primary">{fmt(yearData.lpTotalDist)}</span>
            </div>
            <div className="text-[10px] text-right text-muted mt-0.5">
                CoC: {fmtPct(yearData.lpCashOnCash * 100)}
            </div>
        </div>
    </div>
);

type ModalState = {
    type: 'lp' | 'gp' | 'waterfall' | 'individual';
    scalar: number;
} | null;

type ReturnTab = 'lp' | 'gp' | 'individual';

const InvestorReturns: React.FC = () => {
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

    const [activeTab, setActiveTab] = useState<ReturnTab>('lp');
    const [modalState, setModalState] = useState<ModalState>(null);

    const loanCalcs = useMemo(() => {
        if (!currentPortfolio) return null;
        return runDebtSizingEngine(financingScenario, currentPortfolio);
    }, [currentPortfolio, financingScenario]);

    const dealReturns = useMemo(() => {
        if (!currentPortfolio || !loanCalcs) return null;
        return calculateInvestorReturns(currentPortfolio, loanCalcs, assumptions, investorReturnsScenario, financingScenario);
    }, [currentPortfolio, loanCalcs, assumptions, investorReturnsScenario, financingScenario]);

    if (!currentPortfolio || !dealReturns) {
        return (
            <div className="animate-fade-in flex items-center justify-center h-64 text-muted">
                Build a portfolio and calculate financing to view returns.
            </div>
        );
    }

    const handleIndividualClick = (investmentAmount: number, userShare: number) => {
        setModalState({ type: 'individual', scalar: userShare });
    };

    const renderTabButton = (id: ReturnTab, label: string, icon: React.ReactNode) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`
                flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all
                ${activeTab === id 
                    ? 'border-accent text-primary' 
                    : 'border-transparent text-secondary hover:text-primary hover:bg-surface-subtle'
                }
            `}
        >
            {icon}
            {label}
        </button>
    );

    return (
        <div className="space-y-6 animate-fade-in relative">
            <header>
                <h2 className="text-2xl font-bold text-primary">Investor Returns</h2>
                <p className="text-secondary text-sm mt-1">Waterfall distribution modeling and equity performance analysis.</p>
            </header>

            {/* Tabs */}
            <div className="flex border-b border-border mb-6 overflow-x-auto">
                {renderTabButton('lp', 'LP Returns', <User className="w-4 h-4" />)}
                {renderTabButton('gp', 'GP Returns', <Building2 className="w-4 h-4" />)}
                {renderTabButton('individual', 'Individual Investor', <DollarSign className="w-4 h-4" />)}
            </div>

            {/* LP RETURNS VIEW */}
            {activeTab === 'lp' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <KpiCard 
                            label="LP IRR" 
                            value={fmtPct(dealReturns.lp.irr)} 
                            subValue={`Over ${financingScenario.termYears}-Year Term`}
                            icon={<TrendingUp className="w-5 h-5" />}
                            highlight
                            onClick={() => setModalState({ type: 'lp', scalar: 1 })}
                        />
                        <KpiCard 
                            label="LP Equity Multiple" 
                            value={dealReturns.lp.equityMultiple ? `${dealReturns.lp.equityMultiple.toFixed(2)}x` : '0.00x'} 
                            subValue="Total Return / Capital"
                            icon={<Layers className="w-5 h-5" />} 
                            onClick={() => setModalState({ type: 'lp', scalar: 1 })}
                        />
                        <KpiCard 
                            label="Avg. Cash-on-Cash" 
                            value={fmtPct(dealReturns.lp.averageCashOnCash * 100)}
                            subValue="Yearly Operating Yield"
                            icon={<BarChart className="w-5 h-5" />} 
                            onClick={() => setModalState({ type: 'lp', scalar: 1 })}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1">
                            <SectionCard title="LP Equity Structure">
                                <div className="space-y-4">
                                    <div className="p-4 bg-surface-subtle rounded-lg border border-border">
                                        <div className="text-xs text-secondary uppercase mb-1">LP Contribution</div>
                                        <div className="text-xl font-bold text-primary">{fmt(dealReturns.lp.capitalContribution)}</div>
                                        <div className="text-xs text-muted mt-1">
                                            100% of Required Equity
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4 border-t border-border space-y-3">
                                        <div className="flex justify-between text-sm items-center">
                                            <span className="text-secondary">Preferred Return</span>
                                            <span className="font-bold text-success bg-success-light px-2 py-0.5 rounded">{fmtPct(investorReturnsScenario.lpPreferredReturnRate*100)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm items-center">
                                            <span className="text-secondary">Profit Split</span>
                                            <span className="font-medium text-primary">Pari Passu ({fmtPct(investorReturnsScenario.lpOwnershipPercent*100)})</span>
                                        </div>
                                        <div className="flex justify-between text-sm items-center">
                                            <span className="text-secondary">Total Profit</span>
                                            <span className="font-medium text-primary">{fmt(dealReturns.lp.totalProfit)}</span>
                                        </div>
                                    </div>
                                </div>
                            </SectionCard>
                        </div>

                        <div className="lg:col-span-2">
                            <SectionCard title="LP Distribution Waterfall">
                                <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                                     {dealReturns.annual.map(year => (
                                         <WaterfallYearCard 
                                            key={year.yearNumber} 
                                            yearData={year} 
                                            onClick={() => setModalState({ type: 'waterfall', scalar: 1 })}
                                        />
                                     ))}
                                </div>
                                <div className="mt-4 flex gap-6 text-xs text-secondary justify-center">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-success rounded-full"></div>
                                        <span>Preferred Return</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                                        <span>Residual Profit Share</span>
                                    </div>
                                </div>
                            </SectionCard>
                        </div>
                    </div>
                </div>
            )}

            {/* GP RETURNS VIEW */}
            {activeTab === 'gp' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <KpiCard 
                            label="Total Distributions" 
                            value={fmt(dealReturns.gp.totalDistributions)} 
                            icon={<Briefcase className="w-5 h-5" />} 
                            highlight
                            onClick={() => setModalState({ type: 'gp', scalar: 1 })}
                        />
                         <KpiCard 
                            label="Total Profit Participation" 
                            value={fmt(dealReturns.gp.totalProfit)} 
                            subValue="Based on 30% Split"
                            icon={<TrendingUp className="w-5 h-5" />} 
                            onClick={() => setModalState({ type: 'gp', scalar: 1 })}
                        />
                        <KpiCard 
                            label="Avg. Annual Payment" 
                            value={fmt(dealReturns.gp.totalDistributions / financingScenario.termYears)} 
                            subValue="Operating + Sale"
                            icon={<DollarSign className="w-5 h-5" />} 
                            onClick={() => setModalState({ type: 'gp', scalar: 1 })}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1">
                            <SectionCard title="GP Equity Structure">
                                <div className="space-y-4">
                                    <div className="p-4 bg-surface-subtle rounded-lg border border-border">
                                        <div className="text-xs text-secondary uppercase mb-1">Capital Contribution</div>
                                        <div className="text-xl font-bold text-primary">$0</div>
                                        <div className="text-xs text-muted mt-1">
                                            0% of Total Equity
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted italic">
                                        The GP receives a "Sweat Equity" promote position, participating in {fmtPct(investorReturnsScenario.gpOwnershipPercent*100)} of the residual profits after the LP Preferred Return is satisfied.
                                    </div>
                                    
                                    <div className="pt-4 border-t border-border space-y-3">
                                        <div className="flex justify-between text-sm items-center">
                                            <span className="text-secondary">Profit Split</span>
                                            <span className="font-medium text-primary">{fmtPct(investorReturnsScenario.gpOwnershipPercent*100)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm items-center">
                                            <span className="text-secondary">Total Profit</span>
                                            <span className="font-medium text-primary">{fmt(dealReturns.gp.totalProfit)}</span>
                                        </div>
                                    </div>
                                </div>
                            </SectionCard>
                        </div>

                        <div className="lg:col-span-2">
                            <SectionCard title="GP Annual Distributions">
                                <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                                     {dealReturns.annual.map(year => (
                                         <div key={year.yearNumber} onClick={() => setModalState({ type: 'gp', scalar: 1 })} className="flex flex-col p-3 bg-white rounded-lg border border-border shadow-sm min-w-[140px] space-y-2 cursor-pointer hover:border-accent hover:shadow-md transition-all">
                                            <div className="text-xs font-bold text-secondary uppercase tracking-wider border-b border-border-subtle pb-1">Year {year.yearNumber}</div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px]">
                                                    <span className="text-secondary">Split Share</span>
                                                    <span className="font-medium text-primary">{fmt(year.gpSplit)}</span>
                                                </div>
                                            </div>
                                            <div className="pt-2 border-t border-border-subtle mt-auto">
                                                <div className="flex justify-between text-xs font-bold">
                                                    <span className="text-primary">GP Total</span>
                                                    <span className="text-primary">{fmt(year.gpTotalDist)}</span>
                                                </div>
                                            </div>
                                         </div>
                                     ))}
                                </div>
                            </SectionCard>
                        </div>
                    </div>
                </div>
            )}

            {/* INDIVIDUAL INVESTOR VIEW */}
            {activeTab === 'individual' && (
                <IndividualInvestor onShowDetails={handleIndividualClick} />
            )}

            {/* Detail Modal */}
            {modalState && (
                <ReturnsDetailModal 
                    title={
                        modalState.type === 'individual' ? 'Individual Investor Cash Flow' :
                        modalState.type === 'lp' ? 'Limited Partner (LP) Cash Flow' :
                        modalState.type === 'gp' ? 'General Partner (GP) Cash Flow' :
                        'Distribution Waterfall'
                    }
                    dealReturns={dealReturns}
                    scalar={modalState.scalar}
                    mode={modalState.type}
                    onClose={() => setModalState(null)}
                />
            )}
        </div>
    );
};

export default InvestorReturns;
