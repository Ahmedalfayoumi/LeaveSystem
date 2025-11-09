import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../integrations/supabase/client';
import { ShieldCheck } from 'lucide-react';

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

export default LoginPage;