
import React, { useMemo } from 'react';
import type { Assumptions, PropertyOverrides, PriceAllocations, CalculatedProperty } from '../types';
import { Card } from '../components/Card';
import { PROPERTIES_DATA } from '../data/PROPERTIES_DATA';
import { fmt } from '../utils/formatters';

interface StressTestProps {
    assumptions: Assumptions;
    setAssumptions: (assumptions: Assumptions) => void;
    propertyOverrides: PropertyOverrides;
    setPropertyOverrides: (overrides: PropertyOverrides) => void;
    priceAllocations: PriceAllocations;
    setPriceAllocations: (allocations: PriceAllocations) => void;
    resetAssumptions: () => void;
    calculatedProperties: CalculatedProperty[];
    calculatePortfolio: (id: string) => any;
}

const StressTest: React.FC<StressTestProps> = ({ assumptions, setAssumptions, propertyOverrides, setPropertyOverrides, priceAllocations, setPriceAllocations, resetAssumptions, calculatedProperties, calculatePortfolio }) => {
    
    const handleAllocationChange = (propId: number, value: string) => {
        const newAllocations = { ...priceAllocations, [propId]: parseFloat(value) || 0 };
        setPriceAllocations(newAllocations);
    };

    const normalizeAllocations = () => {
        // Fix: Explicitly type the reduce generic to ensure total is a number
        const total = Object.values(priceAllocations).reduce<number>((sum, val) => sum + (Number(val) || 0), 0);
        if (total === 0) return;
        const normalized: PriceAllocations = {};
        for (const propId in priceAllocations) {
            const numericPropId = Number(propId);
            normalized[numericPropId] = ((Number(priceAllocations[numericPropId]) || 0) / total) * 100;
        }
        setPriceAllocations(normalized);
    };

    // Fix: Explicitly type the accumulator `sum` and `val` as numbers to ensure `totalAllocation` is correctly inferred.
    const totalAllocation = useMemo(() => Object.values(priceAllocations).reduce((sum: number, val: number) => sum + (Number(val) || 0), 0), [priceAllocations]);

    return (
        <div className="space-y-8 animate-fade-in">
            <header>
                <h2 className="text-2xl font-bold text-gray-900">Stress Test Assumptions</h2>
            </header>

            <Card>
                <h3 className="font-bold text-lg mb-4">Global Assumptions</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Market Rent ($/month)</label><input type="number" value={assumptions.marketRent} onChange={(e) => setAssumptions({...assumptions, marketRent: parseFloat(e.target.value) || 0})} className="w-full form-input" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Stabilized Occupancy (%)</label><input type="number" value={assumptions.stabilizedOccupancy} onChange={(e) => setAssumptions({...assumptions, stabilizedOccupancy: parseFloat(e.target.value) || 0})} className="w-full form-input" min="0" max="100"/></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">OpEx per Room ($/year)</label><input type="number" value={assumptions.opexPerRoom} onChange={(e) => setAssumptions({...assumptions, opexPerRoom: parseFloat(e.target.value) || 0})} className="w-full form-input" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Exit Cap Rate (%)</label><input type="number" step="0.1" value={assumptions.capRate} onChange={(e) => setAssumptions({...assumptions, capRate: parseFloat(e.target.value) || 0})} className="w-full form-input" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Asking Price ($/room)</label><input type="number" value={assumptions.askingPricePerRoom} onChange={(e) => setAssumptions({...assumptions, askingPricePerRoom: parseFloat(e.target.value) || 0})} className="w-full form-input" /></div>
                    <div className="flex items-end"><button onClick={resetAssumptions} className="w-full justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Reset</button></div>
                </div>
            </Card>

            <Card>
                <h3 className="font-bold text-lg mb-4">Purchase Price Allocation</h3>
                <div className="space-y-4 max-h-[20rem] overflow-y-auto pr-2 border rounded-md p-4">
                    {PROPERTIES_DATA.map(prop => (
                        <div key={prop.id} className="grid grid-cols-3 items-center gap-4">
                            <span className="text-sm truncate col-span-2">{prop.address}</span>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    value={priceAllocations[prop.id]?.toFixed(2) || '0.00'}
                                    onChange={(e) => handleAllocationChange(prop.id, e.target.value)}
                                    className="w-full text-sm form-input text-right pr-6"
                                />
                                <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-500 text-sm">%</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <div className="text-sm font-semibold">
                        Total Allocation: 
                        <span className={Math.abs(totalAllocation - 100) > 0.01 ? 'text-red-600' : 'text-green-600'}>
                            {totalAllocation.toFixed(2)}%
                        </span>
                    </div>
                    <button onClick={normalizeAllocations} className="justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Normalize to 100%</button>
                </div>
            </Card>

            <Card>
                <h3 className="font-bold text-lg mb-4">Sensitivity Analysis - Stabilized Value (Full Portfolio)</h3>
                <div className="overflow-x-auto -mx-6">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase">Stab. Occ. \ Exit Cap</th>
                                {[6.0, 7.0, 8.0, 9.0, 10.0].map(cap => <th key={cap} className="py-3 px-6 text-right text-xs font-medium text-gray-500 uppercase">{cap.toFixed(1)}%</th>)}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {[85, 90, 95, 100].map(occ => (
                                <tr key={occ}>
                                    <td className="px-6 py-4 font-medium">{occ}%</td>
                                    {[6.0, 7.0, 8.0, 9.0, 10.0].map(cap => {
                                        const fullPortfolio = calculatePortfolio('full');
                                        if (!fullPortfolio || !fullPortfolio.totalRooms) return <td key={cap}></td>;
                                        const stabilizedGRI = Math.round((occ / 100) * fullPortfolio.totalRooms) * assumptions.marketRent * 12;
                                        const stabilizedNOI = stabilizedGRI - (fullPortfolio.totalRooms * assumptions.opexPerRoom);
                                        const value = stabilizedNOI > 0 ? stabilizedNOI / (cap / 100) : 0;
                                        const isCurrent = cap === assumptions.capRate && occ === assumptions.stabilizedOccupancy;
                                        return (<td key={cap} className={`px-6 py-4 text-right ${isCurrent ? 'bg-rose-50 font-bold text-rose-700' : ''}`}>{fmt(value)}</td>);
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Card>
                <h3 className="font-bold text-lg mb-4">Property-Level Adjustments</h3>
                <div className="space-y-4 max-h-[40rem] overflow-y-auto pr-2">
                    {calculatedProperties.map((prop: CalculatedProperty) => (
                        <div key={prop.id} className="p-4 bg-gray-50 rounded-lg border">
                            <p className="font-semibold mb-3 text-gray-800">{prop.address}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {(['currentOccupancy', 'stabilizedOccupancy', 'rent', 'opexPerRoom'] as const).map(key => {
                                    const labels = { currentOccupancy: 'Current Occ %', stabilizedOccupancy: 'Stab Occ %', rent: 'Rent $/mo', opexPerRoom: 'OpEx $/rm/yr' };
                                    const placeholders = { currentOccupancy: prop.occupancy, stabilizedOccupancy: assumptions.stabilizedOccupancy, rent: assumptions.marketRent, opexPerRoom: assumptions.opexPerRoom };
                                    const val = propertyOverrides[prop.id]?.[key];
                                    return (
                                        <div key={key}>
                                            <label className="block text-xs text-gray-600 mb-1">{labels[key]}</label>
                                            <input 
                                                type="number" 
                                                placeholder={placeholders[key].toString()} 
                                                value={val ?? ''} 
                                                onChange={(e) => setPropertyOverrides({ ...propertyOverrides, [prop.id]: { ...propertyOverrides[prop.id], [key]: e.target.value === '' ? undefined : parseFloat(e.target.value) }})} 
                                                className="w-full text-sm form-input"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default StressTest;
