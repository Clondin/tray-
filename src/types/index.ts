
export type View = 'overview' | 'portfolio' | 'expenses' | 'financing' | 'audit' | 'returns';
export type PropertyTab = 'overview' | 'rentroll' | 'expenses' | 'renovations';

export interface PropertyData {
  id: number;
  address: string;
  rooms: number;
  occupancy: number;
  city: string;
  type?: string;
  imageUrl?: string;
}

export interface Unit {
  unitId: string;
  status: 'Occupied' | 'Vacant';
  tenantName: string;
  currentRent: number;
  proFormaRent: number;
}

export interface Financials {
  occupiedRooms: number;
  occupancy: number;
  gri: number;
  opex: number;
  noi: number;
  capRate: number;
}

export interface Valuation {
  askingPrice: number;
  stabilizedValue: number;
  pricePerRoom: number;
  upside: number;
}

export interface ExpenseDetail {
  taxes: number;
  insurance: number;
  exterminator: number;
  electric: number;
  waterSewer: number;
  gas: number;
  internet: number;
  generalAdmin: number;
  payroll: number;
  repairsMaint: number;
  pestControl: number;
  wasteManagement: number;
  management: number;
  other: number;
}

export interface RenovationProfile {
  enabled: boolean;
  unitsToRenovate: number; // Count of units
  costPerUnit: number;
  rentPremiumPerUnit: number; // Monthly premium
  totalCapEx: number;
  valueCreation: number;
  roi: number;
}

export interface CalculatedProperty extends PropertyData {
  current: Financials;
  stabilized: Financials;
  valuation: Valuation;
  units: Unit[];
  currentExpenseDetail: ExpenseDetail; // T12 Details
  stabilizedExpenseDetail: ExpenseDetail; // Pro Forma Details
  expenseDetail: ExpenseDetail; // Legacy alias for stabilizedExpenseDetail
  renovation: RenovationProfile;
}

export interface Portfolio {
  id: string;
  name: string;
  propertyIds: number[];
  color?: string;
}

export interface Assumptions {
  marketRent: number;
  stabilizedOccupancy: number;
  expenseRatio: number; // Pro Forma Expense Ratio
  t12ExpenseRatio: number; // T12 Actuals (Inefficient)
  rentLift: number; 
  capRate: number;
  askingPricePerRoom: number;
  rentGrowth: number;
  opexGrowth: number;
  opexPerRoom: number; // Legacy support
  // Global Renovation Defaults
  renovationCostPerUnit: number;
  renovationRentPremium: number;
}

export interface UnitOverride {
  status?: 'Occupied' | 'Vacant';
  tenantName?: string;
  currentRent?: number;
  proFormaRent?: number;
}

export interface PropertyOverrides {
  [propertyId: number]: {
    currentOccupancy?: number;
    stabilizedOccupancy?: number;
    rent?: number;
    opexPerRoom?: number; // Pro Forma Ratio Override (Legacy Name)
    t12ExpenseRatio?: number; // T12 Override
    capRate?: number; // Exit Cap Rate Override
    units?: { [unitId: string]: UnitOverride };
    expenses?: Partial<ExpenseDetail>; // Pro Forma Expense Override
    t12Expenses?: Partial<ExpenseDetail>; // T12 Expense Override
    renovation?: Partial<RenovationProfile>;
  };
}

export interface PriceAllocations {
    [propertyId: number]: number;
}

export interface FinancingScenario {
  sizingMethod: 'dscr' | 'ltv' | 'lower_dscr_ltv' | 'manual';
  targetDSCR: number;
  targetLTV: number;
  manualLoanAmount: number;
  interestRate: number;
  amortizationYears: number;
  termYears: number;
  ioPeriodMonths: number;
  costs: {
    legal: number;
    title: number;
    inspection: number;
    appraisal: number;
    mortgageFees: number;
    acquisitionFee: number;
    reserves: number;
    origination: number;
    thirdParty: number;
    misc: number;
  }
}

export interface InvestorReturnsScenario {
  lpOwnershipPercent: number;
  gpOwnershipPercent: number;
  lpPreferredReturnRate: number;
}

export interface SavedFinancingScenario {
    id: string;
    name: string;
    inputs: FinancingScenario;
    results: any;
    portfolioId: string;
    portfolioName: string;
}

export interface DealSnapshot {
  id: string;
  name: string;
  date: string;
  assumptions: Assumptions;
  propertyOverrides: PropertyOverrides;
  priceAllocations: PriceAllocations;
  financingScenario: FinancingScenario;
  investorReturnsScenario: InvestorReturnsScenario;
  globalT12PerRoom: Partial<ExpenseDetail>;
  globalProFormaPerRoom: Partial<ExpenseDetail>;
  portfolios: Portfolio[];
  selectedPortfolioId: string;
}

export interface CommercialLoanParams {
    purchasePrice: number;
    additionalCosts: number;
    loanAmount: number;
    interestRate: number;
    amortizationYears: number;
    termYears: number;
    ioPeriodMonths: number;
}

export interface AmortizationEntry {
    year: number;
    principal: number;
    interest: number;
    remainingBalance: number;
}

export type DashboardKPI = 'purchasePrice' | 'entryCap' | 'stabilizedCap' | 'leveredCoC' | 'leveredIRR' | 'noiCurrent' | 'noiStabilized' | 'occupancyCurrent' | 'occupancyStabilized' | 'totalUnits';
