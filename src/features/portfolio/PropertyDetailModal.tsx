
import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../../store/appStore';
import type { CalculatedProperty, ExpenseDetail } from '../../types';
import { fmt, fmtPct } from '../../utils/formatters';
import { X, Building2, Layers, FileText, Check, AlertTriangle, Calculator, TrendingUp, Target, DollarSign, BarChart, Hammer, Upload } from '../../components/icons';
import { RentRollTable } from '../property/RentRollTable';
import { ExpensesTab } from '../property/ExpensesTab';
import { RenovationTab } from '../property/RenovationTab';
import { KpiCard, KpiValue } from '../../components/common/KpiCard';
import { SectionCard } from '../../components/common/SectionCard';

// --- Components ---

const EditableField: React.FC<{ 
    label: string, 
    value: string | number, 
    onChange: (val: number) => void, 
    type?: 'currency' | 'percent' | 'number', 
    placeholder: string | number, 
    disabled?: boolean,
    active?: boolean
}> = ({ label, value, onChange, type = 'number', placeholder, disabled = false, active = false }) => {
    const prefix = type === 'currency' ? '$' : '';
    const suffix = type === 'percent' ? '%' : '';
    return (
      <div className="relative">
        <label className={`block text-[10px] uppercase tracking-wider font-bold mb-1 ${active ? 'text-primary' : 'text-secondary'}`}>{label}</label>
        <div className="relative">
          {prefix && <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium select-none ${active ? 'text-primary' : 'text-muted'}`}>{prefix}</span>}
          <input
            type="number"
            value={value}
            placeholder={placeholder.toString()}
            onChange={e => onChange(parseFloat(e.target.value) || 0)}
            disabled={disabled}
            className={`
                w-full pl-3 pr-3 py-2 text-sm font-semibold rounded-lg border transition-all
                ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-8' : ''}
                ${disabled 
                    ? 'bg-transparent border-transparent text-muted cursor-default px-0 pl-0' 
                    : active 
                        ? 'bg-white border-accent focus:ring-2 focus:ring-accent/20 text-primary shadow-sm' 
                        : 'bg-surface-subtle border-border hover:border-border-hover text-secondary'}
            `}
          />
          {suffix && <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium select-none ${active ? 'text-primary' : 'text-muted'}`}>{suffix}</span>}
        </div>
      </div>
    );
  };

const StatRow: React.FC<{ label: string, value: string | number, subValue?: string, highlight?: boolean }> = ({ label, value, subValue, highlight }) => (
    <div className="flex justify-between items-baseline py-1">
        <span className="text-sm text-secondary">{label}</span>
        <div className="text-right">
            <div className={`text-base font-bold ${highlight ? 'text-accent' : 'text-primary'}`}>{value}</div>
            {subValue && <div className="text-xs text-muted">{subValue}</div>}
        </div>
    </div>
);

// --- Main Modal ---

const PropertyDetailModal: React.FC<{ property: CalculatedProperty, onClose: () => void }> = ({ property, onClose }) => {
    const { assumptions, propertyOverrides, setPropertyOverrides, propertyViewTab, setPropertyViewTab } = useAppStore(state => ({
        assumptions: state.assumptions,
        propertyOverrides: state.propertyOverrides[property.id] || {},
        setPropertyOverrides: state.setPropertyOverrides,
        propertyViewTab: state.propertyViewTab,
        setPropertyViewTab: state.setPropertyViewTab,
    }));

    const [isImageExpanded, setIsImageExpanded] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handleReset = () => {
        setPropertyOverrides(property.id, {});
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            
            // Create an image object to handle resizing
            const img = new Image();
            const reader = new FileReader();
            
            reader.onload = (event) => {
                img.src = event.target?.result as string;
            };
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Define max dimensions to keep storage size low
                const MAX_WIDTH = 1024;
                const MAX_HEIGHT = 768;
                let width = img.width;
                let height = img.height;
                
                // Calculate new dimensions maintaining aspect ratio
                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    // Compress to JPEG at 70% quality
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    setPropertyOverrides(property.id, { imageUrl: compressedDataUrl });
                    setIsUploading(false);
                }
            };
            
            reader.readAsDataURL(file);
        }
    };

    const occupancyRate = property.current.occupancy;
    const totalUnits = property.rooms;
    const occupiedUnits = property.current.occupiedRooms;
    const avgCurrentRent = property.current.gri / 12 / (occupiedUnits || 1);

    return (
        <>
            {/* Expanded Image Lightbox */}
            {isImageExpanded && property.imageUrl && (
                <div 
                    className="fixed inset-0 z-[11000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-8 cursor-zoom-out"
                    onClick={() => setIsImageExpanded(false)}
                >
                    <img 
                        src={property.imageUrl} 
                        alt="Property Full View" 
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    />
                    <button className="absolute top-8 right-8 text-white/70 hover:text-white">
                        <X className="w-8 h-8" />
                    </button>
                </div>
            )}

            <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4 py-6">
                {/* Backdrop */}
                <div 
                    className="absolute inset-0 bg-primary/60 backdrop-blur-sm transition-opacity" 
                    onClick={onClose}
                />

                {/* Modal Window */}
                <div className="relative bg-background w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up border border-border z-10">
                    
                    {/* Header */}
                    <header className="flex items-center justify-between px-6 py-5 border-b border-border bg-white flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-border bg-surface-subtle flex-shrink-0 group">
                                {property.imageUrl ? (
                                    <>
                                        <img 
                                            src={property.imageUrl} 
                                            alt={property.address}
                                            className={`w-full h-full object-cover cursor-zoom-in hover:opacity-90 transition-opacity ${isUploading ? 'opacity-50' : ''}`}
                                            onClick={() => setIsImageExpanded(true)}
                                        />
                                        {isUploading && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        )}
                                        {/* Discrete Edit Button */}
                                        <label className="absolute bottom-1 right-1 p-1 bg-black/60 hover:bg-black/80 rounded cursor-pointer z-10 transition-colors" title="Change Image">
                                            <Upload className="w-3 h-3 text-white" />
                                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                        </label>
                                    </>
                                ) : (
                                    // Placeholder Mode (Click to upload)
                                    <label className="w-full h-full flex items-center justify-center text-primary/30 hover:bg-surface-subtle/80 hover:text-primary/50 cursor-pointer transition-colors relative">
                                        {isUploading ? (
                                            <div className="w-5 h-5 border-2 border-primary/50 border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <Building2 className="w-8 h-8" />
                                        )}
                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/5 transition-colors">
                                            <Upload className="w-4 h-4 opacity-0 hover:opacity-100 text-secondary" />
                                        </div>
                                    </label>
                                )}
                            </div>

                            <div>
                                <h2 className="text-xl font-bold text-primary tracking-tight">{property.address}</h2>
                                <div className="flex items-center gap-2 text-sm text-secondary mt-0.5">
                                    <span>{property.city}, NJ</span>
                                    <span className="w-1 h-1 rounded-full bg-border"></span>
                                    <span>{property.rooms} Units</span>
                                    <span className="w-1 h-1 rounded-full bg-border"></span>
                                    <span className="text-primary font-medium">{fmt(property.valuation.askingPrice)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="flex bg-surface-subtle p-1 rounded-lg border border-border">
                                <button 
                                    onClick={() => setPropertyViewTab('overview')}
                                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${propertyViewTab === 'overview' ? 'bg-white shadow-sm text-primary' : 'text-secondary hover:text-primary'}`}
                                >
                                    <Layers className="w-3 h-3" /> Overview
                                </button>
                                <button 
                                    onClick={() => setPropertyViewTab('expenses')}
                                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${propertyViewTab === 'expenses' ? 'bg-white shadow-sm text-primary' : 'text-secondary hover:text-primary'}`}
                                >
                                    <Calculator className="w-3 h-3" /> Expenses
                                </button>
                                <button 
                                    onClick={() => setPropertyViewTab('renovations')}
                                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${propertyViewTab === 'renovations' ? 'bg-white shadow-sm text-primary' : 'text-secondary hover:text-primary'}`}
                                >
                                    <Hammer className="w-3 h-3" /> Renovations
                                </button>
                                <button 
                                    onClick={() => setPropertyViewTab('rentroll')}
                                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${propertyViewTab === 'rentroll' ? 'bg-white shadow-sm text-primary' : 'text-secondary hover:text-primary'}`}
                                >
                                    <FileText className="w-3 h-3" /> Rent Roll
                                </button>
                            </div>
                            <button 
                                onClick={onClose} 
                                className="w-8 h-8 flex items-center justify-center rounded-full text-muted hover:bg-surface-subtle hover:text-primary transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </header>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 bg-background">
                        {propertyViewTab === 'overview' && (
                        <div className="space-y-6 animate-fade-in">
                            
                            {/* Top Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <KpiCard 
                                    label="Asking Price" 
                                    value={fmt(property.valuation.askingPrice)} 
                                    subValue={`${fmt(property.valuation.pricePerRoom)}/unit`}
                                    icon={<DollarSign className="w-5 h-5"/>}
                                />
                                <KpiCard 
                                    label="Stabilized Value" 
                                    value={fmt(property.valuation.stabilizedValue)} 
                                    subValue={`${fmtPct(property.valuation.upside)} Upside`}
                                    icon={<TrendingUp className="w-5 h-5"/>}
                                    highlight
                                />
                                <KpiCard 
                                    label="Current Cap Rate" 
                                    value={fmtPct(property.current.capRate)} 
                                    subValue={`NOI: ${fmt(property.current.noi)}`}
                                    icon={<BarChart className="w-5 h-5"/>}
                                />
                                <KpiCard 
                                    label="Stabilized Cap Rate" 
                                    value={fmtPct(property.stabilized.capRate)} 
                                    subValue={`NOI: ${fmt(property.stabilized.noi)}`}
                                    icon={<Target className="w-5 h-5"/>}
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                
                                {/* Left Column: Financial Breakdown (2/3) */}
                                <div className="lg:col-span-2 space-y-6">
                                    <SectionCard title="Financial Performance">
                                        <div className="grid grid-cols-2 gap-8">
                                            {/* Current T12 */}
                                            <div className="space-y-4 p-4 rounded-xl bg-surface-subtle border border-border">
                                                <div className="flex items-center justify-between border-b border-border-subtle pb-2 mb-4">
                                                    <h4 className="font-bold text-secondary uppercase tracking-wider text-xs">Current (T12)</h4>
                                                    <span className="text-xs font-semibold bg-white border border-border px-2 py-0.5 rounded-full text-secondary">Actuals</span>
                                                </div>
                                                <StatRow label="Gross Rental Income" value={fmt(property.current.gri)} />
                                                <StatRow label="Operating Expenses" value={fmt(property.current.opex)} />
                                                <div className="border-t border-border-subtle my-2"></div>
                                                <StatRow label="Net Operating Income" value={fmt(property.current.noi)} highlight />
                                                <StatRow label="Occupancy" value={fmtPct(property.current.occupancy)} />
                                            </div>

                                            {/* Stabilized Pro Forma */}
                                            <div className="space-y-4 p-4 rounded-xl bg-accent/5 border border-accent/20 relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-accent"></div>
                                                <div className="flex items-center justify-between border-b border-accent/20 pb-2 mb-4">
                                                    <h4 className="font-bold text-accent uppercase tracking-wider text-xs">Stabilized (Pro Forma)</h4>
                                                    <span className="text-xs font-semibold bg-white border border-accent/30 px-2 py-0.5 rounded-full text-accent">Target</span>
                                                </div>
                                                <StatRow label="Gross Rental Income" value={fmt(property.stabilized.gri)} />
                                                <StatRow label="Operating Expenses" value={fmt(property.stabilized.opex)} />
                                                <div className="border-t border-accent/20 my-2"></div>
                                                <StatRow label="Net Operating Income" value={fmt(property.stabilized.noi)} highlight />
                                                <StatRow label="Occupancy" value={fmtPct(property.stabilized.occupancy)} />
                                            </div>
                                        </div>
                                    </SectionCard>
                                    
                                    <div className="grid grid-cols-2 gap-6">
                                        <SectionCard title="Rent Roll Summary">
                                            <div className="flex justify-between items-center mb-4">
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-primary">{totalUnits}</div>
                                                    <div className="text-xs text-secondary">Total Units</div>
                                                </div>
                                                <div className="w-px h-8 bg-border"></div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-success">{occupiedUnits}</div>
                                                    <div className="text-xs text-secondary">Occupied</div>
                                                </div>
                                                <div className="w-px h-8 bg-border"></div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-primary">{fmtPct(occupancyRate)}</div>
                                                    <div className="text-xs text-secondary">Occ Rate</div>
                                                </div>
                                            </div>
                                            <div className="p-3 bg-surface-subtle rounded-lg text-center">
                                                <div className="text-xs text-secondary mb-1">Avg. Current Rent</div>
                                                <div className="font-bold text-primary">{fmt(avgCurrentRent)} <span className="text-xs font-normal text-muted">/mo</span></div>
                                            </div>
                                        </SectionCard>
                                        
                                        <SectionCard title="Expense Summary">
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-secondary">T12 OpEx Ratio</span>
                                                    <span className="font-bold text-primary">{(property.current.opex / (property.current.gri || 1) * 100).toFixed(1)}%</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-secondary">Pro Forma Ratio</span>
                                                    <span className="font-bold text-accent">{(property.stabilized.opex / (property.stabilized.gri || 1) * 100).toFixed(1)}%</span>
                                                </div>
                                                <div className="flex justify-between items-center pt-2 border-t border-border">
                                                    <span className="text-sm font-medium text-primary">Exp. Savings</span>
                                                    <span className="font-bold text-success">{fmt(property.current.opex - property.stabilized.opex)}</span>
                                                </div>
                                            </div>
                                        </SectionCard>
                                    </div>
                                </div>

                                {/* Right Column: Key Drivers Input (1/3) */}
                                <div className="lg:col-span-1">
                                    <div className="bg-white rounded-xl border border-border shadow-lg h-full flex flex-col">
                                        <div className="p-5 border-b border-border bg-surface-subtle">
                                            <h3 className="font-bold text-primary">Key Assumptions</h3>
                                            <p className="text-xs text-secondary mt-1">Modify drivers to stress test value.</p>
                                        </div>
                                        <div className="p-5 flex-1 space-y-6">
                                            <EditableField 
                                                label="Market Rent Target" 
                                                value={propertyOverrides.rent ?? ''} 
                                                onChange={val => setPropertyOverrides(property.id, { rent: val })} 
                                                placeholder={assumptions.marketRent} 
                                                type="currency"
                                                active
                                            />
                                            
                                            <EditableField 
                                                label="Stabilized Occupancy" 
                                                value={propertyOverrides.stabilizedOccupancy ?? ''} 
                                                onChange={val => setPropertyOverrides(property.id, { stabilizedOccupancy: val })} 
                                                placeholder={assumptions.stabilizedOccupancy} 
                                                type="percent"
                                                active
                                            />
                                        </div>
                                        <div className="p-4 bg-accent/5 border-t border-accent/10 text-center">
                                             <div className="text-xs text-accent font-bold uppercase tracking-wider mb-1">Value Impact</div>
                                             <div className="text-xl font-bold text-accent">+{fmt(property.valuation.stabilizedValue - property.valuation.askingPrice)}</div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                        )}
                        
                        {propertyViewTab === 'expenses' && (
                            <ExpensesTab property={property} />
                        )}

                        {propertyViewTab === 'renovations' && (
                            <RenovationTab property={property} />
                        )}

                        {propertyViewTab === 'rentroll' && (
                            <RentRollTable property={property} />
                        )}
                    </div>

                    {/* Footer */}
                    <footer className="px-6 py-4 bg-white border-t border-border flex justify-between items-center flex-shrink-0">
                        <div className="text-xs text-muted">
                            Changes to Pro Forma assumptions update the global portfolio model immediately.
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={handleReset} 
                                className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary hover:bg-surface-subtle rounded-lg transition-colors"
                            >
                                Reset to Defaults
                            </button>
                            <button 
                                onClick={onClose} 
                                className="px-6 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-lg shadow-md transition-all"
                            >
                                Save & Close
                            </button>
                        </div>
                    </footer>

                </div>
            </div>
        </>
    );
};

export default PropertyDetailModal;
