
import React from 'react';

export const InputSlider: React.FC<{label: string, value: number, onChange: (value: number) => void, min: number, max: number, step: number, displayFormat: (val: number) => string}> = ({label, value, onChange, min, max, step, displayFormat}) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div className="flex items-center gap-4">
            <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-500"/>
            <div className="w-40">
                <input type="number" step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="w-full text-sm font-medium text-gray-800 form-input p-1 text-right" />
            </div>
        </div>
    </div>
);
