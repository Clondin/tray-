
import React from 'react';
import { useAppStore } from './store/appStore';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/ErrorBoundary';

import Overview from './features/overview/Overview';
import PortfolioBuilder from './features/portfolio/PortfolioBuilder';
import StressTest from './features/stress-test/StressTest';
import FinancingCalculator from './features/financing/FinancingCalculator';
import MathAudit from './features/audit/MathAudit';
import InvestorReturns from './features/investor-returns/InvestorReturns';
import SnapshotModal from './components/SnapshotModal';

const App: React.FC = () => {
  const { view } = useAppStore(state => ({
    view: state.view,
  }));

  const renderView = () => {
    switch (view) {
      case 'portfolio':
        return <PortfolioBuilder />;
      case 'expenses':
        return <StressTest />;
      case 'financing':
        return <FinancingCalculator />;
      case 'audit':
        return <MathAudit />;
      case 'returns':
        return <InvestorReturns />;
      case 'overview':
      default:
        return <Overview />;
    }
  };

  return (
    <ErrorBoundary>
        <AppLayout>
            <ErrorBoundary>
                {renderView()}
            </ErrorBoundary>
            <SnapshotModal />
        </AppLayout>
    </ErrorBoundary>
  );
};

export default App;
