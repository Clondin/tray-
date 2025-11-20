
import type { ExpenseDetail } from '../types';

// Default T12 Expenses per Unit (Annual)
export const DEFAULT_T12_PER_UNIT: ExpenseDetail = {
    taxes: 0,
    insurance: 0,
    exterminator: 0,
    electric: 0,
    waterSewer: 0,
    gas: 0,
    internet: 0,
    generalAdmin: 2250, // Default $2250/unit as requested
    payroll: 0,
    repairsMaint: 0,
    pestControl: 0,
    wasteManagement: 0,
    management: 0,
    other: 0
};
