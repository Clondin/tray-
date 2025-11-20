
import type { ExpenseDetail } from '../types';

// Default T12 Expenses per Unit (Monthly or Annually based on usage, here treated as Annual Per Unit for the logic)
export const DEFAULT_T12_PER_UNIT: ExpenseDetail = {
    taxes: 116,
    insurance: 152,
    exterminator: 17,
    electric: 49,
    waterSewer: 69,
    gas: 76,
    internet: 9,
    generalAdmin: 5,
    payroll: 100,
    repairsMaint: 34,
    pestControl: 0,
    wasteManagement: 30,
    management: 0,
    other: 0
};
