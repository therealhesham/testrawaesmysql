import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  XIcon as X, 
  ReceiptTaxIcon as Receipt, 
  DocumentTextIcon as FileText, 
  SearchIcon as Search, 
  CloudUploadIcon as UploadCloud, 
  CheckCircleIcon as CheckCircle2, 
  PlusCircleIcon as PlusCircle, 
  TrashIcon as Trash2, 
  LinkIcon
} from '@heroicons/react/outline';

interface Office {
  id: number;
  office: string;
}

interface ModernAddRecordModalProps {
  offices: Office[];
  currentOfficeId: string | null;
  onClose: () => void;
  onSuccess: () => void;
  showAlert: (msg: string, type: 'success' | 'error') => void;
}

type TransactionType = 'single' | 'bulk';
type AmountType = 'credit' | 'debit';

// -- Types for Bulk --
interface BulkRecord {
  id: string;
  isContract: boolean;
  contractNumber: string;
  clientName: string;
  maidName: string;
  maidPassport: string;
  contractDate: string;
  amount: string;
  amountType: AmountType;
  description: string;
  payment: string;
}

export default function ModernAddRecordModal({
  offices,
  currentOfficeId,
  onClose,
  onSuccess,
  showAlert
}: ModernAddRecordModalProps) {
  const [transactionType, setTransactionType] = useState<TransactionType>('single');
  
  // -- Shared State --
  const [officeId, setOfficeId] = useState(currentOfficeId || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceFileName, setInvoiceFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -- Single Record State --
  const [isLinkedToContract, setIsLinkedToContract] = useState(true);
  const [contractNumber, setContractNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [maidName, setMaidName] = useState('');
  const [maidPassport, setMaidPassport] = useState('');
  const [contractDate, setContractDate] = useState('');
  const [amount, setAmount] = useState('');
  const [amountType, setAmountType] = useState<AmountType>('credit');
  const [description, setDescription] = useState('');
  const [payment, setPayment] = useState('');
  const [isSearchingContract, setIsSearchingContract] = useState(false);
  const [contractFound, setContractFound] = useState(false);
  const [contractSearchFailed, setContractSearchFailed] = useState(false);

  // -- Bulk Record State --
  const [records, setRecords] = useState<BulkRecord[]>([
    { id: '1', isContract: true, contractNumber: '', clientName: '', maidName: '', maidPassport: '', contractDate: '', amount: '', amountType: 'credit', description: '', payment: '' }
  ]);

  // Sync officeId if it changes from parent
  useEffect(() => {
    if (currentOfficeId) {
      setOfficeId(currentOfficeId);
    }
  }, [currentOfficeId]);

  // -- Helpers --
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setInvoiceFile(e.target.files[0]);
      setInvoiceFileName(e.target.files[0].name);
    }
  };

  const uploadInvoice = async (invNumberStr: string): Promise<string | null> => {
    if (!invoiceFile) return null;
    try {
      const res = await axios.get(`/api/upload-presigned-url/invoice-${invNumberStr || Date.now()}`);
      if (!res.data.url) throw new Error('Failed to get presigned URL');
      const { url, filePath } = res.data;
      await axios.put(url, invoiceFile, { headers: { 'Content-Type': invoiceFile.type } });
      return filePath;
    } catch (error) {
      throw new Error('فشل رفع ملف الفاتورة');
    }
  };

  const searchContract = async (cNumber: string, isBulkRowId?: string) => {
    if (!cNumber) return;
    if (!isBulkRowId) {
      setIsSearchingContract(true);
      setContractFound(false);
      setContractSearchFailed(false);
    }
    try {
      const res = await axios.get(`/api/contracts/${encodeURIComponent(cNumber)}`);
      
      if (res.data && res.status !== 404) {
        const contract = res.data;
        const clientFullname = contract.client?.fullname || '';
        const wName = contract.maidName || '';
        const pass = contract.passportNumber || '';
        const cDate = contract.contractDate || '';
        
        if (isBulkRowId) {
          updateRecordFields(isBulkRowId, {
            clientName: clientFullname,
            maidName: wName,
            maidPassport: pass,
            contractDate: cDate
          });
        } else {
          setClientName(clientFullname);
          setMaidName(wName);
          setMaidPassport(pass);
          setContractDate(cDate);
          setContractFound(true);
        }
        showAlert('تم جلب بيانات العقد بنجاح', 'success');
      } else {
        showAlert('لم يتم العثور على العقد. يرجى إدخال البيانات يدوياً', 'error');
        if (!isBulkRowId) {
          setContractFound(false);
          setContractSearchFailed(true);
        }
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        showAlert('لم يتم العثور على العقد. يرجى إدخال البيانات يدوياً', 'error');
      } else {
        showAlert('حدث خطأ أثناء البحث عن العقد', 'error');
      }
      if (!isBulkRowId) {
        setContractFound(false);
        setContractSearchFailed(true);
      }
    } finally {
      if (!isBulkRowId) setIsSearchingContract(false);
    }
  };

  // -- Bulk Helpers --
  const handleAddRow = () => {
    setRecords(prev => [
      ...prev,
      { id: Date.now().toString(), isContract: true, contractNumber: '', clientName: '', maidName: '', maidPassport: '', contractDate: '', amount: '', amountType: 'credit', description: '', payment: '' }
    ]);
  };
  const handleRemoveRow = (id: string) => setRecords(prev => prev.filter(r => r.id !== id));
  
  const updateRecord = (id: string, field: keyof BulkRecord, value: any) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const updateRecordFields = (id: string, updates: Partial<BulkRecord>) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };
  const bulkTotalAmount = records.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

  // -- Submission --
  const handleSubmit = async () => {
    if (!officeId || !date) {
      return showAlert('الرجاء اختيار المكتب والتاريخ', 'error');
    }

    try {
      setIsSubmitting(true);
      
      let payloadRecords = [];
      
      if (transactionType === 'single') {
        if (isLinkedToContract && !contractFound && !contractSearchFailed) {
          setIsSubmitting(false);
          return showAlert('الرجاء البحث عن رقم العقد أولاً', 'error');
        }
        if (!amount || parseFloat(amount) <= 0 || !description) {
          setIsSubmitting(false);
          return showAlert('الرجاء إدخال المبلغ والبيان', 'error');
        }
        
        let filePath = await uploadInvoice(invoiceNumber);
        
        payloadRecords = [{
          officeId: Number(officeId),
          date,
          invoiceNumber: invoiceNumber || null,
          invoice: filePath,
          clientName: isLinkedToContract ? clientName : null,
          contractNumber: isLinkedToContract ? contractNumber : null,
          maidName: isLinkedToContract ? maidName : null,
          maidPassport: isLinkedToContract ? maidPassport : null,
          contractDate: isLinkedToContract && contractDate ? contractDate : null,
          credit: amountType === 'credit' ? amount : 0,
          debit: amountType === 'debit' ? amount : 0,
          description,
          payment
        }];
        
      } else {
        // Bulk Validation
        if (!invoiceNumber) {
          setIsSubmitting(false);
          return showAlert('رقم الفاتورة إجباري في حالة الفاتورة المجمعة', 'error');
        }
        if (records.length === 0) {
          setIsSubmitting(false);
          return showAlert('يجب إضافة مطالبة واحدة على الأقل', 'error');
        }
        if (records.some(r => r.isContract && !r.contractNumber)) {
          setIsSubmitting(false);
          return showAlert('الرجاء إدخال أرقام العقود لجميع السجلات المرتبطة بعقد', 'error');
        }
        if (records.some(r => !r.amount || !r.description)) {
          setIsSubmitting(false);
          return showAlert('الرجاء تعبئة المبلغ والبيان لجميع السجلات', 'error');
        }

        let filePath = await uploadInvoice(invoiceNumber);
        
        payloadRecords = records.map(r => ({
          officeId: Number(officeId),
          date,
          invoiceNumber,
          invoice: filePath,
          clientName: r.isContract ? r.clientName : null,
          contractNumber: r.isContract ? r.contractNumber : null,
          maidName: r.isContract ? r.maidName : null,
          maidPassport: r.isContract ? r.maidPassport : null,
          contractDate: r.isContract && r.contractDate ? r.contractDate : null,
          credit: r.amountType === 'credit' ? r.amount : 0,
          debit: r.amountType === 'debit' ? r.amount : 0,
          description: r.description,
          payment: r.payment
        }));
      }

      await axios.post('/api/foreign-offices-financial', { records: payloadRecords });
      showAlert('تم حفظ السجل بنجاح', 'success');
      onSuccess();
    } catch (error: any) {
      showAlert(error.message || 'حدث خطأ أثناء الحفظ', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-gray-50 rounded-2xl w-[95vw] max-w-7xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="bg-white px-8 py-5 flex justify-between items-center border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">إضافة إدخال مالي</h2>
            <p className="text-gray-500 text-sm mt-1">قم باختيار نوع الإدخال ثم أضف التفاصيل المطلوبة بدقة</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-gray-100">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-8 overflow-y-auto flex-1 space-y-8">
          
          {/* Section 1: Transaction Type */}
          <section>
            <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
              <span className="bg-[#1A4D4F] text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
              طبيعة المعاملة
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setTransactionType('single')}
                className={`p-5 rounded-xl border-2 text-right transition-all flex gap-4 ${
                  transactionType === 'single' 
                    ? 'border-[#1A4D4F] bg-[#1A4D4F]/5 shadow-md' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className={`p-3 rounded-full h-fit ${transactionType === 'single' ? 'bg-[#1A4D4F] text-white' : 'bg-gray-100 text-gray-500'}`}>
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className={`font-bold text-lg ${transactionType === 'single' ? 'text-[#1A4D4F]' : 'text-gray-700'}`}>مطالبة فردية</div>
                  <div className="text-sm text-gray-500 mt-1">سجل واحد، مصروف عام أو إيراد سواء ارتبط بعقد أو لم يرتبط.</div>
                </div>
              </button>

              <button
                onClick={() => setTransactionType('bulk')}
                className={`p-5 rounded-xl border-2 text-right transition-all flex gap-4 ${
                  transactionType === 'bulk' 
                    ? 'border-[#1A4D4F] bg-[#1A4D4F]/5 shadow-md' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className={`p-3 rounded-full h-fit ${transactionType === 'bulk' ? 'bg-[#1A4D4F] text-white' : 'bg-gray-100 text-gray-500'}`}>
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <div className={`font-bold text-lg ${transactionType === 'bulk' ? 'text-[#1A4D4F]' : 'text-gray-700'}`}>فاتورة مجمعة</div>
                  <div className="text-sm text-gray-500 mt-1">إضافة عدة مطالبات مالية لمكتب واحد تحت رقم فاتورة واحد (Bulk).</div>
                </div>
              </button>
            </div>
          </section>

          {/* Divider */}
          <hr className="border-gray-200" />

          {/* Section 2 & 3 Combined based on Type */}
          
          {transactionType === 'single' ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section>
                <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <span className="bg-[#1A4D4F] text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                  ارتباط المعاملة
                </h3>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                  
                  {/* Common: Office Selection if not locked */}
                  <div className="flex gap-6 items-center">
                    {!currentOfficeId && (
                      <div className="flex-1">
                        <label className="block text-sm font-bold text-gray-700 mb-2">المكتب الخارجي المستهدف</label>
                        <select 
                          value={officeId} 
                          onChange={e => setOfficeId(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 bg-[position:left_0.75rem_center] pl-8"
                        >
                          <option value="">اختر المكتب...</option>
                          {offices.map(o => <option key={o.id} value={o.id}>{o.office}</option>)}
                        </select>
                      </div>
                    )}
                    {currentOfficeId && (
                      <div className="flex-1">
                        <label className="block text-sm font-bold text-gray-700 mb-2">المكتب الخارجي المستهدف</label>
                        <div className="p-3 bg-gray-100 text-gray-600 rounded-lg border border-gray-200 font-medium">
                          {offices.find(o => String(o.id) === currentOfficeId)?.office || 'مكتب محدد'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Toggle Link */}
                  <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-5 h-5 text-gray-500" />
                      <span className="font-bold text-gray-700">هل التكلفة مرتبطة بعقد استقدام محدد؟</span>
                    </div>
                    <div className="flex bg-white rounded-lg border border-gray-300 p-1">
                      <button 
                        type="button"
                        onClick={() => setIsLinkedToContract(true)}
                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${isLinkedToContract ? 'bg-[#1A4D4F] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                      >
                        نعم، مرتبطة
                      </button>
                      <button 
                        type="button"
                        onClick={() => setIsLinkedToContract(false)}
                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${!isLinkedToContract ? 'bg-gray-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                      >
                        لا، مصروف عام
                      </button>
                    </div>
                  </div>

                  {/* Contract Search if linked */}
                  {isLinkedToContract && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">رقم العقد للبحث</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={contractNumber}
                            onChange={e => setContractNumber(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                searchContract(contractNumber);
                              }
                            }}
                            placeholder="أدخل رقم العقد واضغط بحث..."
                            className="flex-1 p-3 border border-gray-300 rounded-lg"
                          />
                          <button 
                            type="button"
                            onClick={() => searchContract(contractNumber)}
                            disabled={isSearchingContract || !contractNumber}
                            className="bg-[#1A4D4F] text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
                          >
                            {isSearchingContract ? 'جاري البحث...' : <><Search className="w-5 h-5" /> بحث</>}
                          </button>
                        </div>
                      </div>

                      {/* Read-only details if found */}
                      {contractFound && (
                        <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex items-start gap-4">
                          <CheckCircle2 className="w-6 h-6 text-green-500 mt-1" />
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                            <div>
                              <div className="text-xs text-green-700 font-bold mb-1">العميل</div>
                              <div className="text-sm font-medium">{clientName || '-'}</div>
                            </div>
                            <div>
                              <div className="text-xs text-green-700 font-bold mb-1">العاملة</div>
                              <div className="text-sm font-medium">{maidName || '-'}</div>
                            </div>
                            <div>
                              <div className="text-xs text-green-700 font-bold mb-1">الجواز</div>
                              <div className="text-sm font-medium">{maidPassport || '-'}</div>
                            </div>
                            <div>
                              <div className="text-xs text-green-700 font-bold mb-1">تاريخ العقد</div>
                              <div className="text-sm font-medium">{contractDate || '-'}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Manual entry if not found */}
                      {contractSearchFailed && !contractFound && (
                        <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg animate-in fade-in mt-4">
                          <p className="text-sm text-orange-800 font-bold mb-4">لم يتم العثور على العقد. يمكنك إدخال البيانات يدوياً:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">اسم العميل</label>
                              <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm" placeholder="اسم العميل..." />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">اسم العاملة</label>
                              <input type="text" value={maidName} onChange={e => setMaidName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm" placeholder="اسم العاملة..." />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">رقم الجواز</label>
                              <input type="text" value={maidPassport} onChange={e => setMaidPassport(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm" placeholder="رقم الجواز..." />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">تاريخ العقد</label>
                              <input type="date" value={contractDate} onChange={e => setContractDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <span className="bg-[#1A4D4F] text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
                  التفاصيل المالية
                </h3>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">تاريخ الإشعار</label>
                      <input 
                        type="date" 
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">رقم الفاتورة المرجعي (اختياري)</label>
                      <input 
                        type="text" 
                        value={invoiceNumber}
                        onChange={e => setInvoiceNumber(e.target.value)}
                        placeholder="مثال: INV-1234"
                        className="w-full p-3 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">المبلغ المالي</label>
                      <div className="flex border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 ring-[#1A4D4F] focus-within:border-transparent">
                        <select
                          value={amountType}
                          onChange={e => setAmountType(e.target.value as AmountType)}
                          className="bg-gray-100 border-l border-gray-300 p-3 pl-8 bg-[position:left_0.75rem_center] font-bold text-gray-700 focus:outline-none"
                        >
                          <option value="credit">لهم (دائن)</option>
                          <option value="debit">لنا (مدين)</option>
                        </select>
                        <input 
                          type="number" 
                          value={amount}
                          onChange={e => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="flex-1 p-3 focus:outline-none"
                        />
                        <span className="p-3 text-gray-500 font-bold bg-white">$</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">مرفق الفاتورة (اختياري)</label>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                      <div className="flex gap-2">
                        <button 
                          type="button" 
                          onClick={() => fileInputRef.current?.click()} 
                          className="bg-gray-100 text-gray-700 border border-gray-300 px-4 py-3 rounded-lg flex-1 flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors font-medium text-sm"
                        >
                          <UploadCloud className="w-5 h-5" />
                          {invoiceFileName ? 'تغيير الملف' : 'استعراض المستند'}
                        </button>
                        {invoiceFileName && (
                          <div className="bg-green-50 text-green-700 border border-green-200 px-4 py-3 rounded-lg flex-1 text-sm flex items-center justify-center truncate font-medium">
                            {invoiceFileName}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">البيان (سبب المعاملة)</label>
                      <input 
                        type="text" 
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="مثال: رسوم تأشيرة، استرداد مبلغ، غرامة..."
                        className="w-full p-3 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">الدفعة (اختياري)</label>
                      <input 
                        type="text" 
                        value={payment}
                        onChange={e => setPayment(e.target.value)}
                        placeholder="مثال: الدفعة الأولى، حوالة بنكية، نقداً..."
                        className="w-full p-3 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            // --- BULK TRANSACTION VIEW ---
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section>
                <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <span className="bg-[#1A4D4F] text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                  إعدادات الفاتورة المجمعة
                </h3>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">المكتب الخارجي</label>
                    {currentOfficeId ? (
                      <div className="p-3 bg-gray-100 text-gray-600 rounded-lg border border-gray-200 font-medium">
                        {offices.find(o => String(o.id) === currentOfficeId)?.office || 'مكتب محدد'}
                      </div>
                    ) : (
                      <select 
                        value={officeId} 
                        onChange={e => setOfficeId(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 bg-[position:left_0.75rem_center] pl-8"
                      >
                        <option value="">اختر المكتب...</option>
                        {offices.map(o => <option key={o.id} value={o.id}>{o.office}</option>)}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">تاريخ الإشعار</label>
                    <input 
                      type="date" 
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      رقم الفاتورة المجمعة <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={invoiceNumber}
                      onChange={e => setInvoiceNumber(e.target.value)}
                      placeholder="إجباري"
                      className="w-full p-3 border border-gray-300 rounded-lg ring-1 ring-red-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">مرفق الفاتورة الاجمالي</label>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()} 
                      className="w-full bg-gray-100 text-gray-700 border border-gray-300 px-4 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors font-medium text-sm truncate"
                    >
                      <UploadCloud className="w-5 h-5" />
                      {invoiceFileName || 'إرفاق المستند'}
                    </button>
                  </div>
                </div>
              </section>

              <section>
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                    <span className="bg-[#1A4D4F] text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
                    جدول المطالبات الفردية
                  </h3>
                </div>
                
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
                        <tr>
                          <th className="p-3 w-40 font-bold">طبيعة المطالبة</th>
                          <th className="p-3 font-bold">رقم العقد والبحث</th>
                          <th className="p-3 font-bold">اسم العميل / العاملة</th>
                          <th className="p-3 font-bold">الجواز / تاريخ العقد</th>
                          <th className="p-3 w-48 font-bold">المبلغ ($)</th>
                          <th className="p-3 font-bold">البيان</th>
                          <th className="p-3 font-bold">الدفعة (اختياري)</th>
                          <th className="p-3 w-16 text-center font-bold">إجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {records.map((r) => (
                          <tr key={r.id} className="hover:bg-gray-50/50">
                            <td className="p-3 align-top">
                              <select 
                                value={r.isContract ? 'contract' : 'general'} 
                                onChange={e => updateRecord(r.id, 'isContract', e.target.value === 'contract')}
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white bg-[position:left_0.5rem_center] pl-7"
                              >
                                <option value="general">مصروف عام</option>
                                <option value="contract">مرتبط بعقد</option>
                              </select>
                            </td>
                            <td className="p-3 align-top">
                              {r.isContract ? (
                                <div className="flex gap-2">
                                  <input 
                                    type="text" 
                                    value={r.contractNumber}
                                    onChange={e => updateRecord(r.id, 'contractNumber', e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        searchContract(r.contractNumber, r.id);
                                      }
                                    }}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                                    placeholder="رقم العقد..."
                                  />
                                  <button 
                                    type="button"
                                    onClick={() => searchContract(r.contractNumber, r.id)}
                                    className="bg-gray-200 px-3 rounded-lg hover:bg-gray-300 transition-colors"
                                  >
                                    <Search className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-sm flex items-center h-10 px-2 bg-gray-50 rounded-lg border border-dashed border-gray-200">غير مطلوب</span>
                              )}
                            </td>
                            <td className="p-3 align-top min-w-[150px]">
                              {r.isContract ? (
                                <div className="flex flex-col gap-2">
                                  <input 
                                    type="text" 
                                    value={r.clientName}
                                    onChange={e => updateRecord(r.id, 'clientName', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                                    placeholder="اسم العميل..."
                                  />
                                  <input 
                                    type="text" 
                                    value={r.maidName}
                                    onChange={e => updateRecord(r.id, 'maidName', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                                    placeholder="اسم العاملة..."
                                  />
                                </div>
                              ) : (
                                <span className="text-gray-400 text-sm flex items-center h-10 px-2 bg-gray-50 rounded-lg border border-dashed border-gray-200">غير مطلوب</span>
                              )}
                            </td>
                            <td className="p-3 align-top min-w-[150px]">
                              {r.isContract ? (
                                <div className="flex flex-col gap-2">
                                  <input 
                                    type="text" 
                                    value={r.maidPassport}
                                    onChange={e => updateRecord(r.id, 'maidPassport', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                                    placeholder="رقم الجواز..."
                                  />
                                  <input 
                                    type="date" 
                                    value={r.contractDate}
                                    onChange={e => updateRecord(r.id, 'contractDate', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                                  />
                                </div>
                              ) : (
                                <span className="text-gray-400 text-sm flex items-center h-10 px-2 bg-gray-50 rounded-lg border border-dashed border-gray-200">غير مطلوب</span>
                              )}
                            </td>
                            <td className="p-3 align-top">
                              <div className="flex border border-gray-300 rounded-lg overflow-hidden bg-white">
                                <select
                                  value={r.amountType}
                                  onChange={e => updateRecord(r.id, 'amountType', e.target.value)}
                                  className="bg-gray-100 border-l border-gray-300 p-2 pl-6 bg-[position:left_0.25rem_center] text-xs font-bold focus:outline-none"
                                >
                                  <option value="credit">دائن</option>
                                  <option value="debit">مدين</option>
                                </select>
                                <input 
                                  type="number" 
                                  value={r.amount}
                                  onChange={e => updateRecord(r.id, 'amount', e.target.value)}
                                  className="w-full p-2 text-sm focus:outline-none"
                                  placeholder="0.00"
                                />
                              </div>
                            </td>
                            <td className="p-3 align-top">
                              <input 
                                type="text" 
                                value={r.description}
                                onChange={e => updateRecord(r.id, 'description', e.target.value)}
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                                placeholder="رسوم، عمولة..."
                              />
                            </td>
                            <td className="p-3 align-top">
                              <input 
                                type="text" 
                                value={r.payment}
                                onChange={e => updateRecord(r.id, 'payment', e.target.value)}
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                                placeholder="الدفعة الأولى، نقداً..."
                              />
                            </td>
                            <td className="p-3 align-top text-center">
                              <button 
                                type="button" 
                                onClick={() => handleRemoveRow(r.id)}
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors mt-0.5 disabled:opacity-30 disabled:hover:bg-transparent"
                                disabled={records.length === 1}
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                    <button 
                      onClick={handleAddRow}
                      className="flex items-center gap-2 text-[#1A4D4F] font-bold bg-[#1A4D4F]/10 px-4 py-2 rounded-lg hover:bg-[#1A4D4F]/20 transition-colors"
                    >
                      <PlusCircle className="w-5 h-5" /> إضافة مطالبة
                    </button>
                    <div className="text-lg font-bold text-gray-800 flex gap-4">
                      <span>إجمالي الفاتورة:</span>
                      <span className="text-[#1A4D4F]">${bulkTotalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-white border-t border-gray-200 px-8 py-5 flex items-center justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[#1A4D4F] text-white px-10 py-2.5 rounded-lg font-bold hover:bg-[#13393b] transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-[#1A4D4F]/20"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                جاري الحفظ...
              </>
            ) : (
              'حفظ وإعتماد'
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
