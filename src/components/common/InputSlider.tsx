import React from 'react';

export const InputSlider: React.FC<{label: string, value: number, onChange: (value: number) => void, min: number, max: number, step: number, displayFormat: (val: number) => string}> = ({label, value, onChange, min, max, step, displayFormat}) => (
    <div>
        <div className="flex justify-between items-center mb-1">
            <label className="block text-body font-medium text-text-primary">{label}</label>
            <span className="text-small font-semibold text-text-secondary">{displayFormat(value)}</span>
        </div>
        <div className="flex items-center gap-4">
            <input 
                type="range" 
                min={min} 
                max={max} 
                step={step} 
                value={value} 
                onChange={e => onChange(parseFloat(e.target.value))} 
                className="w-full h-2 bg-bg-surface-soft rounded-lg appearance-none cursor-pointer accent-accent-primary"
            />
        </div>
    </div>
);
