
import type { Assumptions, FinancingScenario, InvestorReturnsScenario } from '../types';
import { useAppStore } from '../store/appStore';
import { calculateAnnualDebtConstant } from './loanCalculations';

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
  // New Fields for Refi Visualization
  debtService: number;
  refiProceeds: number;
  outstandingBalance: number;
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

interface WaterfallResult {
    lpTotalDist: number;
    gpTotalDist: number;
    paidPref: number;
    lpSplit: number;
    gpSplit: number;
    cashAfterPref: number;
    unreturnedCapitalAfter: number;
    accruedPrefAfter: number;
}

// Helper: Run the Simplified Waterfall logic
// 1. Pref: 100% to LP until Pref met.
// 2. Residual Split: Always split based on ownership % (e.g., 70/30).
//    LP share reduces unreturned capital until it hits 0.
function runWaterfall(
    distributableCash: number, 
    unreturnedCapitalStart: number,
    accruedPrefStart: number,
    lpPrefRate: number, 
    lpOwnershipPct: number, 
    gpOwnershipPct: number
): WaterfallResult {
    let remainingCash = distributableCash;
    
    // --- Step 1: Preferred Return ---
    // Calculate this year's pref accrual based on unreturned capital
    const currentYearPref = unreturnedCapitalStart * lpPrefRate;
    const totalPrefDue = accruedPrefStart + currentYearPref;
    
    const paidPref = Math.min(remainingCash, totalPrefDue);
    remainingCash -= paidPref;
    
    const accruedPrefAfter = totalPrefDue - paidPref;

    // --- Step 2: Residual Split ---
    // All remaining cash is split based on ownership percentages.
    // There is no "promote" tier that changes the split.
    
    const lpSplit = remainingCash * lpOwnershipPct;
    const gpSplit = remainingCash * gpOwnershipPct;
    
    // Update Unreturned Capital
    // The LP's portion of the residual cash flow reduces their unreturned capital basis.
    let currentUnreturned = unreturnedCapitalStart;
    currentUnreturned -= lpSplit;
    
    // Ensure it doesn't go below zero
    if (currentUnreturned < 0) currentUnreturned = 0;

    return {
        lpTotalDist: paidPref + lpSplit,
        gpTotalDist: gpSplit,
        paidPref,
        lpSplit,
        gpSplit,
        cashAfterPref: distributableCash - paidPref, // Purely informational for display
        unreturnedCapitalAfter: currentUnreturned,
        accruedPrefAfter
    };
}

export function calculateInvestorReturns(
  portfolio: any, // Typed as 'any' to avoid deep dependency issues with Portfolio type in utils
  loanCalcs: any,
  assumptions: Assumptions,
  investorReturnsScenario: InvestorReturnsScenario,
  financingScenario: FinancingScenario
): DealReturns | null {

    const refinanceScenario = useAppStore.getState().refinanceScenario;

    if (!portfolio || !loanCalcs) return null;

    const totalEquityRequired = loanCalcs.equityRequired;
    if (totalEquityRequired <= 0) return null;

    const { lpOwnershipPercent, gpOwnershipPercent, lpPreferredReturnRate } = investorReturnsScenario;
    
    const lpCapitalContribution = totalEquityRequired;
    const gpCapitalContribution = 0;

    const termYears = Math.max(financingScenario.termYears || 5, Math.ceil(refinanceScenario.refinanceMonth / 12));
    
    const rentGrowthRate = (assumptions.rentGrowth || 0) / 100;
    const opexGrowthRate = (assumptions.opexGrowth || 0) / 100;
    const exitCapRate = (assumptions.capRate || 0) / 100;

    // --- Acquisition Loan Schedule ---
    const acqLoanParams = {
        loanAmount: loanCalcs.effectiveLoanAmount,
        interestRate: financingScenario.interestRate,
        amortizationYears: financingScenario.amortizationYears,
        termYears: 30,
        ioPeriodMonths: financingScenario.ioPeriodMonths,
        purchasePrice: 0,
        additionalCosts: 0
    };
    
    let acqLoanBalance = acqLoanParams.loanAmount;
    const acqMonthlyRate = acqLoanParams.interestRate / 100 / 12;
    const acqMonthlyPAndI = loanCalcs.monthlyPAndIPayment;
    
    const getAcqLoanBalanceAtMonth = (month: number) => {
        let balance = acqLoanParams.loanAmount;
        for(let m=1; m<=month; m++) {
             const interest = balance * acqMonthlyRate;
             let principal = 0;
             if (m > acqLoanParams.ioPeriodMonths) {
                 principal = acqMonthlyPAndI - interest;
             }
             balance -= principal;
             if (balance < 0) balance = 0;
        }
        return balance;
    };

    // --- Refi Loan Setup ---
    let refiLoanAmount = 0;
    let refiMonthlyPayment = 0;
    let refiHappened = false;
    let refiNetProceeds = 0; 
    let refiBalance = 0;

    const refiYear = Math.ceil(refinanceScenario.refinanceMonth / 12);

    const annualRows: AnnualInvestorReturnRow[] = [];
    const lpCashFlows: number[] = [-lpCapitalContribution];
    const gpCashFlows: number[] = [0];

    // Track Waterfall State
    let unreturnedCapital = lpCapitalContribution;
    let accruedPref = 0;

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

        const yearGRI = baseGRI * Math.pow(1 + rentGrowthRate, year - 1);
        const yearOpEx = baseOpEx * Math.pow(1 + opexGrowthRate, year - 1);
        const yearNOI = yearGRI - yearOpEx;

        // --- Debt Service Logic ---
        let annualDebtService = 0;
        let yearEndBalance = 0;
        
        const isRefiYear = refinanceScenario.enabled && year === refiYear;
        const isPostRefi = refinanceScenario.enabled && year > refiYear;

        if (isRefiYear) {
            const refiValuation = yearNOI / (refinanceScenario.valuationCapRate / 100);
            const maxLoanLTV = refiValuation * (refinanceScenario.maxLTV / 100);
            
            const refiConstant = calculateAnnualDebtConstant(refinanceScenario.interestRate, refinanceScenario.amortizationYears);
            const maxLoanDSCR = refiConstant > 0 ? yearNOI / (refinanceScenario.minDSCR * refiConstant) : 0;
            
            refiLoanAmount = Math.min(maxLoanLTV, maxLoanDSCR);
            
            const payoffBalance = getAcqLoanBalanceAtMonth(refinanceScenario.refinanceMonth);
            
            // Calculate total refi costs
            const refiCostsObj = refinanceScenario.costs;
            const refiOrigination = refiLoanAmount * (refiCostsObj.origination / 100);
            const totalRefiCosts = refiOrigination + refiCostsObj.legal + refiCostsObj.title + 
                                   refiCostsObj.appraisal + refiCostsObj.mortgageFees + 
                                   refiCostsObj.reserves + refiCostsObj.thirdParty + refiCostsObj.misc;

            refiNetProceeds = refiLoanAmount - payoffBalance - totalRefiCosts;
            
            // Debt Service for current year (simplified: assume old loan service for the year, refi happens at end)
            let oldLoanYearlyDebt = 0;
            for(let m=1; m<=12; m++) {
                const absMonth = (year-1)*12 + m;
                if (absMonth <= acqLoanParams.ioPeriodMonths) {
                    oldLoanYearlyDebt += (acqLoanParams.loanAmount * (acqLoanParams.interestRate/100/12));
                } else {
                    oldLoanYearlyDebt += loanCalcs.monthlyPAndIPayment;
                }
            }
            annualDebtService = oldLoanYearlyDebt;
            yearEndBalance = refiLoanAmount; 
            
            const refiMonthlyRate = refinanceScenario.interestRate / 100 / 12;
            const refiNumPmts = refinanceScenario.amortizationYears * 12;
            const refiFactor = (refiMonthlyRate * Math.pow(1 + refiMonthlyRate, refiNumPmts)) / (Math.pow(1 + refiMonthlyRate, refiNumPmts) - 1);
            refiMonthlyPayment = refiLoanAmount * refiFactor;
            refiBalance = refiLoanAmount;
            refiHappened = true;

        } else if (isPostRefi) {
            annualDebtService = refiMonthlyPayment * 12;
            const refiMonthlyRate = refinanceScenario.interestRate / 100 / 12;
            for(let m=1; m<=12; m++) {
                 const interest = refiBalance * refiMonthlyRate;
                 const principal = refiMonthlyPayment - interest;
                 refiBalance -= principal;
            }
            yearEndBalance = refiBalance;
            refiNetProceeds = 0;

        } else {
             let oldLoanYearlyDebt = 0;
             let tempBalance = getAcqLoanBalanceAtMonth((year-1)*12);
             for(let m=1; m<=12; m++) {
                const absMonth = (year-1)*12 + m;
                const interest = tempBalance * acqMonthlyRate;
                let payment = 0;
                if (absMonth <= acqLoanParams.ioPeriodMonths) {
                     payment = tempBalance * acqMonthlyRate; 
                } else {
                     payment = acqMonthlyPAndI; 
                }
                oldLoanYearlyDebt += payment;
                const principal = payment - interest;
                tempBalance -= principal;
            }
            annualDebtService = oldLoanYearlyDebt;
            yearEndBalance = tempBalance;
            refiNetProceeds = 0;
        }

        const operatingDistributable = Math.max(0, yearNOI - annualDebtService);

        // 2. Sale Event
        let saleDistributable = 0;
        if (year === termYears) {
            const salePrice = exitCapRate > 0 ? yearNOI / exitCapRate : 0;
            saleDistributable = Math.max(0, salePrice - yearEndBalance);
        }

        const totalDistributable = operatingDistributable + saleDistributable + (isRefiYear ? Math.max(0, refiNetProceeds) : 0);

        // 4. Waterfall Calculation
        const waterfallTotal = runWaterfall(
            totalDistributable, 
            unreturnedCapital,
            accruedPref,
            lpPreferredReturnRate, 
            lpOwnershipPercent, 
            gpOwnershipPercent
        );

        // Update State
        unreturnedCapital = waterfallTotal.unreturnedCapitalAfter;
        accruedPref = waterfallTotal.accruedPrefAfter;

        // 5. Operating Metric (Cash on Cash)
        const operatingLpShare = operatingDistributable * lpOwnershipPercent; 
        const lpCashOnCash = lpCapitalContribution > 0 ? operatingLpShare / lpCapitalContribution : 0; 
        
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
            lpCashOnCash: lpCashOnCash,
            debtService: annualDebtService,
            refiProceeds: isRefiYear ? Math.max(0, refiNetProceeds) : 0,
            outstandingBalance: yearEndBalance
        });

        lpCashFlows.push(waterfallTotal.lpTotalDist);
        gpCashFlows.push(waterfallTotal.gpTotalDist);
    }

    const lpTotalDistributions = lpCashFlows.reduce((sum, val) => sum + (val > 0 ? val : 0), 0);
    const gpTotalDistributions = gpCashFlows.reduce((sum, val) => sum + (val > 0 ? val : 0), 0);

    const lpAvgCoC = annualRows.reduce((sum, r) => sum + r.lpCashOnCash, 0) / termYears;
    
    const lpReturns: LPReturnsSummary = {
        capitalContribution: lpCapitalContribution,
        totalDistributions: lpTotalDistributions,
        totalProfit: lpTotalDistributions - lpCapitalContribution,
        equityMultiple: lpCapitalContribution > 0 ? lpTotalDistributions / lpCapitalContribution : 0,
        irr: calculateIRR(lpCashFlows),
        averageCashOnCash: lpAvgCoC
    };

    const gpReturns: GPReturnsSummary = {
        capitalContribution: gpCapitalContribution,
        totalDistributions: gpTotalDistributions,
        totalProfit: gpTotalDistributions,
        equityMultiple: 0, 
        irr: null,
        averageCashOnCash: 0
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
