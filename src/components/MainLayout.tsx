import React, { useState, useEffect, useRef } from 'react';
import { Building2, LayoutDashboard, Users, CalendarDays, FileText, Settings as SettingsIcon, LogOut, X, Menu, Bell, Trash2, ShieldCheck } from 'lucide-react';
import { User, NotificationItem, NotificationType } from '../../types';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../integrations/supabase/client';

interface HeaderProps {
    activePage: string;
    setPage: (page: string) => void;
    handleLogout: () => void;
    currentUser: User | null;
    notifications: NotificationItem[];
    markAllAsRead: () => void;
    clearAllNotifications: () => void;
}

const Header: React.FC<HeaderProps> = ({ activePage, setPage, handleLogout, currentUser, notifications, markAllAsRead, clearAllNotifications }) => {
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
                                            {notifications.length > 0 && <button onClick={clearAllNotifications} className="text-sm text-red-600 hover:underline flex items-center gap-1"><Trash2 size={14} /> مسح الكل</button>}
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
                        للتسجيل، استخدم أي اسم مستخدم وكلمة مرور. سيتم إنشاء حسابك تلقائيًا.
                        <br />
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
                                email_label: 'اسم المستخدم',
                                password_label: 'كلمة المرور',
                                email_input_placeholder: 'أدخل اسم المستخدم',
                                password_input_placeholder: 'أدخل كلمة المرور',
                                button_label: 'تسجيل الدخول',
                                social_provider_text: 'أو سجل الدخول باستخدام',
                                link_text: 'هل لديك حساب بالفعل؟ سجل الدخول',
                            },
                            sign_up: {
                                email_label: 'اسم المستخدم',
                                password_label: 'كلمة المرور',
                                email_input_placeholder: 'أدخل اسم المستخدم',
                                password_input_placeholder: 'أدخل كلمة المرور',
                                button_label: 'إنشاء حساب',
                                social_provider_text: 'أو سجل باستخدام',
                                link_text: 'ليس لديك حساب؟ أنشئ واحدًا',
                            },
                            forgotten_password: {
                                email_label: 'اسم المستخدم',
                                password_label: 'كلمة المرور الجديدة',
                                email_input_placeholder: 'أدخل اسم المستخدم',
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

interface MainLayoutProps {
    children: React.ReactNode;
    activePage: string;
    setPage: (page: string) => void;
    handleLogout: () => void;
    currentUser: User | null;
    notifications: NotificationItem[];
    markAllAsRead: () => void;
    clearAllNotifications: () => void;
    isSessionLoading: boolean;
    isDataLoading: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
    children,
    activePage,
    setPage,
    handleLogout,
    currentUser,
    notifications,
    markAllAsRead,
    clearAllNotifications,
    isSessionLoading,
    isDataLoading,
}) => {
    if (isSessionLoading || isDataLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (!currentUser) {
        return <LoginPage />;
    }

    return (
        <div className="bg-gray-50 min-h-screen text-gray-900">
            <Header
                activePage={activePage}
                setPage={setPage}
                handleLogout={handleLogout}
                currentUser={currentUser}
                notifications={notifications}
                markAllAsRead={markAllAsRead}
                clearAllNotifications={clearAllNotifications}
            />
            <main className="container mx-auto p-4 sm:p-6 lg:p-8 mt-20">
                {children}
            </main>
        </div>
    );
};