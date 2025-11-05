import { Employee, Leave, Departure, Holiday, HolidayWork, BalanceAdjustment, CompanyInfo, User, UserPermissions, NotificationItem, NotificationType, EmployeeStatus } from '../types';

// Declare pako for data compression, used for sync codes
declare const pako: any;

// --- LocalStorage Utility ---
const getItem = <T,>(key: string, defaultValue: T): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage key “${key}”:`, error);
        return defaultValue;
    }
};

const setItem = <T,>(key: string, value: T): void => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error writing to localStorage key “${key}”:`, error);
    }
};

const simulateApiCall = <T,>(data: T): Promise<T> => 
    new Promise(resolve => setTimeout(() => resolve(data), 150)); // Simulate network latency

// --- Initial Data and Defaults ---
const jordanHolidays: Holiday[] = [
    { id: '2025-01-01-new-year', name: 'رأس السنة الميلادية', date: '2025-01-01' }, { id: '2025-02-27-isra-miraj', name: 'الإسراء والمعراج', date: '2025-02-27' }, { id: '2025-03-30-eid-fitr-1', name: 'عيد الفطر', date: '2025-03-30' }, { id: '2025-03-31-eid-fitr-2', name: 'عيد الفطر', date: '2025-03-31' }, { id: '2025-04-01-eid-fitr-3', name: 'عيد الفطر', date: '2025-04-01' }, { id: '2025-04-02-eid-fitr-4', name: 'عيد الفطر', date: '2025-04-02' }, { id: '2025-05-01-labour-day', name: 'عيد العمال', date: '2025-05-01' }, { id: '2025-05-25-independence-day', name: 'عيد الاستقلال', date: '2025-05-25' }, { id: '2025-06-05-arafat-day', name: 'يوم عرفة', date: '2025-06-05' }, { id: '2025-06-06-eid-adha-1', name: 'عيد الأضحى', date: '2025-06-06' }, { id: '2025-06-07-eid-adha-2', name: 'عيد الأضحى', date: '2025-06-07' }, { id: '2025-06-08-eid-adha-3', name: 'عيد الأضحى', date: '2025-06-08' }, { id: '2025-06-09-eid-adha-4', name: 'عيد الأضحى', date: '2025-06-09' }, { id: '2025-06-26-islamic-new-year', name: 'رأس السنة الهجرية', date: '2025-06-26' }, { id: '2025-09-04-prophet-birthday', name: 'المولد النبوي الشريف', date: '2025-09-04' }, { id: '2025-12-25-christmas', name: 'عيد الميلاد المجيد', date: '2025-12-25' },
    { id: '2026-01-01-new-year', name: 'رأس السنة الميلادية', date: '2026-01-01' }, { id: '2026-02-16-isra-miraj', name: 'الإسراء والمعراج', date: '2026-02-16' }, { id: '2026-03-20-eid-fitr-1', name: 'عيد الفطر', date: '2026-03-20' }, { id: '2026-03-21-eid-fitr-2', name: 'عيد الفطر', date: '2026-03-21' }, { id: '2026-03-22-eid-fitr-3', name: 'عيد الفطر', date: '2026-03-22' }, { id: '2026-03-23-eid-fitr-4', name: 'عيد الفطر', date: '2026-03-23' }, { id: '2026-05-01-labour-day', name: 'عيد العمال', date: '2026-05-01' }, { id: '2026-05-25-independence-day', name: 'عيد الاستقلال', date: '2026-05-25' }, { id: '2026-05-26-arafat-day', name: 'يوم عرفة', date: '2026-05-26' }, { id: '2026-05-27-eid-adha-1', name: 'عيد الأضحى', date: '2026-05-27' }, { id: '2026-05-28-eid-adha-2', name: 'عيد الأضحى', date: '2026-05-28' }, { id: '2026-05-29-eid-adha-3', name: 'عيد الأضحى', date: '2026-05-29' }, { id: '2026-05-30-eid-adha-4', name: 'عيد الأضحى', date: '2026-05-30' }, { id: '2026-06-16-islamic-new-year', name: 'رأس السنة الهجرية', date: '2026-06-16' }, { id: '2026-08-25-prophet-birthday', name: 'المولد النبوي الشريف', date: '2026-08-25' }, { id: '2026-12-25-christmas', name: 'عيد الميلاد المجيد', date: '2026-12-25' },
];

const initialEmployees: Employee[] = [
    { id: 'emp_1', name: 'أحمد خالد', nationality: 'أردني', idType: 'هوية شخصية', nationalId: '9901234567', socialSecurityNumber: '12345678', jobTitle: 'مهندس برمجيات', dateOfBirth: '1990-05-15', hireDate: '2021-08-01', status: EmployeeStatus.Active }, { id: 'emp_2', name: 'فاطمة الزهراء', nationality: 'أردني', idType: 'هوية شخصية', nationalId: '9927654321', socialSecurityNumber: '23456789', jobTitle: 'مديرة مشروع', dateOfBirth: '1988-11-20', hireDate: '2019-03-10', status: EmployeeStatus.Active }, { id: 'emp_3', name: 'محمد علي', nationality: 'مصري', idType: 'إقامة', nationalId: '2950443210', socialSecurityNumber: '34567890', jobTitle: 'محاسب', dateOfBirth: '1995-02-28', hireDate: '2022-01-15', status: EmployeeStatus.Active }, { id: 'emp_4', name: 'سارة عبدالله', nationality: 'أردني', idType: 'هوية شخصية', nationalId: '9941122334', socialSecurityNumber: '45678901', jobTitle: 'مصممة جرافيك', dateOfBirth: '1994-07-12', hireDate: '2023-06-05', status: EmployeeStatus.Active }, { id: 'emp_5', name: 'يوسف حسن', nationality: 'سعودي', idType: 'جواز سفر', nationalId: 'A12345678', socialSecurityNumber: '56789012', jobTitle: 'مسؤول تسويق', dateOfBirth: '1991-09-03', hireDate: '2020-11-20', status: EmployeeStatus.Active }, { id: 'emp_6', name: 'ليلى مصطفى', nationality: 'أردني', idType: 'هوية شخصية', nationalId: '9895566778', socialSecurityNumber: '67890123', jobTitle: 'محللة بيانات', dateOfBirth: '1989-12-30', hireDate: '2018-02-18', status: EmployeeStatus.Active }, { id: 'emp_7', name: 'عمر فاروق', nationality: 'لبناني', idType: 'إقامة', nationalId: '3019876543', socialSecurityNumber: '78901234', jobTitle: 'مطور واجهة أمامية', dateOfBirth: '1998-04-22', hireDate: '2023-09-01', status: EmployeeStatus.Active }, { id: 'emp_8', name: 'نور إبراهيم', nationality: 'أردني', idType: 'هوية شخصية', nationalId: '9977889900', socialSecurityNumber: '89012345', jobTitle: 'مديرة موارد بشرية', dateOfBirth: '1985-06-18', hireDate: '2015-07-25', status: EmployeeStatus.Active }, { id: 'emp_9', name: 'خالد وليد', nationality: 'سوري', idType: 'إقامة', nationalId: '4023451234', socialSecurityNumber: '90123456', jobTitle: 'أخصائي دعم فني', dateOfBirth: '1993-01-10', hireDate: '2022-05-12', status: EmployeeStatus.Active }, { id: 'emp_10', name: 'ريم محمود', nationality: 'أردني', idType: 'هوية شخصية', nationalId: '9960102030', socialSecurityNumber: '11223344', jobTitle: 'مساعدة إدارية', dateOfBirth: '1996-03-25', hireDate: '2021-10-01', status: EmployeeStatus.Active }, { id: 'emp_11', name: 'علياء جمال', nationality: 'أردني', idType: 'هوية شخصية', nationalId: '9981231234', socialSecurityNumber: '12121212', jobTitle: 'أخصائي موارد بشرية', dateOfBirth: '1998-01-01', hireDate: '2024-01-01', status: EmployeeStatus.Active }
];
const initialNationalities = ['أردني', 'مصري', 'سعودي', 'لبناني', 'سوري'];
const initialIdTypes = ['هوية شخصية', 'جواز سفر', 'إقامة'];
const initialCompanyInfo: CompanyInfo = { name: '', address: '', phone: '', email: '', logo: null, seal: null, weekendDays: [5, 6] };
const getAdminPermissions = (): UserPermissions => ({
    employees: { view: true, add: true, edit: true, delete: true, export: true, import: true, adjustBalance: true },
    leaves: { view: true, add: true, edit: true, delete: true, manageHolidayWork: true, manageOfficialHolidays: true, overrideBalance: true, overrideMedicalReport: true },
    reports: { view: true },
    settings: { view: true, manageCompany: true, manageLists: true, manageUsers: true, clearData: true },
});


// --- API Service ---
// This service simulates a backend API. In a real application, the function bodies
// would be replaced with `fetch` or `axios` calls to a server.

const apiService = {
    // --- Employees ---
    getEmployees: (): Promise<Employee[]> => simulateApiCall(getItem<Employee[]>('employees', initialEmployees)),
    addEmployee: async (employeeData: Omit<Employee, 'id'>): Promise<Employee> => {
        const employees = await apiService.getEmployees();
        const newEmployee: Employee = { ...employeeData, id: `emp_${Date.now()}` };
        setItem('employees', [...employees, newEmployee]);
        return simulateApiCall(newEmployee);
    },
    updateEmployee: async (updatedEmployee: Employee): Promise<Employee> => {
        const employees = await apiService.getEmployees();
        const updatedEmployees = employees.map(e => e.id === updatedEmployee.id ? updatedEmployee : e);
        setItem('employees', updatedEmployees);
        return simulateApiCall(updatedEmployee);
    },
    deleteMultipleEmployees: async (employeeIds: string[]): Promise<void> => {
        const employees = await apiService.getEmployees();
        setItem('employees', employees.filter(e => !employeeIds.includes(e.id)));
        return simulateApiCall(undefined);
    },

    // --- Leaves, Departures, etc. (CRUD operations would follow the same pattern) ---
    getLeaves: (): Promise<Leave[]> => simulateApiCall(getItem<Leave[]>('leaves', [])),
    addLeave: async (data: Omit<Leave, 'id'>): Promise<Leave> => {
        const items = await apiService.getLeaves();
        const newItem: Leave = { ...data, id: `leave_${Date.now()}` };
        setItem('leaves', [...items, newItem]);
        return simulateApiCall(newItem);
    },
    updateLeave: async (item: Leave): Promise<Leave> => {
        const items = await apiService.getLeaves();
        setItem('leaves', items.map(i => i.id === item.id ? item : i));
        return simulateApiCall(item);
    },
    deleteLeave: async (id: string): Promise<void> => {
        const items = await apiService.getLeaves();
        setItem('leaves', items.filter(i => i.id !== id));
        return simulateApiCall(undefined);
    },
    
    getDepartures: (): Promise<Departure[]> => simulateApiCall(getItem<Departure[]>('departures', [])),
    getHolidays: (): Promise<Holiday[]> => simulateApiCall(getItem<Holiday[]>('holidays', jordanHolidays)),
    getHolidayWork: (): Promise<HolidayWork[]> => simulateApiCall(getItem<HolidayWork[]>('holidayWork', [])),
    getBalanceAdjustments: (): Promise<BalanceAdjustment[]> => simulateApiCall(getItem<BalanceAdjustment[]>('balanceAdjustments', [])),
    addBalanceAdjustment: async (data: Omit<BalanceAdjustment, 'id'>): Promise<BalanceAdjustment> => {
        const items = await apiService.getBalanceAdjustments();
        const newItem: BalanceAdjustment = { ...data, id: `adj_${Date.now()}` };
        setItem('balanceAdjustments', [...items, newItem]);
        return simulateApiCall(newItem);
    },

    // --- Settings and Lists ---
    getNationalities: (): Promise<string[]> => simulateApiCall(getItem<string[]>('nationalities', initialNationalities)),
    getIdTypes: (): Promise<string[]> => simulateApiCall(getItem<string[]>('idTypes', initialIdTypes)),
    getCompanyInfo: (): Promise<CompanyInfo> => simulateApiCall(getItem<CompanyInfo>('companyInfo', initialCompanyInfo)),
    updateCompanyInfo: async (info: CompanyInfo): Promise<CompanyInfo> => {
        setItem('companyInfo', info);
        return simulateApiCall(info);
    },

    // --- Users ---
    getUsers: (): Promise<User[]> => simulateApiCall(getItem<User[]>('users', [])),
    addInitialAdmin: async (): Promise<User> => {
        const adminUser: User = {
            id: 'admin_user', username: 'ahmed', password: 'ahmed', isAdmin: true, permissions: getAdminPermissions(),
        };
        setItem('users', [adminUser]);
        return simulateApiCall(adminUser);
    },
    // ... other user CRUD operations

    // --- Notifications (Per-user) ---
    getNotifications: (userId: string): Promise<NotificationItem[]> => simulateApiCall(getItem<NotificationItem[]>(`notifications_${userId}`, [])),
    addNotification: async (userId: string, message: string, type: NotificationType): Promise<NotificationItem> => {
        const items = await apiService.getNotifications(userId);
        const newItem: NotificationItem = { id: new Date().toISOString(), message, type, read: false, timestamp: new Date().toISOString() };
        setItem(`notifications_${userId}`, [newItem, ...items].slice(0, 50));
        return simulateApiCall(newItem);
    },
    markAllNotificationsAsRead: async (userId: string): Promise<void> => {
        const items = await apiService.getNotifications(userId);
        setItem(`notifications_${userId}`, items.map(n => ({ ...n, read: true })));
        return simulateApiCall(undefined);
    },
    clearAllNotifications: async (userId: string): Promise<void> => {
        setItem(`notifications_${userId}`, []);
        return simulateApiCall(undefined);
    },

    // --- Bulk Data Operations for Import/Export/Sync ---
    getAllDataForExport: async (): Promise<any> => {
        const [employees, leaves, departures, holidays, holidayWork, balanceAdjustments, nationalities, idTypes, companyInfo, users] = await Promise.all([
            apiService.getEmployees(), apiService.getLeaves(), apiService.getDepartures(), apiService.getHolidays(), apiService.getHolidayWork(),
            apiService.getBalanceAdjustments(), apiService.getNationalities(), apiService.getIdTypes(), apiService.getCompanyInfo(), apiService.getUsers()
        ]);
        return { employees, leaves, departures, holidays, holidayWork, balanceAdjustments, nationalities, idTypes, companyInfo, users };
    },
    importAllData: async (data: any): Promise<void> => {
        const requiredKeys = ['employees', 'leaves', 'departures', 'holidays', 'holidayWork', 'balanceAdjustments', 'nationalities', 'idTypes', 'companyInfo', 'users'];
        const hasAllKeys = requiredKeys.every(key => key in data);
        if (!hasAllKeys) {
            throw new Error('Invalid or corrupted data file.');
        }
        
        requiredKeys.forEach(key => {
            setItem(key, data[key]);
        });
        return simulateApiCall(undefined);
    },
    generateSyncCode: (): string => {
        const allData = {
            employees: getItem('employees', []), leaves: getItem('leaves', []), departures: getItem('departures', []),
            holidays: getItem('holidays', []), holidayWork: getItem('holidayWork', []), balanceAdjustments: getItem('balanceAdjustments', []),
            nationalities: getItem('nationalities', []), idTypes: getItem('idTypes', []), companyInfo: getItem('companyInfo', {}),
            users: getItem('users', [])
        };
        try {
            const jsonStr = JSON.stringify(allData);
            const compressed = pako.deflate(jsonStr, { to: 'string' });
            return btoa(compressed);
        } catch (e) {
            console.error("Error generating sync code:", e);
            return '';
        }
    },
    importFromSyncCode: async (base64Data: string): Promise<boolean> => {
        try {
            const binaryStr = atob(base64Data);
            const len = binaryStr.length;
            const compressed = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                compressed[i] = binaryStr.charCodeAt(i);
            }
            const jsonStr = pako.inflate(compressed, { to: 'string' });
            const data = JSON.parse(jsonStr);
            await apiService.importAllData(data);
            alert('تم استيراد البيانات بنجاح. سيتم إعادة تحميل التطبيق.');
            setTimeout(() => window.location.reload(), 300);
            return true;
        } catch (e) {
            console.error("Failed to parse sync code", e);
            alert('رمز المزامنة غير صالح أو تالف.');
            return false;
        }
    },
};

export default apiService;
