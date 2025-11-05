import React, { useState, ChangeEvent, useRef, useEffect } from 'react';
import { Employee, Leave, Departure, Holiday, LeaveType, DepartureType, HolidayWork, HolidayWorkType, CompanyInfo, UserPermissions, User, NotificationType } from '../types';
import { calculateLeaveDuration } from '../services/calculation';
import { FileUp, CalendarPlus, PlaneTakeoff, Plus, Trash2, Printer, Download, Award, Edit, List, X, Eye } from 'lucide-react';

// Define jsPDF, html2canvas, and XLSX from window
declare const jspdf: any;
declare const html2canvas: any;
declare const XLSX: any;

interface LeaveHolidayManagementProps {
  employees: Employee[];
  leaves: Leave[];
  setLeaves: React.Dispatch<React.SetStateAction<Leave[]>>;
  departures: Departure[];
  setDepartures: React.Dispatch<React.SetStateAction<Departure[]>>;
  holidays: Holiday[];
  setHolidays: React.Dispatch<React.SetStateAction<Holiday[]>>;
  holidayWork: HolidayWork[];
  setHolidayWork: React.Dispatch<React.SetStateAction<HolidayWork[]>>;
  getEmployeeBalances: (employeeId: string) => { annual: number; sick: number; departures: { monthly: number; totalForDeduction: number; } };
  companyInfo: CompanyInfo;
  permissions: UserPermissions['leaves'];
  currentUser: User;
  addNotification: (message: string, type: NotificationType) => void;
}

const formatDateToDDMMYYYY = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    // Add timezone offset to prevent date from shifting
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
    
    const day = String(adjustedDate.getDate()).padStart(2, '0');
    const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
    const year = adjustedDate.getFullYear();
    return `${day}/${month}/${year}`;
};

const LeaveHolidayManagement: React.FC<LeaveHolidayManagementProps> = ({ 
    employees, leaves, setLeaves, departures, setDepartures, holidays, setHolidays, holidayWork, setHolidayWork, getEmployeeBalances, companyInfo, permissions, currentUser, addNotification
}) => {
  const [activeTab, setActiveTab] = useState('leaveRequest');

  const tabs = [
    { id: 'leaveRequest', label: 'تقديم ومتابعة الطلبات' },
    { id: 'holidayWork', label: 'بدل العطل والأعياد' },
    { id: 'holidayMgmt', label: 'إدارة العطلات الرسمية' },
  ];

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-reverse space-x-6 overflow-x-auto" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'leaveRequest' && 
        <LeaveRequestForm 
            employees={employees} 
            leaves={leaves}
            setLeaves={setLeaves} 
            departures={departures}
            setDepartures={setDepartures} 
            holidays={holidays} 
            getEmployeeBalances={getEmployeeBalances} 
            companyInfo={companyInfo} 
            permissions={permissions}
            currentUser={currentUser}
            addNotification={addNotification}
        />
      }
      {activeTab === 'holidayWork' && <HolidayWorkForm employees={employees} holidays={holidays} holidayWork={holidayWork} setHolidayWork={setHolidayWork} weekendDays={companyInfo.weekendDays} permissions={permissions} addNotification={addNotification} />}
      {activeTab === 'holidayMgmt' && <HolidayManagement holidays={holidays} setHolidays={setHolidays} permissions={permissions} addNotification={addNotification} />}
    </div>
  );
};

const RequestActionModal: React.FC<{
    requestData: { request: Leave | Departure; employeeName: string; type: 'Leave' | 'Departure' };
    onClose: () => void;
}> = ({ requestData, onClose }) => {
    const printRef = useRef<HTMLDivElement>(null);
    const { request, employeeName, type } = requestData;
    const isLeave = type === 'Leave';
    const leaveRequest = isLeave ? (request as Leave) : null;
    const departureRequest = !isLeave ? (request as Departure) : null;

    const handlePrint = () => {
        if (!printRef.current) return;
        const printWindow = window.open('', '', 'height=600,width=800');
        if (printWindow) {
            printWindow.document.write('<html><head><title>طباعة الطلب</title>');
            printWindow.document.write(`
                <style>
                  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
                  body { font-family: 'Cairo', sans-serif; direction: rtl; margin: 2rem; color: #333; }
                  .container { border: 1px solid #e2e8f0; padding: 2.5rem; border-radius: 0.5rem; }
                  h1 { font-size: 1.875rem; font-weight: 700; text-align: center; margin-bottom: 2rem; }
                  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem; }
                  .field { margin-bottom: 1rem; }
                  .field label { display: block; color: #6b7280; font-size: 0.875rem; margin-bottom: 0.5rem; }
                  .field span { display: block; font-weight: 600; font-size: 1rem; padding: 0.5rem; background-color: #f9fafb; border-radius: 0.25rem;}
                  .signatures { margin-top: 5rem; display: flex; justify-content: space-around; }
                  .sig-box { text-align: center; }
                  .sig-box p { margin-bottom: 3rem; }
                </style>
            `);
            printWindow.document.write('</head><body>');
            printWindow.document.write(printRef.current.innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        }
    };

    const handleDownloadPdf = () => {
        if (printRef.current) {
            const { jsPDF } = jspdf;
            html2canvas(printRef.current, { scale: 3, backgroundColor: '#ffffff', useCORS: true, letterRendering: true }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const margin = 15;

                const contentImgWidth = pdfWidth - margin * 2;
                const contentImgHeight = (canvas.height * contentImgWidth) / canvas.width;
                
                const footerHeight = 19; // Space for footer
                let finalImgHeight = contentImgHeight;

                // Check if content fits with footer. If not, scale it down.
                if (contentImgHeight > pdfHeight - margin * 2 - footerHeight) {
                    finalImgHeight = pdfHeight - margin * 2 - footerHeight;
                }

                pdf.addImage(imgData, 'PNG', margin, margin, contentImgWidth, finalImgHeight);
                
                // Footer
                const footerY = pdfHeight - 10;
                pdf.setFontSize(9);
                const centerText = "Powered by Extreme Precision";
                pdf.text(centerText, pdfWidth / 2, footerY, { align: 'center' });
                const pageNumText = `Page 1 of 1`;
                pdf.text(pageNumText, pdfWidth - margin, footerY, { align: 'right' });

                pdf.save(`طلب-${isLeave ? 'إجازة' : 'مغادرة'}-${employeeName}.pdf`);
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="p-4 md:p-8">
                    <div ref={printRef} className="container p-4 md:p-10 bg-white">
                        <h1 className="text-xl md:text-3xl font-bold text-center mb-8">
                            نموذج طلب {isLeave ? 'إجازة' : 'مغادرة'}
                        </h1>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-8">
                            <div className="field">
                                <label className="text-sm text-gray-600">اسم الموظف</label>
                                <span className="font-semibold text-lg bg-gray-50 p-2 rounded">{employeeName}</span>
                            </div>
                            <div className="field">
                                <label className="text-sm text-gray-600">نوع الطلب</label>
                                <span className="font-semibold text-lg bg-gray-50 p-2 rounded">{isLeave ? leaveRequest?.type : 'مغادرة'}</span>
                            </div>
                            {isLeave ? (
                                <>
                                    <div className="field">
                                        <label className="text-sm text-gray-600">تاريخ البدء</label>
                                        <span className="font-semibold text-lg bg-gray-50 p-2 rounded">{formatDateToDDMMYYYY(leaveRequest!.startDate)}</span>
                                    </div>
                                    <div className="field">
                                        <label className="text-sm text-gray-600">تاريخ الانتهاء</label>
                                        <span className="font-semibold text-lg bg-gray-50 p-2 rounded">{formatDateToDDMMYYYY(leaveRequest!.endDate)}</span>
                                    </div>
                                    <div className="field">
                                        <label className="text-sm text-gray-600">عدد الأيام</label>
                                        <span className="font-semibold text-lg bg-gray-50 p-2 rounded">{leaveRequest!.daysTaken}</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="field">
                                        <label className="text-sm text-gray-600">تاريخ المغادرة</label>
                                        <span className="font-semibold text-lg bg-gray-50 p-2 rounded">{formatDateToDDMMYYYY(departureRequest!.date)}</span>
                                    </div>
                                    <div className="field">
                                        <label className="text-sm text-gray-600">عدد الساعات</label>
                                        <span className="font-semibold text-lg bg-gray-50 p-2 rounded">{departureRequest!.hours}</span>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="signatures mt-20 flex flex-col md:flex-row justify-around gap-8 md:gap-0">
                            <div className="sig-box">
                                <p>توقيع الموظف</p>
                                <span>...................................</span>
                            </div>
                            <div className="sig-box">
                                <p>موافقة المدير المباشر</p>
                                <span>...................................</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-100 p-4 flex justify-end space-x-reverse space-x-3 border-t">
                    <button onClick={handleDownloadPdf} className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                        <Download className="w-5 h-5 ml-2" /> تحميل PDF
                    </button>
                    <button onClick={handlePrint} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        <Printer className="w-5 h-5 ml-2" /> طباعة
                    </button>
                    <button onClick={onClose} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors">
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
};

interface LeaveRequestFormProps {
    employees: Employee[];
    leaves: Leave[];
    setLeaves: React.Dispatch<React.SetStateAction<Leave[]>>;
    departures: Departure[];
    setDepartures: React.Dispatch<React.SetStateAction<Departure[]>>;
    holidays: Holiday[];
    getEmployeeBalances: (employeeId: string) => any;
    companyInfo: CompanyInfo;
    permissions: UserPermissions['leaves'];
    currentUser: User;
    addNotification: (message: string, type: NotificationType) => void;
}

const LeaveRequestForm: React.FC<LeaveRequestFormProps> = ({ employees, leaves, setLeaves, departures, setDepartures, holidays, getEmployeeBalances, companyInfo, permissions, currentUser, addNotification }) => {
    const [requestType, setRequestType] = useState<LeaveType | DepartureType>(LeaveType.Annual);
    const [employeeId, setEmployeeId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [date, setDate] = useState(''); // for departures
    const [hours, setHours] = useState<number>(1);
    const [medicalReport, setMedicalReport] = useState<File | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [lastRequest, setLastRequest] = useState<{ request: Leave | Departure; employeeName: string; type: 'Leave' | 'Departure' } | null>(null);
    const [editingRequest, setEditingRequest] = useState<(Leave & { reqType: 'leave' }) | (Departure & { reqType: 'departure' }) | null>(null);
    const [currentBalances, setCurrentBalances] = useState<{ annual: number; sick: number } | null>(null);
    const [requestToView, setRequestToView] = useState<{ request: Leave | Departure; employeeName: string; type: 'Leave' | 'Departure' } | null>(null);
    
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (employeeId) {
            const balances = getEmployeeBalances(employeeId);
            setCurrentBalances(balances);
        } else {
            setCurrentBalances(null);
        }
    }, [employeeId, getEmployeeBalances]);

    const resetForm = () => {
        setRequestType(LeaveType.Annual);
        setEmployeeId('');
        setStartDate('');
        setEndDate('');
        setDate('');
        setHours(1);
        setMedicalReport(null);
        setShowConfirmation(false);
        setLastRequest(null);
        setEditingRequest(null);
        setCurrentBalances(null);
    };
    
    useEffect(() => {
        if (editingRequest) {
            setEmployeeId(editingRequest.employeeId);
            if (editingRequest.reqType === 'leave') {
                setRequestType(editingRequest.type);
                setStartDate(editingRequest.startDate);
                setEndDate(editingRequest.endDate);
                setMedicalReport(null);
            } else {
                setRequestType(DepartureType.Departure);
                setDate(editingRequest.date);
                setHours(editingRequest.hours);
            }
            formRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [editingRequest]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setMedicalReport(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!employeeId) {
            alert('يرجى اختيار الموظف');
            return;
        }

        const employee = employees.find(emp => emp.id === employeeId);
        if (!employee) return;

        const balances = getEmployeeBalances(employeeId);

        if (requestType === DepartureType.Departure) {
            if (hours > 4) { alert('الحد الأقصى للمغادرة 4 ساعات'); return; }
            if (hours > balances.departures.monthly && !editingRequest) { alert('رصيد المغادرات الشهري لا يسمح'); return; }

            const departureData: Departure = {
                id: editingRequest ? editingRequest.id : new Date().toISOString(),
                employeeId,
                date,
                hours,
                status: 'approved',
            };
            if (editingRequest) {
                setDepartures(prev => prev.map(d => d.id === editingRequest.id ? departureData : d));
                addNotification(`تم تعديل طلب مغادرة للموظف ${employee.name}.`, 'departure');
            } else {
                setDepartures(prev => [...prev, departureData]);
                setLastRequest({ request: departureData, employeeName: employee.name, type: 'Departure' });
                setRequestToView({ request: departureData, employeeName: employee.name, type: 'Departure' });
                addNotification(`تم تسجيل طلب مغادرة جديد للموظف ${employee.name}.`, 'departure');
            }

        } else { // Annual or Sick Leave
            const daysTaken = calculateLeaveDuration(startDate, endDate, holidays, companyInfo.weekendDays, requestType as LeaveType);
            
            if (daysTaken <= 0) {
                 alert('تاريخ النهاية يجب أن يكون بعد تاريخ البداية.'); return;
            }

            if (requestType === LeaveType.Annual) {
                if (daysTaken < 2 && !editingRequest) {
                    alert('الحد الأدنى للإجازة السنوية هو يومان'); return;
                }
                if (daysTaken > balances.annual && !editingRequest) {
                    if (!permissions.overrideBalance) {
                        alert(`الرصيد لا يكفي لهذه الإجازة. الرصيد المتبقي: ${balances.annual.toFixed(2)} يوم.`);
                        return;
                    } else {
                        if (!window.confirm(`رصيد الموظف غير كافٍ (${balances.annual.toFixed(2)} يوم). هل ترغب في المتابعة كمسؤول نظام ومنح الإجازة؟`)) {
                            return;
                        }
                    }
                }
            }
            
            if (requestType === LeaveType.Sick) {
                if (daysTaken > balances.sick && !editingRequest) {
                    alert(`رصيد الإجازات المرضية لا يكفي. الرصيد المتبقي: ${balances.sick} يوم.`); return;
                }
                
                if (!medicalReport && !editingRequest) { // No report attached and it's a new request
                    if (permissions.overrideMedicalReport) {
                        // For authorized users, show a confirmation dialog
                        if (!window.confirm('لم يتم إرفاق تقرير طبي. هل ترغب في المتابعة وتجاوز هذا الشرط؟')) {
                            return; // Stop if user cancels
                        }
                    } else {
                        // For regular users, it's mandatory
                        alert('يجب إرفاق تقرير طبي للإجازة المرضية.'); 
                        return;
                    }
                }
            }

            let reportData;
            if (medicalReport) {
                const reader = new FileReader();
                const promise = new Promise<{ name: string, content: string }>((resolve) => {
                    reader.onload = (event) => {
                        resolve({ name: medicalReport.name, content: event.target?.result as string });
                    };
                    reader.readAsDataURL(medicalReport);
                });
                reportData = await promise;
            } else if (editingRequest?.reqType === 'leave') {
                reportData = editingRequest.medicalReport;
            }

            const leaveData: Leave = {
                id: editingRequest ? editingRequest.id : new Date().toISOString(),
                employeeId,
                type: requestType,
                startDate,
                endDate,
                medicalReport: reportData,
                status: 'approved',
                daysTaken
            };
            
            if (editingRequest) {
                setLeaves(prev => prev.map(l => l.id === editingRequest.id ? leaveData : l));
                 addNotification(`تم تعديل طلب إجازة ${requestType} للموظف ${employee.name}.`, 'leave');
            } else {
                setLeaves(prev => [...prev, leaveData]);
                setLastRequest({ request: leaveData, employeeName: employee.name, type: 'Leave' });
                setRequestToView({ request: leaveData, employeeName: employee.name, type: 'Leave' });
                addNotification(`تم تسجيل طلب إجازة ${requestType} جديد للموظف ${employee.name}.`, 'leave');
            }
        }
        
        if (editingRequest) {
            resetForm();
        } else {
            const employeeIdToKeep = employeeId;
            const requestTypeToKeep = requestType;
            resetForm();
            setEmployeeId(employeeIdToKeep);
            setRequestType(requestTypeToKeep);
        }
    };

    if (!permissions.add) {
        return <p className="text-gray-600">ليس لديك صلاحية لإضافة طلبات.</p>
    }
    
    const handleStartEdit = (request: Leave | Departure, type: 'leave' | 'departure') => {
        setEditingRequest({ ...request, reqType: type });
    };

    const handleDeleteRequest = (id: string, type: 'leave' | 'departure') => {
        if (window.confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
            if (type === 'leave') {
                const leaveToDelete = leaves.find(l => l.id === id);
                setLeaves(prev => prev.filter(l => l.id !== id));
                if (leaveToDelete) {
                    const empName = employees.find(e => e.id === leaveToDelete.employeeId)?.name || '';
                    addNotification(`تم حذف طلب إجازة للموظف ${empName}`, 'leave');
                }
            } else {
                const depToDelete = departures.find(d => d.id === id);
                setDepartures(prev => prev.filter(d => d.id !== id));
                if(depToDelete) {
                    const empName = employees.find(e => e.id === depToDelete.employeeId)?.name || '';
                    addNotification(`تم حذف طلب مغادرة للموظف ${empName}`, 'departure');
                }
            }
        }
    };
    
    const employeeMap = new Map(employees.map(e => [e.id, e.name]));
    const allRequests = [
      ...leaves.map(l => ({ ...l, reqType: 'leave' as const, sortDate: l.startDate })),
      ...departures.map(d => ({ ...d, reqType: 'departure' as const, sortDate: d.date })),
    ].sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime());

    const handleViewRequest = (req: (typeof allRequests)[0]) => {
        const employeeName = employeeMap.get(req.employeeId) || 'موظف غير معروف';
        const type = req.reqType === 'leave' ? 'Leave' : 'Departure';
        setRequestToView({ request: req, employeeName, type });
    };

    return (
        <div className="space-y-12">
            <form onSubmit={handleSubmit} ref={formRef} className="space-y-6 p-4 md:p-6 border rounded-lg bg-gray-50">
                <h2 className="text-xl font-bold text-gray-800">{editingRequest ? 'تعديل الطلب' : 'تقديم طلب جديد'}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">اختر الموظف</label>
                        <select value={employeeId} onChange={e => setEmployeeId(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required>
                            <option value="">-- اختر --</option>
                            {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">نوع الطلب</label>
                        <select value={requestType} onChange={e => setRequestType(e.target.value as any)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                            <option value={LeaveType.Annual}>إجازة سنوية</option>
                            <option value={LeaveType.Sick}>إجازة مرضية</option>
                            <option value={DepartureType.Departure}>مغادرة</option>
                        </select>
                    </div>
                </div>

                {currentBalances && requestType !== DepartureType.Departure && (
                    <div className="md:col-span-2 bg-indigo-50 p-3 rounded-md border border-indigo-200 text-sm grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                        <p className="font-semibold text-indigo-800">
                            الرصيد السنوي: 
                            <span className="text-lg font-bold text-indigo-900 mx-1"> {currentBalances.annual.toFixed(2)} </span> يوم
                        </p>
                        <p className="font-semibold text-indigo-800">
                            الرصيد المرضي: 
                            <span className="text-lg font-bold text-indigo-900 mx-1"> {currentBalances.sick} </span> يوم
                        </p>
                    </div>
                )}

                {requestType !== DepartureType.Departure ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">تاريخ البدء</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">تاريخ الانتهاء</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">تاريخ المغادرة</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">عدد الساعات (1-4)</label>
                            <input type="number" min="1" max="4" value={hours} onChange={e => setHours(parseInt(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                        </div>
                    </div>
                )}

                {requestType === LeaveType.Sick && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">إرفاق تقرير طبي {editingRequest ? '(اختياري للتعديل)' : (permissions.overrideMedicalReport ? '(اختياري للمخولين)' : '(مطلوب)')}</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <FileUp className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="flex text-sm text-gray-600">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                                        <span>اختر ملف</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500">{medicalReport ? medicalReport.name : (editingRequest?.reqType === 'leave' && editingRequest.medicalReport ? `الملف الحالي: ${editingRequest.medicalReport.name}` : 'لم يتم اختيار ملف')}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-4 space-x-reverse space-x-3">
                    {editingRequest && (
                        <button type="button" onClick={resetForm} className="flex items-center bg-gray-300 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors">
                            <X className="w-5 h-5 ml-2" />
                            إلغاء التعديل
                        </button>
                    )}
                    <button type="submit" className="flex items-center bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                        {requestType === DepartureType.Departure ? <PlaneTakeoff className="w-5 h-5 ml-2" /> : <CalendarPlus className="w-5 h-5 ml-2" />}
                        {editingRequest ? 'حفظ التعديلات' : 'تقديم الطلب'}
                    </button>
                </div>
            </form>
            {requestToView && (
                <RequestActionModal requestData={requestToView} onClose={() => setRequestToView(null)} />
            )}

            <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <List className="w-6 h-6 ml-2 text-indigo-500" />
                    سجل الطلبات
                </h3>
                <div className="overflow-auto border rounded-lg shadow-sm hidden md:block">
                    <table className="min-w-full bg-white divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['اسم الموظف', 'النوع', 'التاريخ', 'التفاصيل', 'الإجراءات'].map(h => 
                                    <th key={h} className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {allRequests.map(req => (
                                <tr key={req.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{employeeMap.get(req.employeeId)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{req.reqType === 'leave' ? req.type : 'مغادرة'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {req.reqType === 'leave'
                                            ? `${formatDateToDDMMYYYY(req.startDate)} - ${formatDateToDDMMYYYY(req.endDate)}`
                                            : formatDateToDDMMYYYY(req.date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {req.reqType === 'leave' ? `${req.daysTaken} أيام` : `${req.hours} ساعات`}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-reverse space-x-2">
                                            <button onClick={() => handleViewRequest(req)} className="text-blue-600 hover:text-blue-900" title="عرض"><Eye /></button>
                                            {permissions.edit && <button onClick={() => handleStartEdit(req, req.reqType)} className="text-yellow-600 hover:text-yellow-900" title="تعديل"><Edit /></button>}
                                            {permissions.delete && <button onClick={() => handleDeleteRequest(req.id, req.reqType)} className="text-red-600 hover:text-red-900" title="حذف"><Trash2 /></button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 <div className="md:hidden space-y-4">
                    {allRequests.map(req => (
                        <div key={req.id} className="bg-white p-4 rounded-lg shadow border">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold">{employeeMap.get(req.employeeId)}</p>
                                    <p className="text-sm text-gray-600">{req.reqType === 'leave' ? req.type : 'مغادرة'}</p>
                                </div>
                                <div className="flex items-center space-x-reverse space-x-2">
                                    <button onClick={() => handleViewRequest(req)} className="text-blue-600 p-1" title="عرض"><Eye size={20} /></button>
                                    {permissions.edit && <button onClick={() => handleStartEdit(req, req.reqType)} className="text-yellow-600 p-1" title="تعديل"><Edit size={20} /></button>}
                                    {permissions.delete && <button onClick={() => handleDeleteRequest(req.id, req.reqType)} className="text-red-600 p-1" title="حذف"><Trash2 size={20} /></button>}
                                </div>
                            </div>
                            <div className="mt-2 border-t pt-2">
                                <p className="text-sm"><span className="font-semibold">التاريخ: </span>
                                    {req.reqType === 'leave'
                                        ? `${formatDateToDDMMYYYY(req.startDate)} - ${formatDateToDDMMYYYY(req.endDate)}`
                                        : formatDateToDDMMYYYY(req.date)}
                                </p>
                                <p className="text-sm"><span className="font-semibold">التفاصيل: </span>
                                    {req.reqType === 'leave' ? `${req.daysTaken} أيام` : `${req.hours} ساعات`}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


const HolidayWorkForm: React.FC<{
  employees: Employee[];
  holidays: Holiday[];
  holidayWork: HolidayWork[];
  setHolidayWork: React.Dispatch<React.SetStateAction<HolidayWork[]>>;
  weekendDays: number[];
  permissions: UserPermissions['leaves'];
  addNotification: (message: string, type: NotificationType) => void;
}> = ({ employees, holidays, holidayWork, setHolidayWork, weekendDays, permissions, addNotification }) => {
    const [employeeId, setEmployeeId] = useState('');
    const [workDate, setWorkDate] = useState('');
    const [dayType, setDayType] = useState<HolidayWorkType | 'عادي' | null>(null);

    useEffect(() => {
        if (workDate) { // workDate is a 'YYYY-MM-DD' string
            const isHoliday = holidays.some(h => h.date === workDate);
            const [year, month, day] = workDate.split('-').map(Number);
            const localDate = new Date(year, month - 1, day);
            const dayOfWeek = localDate.getDay();
            const isWeekend = weekendDays.includes(dayOfWeek);

            if (isHoliday) {
                setDayType(HolidayWorkType.Holiday);
            } else if (isWeekend) {
                setDayType(HolidayWorkType.Weekend);
            } else {
                setDayType('عادي');
            }
        } else {
            setDayType(null);
        }
    }, [workDate, holidays, weekendDays]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!employeeId || !workDate || !dayType || dayType === 'عادي') {
            alert('يرجى اختيار موظف وتاريخ صالح (عطلة أسبوعية أو رسمية).');
            return;
        }

        const alreadyExists = holidayWork.some(hw => hw.employeeId === employeeId && hw.date === workDate);
        if (alreadyExists) {
            alert('تم تسجيل بدل لهذا اليوم للموظف المحدد بالفعل.');
            return;
        }

        const newHolidayWork: HolidayWork = {
            id: new Date().toISOString(),
            employeeId,
            date: workDate,
            type: dayType
        };

        setHolidayWork(prev => [...prev, newHolidayWork]);
        const empName = employees.find(e => e.id === employeeId)?.name || '';
        addNotification(`تمت إضافة يوم بدل للموظف ${empName}.`, 'leave');
        alert('تم إضافة يوم البدل بنجاح.');
        setEmployeeId('');
        setWorkDate('');
    };
    
    const handleDelete = (id: string) => {
        setHolidayWork(prev => prev.filter(hw => hw.id !== id));
    };

    const isButtonDisabled = !employeeId || !workDate || (dayType !== HolidayWorkType.Weekend && dayType !== HolidayWorkType.Holiday);

    return (
        <div className="space-y-6">
            {permissions.manageHolidayWork && <form onSubmit={handleSubmit} className="flex flex-col md:flex-row items-end gap-4 p-4 border rounded-lg bg-gray-50">
                <div className="flex-grow w-full">
                    <label className="block text-sm font-medium text-gray-700">اختر الموظف</label>
                    <select value={employeeId} onChange={e => setEmployeeId(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required>
                        <option value="">-- اختر --</option>
                        {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                    </select>
                </div>
                <div className="flex-grow w-full">
                    <label className="block text-sm font-medium text-gray-700">تاريخ العمل</label>
                    <input type="date" value={workDate} onChange={e => setWorkDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                </div>
                <div className="flex-grow w-full">
                     <label className="block text-sm font-medium text-gray-700">نوع اليوم</label>
                     <div className="mt-1 h-[42px] flex items-center justify-center bg-white border border-gray-300 rounded-md">
                        <span className={`font-semibold ${dayType === 'عادي' ? 'text-red-500' : 'text-gray-700'}`}>
                            {dayType || '...'}
                        </span>
                     </div>
                </div>
                <button type="submit" disabled={isButtonDisabled} className="w-full md:w-auto flex items-center justify-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors h-fit disabled:bg-gray-400 disabled:cursor-not-allowed">
                    <Award className="w-5 h-5 ml-2" /> إضافة بدل
                </button>
            </form>}

            <div className="mt-6 flow-root">
                <h3 className="text-lg font-semibold mb-4">أيام البدل المسجلة</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">اسم الموظف</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">نوع اليوم</th>
                                {permissions.manageHolidayWork && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراء</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                           {holidayWork.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(hw => {
                                const employee = employees.find(e => e.id === hw.employeeId);
                                if (!employee) return null;
                                return (
                                    <tr key={hw.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">{employee.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{formatDateToDDMMYYYY(hw.date)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{hw.type}</td>
                                        {permissions.manageHolidayWork && <td className="px-6 py-4 whitespace-nowrap">
                                            <button onClick={() => handleDelete(hw.id)} className="text-red-600 hover:text-red-800">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const HolidayManagement: React.FC<Pick<LeaveHolidayManagementProps, 'holidays' | 'setHolidays' | 'permissions' | 'addNotification'>> = ({ holidays, setHolidays, permissions, addNotification }) => {
    const [name, setName] = useState('');
    const [date, setDate] = useState('');

    const handleAddHoliday = () => {
        if (name && date) {
            setHolidays([...holidays, { id: new Date().toISOString(), name, date }]);
            addNotification(`تمت إضافة عطلة رسمية جديدة: ${name}`, 'holiday');
            setName('');
            setDate('');
        }
    };
    
    const handleDeleteHoliday = (id: string) => {
        const holidayToDelete = holidays.find(h => h.id === id);
        setHolidays(holidays.filter(h => h.id !== id));
        if (holidayToDelete) {
             addNotification(`تم حذف العطلة الرسمية: ${holidayToDelete.name}`, 'holiday');
        }
    };

    return (
        <div className="space-y-6">
            {permissions.manageOfficialHolidays && <div className="flex flex-col md:flex-row items-end gap-4 p-4 border rounded-lg bg-gray-50">
                <div className="flex-grow w-full">
                    <label className="block text-sm font-medium text-gray-700">اسم العطلة</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
                 <div className="flex-grow w-full">
                    <label className="block text-sm font-medium text-gray-700">تاريخ العطلة</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
                <button onClick={handleAddHoliday} className="w-full md:w-auto flex items-center justify-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors h-fit">
                    <Plus className="w-5 h-5 ml-2" /> إضافة
                </button>
            </div>}
            
            <div className="mt-6 flow-root">
                <ul role="list" className="-my-5 divide-y divide-gray-200">
                    {holidays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(holiday => (
                        <li key={holiday.id} className="py-4">
                            <div className="flex items-center space-x-4 space-x-reverse">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{holiday.name}</p>
                                    <p className="text-sm text-gray-500 truncate">{formatDateToDDMMYYYY(holiday.date)}</p>
                                </div>
                                {permissions.manageOfficialHolidays && <div>
                                    <button onClick={() => handleDeleteHoliday(holiday.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-full">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default LeaveHolidayManagement;