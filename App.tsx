import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Employee, Leave, Departure, Holiday, EmployeeStatus, LeaveType, HolidayWork, CompanyInfo, BalanceAdjustment, User, UserPermissions, NotificationItem, NotificationType } from './types';
import EmployeeManagement from './components/EmployeeManagement';
import LeaveHolidayManagement from './components/LeaveHolidayManagement';
import Settings from './components/Settings';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import { CalendarDays, Users, Settings as SettingsIcon, Building2, LayoutDashboard, LogOut, ShieldCheck, FileText, Menu, X, Bell, Trash2 } from 'lucide-react';
import { calculateAccruedLeave, calculateDepartureBalance } from './services/calculation';
import apiService from './services/apiService';
import { supabase } from './src/integrations/supabase/client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { SessionContextProvider, useSession } from './src/components/SessionContextProvider';

const Header: React.FC<{ 
    activePage: string; 
    setPage: (page: string) => void; 
    handleLogout: () => void; 
    currentUser: User | null; 
    notifications: NotificationItem[];
    markAllAsRead: () => void;
    clearAllNotifications: () => void;
}> = ({ activePage, setPage, handleLogout, currentUser, notifications, markAllAsRead, clearAllNotifications }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);
    
    if (!currentUser) return null;

    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationToggle = () => {
        setIsNotificationsOpen(!isNotificationsOpen);
        if (!isNotificationsOpen && unreadCount > 0) {
            markAllAsRead();
        }
    };
    
    const timeSince = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return `قبل ${Math.floor(interval)} سنة`;
        interval = seconds / 2592000;
        if (interval > 1) return `قبل ${Math.floor(interval)} شهر`;
        interval = seconds / 86400;
        if (interval > 1) return `قبل ${Math.floor(interval)} يوم`;
        interval = seconds / 3600;
        if (interval > 1) return `قبل ${Math.floor(interval)} ساعة`;
        interval = seconds / 60;
        if (interval > 1) return `قبل ${Math.floor(interval)} دقيقة`;
        return `قبل ${Math.floor(seconds)} ثانية`;
    };

    const navItems = [
      { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, permission: true },
      { id: 'employees', label: 'إدارة الموظفين', icon: Users, permission: currentUser.permissions.employees.view },
      { id: 'leaves', label: 'الإجازات والعطلات', icon: CalendarDays, permission: currentUser.permissions.leaves.view },
      { id: 'reports', label: 'التقارير', icon: FileText, permission: currentUser.permissions.reports.view },
      { id: 'settings', label: 'الإعدادات', icon: SettingsIcon, permission: currentUser.permissions.settings.view },
    ];
  
    const handleNavClick = (page: string) => {
        setPage(page);
        setIsMenuOpen(false);
    };

    return (
      <header className="bg-white shadow-md fixed top-0 left-0 right-0 z-30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
               <Building2 className="h-8 w-8 text-indigo-600" />
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">نظام إدارة الإجازات</h1>
            </div>
            <div className="flex items-center">
              <nav className="hidden md:flex items-center space-x-reverse space-x-5">
                {navItems.filter(i => i.permission).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ease-in-out ${
                      activePage === item.id
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="h-5 w-5 ml-2" />
                    {item.label}
                  </button>
                ))}
              </nav>
              <div className="hidden md:flex items-center mr-6 border-r pr-6">
                 {/* Notification Bell */}
                 <div className="relative" ref={notificationRef}>
                    <button onClick={handleNotificationToggle} className="text-gray-600 hover:bg-gray-200 p-2 rounded-full transition-colors relative">
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white"></span>
                        )}
                    </button>
                    {isNotificationsOpen && (
                        <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50">
                           <div className="p-3 flex justify-between items-center border-b">
                                <h4 className="font-semibold text-gray-800">الإشعارات</h4>
                                {notifications.length > 0 && <button onClick={clearAllNotifications} className="text-sm text-red-600 hover:underline flex items-center gap-1"><Trash2 size={14}/> مسح الكل</button>}
                           </div>
                           <ul className="max-h-96 overflow-y-auto">
                               {notifications.length > 0 ? [...notifications].reverse().map(n => (
                                   <li key={n.id} className={`p-3 border-b hover:bg-gray-50 text-sm ${!n.read ? 'bg-indigo-50' : ''}`}>
                                       <p className="text-gray-800">{n.message}</p>
                                       <p className="text-xs text-gray-500 mt-1">{timeSince(n.timestamp)}</p>
                                   </li>
                               )) : (
                                   <li className="p-4 text-center text-gray-500">لا توجد إشعارات.</li>
                               )}
                           </ul>
                        </div>
                    )}
                 </div>
                 <div className="text-right mx-3">
                    <div className="font-bold text-gray-800">{currentUser.username}</div>
                    <div className="text-xs text-indigo-600 font-semibold">{currentUser.isAdmin ? 'مدير النظام' : 'مستخدم'}</div>
                 </div>
                 <button onClick={handleLogout} className="text-gray-600 hover:bg-red-100 hover:text-red-600 p-2 rounded-full transition-colors">
                     <LogOut className="h-5 w-5" />
                 </button>
              </div>
               <div className="md:hidden">
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-gray-600 hover:bg-gray-100">
                        {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>
          </div>
        </div>
        {isMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-200">
                 <nav className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                    {navItems.filter(i => i.permission).map((item) => (
                         <button
                            key={item.id}
                            onClick={() => handleNavClick(item.id)}
                            className={`flex items-center w-full text-right px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ease-in-out ${
                            activePage === item.id
                                ? 'bg-indigo-600 text-white'
                                : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                            }`}
                        >
                            <item.icon className="h-5 w-5 ml-3" />
                            {item.label}
                        </button>
                    ))}
                </nav>
                <div className="pt-4 pb-3 border-t border-gray-200 px-4">
                     <div className="flex items-center justify-between">
                        <div>
                            <div className="font-bold text-gray-800">{currentUser.username}</div>
                            <div className="text-sm text-indigo-600 font-semibold">{currentUser.isAdmin ? 'مدير النظام' : 'مستخدم'}</div>
                        </div>
                        <button onClick={handleLogout} className="flex items-center text-red-600 hover:bg-red-100 p-2 rounded-md transition-colors">
                            <LogOut className="h-5 w-5 ml-2" />
                            <span>خروج</span>
                        </button>
                     </div>
                </div>
            </div>
        )}
      </header>
    );
};

const LoginPage: React.FC = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl">
                <div className="text-center">
                    <ShieldCheck className="mx-auto h-12 w-12 text-indigo-600" />
                    <h2 className="mt-6 text-3xl font-bold text-gray-900">
                        تسجيل الدخول للنظام
                    </h2>
                </div>
                <div className="text-center p-4 bg-yellow-50 border-r-4 border-yellow-400">
                    <p className="text-yellow-800">
                        للتسجيل، استخدم أي بريد إلكتروني وكلمة مرور. سيتم إنشاء حسابك تلقائيًا.
                        <br/>
                        <span className='font-bold'>لإنشاء مدير:</span> استخدم <span className='font-bold'>ahmed@example.com</span> و <span className='font-bold'>ahmed</span>
                    </p>
                </div>
                <Auth
                    supabaseClient={supabase}
                    providers={[]}
                    appearance={{
                        theme: ThemeSupa,
                        variables: {
                            default: {
                                colors: {
                                    brand: '#4f46e5',
                                    brandAccent: '#4338ca',
                                },
                            },
                        },
                    }}
                    theme="light"
                    localization={{
                        variables: {
                            sign_in: {
                                email_label: 'البريد الإلكتروني',
                                password_label: 'كلمة المرور',
                                email_input_placeholder: 'أدخل بريدك الإلكتروني',
                                password_input_placeholder: 'أدخل كلمة المرور',
                                button_label: 'تسجيل الدخول',
                                social_provider_text: 'أو سجل الدخول باستخدام',
                                link_text: 'هل لديك حساب بالفعل؟ سجل الدخول',
                            },
                            sign_up: {
                                email_label: 'البريد الإلكتروني',
                                password_label: 'كلمة المرور',
                                email_input_placeholder: 'أدخل بريدك الإلكتروني',
                                password_input_placeholder: 'أدخل كلمة المرور',
                                button_label: 'إنشاء حساب',
                                social_provider_text: 'أو سجل باستخدام',
                                link_text: 'ليس لديك حساب؟ أنشئ واحدًا',
                            },
                            forgotten_password: {
                                email_label: 'البريد الإلكتروني',
                                password_label: 'كلمة المرور الجديدة',
                                email_input_placeholder: 'أدخل بريدك الإلكتروني',
                                button_label: 'إرسال تعليمات إعادة تعيين كلمة المرور',
                                link_text: 'نسيت كلمة المرور؟',
                            },
                            update_password: {
                                password_label: 'كلمة المرور الجديدة',
                                password_input_placeholder: 'أدخل كلمة المرور الجديدة',
                                button_label: 'تحديث كلمة المرور',
                            },
                        },
                    }}
                />
            </div>
        </div>
    );
};

const AppContent: React.FC = () => {
    const { session, isLoading: isSessionLoading } = useSession();
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
    const [users, setUsers] = useState<User[]>([]); // This will now be Supabase auth users + profiles
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

            // If companyInfoData is null, it means it's the first time for this user.
            // We should initialize it.
            if (!companyInfoData) {
                const initialCompanyInfo: CompanyInfo = { name: 'اسم الشركة', address: 'عنوان الشركة', phone: '', email: '', logo: null, seal: null, weekendDays: [5, 6] };
                const newCompanyInfo = await apiService.updateCompanyInfo(initialCompanyInfo, userId);
                setCompanyInfo(newCompanyInfo);
            }

        } catch (error) {
            console.error("Failed to load initial data:", error);
            // Optionally, set an error state to show a message to the user
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
                password: '', // Password is not exposed
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

    const handleLogin = async (username: string, pass: string) => {
        // Supabase Auth UI handles login directly. This function is no longer needed.
        // The Auth UI will manage session state and trigger the useEffect above.
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

    // --- Data Mutation Handlers ---
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

    if (isSessionLoading || isDataLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }
    
    if (!session) {
        return <LoginPage />;
    }
    
    if (!currentUser || !companyInfo) {
        // This can happen on first load before company info is set
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