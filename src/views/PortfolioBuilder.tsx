
import React from 'react';
import type { Portfolio, CalculatedProperty } from '../types';
import { Plus, Trash2 } from '../components/icons';
import { fmt, fmtPct } from '../utils/formatters';

interface PortfolioBuilderProps {
  portfolios: Portfolio[];
  calculatedProperties: CalculatedProperty[];
  selectedPortfolioId: string;
  setSelectedPortfolioId: (id: string) => void;
  addPortfolio: () => void;
  deletePortfolio: (id: string) => void;
  togglePropertyInPortfolio: (portfolioId: string, propertyId: number) => void;
  calculatePortfolio: (id: string) => any;
}

const PortfolioBuilder: React.FC<PortfolioBuilderProps> = ({ portfolios, calculatedProperties, selectedPortfolioId, setSelectedPortfolioId, addPortfolio, deletePortfolio, togglePropertyInPortfolio, calculatePortfolio }) => {
  const selectedPortfolio = portfolios.find((p:Portfolio) => p.id === selectedPortfolioId);
  const isDefaultPortfolio = ['full', 'low-risk', 'high-risk'].includes(selectedPortfolioId);
  
  return (
    <div className="space-y-8 animate-fade-in">
        <header className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Portfolio Builder</h2>
            <button onClick={addPortfolio} className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-md text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"><Plus className="w-4 h-4 mr-2" />New Portfolio</button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Portfolios</h3>
                {portfolios.map((portfolio: Portfolio) => {
                  const calc = calculatePortfolio(portfolio.id);
                  return (
                    <div key={portfolio.id} onClick={() => setSelectedPortfolioId(portfolio.id)} className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${selectedPortfolioId === portfolio.id ? 'bg-rose-50 border-rose-500' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold text-gray-800">{portfolio.name}</p>
                        {!['full', 'low-risk', 'high-risk'].includes(portfolio.id) && (<button onClick={(e) => { e.stopPropagation(); deletePortfolio(portfolio.id); }} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>)}
                      </div>
                      {calc && (<div className="text-xs text-gray-500 space-y-1"><p>{calc.propertyCount} properties • {calc.totalRooms} rooms</p><p className="font-semibold text-gray-700">{fmt(calc.valuation?.askingPrice)}</p><p className="text-green-600">Stabilized NOI: {fmt(calc.stabilized?.noi)}</p></div>)}
                    </div>
                  );
                })}
            </div>
            <div className="lg:col-span-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Properties ({selectedPortfolio?.propertyIds.length || 0} selected)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {calculatedProperties.map((prop: CalculatedProperty) => {
                    const isSelected = selectedPortfolio?.propertyIds.includes(prop.id);
                    return (
                      <div key={prop.id} onClick={() => togglePropertyInPortfolio(selectedPortfolioId, prop.id)} className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${isSelected ? 'bg-rose-50 border-rose-500' : `bg-white border-gray-200 hover:border-gray-300 ${isDefaultPortfolio ? 'cursor-not-allowed opacity-70' : ''}`}`}>
                          <div className="flex items-start justify-between mb-2">
                              <div><p className="font-medium text-sm text-gray-800">{prop.address.split(',')[0]}</p><p className="text-xs text-gray-500">{prop.city}</p></div>
                              <div className="text-right text-xs"><p className="text-gray-500">{prop.rooms} rooms</p><p className={`font-medium ${prop.current.occupancy >= 80 ? 'text-green-600' : prop.current.occupancy >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{fmtPct(prop.current.occupancy)}</p></div>
                          </div>
                          <div className="text-xs space-y-1 pt-2 border-t mt-2">
                              <div className="flex justify-between"><span className="text-gray-500">Current NOI:</span><span className="font-medium text-gray-700">{fmt(prop.current.noi)}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Stabilized:</span><span className="font-medium text-green-600">{fmt(prop.stabilized.noi)}</span></div>
                          </div>
                      </div>
                    );
                  })}
                </div>
            </div>
        </div>
    </div>
  );
};

export default PortfolioBuilder;
