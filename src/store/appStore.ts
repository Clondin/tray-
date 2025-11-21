
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PROPERTIES_DATA, lowRiskIds, highRiskIds, initialAllocations } from '../data/PROPERTIES_DATA';
import { DEFAULT_T12_PER_UNIT } from '../data/DEFAULT_EXPENSES';
import { calculateProperty } from '../utils/propertyCalculations';
import { calculatePortfolio as calculatePortfolioUtil } from '../utils/portfolioCalculations';
import type { View, PropertyTab, Assumptions, PropertyOverrides, Portfolio, CalculatedProperty, PriceAllocations, FinancingScenario, SavedFinancingScenario, InvestorReturnsScenario, UnitOverride, DashboardKPI, ExpenseDetail, DealSnapshot, RenovationProfile } from '../types';

interface AppState {
  view: View;
  propertyViewTab: PropertyTab;
  assumptions: Assumptions;
  propertyOverrides: PropertyOverrides;
  priceAllocations: PriceAllocations;
  portfolios: Portfolio[];
  selectedPortfolioId: string;
  modalPropertyId: number | null;
  financingScenario: FinancingScenario;
  investorReturnsScenario: InvestorReturnsScenario;
  savedScenarios: SavedFinancingScenario[]; // Keeping generic saved scenarios
  savedSnapshots: DealSnapshot[]; // Full deal snapshots
  returnsViewMode: 't12' | 'proforma';
  visibleKPIs: DashboardKPI[];

  // Global Expense State (Deal Level Defaults)
  globalT12PerRoom: Partial<ExpenseDetail>;
  globalProFormaPerRoom: Partial<ExpenseDetail>;
  
  // UI State for Snapshot Modal
  snapshotModalOpen: boolean;

  // Derived State (Selectors)
  calculatedProperties: CalculatedProperty[];
  currentPortfolio: any;

  // Actions
  setView: (view: View) => void;
  setPropertyViewTab: (tab: PropertyTab) => void;
  setAssumptions: (assumptions: Partial<Assumptions>) => void;
  resetAssumptions: () => void;
  setPriceAllocations: (allocations: PriceAllocations) => void;
  normalizeAllocations: () => void;
  setPropertyOverrides: (propertyId: number, overrides: any) => void;
  setUnitOverride: (propertyId: number, unitId: string, override: Partial<UnitOverride>) => void;
  setExpenseOverride: (propertyId: number, expenseField: keyof ExpenseDetail, value: number) => void;
  setT12ExpenseOverride: (propertyId: number, expenseField: keyof ExpenseDetail, value: number) => void;
  setRenovationOverride: (propertyId: number, renovation: Partial<RenovationProfile>) => void;
  
  // Deal Level
  setGlobalT12PerRoom: (field: keyof ExpenseDetail, value: number) => void;
  setGlobalProFormaPerRoom: (field: keyof ExpenseDetail, value: number) => void;
  
  setSelectedPortfolioId: (id: string) => void;
  addPortfolio: () => void;
  deletePortfolio: (id: string) => void;
  togglePropertyInPortfolio: (portfolioId: string, propertyId: number) => void;
  
  openPropertyModal: (id: number) => void;
  closePropertyModal: () => void;
  setFinancingScenario: (params: Partial<FinancingScenario>) => void;
  setInvestorReturnsScenario: (params: Partial<InvestorReturnsScenario>) => void;
  applyLoanPreset: (preset: 'bridge' | 'bank' | 'agency') => void;
  saveCurrentScenario: (name: string, results: any) => void;
  setGlobalPortfolioPrice: (price: number) => void;
  setReturnsViewMode: (mode: 't12' | 'proforma') => void;
  setVisibleKPIs: (kpis: DashboardKPI[]) => void;

  // Snapshot Actions
  setSnapshotModalOpen: (open: boolean) => void;
  saveSnapshot: (name: string) => void;
  loadSnapshot: (snapshotId: string) => void;
  deleteSnapshot: (snapshotId: string) => void;
  importSnapshot: (snapshot: DealSnapshot) => void;
}

// Calculate default Price Per Room to hit $15.5MM Total Price
const totalRooms = PROPERTIES_DATA.reduce((sum, p) => sum + p.rooms, 0);
const targetInitialPrice = 15500000;
const defaultAskingPricePerRoom = targetInitialPrice / totalRooms;

const defaultAssumptions: Assumptions = {
  marketRent: 900,
  stabilizedOccupancy: 95,
  expenseRatio: 0, // Disabled ratio-based calculation
  t12ExpenseRatio: 0, // Disabled ratio-based calculation
  rentLift: 0,
  capRate: 8.0,
  askingPricePerRoom: defaultAskingPricePerRoom,
  rentGrowth: 2.5,
  opexGrowth: 4.0, 
  opexPerRoom: 0, // Zeroed out to prioritize detailed line items
  renovationCostPerUnit: 15000,
  renovationRentPremium: 250
};

const defaultPortfolios: Portfolio[] = [
    { id: 'full', name: 'Full Portfolio', propertyIds: PROPERTIES_DATA.map(p => p.id) },
    { id: 'low-risk', name: 'Low Risk', propertyIds: lowRiskIds },
    { id: 'high-risk', name: 'High Risk', propertyIds: highRiskIds },
];

const defaultFinancingScenario: FinancingScenario = {
    sizingMethod: 'ltv',
    targetDSCR: 1.25,
    targetLTV: 70, 
    manualLoanAmount: 10000000,
    interestRate: 7.5,
    amortizationYears: 30,
    termYears: 5,
    ioPeriodMonths: 0,
    costs: {
      legal: 50000,
      title: 25000,
      inspection: 22000,
      appraisal: 10000,
      mortgageFees: 200000,
      acquisitionFee: 140000,
      reserves: 1000000,
      origination: 1.0,
      thirdParty: 0,
      misc: 0
    }
};

const defaultInvestorReturnsScenario: InvestorReturnsScenario = {
    lpOwnershipPercent: 0.70,
    gpOwnershipPercent: 0.30,
    lpPreferredReturnRate: 0.08,
};

const defaultVisibleKPIs: DashboardKPI[] = [
    'purchasePrice', 'entryCap', 'stabilizedCap', 'leveredCoC', 'leveredIRR', 'noiCurrent', 'occupancyStabilized', 'totalUnits'
];

const initialT12PerRoom: Partial<ExpenseDetail> = {};
const initialProFormaPerRoom: Partial<ExpenseDetail> = {};
(Object.keys(DEFAULT_T12_PER_UNIT) as (keyof ExpenseDetail)[]).forEach(key => {
    const annualVal = DEFAULT_T12_PER_UNIT[key] || 0;
    initialT12PerRoom[key] = annualVal;
    initialProFormaPerRoom[key] = annualVal;
});

const calculateDerivedState = (state: { 
    assumptions: Assumptions; 
    priceAllocations: PriceAllocations; 
    propertyOverrides: PropertyOverrides; 
    portfolios: Portfolio[]; 
    selectedPortfolioId: string; 
    globalT12PerRoom: Partial<ExpenseDetail>;
    globalProFormaPerRoom: Partial<ExpenseDetail>;
}) => {
    const totalAskingPriceFromAssumptions = PROPERTIES_DATA.reduce((sum: number, p) => sum + (p.rooms * state.assumptions.askingPricePerRoom), 0);
    
    const calculatedProperties = PROPERTIES_DATA.map(property => {
        const propertyAllocatedPrice = totalAskingPriceFromAssumptions * ((state.priceAllocations[property.id] || 0) / 100);
        return calculateProperty(
            property, 
            state.assumptions, 
            state.propertyOverrides, 
            propertyAllocatedPrice,
            state.globalT12PerRoom,
            state.globalProFormaPerRoom
        );
    });

    const currentPortfolio = calculatePortfolioUtil(state.selectedPortfolioId, state.portfolios, calculatedProperties);

    return { calculatedProperties, currentPortfolio };
};

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            view: 'overview',
            propertyViewTab: 'overview',
            assumptions: defaultAssumptions,
            propertyOverrides: {},
            priceAllocations: initialAllocations,
            portfolios: defaultPortfolios,
            selectedPortfolioId: 'full',
            modalPropertyId: null,
            financingScenario: defaultFinancingScenario,
            investorReturnsScenario: defaultInvestorReturnsScenario,
            savedScenarios: [],
            savedSnapshots: [],
            returnsViewMode: 'proforma',
            visibleKPIs: defaultVisibleKPIs,
            snapshotModalOpen: false,

            globalT12PerRoom: initialT12PerRoom,
            globalProFormaPerRoom: initialProFormaPerRoom,

            ...calculateDerivedState({
                assumptions: defaultAssumptions,
                propertyOverrides: {},
                priceAllocations: initialAllocations,
                portfolios: defaultPortfolios,
                selectedPortfolioId: 'full',
                globalT12PerRoom: initialT12PerRoom,
                globalProFormaPerRoom: initialProFormaPerRoom
            }),

            // Actions
            setView: (view) => set({ view }),
            setPropertyViewTab: (tab) => set({ propertyViewTab: tab }),
            setAssumptions: (newAssumptions) => {
                const state = get();
                const updatedState = { ...state, assumptions: { ...state.assumptions, ...newAssumptions } };
                set({ ...updatedState, ...calculateDerivedState(updatedState) });
            },
            resetAssumptions: () => {
                const state = get();
                const updatedState = { ...state, assumptions: defaultAssumptions, propertyOverrides: {}, priceAllocations: initialAllocations };
                set({ ...updatedState, ...calculateDerivedState(updatedState) });
            },
            setPriceAllocations: (allocations) => {
                const state = get();
                const updatedState = { ...state, priceAllocations: allocations };
                set({ ...updatedState, ...calculateDerivedState(updatedState) });
            },
            normalizeAllocations: () => {
                const { priceAllocations } = get();
                const total = Object.values(priceAllocations).reduce<number>((sum, val) => sum + (Number(val) || 0), 0);
                if (total === 0) return;
                const normalized: PriceAllocations = {};
                for (const propId in priceAllocations) {
                    const numericPropId = Number(propId);
                    normalized[numericPropId] = ((priceAllocations[numericPropId] || 0) / total) * 100;
                }
                get().setPriceAllocations(normalized);
            },
            setPropertyOverrides: (propertyId, newOverrides) => {
                const state = get();
                const updatedState = {
                    ...state,
                    propertyOverrides: {
                        ...state.propertyOverrides,
                        [propertyId]: { ...state.propertyOverrides[propertyId], ...newOverrides } ,
                    },
                };
                set({ ...updatedState, ...calculateDerivedState(updatedState) });
            },
            setUnitOverride: (propertyId, unitId, override) => {
                const state = get();
                const currentPropertyOverrides = state.propertyOverrides[propertyId] || {};
                const currentUnitOverrides = currentPropertyOverrides.units || {};
                const existingUnitOverride = currentUnitOverrides[unitId] || {};

                const newUnitOverrides = {
                    ...currentUnitOverrides,
                    [unitId]: { ...existingUnitOverride, ...override }
                };
                const newPropertyOverrides = {
                    ...currentPropertyOverrides,
                    units: newUnitOverrides
                };
                const updatedState = {
                    ...state,
                    propertyOverrides: {
                        ...state.propertyOverrides,
                        [propertyId]: newPropertyOverrides
                    }
                };
                set({ ...updatedState, ...calculateDerivedState(updatedState) });
            },
            setExpenseOverride: (propertyId, expenseField, value) => {
                const state = get();
                const currentPropertyOverrides = state.propertyOverrides[propertyId] || {};
                const currentExpenseOverrides = currentPropertyOverrides.expenses || {};
                const newExpenseOverrides = {
                    ...currentExpenseOverrides,
                    [expenseField]: value
                };
                const updatedState = {
                    ...state,
                    propertyOverrides: {
                        ...state.propertyOverrides,
                        [propertyId]: {
                            ...currentPropertyOverrides,
                            expenses: newExpenseOverrides
                        }
                    }
                };
                set({ ...updatedState, ...calculateDerivedState(updatedState) });
            },
            setT12ExpenseOverride: (propertyId, expenseField, value) => {
                const state = get();
                const currentPropertyOverrides = state.propertyOverrides[propertyId] || {};
                const currentT12Overrides = currentPropertyOverrides.t12Expenses || {};
                const newT12Overrides = {
                    ...currentT12Overrides,
                    [expenseField]: value
                };
                const updatedState = {
                    ...state,
                    propertyOverrides: {
                        ...state.propertyOverrides,
                        [propertyId]: {
                            ...currentPropertyOverrides,
                            t12Expenses: newT12Overrides
                        }
                    }
                };
                set({ ...updatedState, ...calculateDerivedState(updatedState) });
            },
            setRenovationOverride: (propertyId, renovation) => {
                const state = get();
                const currentPropertyOverrides = state.propertyOverrides[propertyId] || {};
                const currentRenovations = currentPropertyOverrides.renovation || {};
                const newRenovation = {
                    ...currentRenovations,
                    ...renovation
                };
                const updatedState = {
                    ...state,
                    propertyOverrides: {
                        ...state.propertyOverrides,
                        [propertyId]: {
                            ...currentPropertyOverrides,
                            renovation: newRenovation
                        }
                    }
                };
                set({ ...updatedState, ...calculateDerivedState(updatedState) });
            },
            
            setGlobalT12PerRoom: (field, value) => {
                const state = get();
                const updatedGlobal = { ...state.globalT12PerRoom, [field]: value };
                const updatedState = { ...state, globalT12PerRoom: updatedGlobal };
                set({ ...updatedState, ...calculateDerivedState(updatedState) });
            },
            setGlobalProFormaPerRoom: (field, value) => {
                const state = get();
                const updatedGlobal = { ...state.globalProFormaPerRoom, [field]: value };
                const updatedState = { ...state, globalProFormaPerRoom: updatedGlobal };
                set({ ...updatedState, ...calculateDerivedState(updatedState) });
            },

            setSelectedPortfolioId: (id) => {
                const state = get();
                const updatedState = { ...state, selectedPortfolioId: id };
                const newDerivedState = calculateDerivedState(updatedState);
                const newPrice = newDerivedState.currentPortfolio?.valuation?.askingPrice || 0;
                set({ 
                    ...updatedState, 
                    ...newDerivedState,
                    financingScenario: { ...state.financingScenario, manualLoanAmount: newPrice * (state.financingScenario.targetLTV / 100) }
                });
            },
            addPortfolio: () => {
                const newId = `portfolio-${Date.now()}`;
                set(state => {
                    const newPortfolios = [...state.portfolios, { id: newId, name: `Custom Portfolio ${state.portfolios.length - 2}`, propertyIds: [] }];
                    const updatedState = { ...state, portfolios: newPortfolios, selectedPortfolioId: newId };
                    return { ...updatedState, ...calculateDerivedState(updatedState) };
                });
            },
            deletePortfolio: (portfolioId) => {
                set(state => {
                    const newPortfolios = state.portfolios.filter(p => p.id !== portfolioId);
                    const newSelectedId = state.selectedPortfolioId === portfolioId ? 'full' : state.selectedPortfolioId;
                    const updatedState = { ...state, portfolios: newPortfolios, selectedPortfolioId: newSelectedId };
                    return { ...updatedState, ...calculateDerivedState(updatedState) };
                });
            },
            togglePropertyInPortfolio: (portfolioId, propertyId) => {
                if (['full', 'low-risk', 'high-risk'].includes(portfolioId)) return;
                set(state => {
                    const newPortfolios = state.portfolios.map(p => {
                        if (p.id !== portfolioId) return p;
                        const propertyIds = p.propertyIds.includes(propertyId) ? p.propertyIds.filter(id => id !== propertyId) : [...p.propertyIds, propertyId];
                        return { ...p, propertyIds };
                    });
                    const updatedState = { ...state, portfolios: newPortfolios };
                    return { ...updatedState, ...calculateDerivedState(updatedState) };
                });
            },
            openPropertyModal: (id) => set({ modalPropertyId: id, propertyViewTab: 'overview' }),
            closePropertyModal: () => set({ modalPropertyId: null }),
            setFinancingScenario: (params) => set(state => ({ financingScenario: { ...state.financingScenario, ...params }})),
            setInvestorReturnsScenario: (params) => set(state => ({ investorReturnsScenario: { ...state.investorReturnsScenario, ...params }})),
            applyLoanPreset: (preset) => {
                let newScenario: Partial<FinancingScenario> = {};
                switch (preset) {
                    case 'bridge':
                        newScenario = { sizingMethod: 'ltv', targetLTV: 80, interestRate: 9.5, termYears: 3, ioPeriodMonths: 24, amortizationYears: 30 };
                        break;
                    case 'bank':
                        newScenario = { sizingMethod: 'lower_dscr_ltv', targetLTV: 75, interestRate: 7.5, termYears: 10, ioPeriodMonths: 6, amortizationYears: 25 };
                        break;
                    case 'agency':
                        newScenario = { sizingMethod: 'lower_dscr_ltv', targetLTV: 70, interestRate: 6.5, termYears: 10, ioPeriodMonths: 0, amortizationYears: 30 };
                        break;
                }
                set(state => ({ financingScenario: { ...state.financingScenario, ...newScenario } }));
            },
            saveCurrentScenario: (name, results) => {
                set(state => ({
                    savedScenarios: [
                        ...state.savedScenarios,
                        {
                            id: `scenario-${Date.now()}`,
                            name,
                            inputs: state.financingScenario,
                            results,
                            portfolioId: state.selectedPortfolioId,
                            portfolioName: state.currentPortfolio.name
                        }
                    ]
                }))
            },
            setGlobalPortfolioPrice: (price) => {
                const state = get();
                if (!state.currentPortfolio || state.currentPortfolio.totalRooms === 0) return;
                const newPricePerRoom = price / state.currentPortfolio.totalRooms;
                const updatedState = { 
                    ...state, 
                    assumptions: { ...state.assumptions, askingPricePerRoom: newPricePerRoom } 
                };
                set({ ...updatedState, ...calculateDerivedState(updatedState) });
            },
            setReturnsViewMode: (mode) => set({ returnsViewMode: mode }),
            setVisibleKPIs: (kpis) => set({ visibleKPIs: kpis }),

            // Snapshot Logic
            setSnapshotModalOpen: (open) => set({ snapshotModalOpen: open }),
            saveSnapshot: (name) => {
                const state = get();
                const newSnapshot: DealSnapshot = {
                    id: `snap-${Date.now()}`,
                    name,
                    date: new Date().toISOString(),
                    assumptions: state.assumptions,
                    propertyOverrides: state.propertyOverrides,
                    priceAllocations: state.priceAllocations,
                    financingScenario: state.financingScenario,
                    investorReturnsScenario: state.investorReturnsScenario,
                    globalT12PerRoom: state.globalT12PerRoom,
                    globalProFormaPerRoom: state.globalProFormaPerRoom,
                    portfolios: state.portfolios,
                    selectedPortfolioId: state.selectedPortfolioId
                };
                const updatedSnapshots = [...state.savedSnapshots, newSnapshot];
                set({ savedSnapshots: updatedSnapshots });
            },
            loadSnapshot: (snapshotId) => {
                const state = get();
                const snapshot = state.savedSnapshots.find(s => s.id === snapshotId);
                if (!snapshot) return;

                const updatedState = {
                    ...state,
                    assumptions: snapshot.assumptions,
                    propertyOverrides: snapshot.propertyOverrides,
                    priceAllocations: snapshot.priceAllocations,
                    financingScenario: snapshot.financingScenario,
                    investorReturnsScenario: snapshot.investorReturnsScenario,
                    globalT12PerRoom: snapshot.globalT12PerRoom,
                    globalProFormaPerRoom: snapshot.globalProFormaPerRoom,
                    portfolios: snapshot.portfolios,
                    selectedPortfolioId: snapshot.selectedPortfolioId
                };
                
                set({ ...updatedState, ...calculateDerivedState(updatedState) });
            },
            deleteSnapshot: (snapshotId) => {
                const state = get();
                const updatedSnapshots = state.savedSnapshots.filter(s => s.id !== snapshotId);
                set({ savedSnapshots: updatedSnapshots });
            },
            importSnapshot: (snapshot) => {
                const state = get();
                // Add ID collision check or regenerate ID
                const safeSnapshot = { ...snapshot, id: `snap-imported-${Date.now()}` };
                const updatedSnapshots = [...state.savedSnapshots, safeSnapshot];
                set({ savedSnapshots: updatedSnapshots });
            }
        }),
        {
            name: 'tray-holdings-data',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                assumptions: state.assumptions,
                propertyOverrides: state.propertyOverrides,
                priceAllocations: state.priceAllocations,
                portfolios: state.portfolios,
                selectedPortfolioId: state.selectedPortfolioId,
                financingScenario: state.financingScenario,
                investorReturnsScenario: state.investorReturnsScenario,
                savedScenarios: state.savedScenarios,
                savedSnapshots: state.savedSnapshots,
                returnsViewMode: state.returnsViewMode,
                visibleKPIs: state.visibleKPIs,
                globalT12PerRoom: state.globalT12PerRoom,
                globalProFormaPerRoom: state.globalProFormaPerRoom,
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    const derived = calculateDerivedState(state);
                    state.calculatedProperties = derived.calculatedProperties;
                    state.currentPortfolio = derived.currentPortfolio;
                }
            }
        }
    )
);

// Initialize
const initialPortfolio = useAppStore.getState().currentPortfolio;
if (initialPortfolio) {
    const initialPrice = initialPortfolio.valuation?.askingPrice || 0;
    // Only set if loan amount is 0 or looks like default uncalculated value, otherwise trust persisted value
    const currentLoan = useAppStore.getState().financingScenario.manualLoanAmount;
    if (currentLoan === 0 && initialPrice > 0) {
         useAppStore.setState(state => ({
            financingScenario: {
                ...state.financingScenario,
                manualLoanAmount: initialPrice * (state.financingScenario.targetLTV / 100),
            }
        }));
    }
}
