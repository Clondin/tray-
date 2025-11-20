
import React from 'react';
import GlassContainer from './GlassContainer';
import { ArrowUpRight, ArrowDownRight } from './icons';
import { useCountUp } from '../utils/animations';
import { fmt } from '../utils/formatters';

interface MetricCardProps {
    label: string;
    value: number;
    subValue?: string;
    change?: number;
    icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, subValue, change, icon }) => {
    const animatedValue = useCountUp(value || 0);

    const renderChangePill = () => {
        if (change === undefined || !isFinite(change)) return null;

        const isPositive = change >= 0;

        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold gap-1 ${
                isPositive 
                ? 'bg-emerald-50 text-emerald-700' 
                : 'bg-red-50 text-red-700'
            }`}>
                {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {Math.abs(change).toFixed(1)}%
            </span>
        );
    };

    return (
        <GlassContainer 
            intensity="primary" 
            className="p-6 md:p-8 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-1 hover:shadow-[0_12px_48px_rgba(0,0,0,0.08)] hover:brightness-105"
        >
            <div className="flex flex-col gap-4 relative">
                <div className="flex items-start justify-between">
                    <span className="text-micro tracking-wide">{label}</span>
                    <div className="text-gray-400/80">
                        {icon}
                    </div>
                </div>

                <div 
                    className="text-hero leading-none font-bold bg-gradient-to-b from-gray-900 to-gray-700 bg-clip-text text-transparent"
                    style={{ letterSpacing: '-0.02em' }}
                >
                    {/* The formatter needs to handle potentially large numbers during animation */}
                    {animatedValue < 1000 ? fmt(Math.round(animatedValue)) : fmt(animatedValue)}
                </div>

                <div className="flex items-center gap-2 text-caption h-7">
                    {subValue && <span>{subValue}</span>}
                    {renderChangePill()}
                </div>
            </div>
        </GlassContainer>
    );
};

export default MetricCard;
