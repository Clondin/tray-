
import React from 'react';
import { useAppStore } from '../../store/appStore';
import { Building2, Layers, Calculator, TrendingUp, ArrowUpRight, DollarSign, Hammer, ClipboardCheck } from '../../components/icons';

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="p-6 bg-white/60 backdrop-blur-md border border-white/50 rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-slate-800 flex items-center justify-center text-white mb-4 shadow-lg shadow-primary/20">
            {icon}
        </div>
        <h3 className="text-lg font-bold text-primary mb-2">{title}</h3>
        <p className="text-sm text-secondary leading-relaxed">{description}</p>
    </div>
);

const StepItem: React.FC<{ number: string; title: string; text: string }> = ({ number, title, text }) => (
    <div className="flex gap-4 items-start group">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-subtle border border-border flex items-center justify-center font-bold text-secondary group-hover:bg-accent group-hover:text-white group-hover:border-accent transition-colors">
            {number}
        </div>
        <div>
            <h4 className="font-bold text-primary text-sm">{title}</h4>
            <p className="text-xs text-secondary mt-1 leading-relaxed">{text}</p>
        </div>
    </div>
);

const LandingPage: React.FC = () => {
    const setView = useAppStore(state => state.setView);

    return (
        <div className="min-h-[90vh] flex flex-col items-center justify-center max-w-6xl mx-auto px-6 animate-fade-in py-12">
            
            {/* Hero Section */}
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-light border border-accent/20 text-accent text-xs font-bold uppercase tracking-wider mb-2 animate-slide-up">
                    v2.0 Public Beta
                </div>
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-primary animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    Underwrite Deals <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-500">With Precision.</span>
                </h1>
                <p className="text-lg text-secondary md:w-3/4 mx-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    A professional-grade tool for analyzing real estate portfolios, stress-testing assumptions, and structuring complex financing—all in your browser.
                </p>
                <div className="pt-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                    <button 
                        onClick={() => setView('overview')}
                        className="group relative px-8 py-4 bg-primary text-white font-bold rounded-xl shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-0.5 transition-all overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            Start Underwriting <ArrowUpRight className="w-4 h-4" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-800 to-slate-900 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full mb-20 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <FeatureCard 
                    icon={<Layers className="w-5 h-5" />}
                    title="Portfolio Builder"
                    description="Aggregate individual properties into custom portfolios. Analyze risk-adjusted returns across different asset mixes."
                />
                <FeatureCard 
                    icon={<Calculator className="w-5 h-5" />}
                    title="Stress Testing"
                    description="Adjust global assumptions for T12 vs. Pro Forma expenses. Model expense growth and rent lift scenarios."
                />
                <FeatureCard 
                    icon={<DollarSign className="w-5 h-5" />}
                    title="Debt Structuring"
                    description="Size loans via DSCR or LTV constraints. Calculate interest-only periods, amortization, and balloon payments."
                />
                <FeatureCard 
                    icon={<Hammer className="w-5 h-5" />}
                    title="Value-Add Plan"
                    description="Create unit renovation budgets. Project ROI based on CapEx spend and resulting rent premiums."
                />
            </div>

            {/* How It Works / Instructions */}
            <div className="w-full bg-white rounded-2xl border border-border shadow-card p-8 md:p-10 animate-slide-up" style={{ animationDelay: '0.5s' }}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-1 space-y-4">
                        <h2 className="text-2xl font-bold text-primary">How to Use</h2>
                        <p className="text-sm text-secondary">
                            ProForma is designed for speed and accuracy. Follow this workflow to build a complete investment thesis in minutes.
                        </p>
                        <div className="p-4 bg-surface-subtle rounded-lg border border-border">
                            <div className="flex items-center gap-2 text-accent font-bold text-xs uppercase tracking-wider mb-2">
                                <ClipboardCheck className="w-4 h-4" /> Pro Tip
                            </div>
                            <p className="text-xs text-secondary">
                                Use the <span className="font-semibold text-primary">Deal Menu</span> button in the top right to save your progress or export a JSON snapshot of your entire model.
                            </p>
                        </div>
                    </div>

                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <StepItem 
                            number="1" 
                            title="Build the Portfolio" 
                            text="Navigate to the 'Portfolio' tab to select properties from the database. Create custom groups (e.g., 'High Yield') to analyze specific subsets." 
                        />
                        <StepItem 
                            number="2" 
                            title="Refine Expenses" 
                            text="Go to 'Expenses' to toggle between T12 Actuals and Pro Forma. Click any property to granularly adjust line-items like taxes or insurance." 
                        />
                        <StepItem 
                            number="3" 
                            title="Plan Renovations" 
                            text="Enable renovations on specific properties. Set your CapEx budget per unit and the expected rent lift to calculate Value Creation." 
                        />
                        <StepItem 
                            number="4" 
                            title="Structure Financing" 
                            text="Input loan terms in the 'Financing' tab. Watch real-time DSCR and LTV calculations as you adjust interest rates and amortization." 
                        />
                        <StepItem 
                            number="5" 
                            title="Analyze Returns" 
                            text="View the 'Investor Returns' waterfall. Adjust LP/GP splits and preferred returns to see the final Equity Multiple and IRR." 
                        />
                        <StepItem 
                            number="6" 
                            title="Export Summary" 
                            text="On the Dashboard, click 'Print Executive Summary' to generate a PDF-ready report for lenders or partners." 
                        />
                    </div>
                </div>
            </div>

            <footer className="mt-12 text-center text-xs text-muted">
                &copy; {new Date().getFullYear()} TRAY Holdings. Professional Real Estate Financial Modeling.
            </footer>

        </div>
    );
};

export default LandingPage;
