
import React from 'react';
import type { Portfolio, CalculatedProperty } from '../types';
import { Card } from '../components/Card';
import MetricCard from '../components/MetricCard';
import { fmt, fmtPct } from '../utils/formatters';
import { Building2, DollarSign, Target, TrendingUp } from '../components/icons';


interface OverviewProps {
  currentPortfolio: any;
  portfolios: Portfolio[];
  selectedPortfolioId: string;
  setSelectedPortfolioId: (id: string) => void;
  calculatedProperties: CalculatedProperty[];
  onPropertySelect: (id: number) => void;
}

const Overview: React.FC<OverviewProps> = ({ currentPortfolio, portfolios, selectedPortfolioId, setSelectedPortfolioId, calculatedProperties, onPropertySelect }) => {
  if (!currentPortfolio) return null;
  const noiUpside = ((currentPortfolio.stabilized?.noi ?? 0) - (currentPortfolio.current?.noi ?? 0));
  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <div className="flex items-center gap-4 mb-2">
            <h2 className="text-2xl font-bold text-gray-900">Portfolio Overview</h2>
        </div>
        <div className="flex items-center gap-4">
            <label htmlFor="portfolio-select" className="text-sm font-medium text-gray-600">Viewing:</label>
            <select id="portfolio-select" value={selectedPortfolioId} onChange={(e) => setSelectedPortfolioId(e.target.value)} className="form-select block w-full max-w-xs pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm rounded-md">
                {portfolios.map((p: Portfolio) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.propertyIds.length} properties)</option>
                ))}
            </select>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
            label="Total Investment"
            value={currentPortfolio.valuation?.askingPrice}
            subValue={`${fmt(currentPortfolio.valuation?.pricePerRoom)}/room`}
            icon={<Building2 className="w-6 h-6" />}
        />
        <MetricCard
            label="Current NOI"
            value={currentPortfolio.current?.noi}
            subValue={`${fmtPct(currentPortfolio.current?.capRate)} Cap Rate`}
            icon={<DollarSign className="w-6 h-6" />}
        />
        <MetricCard
            label="Stabilized NOI"
            value={currentPortfolio.stabilized?.noi}
            subValue={`${fmtPct(currentPortfolio.stabilized?.capRate)} Cap Rate`}
            icon={<Target className="w-6 h-6" />}
        />
        <MetricCard
            label="NOI Upside"
            value={noiUpside}
            subValue={`${fmtPct(currentPortfolio.valuation?.upside)}`}
            change={currentPortfolio.valuation?.upside}
            icon={<TrendingUp className="w-6 h-6" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-bold text-lg mb-4">Current Performance</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b"><dt className="text-gray-500">Occupancy</dt><dd className="font-semibold">{fmtPct(currentPortfolio.current?.occupancy)}</dd></div>
            <div className="flex justify-between items-center py-2 border-b"><dt className="text-gray-500">Gross Income</dt><dd className="font-semibold">{fmt(currentPortfolio.current?.gri)}</dd></div>
            <div className="flex justify-between items-center py-2 border-b"><dt className="text-gray-500">Operating Expenses</dt><dd className="font-semibold">{fmt(currentPortfolio.current?.opex)}</dd></div>
            <div className="flex justify-between items-center py-2"><dt className="text-gray-600 font-bold">Net Operating Income</dt><dd className="font-bold text-lg text-gray-800">{fmt(currentPortfolio.current?.noi)}</dd></div>
          </dl>
        </Card>
        <Card>
          <h3 className="font-bold text-lg mb-4 text-green-600">Stabilized Performance</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b"><dt className="text-gray-500">Occupancy</dt><dd className="font-semibold text-green-700">{fmtPct(currentPortfolio.stabilized?.occupancy)}</dd></div>
            <div className="flex justify-between items-center py-2 border-b"><dt className="text-gray-500">Gross Income</dt><dd className="font-semibold text-green-700">{fmt(currentPortfolio.stabilized?.gri)}</dd></div>
            <div className="flex justify-between items-center py-2 border-b"><dt className="text-gray-500">Operating Expenses</dt><dd className="font-semibold">{fmt(currentPortfolio.stabilized?.opex)}</dd></div>
            <div className="flex justify-between items-center py-2"><dt className="text-green-600 font-bold">Net Operating Income</dt><dd className="font-bold text-lg text-green-600">{fmt(currentPortfolio.stabilized?.noi)}</dd></div>
          </dl>
        </Card>
      </div>

      <Card>
        <h3 className="font-bold text-lg mb-4">Property Details</h3>
        <div className="overflow-x-auto -mx-6">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                <th className="py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Rooms</th>
                <th className="py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Current Occ</th>
                <th className="py-3 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current NOI</th>
                <th className="py-3 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stabilized NOI</th>
                <th className="py-3 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Upside</th>
                <th className="py-3 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-sm">
              {calculatedProperties.filter((p: CalculatedProperty) => currentPortfolio.propertyIds.includes(p.id)).map((prop: CalculatedProperty) => (
                <tr key={prop.id} onClick={() => onPropertySelect(prop.id)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap"><div className="font-medium text-gray-900">{prop.address.split(',')[0]}</div><div className="text-gray-500">{prop.city}, NJ</div></td>
                  <td className="px-6 py-4 text-center">{prop.rooms}</td>
                  <td className="px-6 py-4 text-center"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${prop.current.occupancy >= 80 ? 'bg-green-100 text-green-800' : prop.current.occupancy >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{fmtPct(prop.current.occupancy)}</span></td>
                  <td className="px-6 py-4 text-right">{fmt(prop.current.noi)}</td>
                  <td className="px-6 py-4 text-right font-medium text-green-600">{fmt(prop.stabilized.noi)}</td>
                  <td className="px-6 py-4 text-right font-medium text-rose-600">+{fmtPct(prop.valuation.upside)}</td>
                  <td className="px-6 py-4 text-right">{fmt(prop.valuation.askingPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Overview;
