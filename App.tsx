import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Employee, Leave, Departure, Holiday, EmployeeStatus, LeaveType, HolidayWork, CompanyInfo, BalanceAdjustment, User, UserPermissions, NotificationItem, NotificationType } from './types';
import EmployeeManagement from './components/EmployeeManagement';
import LeaveHolidayManagement from './components/LeaveHolidayManagement';
import Settings from './components/Settings';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import { CalendarDays, Users, Settings as SettingsIcon, Building2, LayoutDashboard, LogOut, ShieldCheck, FileText, Menu, X, AlertTriangle, Bell, Trash2 } from 'lucide-react';
import { calculateAccruedLeave, calculateDepartureBalance } from './services/calculation';

// Declare pako for data compression
declare const pako: any;

// Custom hook for localStorage
const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue];
};

const getDefaultPermissions = (): UserPermissions => ({
    employees: { view: false, add: false, edit: false, delete: false, export: false, import: false, adjustBalance: false },
    leaves: { view: false, add: false, edit: false, delete: false, manageHolidayWork: false, manageOfficialHolidays: false, overrideBalance: false, overrideMedicalReport: false },
    reports: { view: false },
    settings: { view: false, manageCompany: false, manageLists: false, manageUsers: false, clearData: false },
});

const getAdminPermissions = (): UserPermissions => ({
    employees: { view: true, add: true, edit: true, delete: true, export: true, import: true, adjustBalance: true },
    leaves: { view: true, add: true, edit: true, delete: true, manageHolidayWork: true, manageOfficialHolidays: true, overrideBalance: true, overrideMedicalReport: true },
    reports: { view: true },
    settings: { view: true, manageCompany: true, manageLists: true, manageUsers: true, clearData: true },
});

// Pre-populated holidays for Jordan for 2025 & 2026
const jordanHolidays: Holiday[] = [
    // 2025
    { id: '2025-01-01-new-year', name: 'رأس السنة الميلادية', date: '2025-01-01' },
    { id: '2025-02-27-isra-miraj', name: 'الإسراء والمعراج', date: '2025-02-27' },
    { id: '2025-03-30-eid-fitr-1', name: 'عيد الفطر', date: '2025-03-30' },
    { id: '2025-03-31-eid-fitr-2', name: 'عيد الفطر', date: '2025-03-31' },
    { id: '2025-04-01-eid-fitr-3', name: 'عيد الفطر', date: '2025-04-01' },
    { id: '2025-04-02-eid-fitr-4', name: 'عيد الفطر', date: '2025-04-02' },
    { id: '2025-05-01-labour-day', name: 'عيد العمال', date: '2025-05-01' },
    { id: '2025-05-25-independence-day', name: 'عيد الاستقلال', date: '2025-05-25' },
    { id: '2025-06-05-arafat-day', name: 'يوم عرفة', date: '2025-06-05' },
    { id: '2025-06-06-eid-adha-1', name: 'عيد الأضحى', date: '2025-06-06' },
    { id: '2025-06-07-eid-adha-2', name: 'عيد الأضحى', date: '2025-06-07' },
    { id: '2025-06-08-eid-adha-3', name: 'عيد الأضحى', date: '2025-06-08' },
    { id: '2025-06-09-eid-adha-4', name: 'عيد الأضحى', date: '2025-06-09' },
    { id: '2025-06-26-islamic-new-year', name: 'رأس السنة الهجرية', date: '2025-06-26' },
    { id: '2025-09-04-prophet-birthday', name: 'المولد النبوي الشريف', date: '2025-09-04' },
    { id: '2025-12-25-christmas', name: 'عيد الميلاد المجيد', date: '2025-12-25' },
    // 2026
    { id: '2026-01-01-new-year', name: 'رأس السنة الميلادية', date: '2026-01-01' },
    { id: '2026-02-16-isra-miraj', name: 'الإسراء والمعراج', date: '2026-02-16' },
    { id: '2026-03-20-eid-fitr-1', name: 'عيد الفطر', date: '2026-03-20' },
    { id: '2026-03-21-eid-fitr-2', name: 'عيد الفطر', date: '2026-03-21' },
    { id: '2026-03-22-eid-fitr-3', name: 'عيد الفطر', date: '2026-03-22' },
    { id: '2026-03-23-eid-fitr-4', name: 'عيد الفطر', date: '2026-03-23' },
    { id: '2026-05-01-labour-day', name: 'عيد العمال', date: '2026-05-01' },
    { id: '2026-05-25-independence-day', name: 'عيد الاستقلال', date: '2026-05-25' },
    { id: '2026-05-26-arafat-day', name: 'يوم عرفة', date: '2026-05-26' },
    { id: '2026-05-27-eid-adha-1', name: 'عيد الأضحى', date: '2026-05-27' },
    { id: '2026-05-28-eid-adha-2', name: 'عيد الأضحى', date: '2026-05-28' },
    { id: '2026-05-29-eid-adha-3', name: 'عيد الأضحى', date: '2026-05-29' },
    { id: '2026-05-30-eid-adha-4', name: 'عيد الأضحى', date: '2026-05-30' },
    { id: '2026-06-16-islamic-new-year', name: 'رأس السنة الهجرية', date: '2026-06-16' },
    { id: '2026-08-25-prophet-birthday', name: 'المولد النبوي الشريف', date: '2026-08-25' },
    { id: '2026-12-25-christmas', name: 'عيد الميلاد المجيد', date: '2026-12-25' },
];

const initialData = {
    employees: [
        { id: 'emp_1', name: 'أحمد خالد', nationality: 'أردني', idType: 'هوية شخصية', nationalId: '9901234567', socialSecurityNumber: '12345678', jobTitle: 'مهندس برمجيات', dateOfBirth: '1990-05-15', hireDate: '2021-08-01', status: EmployeeStatus.Active },
        { id: 'emp_2', name: 'فاطمة الزهراء', nationality: 'أردني', idType: 'هوية شخصية', nationalId: '9927654321', socialSecurityNumber: '23456789', jobTitle: 'مديرة مشروع', dateOfBirth: '1988-11-20', hireDate: '2019-03-10', status: EmployeeStatus.Active },
        { id: 'emp_3', name: 'محمد علي', nationality: 'مصري', idType: 'إقامة', nationalId: '2950443210', socialSecurityNumber: '34567890', jobTitle: 'محاسب', dateOfBirth: '1995-02-28', hireDate: '2022-01-15', status: EmployeeStatus.Active },
        { id: 'emp_4', name: 'سارة عبدالله', nationality: 'أردني', idType: 'هوية شخصية', nationalId: '9941122334', socialSecurityNumber: '45678901', jobTitle: 'مصممة جرافيك', dateOfBirth: '1994-07-12', hireDate: '2023-06-05', status: EmployeeStatus.Active },
        { id: 'emp_5', name: 'يوسف حسن', nationality: 'سعودي', idType: 'جواز سفر', nationalId: 'A12345678', socialSecurityNumber: '56789012', jobTitle: 'مسؤول تسويق', dateOfBirth: '1991-09-03', hireDate: '2020-11-20', status: EmployeeStatus.Active },
        { id: 'emp_6', name: 'ليلى مصطفى', nationality: 'أردني', idType: 'هوية شخصية', nationalId: '9895566778', socialSecurityNumber: '67890123', jobTitle: 'محللة بيانات', dateOfBirth: '1989-12-30', hireDate: '2018-02-18', status: EmployeeStatus.Active },
        { id: 'emp_7', name: 'عمر فاروق', nationality: 'لبناني', idType: 'إقامة', nationalId: '3019876543', socialSecurityNumber: '78901234', jobTitle: 'مطور واجهة أمامية', dateOfBirth: '1998-04-22', hireDate: '2023-09-01', status: EmployeeStatus.Active },
        { id: 'emp_8', name: 'نور إبراهيم', nationality: 'أردني', idType: 'هوية شخصية', nationalId: '9977889900', socialSecurityNumber: '89012345', jobTitle: 'مديرة موارد بشرية', dateOfBirth: '1985-06-18', hireDate: '2015-07-25', status: EmployeeStatus.Active },
        { id: 'emp_9', name: 'خالد وليد', nationality: 'سوري', idType: 'إقامة', nationalId: '4023451234', socialSecurityNumber: '90123456', jobTitle: 'أخصائي دعم فني', dateOfBirth: '1993-01-10', hireDate: '2022-05-12', status: EmployeeStatus.Active },
        { id: 'emp_10', name: 'ريم محمود', nationality: 'أردني', idType: 'هوية شخصية', nationalId: '9960102030', socialSecurityNumber: '11223344', jobTitle: 'مساعدة إدارية', dateOfBirth: '1996-03-25', hireDate: '2021-10-01', status: EmployeeStatus.Active },
        { id: 'emp_11', name: 'علياء جمال', nationality: 'أردني', idType: 'هوية شخصية', nationalId: '9981231234', socialSecurityNumber: '12121212', jobTitle: 'أخصائي موارد بشرية', dateOfBirth: '1998-01-01', hireDate: '2024-01-01', status: EmployeeStatus.Active }
    ],
    leaves: [],
    departures: [],
    holidays: jordanHolidays,
    holidayWork: [],
    balanceAdjustments: [],
    nationalities: ['أردني', 'مصري', 'سعودي', 'لبناني', 'سوري'],
    idTypes: ['هوية شخصية', 'جواز سفر', 'إقامة'],
    companyInfo: { name: '', address: '', phone: '', email: '', logo: null, seal: null, weekendDays: [5, 6] },
    users: [],
    notifications: [],
};

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

const LoginPage: React.FC<{ onLogin: (username: string, pass: string) => void; error: string; }> = ({ onLogin, error }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(username, password);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl">
                <div className="text-center">
                    <ShieldCheck className="mx-auto h-12 w-12 text-indigo-600" />
                    <h2 className="mt-6 text-3xl font-bold text-gray-900">
                        تسجيل الدخول للنظام
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="اسم المستخدم"
                            />
                        </div>
                        <div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="كلمة المرور"
                            />
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            دخول
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const App: React.FC = () => {
  const [page, setPage] = useState('dashboard');
  const [employees, setEmployees] = useLocalStorage<Employee[]>('employees', initialData.employees);
  const [leaves, setLeaves] = useLocalStorage<Leave[]>('leaves', initialData.leaves);
  const [departures, setDepartures] = useLocalStorage<Departure[]>('departures', initialData.departures);
  const [holidays, setHolidays] = useLocalStorage<Holiday[]>('holidays', initialData.holidays);
  const [holidayWork, setHolidayWork] = useLocalStorage<HolidayWork[]>('holidayWork', initialData.holidayWork);
  const [balanceAdjustments, setBalanceAdjustments] = useLocalStorage<BalanceAdjustment[]>('balanceAdjustments', initialData.balanceAdjustments);
  const [nationalities, setNationalities] = useLocalStorage<string[]>('nationalities', initialData.nationalities);
  const [idTypes, setIdTypes] = useLocalStorage<string[]>('idTypes', initialData.idTypes);
  const [companyInfo, setCompanyInfo] = useLocalStorage<CompanyInfo>('companyInfo', initialData.companyInfo);
  const [users, setUsers] = useLocalStorage<User[]>('users', initialData.users);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState('');
  
  const notificationKey = `notifications_${currentUser?.id || 'guest'}`;
  const [notifications, setNotifications] = useLocalStorage<NotificationItem[]>(notificationKey, []);

  useEffect(() => {
    // Create a default admin user if no users exist
    if (users.length === 0) {
        const adminUser: User = {
            id: 'admin_user',
            username: 'ahmed',
            password: 'ahmed',
            isAdmin: true,
            permissions: getAdminPermissions(),
        };
        setUsers([adminUser]);
    }
  }, []); // Run only once on mount

  useEffect(() => {
     if(currentUser && 'Notification' in window) {
        if(Notification.permission === 'default') {
             Notification.requestPermission();
        }
     }
  }, [currentUser]);
  
  const addNotification = (message: string, type: NotificationType) => {
    const newNotification: NotificationItem = {
      id: new Date().toISOString(),
      message,
      type,
      read: false,
      timestamp: new Date().toISOString(),
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('نظام إدارة الإجازات', {
        body: message,
        icon: '/logo.svg',
      });
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const handleLogin = (username: string, pass: string) => {
    const user = users.find(u => u.username === username && u.password === pass);
    if (user) {
        setCurrentUser(user);
        setLoginError('');
        setPage('dashboard');
    } else {
        setLoginError('اسم المستخدم أو كلمة المرور غير صحيحة.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const importAllData = (data: any): boolean => {
      const requiredKeys = ['employees', 'leaves', 'departures', 'holidays', 'holidayWork', 'balanceAdjustments', 'nationalities', 'idTypes', 'companyInfo', 'users'];
      const hasAllKeys = requiredKeys.every(key => key in data);

      if (!hasAllKeys) {
          alert('الملف غير صالح أو تالف.');
          return false;
      }

      setEmployees(data.employees);
      setLeaves(data.leaves);
      setDepartures(data.departures);
      setHolidays(data.holidays);
      setHolidayWork(data.holidayWork);
      setBalanceAdjustments(data.balanceAdjustments);
      setNationalities(data.nationalities);
      setIdTypes(data.idTypes);
      setCompanyInfo(data.companyInfo);
      setUsers(data.users);
      
      return true;
  };
  
  const handleImportFromCode = (base64Data: string): boolean => {
    try {
        const binaryStr = atob(base64Data);
        const len = binaryStr.length;
        const compressed = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            compressed[i] = binaryStr.charCodeAt(i);
        }
        const jsonStr = pako.inflate(compressed, { to: 'string' });
        const data = JSON.parse(jsonStr);
        
        const success = importAllData(data);
        if (success) {
            alert('تم استيراد البيانات بنجاح. سيتم إعادة تحميل التطبيق.');
            setTimeout(() => window.location.reload(), 300);
        }
        return success;
    } catch (e) {
        console.error("Failed to parse sync code", e);
        alert('رمز المزامنة غير صالح أو تالف.');
        return false;
    }
  };


  const exportAllData = () => {
    const allData = {
        employees, leaves, departures, holidays, holidayWork,
        balanceAdjustments, nationalities, idTypes, companyInfo, users,
    };
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
  
  const generateSyncCode = (): string => {
    const allData = {
        employees, leaves, departures, holidays, holidayWork,
        balanceAdjustments, nationalities, idTypes, companyInfo, users,
    };
    try {
        const jsonStr = JSON.stringify(allData);
        const compressed = pako.deflate(jsonStr, { to: 'string' }); 
        const base64 = btoa(compressed);
        return base64;
    } catch (e) {
        console.error("Error generating sync code:", e);
        return '';
    }
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

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} error={loginError} />;
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
            setEmployees={setEmployees}
            nationalities={nationalities}
            idTypes={idTypes}
            getEmployeeBalances={getEmployeeBalances}
            setBalanceAdjustments={setBalanceAdjustments}
            permissions={currentUser.permissions.employees}
            addNotification={addNotification}
          />
        )}
        {page === 'leaves' && currentUser.permissions.leaves.view && (
          <LeaveHolidayManagement
            employees={employees}
            leaves={leaves}
            setLeaves={setLeaves}
            departures={departures}
            setDepartures={setDepartures}
            holidays={holidays}
            setHolidays={setHolidays}
            holidayWork={holidayWork}
            setHolidayWork={setHolidayWork}
            getEmployeeBalances={getEmployeeBalances}
            companyInfo={companyInfo}
            permissions={currentUser.permissions.leaves}
            currentUser={currentUser}
            addNotification={addNotification}
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
            setNationalities={setNationalities}
            idTypes={idTypes}
            setIdTypes={setIdTypes}
            companyInfo={companyInfo}
            setCompanyInfo={setCompanyInfo}
            setPage={setPage}
            currentUser={currentUser}
            users={users}
            setUsers={setUsers}
            importAllData={importAllData}
            exportAllData={exportAllData}
            generateSyncCode={generateSyncCode}
            addNotification={addNotification}
            onImportFromCode={handleImportFromCode}
          />
        )}
      </main>
    </div>
  );
};

export default App;