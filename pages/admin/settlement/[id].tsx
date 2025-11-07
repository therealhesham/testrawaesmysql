import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from 'example/containers/Layout';
import Style from 'styles/Home.module.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { jwtDecode } from 'jwt-decode';
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';

interface Payment {
  id: number;
  date: string;
  paymentNumber: string;
  description: string;
  amount: number;
}

interface Expense {
  id: number;
  date: string;
  type: string;
  description: string;
  amount: number;
  paymentMethod: string;
  beneficiary: string;
}

interface ContractInfo {
  id: number;
  contractNumber: string;
  clientName: string;
  startDate: string;
  endDate: string;
  contractValue: number;
  totalPaid: number;
  totalExpenses: number;
  netAmount: number;
}

interface SettlementData {
  contract: ContractInfo;
  payments: Payment[];
  expenses: Expense[];
  summary: {
    totalPayments: number;
    totalExpenses: number;
    netAmount: number;
  };
}

export default function SettlementDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState<SettlementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'payments' | 'expenses'>('payments');
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    search: ''
  });
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token) as any;
        setUserName(decoded.username || '');
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchSettlementData();
    }
  }, [id, filters]);

  const fetchSettlementData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.fromDate) queryParams.append('fromDate', filters.fromDate);
      if (filters.toDate) queryParams.append('toDate', filters.toDate);
      if (filters.search) queryParams.append('search', filters.search);

      const response = await fetch(`/api/settlement/${id}?${queryParams}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching settlement data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilters({
      fromDate: '',
      toDate: '',
      search: ''
    });
  };
function getDate(date: string) {
  if (!date) return null;
  const currentDate = new Date(date);
  const formatted = currentDate.getDate() + '/' + (currentDate.getMonth() + 1) + '/' + currentDate.getFullYear();
  return formatted;
}

  const formatCurrency = (amount) => {
    return amount;
  };

  const formatDate = (date: string) => {
    return getDate(date);
  };

  const exportToPDF = async () => {
    if (!data) return;

    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // تحميل الشعار
    try {
      const logo = await fetch('https://recruitmentrawaes.sgp1.cdn.digitaloceanspaces.com/coloredlogo.png');
      const logoBuffer = await logo.arrayBuffer();
      const logoBytes = new Uint8Array(logoBuffer);
      const logoBase64 = Buffer.from(logoBytes).toString('base64');

      // تحميل خط أميري
      const response = await fetch('/fonts/Amiri-Regular.ttf');
      if (!response.ok) throw new Error('Failed to fetch font');
      const fontBuffer = await response.arrayBuffer();
      const fontBytes = new Uint8Array(fontBuffer);
      const fontBase64 = Buffer.from(fontBytes).toString('base64');

      doc.addFileToVFS('Amiri-Regular.ttf', fontBase64);
      doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
      doc.setFont('Amiri', 'normal');

      doc.setLanguage('ar');
      
      // إضافة اللوجو
      doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);

      // العنوان
      doc.setFontSize(16);
      doc.text(`عقد #${data.contract.contractNumber}`, pageWidth / 2, 20, { align: 'right' });
      doc.setFontSize(12);
      doc.text(`العميل: ${data.contract.clientName}`, pageWidth - 10, 35, { align: 'right' });

      if (activeTab === 'payments') {
        const tableColumn = ['المبلغ', 'الوصف', 'رقم الدفعة', 'تاريخ العملية', '#'];
        const tableRows = data.payments.map((payment, index) => [
          formatCurrency(payment.amount),
          payment.description || 'غير متوفر',
          payment.paymentNumber || 'غير متوفر',
          formatDate(payment.date),
          `#${index + 1}`
        ]);

        // إضافة صف الإجمالي
        tableRows.push([
          formatCurrency(data.summary.totalPayments),
          'الإجمالي',
          '',
          '',
          ''
        ]);

        doc.autoTable({
          head: [tableColumn],
          body: tableRows,
          startY: 45,
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
            halign: 'right',
          },
          margin: { top: 45, right: 10, left: 10 },
          didDrawPage: (tableData: any) => {
            const pageHeight = doc.internal.pageSize.height;
            const pageWidth = doc.internal.pageSize.width;

            doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);

            if (doc.getCurrentPageInfo().pageNumber === 1) {
              doc.setFontSize(16);
              doc.setFont('Amiri', 'normal');
              doc.text(`عقد #${data.contract.contractNumber}`, pageWidth / 2, 20, { align: 'right' });
            }

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
          didParseCell: (cellData: any) => {
            cellData.cell.styles.halign = 'right';
          },
        });
      } else {
        const tableColumn = ['المستفيد', 'طريقة الدفع', 'المبلغ', 'الوصف', 'النوع', 'التاريخ', '#'];
        const tableRows = data.expenses.map((expense, index) => [
          expense.beneficiary || 'غير متوفر',
          expense.paymentMethod || 'غير متوفر',
          formatCurrency(expense.amount),
          expense.description || 'غير متوفر',
          expense.type || 'غير متوفر',
          formatDate(expense.date),
          `#${index + 1}`
        ]);

        // إضافة صف الإجمالي
        tableRows.push([
          '',
          '',
          formatCurrency(data.summary.totalExpenses),
          'الإجمالي',
          '',
          '',
          ''
        ]);

        doc.autoTable({
          head: [tableColumn],
          body: tableRows,
          startY: 45,
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
            halign: 'right',
          },
          margin: { top: 45, right: 10, left: 10 },
          didDrawPage: (tableData: any) => {
            const pageHeight = doc.internal.pageSize.height;
            const pageWidth = doc.internal.pageSize.width;

            doc.addImage(logoBase64, 'PNG', pageWidth - 40, 10, 25, 25);

            if (doc.getCurrentPageInfo().pageNumber === 1) {
              doc.setFontSize(16);
              doc.setFont('Amiri', 'normal');
              doc.text(`عقد #${data.contract.contractNumber}`, pageWidth / 2, 20, { align: 'right' });
            }

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
          didParseCell: (cellData: any) => {
            cellData.cell.styles.halign = 'right';
          },
        });
      }

      doc.save(`settlement_${data.contract.contractNumber}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  const exportToExcel = async () => {
    if (!data) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(
      activeTab === 'payments' ? 'المدفوعات' : 'المصروفات',
      { properties: { defaultColWidth: 20 } }
    );

    if (activeTab === 'payments') {
      worksheet.columns = [
        { header: '#', key: 'index', width: 10 },
        { header: 'تاريخ العملية', key: 'date', width: 15 },
        { header: 'رقم الدفعة', key: 'paymentNumber', width: 15 },
        { header: 'الوصف', key: 'description', width: 30 },
        { header: 'المبلغ', key: 'amount', width: 15 },
      ];

      worksheet.getRow(1).font = { name: 'Amiri', size: 12 };
      worksheet.getRow(1).alignment = { horizontal: 'right' };

      data.payments.forEach((payment, index) => {
        worksheet.addRow({
          index: index + 1,
          date: formatDate(payment.date),
          paymentNumber: payment.paymentNumber || 'غير متوفر',
          description: payment.description || 'غير متوفر',
          amount: payment.amount,
        }).alignment = { horizontal: 'right' };
      });

      // إضافة صف الإجمالي
      const totalRow = worksheet.addRow({
        index: '',
        date: '',
        paymentNumber: '',
        description: 'الإجمالي',
        amount: data.summary.totalPayments,
      });
      totalRow.alignment = { horizontal: 'right' };
      totalRow.font = { bold: true };
    } else {
      worksheet.columns = [
        { header: '#', key: 'index', width: 10 },
        { header: 'التاريخ', key: 'date', width: 15 },
        { header: 'النوع', key: 'type', width: 15 },
        { header: 'الوصف', key: 'description', width: 30 },
        { header: 'المبلغ', key: 'amount', width: 15 },
        { header: 'طريقة الدفع', key: 'paymentMethod', width: 15 },
        { header: 'المستفيد', key: 'beneficiary', width: 20 },
      ];

      worksheet.getRow(1).font = { name: 'Amiri', size: 12 };
      worksheet.getRow(1).alignment = { horizontal: 'right' };

      data.expenses.forEach((expense, index) => {
        worksheet.addRow({
          index: index + 1,
          date: formatDate(expense.date),
          type: expense.type || 'غير متوفر',
          description: expense.description || 'غير متوفر',
          amount: expense.amount,
          paymentMethod: expense.paymentMethod || 'غير متوفر',
          beneficiary: expense.beneficiary || 'غير متوفر',
        }).alignment = { horizontal: 'right' };
      });

      // إضافة صف الإجمالي
      const totalRow = worksheet.addRow({
        index: '',
        date: '',
        type: '',
        description: 'الإجمالي',
        amount: data.summary.totalExpenses,
        paymentMethod: '',
        beneficiary: '',
      });
      totalRow.alignment = { horizontal: 'right' };
      totalRow.font = { bold: true };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `settlement_${data.contract.contractNumber}_${activeTab === 'payments' ? 'payments' : 'expenses'}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">جاري التحميل...</div>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">لم يتم العثور على بيانات التسوية</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={`min-h-screen bg-gray-50 ${Style['tajawal-regular']}`} dir="rtl">
        {/* Page Content */}
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-normal text-black text-right">
              عقد #{data.contract.contractNumber}
            </h2>
          </div>
          
          {/* Contract Info */}
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 mb-6">
            <div className="flex justify-center items-center gap-10">
              <div className="flex flex-col items-center gap-2 min-w-50">
                <span className="text-xl font-medium text-gray-700">تاريخ نهاية العقد</span>
                <span className="text-xl font-normal text-gray-700">{formatDate(data.contract.endDate)}</span>
              </div>
              <div className="flex flex-col items-center gap-2 min-w-50">
                <span className="text-xl font-medium text-gray-700">تاريخ بداية العقد</span>
                <span className="text-xl font-normal text-gray-700">{formatDate(data.contract.startDate)}</span>
              </div>
              <div className="flex flex-col items-center gap-2 min-w-50">
                <span className="text-xl font-medium text-gray-700">العميل</span>
                <span className="text-xl font-normal text-gray-700">{data.contract.clientName}</span>
              </div>
            </div>
          </div>
          
          {/* Financial Summary */}
          <div className="flex gap-8 p-6 justify-center mb-6">
            <div className="bg-white  rounded-lg p-5 text-center min-w-60 shadow-sm">
              <div className="text-base text-gray-700 mb-2">قيمة العقد</div>
              <div className="text-base font-normal text-gray-700 leading-8">
                {formatCurrency(data.contract.contractValue)}
              </div>
            </div>
            <div className="bg-white  rounded-lg p-5 text-center min-w-60 shadow-sm">
              <div className="text-base text-gray-700 mb-2">المدفوع</div>
              <div className="text-base font-normal text-gray-700 leading-8">
                {formatCurrency(data.contract.totalPaid)}
              </div>
            </div>
            <div className="bg-white  rounded-lg p-5 text-center min-w-60 shadow-sm">
              <div className="text-base text-gray-700 mb-2">المصروف</div>
              <div className="text-base font-normal text-gray-700 leading-8">
                {formatCurrency(data.contract.totalExpenses)}
              </div>
            </div>
            <div className="bg-white  rounded-lg p-5 text-center min-w-60 shadow-sm">
              <div className="text-base text-gray-700 mb-2">الصافي</div>
              <div className="text-base font-normal text-gray-700 leading-8">
                {formatCurrency(data.contract.netAmount)}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4 mb-8 border-b border-gray-300">
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-6 py-3 text-base font-normal border-b-2 transition-colors ${
                activeTab === 'payments'
                  ? 'text-teal-800 border-teal-800'
                  : 'text-gray-500 border-transparent'
              }`}
            >
              <span className="mr-2">{data.payments.length}</span>
              المدفوعات
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-6 py-3 text-base font-normal border-b-2 transition-colors ${
                activeTab === 'expenses'
                  ? 'text-teal-800 border-teal-800'
                  : 'text-gray-500 border-transparent'
              }`}
            >
              <span className="mr-2">{data.expenses.length}</span>
              المصروفات
            </button>
          </div>

          {/* Filters Section */}
          <section className="bg-gray-50 border border-gray-300 rounded-lg p-6 mb-4">
            <div className="flex gap-8 mb-6 justify-start"  >
             <div className="flex flex-col gap-2 min-w-56">
                  <label className="text-md text-gray-500 text-right">بحث</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      className="w-full bg-white  border border-gray-300 rounded px-4 py-2 text-base text-gray-500 text-right pr-11 h-11"
                      placeholder="بحث"
                      value={filters.search}
                      onChange={(e) => setFilters({...filters, search: e.target.value})}
                    />
                    <svg 
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <circle cx="11" cy="11" r="8"/>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                  </div>
                </div>
                <div className="flex flex-col gap-2 min-w-56" >
                  <label className="text-md text-gray-500 text-right">من</label>
                  <input 
                    type="date" 
                    className="w-full bg-white  border border-gray-300 rounded px-4 py-2 text-base text-gray-500 text-right h-11"
                    value={filters.fromDate}
                    onChange={(e) => setFilters({...filters, fromDate: e.target.value})}
                  />
                </div>
                

              <div className="flex gap-4">
                <div className="flex flex-col gap-2 min-w-56">
                  <label className="text-md text-gray-500 text-right">الى</label>
                  <input 
                    type="date" 
                    className="w-full bg-white  border border-gray-300 rounded px-4 py-2 text-base text-gray-500 text-right h-11"
                    value={filters.toDate}
                    onChange={(e) => setFilters({...filters, toDate: e.target.value})}
                  />
                </div>
              <button 
                onClick={handleReset}
                className="bg-teal-800 text-white border-none rounded px-8 py-3 text-base font-medium h-11"
              >
                إعادة ضبط
              </button>
                              
              
                
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex gap-2 mb-4">
              <button
                className="flex items-center gap-1 bg-teal-800 text-white px-3 py-1 rounded text-md hover:bg-teal-700 transition duration-200"
                onClick={exportToExcel}
              >
                <FileExcelOutlined />
                <span>Excel</span>
              </button>
              <button
                className="flex items-center gap-1 bg-teal-800 text-white px-3 py-1 rounded text-md hover:bg-teal-700 transition duration-200"
                onClick={exportToPDF}
              >
                <FilePdfOutlined />
                <span>PDF</span>
              </button>
            </div>
          </section>

          {/* Data Table */}
          <section className="bg-gray-50 border border-gray-300 rounded-lg shadow-sm">
            <div className="overflow-x-auto">
              {activeTab === 'payments' ? (
                <table className="w-full border-collapse bg-white">
                  <thead>
                    <tr>
                      <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">#</th>
                      <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">تاريخ العملية</th>
                      <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">رقم الدفعة</th>
                      <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">الوصف</th>
                      <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">المبلغ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payments.map((payment, index) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="p-4 text-center text-md border-b border-gray-300 bg-white ">
                          #{index + 1}
                        </td>
                        <td className="p-4 text-center text-md border-b border-gray-300 bg-white ">
                          {formatDate(payment.date)}
                        </td>
                        <td className="p-4 text-center text-md border-b border-gray-300 bg-white ">
                          {payment.paymentNumber}
                        </td>
                        <td className="p-4 text-center text-md border-b border-gray-300 bg-white ">
                          {payment.description}
                        </td>
                        <td className="p-4 text-center text-md border-b border-gray-300 bg-white ">
                          {formatCurrency(payment.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} className="p-4 text-right text-md border-b border-gray-300 bg-gray-200 font-bold text-black">
                        الإجمالي
                      </td>
                      <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-200 font-bold">
                        {formatCurrency(data.summary.totalPayments)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <table className="w-full border-collapse bg-white">
                  <thead>
                    <tr>
                      <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">#</th>
                      <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">التاريخ</th>
                      <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">النوع</th>
                      <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">الوصف</th>
                      <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">المبلغ</th>
                      <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">طريقة الدفع</th>
                      <th className="bg-teal-800 text-white p-4 text-center text-md font-normal">المستفيد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.expenses.map((expense, index) => (
                      <tr key={expense.id} className="hover:bg-gray-50">
                        <td className="p-4 text-center text-md border-b border-gray-300 bg-white ">
                          #{index + 1}
                        </td>
                        <td className="p-4 text-center text-md border-b border-gray-300 bg-white ">
                          {formatDate(expense.date)}
                        </td>
                        <td className="p-4 text-center text-md border-b border-gray-300 bg-white ">
                          {expense.type}
                        </td>
                        <td className="p-4 text-center text-md border-b border-gray-300 bg-white ">
                          {expense.description}
                        </td>
                        <td className="p-4 text-center text-md border-b border-gray-300 bg-white ">
                          {formatCurrency(expense.amount)}
                        </td>
                        <td className="p-4 text-center text-md border-b border-gray-300 bg-white ">
                          {expense.paymentMethod}
                        </td>
                        <td className="p-4 text-center text-md border-b border-gray-300 bg-white ">
                          {expense.beneficiary}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} className="p-4 text-right text-md border-b border-gray-300 bg-gray-200 font-bold text-black">
                        الإجمالي
                      </td>
                      <td className="p-4 text-center text-md border-b border-gray-300 bg-gray-200 font-bold">
                        {formatCurrency(data.summary.totalExpenses)}
                      </td>
                      <td colSpan={2} className="p-4 text-center text-md border-b border-gray-300 bg-gray-200"></td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
