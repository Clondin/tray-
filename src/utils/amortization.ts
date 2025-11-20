
import type { AmortizationEntry, CommercialLoanParams } from '../types';

export const generateAmortizationSchedule = (loanParams: CommercialLoanParams, loanCalcs: any): AmortizationEntry[] => {
    const { loanAmount, interestRate, termYears, ioPeriodMonths } = loanParams;
    const schedule: AmortizationEntry[] = [];
    let balance = loanAmount;
    const monthlyRate = interestRate / 100 / 12;

    for (let year = 1; year <= termYears; year++) {
        let yearlyPrincipal = 0;
        let yearlyInterest = 0;
        for (let month = 1; month <= 12; month++) {
            const currentMonth = (year - 1) * 12 + month;
            const interestPayment = balance * monthlyRate;
            let principalPayment = 0;

            if (currentMonth > ioPeriodMonths) {
                // Fix: Use the correct property `monthlyPAndIPayment` from the calculation results.
                principalPayment = loanCalcs.monthlyPAndIPayment - interestPayment;
                balance -= principalPayment;
            }
            
            yearlyPrincipal += principalPayment;
            yearlyInterest += interestPayment;
        }
        schedule.push({ year, principal: yearlyPrincipal, interest: yearlyInterest, remainingBalance: balance < 0 ? 0 : balance });
    }
    return schedule;
};
