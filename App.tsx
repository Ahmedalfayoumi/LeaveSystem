import React from 'react';
import { useSession } from './src/components/SessionContextProvider';
import Header from './src/components/Header';
import LoginPage from './src/pages/LoginPage';
import AppRoutes from './src/components/AppRoutes';
import { useAppData } from './src/hooks/useAppData';
import { SessionContextProvider } from './src/components/SessionContextProvider';

const AppContent: React.FC = () => {
    const { session, isLoading: isSessionLoading } = useSession();
    const {
        page, setPage,
        employees, leaves, departures, holidays, holidayWork, balanceAdjustments,
        nationalities, idTypes, companyInfo, users, notifications, currentUser,
        isDataLoading, addNotification, markAllAsRead, clearAllNotifications,
        handleLogout, importAllData, exportAllData, generateSyncCode, onImportFromCode,
        getEmployeeBalances, handleAddEmployee, handleAddMultipleEmployees, handleUpdateEmployee,
        handleDeleteEmployees, handleAddBalanceAdjustment, handleAddLeave, handleUpdateLeave,
        handleDeleteLeave, handleAddDeparture, handleUpdateDeparture, handleDeleteDeparture,
        handleAddHoliday, handleDeleteHoliday, handleAddHolidayWork, handleDeleteHolidayWork,
        handleUpdateCompanyInfo, handleUpdateNationalities, handleUpdateIdTypes, handleAddUser,
        handleUpdateUser, handleDeleteUser,
    } = useAppData();

    if (isSessionLoading || isDataLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }
    
    if (!session) {
        return <LoginPage />;
    }
    
    if (!currentUser || !companyInfo) {
        return <div className="flex items-center justify-center min-h-screen">Loading user data and company info...</div>;
    }

    return (
        <div className="bg-gray-50 min-h-screen text-gray-900">
            <Header 
                activePage={page} 
                setPage={setPage} 
                handleLogout={handleLogout} 
                currentUser={currentUser} 
                notifications={notifications}
                markAllAsRead={markAllAsRead}
                clearAllNotifications={clearAllNotifications}
            />
            <AppRoutes
                page={page} setPage={setPage}
                employees={employees} leaves={leaves} departures={departures} holidays={holidays}
                holidayWork={holidayWork} balanceAdjustments={balanceAdjustments}
                nationalities={nationalities} idTypes={idTypes} companyInfo={companyInfo}
                users={users} notifications={notifications} currentUser={currentUser}
                addNotification={addNotification} importAllData={importAllData}
                exportAllData={exportAllData} generateSyncCode={generateSyncCode}
                onImportFromCode={onImportFromCode} getEmployeeBalances={getEmployeeBalances}
                handleAddEmployee={handleAddEmployee} handleAddMultipleEmployees={handleAddMultipleEmployees}
                handleUpdateEmployee={handleUpdateEmployee} handleDeleteEmployees={handleDeleteEmployees}
                handleAddBalanceAdjustment={handleAddBalanceAdjustment} handleAddLeave={handleAddLeave}
                handleUpdateLeave={handleUpdateLeave} handleDeleteLeave={handleDeleteLeave}
                handleAddDeparture={handleAddDeparture} handleUpdateDeparture={handleUpdateDeparture}
                handleDeleteDeparture={handleDeleteDeparture} handleAddHoliday={handleAddHoliday}
                handleDeleteHoliday={handleDeleteHoliday} handleAddHolidayWork={handleAddHolidayWork}
                handleDeleteHolidayWork={handleDeleteHolidayWork} handleUpdateCompanyInfo={handleUpdateCompanyInfo}
                handleUpdateNationalities={handleUpdateNationalities} handleUpdateIdTypes={handleUpdateIdTypes}
                handleAddUser={handleAddUser} handleUpdateUser={handleUpdateUser} handleDeleteUser={handleDeleteUser}
            />
        </div>
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