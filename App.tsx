import React from 'react';
import EmployeeManagement from './components/EmployeeManagement';
import LeaveHolidayManagement from './components/LeaveHolidayManagement';
import Settings from './components/Settings';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import { SessionContextProvider } from './src/components/SessionContextProvider';
import { useAppData } from './src/hooks/useAppData';
import { MainLayout } from './src/components/MainLayout';

const AppContent: React.FC = () => {
    const {
        session,
        isSessionLoading,
        page,
        setPage,
        employees,
        leaves,
        departures,
        holidays,
        holidayWork,
        balanceAdjustments,
        nationalities,
        idTypes,
        companyInfo,
        users,
        notifications,
        currentUser,
        isDataLoading,
        addNotification,
        markAllAsRead,
        clearAllNotifications,
        handleLogout,
        importAllData,
        exportAllData,
        generateSyncCode,
        onImportFromCode,
        getEmployeeBalances,
        handleAddEmployee,
        handleAddMultipleEmployees,
        handleUpdateEmployee,
        handleDeleteEmployees,
        handleAddBalanceAdjustment,
        handleAddLeave,
        handleUpdateLeave,
        handleDeleteLeave,
        handleAddDeparture,
        handleUpdateDeparture,
        handleDeleteDeparture,
        handleAddHoliday,
        handleDeleteHoliday,
        handleAddHolidayWork,
        handleDeleteHolidayWork,
        handleUpdateCompanyInfo,
        handleUpdateNationalities,
        handleUpdateIdTypes,
        handleAddUser,
        handleUpdateUser,
        handleDeleteUser,
    } = useAppData();

    // Ensure companyInfo is not null before rendering components that depend on it
    if (!currentUser || !companyInfo) {
        // This state is handled by MainLayout's loading/login checks,
        // but this check ensures type safety for components below.
        return null;
    }

    return (
        <MainLayout
            activePage={page}
            setPage={setPage}
            handleLogout={handleLogout}
            currentUser={currentUser}
            notifications={notifications}
            markAllAsRead={markAllAsRead}
            clearAllNotifications={clearAllNotifications}
            isSessionLoading={isSessionLoading}
            isDataLoading={isDataLoading}
        >
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
        </MainLayout>
    );
};

const App: React.FC = () => {
    return (
        <SessionContextProvider>
            <AppContent />
        </SessionContextProvider>
    );
};

export default App;