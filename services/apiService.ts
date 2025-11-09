import { Employee, Leave, Departure, Holiday, HolidayWork, BalanceAdjustment, CompanyInfo, User, UserPermissions, NotificationItem, NotificationType, EmployeeStatus } from '../types';
import { supabase } from '../src/integrations/supabase/client'; // Import Supabase client

// Declare pako for data compression, used for sync codes
declare const pako: any;

// --- API Service ---
// This service now interacts with Supabase for data persistence.

const apiService = {
    // --- Employees ---
    getEmployees: async (userId: string): Promise<Employee[]> => {
        const { data, error } = await supabase.from('employees').select('*').eq('user_id', userId);
        if (error) throw error;
        return data.map(e => ({
            ...e,
            dateOfBirth: e.date_of_birth,
            hireDate: e.hire_date,
            endDate: e.end_date,
            nationalId: e.national_id,
            socialSecurityNumber: e.social_security_number,
            idType: e.id_type,
            customAnnualLeaveDays: e.custom_annual_leave_days,
            initialAnnualBalance: e.initial_annual_balance,
            balanceSetDate: e.balance_set_date,
        }));
    },
    addEmployee: async (employeeData: Omit<Employee, 'id'>, userId: string): Promise<Employee> => {
        const { data, error } = await supabase.from('employees').insert({
            ...employeeData,
            user_id: userId,
            date_of_birth: employeeData.dateOfBirth,
            hire_date: employeeData.hireDate,
            end_date: employeeData.endDate,
            national_id: employeeData.nationalId,
            social_security_number: employeeData.socialSecurityNumber,
            id_type: employeeData.idType,
            custom_annual_leave_days: employeeData.customAnnualLeaveDays,
            initial_annual_balance: employeeData.initialAnnualBalance,
            balance_set_date: employeeData.balanceSetDate,
        }).select().single();
        if (error) throw error;
        return {
            ...data,
            dateOfBirth: data.date_of_birth,
            hireDate: data.hire_date,
            endDate: data.end_date,
            nationalId: data.national_id,
            socialSecurityNumber: data.social_security_number,
            idType: data.id_type,
            customAnnualLeaveDays: data.custom_annual_leave_days,
            initialAnnualBalance: data.initial_annual_balance,
            balanceSetDate: data.balance_set_date,
        };
    },
    addMultipleEmployees: async (employeesData: Omit<Employee, 'id'>[], userId: string): Promise<Employee[]> => {
        const employeesToInsert = employeesData.map(emp => ({
            ...emp,
            user_id: userId,
            date_of_birth: emp.dateOfBirth,
            hire_date: emp.hireDate,
            end_date: emp.endDate,
            national_id: emp.nationalId,
            social_security_number: emp.socialSecurityNumber,
            id_type: emp.idType,
            custom_annual_leave_days: emp.customAnnualLeaveDays,
            initial_annual_balance: emp.initialAnnualBalance,
            balance_set_date: emp.balanceSetDate,
        }));
        const { data, error } = await supabase.from('employees').insert(employeesToInsert).select();
        if (error) throw error;
        return data.map(e => ({
            ...e,
            dateOfBirth: e.date_of_birth,
            hireDate: e.hire_date,
            endDate: e.end_date,
            nationalId: e.national_id,
            socialSecurityNumber: e.social_security_number,
            idType: e.id_type,
            customAnnualLeaveDays: e.custom_annual_leave_days,
            initialAnnualBalance: e.initial_annual_balance,
            balanceSetDate: e.balance_set_date,
        }));
    },
    updateEmployee: async (updatedEmployee: Employee, userId: string): Promise<Employee> => {
        const { data, error } = await supabase.from('employees').update({
            ...updatedEmployee,
            user_id: userId,
            date_of_birth: updatedEmployee.dateOfBirth,
            hire_date: updatedEmployee.hireDate,
            end_date: updatedEmployee.endDate,
            national_id: updatedEmployee.nationalId,
            social_security_number: updatedEmployee.socialSecurityNumber,
            id_type: updatedEmployee.idType,
            custom_annual_leave_days: updatedEmployee.customAnnualLeaveDays,
            initial_annual_balance: updatedEmployee.initialAnnualBalance,
            balance_set_date: updatedEmployee.balanceSetDate,
        }).eq('id', updatedEmployee.id).eq('user_id', userId).select().single();
        if (error) throw error;
        return {
            ...data,
            dateOfBirth: data.date_of_birth,
            hireDate: data.hire_date,
            endDate: data.end_date,
            nationalId: data.national_id,
            socialSecurityNumber: data.social_security_number,
            idType: data.id_type,
            customAnnualLeaveDays: data.custom_annual_leave_days,
            initialAnnualBalance: data.initial_annual_balance,
            balanceSetDate: data.balance_set_date,
        };
    },
    deleteMultipleEmployees: async (employeeIds: string[], userId: string): Promise<void> => {
        const { error } = await supabase.from('employees').delete().in('id', employeeIds).eq('user_id', userId);
        if (error) throw error;
    },

    // --- Leaves ---
    getLeaves: async (userId: string): Promise<Leave[]> => {
        const { data, error } = await supabase.from('leaves').select('*').eq('user_id', userId);
        if (error) throw error;
        return data.map(l => ({
            ...l,
            employeeId: l.employee_id,
            startDate: l.start_date,
            endDate: l.end_date,
            medicalReport: l.medical_report,
            daysTaken: l.days_taken,
        }));
    },
    addLeave: async (data: Omit<Leave, 'id'>, userId: string): Promise<Leave> => {
        const { data: newLeave, error } = await supabase.from('leaves').insert({
            ...data,
            user_id: userId,
            employee_id: data.employeeId,
            start_date: data.startDate,
            end_date: data.endDate,
            medical_report: data.medicalReport,
            days_taken: data.daysTaken,
        }).select().single();
        if (error) throw error;
        return {
            ...newLeave,
            employeeId: newLeave.employee_id,
            startDate: newLeave.start_date,
            endDate: newLeave.end_date,
            medicalReport: newLeave.medical_report,
            daysTaken: newLeave.days_taken,
        };
    },
    updateLeave: async (item: Leave, userId: string): Promise<Leave> => {
        const { data, error } = await supabase.from('leaves').update({
            ...item,
            user_id: userId,
            employee_id: item.employeeId,
            start_date: item.startDate,
            end_date: item.endDate,
            medical_report: item.medicalReport,
            days_taken: item.daysTaken,
        }).eq('id', item.id).eq('user_id', userId).select().single();
        if (error) throw error;
        return {
            ...data,
            employeeId: data.employee_id,
            startDate: data.start_date,
            endDate: data.end_date,
            medicalReport: data.medical_report,
            daysTaken: data.days_taken,
        };
    },
    deleteLeave: async (id: string, userId: string): Promise<void> => {
        const { error } = await supabase.from('leaves').delete().eq('id', id).eq('user_id', userId);
        if (error) throw error;
    },
    
    // --- Departures ---
    getDepartures: async (userId: string): Promise<Departure[]> => {
        const { data, error } = await supabase.from('departures').select('*').eq('user_id', userId);
        if (error) throw error;
        return data.map(d => ({
            ...d,
            employeeId: d.employee_id,
        }));
    },
    addDeparture: async (data: Omit<Departure, 'id'>, userId: string): Promise<Departure> => {
        const { data: newDeparture, error } = await supabase.from('departures').insert({
            ...data,
            user_id: userId,
            employee_id: data.employeeId,
        }).select().single();
        if (error) throw error;
        return {
            ...newDeparture,
            employeeId: newDeparture.employee_id,
        };
    },
    updateDeparture: async (item: Departure, userId: string): Promise<Departure> => {
        const { data, error } = await supabase.from('departures').update({
            ...item,
            user_id: userId,
            employee_id: item.employeeId,
        }).eq('id', item.id).eq('user_id', userId).select().single();
        if (error) throw error;
        return {
            ...data,
            employeeId: data.employee_id,
        };
    },
    deleteDeparture: async (id: string, userId: string): Promise<void> => {
        const { error } = await supabase.from('departures').delete().eq('id', id).eq('user_id', userId);
        if (error) throw error;
    },

    // --- Holidays ---
    getHolidays: async (userId: string): Promise<Holiday[]> => {
        const { data, error } = await supabase.from('holidays').select('*').eq('user_id', userId);
        if (error) throw error;
        return data;
    },
    addHoliday: async (data: Omit<Holiday, 'id'>, userId: string): Promise<Holiday> => {
        const { data: newHoliday, error } = await supabase.from('holidays').insert({ ...data, user_id: userId }).select().single();
        if (error) throw error;
        return newHoliday;
    },
    deleteHoliday: async (id: string, userId: string): Promise<void> => {
        const { error } = await supabase.from('holidays').delete().eq('id', id).eq('user_id', userId);
        if (error) throw error;
    },

    // --- Holiday Work ---
    getHolidayWork: async (userId: string): Promise<HolidayWork[]> => {
        const { data, error } = await supabase.from('holiday_work').select('*').eq('user_id', userId);
        if (error) throw error;
        return data.map(hw => ({
            ...hw,
            employeeId: hw.employee_id,
        }));
    },
    addHolidayWork: async (data: Omit<HolidayWork, 'id'>, userId: string): Promise<HolidayWork> => {
        const { data: newHolidayWork, error } = await supabase.from('holiday_work').insert({
            ...data,
            user_id: userId,
            employee_id: data.employeeId,
        }).select().single();
        if (error) throw error;
        return {
            ...newHolidayWork,
            employeeId: newHolidayWork.employee_id,
        };
    },
    deleteHolidayWork: async (id: string, userId: string): Promise<void> => {
        const { error } = await supabase.from('holiday_work').delete().eq('id', id).eq('user_id', userId);
        if (error) throw error;
    },

    // --- Balance Adjustments ---
    getBalanceAdjustments: async (userId: string): Promise<BalanceAdjustment[]> => {
        const { data, error } = await supabase.from('balance_adjustments').select('*').eq('user_id', userId);
        if (error) throw error;
        return data.map(adj => ({
            ...adj,
            employeeId: adj.employee_id,
            leaveType: adj.leave_type,
            adjustmentDays: adj.adjustment_days,
        }));
    },
    addBalanceAdjustment: async (data: Omit<BalanceAdjustment, 'id'>, userId: string): Promise<BalanceAdjustment> => {
        const { data: newAdjustment, error } = await supabase.from('balance_adjustments').insert({
            ...data,
            user_id: userId,
            employee_id: data.employeeId,
            leave_type: data.leaveType,
            adjustment_days: data.adjustmentDays,
        }).select().single();
        if (error) throw error;
        return {
            ...newAdjustment,
            employeeId: newAdjustment.employee_id,
            leaveType: newAdjustment.leave_type,
            adjustmentDays: newAdjustment.adjustment_days,
        };
    },

    // --- Settings and Lists ---
    getNationalities: async (userId: string): Promise<string[]> => {
        const { data, error } = await supabase.from('nationalities').select('value').eq('user_id', userId);
        if (error) throw error;
        return data.map(item => item.value);
    },
    updateNationalities: async (items: string[], userId: string): Promise<string[]> => {
        // Delete existing and insert new ones
        await supabase.from('nationalities').delete().eq('user_id', userId);
        const itemsToInsert = items.map(value => ({ value, user_id: userId }));
        const { data, error } = await supabase.from('nationalities').insert(itemsToInsert).select('value');
        if (error) throw error;
        return data.map(item => item.value);
    },
    getIdTypes: async (userId: string): Promise<string[]> => {
        const { data, error } = await supabase.from('id_types').select('value').eq('user_id', userId);
        if (error) throw error;
        return data.map(item => item.value);
    },
    updateIdTypes: async (items: string[], userId: string): Promise<string[]> => {
        // Delete existing and insert new ones
        await supabase.from('id_types').delete().eq('user_id', userId);
        const itemsToInsert = items.map(value => ({ value, user_id: userId }));
        const { data, error } = await supabase.from('id_types').insert(itemsToInsert).select('value');
        if (error) throw error;
        return data.map(item => item.value);
    },
    getCompanyInfo: async (userId: string): Promise<CompanyInfo | null> => {
        const { data, error } = await supabase.from('company_info').select('*').eq('user_id', userId).single();
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 means no rows found
        if (!data) return null;
        return {
            ...data,
            weekendDays: data.weekend_days,
        };
    },
    updateCompanyInfo: async (info: CompanyInfo, userId: string): Promise<CompanyInfo> => {
        const { data: existingInfo } = await supabase.from('company_info').select('id').eq('user_id', userId).single();
        
        const companyInfoToSave = {
            ...info,
            user_id: userId,
            weekend_days: info.weekendDays,
        };

        let data;
        let error;

        if (existingInfo) {
            ({ data, error } = await supabase.from('company_info').update(companyInfoToSave).eq('id', existingInfo.id).eq('user_id', userId).select().single());
        } else {
            ({ data, error } = await supabase.from('company_info').insert(companyInfoToSave).select().single());
        }
        
        if (error) throw error;
        return {
            ...data,
            weekendDays: data.weekend_days,
        };
    },

    // --- Users (Supabase Auth handles core users, profiles table for metadata) ---
    // The application's 'User' concept now maps to Supabase auth.users + public.profiles
    // Permissions will be stored in the profile metadata or a separate table if more complex.
    // For now, we'll simplify the 'users' management to just update profile data and manage isAdmin status.
    getUsers: async (): Promise<User[]> => {
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) throw authError;

        const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*');
        if (profilesError) throw profilesError;

        const usersWithProfiles: User[] = authUsers.users.map(authUser => {
            const profile = profiles.find(p => p.id === authUser.id);
            // For simplicity, we'll store isAdmin and permissions in user_metadata for now.
            // In a real app, this might be a separate 'roles' or 'permissions' table.
            const isAdmin = authUser.user_metadata?.isAdmin || false;
            const permissions = authUser.user_metadata?.permissions || {};

            return {
                id: authUser.id,
                username: authUser.email || authUser.phone || 'N/A', // Supabase uses email/phone for login
                password: '', // Never expose password
                isAdmin: isAdmin,
                permissions: permissions,
                firstName: profile?.first_name || '',
                lastName: profile?.last_name || '',
                avatarUrl: profile?.avatar_url || '',
            };
        });
        return usersWithProfiles;
    },
    addUser: async (userData: Omit<User, 'id'>): Promise<User> => {
        const { data, error } = await supabase.auth.admin.createUser({
            email: userData.username,
            password: userData.password,
            email_confirm: true,
            user_metadata: {
                isAdmin: userData.isAdmin,
                permissions: userData.permissions,
                first_name: userData.firstName,
                last_name: userData.lastName,
            },
        });
        if (error) throw error;
        
        // The handle_new_user trigger will create the profile.
        // We need to return a User object that matches the app's type.
        return {
            id: data.user.id,
            username: data.user.email || '',
            password: '',
            isAdmin: userData.isAdmin,
            permissions: userData.permissions,
            firstName: userData.firstName,
            lastName: userData.lastName,
            avatarUrl: userData.avatarUrl,
        };
    },
    updateUser: async (updatedUser: User): Promise<User> => {
        // Update auth.users metadata
        const { data: authUserUpdate, error: authError } = await supabase.auth.admin.updateUserById(updatedUser.id, {
            email: updatedUser.username,
            password: updatedUser.password || undefined, // Only update if password is provided
            user_metadata: {
                isAdmin: updatedUser.isAdmin,
                permissions: updatedUser.permissions,
                first_name: updatedUser.firstName,
                last_name: updatedUser.lastName,
                avatar_url: updatedUser.avatarUrl,
            },
        });
        if (authError) throw authError;

        // Update public.profiles table
        const { data: profileUpdate, error: profileError } = await supabase.from('profiles').update({
            first_name: updatedUser.firstName,
            last_name: updatedUser.lastName,
            avatar_url: updatedUser.avatarUrl,
            updated_at: new Date().toISOString(),
        }).eq('id', updatedUser.id).select().single();
        if (profileError) throw profileError;

        return {
            id: authUserUpdate.user.id,
            username: authUserUpdate.user.email || '',
            password: '',
            isAdmin: updatedUser.isAdmin,
            permissions: updatedUser.permissions,
            firstName: profileUpdate.first_name,
            lastName: profileUpdate.last_name,
            avatarUrl: profileUpdate.avatar_url,
        };
    },
    deleteUser: async (userId: string): Promise<void> => {
        const { error } = await supabase.auth.admin.deleteUser(userId);
        if (error) throw error;
    },
    addInitialAdmin: async (): Promise<User> => {
        // This function is for the initial setup when no users exist.
        // It will create a user in Supabase Auth and trigger profile creation.
        const adminUser: Omit<User, 'id'> = {
            username: 'ahmed@example.com', // Use an email for Supabase Auth
            password: 'ahmed',
            isAdmin: true,
            permissions: {
                employees: { view: true, add: true, edit: true, delete: true, export: true, import: true, adjustBalance: true },
                leaves: { view: true, add: true, edit: true, delete: true, manageHolidayWork: true, manageOfficialHolidays: true, overrideBalance: true, overrideMedicalReport: true },
                reports: { view: true },
                settings: { view: true, manageCompany: true, manageLists: true, manageUsers: true, clearData: true },
            },
            firstName: 'Ahmed',
            lastName: 'Admin',
            avatarUrl: null,
        };
        return apiService.addUser(adminUser);
    },
    
    // --- Notifications (Per-user) ---
    getNotifications: async (userId: string): Promise<NotificationItem[]> => {
        const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('timestamp', { ascending: false });
        if (error) throw error;
        return data;
    },
    addNotification: async (userId: string, message: string, type: NotificationType): Promise<NotificationItem> => {
        const { data, error } = await supabase.from('notifications').insert({ user_id: userId, message, type, read: false }).select().single();
        if (error) throw error;
        return data;
    },
    markAllNotificationsAsRead: async (userId: string): Promise<void> => {
        const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
        if (error) throw error;
    },
    clearAllNotifications: async (userId: string): Promise<void> => {
        const { error } = await supabase.from('notifications').delete().eq('user_id', userId);
        if (error) throw error;
    },

    // --- Bulk Data Operations for Import/Export/Sync ---
    getAllDataForExport: async (userId: string): Promise<any> => {
        const [employees, leaves, departures, holidays, holidayWork, balanceAdjustments, nationalities, idTypes, companyInfo, users] = await Promise.all([
            apiService.getEmployees(userId), apiService.getLeaves(userId), apiService.getDepartures(userId), apiService.getHolidays(userId), apiService.getHolidayWork(userId),
            apiService.getBalanceAdjustments(userId), apiService.getNationalities(userId), apiService.getIdTypes(userId), apiService.getCompanyInfo(userId), apiService.getUsers() // Users are global for admin
        ]);
        return { employees, leaves, departures, holidays, holidayWork, balanceAdjustments, nationalities, idTypes, companyInfo, users };
    },
    importAllData: async (data: any, userId: string): Promise<void> => {
        // This is a complex operation for Supabase. For simplicity, we'll clear and re-insert.
        // In a production app, you'd want more sophisticated upsert/merge logic.
        const { employees, leaves, departures, holidays, holidayWork, balanceAdjustments, nationalities, idTypes, companyInfo } = data;

        // Clear existing data for the current user
        await Promise.all([
            supabase.from('employees').delete().eq('user_id', userId),
            supabase.from('leaves').delete().eq('user_id', userId),
            supabase.from('departures').delete().eq('user_id', userId),
            supabase.from('holidays').delete().eq('user_id', userId),
            supabase.from('holiday_work').delete().eq('user_id', userId),
            supabase.from('balance_adjustments').delete().eq('user_id', userId),
            supabase.from('nationalities').delete().eq('user_id', userId),
            supabase.from('id_types').delete().eq('user_id', userId),
            supabase.from('company_info').delete().eq('user_id', userId),
            supabase.from('notifications').delete().eq('user_id', userId),
        ]);

        // Re-insert data, ensuring user_id is set
        if (employees && employees.length > 0) {
            await supabase.from('employees').insert(employees.map((e: any) => ({ ...e, user_id: userId, date_of_birth: e.dateOfBirth, hire_date: e.hireDate, end_date: e.endDate, national_id: e.nationalId, social_security_number: e.socialSecurityNumber, id_type: e.idType, custom_annual_leave_days: e.customAnnualLeaveDays, initial_annual_balance: e.initialAnnualBalance, balance_set_date: e.balanceSetDate })));
        }
        if (leaves && leaves.length > 0) {
            await supabase.from('leaves').insert(leaves.map((l: any) => ({ ...l, user_id: userId, employee_id: l.employeeId, start_date: l.startDate, end_date: l.endDate, medical_report: l.medicalReport, days_taken: l.daysTaken })));
        }
        if (departures && departures.length > 0) {
            await supabase.from('departures').insert(departures.map((d: any) => ({ ...d, user_id: userId, employee_id: d.employeeId })));
        }
        if (holidays && holidays.length > 0) {
            await supabase.from('holidays').insert(holidays.map((h: any) => ({ ...h, user_id: userId })));
        }
        if (holidayWork && holidayWork.length > 0) {
            await supabase.from('holiday_work').insert(holidayWork.map((hw: any) => ({ ...hw, user_id: userId, employee_id: hw.employeeId })));
        }
        if (balanceAdjustments && balanceAdjustments.length > 0) {
            await supabase.from('balance_adjustments').insert(balanceAdjustments.map((adj: any) => ({ ...adj, user_id: userId, employee_id: adj.employeeId, leave_type: adj.leaveType, adjustment_days: adj.adjustmentDays })));
        }
        if (nationalities && nationalities.length > 0) {
            await supabase.from('nationalities').insert(nationalities.map((n: string) => ({ value: n, user_id: userId })));
        }
        if (idTypes && idTypes.length > 0) {
            await supabase.from('id_types').insert(idTypes.map((id: string) => ({ value: id, user_id: userId })));
        }
        if (companyInfo) {
            await supabase.from('company_info').insert({ ...companyInfo, user_id: userId, weekend_days: companyInfo.weekendDays });
        }
        // Notifications are not typically imported this way, they are generated by actions.

        return;
    },
    generateSyncCode: async (userId: string): Promise<string> => {
        const allData = await apiService.getAllDataForExport(userId);
        try {
            const jsonStr = JSON.stringify(allData);
            const compressed = pako.deflate(jsonStr, { to: 'string' });
            return btoa(compressed);
        } catch (e) {
            console.error("Error generating sync code:", e);
            return '';
        }
    },
    importFromSyncCode: async (base64Data: string, userId: string): Promise<boolean> => {
        try {
            const binaryStr = atob(base64Data);
            const len = binaryStr.length;
            const compressed = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                compressed[i] = binaryStr.charCodeAt(i);
            }
            const jsonStr = pako.inflate(compressed, { to: 'string' });
            const data = JSON.parse(jsonStr);
            await apiService.importAllData(data, userId);
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