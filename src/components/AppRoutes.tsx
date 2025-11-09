import React from 'react';
import { Employee, Leave, Departure, Holiday, HolidayWork, CompanyInfo, BalanceAdjustment, User, NotificationItem, NotificationType } from '../../types';
import EmployeeManagement from '../../components/EmployeeManagement';
import LeaveHolidayManagement from '../../components/LeaveHolidayManagement';
import Settings from '../../components/Settings';
import Dashboard from '../../components/Dashboard';
import Reports from '../../components/Reports';

interface AppRoutesProps {
    page: string;
    setPage: (page: string) => void;
    employees: Employee[];
    leaves: Leave[];
    departures: Departure[];
    holidays: Holiday[];
    holidayWork: HolidayWork[];
    balanceAdjustments: BalanceAdjustment[];
    nationalities: string[];
    idTypes: string[];
    companyInfo: CompanyInfo | null;
    users: User[];
    notifications: NotificationItem[];
    currentUser: User | null;
    addNotification: (message: string, type: NotificationType) => void;
    importAllData: (data: any) => Promise<boolean>;
    exportAllData: () => void;
    generateSyncCode: () => string;
    onImportFromCode: (code: string) => void;
    getEmployeeBalances: (employeeId: string) => { 
        annual: number; sick: number; departures: { monthly: number; totalForDeduction: number; };
        annualBalance: number; accruedAnnual: number; usedAnnual: number; 
        sickBalance: number; usedSick: number; departureDeductions: number;
        holidayCompensation: number;
    };
    handleAddEmployee: (employeeData: Omit<Employee, 'id'>) => Promise<void>;
    handleAddMultipleEmployees: (employeesData: Omit<Employee, 'id'>[]) => Promise<void>;
    handleUpdateEmployee: (employee: Employee) => Promise<void>;
    handleDeleteEmployees: (employeeIds: string[]) => Promise<void>;
    handleAddBalanceAdjustment: (adjustment: BalanceAdjustment) => Promise<void>;
    handleAddLeave: (leaveData: Omit<Leave, 'id'>) => Promise<Leave>;
    handleUpdateLeave: (leave: Leave) => Promise<void>;
    handleDeleteLeave: (id: string) => Promise<void>;
    handleAddDeparture: (departureData: Omit<Departure, 'id'>) => Promise<Departure>;
    handleUpdateDeparture: (departure: Departure) => Promise<void>;
    handleDeleteDeparture: (id: string) => Promise<void>;
    handleAddHoliday: (holidayData: Omit<Holiday, 'id'>) => Promise<void>;
    handleDeleteHoliday: (id: string) => Promise<void>;
    handleAddHolidayWork: (holidayWorkData: Omit<HolidayWork, 'id'>) => Promise<void>;
    handleDeleteHolidayWork: (id: string) => Promise<void>;
    handleUpdateCompanyInfo: (info: CompanyInfo) => Promise<void>;
    handleUpdateNationalities: (nationalities: string[]) => Promise<void>;
    handleUpdateIdTypes: (idTypes: string[]) => Promise<void>;
    handleAddUser: (user: User) => Promise<void>;
    handleUpdateUser: (user: User) => Promise<void>;
    handleDeleteUser: (userId: string) => Promise<void>;
}

const AppRoutes: React.FC<AppRoutesProps> = ({
    page, setPage, employees, leaves, departures, holidays, holidayWork, balanceAdjustments,
    nationalities, idTypes, companyInfo, users, currentUser, addNotification,
    importAllData, exportAllData, generateSyncCode, onImportFromCode, getEmployeeBalances,
    handleAddEmployee, handleAddMultipleEmployees, handleUpdateEmployee, handleDeleteEmployees,
    handleAddBalanceAdjustment, handleAddLeave, handleUpdateLeave, handleDeleteLeave,
    handleAddDeparture, handleUpdateDeparture, handleDeleteDeparture, handleAddHoliday,
    handleDeleteHoliday, handleAddHolidayWork, handleDeleteHolidayWork, handleUpdateCompanyInfo,
    handleUpdateNationalities, handleUpdateIdTypes, handleAddUser, handleUpdateUser, handleDeleteUser,
}) => {
    if (!currentUser || !companyInfo) {
        return null; // Should be handled by AppContent loading state
    }

    return (
        <main className="container mx-auto p-4 sm:p-6 lg:p-8 mt-20">
            {page === 'dashboard' && (
                <Dashboard
                    employees={employees}
                    leaves={leaves}
                    departures={departures}
                    holidays={holidays}
                />
            )}
            {page === 'employees' && currentUser.permissions.employees.view && (
                <EmployeeManagement
                    employees={employees}
                    nationalities={nationalities}
                    idTypes={idTypes}
                    getEmployeeBalances={getEmployeeBalances}
                    permissions={currentUser.permissions.employees}
                    addNotification={addNotification}
                    addEmployee={handleAddEmployee}
                    addMultipleEmployees={handleAddMultipleEmployees}
                    updateEmployee={handleUpdateEmployee}
                    deleteEmployees={handleDeleteEmployees}
                    addBalanceAdjustment={handleAddBalanceAdjustment}
                />
            )}
            {page === 'leaves' && currentUser.permissions.leaves.view && (
                <LeaveHolidayManagement
                    employees={employees}
                    leaves={leaves}
                    departures={departures}
                    holidays={holidays}
                    holidayWork={holidayWork}
                    getEmployeeBalances={getEmployeeBalances}
                    companyInfo={companyInfo}
                    permissions={currentUser.permissions.leaves}
                    currentUser={currentUser}
                    addNotification={addNotification}
                    addLeave={handleAddLeave}
                    updateLeave={handleUpdateLeave}
                    deleteLeave={handleDeleteLeave}
                    addDeparture={handleAddDeparture}
                    updateDeparture={handleUpdateDeparture}
                    deleteDeparture={handleDeleteDeparture}
                    addHoliday={handleAddHoliday}
                    deleteHoliday={handleDeleteHoliday}
                    addHolidayWork={handleAddHolidayWork}
                    deleteHolidayWork={handleDeleteHolidayWork}
                />
            )}
            {page === 'reports' && currentUser.permissions.reports.view && (
                <Reports
                    employees={employees}
                    leaves={leaves}
                    departures={departures}
                    holidays={holidays}
                    holidayWork={holidayWork}
                    balanceAdjustments={balanceAdjustments}
                    getEmployeeBalances={getEmployeeBalances}
                />
            )}
            {page === 'settings' && currentUser.permissions.settings.view && (
                <Settings
                    nationalities={nationalities}
                    idTypes={idTypes}
                    companyInfo={companyInfo}
                    setPage={setPage}
                    currentUser={currentUser}
                    users={users}
                    importAllData={importAllData}
                    exportAllData={exportAllData}
                    generateSyncCode={generateSyncCode}
                    onImportFromCode={onImportFromCode}
                    addNotification={addNotification}
                    updateCompanyInfo={handleUpdateCompanyInfo}
                    updateNationalities={handleUpdateNationalities}
                    updateIdTypes={handleUpdateIdTypes}
                    addUser={handleAddUser}
                    updateUser={handleUpdateUser}
                    deleteUser={handleDeleteUser}
                />
            )}
        </main>
    );
};

export default AppRoutes;