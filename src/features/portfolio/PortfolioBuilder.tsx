
import React, { useMemo, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import type { Portfolio, CalculatedProperty } from '../../types';
import { Plus, Trash2, ArrowUp, Search, Building2, Check } from '../../components/icons';
import { fmt, fmtPct } from '../../utils/formatters';
import { DataTable, DataTableHeader, DataTableHeaderCell, DataTableBody, DataTableRow, DataTableCell } from '../../components/common/DataTable';
import { Tag } from '../../components/common/Tag';
import { PortfolioMetricsBar } from './PortfolioMetricsBar';

type SortableKeys = 'address' | 'rooms' | 'currentOccupancy' | 'currentNOI' | 'stabilizedNOI' | 'upside' | 'price';

const SortableHeader: React.FC<{
  label: string;
  sortKey: SortableKeys;
  align?: 'left' | 'center' | 'right';
  sortConfig: { key: SortableKeys; direction: 'ascending' | 'descending' };
  requestSort: (key: SortableKeys) => void;
}> = ({ label, sortKey, align = 'left', sortConfig, requestSort }) => {
  const isActive = sortConfig.key === sortKey;
  const directionIcon = sortConfig.direction === 'ascending' ? '' : 'transform rotate-180';
  return (
    <DataTableHeaderCell align={align}>
      <button onClick={() => requestSort(sortKey)} className="group inline-flex items-center gap-1 hover:text-primary transition-colors font-semibold">
        <span>{label}</span>
        <ArrowUp className={`w-3 h-3 transition-opacity duration-200 ${isActive ? 'opacity-100 text-accent' : 'opacity-0 group-hover:opacity-50'} ${directionIcon}`} />
      </button>
    </DataTableHeaderCell>
  );
};

const PortfolioBuilder: React.FC = () => {
  const { 
    portfolios, 
    calculatedProperties, 
    selectedPortfolioId, 
    setSelectedPortfolioId, 
    addPortfolio, 
    deletePortfolio, 
    togglePropertyInPortfolio,
    currentPortfolio,
    openPropertyModal
  } = useAppStore(state => ({
    portfolios: state.portfolios,
    calculatedProperties: state.calculatedProperties,
    selectedPortfolioId: state.selectedPortfolioId,
    setSelectedPortfolioId: state.setSelectedPortfolioId,
    addPortfolio: state.addPortfolio,
    deletePortfolio: state.deletePortfolio,
    togglePropertyInPortfolio: state.togglePropertyInPortfolio,
    currentPortfolio: state.currentPortfolio,
    openPropertyModal: state.openPropertyModal,
  }));

  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' }>({ key: 'currentNOI', direction: 'descending' });
  const [filterText, setFilterText] = useState('');

  const sortedCalculatedProperties = useMemo(() => {
    let sortableItems = [...calculatedProperties];
    
    if (filterText) {
        sortableItems = sortableItems.filter(p => p.address.toLowerCase().includes(filterText.toLowerCase()));
    }

    if (sortConfig.key) {
        sortableItems.sort((a, b) => {
            let aValue: string | number, bValue: string | number;

            switch (sortConfig.key) {
                case 'currentOccupancy': aValue = a.current.occupancy; bValue = b.current.occupancy; break;
                case 'currentNOI': aValue = a.current.noi; bValue = b.current.noi; break;
                case 'stabilizedNOI': aValue = a.stabilized.noi; bValue = b.stabilized.noi; break;
                case 'upside': aValue = a.valuation.upside; bValue = b.valuation.upside; break;
                case 'price': aValue = a.valuation.askingPrice; bValue = b.valuation.askingPrice; break;
                default: aValue = a[sortConfig.key]; bValue = b[sortConfig.key]; break;
            }
            
            if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
    }
    return sortableItems;
  }, [calculatedProperties, sortConfig, filterText]);

  const requestSort = (key: SortableKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const isDefaultPortfolio = ['full', 'low-risk', 'high-risk'].includes(selectedPortfolioId);

  const getOccupancyVariant = (occ: number) => {
    if (occ >= 90) return 'success';
    if (occ >= 70) return 'warning';
    return 'danger';
  };
  
  return (
    <div className="space-y-6 animate-fade-in pb-8">
        <header className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-primary">Portfolio Builder</h2>
              <p className="text-secondary text-sm">Manage asset groupings and analyze aggregate performance.</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={addPortfolio} className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-md text-white bg-primary hover:bg-primary/90 transition-colors">
                <Plus className="w-4 h-4 mr-2" />New Portfolio
              </button>
            </div>
        </header>

        {/* Top Tabs for Portfolios */}
        <div className="flex overflow-x-auto gap-2 pb-2 border-b border-border no-scrollbar">
            {portfolios.map((portfolio: Portfolio) => {
                const isActive = selectedPortfolioId === portfolio.id;
                return (
                    <div key={portfolio.id} className="group relative">
                        <button 
                            onClick={() => setSelectedPortfolioId(portfolio.id)} 
                            className={`
                                px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all whitespace-nowrap
                                ${isActive 
                                    ? 'border-accent text-primary bg-white' 
                                    : 'border-transparent text-secondary hover:text-primary hover:bg-surface-subtle'}
                            `}
                        >
                            {portfolio.name} 
                            <span className={`ml-2 text-xs ${isActive ? 'text-accent' : 'text-muted'}`}>({portfolio.propertyIds.length})</span>
                        </button>
                         {!['full', 'low-risk', 'high-risk'].includes(portfolio.id) && isActive && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); deletePortfolio(portfolio.id); }} 
                                className="absolute top-1 right-1 p-1 text-muted hover:text-danger transition-colors"
                                title="Delete Portfolio"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                );
            })}
        </div>

        <PortfolioMetricsBar />
                
        <div className="bg-white rounded-xl border border-border shadow-card flex flex-col overflow-hidden relative">
            {/* Table Toolbar */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-white z-10">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-primary">{currentPortfolio?.name} Properties</h3>
                    <span className="text-xs text-secondary bg-surface-subtle px-2 py-0.5 rounded-full border border-border">
                        {currentPortfolio?.propertyCount} items
                    </span>
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input 
                        type="text" 
                        placeholder="Search address or city..." 
                        className="w-full pl-9 pr-4 py-1.5 text-sm border border-border rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                    />
                </div>
            </div>
            
            {/* Table Area */}
            <div className="overflow-x-auto">
                <DataTable className="w-full">
                    <DataTableHeader>
                        <DataTableHeaderCell className="w-12 text-center">
                            #
                        </DataTableHeaderCell>
                        <SortableHeader label="Property" sortKey="address" sortConfig={sortConfig} requestSort={requestSort} />
                        <SortableHeader label="Units" sortKey="rooms" align="center" sortConfig={sortConfig} requestSort={requestSort} />
                        <SortableHeader label="Occ %" sortKey="currentOccupancy" align="center" sortConfig={sortConfig} requestSort={requestSort} />
                        <SortableHeader label="NOI (Current)" sortKey="currentNOI" align="right" sortConfig={sortConfig} requestSort={requestSort} />
                        <SortableHeader label="NOI (Stab)" sortKey="stabilizedNOI" align="right" sortConfig={sortConfig} requestSort={requestSort} />
                    </DataTableHeader>
                    <DataTableBody>
                        {sortedCalculatedProperties.map((prop: CalculatedProperty) => {
                            const isSelected = currentPortfolio?.propertyIds.includes(prop.id);
                            return (
                            <DataTableRow 
                                key={prop.id} 
                                onClick={() => openPropertyModal(prop.id)}
                                className={`
                                    ${isSelected ? 'bg-accent-light/10' : ''}
                                `}
                            >
                                <DataTableCell>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            togglePropertyInPortfolio(selectedPortfolioId, prop.id);
                                        }}
                                        disabled={isDefaultPortfolio}
                                        className={`
                                            w-5 h-5 rounded border flex items-center justify-center transition-all mx-auto
                                            ${isSelected 
                                                ? 'bg-accent border-accent text-white shadow-sm scale-100' 
                                                : 'border-border hover:border-accent bg-white scale-95 hover:scale-100 text-transparent'}
                                            ${isDefaultPortfolio ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                        `}
                                    >
                                        <Check className="w-3 h-3" />
                                    </button>
                                </DataTableCell>
                                <DataTableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-surface-subtle flex items-center justify-center text-secondary flex-shrink-0">
                                            <Building2 className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-primary text-sm">{prop.address.split(',')[0]}</div>
                                            <div className="text-xs text-muted">{prop.city}</div>
                                        </div>
                                    </div>
                                </DataTableCell>
                                <DataTableCell align="center" className="text-secondary font-medium">{prop.rooms}</DataTableCell>
                                <DataTableCell align="center">
                                    <Tag variant={getOccupancyVariant(prop.current.occupancy)}>{fmtPct(prop.current.occupancy)}</Tag>
                                </DataTableCell>
                                <DataTableCell align="right" className="text-secondary font-medium">{fmt(prop.current.noi)}</DataTableCell>
                                <DataTableCell align="right" className="text-primary font-medium">{fmt(prop.stabilized.noi)}</DataTableCell>
                            </DataTableRow>
                            );
                        })}
                    </DataTableBody>
                </DataTable>
            </div>
        </div>
    </div>
  );
};

export default PortfolioBuilder;
