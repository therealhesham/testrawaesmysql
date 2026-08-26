import React, { useState, useRef } from 'react';
import axios from 'axios';

interface Office {
  id: number;
  office: string;
}

interface BulkRecord {
  id: string; // for rendering
  isContract: boolean;
  contractNumber: string;
  clientName: string;
  maidName: string;
  maidPassport: string;
  contractDate: string;
  amount: string; // usually credit for the external office (debt on us)
  description: string;
}

interface BulkAddRecordTabProps {
  offices: Office[];
  onSuccess: () => void;
  showAlert: (msg: string, type: 'success' | 'error') => void;
}

export default function BulkAddRecordTab({ offices, onSuccess, showAlert }: BulkAddRecordTabProps) {
  const [officeId, setOfficeId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceFileName, setInvoiceFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [records, setRecords] = useState<BulkRecord[]>([
    { id: '1', isContract: true, contractNumber: '', clientName: '', maidName: '', maidPassport: '', contractDate: '', amount: '', description: '' }
  ]);

  const handleAddRow = () => {
    setRecords([
      ...records,
      { id: Date.now().toString(), isContract: true, contractNumber: '', clientName: '', maidName: '', maidPassport: '', contractDate: '', amount: '', description: '' }
    ]);
  };

  const handleRemoveRow = (id: string) => {
    setRecords(records.filter(r => r.id !== id));
  };

  const updateRecord = (id: string, field: keyof BulkRecord, value: any) => {
    setRecords(records.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleContractSearch = async (id: string, contractNumber: string) => {
    if (!contractNumber) return;
    try {
      const res = await axios.get(`/api/external-offices-contracts?search=${contractNumber}`);
      if (res.data.success && res.data.contracts.length > 0) {
        const contract = res.data.contracts[0];
        updateRecord(id, 'clientName', contract.ClientName || '');
        updateRecord(id, 'maidName', contract.WorkerName || '');
        updateRecord(id, 'maidPassport', contract.PassportNo || '');
        updateRecord(id, 'contractDate', contract.ContractDate ? new Date(contract.ContractDate).toISOString().split('T')[0] : '');
      } else {
        showAlert(`لم يتم العثور على عقد برقم ${contractNumber}`, 'error');
      }
    } catch (error) {
      showAlert('حدث خطأ أثناء البحث عن العقد', 'error');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setInvoiceFile(e.target.files[0]);
      setInvoiceFileName(e.target.files[0].name);
    }
  };

  const uploadInvoice = async (): Promise<string | null> => {
    if (!invoiceFile) return null;
    try {
      const res = await axios.get(`/api/upload-presigned-url/invoice-${invoiceNumber || Date.now()}`);
      if (!res.data.url) throw new Error('Failed to get presigned URL');
      const { url, filePath } = res.data;
      await axios.put(url, invoiceFile, { headers: { 'Content-Type': invoiceFile.type } });
      return filePath;
    } catch (error) {
      throw new Error('فشل رفع ملف الفاتورة');
    }
  };

  const handleSubmit = async () => {
    if (!officeId || !date) {
      showAlert('الرجاء اختيار المكتب والتاريخ', 'error');
      return;
    }

    if (records.some(r => r.isContract && !r.contractNumber)) {
      showAlert('الرجاء إدخال أرقام العقود لجميع السجلات المرتبطة بعقد', 'error');
      return;
    }

    try {
      setSubmitting(true);
      setUploading(true);
      let filePath = await uploadInvoice();
      
      const payload = records.map(r => ({
        officeId: Number(officeId),
        date,
        invoiceNumber,
        invoice: filePath,
        clientName: r.isContract ? r.clientName : null,
        contractNumber: r.isContract ? r.contractNumber : null,
        maidName: r.isContract ? r.maidName : null,
        maidPassport: r.isContract ? r.maidPassport : null,
        contractDate: r.isContract && r.contractDate ? r.contractDate : null,
        credit: r.amount || 0,
        debit: 0,
        description: r.description
      }));

      await axios.post('/api/foreign-offices-financial', { records: payload });
      showAlert('تم حفظ الفاتورة بنجاح', 'success');
      onSuccess();
    } catch (error: any) {
      showAlert(error.message || 'حدث خطأ أثناء الحفظ', 'error');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const totalAmount = records.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* Shared Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-md border border-gray-200">
        <div>
          <label className="block text-sm font-bold mb-1">المكتب الخارجي</label>
          <select 
            value={officeId} 
            onChange={e => setOfficeId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="">اختر المكتب</option>
            {offices.map(o => <option key={o.id} value={o.id}>{o.office}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">التاريخ</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">رقم الفاتورة المجمعة (اختياري)</label>
          <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="w-full p-2 border border-gray-300 rounded" placeholder="مثال: INV-0258" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">ملف الفاتورة</label>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full bg-[#1A4D4F] text-white px-4 py-2 rounded">
            {invoiceFileName ? 'تغيير الملف' : 'إرفاق ملف'}
          </button>
          {invoiceFileName && <div className="text-xs mt-1 text-green-600">{invoiceFileName}</div>}
        </div>
      </div>

      {/* Grid */}
      <div className="border border-gray-300 rounded-md overflow-hidden">
        <table className="w-full text-sm text-right">
          <thead className="bg-gray-100 border-b border-gray-300">
            <tr>
              <th className="p-3 w-32">النوع</th>
              <th className="p-3">رقم العقد / البحث</th>
              <th className="p-3">اسم العميل والعاملة</th>
              <th className="p-3 w-32">المبلغ ($)</th>
              <th className="p-3">البيان</th>
              <th className="p-3 w-16 text-center">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, index) => (
              <tr key={r.id} className="border-b border-gray-200 bg-white">
                <td className="p-3">
                  <select 
                    value={r.isContract ? 'contract' : 'general'} 
                    onChange={e => updateRecord(r.id, 'isContract', e.target.value === 'contract')}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="contract">مرتبط بعقد</option>
                    <option value="general">مصروف عام</option>
                  </select>
                </td>
                <td className="p-3">
                  {r.isContract ? (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={r.contractNumber}
                        onChange={e => updateRecord(r.id, 'contractNumber', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                        placeholder="رقم العقد..."
                      />
                      <button 
                        type="button"
                        onClick={() => handleContractSearch(r.id, r.contractNumber)}
                        className="bg-gray-200 px-3 rounded hover:bg-gray-300"
                      >
                        بحث
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-400">غير مطلوب</span>
                  )}
                </td>
                <td className="p-3">
                  {r.isContract ? (
                    <div className="text-xs text-gray-600">
                      <div>العميل: {r.clientName || '-'}</div>
                      <div>العاملة: {r.maidName || '-'}</div>
                    </div>
                  ) : (
                    <span className="text-gray-400">غير مطلوب</span>
                  )}
                </td>
                <td className="p-3">
                  <input 
                    type="number" 
                    value={r.amount}
                    onChange={e => updateRecord(r.id, 'amount', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="0.00"
                  />
                </td>
                <td className="p-3">
                  <input 
                    type="text" 
                    value={r.description}
                    onChange={e => updateRecord(r.id, 'description', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="مثال: رسوم تأشيرة..."
                  />
                </td>
                <td className="p-3 text-center">
                  <button 
                    type="button" 
                    onClick={() => handleRemoveRow(r.id)}
                    className="text-red-500 hover:text-red-700 font-bold"
                    disabled={records.length === 1}
                  >
                    &times;
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-3 bg-gray-50 flex justify-between items-center">
          <button 
            type="button"
            onClick={handleAddRow}
            className="text-[#1A4D4F] font-bold hover:underline flex items-center gap-1"
          >
            + إضافة مطالبة (سطر جديد)
          </button>
          <div className="font-bold text-lg">
            الإجمالي: ${totalAmount.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button 
          onClick={handleSubmit}
          disabled={submitting || records.length === 0}
          className="bg-[#1A4D4F] text-white px-8 py-3 rounded-md font-bold hover:bg-[#13393b] disabled:opacity-50"
        >
          {submitting ? 'جاري الحفظ...' : `حفظ الفاتورة (${records.length} سجلات)`}
        </button>
      </div>
    </div>
  );
}
