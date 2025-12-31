import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from 'example/containers/Layout';
import Style from 'styles/Home.module.css';
import AlertModal from '../../components/AlertModal';
import { DocumentDownloadIcon, TableIcon } from '@heroicons/react/outline';
import { jwtDecode } from 'jwt-decode';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ExcelJS from 'exceljs';
import Head from 'next/head';
interface Employee {
  id: number;
  name: string;
  totalReceived: number;
  totalExpenses: number;
  remainingBalance: number;
  transactions: Transaction[];
}

interface Transaction {
  id: number;
  date: string;
  employeeName: string;
  cashNumber: string;
  receivedAmount: number;
  expenseAmount: number;
  remainingBalance: number;
}

interface EmployeeCashData {
  employees: Employee[];
  summary: {
    totalEmployees: number;
    totalReceived: number;
    totalExpenses: number;
    totalRemaining: number;
  };
}

// Form data interface matching the EmployeeCash model
export interface EmployeeCashFormData {
  employeeId: number | '';
  cashNumber: string;
  receivedAmount: number | '';
  expenseAmount: number | '';
  description: string;
  attachment: string;
  transactionDate: string;
}

// Employee interface for dropdown
export interface EmployeeOption {
  id: number;
  name: string;
  position?: string;
  department?: string;
}

// Employee form data interface
interface EmployeeFormData {
  name: string;
  position: string;
  department: string;
  phoneNumber: string;
  email: string;
  nationalId: string;
  address: string;
  hireDate: string;
  salary: string;
  notes: string;
}

export default function EmployeeCash() {
  const router = useRouter();
  const [data, setData] = useState<EmployeeCashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    employee: '',
    fromDate: '',
    toDate: ''
  });
  
  // Form state management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [temporaryRecordId, setTemporaryRecordId] = useState<number | null>(null); // ID السجل المؤقت
  const [formData, setFormData] = useState<EmployeeCashFormData>({
    employeeId: '',
    cashNumber: '',
    receivedAmount: '',
    expenseAmount: '',
    description: '',
    attachment: '',
    transactionDate: new Date().toISOString().split('T')[0]
  });
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [fileUploaded, setFileUploaded] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  
  // Add Employee Modal State
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [isSubmittingEmployee, setIsSubmittingEmployee] = useState(false);
  const [employeeFormData, setEmployeeFormData] = useState<EmployeeFormData>({
    name: '',
    position: '',
    department: '',
    phoneNumber: '',
    email: '',
    nationalId: '',
    address: '',
    hireDate: '',
    salary: '',
    notes: ''
  });
  const [employeeFormErrors, setEmployeeFormErrors] = useState<Record<string, string>>({});
  
  // Success/Error Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  
  // User name for export
  const [userName, setUserName] = useState('');

  useEffect(() => {
    fetchEmployeeCashData();
    fetchEmployees();
  }, [filters]);

  useEffect(() => {
    const authToken = localStorage.getItem('token');
    if (authToken) {
      try {
        const decoder: any = jwtDecode(authToken);
        setUserName(decoder?.username || '');
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  // تنظيف السجلات المؤقتة عند إغلاق المكوّن
  useEffect(() => {
    return () => {
      // حذف السجل المؤقت عند إغلاق المكوّن إذا كان موجوداً
      if (temporaryRecordId) {
        fetch(`/api/employee-cash?id=${temporaryRecordId}`, {
          method: 'DELETE',
        }).catch(error => {
          console.error('خطأ في حذف السجل المؤقت عند إغلاق المكوّن:', error);
        });
      }
    };
  }, [temporaryRecordId]);

  const fetchEmployeeCashData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.employee) queryParams.append('employee', filters.employee);
      if (filters.fromDate) queryParams.append('fromDate', filters.fromDate);
      if (filters.toDate) queryParams.append('toDate', filters.toDate);

      const response = await fetch(`/api/employee-cash?${queryParams}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching employee cash data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      const result = await response.json();
      setEmployees(result.employees || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleEmployeeClick = (transactionId: number) => {
    // Get the employee ID from the transaction
    const transaction = data?.employees.flatMap(emp => emp.transactions).find(t => t.id === transactionId);
    if (transaction) {
      const employee = data?.employees.find(emp => emp.transactions.some(t => t.id === transactionId));
      if (employee) {
        router.push(`/admin/employee_cash/${employee.id}`);
      }
    }
  };

  const handleAddCash = async () => {
    setIsModalOpen(true);
    // Reset form data when opening modal
    setFormData({
      employeeId: '',
      cashNumber: '',
      receivedAmount: '',
      expenseAmount: '',
      description: '',
      attachment: '',
      transactionDate: new Date().toISOString().split('T')[0]
    });
    setFormErrors({});
    setFileUploaded(false);
    setUploadedFileName('');

    // إنشاء سجل مؤقت تلقائياً
    try {
      const response = await fetch('/api/employee-cash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isTemporary: true,
          receivedAmount: 0,
          expenseAmount: 0,
          remainingBalance: 0,
          transactionDate: new Date().toISOString().split('T')[0]
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setTemporaryRecordId(result.employeeCashRecord.id);
        // تحديث رقم العهدة في الـ form إذا تم توليده تلقائياً
        if (result.employeeCashRecord.cashNumber) {
          setFormData(prev => ({
            ...prev,
            cashNumber: result.employeeCashRecord.cashNumber
          }));
          console.log('تم تحديث رقم العهدة:', result.employeeCashRecord.cashNumber);
        } else {
          console.log('لم يتم العثور على رقم عهدة في السجل المؤقت');
        }
      } else {
        console.error('فشل في إنشاء السجل المؤقت');
      }
    } catch (error) {
      console.error('خطأ في إنشاء السجل المؤقت:', error);
    }
  };

  const handleCloseModal = async () => {
    // حذف السجل المؤقت إذا كان موجوداً
    if (temporaryRecordId) {
      try {
        await fetch(`/api/employee-cash?id=${temporaryRecordId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('خطأ في حذف السجل المؤقت:', error);
      }
      setTemporaryRecordId(null);
    }

    setIsModalOpen(false);
    // Reset form data when closing modal
    setFormData({
      employeeId: '',
      cashNumber: '',
      receivedAmount: '',
      expenseAmount: '',
      description: '',
      attachment: '',
      transactionDate: new Date().toISOString().split('T')[0]
    });
    setFormErrors({});
    setFileUploaded(false);
    setUploadedFileName('');
  };

  // Form field handlers with two-way binding
  const handleFormFieldChange = (field: keyof EmployeeCashFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => {
        const { [field]: removed, ...rest } = prev;
        return rest;
      });
    }
  };

  // Employee form handlers
  const handleEmployeeFormFieldChange = (field: keyof EmployeeFormData, value: string) => {
    setEmployeeFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (employeeFormErrors[field]) {
      setEmployeeFormErrors(prev => {
        const { [field]: removed, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateEmployeeForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Name validation - required and no numbers allowed
    if (!employeeFormData.name.trim()) {
      errors.name = 'اسم الموظف مطلوب';
    } else if (/\d/.test(employeeFormData.name)) {
      errors.name = 'اسم الموظف لا يجب أن يحتوي على أرقام';
    }
    
    // Position validation - required
    if (!employeeFormData.position.trim()) {
      errors.position = 'المنصب مطلوب';
    }
    
    // Department validation - required
    if (!employeeFormData.department.trim()) {
      errors.department = 'القسم مطلوب';
    }
    
    // Phone validation - required
    if (!employeeFormData.phoneNumber.trim()) {
      errors.phoneNumber = 'رقم الهاتف مطلوب';
    } else if (!/^[0-9+\-\s()]+$/.test(employeeFormData.phoneNumber)) {
      errors.phoneNumber = 'رقم الهاتف غير صحيح';
    }
    
    // Email validation - required and must be valid email format
    if (!employeeFormData.email.trim()) {
      errors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(employeeFormData.email)) {
      errors.email = 'يرجى إدخال بريد إلكتروني صحيح (مثال: example@email.com)';
    }
    
    // National ID validation - required
    if (!employeeFormData.nationalId.trim()) {
      errors.nationalId = 'الهوية الوطنية مطلوبة';
    }
    
    // Address validation - required
    if (!employeeFormData.address.trim()) {
      errors.address = 'العنوان مطلوب';
    }
    
    // Hire date validation - required
    if (!employeeFormData.hireDate) {
      errors.hireDate = 'تاريخ التوظيف مطلوب';
    }
    
    // Salary validation - required
    if (!employeeFormData.salary || Number(employeeFormData.salary) <= 0) {
      errors.salary = 'الراتب مطلوب ويجب أن يكون أكبر من صفر';
    }
    
    setEmployeeFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEmployeeSelectChange = (value: string) => {
    if (value === 'add_new') {
      // Open add employee modal
      setIsAddEmployeeModalOpen(true);
      setEmployeeFormData({
        name: '',
        position: '',
        department: '',
        phoneNumber: '',
        email: '',
        nationalId: '',
        address: '',
        hireDate: '',
        salary: '',
        notes: ''
      });
      setEmployeeFormErrors({});
    } else {
      // Normal employee selection
      handleFormFieldChange('employeeId', value);
    }
  };

  const handleCloseAddEmployeeModal = () => {
    setIsAddEmployeeModalOpen(false);
    setEmployeeFormData({
      name: '',
      position: '',
      department: '',
      phoneNumber: '',
      email: '',
      nationalId: '',
      address: '',
      hireDate: '',
      salary: '',
      notes: ''
    });
    setEmployeeFormErrors({});
  };

  const handleSubmitEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmployeeForm()) {
      return;
    }
    
    setIsSubmittingEmployee(true);
    
    try {
      const submitData = {
        name: employeeFormData.name.trim(),
        position: employeeFormData.position.trim() || null,
        department: employeeFormData.department.trim() || null,
        phoneNumber: employeeFormData.phoneNumber.trim() || null,
        email: employeeFormData.email.trim() || null,
        nationalId: employeeFormData.nationalId.trim() || null,
        address: employeeFormData.address.trim() || null,
        hireDate: employeeFormData.hireDate || null,
        salary: employeeFormData.salary ? Number(employeeFormData.salary) : null,
        notes: employeeFormData.notes.trim() || null
      };
      
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });
      
      if (response.ok) {
        const result = await response.json();
        // Refresh employees list
        await fetchEmployees();
        // Select the newly added employee
        if (result.employee?.id) {
          handleFormFieldChange('employeeId', result.employee.id.toString());
        }
        handleCloseAddEmployeeModal();
        setModalMessage('تم إضافة الموظف بنجاح');
        setShowSuccessModal(true);
      } else {
        const errorData = await response.json();
        setModalMessage(errorData.error || 'حدث خطأ أثناء إضافة الموظف');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error submitting employee form:', error);
      setModalMessage('حدث خطأ أثناء إضافة الموظف');
      setShowErrorModal(true);
    } finally {
      setIsSubmittingEmployee(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setFormErrors((prev) => ({ ...prev, attachment: 'لم يتم اختيار ملف' }));
      setFileUploaded(false);
      setUploadedFileName('');
      return;
    }

    const file = files[0];
    
    // حفظ اسم الملف فوراً
    setUploadedFileName(file.name);
    
    // File size validation (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setFormErrors((prev) => ({ ...prev, attachment: 'حجم الملف كبير جداً (الحد الأقصى 10 ميجابايت)' }));
      setFileUploaded(false);
      setUploadedFileName('');
      return;
    }

    if (!allowedFileTypes.includes(file.type)) {
      setFormErrors((prev) => ({ ...prev, attachment: 'نوع الملف غير مدعوم (PDF، JPEG، PNG فقط)' }));
      setFileUploaded(false);
      setUploadedFileName('');
      return;
    }

    try {
      const res = await fetch(`/api/upload-presigned-url/attachment`);
      if (!res.ok) {
        throw new Error('فشل في الحصول على رابط الرفع');
      }
      const { url, filePath } = await res.json();

      const uploadRes = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
          'x-amz-acl': 'public-read',
        },
      });

      if (!uploadRes.ok) {
        throw new Error('فشل في رفع الملف');
      }

      setFormData((prev) => ({ ...prev, attachment: filePath }));
      setFormErrors((prev) => ({ ...prev, attachment: '' }));
      setFileUploaded(true);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setFormErrors((prev) => ({ ...prev, attachment: error.message || 'حدث خطأ أثناء رفع الملف' }));
      setFileUploaded(false);
      setUploadedFileName('');
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      console.error('File input reference is not defined or has no current value');
      setFormErrors((prev) => ({ ...prev, attachment: 'خطأ في تحديد حقل الملف' }));
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.employeeId) {
      errors.employeeId = 'الموظف مطلوب';
    }
    
    if (!formData.cashNumber.trim()) {
      errors.cashNumber = 'رقم العهدة مطلوب';
    }
    
    if (formData.receivedAmount === '' || formData.receivedAmount <= 0) {
      errors.receivedAmount = 'المبلغ المستلم مطلوب ويجب أن يكون أكبر من صفر';
    }
    
    if (formData.expenseAmount === '' || formData.expenseAmount < 0) {
      errors.expenseAmount = 'المصروف مطلوب ويجب أن يكون أكبر من أو يساوي صفر';
    }
    
    if (!formData.transactionDate) {
      errors.transactionDate = 'التاريخ مطلوب';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form submission
  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare form data for API
      const submitData: any = {
        employeeId: Number(formData.employeeId),
        cashNumber: formData.cashNumber,
        receivedAmount: Number(formData.receivedAmount),
        expenseAmount: Number(formData.expenseAmount),
        description: formData.description,
        attachment: formData.attachment || '',
        transactionDate: formData.transactionDate,
        isTemporary: false // تحويل السجل من مؤقت إلى دائم
      };

      // إذا كان هناك سجل مؤقت، قم بتحديثه بدلاً من إنشاء جديد
      if (temporaryRecordId) {
        submitData.id = temporaryRecordId;
      }
      
      const response = await fetch('/api/employee-cash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });
      
      if (response.ok) {
        // Success - close modal and refresh data
        setTemporaryRecordId(null); // مسح ID السجل المؤقت
        setIsModalOpen(false);
        // Reset form data
        setFormData({
          employeeId: '',
          cashNumber: '',
          receivedAmount: '',
          expenseAmount: '',
          description: '',
          attachment: '',
          transactionDate: new Date().toISOString().split('T')[0]
        });
        setFormErrors({});
        setFileUploaded(false);
        setUploadedFileName('');
        fetchEmployeeCashData();
        alert('تم إضافة العهدة بنجاح');
      } else {
        const errorData = await response.json();
        alert(`خطأ: ${errorData.error || 'حدث خطأ أثناء إضافة العهدة'}`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('حدث خطأ أثناء إضافة العهدة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearch = () => {
    fetchEmployeeCashData();
  };

  // Export data function
  const exportedData = async () => {
    const queryParams = new URLSearchParams();
    if (filters.employee) queryParams.append('employee', filters.employee);
    if (filters.fromDate) queryParams.append('fromDate', filters.fromDate);
    if (filters.toDate) queryParams.append('toDate', filters.toDate);
    queryParams.append('limit', '10000'); // Get all records for export

    const response = await fetch(`/api/employee-cash?${queryParams}`);
    const result = await response.json();
    return result;
  };

  // Export to PDF
  const exportToPDF = async () => {
    try {
      const dataToExport = await exportedData();
      const doc = new jsPDF({ orientation: "landscape" });
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      // Load logo
      const logo = await fetch('https://recruitmentrawaes.sgp1.cdn.digitaloceanspaces.com/coloredlogo.png');
      const logoBuffer = await logo.arrayBuffer();
      const logoBytes = new Uint8Array(logoBuffer);
      const logoBase64 = Buffer.from(logoBytes).toString('base64');

      try {
        doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);
        const response = await fetch('/fonts/Amiri-Regular.ttf');
        if (!response.ok) throw new Error('Failed to fetch font');
        const fontBuffer = await response.arrayBuffer();
        const fontBytes = new Uint8Array(fontBuffer);
        const fontBase64 = Buffer.from(fontBytes).toString('base64');

        doc.addFileToVFS('Amiri-Regular.ttf', fontBase64);
        doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
        doc.setFont('Amiri', 'normal');
      } catch (error) {
        console.error('Error loading Amiri font:', error);
        return;
      }

      doc.setLanguage('ar');
      doc.setFontSize(16);
      doc.text("كشف حساب عهدة الموظفين", 400, 10, { align: 'right', maxWidth: 700 });

      // Helper function to truncate text
      const truncateToTwoWords = (text: string): string => {
        if (!text || text === 'غير متوفر') return text;
        const words = text.trim().split(/\s+/);
        if (words.length <= 2) return text;
        return words.slice(0, 2).join(' ');
      };

      const tableColumn = [
        '#',
        'التاريخ',
        'اسم الموظف',
        'رقم العهدة',
        'المبلغ المستلم',
        'المصروف',
        'الرصيد المتبقي'
      ];

      // Flatten all transactions from all employees
      const allTransactions = dataToExport.employees?.flatMap((emp: Employee) => emp.transactions) || [];
      
      const tableRows = allTransactions.map((transaction: Transaction, index: number) => [
        (index + 1).toString(),
        truncateToTwoWords(transaction.date || 'غير متوفر'),
        truncateToTwoWords(transaction.employeeName || 'غير متوفر'),
        truncateToTwoWords(transaction.cashNumber || 'غير متوفر'),
        transaction.receivedAmount?.toLocaleString() || '0',
        transaction.expenseAmount?.toLocaleString() || '0',
        transaction.remainingBalance?.toLocaleString() || '0',
      ]);

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        styles: {
          font: 'Amiri',
          halign: 'right',
          fontSize: 10,
          cellPadding: 2,
          textColor: [0, 0, 0],
        },
        headStyles: {
          fillColor: [26, 77, 79],
          textColor: [255, 255, 255],
          overflow: 'hidden',
          halign: 'right',
        },
        columnStyles: {
          0: { cellWidth: 'auto', overflow: 'hidden' },
          1: { cellWidth: 'auto', overflow: 'hidden' },
          2: { cellWidth: 'auto', overflow: 'hidden' },
          3: { cellWidth: 'auto', overflow: 'hidden' },
          4: { cellWidth: 'auto', overflow: 'hidden' },
          5: { cellWidth: 'auto', overflow: 'hidden' },
          6: { cellWidth: 'auto', overflow: 'hidden' },
        },
        margin: { top: 40, right: 10, left: 10 },
        didDrawPage: (data: any) => {
          const pageHeight = doc.internal.pageSize.height;
          const pageWidth = doc.internal.pageSize.width;

          // Add logo on each page
          doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);

          // Add title on first page only
          if (doc.getCurrentPageInfo().pageNumber === 1) {
            doc.setFontSize(12);
            doc.setFont('Amiri', 'normal');
            doc.text('كشف حساب عهدة الموظفين', pageWidth / 2, 20, { align: 'right' });
          }

          // Footer
          doc.setFontSize(10);
          doc.setFont('Amiri', 'normal');

          doc.text(userName, 10, pageHeight - 10, { align: 'left' });

          const pageNumber = `صفحة ${doc.getCurrentPageInfo().pageNumber}`;
          doc.text(pageNumber, pageWidth / 2, pageHeight - 10, { align: 'center' });

          const dateText =
            "التاريخ: " +
            new Date().toLocaleDateString('ar-EG', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }) +
            "  الساعة: " +
            new Date().toLocaleTimeString('ar-EG', {
              hour: '2-digit',
              minute: '2-digit',
            });
          doc.text(dateText, pageWidth - 10, pageHeight - 10, { align: 'right' });
        },
        didParseCell: (data: any) => {
          data.cell.styles.halign = 'right';
        },
      });

      doc.save('employee_cash.pdf');
      
      // Log export action
      try {
        await fetch('/api/accounting-logs/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exportType: 'employee_cash',
            reportType: 'كشف حساب الموظفين',
            format: 'pdf',
            filters: { employee: filters.employee, fromDate: filters.fromDate, toDate: filters.toDate },
            recordCount: dataToExport.length
          })
        });
      } catch (error) {
        console.error('Error logging export:', error);
      }
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('حدث خطأ أثناء تصدير PDF');
    }
  };

  // Export to Excel
  const exportToExcel = async () => {
    try {
      const dataToExport = await exportedData();
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('كشف حساب عهدة الموظفين', { properties: { defaultColWidth: 20 } });

      worksheet.columns = [
        { header: '#', key: 'index', width: 10 },
        { header: 'التاريخ', key: 'date', width: 15 },
        { header: 'اسم الموظف', key: 'employeeName', width: 20 },
        { header: 'رقم العهدة', key: 'cashNumber', width: 15 },
        { header: 'المبلغ المستلم', key: 'receivedAmount', width: 15 },
        { header: 'المصروف', key: 'expenseAmount', width: 15 },
        { header: 'الرصيد المتبقي', key: 'remainingBalance', width: 15 },
      ];

      worksheet.getRow(1).font = { name: 'Amiri', size: 12 };
      worksheet.getRow(1).alignment = { horizontal: 'right' };

      // Flatten all transactions from all employees
      const allTransactions = dataToExport.employees?.flatMap((emp: Employee) => emp.transactions) || [];

      allTransactions.forEach((transaction: Transaction, index: number) => {
        const row = worksheet.addRow({
          index: index + 1,
          date: transaction.date || 'غير متوفر',
          employeeName: transaction.employeeName || 'غير متوفر',
          cashNumber: transaction.cashNumber || 'غير متوفر',
          receivedAmount: transaction.receivedAmount || 0,
          expenseAmount: transaction.expenseAmount || 0,
          remainingBalance: transaction.remainingBalance || 0,
        });
        row.alignment = { horizontal: 'right' };
      });

      // Add summary row
      if (dataToExport.summary) {
        worksheet.addRow({});
        const summaryRow = worksheet.addRow({
          index: '',
          date: '',
          employeeName: '',
          cashNumber: '',
          receivedAmount: dataToExport.summary.totalReceived || 0,
          expenseAmount: dataToExport.summary.totalExpenses || 0,
          remainingBalance: dataToExport.summary.totalRemaining || 0,
        });
        summaryRow.font = { bold: true };
        summaryRow.alignment = { horizontal: 'right' };
        
        // Add label row
        const labelRow = worksheet.addRow({
          index: '',
          date: '',
          employeeName: 'الإجمالي',
          cashNumber: '',
          receivedAmount: '',
          expenseAmount: '',
          remainingBalance: '',
        });
        labelRow.font = { bold: true };
        labelRow.alignment = { horizontal: 'right' };
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'employee_cash.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
      
      // Log export action
      try {
        await fetch('/api/accounting-logs/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exportType: 'employee_cash',
            reportType: 'كشف حساب الموظفين',
            format: 'excel',
            filters: { employee: filters.employee, fromDate: filters.fromDate, toDate: filters.toDate },
            recordCount: dataToExport.length
          })
        });
      } catch (error) {
        console.error('Error logging export:', error);
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('حدث خطأ أثناء تصدير Excel');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  return (<Layout>
<Head>
  <title>كشف حساب عهدة الموظفين</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</Head>
<div className={`min-h-screen bg-gray-50 ${Style['tajawal-regular']}`} dir="rtl">
      {/* Page Content */}
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={handleAddCash}
            className="bg-teal-800 text-white border-none rounded px-4 py-2 flex items-center gap-2 text-md cursor-pointer hover:bg-teal-700"
          >
            <span>إضافة عهدة</span>
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M4 1v6M1 4h6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <h2 className="text-3xl font-normal text-black text-right">كشف حساب عهدة الموظفين</h2>
        </div>
        
        {/* Filters Section */}
        <section className="bg-gray-50 border border-gray-300 rounded-lg p-6 mb-4">
          <div className="flex gap-6 mb-6 justify-end">
            <div className="flex flex-col gap-2 min-w-56">
              <label className="text-md text-gray-700 text-right">الموظف</label>
              <div className="relative">
                <select 
                  className="w-full bg-gray-100 border border-gray-300 rounded  text-md text-gray-500 text-right "
                  value={filters.employee}
                  onChange={(e) => setFilters({...filters, employee: e.target.value})}
                >
                  <option value="">اختر الموظف</option>
                  {data?.employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
                {/* <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none w-4 h-4" viewBox="0 0 17 17" fill="none">
                  <path d="M4 6l4.5 4.5L13 6" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg> */}
              </div>
            </div>
            
            <div className="flex flex-col gap-2 min-w-56">
              <label className="text-md text-gray-700 text-right">إلى</label>
              <div className="relative">
                <input 
                  type="date" 
                  className="w-full bg-gray-100 border border-gray-300 rounded px-4 py-2 text-md text-gray-500 text-right"
                  value={filters.toDate}
                  onChange={(e) => setFilters({...filters, toDate: e.target.value})}
                />
                {/* <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none w-4 h-4" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="3" width="12" height="11" rx="2" ry="2" stroke="#6B7280" strokeWidth="2"/>
                  <path d="M11 1v4M5 1v4M2 7h12" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"/>
                </svg> */}
              </div>
            </div>
            
            <div className="flex flex-col gap-2 min-w-56">
              <label className="text-md text-gray-700 text-right">من</label>
              <div className="relative">
                <input 
                  type="date" 
                  className="w-full bg-gray-100 border border-gray-300 rounded px-4 py-2 text-md text-gray-500 text-right"
                  value={filters.fromDate}
                  onChange={(e) => setFilters({...filters, fromDate: e.target.value})}
                />
          
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleSearch}
            className="bg-teal-800 text-white border-none rounded px-4 py-2 text-md cursor-pointer"
          >
            كشف حساب
          </button>
        </section>

        {/* Results Section */}
        <section className="bg-gray-50 border border-gray-300 rounded-lg shadow-sm">
          {/* Summary Cards */}
          <div className="flex gap-8 p-6 justify-center">
            <div className="bg-gray-100 rounded-lg p-5 text-center min-w-60 shadow-sm">
              <div className="text-base text-gray-700 mb-2">إجمالي الموظفين</div>
              <div className="text-base font-normal text-gray-700 leading-8">{data?.summary.totalEmployees || 0}</div>
            </div>
            <div className="bg-gray-100 rounded-lg p-5 text-center min-w-60 shadow-sm">
              <div className="text-base text-gray-700 mb-2">إجمالي المبالغ المستلمة</div>
              <div className="text-base font-normal text-gray-700 leading-8">{data?.summary.totalReceived.toLocaleString() || '0'}</div>
            </div>
            <div className="bg-gray-100 rounded-lg p-5 text-center min-w-60 shadow-sm">
              <div className="text-base text-gray-700 mb-2">إجمالي المصروفات</div>
              <div className="text-base font-normal text-gray-700 leading-8">{data?.summary.totalExpenses.toLocaleString() || '0'}</div>
            </div>
            <div className="bg-gray-100 rounded-lg p-5 text-center min-w-60 shadow-sm">
              <div className="text-base text-gray-700 mb-2">الأرصدة المتبقية</div>
              <div className="text-base font-normal text-gray-700 leading-8">{data?.summary.totalRemaining.toLocaleString() || '0'}</div>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex justify-end items-center p-4 border-b border-gray-300">
            <div className="flex gap-2">
              <button
                onClick={exportToPDF}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-teal-800 text-white text-md font-tajawal hover:bg-teal-700"
              >
                <DocumentDownloadIcon className="w-4 h-4" />
                PDF
              </button>
              <button
                onClick={exportToExcel}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-teal-800 text-white text-md font-tajawal hover:bg-teal-700"
              >
                <TableIcon className="w-4 h-4" />
                Excel
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white">
              <thead>
                <tr>
                  <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">#</th>
                  <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">التاريخ</th>
                  <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">اسم الموظف</th>
                  <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">رقم العهدة</th>
                  <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">المبلغ المستلم</th>
                  <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">المصروف</th>
                  <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">الرصيد المتبقي</th>
                </tr>
              </thead>
              <tbody>
                {data?.employees.flatMap(emp => emp.transactions).map((transaction, index) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleEmployeeClick(transaction.id)}>
                    <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-100">#{index + 1}</td>
                    <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-100">{transaction.date}</td>
                    <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-100">{transaction.employeeName}</td>
                    <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-100">{transaction.cashNumber}</td>
                    <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-100">{transaction.receivedAmount.toLocaleString()}</td>
                    <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-100">{transaction.expenseAmount.toLocaleString()}</td>
                    <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-100">{transaction.remainingBalance.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className="p-4 text-right text-md border-b border-gray-300 bg-gray-200 font-bold text-black">الإجمالي</td>
                  <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-200 font-bold">{data?.summary.totalReceived.toLocaleString() || '0'}</td>
                  <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-200 font-bold">{data?.summary.totalExpenses.toLocaleString() || '0'}</td>
                  <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-200 font-bold">{data?.summary.totalRemaining.toLocaleString() || '0'}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      </div>

      {/* Add Cash Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-85 z-50 flex justify-center items-center" onClick={handleCloseModal}>
          <div className="bg-gray-100 rounded-xl shadow-lg p-8 w-full max-w-2xl mx-auto relative" dir="rtl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-center text-xl mb-8 text-gray-700">إضافة عهدة</h2>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col items-end">
                  <label className="text-md text-gray-500 mb-2">التاريخ</label>
                  <input 
                    type="date" 
                    value={formData.transactionDate}
                    onChange={(e) => handleFormFieldChange('transactionDate', e.target.value)}
                    className={`w-full bg-gray-50 border rounded px-4 py-2 text-base text-right ${
                      formErrors.transactionDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.transactionDate && (
                    <span className="text-red-500 text-sm mt-1">{formErrors.transactionDate}</span>
                  )}
                </div>
                
                <div className="flex flex-col items-end">
                  <label className="text-md text-gray-500 mb-2">الموظف</label>
                  <select 
                    value={formData.employeeId}
                    onChange={(e) => handleEmployeeSelectChange(e.target.value)}
                    className={`w-full bg-gray-50 border rounded   text-base text-right ${
                      formErrors.employeeId ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">اختر الموظف</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                    <option value="add_new" className="bg-teal-100 font-bold">+ إضافة موظف جديد</option>
                  </select>
                  {formErrors.employeeId && (
                    <span className="text-red-500 text-sm mt-1">{formErrors.employeeId}</span>
                  )}
                </div>
                
                <div className="flex flex-col items-end">
                  <label className="text-md text-gray-500 mb-2">رقم العهدة</label>
                  <input 
                    type="text" 
                    placeholder="ادخل رقم العهدة" 
                    value={formData.cashNumber}
                    readOnly
                    onChange={(e) => handleFormFieldChange('cashNumber', e.target.value)}
                    className={`w-full readonly bg-gray-50 border rounded px-4 py-2 text-base text-right ${
                      formErrors.cashNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.cashNumber && (
                    <span className="text-red-500 text-sm mt-1">{formErrors.cashNumber}</span>
                  )}
                </div>
                
                <div className="flex flex-col items-end">
                  <label className="text-md text-gray-500 mb-2">المبلغ المستلم</label>
                  <input 
                    type="number" 
                    placeholder="ادخل المبلغ المستلم" 
                    value={formData.receivedAmount}
                    onChange={(e) => handleFormFieldChange('receivedAmount', e.target.value ? Number(e.target.value) : '')}
                    className={`w-full bg-gray-50 border rounded px-4 py-2 text-base text-right ${
                      formErrors.receivedAmount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    min="0"
                    step="0.01"
                  />
                  {formErrors.receivedAmount && (
                    <span className="text-red-500 text-sm mt-1">{formErrors.receivedAmount}</span>
                  )}
                </div>
                
                <div className="flex flex-col items-end">
                  <label className="text-md text-gray-500 mb-2">المصروف</label>
                  <input 
                    type="number" 
                    placeholder="ادخل المصروف" 
                    value={formData.expenseAmount}
                    onChange={(e) => handleFormFieldChange('expenseAmount', e.target.value ? Number(e.target.value) : '')}
                    className={`w-full bg-gray-50 border rounded px-4 py-2 text-base text-right ${
                      formErrors.expenseAmount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    min="0"
                    step="0.01"
                  />
                  {formErrors.expenseAmount && (
                    <span className="text-red-500 text-sm mt-1">{formErrors.expenseAmount}</span>
                  )}
                </div>
                
                <div className="flex flex-col items-end">
                  <label className="text-md text-gray-500 mb-2">البيان</label>
                  <input 
                    type="text" 
                    placeholder="ادخل البيان" 
                    value={formData.description}
                    onChange={(e) => handleFormFieldChange('description', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right"
                  />
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                <label className="text-md text-gray-500 mb-2">المرفقات</label>
                <div className={`w-full border ${
                  formErrors.attachment ? 'border-red-500' : 'border-gray-300'
                } rounded p-2 flex justify-between items-center`}>
                  <span className="text-gray-500 text-sm pr-2">
                    {fileUploaded ? (
                      <div className="flex flex-col">
                        <span className="font-medium text-teal-800 text-sm mb-1">
                          {uploadedFileName || 'ملف مرفق'}
                        </span>
                        <a
                          href={formData.attachment}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 hover:underline text-xs"
                        >
                          فتح الملف
                        </a>
                      </div>
                    ) : (
                      'إرفاق ملف'
                    )}
                  </span>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    onChange={handleFileChange}
                    accept="application/pdf,image/jpeg,image/png"
                  />
                  <button 
                    type="button" 
                    onClick={handleButtonClick}
                    disabled={isSubmitting}
                    className={`px-3 py-1 rounded text-sm transition duration-200 ${
                      isSubmitting 
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                        : 'bg-teal-800 text-white hover:bg-teal-700'
                    }`}
                  >
                    اختيار ملف
                  </button>
                </div>
                {formErrors.attachment && (
                  <span className="text-red-500 text-sm mt-1">{formErrors.attachment}</span>
                )}
              </div>
              
              <div className="flex justify-center gap-4 mt-5">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="bg-white text-teal-800 border border-teal-800 rounded w-28 h-10 text-base"
                  disabled={isSubmitting}
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="bg-teal-800 text-white border-none rounded w-28 h-10 text-base disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'جاري الإضافة...' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {isAddEmployeeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-85 z-[60] flex justify-center items-center" onClick={handleCloseAddEmployeeModal}>
          <div className="bg-gray-100 rounded-xl shadow-lg p-8 w-full max-w-3xl mx-auto relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-center text-xl mb-8 text-gray-700">إضافة موظف جديد</h2>
            <form onSubmit={handleSubmitEmployee} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col items-end">
                  <label className="text-md text-gray-500 mb-2">اسم الموظف <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    placeholder="ادخل اسم الموظف" 
                    value={employeeFormData.name}
                    onChange={(e) => {
                      // Remove any numbers from the input
                      const value = e.target.value.replace(/[0-9]/g, '');
                      handleEmployeeFormFieldChange('name', value);
                    }}
                    onKeyPress={(e) => {
                      // Prevent typing numbers
                      if (/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    className={`w-full bg-gray-50 border rounded px-4 py-2 text-base text-right ${
                      employeeFormErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {employeeFormErrors.name && (
                    <span className="text-red-500 text-sm mt-1">{employeeFormErrors.name}</span>
                  )}
                </div>
                
                <div className="flex flex-col items-end">
                  <label className="text-md text-gray-500 mb-2">المنصب <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    placeholder="ادخل المنصب" 
                    value={employeeFormData.position}
                    onChange={(e) => handleEmployeeFormFieldChange('position', e.target.value)}
                    className={`w-full bg-gray-50 border rounded px-4 py-2 text-base text-right ${
                      employeeFormErrors.position ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {employeeFormErrors.position && (
                    <span className="text-red-500 text-sm mt-1">{employeeFormErrors.position}</span>
                  )}
                </div>
                
                <div className="flex flex-col items-end">
                  <label className="text-md text-gray-500 mb-2">القسم <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    placeholder="ادخل القسم" 
                    value={employeeFormData.department}
                    onChange={(e) => handleEmployeeFormFieldChange('department', e.target.value)}
                    className={`w-full bg-gray-50 border rounded px-4 py-2 text-base text-right ${
                      employeeFormErrors.department ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {employeeFormErrors.department && (
                    <span className="text-red-500 text-sm mt-1">{employeeFormErrors.department}</span>
                  )}
                </div>
                
                <div className="flex flex-col items-end">
                  <label className="text-md text-gray-500 mb-2">رقم الهاتف <span className="text-red-500">*</span></label>
                  <input 
                    type="tel" 
                    placeholder="05xxxxxxxx" 
                    value={employeeFormData.phoneNumber}
                    onChange={(e) => handleEmployeeFormFieldChange('phoneNumber', e.target.value)}
                    className={`w-full bg-gray-50 border rounded px-4 py-2 text-base text-right ${
                      employeeFormErrors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {employeeFormErrors.phoneNumber && (
                    <span className="text-red-500 text-sm mt-1">{employeeFormErrors.phoneNumber}</span>
                  )}
                </div>
                
                <div className="flex flex-col items-end">
                  <label className="text-md text-gray-500 mb-2">البريد الإلكتروني <span className="text-red-500">*</span></label>
                  <input 
                    type="email" 
                    placeholder="example@email.com" 
                    value={employeeFormData.email}
                    onChange={(e) => handleEmployeeFormFieldChange('email', e.target.value)}
                    className={`w-full bg-gray-50 border rounded px-4 py-2 text-base text-right ${
                      employeeFormErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {employeeFormErrors.email && (
                    <span className="text-red-500 text-sm mt-1">{employeeFormErrors.email}</span>
                  )}
                </div>
                
                <div className="flex flex-col items-end">
                  <label className="text-md text-gray-500 mb-2">الهوية الوطنية <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    placeholder="ادخل الهوية الوطنية" 
                    value={employeeFormData.nationalId}
                    onChange={(e) => handleEmployeeFormFieldChange('nationalId', e.target.value)}
                    className={`w-full bg-gray-50 border rounded px-4 py-2 text-base text-right ${
                      employeeFormErrors.nationalId ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {employeeFormErrors.nationalId && (
                    <span className="text-red-500 text-sm mt-1">{employeeFormErrors.nationalId}</span>
                  )}
                </div>
                
                <div className="flex flex-col items-end col-span-2">
                  <label className="text-md text-gray-500 mb-2">العنوان <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    placeholder="ادخل العنوان" 
                    value={employeeFormData.address}
                    onChange={(e) => handleEmployeeFormFieldChange('address', e.target.value)}
                    className={`w-full bg-gray-50 border rounded px-4 py-2 text-base text-right ${
                      employeeFormErrors.address ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {employeeFormErrors.address && (
                    <span className="text-red-500 text-sm mt-1">{employeeFormErrors.address}</span>
                  )}
                </div>
                
                <div className="flex flex-col items-end">
                  <label className="text-md text-gray-500 mb-2">تاريخ التوظيف <span className="text-red-500">*</span></label>
                  <input 
                    type="date" 
                    value={employeeFormData.hireDate}
                    onChange={(e) => handleEmployeeFormFieldChange('hireDate', e.target.value)}
                    className={`w-full bg-gray-50 border rounded px-4 py-2 text-base text-right ${
                      employeeFormErrors.hireDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {employeeFormErrors.hireDate && (
                    <span className="text-red-500 text-sm mt-1">{employeeFormErrors.hireDate}</span>
                  )}
                </div>
                
                <div className="flex flex-col items-end">
                  <label className="text-md text-gray-500 mb-2">الراتب <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    value={employeeFormData.salary}
                    onChange={(e) => handleEmployeeFormFieldChange('salary', e.target.value)}
                    className={`w-full bg-gray-50 border rounded px-4 py-2 text-base text-right ${
                      employeeFormErrors.salary ? 'border-red-500' : 'border-gray-300'
                    }`}
                    min="0"
                    step="0.01"
                    required
                  />
                  {employeeFormErrors.salary && (
                    <span className="text-red-500 text-sm mt-1">{employeeFormErrors.salary}</span>
                  )}
                </div>
                
                <div className="flex flex-col items-end col-span-2">
                  <label className="text-md text-gray-500 mb-2">ملاحظات</label>
                  <textarea 
                    placeholder="ادخل الملاحظات (اختياري)" 
                    value={employeeFormData.notes}
                    onChange={(e) => handleEmployeeFormFieldChange('notes', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded px-4 py-2 text-base text-right"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex justify-center gap-4 mt-5">
                <button 
                  type="button" 
                  onClick={handleCloseAddEmployeeModal}
                  className="bg-white text-teal-800 border border-teal-800 rounded w-28 h-10 text-base"
                  disabled={isSubmittingEmployee}
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="bg-teal-800 text-white border-none rounded w-28 h-10 text-base disabled:opacity-50"
                  disabled={isSubmittingEmployee}
                >
                  {isSubmittingEmployee ? 'جاري الإضافة...' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <AlertModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        type="success"
        title="نجح"
        message={modalMessage}
      />

      {/* Error Modal */}
      <AlertModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        type="error"
        title="خطأ"
        message={modalMessage}
      />

    </div>
    
</Layout>
  );
}
