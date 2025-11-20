
import React from 'react';
import { Card } from './Card';
import { ArrowUp } from './icons';

export const KpiCard: React.FC<{title: string; value: string; subValue: string; change?: number}> = ({ title, value, subValue, change }) => (
    <Card>
        <p className="text-sm text-gray-500 mb-2">{title}</p>
        <p className="text-3xl font-bold text-gray-800 mb-1">{value}</p>
        <div className="flex items-center text-xs text-gray-500">
            <span>{subValue}</span>
            {change !== undefined && isFinite(change) && (
                 <span className={`flex items-center ml-2 font-medium ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    <ArrowUp className={`w-3 h-3 mr-0.5 ${change < 0 ? 'transform rotate-180' : ''}`} /> {Math.abs(change).toFixed(1)}%
                 </span>
            )}
        </div>
    </Card>
);
