export enum EmployeeStatus {
  Active = 'نشط',
  Suspended = 'موقوف',
  Terminated = 'انتهاء خدمة',
}

export enum LeaveType {
  Annual = 'سنوية',
  Sick = 'مرضية',
}

export enum DepartureType {
  Departure = 'مغادرة',
}

export enum HolidayWorkType {
  Weekend = 'عطلة أسبوعية',
  Holiday = 'عطلة رسمية',
}

export interface HolidayWork {
  id: string;
  employeeId: string;
  date: string;
  type: HolidayWorkType;
}

export interface Employee {
  id: string;
  name: string;
  nationality: string;
  idType: string;
  nationalId: string;
  socialSecurityNumber: string;
  jobTitle: string;
  dateOfBirth: string;
  hireDate: string;
  endDate?: string;
  status: EmployeeStatus;
  customAnnualLeaveDays?: number;
  initialAnnualBalance?: number;
  balanceSetDate?: string;
}

export interface Leave {
  id: string;
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  medicalReport?: { name: string; content: string };
  status: 'approved' | 'pending';
  daysTaken: number;
}

export interface Departure {
    id: string;
    employeeId: string;
    date: string;
    hours: number;
    status: 'approved' | 'pending';
}

export interface Holiday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
}

export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  logo: string | null;
  seal: string | null;
  weekendDays: number[];
}

export interface BalanceAdjustment {
  id: string;
  employeeId: string;
  leaveType: LeaveType.Annual | LeaveType.Sick;
  adjustmentDays: number; // Positive for adding, negative for subtracting
  reason: string;
  date: string;
}

export interface UserPermissions {
  employees: {
    view: boolean;
    add: boolean;
    edit: boolean;
    delete: boolean;
    export: boolean;
    import: boolean;
    adjustBalance: boolean;
  };
  leaves: {
    view: boolean;
    add: boolean;
    edit: boolean;
    delete: boolean;
    manageHolidayWork: boolean;
    manageOfficialHolidays: boolean;
    overrideBalance: boolean;
    overrideMedicalReport: boolean;
  };
  reports: {
    view: boolean;
  };
  settings: {
    view: boolean;
    manageCompany: boolean;
    manageLists: boolean;
    manageUsers: boolean;
    clearData: boolean;
  };
}


export interface User {
  id: string;
  username: string;
  password;
  isAdmin: boolean;
  permissions: UserPermissions;
}

export type NotificationType = 'leave' | 'departure' | 'employee' | 'setting' | 'user' | 'holiday' | 'balance';

export interface NotificationItem {
  id: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: NotificationType;
}