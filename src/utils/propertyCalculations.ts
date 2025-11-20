
import type { PropertyData, CalculatedProperty, Assumptions, PropertyOverrides, Unit, ExpenseDetail } from '../types';
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

  const rentLift = assumptions.rentLift || 0; // % Lift

  // --- Rent Roll Integration ---
  const rawPropertyUnits = RAW_RENT_ROLL.filter(r => r.propertyId === property.id);
  
  let units: Unit[] = [];

  if (rawPropertyUnits.length > 0) {
    units = rawPropertyUnits.map(u => {
      const uOverride = unitOverrides[u.unit] || {};
      const resolvedStatus = uOverride.status || (u.status as 'Occupied' | 'Vacant');
      
      let effectiveCurrentRent = 0;
      if (resolvedStatus === 'Occupied') {
          effectiveCurrentRent = uOverride.currentRent !== undefined ? uOverride.currentRent : (u.rent || 0);
      }
      
      const baseProForma = uOverride.proFormaRent !== undefined ? uOverride.proFormaRent : (marketRent);
      const liftedProForma = baseProForma * (1 + (rentLift / 100));

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
          const liftedProForma = baseProForma * (1 + (rentLift / 100));

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

  return {
    ...property,
    current: { occupiedRooms: currentOccupiedRooms, occupancy: currentOcc, gri: currentGRI, opex: currentOpex, noi: currentNOI, capRate: currentCapRate },
    stabilized: { occupiedRooms: stabilizedOccupiedRooms, occupancy: stabilizedOcc, gri: stabilizedGRI, opex: stabilizedOpex, noi: stabilizedNOI, capRate: stabilizedCapRate },
    valuation: { askingPrice, stabilizedValue, pricePerRoom: askingPrice / property.rooms, upside },
    units,
    currentExpenseDetail,
    stabilizedExpenseDetail,
    expenseDetail: stabilizedExpenseDetail // Legacy alias
  };
};
