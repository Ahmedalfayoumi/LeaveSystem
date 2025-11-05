import { Employee, Leave, Departure, Holiday, LeaveType } from '../types';

export const getServiceYears = (hireDate: string, upToDate: Date = new Date()): number => {
    const start = new Date(hireDate);
    const now = upToDate;
    let years = now.getFullYear() - start.getFullYear();
    const m = now.getMonth() - start.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < start.getDate())) {
        years--;
    }
    return years;
};

export const getAnnualLeaveEntitlement = (employee: Employee, upToDate: Date = new Date()): number => {
    if (employee.customAnnualLeaveDays) {
        return employee.customAnnualLeaveDays;
    }
    const serviceYears = getServiceYears(employee.hireDate, upToDate);
    return serviceYears >= 5 ? 21 : 14;
};

export const calculateLeaveDuration = (
    startDate: string,
    endDate: string,
    holidays: Holiday[],
    weekendDays: number[],
    leaveType: LeaveType
): number => {
    // Use UTC to avoid timezone issues. Input strings are 'YYYY-MM-DD'.
    const start = new Date(startDate + 'T00:00:00Z');
    const end = new Date(endDate + 'T00:00:00Z');

    if (start > end) return 0;

    if (leaveType === LeaveType.Sick) {
        // Sick leave includes weekends and holidays.
        const diffTime = end.getTime() - start.getTime();
        // Add 1 to include both start and end dates.
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    }

    // Annual leave (and others by default) excludes weekends and holidays.
    let count = 0;
    const holidayDates = new Set(holidays.map(h => h.date));
    let current = new Date(start);

    while (current <= end) {
        const dayOfWeek = current.getUTCDay(); // Use getUTCDay() for UTC dates.
        const dateString = current.toISOString().split('T')[0];
        
        if (!weekendDays.includes(dayOfWeek) && !holidayDates.has(dateString)) {
            count++;
        }
        current.setUTCDate(current.getUTCDate() + 1);
    }
    return count;
};

const calculateAccrualForPeriod = (employee: Employee, periodStartDate: Date, upToDate: Date): number => {
    // Determine the final date for accrual. If terminated, it's the end date. Otherwise, today.
    const calculationEndDate = employee.endDate ? new Date(employee.endDate) : upToDate;

    // If calculation ends before the period starts, no leave accrued.
    if (calculationEndDate < periodStartDate) return 0;

    let totalAccrued = 0;
    
    const startYear = periodStartDate.getFullYear();
    const startMonth = periodStartDate.getMonth();
    const endYear = calculationEndDate.getFullYear();
    const endMonth = calculationEndDate.getMonth();
    
    for (let y = startYear; y <= endYear; y++) {
        const mStart = (y === startYear) ? startMonth : 0;
        const mEnd = (y === endYear) ? endMonth : 11;
        
        for (let m = mStart; m <= mEnd; m++) {
            const daysInMonth = new Date(y, m + 1, 0).getDate();
            let workedDays = daysInMonth;

            if (y === startYear && m === startMonth) {
                workedDays = daysInMonth - periodStartDate.getDate() + 1;
            }
            if (y === endYear && m === endMonth) {
                if(y === startYear && m === startMonth) {
                    workedDays = calculationEndDate.getDate() - periodStartDate.getDate() + 1;
                } else {
                    workedDays = calculationEndDate.getDate();
                }
            }
            
            if (workedDays < 0) workedDays = 0;

            const tempDateForServiceYears = new Date(y, m, 1);
            const entitlement = getAnnualLeaveEntitlement(employee, tempDateForServiceYears);
            const monthlyAccrual = entitlement / 12;
            
            totalAccrued += (workedDays / daysInMonth) * monthlyAccrual;
        }
    }
    
    return totalAccrued;
};

export const calculateAccruedLeave = (employee: Employee, upToDateParam: Date = new Date()): number => {
    // For imported employees with a pre-set balance
    if (typeof employee.initialAnnualBalance === 'number' && employee.balanceSetDate) {
        const accrualSinceSetDate = calculateAccrualForPeriod(employee, new Date(employee.balanceSetDate), upToDateParam);
        return employee.initialAnnualBalance + accrualSinceSetDate;
    }
    
    // For manually added employees, calculate from hire date
    const hireDate = new Date(employee.hireDate);
    return calculateAccrualForPeriod(employee, hireDate, upToDateParam);
};

export const calculateAnnualBalance = (employee: Employee, leaves: Leave[], departures: Departure[], holidays: Holiday[]): number => {
    const totalAccrued = calculateAccruedLeave(employee);

    const annualLeavesTaken = leaves
      .filter(l => l.type === LeaveType.Annual)
      .reduce((sum, leave) => sum + leave.daysTaken, 0);
      
    const totalDepartureHours = departures.reduce((sum, dep) => sum + dep.hours, 0);
    const departureDaysDeducted = Math.floor(totalDepartureHours / 8);

    return totalAccrued - annualLeavesTaken - departureDaysDeducted;
};


export const calculateDepartureBalance = (departures: Departure[]): { monthly: number, totalForDeduction: number } => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyHours = departures
        .filter(d => {
            const dDate = new Date(d.date);
            return dDate.getMonth() === currentMonth && dDate.getFullYear() === currentYear;
        })
        .reduce((sum, d) => sum + d.hours, 0);
    
    const totalHours = departures.reduce((sum, d) => sum + d.hours, 0);
    
    return {
        monthly: 8 - monthlyHours,
        totalForDeduction: totalHours % 8,
    };
};