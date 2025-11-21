
import type { PropertyData, CalculatedProperty, Assumptions, PropertyOverrides, Unit, ExpenseDetail, RenovationProfile } from '../types';
import { RAW_RENT_ROLL } from '../data/RENT_ROLL';

const ZERO_EXPENSES: ExpenseDetail = {
    taxes: 0,
    insurance: 0,
    exterminator: 0,
    electric: 0,
    waterSewer: 0,
    gas: 0,
    internet: 0,
    generalAdmin: 0,
    payroll: 0,
    repairsMaint: 0,
    pestControl: 0,
    wasteManagement: 0,
    management: 0,
    other: 0
};

export const calculateProperty = (
  property: PropertyData, 
  assumptions: Assumptions, 
  propertyOverrides: PropertyOverrides, 
  allocatedPrice: number,
  globalT12PerRoom: Partial<ExpenseDetail> = {},
  globalProFormaPerRoom: Partial<ExpenseDetail> = {}
): CalculatedProperty => {
  const overrides = propertyOverrides[property.id] || {};
  const unitOverrides = overrides.units || {};
  
  // Overrides or Defaults
  const marketRent = overrides.rent || assumptions.marketRent;
  const stabilizedOcc = overrides.stabilizedOccupancy || assumptions.stabilizedOccupancy;
  const exitCapRate = overrides.capRate || assumptions.capRate;
  
  // Expense Detail Overrides
  const proFormaExpenseOverrides = overrides.expenses || {};
  const t12ExpenseOverrides = overrides.t12Expenses || {};
  const renovationOverride = overrides.renovation || {};

  const rentLift = assumptions.rentLift || 0; // % Lift

  // --- 1. Pre-Calculate Vacancy to Determine Renovation Defaults ---
  const rawPropertyUnits = RAW_RENT_ROLL.filter(r => r.propertyId === property.id);
  let calculatedVacantCount = 0;

  if (rawPropertyUnits.length > 0) {
      calculatedVacantCount = rawPropertyUnits.reduce((count, u) => {
          const uOverride = unitOverrides[u.unit] || {};
          const resolvedStatus = uOverride.status || u.status;
          return resolvedStatus === 'Vacant' ? count + 1 : count;
      }, 0);
  } else {
      // Fallback for properties with no rent roll data
      const assumedOcc = overrides.currentOccupancy !== undefined ? overrides.currentOccupancy : property.occupancy;
      const assumedOccupied = Math.round((assumedOcc / 100) * property.rooms);
      calculatedVacantCount = Math.max(0, property.rooms - assumedOccupied);
  }

  // --- Renovation Calculation ---
  // Default: Enabled if vacancies exist. Scope matches vacancy count.
  const renoEnabled = renovationOverride.enabled !== undefined 
      ? renovationOverride.enabled 
      : (calculatedVacantCount > 0);

  const renoUnits = renovationOverride.unitsToRenovate !== undefined 
      ? renovationOverride.unitsToRenovate 
      : (calculatedVacantCount > 0 ? calculatedVacantCount : property.rooms);

  const renoCostPerUnit = renovationOverride.costPerUnit !== undefined ? renovationOverride.costPerUnit : assumptions.renovationCostPerUnit;
  const renoPremium = renovationOverride.rentPremiumPerUnit !== undefined ? renovationOverride.rentPremiumPerUnit : assumptions.renovationRentPremium;
  
  const totalCapEx = renoEnabled ? renoUnits * renoCostPerUnit : 0;
  
  // --- Rent Roll Integration ---
  let units: Unit[] = [];

  if (rawPropertyUnits.length > 0) {
    units = rawPropertyUnits.map(u => {
      const uOverride = unitOverrides[u.unit] || {};
      const resolvedStatus = uOverride.status || (u.status as 'Occupied' | 'Vacant');
      
      let effectiveCurrentRent = 0;
      if (resolvedStatus === 'Occupied') {
          effectiveCurrentRent = uOverride.currentRent !== undefined ? uOverride.currentRent : (u.rent || 0);
      }
      
      // Logic: 
      // If Reno Enabled: Target = Market Rent + Additional Premium
      // If Reno Disabled: Target = Market Rent (Default) or specific override.
      
      const baseProForma = uOverride.proFormaRent !== undefined ? uOverride.proFormaRent : marketRent;
      let liftedProForma = baseProForma * (1 + (rentLift / 100));

      if (renoEnabled) {
          // If enabled, we explicitly assume we hit Market + Premium
          liftedProForma = marketRent + renoPremium;
      }

      return {
        unitId: u.unit,
        status: resolvedStatus,
        tenantName: uOverride.tenantName !== undefined ? uOverride.tenantName : u.tenant,
        currentRent: effectiveCurrentRent,
        proFormaRent: liftedProForma,
      };
    });
  } else {
      for(let i = 1; i <= property.rooms; i++) {
          const uId = i.toString();
          const uOverride = unitOverrides[uId] || {};
          const resolvedStatus = uOverride.status || 'Occupied';
          
          let effectiveCurrentRent = 0;
          if (resolvedStatus === 'Occupied') {
             effectiveCurrentRent = uOverride.currentRent !== undefined ? uOverride.currentRent : marketRent;
          }
          
          const baseProForma = uOverride.proFormaRent !== undefined ? uOverride.proFormaRent : marketRent;
          let liftedProForma = baseProForma * (1 + (rentLift / 100));
          
          if (renoEnabled) {
              liftedProForma = marketRent + renoPremium;
          }

          units.push({
              unitId: uId,
              status: resolvedStatus,
              tenantName: uOverride.tenantName || `Tenant ${i}`,
              currentRent: effectiveCurrentRent,
              proFormaRent: liftedProForma,
          })
      }
  }

  // 3. Calculate actuals from Rent Roll
  const actualOccupiedCount = units.filter(u => u.status === 'Occupied').length;
  const actualUnitCount = units.length;
  
  // Annualized Current Rent from the roll
  const actualCurrentGRI = units.reduce((sum, u) => sum + u.currentRent, 0) * 12; 
  const avgCurrentRent = actualOccupiedCount > 0 ? (actualCurrentGRI / 12) / actualOccupiedCount : 0;
  
  // Annualized Pro Forma Rent (Potential Gross Income)
  const potentialGrossIncome = units.reduce((sum, u) => sum + u.proFormaRent, 0) * 12;

  const actualOccupancyPct = actualUnitCount > 0 ? (actualOccupiedCount / actualUnitCount) * 100 : 0;

  const currentOcc = overrides.currentOccupancy !== undefined ? overrides.currentOccupancy : actualOccupancyPct;
  
  // --- Current Financials (T12) ---
  const currentOccupiedRooms = overrides.currentOccupancy !== undefined 
      ? Math.round((currentOcc / 100) * property.rooms)
      : actualOccupiedCount;
      
  const currentGRI = overrides.currentOccupancy !== undefined 
      ? currentOccupiedRooms * marketRent * 12 
      : actualCurrentGRI;

  // Calculate T12 OpEx
  let currentOpex = 0;
  let currentExpenseDetail: ExpenseDetail = { ...ZERO_EXPENSES };

  const keys = Object.keys(ZERO_EXPENSES) as (keyof ExpenseDetail)[];
  
  // 1. Apply Global Defaults (Per Unit * Rooms)
  keys.forEach(key => {
      const globalPerRoom = globalT12PerRoom[key] || 0;
      currentExpenseDetail[key] = globalPerRoom * property.rooms; 
  });

  // 2. Apply Specific Property Overrides
  if (Object.values(t12ExpenseOverrides).some(v => v !== undefined)) {
      keys.forEach(key => {
          if (t12ExpenseOverrides[key] !== undefined) {
              currentExpenseDetail[key] = t12ExpenseOverrides[key]!;
          }
      });
  }

  // 3. Sum it up
  currentOpex = Object.values(currentExpenseDetail).reduce((sum, val) => sum + val, 0);
  const currentNOI = currentGRI - currentOpex;
  
  // --- Stabilized Financials (Pro Forma) ---
  const stabilizedOccupiedRooms = Math.round((stabilizedOcc / 100) * property.rooms);
  const stabilizedGRI = potentialGrossIncome * (stabilizedOcc / 100);
  
  // Calculate Stabilized OpEx
  let stabilizedOpex = 0;
  let stabilizedExpenseDetail: ExpenseDetail = { ...ZERO_EXPENSES };

  // 1. Apply Global Defaults (Per Unit * Rooms)
  keys.forEach(key => {
      const globalPerRoom = globalProFormaPerRoom[key] || 0;
      stabilizedExpenseDetail[key] = globalPerRoom * property.rooms;
  });

  // 2. Apply Specific Property Overrides
  if (Object.values(proFormaExpenseOverrides).some(v => v !== undefined)) {
      keys.forEach(key => {
          if (proFormaExpenseOverrides[key] !== undefined) {
              stabilizedExpenseDetail[key] = proFormaExpenseOverrides[key]!;
          }
      });
  }

  // 3. Sum it up
  stabilizedOpex = Object.values(stabilizedExpenseDetail).reduce((sum, val) => sum + val, 0);
  const stabilizedNOI = stabilizedGRI - stabilizedOpex;
  
  // --- Valuation ---
  const askingPrice = allocatedPrice;
  const stabilizedValue = stabilizedNOI > 0 ? stabilizedNOI / (exitCapRate / 100) : 0;
  const currentCapRate = askingPrice > 0 ? (currentNOI / askingPrice) * 100 : 0;
  const stabilizedCapRate = askingPrice > 0 ? (stabilizedNOI / askingPrice) * 100 : 0;
  
  const upside = askingPrice > 0 ? ((stabilizedValue - askingPrice) / askingPrice) * 100 : 0;

  // --- Value Creation Logic ---
  // Lift from Renovation = (Market Rent + Premium - Current Rent) * Units * 12 / Cap Rate
  
  let renovationValueCreation = 0;
  if (renoEnabled) {
      // Average Lift per renovated unit
      const targetRent = marketRent + renoPremium;
      const liftPerUnit = Math.max(0, targetRent - avgCurrentRent);
      const annualRenovationLift = liftPerUnit * renoUnits * 12;
      renovationValueCreation = annualRenovationLift / (exitCapRate / 100);
  }

  const renovationROI = totalCapEx > 0 ? (renovationValueCreation - totalCapEx) / totalCapEx : 0;

  const renovationProfile: RenovationProfile = {
      enabled: renoEnabled,
      unitsToRenovate: renoUnits,
      costPerUnit: renoCostPerUnit,
      rentPremiumPerUnit: renoPremium,
      totalCapEx,
      valueCreation: renovationValueCreation,
      roi: renovationROI
  };

  return {
    ...property,
    current: { occupiedRooms: currentOccupiedRooms, occupancy: currentOcc, gri: currentGRI, opex: currentOpex, noi: currentNOI, capRate: currentCapRate },
    stabilized: { occupiedRooms: stabilizedOccupiedRooms, occupancy: stabilizedOcc, gri: stabilizedGRI, opex: stabilizedOpex, noi: stabilizedNOI, capRate: stabilizedCapRate },
    valuation: { askingPrice, stabilizedValue, pricePerRoom: askingPrice / property.rooms, upside },
    units,
    currentExpenseDetail,
    stabilizedExpenseDetail,
    expenseDetail: stabilizedExpenseDetail, // Legacy alias
    renovation: renovationProfile
  };
};
