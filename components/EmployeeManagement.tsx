import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { Employee, EmployeeStatus, BalanceAdjustment, LeaveType, UserPermissions, NotificationType } from '../types';
import { Plus, Edit, Trash2, Eye, Download, Upload, FileDown, UserCog, CheckCircle, XCircle, Clock, Search, SlidersHorizontal, ArrowDownUp, Info, CalendarClock, FileSpreadsheet, FileText } from 'lucide-react';

// Define jsPDF and html2canvas from window
declare const jspdf: any;
declare const html2canvas: any;
declare const XLSX: any;

interface EmployeeManagementProps {
  employees: Employee[];
  nationalities: string[];
  idTypes: string[];
  getEmployeeBalances: (employeeId: string) => { 
      annual: number; sick: number; departures: { monthly: number; totalForDeduction: number; };
      annualBalance: number; accruedAnnual: number; usedAnnual: number; 
      sickBalance: number; usedSick: number; departureDeductions: number;
      holidayCompensation: number;
  };
  permissions: UserPermissions['employees'];
  addNotification: (message: string, type: NotificationType) => void;
  // New action props
  addEmployee: (employeeData: Omit<Employee, 'id'>) => Promise<void>;
  addMultipleEmployees: (employeesData: Omit<Employee, 'id'>[]) => Promise<void>;
  updateEmployee: (employee: Employee) => Promise<void>;
  deleteEmployees: (employeeIds: string[]) => Promise<void>;
  addBalanceAdjustment: (adjustment: BalanceAdjustment) => Promise<void>;
}

const formatDateToDDMMYYYY = (dateStr?: string) => {
    if (!dateStr) return 'لا يوجد';
    const date = new Date(dateStr);
    // Add timezone offset to prevent date from shifting
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);

    const day = String(adjustedDate.getDate()).padStart(2, '0');
    const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
    const year = adjustedDate.getFullYear();
    return `${day}/${month}/${year}`;
};

// Helper component for the card
const InfoRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
        <span className="text-gray-600 text-md">{label}</span>
        <span className="font-semibold text-md">{value}</span>
    </div>
);


const EmployeeCard: React.FC<{ employee: Employee; balances: ReturnType<EmployeeManagementProps['getEmployeeBalances']>; onClose: () => void }> = ({ employee, balances, onClose }) => {
    const cardRef = useRef<HTMLDivElement>(null);

    const exportToPdf = () => {
        if (cardRef.current) {
            const { jsPDF } = jspdf;
            html2canvas(cardRef.current, { 
                scale: 3,
                useCORS: true, 
                backgroundColor: '#ffffff',
                letterRendering: true,
            }).then((canvas: HTMLCanvasElement) => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const margin = 15;
                
                const contentImgWidth = pdfWidth - margin * 2;
                const contentImgHeight = (canvas.height * contentImgWidth) / canvas.width;
                const footerHeight = 19;
                let finalImgHeight = contentImgHeight;

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

                pdf.save(`بطاقة-${employee.name}.pdf`);
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 font-['Cairo']">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
                <div className="p-6 md:p-10" ref={cardRef}>
                    {/* Header */}
                    <header className="flex flex-col md:flex-row justify-between items-start pb-4">
                        <div className="text-right mt-2 md:mt-0">
                            <h2 className="text-2xl md:text-3xl font-bold text-blue-700">بطاقة موظف</h2>
                        </div>
                        <div className="text-left">
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">{employee.name}</h1>
                            <p className="text-lg md:text-xl text-gray-500">{employee.jobTitle}</p>
                        </div>
                    </header>

                    {/* Blue Separator Line */}
                    <div className="border-t-4 border-blue-700 mb-8"></div>

                    {/* Body - Two Columns */}
                    <main className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
                        <section>
                            <h3 className="text-xl font-bold mb-4 pb-2 border-b-2 border-gray-200">المعلومات الشخصية</h3>
                            <div className="space-y-1">
                                <InfoRow label="الجنسية" value={employee.nationality} />
                                <InfoRow label="الرقم الوطني" value={employee.nationalId} />
                                <InfoRow label="رقم الضمان" value={employee.socialSecurityNumber} />
                                <InfoRow label="الحالة" value={employee.status} />
                                <InfoRow label="تاريخ التعيين" value={formatDateToDDMMYYYY(employee.hireDate)} />
                                {employee.status === EmployeeStatus.Terminated && employee.endDate && (
                                    <InfoRow label="تاريخ انتهاء الخدمة" value={formatDateToDDMMYYYY(employee.endDate)} />
                                )}
                            </div>
                        </section>
                        <section>
                            <h3 className="text-xl font-bold mb-4 pb-2 border-b-2 border-gray-200">ملخص الإجازات</h3>
                            <div className="space-y-1">
                                <InfoRow label="رصيد الإجازة السنوية" value={`${balances.annualBalance.toFixed(2)} يوم`} />
                                <InfoRow label="الإجازات السنوية المستحقة" value={`${balances.accruedAnnual.toFixed(2)} يوم`} />
                                <InfoRow label="بدل عطل رسمية وأسبوعية" value={`${balances.holidayCompensation} يوم`} />
                                <InfoRow label="الإجازات السنوية المستخدمة" value={`${balances.usedAnnual} يوم`} />
                                <InfoRow label="رصيد الإجازة المرضية" value={`${balances.sickBalance} يوم`} />
                                <InfoRow label="الإجازات المرضية المستخدمة" value={`${balances.usedSick} يوم`} />
                                <InfoRow label="خصم المغادرات" value={`${balances.departureDeductions} يوم`} />
                            </div>
                        </section>
                    </main>

                    {/* Footer */}
                    <footer className="text-center text-gray-400 mt-16 text-xs">
                        <p>هذا المستند تم إنشاؤه بواسطة نظام إدارة الإجازات - © {new Date().getFullYear()}</p>
                    </footer>
                </div>
                <div className="p-4 bg-gray-50 border-t flex justify-end space-x-reverse space-x-3">
                    <button onClick={exportToPdf} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                        <Download className="w-5 h-5 ml-2" />
                        تصدير PDF
                    </button>
                    <button onClick={onClose} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors">إغلاق</button>
                </div>
            </div>
        </div>
    );
};


const BalanceAdjustmentForm: React.FC<{
  employee: Employee;
  currentBalances: ReturnType<EmployeeManagementProps['getEmployeeBalances']>;
  onSave: (adjustment: Omit<BalanceAdjustment, 'id'>) => void;
  onClose: () => void;
}> = ({ employee, currentBalances, onSave, onClose }) => {
  const [leaveType, setLeaveType] = useState<LeaveType.Annual | LeaveType.Sick>(LeaveType.Annual);
  const [adjustmentDays, setAdjustmentDays] = useState<string>('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const days = parseFloat(adjustmentDays);
    if (isNaN(days) || days === 0 || !reason.trim()) {
      alert('يرجى إدخال قيمة عددية غير صفرية للأيام وسبب واضح للتعديل.');
      return;
    }
    const newAdjustment: Omit<BalanceAdjustment, 'id'> = {
      employeeId: employee.id,
      leaveType,
      adjustmentDays: days,
      reason: reason.trim(),
      date: new Date().toISOString().split('T')[0],
    };
    onSave(newAdjustment);
  };

  const currentBalance = leaveType === LeaveType.Annual ? currentBalances.annualBalance : currentBalances.sickBalance;
  const numericAdjustment = parseFloat(adjustmentDays) || 0;
  const newBalance = currentBalance + numericAdjustment;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-2">تعديل رصيد الإجازات</h3>
            <p className="text-gray-600 mb-6">للموظف: <span className="font-bold">{employee.name}</span></p>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">نوع الإجازة</label>
                    <select value={leaveType} onChange={(e) => setLeaveType(e.target.value as any)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                        <option value={LeaveType.Annual}>إجازة سنوية</option>
                        <option value={LeaveType.Sick}>إجازة مرضية</option>
                    </select>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <span className="text-sm font-medium text-blue-800">الرصيد الحالي:</span>
                    <span className="text-lg font-bold text-blue-900">{currentBalance.toFixed(2)} يوم</span>
                </div>
                <div>
                    <label htmlFor="adjustmentDays" className="block text-sm font-medium text-gray-700">أيام التعديل</label>
                    <input 
                        type="number" 
                        id="adjustmentDays"
                        step="0.01"
                        value={adjustmentDays} 
                        onChange={(e) => setAdjustmentDays(e.target.value)} 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="e.g., 5 or -2.5"
                        required 
                    />
                    <p className="text-xs text-gray-500 mt-1">أدخل قيمة موجبة للإضافة وسالبة للخصم.</p>
                </div>
                 <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                    <span className="text-sm font-medium text-green-800">الرصيد الجديد المتوقع:</span>
                    <span className="text-lg font-bold text-green-900">{newBalance.toFixed(2)} يوم</span>
                </div>
                <div>
                    <label htmlFor="reason" className="block text-sm font-medium text-gray-700">سبب التعديل (مطلوب)</label>
                    <textarea 
                        id="reason"
                        value={reason} 
                        onChange={(e) => setReason(e.target.value)} 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        rows={3}
                        required 
                    />
                </div>
            </div>
          </div>
          <div className="bg-gray-100 p-4 flex justify-end space-x-reverse space-x-3">
            <button type="button" onClick={onClose} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400">إلغاء</button>
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">حفظ التعديل</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ImportModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onImport: (event: ChangeEvent<HTMLInputElement>, cutoffDate: string) => void;
  cutoffDate: string;
  setCutoffDate: (date: string) => void;
}> = ({ isOpen, onClose, onImport, cutoffDate, setCutoffDate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-2">استيراد الموظفين من Excel</h3>
          <p className="text-gray-600 mb-6">
            سيتم استخدام الرصيد الافتتاحي من ملف Excel كنقطة بداية. سيبدأ احتساب الإجازات المستحقة من تاريخ القطع المختار أدناه.
          </p>
          
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-center mb-6">
            <label htmlFor="cutoffDateInput" className="block text-sm font-medium text-indigo-800 mb-2">
                <CalendarClock className="w-5 h-5 inline-block ml-2" />
                تاريخ القطع لاحتساب الرصيد
            </label>
            <input
                id="cutoffDateInput"
                type="date"
                value={cutoffDate}
                onChange={(e) => setCutoffDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-lg p-2 text-center font-bold text-indigo-900"
                required
            />
          </div>

          <input
            type="file"
            accept=".xlsx, .xls"
            ref={fileInputRef}
            onChange={(e) => {
                if(cutoffDate) {
                    onImport(e, cutoffDate)
                } else {
                    alert('يرجى اختيار تاريخ القطع أولاً.');
                }
            }}
            className="hidden"
          />
        </div>
        <div className="bg-gray-100 p-4 flex justify-end items-center space-x-reverse space-x-3">
          <button
            onClick={() => {
                if (cutoffDate) {
                    fileInputRef.current?.click()
                } else {
                    alert('يرجى اختيار تاريخ القطع أولاً.');
                }
            }}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow"
          >
            <Upload className="w-5 h-5 ml-2" />
            اختر ملف للاستيراد
          </button>
          <button type="button" onClick={onClose} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};

const ExportModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
}> = ({ isOpen, onClose, onExportExcel, onExportPdf }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-2 text-gray-800">تصدير بيانات الموظفين</h3>
          <p className="text-gray-600 mb-6">اختر الصيغة التي ترغب في تصدير البيانات بها.</p>
          <div className="flex flex-col space-y-3">
            <button
              onClick={onExportExcel}
              className="flex items-center justify-center w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors shadow text-lg font-semibold"
            >
              <FileSpreadsheet className="w-6 h-6 ml-3" />
              تصدير إلى Excel
            </button>
            <button
              onClick={onExportPdf}
              className="flex items-center justify-center w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors shadow text-lg font-semibold"
            >
              <FileText className="w-6 h-6 ml-3" />
              تصدير إلى PDF
            </button>
          </div>
        </div>
        <div className="bg-gray-100 p-4 flex justify-end">
          <button type="button" onClick={onClose} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};


const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ employees, nationalities, idTypes, getEmployeeBalances, permissions, addNotification, addEmployee, addMultipleEmployees, updateEmployee, deleteEmployees, addBalanceAdjustment }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [adjustingBalanceEmployee, setAdjustingBalanceEmployee] = useState<Employee | null>(null);
  const [filterStatus, setFilterStatus] = useState<EmployeeStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [cutoffDate, setCutoffDate] = useState('');
  
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  const filteredEmployees = employees
    .filter(e => filterStatus === 'all' || e.status === filterStatus)
    .filter(e => 
        e.name && 
        typeof e.name === 'string' && 
        e.name.trim().toLowerCase().includes(searchTerm.trim().toLowerCase())
    );

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
        const numSelected = selectedEmployees.length;
        const numFiltered = filteredEmployees.length;
        selectAllCheckboxRef.current.checked = numSelected > 0 && numSelected === numFiltered;
        selectAllCheckboxRef.current.indeterminate = numSelected > 0 && numSelected < numFiltered;
    }
  }, [selectedEmployees, filteredEmployees]);

  const openModal = (employee: Employee | null = null) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
  };
  
  const openImportModal = () => {
    setCutoffDate(new Date().toISOString().split('T')[0]);
    setIsImportModalOpen(true);
  };

  const handleSave = async (employee: Employee) => {
    if (editingEmployee) {
      await updateEmployee(employee);
    } else {
      await addEmployee(employee);
    }
    closeModal();
  };
  
  const handleSaveBalanceAdjustment = async (adjustment: Omit<BalanceAdjustment, 'id'>) => {
    await addBalanceAdjustment(adjustment as BalanceAdjustment);
    alert('تم حفظ تعديل الرصيد بنجاح.');
    setAdjustingBalanceEmployee(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا الموظف؟')) {
        deleteEmployees([id]);
    }
  };

  const handleDeleteSelected = () => {
    if (window.confirm(`هل أنت متأكد من رغبتك في حذف ${selectedEmployees.length} موظف(ين)؟`)) {
        deleteEmployees(selectedEmployees);
        setSelectedEmployees([]);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
        setSelectedEmployees(filteredEmployees.map(emp => emp.id));
    } else {
        setSelectedEmployees([]);
    }
  };

  const handleSelectEmployee = (employeeId: string) => {
    setSelectedEmployees(prev =>
        prev.includes(employeeId)
            ? prev.filter(id => id !== employeeId)
            : [...prev, employeeId]
    );
  };

  const handleExportTemplate = () => {
    const template = [{
      "الاسم الكامل": "", "الجنسية": "", "نوع الهوية": "", "الرقم الوطني/الشخصي": "",
      "رقم الضمان الاجتماعي": "", "المسمى الوظيفي": "", "تاريخ الميلاد": "YYYY-MM-DD",
      "تاريخ التعيين": "YYYY-MM-DD", "تاريخ انتهاء الخدمة": "YYYY-MM-DD",
      "الحالة": Object.values(EmployeeStatus).join('/'), "أيام الإجازة السنوية المخصصة": "",
      "رصيد افتتاحي للإجازة السنوية (اختياري)": "",
    }];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employees Template');
    XLSX.writeFile(wb, 'employee_template.xlsx');
  };

  const handleExportToExcel = () => {
    const dataToExport = employees.map(employee => {
      const balances = getEmployeeBalances(employee.id);
      return {
        'اسم الموظف': employee.name,
        'المسمى الوظيفي': employee.jobTitle,
        'تاريخ التعيين': formatDateToDDMMYYYY(employee.hireDate),
        'رصيد الإجازة السنوية (يوم)': balances.annualBalance.toFixed(2),
        'رصيد الإجازة المرضية (يوم)': balances.sickBalance.toFixed(2),
        'الحالة': employee.status,
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'بيانات الموظفين');
    XLSX.writeFile(wb, 'employees_data.xlsx');
    setIsExportModalOpen(false);
  };

  const handleExportToPdf = () => {
    const { jsPDF } = jspdf;
    const reportTitle = 'تقرير الموظفين';
    const reportDate = `تاريخ الإنشاء: ${new Date().toLocaleDateString('ar-EG')}`;

    const dataToExport = employees.map(employee => {
      const balances = getEmployeeBalances(employee.id);
      return {
        'اسم الموظف': employee.name,
        'المسمى الوظيفي': employee.jobTitle,
        'تاريخ التعيين': formatDateToDDMMYYYY(employee.hireDate),
        'رصيد الإجازة السنوية (يوم)': balances.annualBalance.toFixed(2),
        'رصيد الإجازة المرضية (يوم)': balances.sickBalance.toFixed(2),
        'الحالة': employee.status,
      };
    });
    const headers = Object.keys(dataToExport[0] || {});

    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.direction = 'rtl';
    tempContainer.style.fontFamily = "'Cairo', sans-serif";
    document.body.appendChild(tempContainer);
    
    const headerContainer = document.createElement('div');
    headerContainer.style.padding = '1rem';
    headerContainer.style.backgroundColor = 'white';
    headerContainer.innerHTML = `
        <h2 style="text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 2px;">${reportTitle}</h2>
        <p style="text-align: center; font-size: 12px; margin-bottom: 6px;">${reportDate}</p>
    `;
    tempContainer.appendChild(headerContainer);

    const tableEl = document.createElement('table');
    tableEl.style.width = '100%';
    tableEl.style.borderCollapse = 'collapse';
    tableEl.style.fontSize = '10px';
    tableEl.innerHTML = `
        <thead style="background-color: #f2f2f2;">
          <tr>
            ${headers.map(header => `<th style="border: 1px solid #ddd; padding: 8px; text-align: right;">${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${dataToExport.map(row => `
            <tr>
              ${headers.map(header => `<td style="border: 1px solid #ddd; padding: 8px;">${(row as any)[header]}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
    `;
    tempContainer.appendChild(tableEl);
    headerContainer.style.width = `${tableEl.clientWidth}px`;

    const headerPromise = html2canvas(headerContainer, { scale: 3, useCORS: true, logging: false, letterRendering: true });
    const tablePromise = html2canvas(tableEl, { scale: 3, useCORS: true, logging: false, letterRendering: true });

    Promise.all([headerPromise, tablePromise]).then(([headerCanvas, tableCanvas]) => {
        document.body.removeChild(tempContainer);

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        const contentWidth = pdfWidth - margin * 2;
        
        const headerImgData = headerCanvas.toDataURL('image/png');
        const headerImgHeightOnPdf = (headerCanvas.height * contentWidth) / headerCanvas.width;
        
        const tableImgData = tableCanvas.toDataURL('image/png');
        const tableImgHeightOnPdf = (tableCanvas.height * contentWidth) / tableCanvas.width;

        const footerHeight = 19;
        const pageContentHeight = pdfHeight - margin * 2 - headerImgHeightOnPdf - footerHeight;
        const totalPages = Math.ceil(tableImgHeightOnPdf / pageContentHeight);
        
        let tableImgCoveredHeight = 0;

        for (let i = 1; i <= totalPages; i++) {
            if (i > 1) pdf.addPage();

            pdf.addImage(headerImgData, 'PNG', margin, margin, contentWidth, headerImgHeightOnPdf);
            
            const tableY = margin + headerImgHeightOnPdf + 5;
            const effectivePageContentHeight = pdfHeight - tableY - margin - footerHeight;
            pdf.saveGraphicsState();
            pdf.rect(margin, tableY, contentWidth, effectivePageContentHeight).clip();
            pdf.addImage(tableImgData, 'PNG', margin, tableY - tableImgCoveredHeight, contentWidth, tableImgHeightOnPdf);
            pdf.restoreGraphicsState();
            
            const footerY = pdfHeight - 10;
            pdf.setFontSize(9);
            const centerText = "Powered by Extreme Precision";
            pdf.text(centerText, pdfWidth / 2, footerY, { align: 'center' });
            const pageNumText = `Page ${i} of ${totalPages}`;
            pdf.text(pageNumText, pdfWidth - margin, footerY, { align: 'right' });

            tableImgCoveredHeight += effectivePageContentHeight;
        }
        
        pdf.save('employees_report.pdf');
    }).catch(err => {
        console.error("Error generating PDF:", err);
        if (tempContainer.parentElement) {
             document.body.removeChild(tempContainer);
        }
    });
    
    setIsExportModalOpen(false);
  };

  const handleImport = (event: ChangeEvent<HTMLInputElement>, importCutoffDate: string) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);

          const employeesToCreate: Omit<Employee, 'id'>[] = [];
          let errorCount = 0;

          const headerMapping: { [key: string]: keyof Employee } = {
            "الاسم الكامل": "name", "الجنسية": "nationality", "نوع الهوية": "idType",
            "الرقم الوطني/الشخصي": "nationalId", "رقم الضمان الاجتماعي": "socialSecurityNumber",
            "المسمى الوظيفي": "jobTitle", "تاريخ الميلاد": "dateOfBirth", "تاريخ التعيين": "hireDate",
            "تاريخ انتهاء الخدمة": "endDate", "الحالة": "status", "أيام الإجازة السنوية المخصصة": "customAnnualLeaveDays",
            "رصيد الإجازات السنوي الحالي": "initialAnnualBalance", // Old header for backward compatibility
            "رصيد افتتاحي للإجازة السنوية (اختياري)": "initialAnnualBalance" // New, clearer header
          };
          
          json.forEach((row: any, index) => {
            let hasError = false;
            const newEmployeeData: Partial<Omit<Employee, 'id'>> = {};

            for (const key in headerMapping) {
              if (row[key] !== undefined) { (newEmployeeData as any)[headerMapping[key]] = row[key]; }
            }
            
            if (typeof newEmployeeData.name === 'string') {
              newEmployeeData.name = newEmployeeData.name.trim();
            }

            if (!newEmployeeData.name) {
              console.error(`Row ${index + 2}: 'الاسم الكامل' is required.`); hasError = true;
            }
            if (!newEmployeeData.hireDate) {
              console.error(`Row ${index + 2}: 'تاريخ التعيين' is required.`); hasError = true;
            }

            ['dateOfBirth', 'hireDate', 'endDate'].forEach(dateKey => {
              const key = dateKey as keyof Employee;
              const value = (newEmployeeData as any)[key];
              if (value) {
                if (value instanceof Date) {
                  const d = value;
                  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                  (newEmployeeData as any)[key] = d.toISOString().split('T')[0];
                } else {
                   if (newEmployeeData.hireDate) { // only error if a value was present but not a date
                     console.error(`Row ${index + 2}: Invalid date format for ${key}.`); hasError = true;
                   }
                }
              }
            });
            
            if (newEmployeeData.status && !Object.values(EmployeeStatus).includes(newEmployeeData.status as EmployeeStatus)) {
              console.warn(`Row ${index + 2}: Invalid status "${newEmployeeData.status}". Defaulting to Active.`);
              newEmployeeData.status = EmployeeStatus.Active;
            } else if (!newEmployeeData.status) { newEmployeeData.status = EmployeeStatus.Active; }
            
            const customDaysValue = newEmployeeData.customAnnualLeaveDays;
            const initialBalanceValue = newEmployeeData.initialAnnualBalance;

            let finalOpeningBalance: number | undefined;

            if (customDaysValue !== undefined && customDaysValue !== null && String(customDaysValue).trim() !== '') {
                const parsed = Number(customDaysValue);
                if (isNaN(parsed)) {
                    console.error(`Row ${index + 2}: 'أيام الإجازة السنوية المخصصة' must be a number.`); hasError = true;
                } else {
                    finalOpeningBalance = parsed;
                }
                newEmployeeData.customAnnualLeaveDays = undefined;
            } else if (initialBalanceValue !== undefined && initialBalanceValue !== null && String(initialBalanceValue).trim() !== '') {
                const parsed = Number(initialBalanceValue);
                if (isNaN(parsed)) {
                    console.warn(`Row ${index + 2}: Invalid number for 'رصيد افتتاحي' ("${initialBalanceValue}"). Defaulting to 0.`);
                    finalOpeningBalance = 0;
                } else {
                    finalOpeningBalance = parsed;
                }
            }
            newEmployeeData.initialAnnualBalance = finalOpeningBalance ?? 0;
            newEmployeeData.balanceSetDate = importCutoffDate;

            if (hasError) { 
                errorCount++; 
            } else { 
                employeesToCreate.push(newEmployeeData as Omit<Employee, 'id'>);
            }
          });
          
          await addMultipleEmployees(employeesToCreate);

          let alertMessage = `اكتمل الاستيراد.`;
          if (employeesToCreate.length > 0) { 
              alertMessage += `\nتم استيراد ${employeesToCreate.length} موظف بنجاح.`;
          }
          if (errorCount > 0) { 
              alertMessage += `\nفشل استيراد ${errorCount} سجل لوجود أخطاء. الرجاء مراجعة الكونسول لمزيد من التفاصيل.`; 
          }
          setIsImportModalOpen(false);
          alert(alertMessage);

        } catch (error) {
          console.error("Error importing file:", error);
          alert("حدث خطأ أثناء استيراد الملف. يرجى التأكد من أن الملف بالصيغة الصحيحة وأن الأعمدة مطابقة للقالب.");
          setIsImportModalOpen(false);
        }
      };
      reader.readAsArrayBuffer(file);
    }
    if (event.target) { event.target.value = ''; }
  };

  const getStatusIcon = (status: EmployeeStatus) => {
    switch(status) {
        case EmployeeStatus.Active: return <CheckCircle className="text-green-500" />;
        case EmployeeStatus.Suspended: return <Clock className="text-yellow-500" />;
        case EmployeeStatus.Terminated: return <XCircle className="text-red-500" />;
    }
  }

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg flex flex-col h-full">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
            <UserCog className="ml-3 text-indigo-500 w-8 h-8"/>
            إدارة الموظفين
        </h2>
        <div className="w-full md:w-auto flex items-center gap-2 flex-wrap justify-center">
            <div className="relative w-full md:w-64">
              <input
                  type="text"
                  placeholder="البحث عن موظف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border-2 border-gray-400 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 pr-10 pl-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Search className="w-5 h-5 text-gray-500" />
              </div>
              {searchTerm && (
                <button 
                    onClick={() => setSearchTerm('')} 
                    className="absolute inset-y-0 left-0 flex items-center pl-3"
                    aria-label="مسح البحث"
                >
                    <XCircle className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
                </button>
              )}
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="border-gray-300 rounded-lg shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500 h-10">
              <option value="all">كل الحالات</option>
              {Object.values(EmployeeStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2 flex-wrap">
          {selectedEmployees.length === 0 ? (
            <div className="flex items-center gap-2 flex-wrap">
              {permissions.add && <button onClick={() => openModal()} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow">
                  <Plus className="w-5 h-5 ml-2" /> إضافة موظف
              </button>}
              {permissions.import && <>
                <button onClick={handleExportTemplate} className="flex items-center bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors shadow">
                    <FileDown className="w-5 h-5 ml-2" /> تحميل قالب
                </button>
                <button onClick={openImportModal} className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow">
                    <Upload className="w-5 h-5 ml-2" /> استيراد
                </button>
              </>}
              {permissions.export && <button onClick={() => setIsExportModalOpen(true)} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow">
                  <Download className="w-5 h-5 ml-2" /> تصدير الكل
              </button>}
            </div>
          ) : (
              <div className="flex items-center gap-3 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200">
                  <span className="text-sm font-semibold text-indigo-800">
                      {selectedEmployees.length} تم تحديدهم
                  </span>
                  {permissions.delete && <button
                      onClick={handleDeleteSelected}
                      className="flex items-center bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 transition-colors shadow-sm"
                  >
                      <Trash2 className="w-4 h-4 ml-1" /> حذف
                  </button>}
              </div>
          )}
      </div>

      <div className="overflow-auto flex-grow">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50 sticky top-0 z-10 hidden md:table-header-group">
            <tr>
              <th scope="col" className="px-6 py-3">
                <input
                    type="checkbox"
                    ref={selectAllCheckboxRef}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </th>
              {['اسم الموظف', 'المسمى الوظيفي', 'تاريخ التعيين', 'الحالة', 'إجراءات'].map(h => <th key={h} className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 md:divide-y-0">
            {filteredEmployees.map(employee => (
              <tr key={employee.id} className={`block md:table-row mb-4 md:mb-0 rounded-lg shadow-md md:shadow-none ${selectedEmployees.includes(employee.id) ? 'bg-indigo-50' : 'bg-white md:bg-transparent'} hover:bg-gray-50 md:hover:bg-gray-50`}>
                <td className="p-4 md:px-6 md:py-4 whitespace-nowrap block md:table-cell border-b md:border-b-0">
                    <div className="flex items-center justify-between">
                        <input
                            type="checkbox"
                            checked={selectedEmployees.includes(employee.id)}
                            onChange={() => handleSelectEmployee(employee.id)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="md:hidden flex items-center space-x-reverse space-x-2">
                          <button onClick={() => setViewingEmployee(employee)} className="text-blue-600 hover:text-blue-900" title="عرض البطاقة"><Eye /></button>
                          {permissions.edit && <button onClick={() => openModal(employee)} className="text-yellow-600 hover:text-yellow-900" title="تعديل الموظف"><Edit /></button>}
                          {permissions.adjustBalance && <button onClick={() => setAdjustingBalanceEmployee(employee)} className="text-gray-600 hover:text-gray-900" title="تعديل الرصيد"><SlidersHorizontal /></button>}
                          {permissions.delete && <button onClick={() => handleDelete(employee.id)} className="text-red-600 hover:text-red-900" title="حذف الموظف"><Trash2 /></button>}
                        </div>
                    </div>
                </td>
                <td className="px-4 pb-2 md:px-6 md:py-4 whitespace-nowrap block md:table-cell text-right"><span className="font-bold md:hidden float-right ml-2">اسم الموظف:</span>{employee.name}</td>
                <td className="px-4 pb-2 md:px-6 md:py-4 whitespace-nowrap block md:table-cell text-right"><span className="font-bold md:hidden float-right ml-2">المسمى الوظيفي:</span>{employee.jobTitle}</td>
                <td className="px-4 pb-2 md:px-6 md:py-4 whitespace-nowrap block md:table-cell text-right"><span className="font-bold md:hidden float-right ml-2">تاريخ التعيين:</span>{formatDateToDDMMYYYY(employee.hireDate)}</td>
                <td className="px-4 pb-2 md:px-6 md:py-4 whitespace-nowrap block md:table-cell text-right">
                    <span className="font-bold md:hidden float-right ml-2">الحالة:</span>
                    <span className="flex items-center gap-2 text-sm justify-end md:justify-start">
                        {getStatusIcon(employee.status)} {employee.status}
                    </span>
                </td>
                <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-reverse space-x-2">
                    <button onClick={() => setViewingEmployee(employee)} className="text-blue-600 hover:text-blue-900" title="عرض البطاقة"><Eye /></button>
                    {permissions.edit && <button onClick={() => openModal(employee)} className="text-yellow-600 hover:text-yellow-900" title="تعديل الموظف"><Edit /></button>}
                    {permissions.adjustBalance && <button onClick={() => setAdjustingBalanceEmployee(employee)} className="text-gray-600 hover:text-gray-900" title="تعديل الرصيد"><SlidersHorizontal /></button>}
                    {permissions.delete && <button onClick={() => handleDelete(employee.id)} className="text-red-600 hover:text-red-900" title="حذف الموظف"><Trash2 /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {isModalOpen && <EmployeeForm employee={editingEmployee} onSave={handleSave} onClose={closeModal} nationalities={nationalities} idTypes={idTypes} />}
      {viewingEmployee && <EmployeeCard employee={viewingEmployee} balances={getEmployeeBalances(viewingEmployee.id)} onClose={() => setViewingEmployee(null)} />}
      {adjustingBalanceEmployee && <BalanceAdjustmentForm employee={adjustingBalanceEmployee} currentBalances={getEmployeeBalances(adjustingBalanceEmployee.id)} onSave={handleSaveBalanceAdjustment} onClose={() => setAdjustingBalanceEmployee(null)} />}
      {permissions.import && <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
        cutoffDate={cutoffDate}
        setCutoffDate={setCutoffDate}
      />}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExportExcel={handleExportToExcel}
        onExportPdf={handleExportToPdf}
      />
    </div>
  );
};

const EmployeeForm: React.FC<{ employee: Employee | null; onSave: (employee: Employee) => void; onClose: () => void; nationalities: string[]; idTypes: string[] }> = ({ employee, onSave, onClose, nationalities, idTypes }) => {
    const [formData, setFormData] = useState<Omit<Employee, 'id'>>({
        name: employee?.name || '',
        nationality: employee?.nationality || '',
        idType: employee?.idType || '',
        nationalId: employee?.nationalId || '',
        socialSecurityNumber: employee?.socialSecurityNumber || '',
        jobTitle: employee?.jobTitle || '',
        dateOfBirth: employee?.dateOfBirth || '',
        hireDate: employee?.hireDate || '',
        endDate: employee?.endDate || '',
        status: employee?.status || EmployeeStatus.Active,
        customAnnualLeaveDays: employee?.customAnnualLeaveDays,
        initialAnnualBalance: employee?.initialAnnualBalance,
        balanceSetDate: employee?.balanceSetDate,
    });
    
    useEffect(() => {
        if (formData.endDate && formData.status !== EmployeeStatus.Terminated) {
            setFormData(prev => ({ ...prev, status: EmployeeStatus.Terminated }));
        }
    }, [formData.endDate, formData.status]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'endDate' && !value) {
            setFormData(prev => ({...prev, endDate: undefined, status: EmployeeStatus.Active}));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalData = !employee ? { ...formData, status: EmployeeStatus.Active, endDate: undefined } : formData;
        onSave({ ...finalData, id: employee?.id || '' });
    };

    const allFormFields = [
        { name: 'name', label: 'الاسم الكامل', type: 'text' },
        { name: 'jobTitle', label: 'المسمى الوظيفي', type: 'text' },
        { name: 'nationality', label: 'الجنسية', type: 'select', options: nationalities },
        { name: 'idType', label: 'نوع الهوية', type: 'select', options: idTypes },
        { name: 'nationalId', label: 'الرقم الوطني/الشخصي', type: 'text' },
        { name: 'socialSecurityNumber', label: 'رقم الضمان الاجتماعي', type: 'text' },
        { name: 'dateOfBirth', label: 'تاريخ الميلاد', type: 'date' },
        { name: 'hireDate', label: 'تاريخ التعيين', type: 'date' },
        { name: 'endDate', label: 'تاريخ انتهاء الخدمة', type: 'date' },
        { name: 'status', label: 'الحالة', type: 'select', options: [EmployeeStatus.Active, EmployeeStatus.Suspended] },
        { name: 'customAnnualLeaveDays', label: 'أيام الإجازة السنوية المخصصة (اختياري)', type: 'number' },
    ];
    
    const formFields = employee ? allFormFields : allFormFields.filter(field => !['endDate', 'status'].includes(field.name));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-40 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h3 className="text-xl font-semibold mb-6">{employee ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {formFields.map(field => (
                                <div key={field.name}>
                                    <label className="block text-sm font-medium text-gray-700">{field.label}</label>
                                    {field.type === 'select' ? (
                                        <select 
                                            name={field.name} 
                                            value={(formData as any)[field.name]} 
                                            onChange={handleChange} 
                                            disabled={field.name === 'status' && !!formData.endDate}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed" 
                                            required={!field.name.includes('custom')}
                                        >
                                            <option value="">اختر...</option>
                                            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            {field.name === 'status' && formData.status === EmployeeStatus.Terminated && (
                                                <option value={EmployeeStatus.Terminated}>{EmployeeStatus.Terminated}</option>
                                            )}
                                        </select>
                                    ) : (
                                        <input type={field.type} name={field.name} value={(formData as any)[field.name] || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required={!['endDate', 'customAnnualLeaveDays', 'hireDate', 'dateOfBirth'].includes(field.name)} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-gray-100 p-4 flex justify-end space-x-reverse space-x-3">
                        <button type="button" onClick={onClose} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400">إلغاء</button>
                        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">حفظ</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmployeeManagement;