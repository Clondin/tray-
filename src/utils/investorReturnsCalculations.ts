
import type { Assumptions, FinancingScenario, InvestorReturnsScenario } from '../types';
import { generateAmortizationSchedule } from './amortization';

export interface AnnualInvestorReturnRow {
  yearIndex: number;
  yearNumber: number;
  annualCashFlow: number;
  lpPref: number;
  cashAfterPref: number;
  lpSplit: number;
  gpSplit: number;
  lpTotalDist: number;
  gpTotalDist: number;
  lpCashOnCash: number; // Operating Cash-on-Cash only
}

export interface LPReturnsSummary {
  capitalContribution: number;
  totalDistributions: number;
  totalProfit: number;
  equityMultiple: number;
  irr: number | null;
  averageCashOnCash: number;
}

export interface GPReturnsSummary {
  capitalContribution: number;
  totalDistributions: number;
  totalProfit: number;
  equityMultiple: number;
  irr: number | null;
  averageCashOnCash: number;
}

export interface InvestorLevelSummary {
  profitShare: number;   // total LP profit pool (not including principal)
  cashFlow: number;      // total LP distributions (principal + profit)
  equityMultiple: number;
  irr: number | null;
  averageCashOnCash: number;
}

export interface DealReturns {
  annual: AnnualInvestorReturnRow[];
  lp: LPReturnsSummary;
  gp: GPReturnsSummary;
  investor: InvestorLevelSummary;
  totalEquityRequired: number;
}

// Helper to calculate IRR using Newton-Raphson
function calculateIRR(cashFlows: number[], guess = 0.1): number | null {
    const maxIter = 1000;
    const precision = 1e-7;
    let rate = guess;
  
    for (let i = 0; i < maxIter; i++) {
      let npv = 0;
      let dNpv = 0;
  
      for (let t = 0; t < cashFlows.length; t++) {
        const div = Math.pow(1 + rate, t);
        npv += cashFlows[t] / div;
        dNpv -= (t * cashFlows[t]) / (div * (1 + rate));
      }
  
      if (Math.abs(npv) < precision) return rate * 100;
  
      const newRate = rate - npv / dNpv;
      if (Math.abs(newRate - rate) < precision) return newRate * 100;
      rate = newRate;
    }
  
    return null; // Failed to converge
}

// Helper: Run the single-tier waterfall logic
function runWaterfall(
    distributableCash: number, 
    lpCapital: number, 
    lpPrefRate: number, 
    lpPct: number, 
    gpPct: number
) {
    // Step 1: LP Pref (paid from available cash, no accrual)
    const lpPrefAmount = lpCapital * lpPrefRate;
    const paidPref = Math.min(distributableCash, lpPrefAmount);
    
    // Step 2: Residual
    let cashAfterPref = distributableCash - paidPref;
    if (cashAfterPref < 0) cashAfterPref = 0;

    // Step 3: Split
    const lpSplit = cashAfterPref * lpPct;
    const gpSplit = cashAfterPref * gpPct;

    return {
        lpTotalDist: paidPref + lpSplit,
        gpTotalDist: gpSplit,
        paidPref,
        lpSplit,
        gpSplit,
        cashAfterPref
    };
}

export function calculateInvestorReturns(
  portfolio: any, // Typed as 'any' to avoid deep dependency issues with Portfolio type in utils
  loanCalcs: any,
  assumptions: Assumptions,
  investorReturnsScenario: InvestorReturnsScenario,
  financingScenario: FinancingScenario
): DealReturns | null {

    if (!portfolio || !loanCalcs) return null;

    const totalEquityRequired = loanCalcs.equityRequired;
    if (totalEquityRequired <= 0) return null;

    const { lpOwnershipPercent, gpOwnershipPercent, lpPreferredReturnRate } = investorReturnsScenario;
    
    // Capital Contributions:
    // LP funds 100% of the equity requirement.
    // GP funds 0% (sweat equity / promote only).
    const lpCapitalContribution = totalEquityRequired;
    const gpCapitalContribution = 0;

    // Projection Parameters
    const termYears = financingScenario.termYears || 5;
    const rentGrowthRate = (assumptions.rentGrowth || 0) / 100;
    const opexGrowthRate = (assumptions.opexGrowth || 0) / 100;
    const exitCapRate = (assumptions.capRate || 0) / 100;

    // Amortization Schedule for debt service & balloon
    const loanParams = {
        loanAmount: loanCalcs.effectiveLoanAmount,
        interestRate: financingScenario.interestRate,
        amortizationYears: financingScenario.amortizationYears,
        termYears: termYears,
        ioPeriodMonths: financingScenario.ioPeriodMonths,
        purchasePrice: 0,
        additionalCosts: 0
    };
    const amortSchedule = generateAmortizationSchedule(loanParams, { monthlyPAndIPayment: loanCalcs.monthlyPAndIPayment });

    // Annual Data Arrays
    const annualRows: AnnualInvestorReturnRow[] = [];
    const lpCashFlows: number[] = [-lpCapitalContribution];
    // GP Cash flows start at 0 since they put in no money
    const gpCashFlows: number[] = [0];

    const currentGRI = portfolio.current?.gri || 0;
    const currentOpEx = portfolio.current?.opex || 0;
    const stabilizedGRI = portfolio.stabilized?.gri || 0;
    const stabilizedOpEx = portfolio.stabilized?.opex || 0;

    for (let year = 1; year <= termYears; year++) {
        // 1. Operating Cash Flow
        let baseGRI, baseOpEx;

        if (year === 1) {
            baseGRI = currentGRI;
            baseOpEx = currentOpEx;
        } else {
            baseGRI = stabilizedGRI;
            baseOpEx = stabilizedOpEx;
        }

        const yearGRI = baseGRI * Math.pow(1 + rentGrowthRate, year);
        const yearOpEx = baseOpEx * Math.pow(1 + opexGrowthRate, year);
        const yearNOI = yearGRI - yearOpEx;

        // Debt Service
        let annualDebtService = 0;
        const scheduleRow = amortSchedule.find(r => r.year === year);
        annualDebtService = scheduleRow ? (scheduleRow.principal + scheduleRow.interest) : loanCalcs.annualDebtService;

        const operatingDistributable = Math.max(0, yearNOI - annualDebtService);

        // 2. Sale Event (Capital Event)
        let saleDistributable = 0;
        if (year === termYears) {
            const salePrice = exitCapRate > 0 ? yearNOI / exitCapRate : 0;
            const remainingBalance = scheduleRow ? scheduleRow.remainingBalance : 0;
            saleDistributable = Math.max(0, salePrice - remainingBalance);
        }

        const totalDistributable = operatingDistributable + saleDistributable;

        // 3. Calculate Actual Distributions (Total) for IRR/EM
        const waterfallTotal = runWaterfall(
            totalDistributable, 
            lpCapitalContribution, 
            lpPreferredReturnRate, 
            lpOwnershipPercent, 
            gpOwnershipPercent
        );

        // 4. Calculate Operating Distributions ONLY for Cash-on-Cash metric
        // This ensures the CoC yield isn't distorted by the sale proceeds in the final year.
        const waterfallOp = runWaterfall(
            operatingDistributable,
            lpCapitalContribution,
            lpPreferredReturnRate,
            lpOwnershipPercent,
            gpOwnershipPercent
        );

        // Metrics
        const lpCashOnCash = lpCapitalContribution > 0 ? waterfallOp.lpTotalDist / lpCapitalContribution : 0;
        // GP CoC is technically infinite/undefined if they have 0 basis. We return 0 here to avoid NaN in charts.
        
        // Add to history
        annualRows.push({
            yearIndex: year,
            yearNumber: year,
            annualCashFlow: totalDistributable,
            lpPref: waterfallTotal.paidPref,
            cashAfterPref: waterfallTotal.cashAfterPref,
            lpSplit: waterfallTotal.lpSplit,
            gpSplit: waterfallTotal.gpSplit,
            lpTotalDist: waterfallTotal.lpTotalDist,
            gpTotalDist: waterfallTotal.gpTotalDist,
            lpCashOnCash: lpCashOnCash 
        });

        lpCashFlows.push(waterfallTotal.lpTotalDist);
        gpCashFlows.push(waterfallTotal.gpTotalDist);
    }

    // Summaries
    const lpTotalDistributions = lpCashFlows.reduce((sum, val) => sum + (val > 0 ? val : 0), 0);
    const gpTotalDistributions = gpCashFlows.reduce((sum, val) => sum + (val > 0 ? val : 0), 0);

    // Average Cash on Cash is the average of the OPERATING yields (excluding sale)
    const lpAvgCoC = annualRows.reduce((sum, r) => sum + r.lpCashOnCash, 0) / termYears;
    
    const lpReturns: LPReturnsSummary = {
        capitalContribution: lpCapitalContribution,
        totalDistributions: lpTotalDistributions,
        totalProfit: lpTotalDistributions - lpCapitalContribution,
        equityMultiple: lpCapitalContribution > 0 ? lpTotalDistributions / lpCapitalContribution : 0,
        irr: calculateIRR(lpCashFlows),
        averageCashOnCash: lpAvgCoC
    };

    // GP Returns - ROI metrics are not applicable (N/A) for 0 investment
    const gpReturns: GPReturnsSummary = {
        capitalContribution: gpCapitalContribution, // 0
        totalDistributions: gpTotalDistributions,
        totalProfit: gpTotalDistributions, // No cost basis
        equityMultiple: 0, // N/A
        irr: null, // N/A
        averageCashOnCash: 0 // N/A
    };

    const investorSummary: InvestorLevelSummary = {
        profitShare: lpReturns.totalProfit,
        cashFlow: lpReturns.totalDistributions,
        equityMultiple: lpReturns.equityMultiple,
        irr: lpReturns.irr,
        averageCashOnCash: lpReturns.averageCashOnCash
    };

    return {
        annual: annualRows,
        lp: lpReturns,
        gp: gpReturns,
        investor: investorSummary,
        totalEquityRequired
    };
}
