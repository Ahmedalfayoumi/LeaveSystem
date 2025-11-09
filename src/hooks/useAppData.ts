import { useState, useCallback, useEffect } from 'react';
import { Employee, Leave, Departure, Holiday, EmployeeStatus, LeaveType, HolidayWork, CompanyInfo, BalanceAdjustment, User, UserPermissions, NotificationItem, NotificationType } from '../../types';
import apiService from '../../services/apiService';
import { supabase } from '../integrations/supabase/client';
import { useSession } from '../components/SessionContextProvider';
import { calculateAccruedLeave, calculateDepartureBalance } from '../../services/calculation';

export const useAppData = () => {
    const { session } = useSession();
    const [page, setPage] = useState('dashboard');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [leaves, setLeaves] = useState<Leave[]>([]);
    const [departures, setDepartures] = useState<Departure[]>([]);
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [holidayWork, setHolidayWork] = useState<HolidayWork[]>([]);
    const [balanceAdjustments, setBalanceAdjustments] = useState<BalanceAdjustment[]>([]);
    const [nationalities, setNationalities] = useState<string[]>([]);
    const [idTypes, setIdTypes] = useState<string[]>([]);
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isDataLoading, setIsDataLoading] = useState(true);

    const getAdminPermissions = (): UserPermissions => ({
        employees: { view: true, add: true, edit: true, delete: true, export: true, import: true, adjustBalance: true },
        leaves: { view: true, add: true, edit: true, delete: true, manageHolidayWork: true, manageOfficialHolidays: true, overrideBalance: true, overrideMedicalReport: true },
        reports: { view: true },
        settings: { view: true, manageCompany: true, manageLists: true, manageUsers: true, clearData: true },
    });
    
    const getDefaultPermissions = (): UserPermissions => ({
        employees: { view: false, add: false, edit: false, delete: false, export: false, import: false, adjustBalance: false },
        leaves: { view: false, add: false, edit: false, delete: false, manageHolidayWork: false, manageOfficialHolidays: false, overrideBalance: false, overrideMedicalReport: false },
        reports: { view: false },
        settings: { view: false, manageCompany: false, manageLists: false, manageUsers: false, clearData: false },
    });

    const loadAllData = useCallback(async (userId: string) => {
        setIsDataLoading(true);
        try {
            const [
                employeesData, leavesData, departuresData, holidaysData, holidayWorkData,
                balanceAdjustmentsData, nationalitiesData, idTypesData, companyInfoData, usersData, userNotifications
            ] = await Promise.all([
                apiService.getEmployees(userId), apiService.getLeaves(userId), apiService.getDepartures(userId), apiService.getHolidays(userId),
                apiService.getHolidayWork(userId), apiService.getBalanceAdjustments(userId), apiService.getNationalities(userId),
                apiService.getIdTypes(userId), apiService.getCompanyInfo(userId), apiService.getUsers(), apiService.getNotifications(userId)
            ]);

            setEmployees(employeesData);
            setLeaves(leavesData);
            setDepartures(departuresData);
            setHolidays(holidaysData);
            setHolidayWork(holidayWorkData);
            setBalanceAdjustments(balanceAdjustmentsData);
            setNationalities(nationalitiesData);
            setIdTypes(idTypesData);
            setCompanyInfo(companyInfoData);
            setUsers(usersData);
            setNotifications(userNotifications);

            if (!companyInfoData) {
                const initialCompanyInfo: CompanyInfo = { name: 'اسم الشركة', address: 'عنوان الشركة', phone: '', email: '', logo: null, seal: null, weekendDays: [5, 6] };
                const newCompanyInfo = await apiService.updateCompanyInfo(initialCompanyInfo, userId);
                setCompanyInfo(newCompanyInfo);
            }

        } catch (error) {
            console.error("Failed to load initial data:", error);
        } finally {
            setIsDataLoading(false);
        }
    }, []);

    useEffect(() => {
        if (session?.user) {
            const userMetadata = session.user.user_metadata;
            const isAdmin = userMetadata?.isAdmin || false;
            const permissions = userMetadata?.permissions || (isAdmin ? getAdminPermissions() : getDefaultPermissions());

            setCurrentUser({
                id: session.user.id,
                username: session.user.email || session.user.phone || 'Unknown',
                password: '',
                isAdmin: isAdmin,
                permissions: permissions,
                firstName: userMetadata?.first_name || '',
                lastName: userMetadata?.last_name || '',
                avatarUrl: userMetadata?.avatar_url || '',
            });
            loadAllData(session.user.id);
        } else {
            setCurrentUser(null);
            setEmployees([]);
            setLeaves([]);
            setDepartures([]);
            setHolidays([]);
            setHolidayWork([]);
            setBalanceAdjustments([]);
            setNationalities([]);
            setIdTypes([]);
            setCompanyInfo(null);
            setUsers([]);
            setNotifications([]);
            setIsDataLoading(false);
        }
    }, [session, loadAllData]);
    
    useEffect(() => {
        if (currentUser && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }
    }, [currentUser]);
  
    const addNotification = async (message: string, type: NotificationType) => {
        if (!currentUser) return;
        const newNotification = await apiService.addNotification(currentUser.id, message, type);
        setNotifications(prev => [newNotification, ...prev].slice(0, 50));
    
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('نظام إدارة الإجازات', {
                body: message,
                icon: '/favicon.svg',
            });
        }
    };

    const markAllAsRead = async () => {
        if (!currentUser) return;
        await apiService.markAllNotificationsAsRead(currentUser.id);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const clearAllNotifications = async () => {
        if (!currentUser) return;
        await apiService.clearAllNotifications(currentUser.id);
        setNotifications([]);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
        setNotifications([]);
    };

    const importAllData = async (data: any): Promise<boolean> => {
        if (!currentUser) return false;
        try {
            await apiService.importAllData(data, currentUser.id);
            alert('تم استيراد البيانات بنجاح. سيتم إعادة تحميل التطبيق.');
            setTimeout(() => window.location.reload(), 300);
            return true;
        } catch (error) {
            alert('الملف غير صالح أو تالف.');
            console.error(error);
            return false;
        }
    };

    const exportAllData = async () => {
        if (!currentUser) return;
        const allData = await apiService.getAllDataForExport(currentUser.id);
        const dataStr = JSON.stringify(allData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leave_system_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const generateSyncCode = async (): Promise<string> => {
        if (!currentUser) return '';
        return apiService.generateSyncCode(currentUser.id);
    };

    const onImportFromCode = async (code: string) => {
        if (!currentUser) return;
        await apiService.importFromSyncCode(code, currentUser.id);
    };

    const getEmployeeBalances = useCallback((employeeId: string) => {
        const employee = employees.find(e => e.id === employeeId);
        if (!employee) return { 
            annual: 0, sick: 0, departures: { monthly: 0, totalForDeduction: 0 },
            annualBalance: 0, accruedAnnual: 0, usedAnnual: 0, 
            sickBalance: 0, usedSick: 0, departureDeductions: 0,
            holidayCompensation: 0,
        };

        const employeeLeaves = leaves.filter(l => l.employeeId === employeeId && l.status === 'approved');
        const employeeDepartures = departures.filter(d => d.employeeId === employeeId && d.status === 'approved');
        const employeeHolidayWork = holidayWork.filter(hw => hw.employeeId === employeeId);
        const employeeAdjustments = balanceAdjustments.filter(adj => adj.employeeId === employeeId);

        const annualAdjustment = employeeAdjustments
            .filter(adj => adj.leaveType === LeaveType.Annual)
            .reduce((sum, adj) => sum + adj.adjustmentDays, 0);

        const sickAdjustment = employeeAdjustments
            .filter(adj => adj.leaveType === LeaveType.Sick)
            .reduce((sum, adj) => sum + adj.adjustmentDays, 0);

        const accruedAnnual = parseFloat(calculateAccruedLeave(employee).toFixed(2));
        const holidayCompensationDays = employeeHolidayWork.length;
        const usedAnnual = employeeLeaves
            .filter(l => l.type === LeaveType.Annual)
            .reduce((sum, leave) => sum + leave.daysTaken, 0);
        const totalDepartureHours = employeeDepartures.reduce((sum, dep) => sum + dep.hours, 0);
        const departureDeductions = Math.floor(totalDepartureHours / 8);
        const annualBalance = parseFloat((accruedAnnual + holidayCompensationDays - usedAnnual - departureDeductions + annualAdjustment).toFixed(2));

        const usedSick = employeeLeaves
            .filter(l => l.type === LeaveType.Sick && new Date(l.startDate).getFullYear() === new Date().getFullYear())
            .reduce((acc, l) => acc + l.daysTaken, 0);
        const sickBalance = (14 + sickAdjustment) - usedSick;

        const departureBalanceInfo = calculateDepartureBalance(employeeDepartures);

        return {
            annual: annualBalance,
            sick: sickBalance,
            departures: departureBalanceInfo,
            annualBalance,
            accruedAnnual,
            usedAnnual,
            sickBalance,
            usedSick,
            departureDeductions,
            holidayCompensation: holidayCompensationDays,
        };
    }, [employees, leaves, departures, holidayWork, balanceAdjustments]);

    const handleAddEmployee = async (employeeData: Omit<Employee, 'id'>) => {
        if (!currentUser) return;
        const newEmployee = await apiService.addEmployee(employeeData, currentUser.id);
        setEmployees(prev => [...prev, newEmployee]);
        addNotification(`تمت إضافة موظف جديد: ${newEmployee.name}`, 'employee');
    };
    const handleAddMultipleEmployees = async (employeesData: Omit<Employee, 'id'>[]) => {
        if (!currentUser || employeesData.length === 0) return;
        const newEmployees = await apiService.addMultipleEmployees(employeesData, currentUser.id);
        setEmployees(prev => [...prev, ...newEmployees]);
    };
    const handleUpdateEmployee = async (employee: Employee) => {
        if (!currentUser) return;
        const updatedEmployee = await apiService.updateEmployee(employee, currentUser.id);
        setEmployees(prev => prev.map(e => e.id === updatedEmployee.id ? updatedEmployee : e));
        addNotification(`تم تحديث بيانات الموظف: ${employee.name}`, 'employee');
    };
    const handleDeleteEmployees = async (ids: string[]) => {
        if (!currentUser) return;
        await apiService.deleteMultipleEmployees(ids, currentUser.id);
        setEmployees(prev => prev.filter(e => !ids.includes(e.id)));
        addNotification(`تم حذف ${ids.length} موظف(ين).`, 'employee');
    };
    const handleAddBalanceAdjustment = async (adjustment: BalanceAdjustment) => {
        if (!currentUser) return;
        const newAdjustment = await apiService.addBalanceAdjustment(adjustment, currentUser.id);
        setBalanceAdjustments(prev => [...prev, newAdjustment]);
        const employee = employees.find(e => e.id === adjustment.employeeId);
        if(employee) {
            addNotification(`تم تعديل رصيد ${adjustment.leaveType} للموظف ${employee.name}.`, 'balance');
        }
    };
    
    const handleAddLeave = async (leaveData: Omit<Leave, 'id'>): Promise<Leave> => {
        if (!currentUser) return Promise.reject('No current user');
        const newLeave = await apiService.addLeave(leaveData, currentUser.id);
        setLeaves(prev => [...prev, newLeave]);
        const empName = employees.find(e => e.id === newLeave.employeeId)?.name || '';
        addNotification(`تم تسجيل طلب إجازة ${newLeave.type} جديد للموظف ${empName}.`, 'leave');
        return newLeave;
    };
    const handleUpdateLeave = async (leave: Leave) => {
        if (!currentUser) return;
        const updatedLeave = await apiService.updateLeave(leave, currentUser.id);
        setLeaves(prev => prev.map(l => l.id === updatedLeave.id ? updatedLeave : l));
        const empName = employees.find(e => e.id === updatedLeave.employeeId)?.name || '';
        addNotification(`تم تعديل طلب إجازة ${leave.type} للموظف ${empName}.`, 'leave');
    };
    const handleDeleteLeave = async (id: string) => {
        if (!currentUser) return;
        const leaveToDelete = leaves.find(l => l.id === id);
        if(leaveToDelete) {
            await apiService.deleteLeave(id, currentUser.id);
            setLeaves(prev => prev.filter(l => l.id !== id));
            const empName = employees.find(e => e.id === leaveToDelete.employeeId)?.name || '';
            addNotification(`تم حذف طلب إجازة للموظف ${empName}`, 'leave');
        }
    };
    
    const handleAddDeparture = async (dep: Omit<Departure, 'id'>): Promise<Departure> => {
        if (!currentUser) return Promise.reject('No current user');
        const newDeparture = await apiService.addDeparture(dep, currentUser.id);
        setDepartures(prev => [...prev, newDeparture]);
        const empName = employees.find(e => e.id === newDeparture.employeeId)?.name || '';
        addNotification(`تم تسجيل طلب مغادرة جديد للموظف ${empName}.`, 'departure');
        return newDeparture;
    };
    const handleUpdateDeparture = async (dep: Departure) => {
        if (!currentUser) return;
        const updatedDeparture = await apiService.updateDeparture(dep, currentUser.id);
        setDepartures(prev => prev.map(d => d.id === updatedDeparture.id ? updatedDeparture : d));
        const empName = employees.find(e => e.id === updatedDeparture.employeeId)?.name || '';
        addNotification(`تم تعديل طلب مغادرة للموظف ${empName}.`, 'departure');
    };
    const handleDeleteDeparture = async (id: string) => {
        if (!currentUser) return;
        const depToDelete = departures.find(d => d.id === id);
        if(depToDelete) {
            await apiService.deleteDeparture(id, currentUser.id);
            setDepartures(prev => prev.filter(d => d.id !== id));
            const empName = employees.find(e => e.id === depToDelete.employeeId)?.name || '';
            addNotification(`تم حذف طلب مغادرة للموظف ${empName}.`, 'departure');
        }
    };
    const handleAddHoliday = async (hol: Omit<Holiday, 'id'>) => {
        if (!currentUser) return;
        const newHoliday = await apiService.addHoliday(hol, currentUser.id);
        setHolidays(prev => [...prev, newHoliday]);
        addNotification(`تمت إضافة عطلة رسمية جديدة: ${newHoliday.name}`, 'holiday');
    };
    const handleDeleteHoliday = async (id: string) => {
        if (!currentUser) return;
        const holToDelete = holidays.find(h => h.id === id);
        if (holToDelete) {
            await apiService.deleteHoliday(id, currentUser.id);
            setHolidays(prev => prev.filter(h => h.id !== id));
            addNotification(`تم حذف العطلة الرسمية: ${holToDelete.name}`, 'holiday');
        }
    };
    const handleAddHolidayWork = async (hw: Omit<HolidayWork, 'id'>) => {
        if (!currentUser) return;
        const newHolidayWork = await apiService.addHolidayWork(hw, currentUser.id);
        setHolidayWork(prev => [...prev, newHolidayWork]);
        const empName = employees.find(e => e.id === newHolidayWork.employeeId)?.name || '';
        addNotification(`تم تسجيل بدل عمل للموظف ${empName}.`, 'holiday');
    };
    const handleDeleteHolidayWork = async (id: string) => {
        if (!currentUser) return;
        const hwToDelete = holidayWork.find(hw => hw.id === id);
        if (hwToDelete) {
            await apiService.deleteHolidayWork(id, currentUser.id);
            setHolidayWork(prev => prev.filter(hw => hw.id !== id));
            const empName = employees.find(e => e.id === hwToDelete.employeeId)?.name || '';
            addNotification(`تم حذف بدل عمل للموظف ${empName}.`, 'holiday');
        }
    };
    const handleUpdateCompanyInfo = async (info: CompanyInfo) => {
        if (!currentUser) return;
        const updatedInfo = await apiService.updateCompanyInfo(info, currentUser.id);
        setCompanyInfo(updatedInfo);
        addNotification('تم تحديث معلومات الشركة بنجاح.', 'setting');
    };
    const handleUpdateNationalities = async (items: string[]) => {
        if (!currentUser) return;
        const updatedItems = await apiService.updateNationalities(items, currentUser.id);
        setNationalities(updatedItems);
        addNotification('تم تحديث قائمة الجنسيات.', 'setting');
    };
    const handleUpdateIdTypes = async (items: string[]) => {
        if (!currentUser) return;
        const updatedItems = await apiService.updateIdTypes(items, currentUser.id);
        setIdTypes(updatedItems);
        addNotification('تم تحديث قائمة أنواع الهويات.', 'setting');
    };
    const handleAddUser = async (user: User) => {
        const newUser = await apiService.addUser(user);
        setUsers(prev => [...prev, newUser]);
        addNotification(`تمت إضافة مستخدم جديد: ${newUser.username}`, 'user');
    };
    const handleUpdateUser = async (user: User) => {
        const updatedUser = await apiService.updateUser(user);
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        if (currentUser && currentUser.id === updatedUser.id) {
            setCurrentUser(updatedUser);
        }
        addNotification(`تم تحديث بيانات المستخدم: ${user.username}`, 'user');
    };
    const handleDeleteUser = async (id: string) => {
        await apiService.deleteUser(id);
        setUsers(prev => prev.filter(u => u.id !== id));
        addNotification(`تم حذف مستخدم.`, 'user');
    };

    return {
        page, setPage,
        employees, setEmployees,
        leaves, setLeaves,
        departures, setDepartures,
        holidays, setHolidays,
        holidayWork, setHolidayWork,
        balanceAdjustments, setBalanceAdjustments,
        nationalities, setNationalities,
        idTypes, setIdTypes,
        companyInfo, setCompanyInfo,
        users, setUsers,
        notifications, setNotifications,
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
    };
};