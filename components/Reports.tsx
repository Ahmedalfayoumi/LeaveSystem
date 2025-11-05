import React, { useState, useRef } from 'react';
import { Employee, Leave, Departure, Holiday, HolidayWork, BalanceAdjustment, LeaveType, DepartureType } from '../types';
import { FileText, ArrowRight, FileSpreadsheet, ChevronLeft, Calendar } from 'lucide-react';
import { calculateAccruedLeave } from '../services/calculation';


// Declare external libs
declare const XLSX: any;

// Props interface
interface ReportsProps {
  employees: Employee[];
  leaves: Leave[];
  departures: Departure[];
  holidays: Holiday[];
  holidayWork: HolidayWork[];
  balanceAdjustments: BalanceAdjustment[];
  getEmployeeBalances: (employeeId: string) => any; // Note: This will be used less, direct calculation is preferred for reports
}

// Utility for formatting dates
const formatDateToDDMMYYYY = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
    const day = String(adjustedDate.getDate()).padStart(2, '0');
    const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
    const year = adjustedDate.getFullYear();
    return `${day}/${month}/${year}`;
};

const PeriodSelectionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (period: { start?: string; end: string }) => void;
  reportId: string | null;
}> = ({ isOpen, onClose, onGenerate, reportId }) => {
  if (!isOpen || !reportId) return null;

  const isAsOfReport = reportId === 'annual_balance_summary';
  const title = isAsOfReport ? 'تحديد تاريخ التقرير' : 'تحديد فترة التقرير';
  
  const [start, setStart] = useState('');
  const [end, setEnd] = useState(new Date().toISOString().split('T')[0]);

  const handleGenerateClick = () => {
    if (isAsOfReport) {
      if (!end) { alert('يرجى تحديد تاريخ التقرير.'); return; }
    } else {
      if (!start || !end) { alert('يرجى تحديد تاريخ البدء والانتهاء.'); return; }
      if (new Date(start) > new Date(end)) { alert('تاريخ البدء يجب أن يكون قبل تاريخ الانتهاء.'); return; }
    }
    onGenerate({ start: isAsOfReport ? undefined : start, end });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-6 text-gray-800 flex items-center">
            <Calendar className="w-6 h-6 ml-3 text-indigo-500" />
            {title}
          </h3>
          <div className="space-y-4">
            {!isAsOfReport && (
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">من تاريخ</label>
                <input
                  type="date"
                  id="startDate"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
            )}
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                {isAsOfReport ? 'تاريخ التقرير (حتى نهاية اليوم)' : 'إلى تاريخ'}
              </label>
              <input
                type="date"
                id="endDate"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
          </div>
        </div>
        <div className="bg-gray-100 p-4 flex justify-end items-center space-x-reverse space-x-3">
          <button
            onClick={handleGenerateClick}
            className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow"
          >
            إنشاء التقرير
          </button>
          <button type="button" onClick={onClose} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};


// The main component
const Reports: React.FC<ReportsProps> = (props) => {
  const [currentReport, setCurrentReport] = useState<{ id: string; title: string; headers: string[]; data: any[][] } | null>(null);
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [activeReport, setActiveReport] = useState<{ id: string; generator: (period: { start?: string; end: string }) => void; } | null>(null);
  const reportContentRef = useRef<HTMLDivElement>(null);


  const handleOpenPeriodModal = (report: { id: string; generator: (period: { start?: string; end: string }) => void; }) => {
    setActiveReport(report);
    setIsPeriodModalOpen(true);
  };
  
  const handleGenerateReport = (period: { start?: string; end: string }) => {
    if (activeReport) {
      activeReport.generator(period);
    }
    setIsPeriodModalOpen(false);
    setActiveReport(null);
  };

  // --- REPORT GENERATION LOGIC ---

  const generateAnnualBalanceReport = (period: { end: string }) => {
    const asOfDate = new Date(period.end);
    const headers = ['اسم الموظف', 'المستحق', 'المستخدم', 'بدل العطل', 'خصم المغادرات', 'تعديلات', 'الرصيد النهائي'];
    const data = props.employees.map(emp => {
      const accruedAnnual = calculateAccruedLeave(emp, asOfDate);
      
      const usedAnnual = props.leaves
          .filter(l => l.employeeId === emp.id && l.type === LeaveType.Annual && new Date(l.startDate) <= asOfDate)
          .reduce((sum, leave) => sum + leave.daysTaken, 0);

      const holidayCompensation = props.holidayWork
          .filter(hw => hw.employeeId === emp.id && new Date(hw.date) <= asOfDate)
          .length;

      const totalDepartureHours = props.departures
          .filter(d => d.employeeId === emp.id && new Date(d.date) <= asOfDate)
          .reduce((sum, dep) => sum + dep.hours, 0);
      const departureDeductions = Math.floor(totalDepartureHours / 8);

      const annualAdjustments = props.balanceAdjustments
          .filter(adj => adj.employeeId === emp.id && adj.leaveType === LeaveType.Annual && new Date(adj.date) <= asOfDate)
          .reduce((sum, adj) => sum + adj.adjustmentDays, 0);

      const finalBalance = accruedAnnual + holidayCompensation - usedAnnual - departureDeductions + annualAdjustments;

      return [
        emp.name,
        accruedAnnual.toFixed(2),
        usedAnnual,
        holidayCompensation,
        departureDeductions,
        annualAdjustments.toFixed(2),
        finalBalance.toFixed(2)
      ];
    });
    const title = `تقرير أرصدة الإجازات السنوية بتاريخ: ${formatDateToDDMMYYYY(period.end)}`;
    setCurrentReport({ id: 'annual_balance_summary', title, headers, data });
  };


  const generateFullActivityLog = (period: { start?: string; end: string }) => {
    if(!period.start) return;
    const headers = ['اسم الموظف', 'نوع الطلب', 'تاريخ البدء', 'تاريخ الانتهاء', 'المدة'];
    const employeeMap = new Map(props.employees.map(e => [e.id, e.name]));
    const combinedLog = [
      ...props.leaves.filter(l => l.startDate >= period.start! && l.startDate <= period.end).map(l => ({
        employeeName: employeeMap.get(l.employeeId) || 'غير معروف',
        type: l.type,
        startDate: formatDateToDDMMYYYY(l.startDate),
        endDate: formatDateToDDMMYYYY(l.endDate),
        duration: `${l.daysTaken} يوم`,
        sortDate: new Date(l.startDate),
      })),
      ...props.departures.filter(d => d.date >= period.start! && d.date <= period.end).map(d => ({
        employeeName: employeeMap.get(d.employeeId) || 'غير معروف',
        type: DepartureType.Departure,
        startDate: formatDateToDDMMYYYY(d.date),
        endDate: '-',
        duration: `${d.hours} ساعة`,
        sortDate: new Date(d.date),
      })),
    ].sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());
    
    const data = combinedLog.map(item => [item.employeeName, item.type, item.startDate, item.endDate, item.duration]);
    const title = `سجل الإجازات والمغادرات من ${formatDateToDDMMYYYY(period.start)} إلى ${formatDateToDDMMYYYY(period.end)}`;
    setCurrentReport({ id: 'full_activity_log', title, headers, data });
  };

  const generateSickLeaveSummary = (period: { start?: string; end:string }) => {
    if(!period.start) return;
    const headers = ['اسم الموظف', 'إجمالي أيام الإجازات المرضية'];
    const data = props.employees.map(emp => {
        const sickDays = props.leaves
            .filter(l => l.employeeId === emp.id && l.type === LeaveType.Sick && l.startDate >= period.start! && l.startDate <= period.end)
            .reduce((sum, l) => sum + l.daysTaken, 0);
        return [emp.name, sickDays];
    });
    const title = `ملخص الإجازات المرضية من ${formatDateToDDMMYYYY(period.start)} إلى ${formatDateToDDMMYYYY(period.end)}`;
    setCurrentReport({ id: 'sick_leave_summary', title, headers, data });
  };

  const generateHolidayWorkLog = (period: { start?: string; end: string }) => {
    if(!period.start) return;
    const headers = ['اسم الموظف', 'تاريخ العمل الإضافي', 'نوع اليوم'];
    const employeeMap = new Map(props.employees.map(e => [e.id, e.name]));
    const data = props.holidayWork
      .filter(hw => hw.date >= period.start! && hw.date <= period.end)
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(hw => [
        employeeMap.get(hw.employeeId) || 'غير معروف',
        formatDateToDDMMYYYY(hw.date),
        hw.type,
      ]);
    const title = `سجل بدل العطل والأعياد من ${formatDateToDDMMYYYY(period.start)} إلى ${formatDateToDDMMYYYY(period.end)}`;
    setCurrentReport({ id: 'holiday_work_log', title, headers, data });
  };

  const reportsList = [
    {
      id: 'annual_balance_summary',
      title: 'تقرير أرصدة الإجازات السنوية',
      description: 'عرض مفصل للرصيد السنوي لكل موظف، شامل المستحق، المستخدم، والبدلات بتاريخ محدد.',
      generator: () => handleOpenPeriodModal({ id: 'annual_balance_summary', generator: generateAnnualBalanceReport as any }),
    },
    {
      id: 'full_activity_log',
      title: 'سجل الإجازات والمغادرات الكامل',
      description: 'سجل تاريخي لجميع الإجازات والمغادرات لكافة الموظفين خلال فترة محددة.',
      generator: () => handleOpenPeriodModal({ id: 'full_activity_log', generator: generateFullActivityLog }),
    },
    {
      id: 'sick_leave_summary',
      title: 'تقرير ملخص الإجازات المرضية',
      description: 'ملخص لعدد أيام الإجازات المرضية المستخدمة لكل موظف خلال فترة محددة.',
      generator: () => handleOpenPeriodModal({ id: 'sick_leave_summary', generator: generateSickLeaveSummary }),
    },
    {
      id: 'holiday_work_log',
      title: 'سجل بدل العطل والأعياد',
      description: 'قائمة بأيام العمل خلال العطل التي تم تسجيلها كبدل خلال فترة محددة.',
      generator: () => handleOpenPeriodModal({ id: 'holiday_work_log', generator: generateHolidayWorkLog }),
    }
  ];

  // --- EXPORT LOGIC ---

  const handleExportToExcel = () => {
    if (!currentReport) return;
    const dataToExport = currentReport.data.map(row => {
        const obj: { [key: string]: any } = {};
        currentReport.headers.forEach((header, index) => {
            obj[header] = row[index];
        });
        return obj;
    });
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${currentReport.id}.xlsx`);
  };
  
  // --- RENDER LOGIC ---

  if (currentReport) {
    return (
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <button onClick={() => setCurrentReport(null)} className="flex items-center text-indigo-600 font-semibold hover:text-indigo-800">
            <ChevronLeft className="w-5 h-5 ml-2" />
            العودة إلى قائمة التقارير
          </button>
          <div className="flex items-center gap-3">
            <button onClick={handleExportToExcel} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
              <FileSpreadsheet className="w-5 h-5 ml-2" /> تصدير Excel
            </button>
          </div>
        </div>
        
        <div ref={reportContentRef} className="p-0 md:p-4 bg-white">
            <h2 className="text-xl md:text-2xl font-bold text-center text-gray-800 mb-2">{currentReport.title}</h2>
            <p className="text-center text-sm text-gray-500 mb-6">تاريخ الإنشاء: {new Date().toLocaleDateString('ar-EG')}</p>
            <div className="overflow-x-auto border rounded-lg hidden md:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    {currentReport.headers.map(header => (
                      <th key={header} className="px-6 py-3 text-right text-sm font-bold text-gray-600 uppercase tracking-wider">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentReport.data.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{cell}</td>
                      ))}
                    </tr>
                  ))}
                   {currentReport.data.length === 0 && (
                        <tr>
                            <td colSpan={currentReport.headers.length} className="text-center py-10 text-gray-500">
                                لا توجد بيانات لعرضها في الفترة المحددة.
                            </td>
                        </tr>
                    )}
                </tbody>
              </table>
            </div>
             <div className="md:hidden space-y-4">
                {currentReport.data.map((row, rowIndex) => (
                    <div key={rowIndex} className="bg-gray-50 p-4 rounded-lg shadow border">
                        {currentReport.headers.map((header, cellIndex) => (
                            <div key={cellIndex} className="flex justify-between text-sm py-1">
                                <span className="font-bold text-gray-700">{header}:</span>
                                <span className="text-gray-800">{row[cellIndex]}</span>
                            </div>
                        ))}
                    </div>
                ))}
                {currentReport.data.length === 0 && (
                    <p className="text-center py-10 text-gray-500">
                        لا توجد بيانات لعرضها في الفترة المحددة.
                    </p>
                )}
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 flex items-center">
        <FileText className="w-8 h-8 ml-3 text-indigo-500"/>
        مركز التقارير
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportsList.map(report => (
          <div key={report.id} className="border border-gray-200 rounded-lg p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{report.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{report.description}</p>
            </div>
            <button
              onClick={report.generator}
              className="self-end flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              إنشاء التقرير <ArrowRight className="w-5 h-5 mr-2" />
            </button>
          </div>
        ))}
      </div>
      <PeriodSelectionModal 
        isOpen={isPeriodModalOpen}
        onClose={() => setIsPeriodModalOpen(false)}
        onGenerate={handleGenerateReport}
        reportId={activeReport?.id || null}
      />
    </div>
  );
};

export default Reports;