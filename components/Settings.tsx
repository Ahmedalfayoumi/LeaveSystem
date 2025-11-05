import React, { useState, ChangeEvent, useEffect, useRef } from 'react';
import { Plus, Trash2, Globe, Shield, Building2, Save, CalendarDays, AlertTriangle, Users, Edit, Database, Download, Upload, Link, Copy, Check, ClipboardPaste } from 'lucide-react';
import { CompanyInfo, User, UserPermissions, NotificationType } from '../types';

interface SettingsProps {
  nationalities: string[];
  idTypes: string[];
  companyInfo: CompanyInfo;
  setPage: (page: string) => void;
  currentUser: User;
  users: User[];
  importAllData: (data: any) => Promise<boolean>;
  exportAllData: () => void;
  generateSyncCode: () => string;
  onImportFromCode: (code: string) => void;
  addNotification: (message: string, type: NotificationType) => void;
  // New action props
  updateCompanyInfo: (info: CompanyInfo) => Promise<void>;
  updateNationalities: (nationalities: string[]) => Promise<void>;
  updateIdTypes: (idTypes: string[]) => Promise<void>;
  addUser: (user: User) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

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


const SyncCodeModal: React.FC<{
  onClose: () => void;
  syncCode: string;
}> = ({ onClose, syncCode }) => {
    const [copied, setCopied] = useState(false);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    const handleCopy = () => {
        if (textAreaRef.current) {
            textAreaRef.current.select();
            // Use modern clipboard API if available, with fallback
            if(navigator.clipboard) {
                navigator.clipboard.writeText(syncCode).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                });
            } else {
                document.execCommand('copy');
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">رمز المزامنة</h3>
                    <p className="text-gray-600 mb-4">
                        انسخ هذا الرمز. في جهازك الآخر، اذهب إلى <strong>الإعدادات &gt; إدارة البيانات والمزامنة</strong> والصق الرمز هناك لاستيراد بياناتك.
                    </p>
                    <textarea
                        ref={textAreaRef}
                        readOnly
                        value={syncCode}
                        className="w-full h-48 p-2 border rounded-md bg-gray-50 font-mono text-sm"
                        aria-label="رمز المزامنة"
                    />
                </div>
                <div className="bg-gray-100 p-4 flex justify-end space-x-reverse space-x-3">
                    <button
                        onClick={handleCopy}
                        className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        {copied ? <Check className="w-5 h-5 ml-2" /> : <Copy className="w-5 h-5 ml-2" />}
                        {copied ? 'تم النسخ!' : 'نسخ الرمز'}
                    </button>
                    <button type="button" onClick={onClose} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400">
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
};

const ImportCodeModal: React.FC<{
  onClose: () => void;
  onImport: (code: string) => void;
}> = ({ onClose, onImport }) => {
    const [code, setCode] = useState('');

    const handleImportClick = () => {
        if (!code.trim()) {
            alert('يرجى لصق رمز المزامنة.');
            return;
        }
        const confirmed = window.confirm(
            'تحذير: سيؤدي استيراد البيانات إلى الكتابة فوق جميع البيانات الحالية. هل أنت متأكد أنك تريد المتابعة؟'
        );
        if (confirmed) {
            onImport(code.trim());
            onClose(); // The App component will reload the page on success
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">استيراد باستخدام رمز المزامنة</h3>
                    <p className="text-gray-600 mb-4">
                        الصق رمز المزامنة الذي نسخته من جهازك الآخر في الحقل أدناه.
                    </p>
                    <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="w-full h-40 p-2 border rounded-md font-mono text-sm"
                        placeholder="الصق الرمز هنا..."
                        aria-label="حقل لصق رمز المزامنة"
                    />
                </div>
                <div className="bg-gray-100 p-4 flex justify-end space-x-reverse space-x-3">
                    <button
                        onClick={handleImportClick}
                        className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Upload className="w-5 h-5 ml-2" />
                        استيراد البيانات
                    </button>
                    <button type="button" onClick={onClose} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400">
                        إلغاء
                    </button>
                </div>
            </div>
        </div>
    );
};

const DataManagementSection: React.FC<{
    onImport: (data: any) => Promise<boolean>;
    onExport: () => void;
    onGenerateSyncCode: () => void;
    onImportFromCode: (code: string) => void;
}> = ({ onImport, onExport, onGenerateSyncCode, onImportFromCode }) => {
    const importInputRef = useRef<HTMLInputElement>(null);
    const [isImportCodeModalOpen, setIsImportCodeModalOpen] = useState(false);

    const handleImportClick = () => {
        importInputRef.current?.click();
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                const confirmed = window.confirm(
                    'تحذير: سيؤدي استيراد البيانات إلى الكتابة فوق جميع البيانات الحالية. هل أنت متأكد أنك تريد المتابعة؟'
                );
                if (confirmed) {
                    await onImport(data);
                }
            } catch (error) {
                alert('حدث خطأ أثناء قراءة الملف. يرجى التأكد من أنه ملف JSON صالح.');
                console.error("Import error:", error);
            } finally {
                if (importInputRef.current) {
                    importInputRef.current.value = '';
                }
            }
        };
        reader.readAsText(file);
    };

    return (
        <>
            <div className="bg-yellow-50 p-6 rounded-xl shadow-lg border border-yellow-200">
                <h3 className="text-xl font-bold text-yellow-800 mb-4 flex items-center">
                    <Database className="w-6 h-6 text-yellow-600" />
                    <span className="mr-3">إدارة البيانات والمزامنة</span>
                </h3>
                <p className="text-yellow-700 mb-4">
                   استخدم هذه الأدوات لمزامنة بياناتك بين الأجهزة أو لإنشاء نسخة احتياطية.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                        type="file"
                        accept=".json"
                        ref={importInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <button
                      onClick={onGenerateSyncCode}
                      className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Link className="w-5 h-5 ml-2" />
                      إنشاء رمز مزامنة
                    </button>
                    <button
                        onClick={() => setIsImportCodeModalOpen(true)}
                        className="flex items-center justify-center bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        <ClipboardPaste className="w-5 h-5 ml-2" />
                        لصق رمز مزامنة
                    </button>
                    <button
                        onClick={onExport}
                        className="flex items-center justify-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Download className="w-5 h-5 ml-2" />
                        حفظ البيانات في ملف
                    </button>
                     <button
                        onClick={handleImportClick}
                        className="flex items-center justify-center bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        <Upload className="w-5 h-5 ml-2" />
                        تحميل البيانات من ملف
                    </button>
                </div>
            </div>
            {isImportCodeModalOpen && (
                <ImportCodeModal
                    onClose={() => setIsImportCodeModalOpen(false)}
                    onImport={onImportFromCode}
                />
            )}
        </>
    );
};


const DangerZoneSection: React.FC = () => {
    const handleClearData = () => {
        const confirmed = window.confirm(
            'هل أنت متأكد؟ سيتم حذف جميع البيانات بشكل نهائي ولا يمكن التراجع عن هذا الإجراء.'
        );
        if (confirmed) {
            localStorage.clear();
            window.location.reload();
        }
    };

    return (
        <div className="bg-red-50 p-6 rounded-xl shadow-lg border border-red-200">
            <h3 className="text-xl font-bold text-red-800 mb-4 flex items-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <span className="mr-3">منطقة الخطر</span>
            </h3>
            <p className="text-red-700 mb-4">
                الإجراء التالي لا يمكن التراجع عنه. يرجى التأكد قبل المتابعة.
            </p>
            <button
                onClick={handleClearData}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
            >
                <Trash2 className="w-5 h-5 ml-2" />
                مسح جميع البيانات
            </button>
        </div>
    );
};

const UserManagement: React.FC<Pick<SettingsProps, 'users' | 'currentUser' | 'addUser' | 'updateUser' | 'deleteUser'>> = ({ users, currentUser, addUser, updateUser, deleteUser }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const openModal = (user: User | null = null) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleSave = (userToSave: User) => {
        if (editingUser) {
            updateUser(userToSave);
        } else {
            addUser(userToSave);
        }
        closeModal();
    };

    const handleDelete = (userId: string) => {
        if (userId === currentUser.id) {
            alert("لا يمكنك حذف حسابك الخاص.");
            return;
        }
        if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا المستخدم؟')) {
            deleteUser(userId);
        }
    };
    
    return (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                    <Users className="w-6 h-6 text-purple-600" />
                    <span className="mr-3">إدارة المستخدمين</span>
                </h3>
                <div className="flex items-center gap-2 self-end md:self-center">
                    <button onClick={() => openModal()} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                        <Plus className="w-5 h-5 ml-2" /> إضافة مستخدم
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto hidden md:block">
                <table className="min-w-full bg-white divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">اسم المستخدم</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الدور</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {users.map(user => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{user.username}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{user.isAdmin ? 'مدير' : 'مستخدم'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center space-x-reverse space-x-2">
                                        <button onClick={() => openModal(user)} className="text-yellow-600 hover:text-yellow-900" title="تعديل"><Edit /></button>
                                        <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-900" title="حذف"><Trash2 /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="md:hidden space-y-4">
                 {users.map(user => (
                    <div key={user.id} className="bg-gray-50 p-4 rounded-lg shadow border">
                        <div className="flex justify-between items-start">
                             <div>
                                <p className="font-bold text-lg">{user.username}</p>
                                <p className="text-sm text-indigo-600 font-semibold">{user.isAdmin ? 'مدير' : 'مستخدم'}</p>
                            </div>
                             <div className="flex items-center space-x-reverse space-x-2">
                                <button onClick={() => openModal(user)} className="text-yellow-600 p-1" title="تعديل"><Edit size={20} /></button>
                                <button onClick={() => handleDelete(user.id)} className="text-red-600 p-1" title="حذف"><Trash2 size={20} /></button>
                            </div>
                        </div>
                    </div>
                 ))}
            </div>
            {isModalOpen && <UserForm user={editingUser} onSave={handleSave} onClose={closeModal} allUsers={users} />}
        </div>
    );
}

const UserForm: React.FC<{ user: User | null; onSave: (user: User) => void; onClose: () => void; allUsers: User[] }> = ({ user, onSave, onClose, allUsers }) => {
    const [formData, setFormData] = useState<User>(user || {
        id: '',
        username: '',
        password: '',
        isAdmin: false,
        permissions: getDefaultPermissions(),
    });
    
    useEffect(() => {
        if(formData.isAdmin) {
            setFormData(prev => ({ ...prev, permissions: getAdminPermissions() }));
        }
    }, [formData.isAdmin]);

    const handlePermissionChange = (module: keyof UserPermissions, permission: keyof UserPermissions[keyof UserPermissions]) => {
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [module]: {
                    ...(prev.permissions as any)[module],
                    [permission]: !(prev.permissions as any)[module][permission]
                }
            }
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.username.trim() || !formData.password.trim()) {
            alert('اسم المستخدم وكلمة المرور مطلوبان.');
            return;
        }
        if (!user && allUsers.some(u => u.username === formData.username.trim())) {
             alert('اسم المستخدم موجود بالفعل.');
             return;
        }
        onSave(formData);
    };

    const permissionLabels: { [key in keyof UserPermissions]: { label: string, perms: { [key: string]: string } }} = {
        employees: {
            label: 'الموظفين',
            perms: {
                view: 'عرض',
                add: 'إضافة',
                edit: 'تعديل',
                delete: 'حذف',
                export: 'تصدير',
                import: 'استيراد',
                adjustBalance: 'تعديل الأرصدة'
            }
        },
        leaves: {
            label: 'الإجازات والعطلات',
            perms: {
                view: 'عرض السجل',
                add: 'إضافة طلبات',
                edit: 'تعديل الطلبات',
                delete: 'حذف الطلبات',
                manageHolidayWork: 'إدارة بدل العطل',
                manageOfficialHolidays: 'إدارة العطل الرسمية',
                overrideBalance: 'تجاوز الرصيد',
                overrideMedicalReport: 'تجاوز التقرير الطبي'
            }
        },
        reports: {
            label: 'التقارير',
            perms: {
                view: 'عرض التقارير',
            }
        },
        settings: {
            label: 'الإعدادات',
            perms: {
                view: 'عرض',
                manageCompany: 'إدارة الشركة',
                manageLists: 'إدارة القوائم',
                manageUsers: 'إدارة المستخدمين',
                clearData: 'مسح كل البيانات (خطر)'
            }
        },
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-xl font-semibold mb-6">{user ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                           <input type="text" placeholder="اسم المستخدم" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required className="block w-full rounded-md border-gray-300 shadow-sm" />
                           <input type="password" placeholder="كلمة المرور" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required className="block w-full rounded-md border-gray-300 shadow-sm" />
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-gray-100 rounded">
                            <input id="isAdmin" type="checkbox" checked={formData.isAdmin} onChange={e => setFormData({...formData, isAdmin: e.target.checked})} className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
                            <label htmlFor="isAdmin">منح صلاحيات مدير النظام</label>
                        </div>

                        {!formData.isAdmin && <div className="mt-6">
                            <h4 className="font-bold mb-2">الصلاحيات المخصصة:</h4>
                            <div className="space-y-4">
                                {Object.entries(permissionLabels).map(([module, {label, perms}]) => (
                                    <div key={module} className="p-3 border rounded-md">
                                        <h5 className="font-semibold">{label}</h5>
                                        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                                            {Object.entries(perms).map(([perm, permLabel]) => (
                                                <label key={perm} className="flex items-center gap-1.5 text-sm">
                                                    <input type="checkbox" checked={(formData.permissions as any)[module][perm]} onChange={() => handlePermissionChange(module as any, perm as any)} className="h-4 w-4 rounded border-gray-300" />
                                                    <span>{permLabel as string}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>}
                    </div>
                    <div className="bg-gray-100 p-4 flex justify-end space-x-reverse space-x-3">
                        <button type="button" onClick={onClose} className="bg-gray-300 px-4 py-2 rounded-md">إلغاء</button>
                        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md">حفظ</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Settings: React.FC<SettingsProps> = ({ nationalities, idTypes, companyInfo, setPage, currentUser, users, importAllData, exportAllData, generateSyncCode, onImportFromCode, updateCompanyInfo, updateNationalities, updateIdTypes, addUser, updateUser, deleteUser }) => {
  const [activeTab, setActiveTab] = useState('company');
  const [isSyncCodeModalOpen, setIsSyncCodeModalOpen] = useState(false);
  const [syncCode, setSyncCode] = useState('');

  const tabs = [
    { id: 'company', label: 'معلومات الشركة', permission: currentUser.permissions.settings.manageCompany },
    { id: 'lists', label: 'القوائم المنسدلة', permission: currentUser.permissions.settings.manageLists },
    { id: 'users', label: 'إدارة المستخدمين', permission: currentUser.permissions.settings.manageUsers },
    { id: 'data', label: 'إدارة البيانات والمزامنة', permission: currentUser.isAdmin },
    { id: 'danger', label: 'منطقة الخطر', permission: currentUser.permissions.settings.clearData },
  ];

  useEffect(() => {
    const currentTabInfo = tabs.find(t => t.id === activeTab);
    if (!currentTabInfo || !currentTabInfo.permission) {
        const firstPermittedTab = tabs.find(t => t.permission);
        if (firstPermittedTab) {
            setActiveTab(firstPermittedTab.id);
        }
    }
  }, [currentUser.permissions, activeTab]);
  
  const handleGenerateSyncCode = () => {
    const code = generateSyncCode();
    setSyncCode(code);
    setIsSyncCodeModalOpen(true);
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
        <aside className="md:w-1/4">
            <h2 className="text-2xl font-bold mb-4">الإعدادات</h2>
            <nav className="flex flex-row md:flex-col md:space-y-2 overflow-x-auto -mx-4 px-4 md:m-0 md:p-0">
                {tabs.filter(t => t.permission).map(tab => (
                     <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`text-right px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100'}`}
                     >
                        {tab.label}
                     </button>
                ))}
            </nav>
        </aside>
        <main className="flex-1 space-y-8">
            {activeTab === 'company' && currentUser.permissions.settings.manageCompany && <CompanyInfoSection companyInfo={companyInfo} setCompanyInfo={updateCompanyInfo} setPage={setPage} />}
            {activeTab === 'lists' && currentUser.permissions.settings.manageLists && <div className="grid grid-cols-1 gap-8">
                 <SettingSection 
                    title="الجنسيات" 
                    items={nationalities} 
                    setItems={updateNationalities}
                    icon={<Globe className="w-6 h-6 text-blue-600" />}
                />
                <SettingSection 
                    title="أنواع الهويات" 
                    items={idTypes} 
                    setItems={updateIdTypes}
                    icon={<Shield className="w-6 h-6 text-green-600" />}
                />
            </div>}
            {activeTab === 'users' && currentUser.permissions.settings.manageUsers && <UserManagement users={users} currentUser={currentUser} addUser={addUser} updateUser={updateUser} deleteUser={deleteUser} />}
            {activeTab === 'data' && currentUser.isAdmin && <DataManagementSection onImport={importAllData} onExport={exportAllData} onGenerateSyncCode={handleGenerateSyncCode} onImportFromCode={onImportFromCode} />}
            {activeTab === 'danger' && currentUser.permissions.settings.clearData && <DangerZoneSection />}
        </main>
        {isSyncCodeModalOpen && (
            <SyncCodeModal 
                onClose={() => setIsSyncCodeModalOpen(false)} 
                syncCode={syncCode}
            />
        )}
    </div>
  );
};

const CompanyInfoSection: React.FC<{companyInfo: CompanyInfo; setCompanyInfo: (info: CompanyInfo) => void; setPage: (page:string) => void;}> = ({ companyInfo, setCompanyInfo, setPage }) => {
    const [formData, setFormData] = useState<CompanyInfo>(companyInfo);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            const file = files[0];
            const MAX_SIZE = 5 * 1024 * 1024; // 5MB
            const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

            if (!ALLOWED_TYPES.includes(file.type)) {
                alert('صيغة الملف غير مدعومة. يرجى اختيار ملف بصيغة JPG أو PNG.');
                return;
            }

            if (file.size > MAX_SIZE) {
                alert('حجم الملف كبير جداً. الحد الأقصى المسموح به هو 5 ميجابايت.');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, [name]: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleRemoveImage = (fieldName: 'logo' | 'seal') => {
        setFormData(prev => ({ ...prev, [fieldName]: null }));
    };

    const handleWeekendChange = (dayIndex: number) => {
        setFormData(prev => {
            const weekendDays = prev.weekendDays.includes(dayIndex)
                ? prev.weekendDays.filter(d => d !== dayIndex)
                : [...prev.weekendDays, dayIndex];
            return { ...prev, weekendDays };
        });
    };

    const handleSave = () => {
        setCompanyInfo(formData);
        alert('تم حفظ معلومات الشركة بنجاح!');
        setPage('dashboard');
    };

    const renderImageUploader = (name: 'logo' | 'seal', label: string) => (
        <div>
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <div className="mt-1 flex items-center gap-4">
                <div className="w-24 h-24 bg-gray-100 rounded-md flex items-center justify-center border">
                    {formData[name] ? (
                        <img src={formData[name] as string} alt={label} className="w-full h-full object-contain rounded-md" />
                    ) : (
                        <Upload className="w-8 h-8 text-gray-400" />
                    )}
                </div>
                <div className="flex flex-col gap-2">
                    <input
                        type="file"
                        name={name}
                        id={`${name}-upload`}
                        accept=".jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <label htmlFor={`${name}-upload`} className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        تغيير
                    </label>
                    {formData[name] && (
                        <button type="button" onClick={() => handleRemoveImage(name)} className="text-red-600 text-sm hover:underline">إزالة</button>
                    )}
                </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">.JPG, .PNG بحد أقصى 5MB</p>
        </div>
    );
    
    const daysOfWeek = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <Building2 className="w-6 h-6 text-indigo-600" />
                <span className="mr-3">معلومات الشركة</span>
            </h3>
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" name="name" placeholder="اسم الشركة" value={formData.name} onChange={handleInputChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                    <input type="text" name="address" placeholder="عنوان الشركة" value={formData.address} onChange={handleInputChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                    <input type="tel" name="phone" placeholder="رقم الهاتف" value={formData.phone} onChange={handleInputChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                    <input type="email" name="email" placeholder="البريد الإلكتروني" value={formData.email} onChange={handleInputChange} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                   {renderImageUploader('logo', 'شعار الشركة')}
                   {renderImageUploader('seal', 'ختم الشركة')}
                </div>
                 <div className="pt-4">
                    <h4 className="text-md font-bold text-gray-700 mb-2 flex items-center">
                        <CalendarDays className="w-5 h-5 text-gray-500" />
                        <span className="mr-2">إعدادات العطلة الأسبوعية</span>
                    </h4>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 p-3 bg-gray-50 rounded-lg border">
                        {daysOfWeek.map((day, index) => (
                            <label key={index} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.weekendDays.includes(index)}
                                    onChange={() => handleWeekendChange(index)}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-sm font-medium text-gray-700">{day}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
             <div className="flex justify-end mt-6">
                <button onClick={handleSave} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                    <Save className="w-5 h-5 ml-2" />
                    حفظ التغييرات
                </button>
            </div>
        </div>
    );
};


interface SettingSectionProps {
  title: string;
  items: string[];
  setItems: (items: string[]) => void;
  icon: React.ReactNode;
}

const SettingSection: React.FC<SettingSectionProps> = ({ title, items, setItems, icon }) => {
  const [newItem, setNewItem] = useState('');

  const handleAddItem = () => {
    if (newItem && !items.includes(newItem)) {
      setItems([...items, newItem]);
      setNewItem('');
    }
  };

  const handleRemoveItem = (itemToRemove: string) => {
    setItems(items.filter(item => item !== itemToRemove));
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        {icon}
        <span className="mr-3">{title}</span>
      </h3>
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          className="flex-grow mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder={`إضافة ${title.slice(0, -1)} جديدة...`}
        />
        <button onClick={handleAddItem} className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors">
          <Plus className="w-5 h-5" />
        </button>
      </div>
      <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {items.map((item, index) => (
          <li key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded-md">
            <span>{item}</span>
            <button onClick={() => handleRemoveItem(item)} className="text-red-500 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Settings;
