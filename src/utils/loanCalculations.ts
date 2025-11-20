
import type { FinancingScenario } from '../types';

/**
 * Calculates the annual debt constant for a loan.
 * The debt constant is the annual amount of debt service per dollar of loan.
 * @param interestRate - Annual interest rate (e.g., 7.5 for 7.5%).
 * @param amortizationYears - The amortization period in years.
 * @returns The annual debt constant.
 */
const calculateAnnualDebtConstant = (interestRate: number, amortizationYears: number): number => {
    if (interestRate <= 0 || amortizationYears <= 0) return 0;
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = amortizationYears * 12;
    if (monthlyRate === 0) return 1 / amortizationYears;
    const monthlyPaymentFactor = (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
    return monthlyPaymentFactor * 12;
};

export const runDebtSizingEngine = (scenario: FinancingScenario, portfolio: any) => {
    const { sizingMethod, targetDSCR, targetLTV, manualLoanAmount, interestRate, amortizationYears, termYears, ioPeriodMonths, costs } = scenario;
    
    if (!portfolio || !portfolio.valuation) return null;

    const purchasePrice = portfolio.valuation.askingPrice || 0;
    const currentNOI = portfolio.current?.noi || 0;
    const stabilizedNOI = portfolio.stabilized?.noi || 0;

    // --- 1. Calculate Max Loan from Constraints ---
    const annualDebtConstant = calculateAnnualDebtConstant(interestRate, amortizationYears);
    
    const maxLoanByDSCR = (annualDebtConstant > 0 && targetDSCR > 0) 
        ? stabilizedNOI / (targetDSCR * annualDebtConstant) 
        : 0;

    const maxLoanByLTV = purchasePrice * (targetLTV / 100);

    // --- 2. Determine Effective Loan Amount ---
    let effectiveLoanAmount = 0;
    switch (sizingMethod) {
        case 'dscr':
            effectiveLoanAmount = maxLoanByDSCR;
            break;
        case 'ltv':
            effectiveLoanAmount = maxLoanByLTV;
            break;
        case 'lower_dscr_ltv':
            effectiveLoanAmount = Math.min(maxLoanByDSCR, maxLoanByLTV);
            break;
        case 'manual':
            effectiveLoanAmount = manualLoanAmount;
            break;
    }
    
    if (!isFinite(effectiveLoanAmount) || effectiveLoanAmount < 0) {
        effectiveLoanAmount = 0;
    }

    // --- 3. Calculate Costs & Equity ---
    // Use absolute costs from input. Origination is % of loan.
    const originationFee = effectiveLoanAmount * (costs.origination / 100);

    const totalClosingCosts = 
        (costs.legal || 0) +
        (costs.title || 0) +
        (costs.inspection || 0) +
        (costs.appraisal || 0) +
        (costs.mortgageFees || 0) +
        (costs.acquisitionFee || 0) +
        (costs.reserves || 0) +
        (costs.thirdParty || 0) +
        (costs.misc || 0) +
        originationFee;

    const totalCost = purchasePrice + totalClosingCosts;
    const equityRequired = totalCost - effectiveLoanAmount;

    // --- 4. Calculate Payments & Metrics ---
    const monthlyRate = interestRate / 100 / 12;
    const monthlyPAndIPayment = effectiveLoanAmount * (annualDebtConstant / 12);
    const monthlyIOPayment = effectiveLoanAmount * monthlyRate;
    
    let annualDebtService = 0;
    if (ioPeriodMonths >= 12) {
        annualDebtService = monthlyIOPayment * 12;
    } else if (ioPeriodMonths > 0) {
        annualDebtService = (monthlyIOPayment * ioPeriodMonths) + (monthlyPAndIPayment * (12 - ioPeriodMonths));
    } else {
        annualDebtService = monthlyPAndIPayment * 12;
    }

    const dscrCurrent = annualDebtService > 0 ? currentNOI / annualDebtService : Infinity;
    const dscrStabilized = annualDebtService > 0 ? stabilizedNOI / annualDebtService : Infinity;

    // Balloon Payment
    let balance = effectiveLoanAmount;
    const numPaymentsTerm = termYears * 12;
    if (ioPeriodMonths < numPaymentsTerm) {
        for (let i = 1; i <= (numPaymentsTerm - ioPeriodMonths); i++) {
            const interest = balance * monthlyRate;
            const principal = monthlyPAndIPayment - interest;
            balance -= principal;
        }
    }
    const balloonPayment = balance > 0 ? balance : 0;
    
    // --- 5. Syndicator Metrics ---
    const cashFlowAfterDebt = stabilizedNOI - annualDebtService;
    const cashOnCashReturn = equityRequired > 0 ? (cashFlowAfterDebt / equityRequired) * 100 : Infinity;
    const dscrCapped = sizingMethod !== 'manual' && effectiveLoanAmount > 0 && Math.abs(effectiveLoanAmount - maxLoanByDSCR) < 1;

    return {
        // Sizing
        maxLoanByDSCR,
        maxLoanByLTV,
        effectiveLoanAmount,
        dscrCapped,
        
        // Costs & Equity
        totalCost,
        equityRequired,
        totalClosingCosts,

        // Payments
        monthlyIOPayment,
        monthlyPAndIPayment,
        annualDebtService,
        balloonPayment,
        
        // Ratios
        dscrCurrent,
        dscrStabilized,
        loanToValue: purchasePrice > 0 ? (effectiveLoanAmount / purchasePrice) * 100 : 0,
        loanToCost: totalCost > 0 ? (effectiveLoanAmount / totalCost) * 100 : 0,

        // Investor Impact
        cashFlowAfterDebt,
        cashOnCashReturn,
    };
};
