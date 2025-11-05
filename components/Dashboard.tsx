import React from 'react';
import { Employee, Leave, Departure, Holiday, EmployeeStatus, LeaveType, DepartureType } from '../types';
import { Users, CalendarCheck, Briefcase, PartyPopper, Plane, BedDouble, List, Bell } from 'lucide-react';

interface DashboardProps {
  employees: Employee[];
  leaves: Leave[];
  departures: Departure[];
  holidays: Holiday[];
}

const formatDateToDDMMYYYY = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
    
    const day = String(adjustedDate.getDate()).padStart(2, '0');
    const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
    const year = adjustedDate.getFullYear();
    return `${day}/${month}/${year}`;
};

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4 space-x-reverse">
        <div className="bg-indigo-100 p-3 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ employees, leaves, departures, holidays }) => {
    const activeEmployees = employees.filter(e => e.status === EmployeeStatus.Active).length;

    const todayStr = new Date().toISOString().split('T')[0];
    const onLeaveToday = leaves.filter(l => 
        l.status === 'approved' && 
        todayStr >= l.startDate && 
        todayStr <= l.endDate
    ).length;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const upcomingHolidaysThisMonth = holidays.filter(h => {
        const hDate = new Date(h.date);
        return hDate.getFullYear() === currentYear && hDate.getMonth() === currentMonth && hDate >= now;
    }).length;

    const upcomingHolidaysList = holidays
        .filter(h => new Date(h.date) >= new Date(todayStr))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 4);
    
    const employeeMap = new Map(employees.map(e => [e.id, e.name]));
    
    const allActivities = [
        ...leaves.map(l => ({ ...l, activityType: l.type, date: l.startDate })),
        ...departures.map(d => ({ ...d, activityType: DepartureType.Departure, date: d.date }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
     .slice(0, 5);
     
    const getActivityIcon = (type: LeaveType | DepartureType) => {
        switch(type) {
            case LeaveType.Annual: return <Briefcase className="w-5 h-5 text-blue-500" />;
            case LeaveType.Sick: return <BedDouble className="w-5 h-5 text-orange-500" />;
            case DepartureType.Departure: return <Plane className="w-5 h-5 text-green-500" />;
            default: return null;
        }
    };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const upcomingLeaves = leaves
        .filter(l => {
            const startDate = new Date(l.startDate);
            return (
                l.status === 'approved' &&
                startDate >= today &&
                startDate <= sevenDaysFromNow
            );
        })
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        .slice(0, 5); // Show top 5 upcoming leaves

    const upcomingHolidayNotifications = holidays
      .filter(h => {
        const parts = h.date.split('-').map(p => parseInt(p, 10));
        const holidayLocalDate = new Date(parts[0], parts[1] - 1, parts[2]);
        return holidayLocalDate >= today && holidayLocalDate <= sevenDaysFromNow;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <div className="space-y-8">
            {upcomingHolidayNotifications.length > 0 && (
              <div className="bg-yellow-50 border-r-4 border-yellow-400 p-4 rounded-md shadow">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <PartyPopper className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div className="mr-3 flex-1">
                    <p className="text-sm font-bold text-yellow-800">
                      تذكير بالعطلات الرسمية القادمة
                    </p>
                    <div className="mt-2 text-sm text-yellow-700">
                      <ul className="list-none space-y-1">
                        {upcomingHolidayNotifications.map(holiday => (
                          <li key={holiday.id}>
                            <span className="font-semibold">{holiday.name}</span>: {formatDateToDDMMYYYY(holiday.date)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <h1 className="text-3xl font-bold text-gray-800">لوحة التحكم</h1>
            
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="إجمالي الموظفين النشطين" value={activeEmployees} icon={<Users className="w-6 h-6 text-indigo-600" />} />
                <StatCard title="موظفون في إجازة اليوم" value={onLeaveToday} icon={<CalendarCheck className="w-6 h-6 text-indigo-600" />} />
                <StatCard title="العطلات القادمة هذا الشهر" value={upcomingHolidaysThisMonth} icon={<PartyPopper className="w-6 h-6 text-indigo-600" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upcoming Leaves Notifications */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <Bell className="w-5 h-5 text-red-500 ml-2" />
                        إشعارات الإجازات القادمة
                    </h2>
                    <ul className="space-y-3">
                        {upcomingLeaves.length > 0 ? upcomingLeaves.map(leave => (
                            <li key={leave.id} className="flex items-start space-x-3 space-x-reverse p-2 hover:bg-gray-50 rounded-md">
                                <div className="p-2 bg-gray-100 rounded-full">
                                    <CalendarCheck className="w-5 h-5 text-gray-600" />
                                </div>
                                <div className="flex-grow">
                                    <p className="font-semibold text-sm text-gray-800">
                                        {employeeMap.get(leave.employeeId) || 'موظف غير معروف'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        إجازة {leave.type} تبدأ من {formatDateToDDMMYYYY(leave.startDate)} إلى {formatDateToDDMMYYYY(leave.endDate)}
                                    </p>
                                </div>
                            </li>
                        )) : (
                            <p className="text-gray-500 text-center py-4">لا توجد إجازات قادمة خلال الـ 7 أيام القادمة.</p>
                        )}
                    </ul>
                </div>
                {/* Upcoming Holidays */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><PartyPopper className="w-5 h-5 text-yellow-500 ml-2" />العطلات الرسمية القادمة</h2>
                    <ul className="space-y-4">
                        {upcomingHolidaysList.length > 0 ? upcomingHolidaysList.map(holiday => (
                            <li key={holiday.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="font-semibold text-gray-700">{holiday.name}</span>
                                <span className="text-sm text-gray-500">{formatDateToDDMMYYYY(holiday.date)}</span>
                            </li>
                        )) : (
                            <p className="text-gray-500">لا توجد عطلات قادمة مسجلة.</p>
                        )}
                    </ul>
                </div>

                {/* Recent Activity */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><List className="w-5 h-5 text-purple-500 ml-2" />آخر النشاطات</h2>
                    <ul className="space-y-3">
                         {allActivities.length > 0 ? allActivities.map(activity => (
                             <li key={activity.id} className="flex items-center space-x-3 space-x-reverse p-2 hover:bg-gray-50 rounded-md">
                                 <div className="p-2 bg-gray-100 rounded-full">{getActivityIcon(activity.activityType as any)}</div>
                                 <div className="flex-grow">
                                     <p className="font-semibold text-sm text-gray-800">
                                         {employeeMap.get(activity.employeeId) || 'موظف غير معروف'}
                                     </p>
                                     <p className="text-xs text-gray-500">
                                        طلب {activity.activityType}
                                        {activity.activityType !== DepartureType.Departure 
                                            ? ` من ${formatDateToDDMMYYYY((activity as Leave).startDate)} إلى ${formatDateToDDMMYYYY((activity as Leave).endDate)}`
                                            : ` بتاريخ ${formatDateToDDMMYYYY((activity as Departure).date)}`}
                                     </p>
                                 </div>
                             </li>
                         )) : (
                             <p className="text-gray-500">لا توجد نشاطات حديثة.</p>
                         )}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;