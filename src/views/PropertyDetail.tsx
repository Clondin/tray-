
import React from 'react';
import type { CalculatedProperty, Assumptions, View } from '../types';
import { Card } from '../components/Card';
import { KpiCard } from '../components/KpiCard';
import { fmt, fmtPct } from '../utils/formatters';

interface PropertyDetailProps {
    prop: CalculatedProperty;
    assumptions: Assumptions;
    setView: (view: View) => void;
}

const PropertyDetail: React.FC<PropertyDetailProps> = ({ prop, assumptions, setView }) => {
    return (
        <div className="space-y-8 animate-fade-in">
            <header>
                <button onClick={() => setView('overview')} className="text-sm font-medium text-rose-600 hover:text-rose-800 mb-2">← Back to Overview</button>
                <h2 className="text-2xl font-bold text-gray-900">{prop.address}</h2>
                <p className="text-gray-600">{prop.rooms} Rooms • {prop.city}, NJ</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Asking Price" value={fmt(prop.valuation.askingPrice)} subValue={`${fmt(prop.valuation.pricePerRoom)}/room`} />
                <KpiCard title="Current Cap Rate" value={fmtPct(prop.current.capRate)} subValue={`${fmt(prop.current.noi)} NOI`} />
                <KpiCard title="Stabilized Cap Rate" value={fmtPct(prop.stabilized.capRate)} subValue={`${fmt(prop.stabilized.noi)} NOI`} />
                <KpiCard title="Stabilized Value" value={fmt(prop.valuation.stabilizedValue)} subValue={`@ ${fmtPct(assumptions.capRate)} cap`} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <h3 className="font-bold text-lg mb-4">Current Performance</h3>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-2 border-b"><dt className="text-gray-500">Total Rooms</dt><dd className="font-medium">{prop.rooms}</dd></div>
                    <div className="flex justify-between items-center py-2 border-b"><dt className="text-gray-500">Occupied Rooms</dt><dd className="font-medium">{prop.current.occupiedRooms}</dd></div>
                    <div className="flex justify-between items-center py-2 border-b"><dt className="text-gray-500">Occupancy Rate</dt><dd className="font-medium">{fmtPct(prop.current.occupancy)}</dd></div>
                    <div className="flex justify-between items-center py-2 border-b"><dt className="text-gray-500">Gross Rental Income</dt><dd className="font-medium">{fmt(prop.current.gri)}</dd></div>
                    <div className="flex justify-between items-center py-2 border-b"><dt className="text-gray-500">Operating Expenses</dt><dd className="font-medium">({fmt(prop.current.opex)})</dd></div>
                    <div className="flex justify-between items-center py-3 bg-gray-50 px-3 -mx-3 rounded-md"><dt className="font-bold">Net Operating Income</dt><dd className="font-bold text-lg">{fmt(prop.current.noi)}</dd></div>
                  </dl>
                </Card>
                <Card>
                  <h3 className="font-bold text-lg mb-4 text-green-600">Stabilized Performance</h3>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-2 border-b"><dt className="text-gray-500">Total Rooms</dt><dd className="font-medium">{prop.rooms}</dd></div>
                    <div className="flex justify-between items-center py-2 border-b"><dt className="text-gray-500">Occupied Rooms</dt><dd className="font-medium text-green-700">{prop.stabilized.occupiedRooms}</dd></div>
                    <div className="flex justify-between items-center py-2 border-b"><dt className="text-gray-500">Occupancy Rate</dt><dd className="font-medium text-green-700">{fmtPct(prop.stabilized.occupancy)}</dd></div>
                    <div className="flex justify-between items-center py-2 border-b"><dt className="text-gray-500">Gross Rental Income</dt><dd className="font-medium text-green-700">{fmt(prop.stabilized.gri)}</dd></div>
                    <div className="flex justify-between items-center py-2 border-b"><dt className="text-gray-500">Operating Expenses</dt><dd className="font-medium">({fmt(prop.stabilized.opex)})</dd></div>
                    <div className="flex justify-between items-center py-3 bg-green-50 px-3 -mx-3 rounded-md"><dt className="font-bold text-green-700">Net Operating Income</dt><dd className="font-bold text-lg text-green-700">{fmt(prop.stabilized.noi)}</dd></div>
                  </dl>
                </Card>
            </div>
        </div>
    );
};

export default PropertyDetail;
