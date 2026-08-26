import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface SettlementDetail {
  id: number;
  settledAmount: number;
  date: string;
  // If we are looking at a debit (source of funds), this is the invoice it settled
  creditRecord?: {
    id: number;
    clientName: string;
    contractNumber: string;
    description: string;
    invoiceNumber: string;
    debit: number;
    maidName?: string;
    maidPassport?: string;
  };
  // If we are looking at a credit (invoice), this is the source of funds that settled it
  debitRecord?: {
    id: number;
    clientName: string;
    contractNumber: string;
    description: string;
    credit: number;
    maidName?: string;
    maidPassport?: string;
  };
}

interface FinancialRecord {
  id: number;
  date: string;
  clientName: string;
  contractNumber: string;
  description: string;
  credit: number;
  debit: number;
  balance: number;
  invoiceNumber: string;
  debitSettlements: SettlementDetail[];
  creditSettlements: SettlementDetail[];
}

interface Props {
  recordId: number;
  onClose: () => void;
}

export default function RecordSettlementHistoryModal({ recordId, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<FinancialRecord | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/foreign-offices-financial/${recordId}/settlements`);
        setRecord(res.data.record);
      } catch (err: any) {
        setError(err.response?.data?.error || 'حدث خطأ أثناء جلب التفاصيل');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [recordId]);

  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-GB'); // dd/mm/yyyy
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
        <div className="bg-white p-8 rounded-lg shadow-xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A4D4F] mx-auto mb-4"></div>
          <p className="text-gray-600 font-bold">جاري جلب السجل بالتفصيل...</p>
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
        <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md w-full">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <p className="text-gray-800 font-bold mb-6">{error || 'السجل غير موجود'}</p>
          <button onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 rounded font-bold hover:bg-gray-300">
            إغلاق
          </button>
        </div>
      </div>
    );
  }

  // Determine the nature of the record
  // Debits (مدين) represent sources of funds (our money at the office)
  const isSourceOfFunds = Number(record.debit) > 0;
  // Credits (دائن) represent invoices (money we owe the office)
  const isInvoice = Number(record.credit) > 0;

  const relevantSettlements = isSourceOfFunds ? record.debitSettlements : record.creditSettlements;
  const totalSettled = relevantSettlements.reduce((sum, s) => sum + Number(s.settledAmount), 0);
  const originalAmount = isSourceOfFunds ? Number(record.debit) : Number(record.credit);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <div>
            <h2 className="text-2xl font-bold text-[#1A4D4F] mb-1">
              سجل تفاصيل {isSourceOfFunds ? 'المديونية' : 'الفاتورة'} ({record.invoiceNumber ? `رقم: ${record.invoiceNumber}` : `معرف: #${record.id}`})
            </h2>
            <p className="text-sm text-gray-500">
              تاريخ السجل: {formatDate(record.date)}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 text-3xl font-bold leading-none">&times;</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Record Info Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-bold mb-1">العميل</p>
                <p className="font-bold text-gray-800">{record.clientName || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold mb-1">رقم العقد</p>
                <p className="font-bold text-gray-800">{record.contractNumber || '-'}</p>
              </div>
              {record.invoiceNumber && (
                <div>
                  <p className="text-xs text-gray-500 font-bold mb-1">الفاتورة المجمعة</p>
                  <p className="font-bold text-gray-800">#{record.invoiceNumber}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 font-bold mb-1">المبلغ الأساسي</p>
                <p className="font-bold text-lg text-blue-700">${originalAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold mb-1">المبلغ الذي تم تسويته</p>
                <p className="font-bold text-lg text-green-600">${totalSettled.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold mb-1">المتبقي</p>
                <p className="font-bold text-lg text-orange-600">${(originalAmount - totalSettled).toFixed(2)}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-bold mb-1">البيان</p>
              <p className="text-sm text-gray-700">{record.description || '-'}</p>
            </div>
          </div>

          {/* Settlements Timeline */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              التفاصيل  لما حدث ({relevantSettlements.length} حركات)
            </h3>

            {relevantSettlements.length === 0 ? (
              <div className="bg-orange-50 border border-orange-100 p-4 rounded-lg text-orange-700 text-center font-bold text-sm">
                لم يتم إجراء أي تسويات على هذا السجل حتى الآن.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {relevantSettlements.map((settlement, index) => {
                  const targetRecord = isSourceOfFunds ? settlement.creditRecord : settlement.debitRecord;
                  if (!targetRecord) return null;

                  return (
                    <div key={settlement.id} className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-[#1A4D4F] text-white text-xs px-2 py-1 rounded-bl-lg font-bold">
                        #{index + 1}
                      </div>
                      <div className="flex items-center justify-between mb-3 mt-1">
                        <span className="font-bold text-lg text-green-600">
                          ${Number(settlement.settledAmount).toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-500 font-bold bg-gray-100 px-2 py-1 rounded">
                          {formatDate(settlement.date)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-700 leading-relaxed font-medium">
                        <div className="mb-2 text-xs text-gray-500">
                          {isSourceOfFunds 
                            ? 'تم خصم المبلغ من هذه المديونية لسداد جزء من الفاتورة المستحقة:'
                            : 'تم سداد هذا الجزء من الفاتورة عن طريق السحب من المديونية التالية:'}
                        </div>
                        <ul className="list-none space-y-1.5 text-gray-600 border-r-2 border-[#1A4D4F]/20 pr-2">
                          <li>
                            <span className="text-gray-400 text-xs">العميل:</span> <span className="font-bold text-[#1A4D4F]">{targetRecord.clientName || 'مصروف عام'}</span>
                          </li>
                          <li>
                            <span className="text-gray-400 text-xs">رقم العقد:</span> <span className="font-bold text-gray-800">{targetRecord.contractNumber || '-'}</span>
                          </li>
                          <li>
                            <span className="text-gray-400 text-xs">اسم العاملة:</span> <span className="font-bold text-gray-800">{targetRecord.maidName || '-'}</span>
                          </li>
                          <li>
                            <span className="text-gray-400 text-xs">رقم الجواز:</span> <span className="font-bold text-gray-800">{targetRecord.maidPassport || '-'}</span>
                          </li>
                          {isSourceOfFunds && 'invoiceNumber' in targetRecord && targetRecord.invoiceNumber && (
                            <li>
                              <span className="text-gray-400 text-xs">الفاتورة المجمعة:</span> <span className="font-bold text-gray-800">#{targetRecord.invoiceNumber}</span>
                            </li>
                          )}
                          {!isSourceOfFunds && (
                            <li>
                              <span className="text-gray-400 text-xs">البيان:</span> <span className="font-bold text-gray-800">{targetRecord.description || '-'}</span>
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-100 flex justify-between items-center rounded-b-lg">
          <div className="flex gap-4">
            <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
              <span className="text-xs text-gray-500 font-bold block mb-0.5">الإجمالي المستهلك</span>
              <span className="text-lg font-bold text-blue-600">${totalSettled.toFixed(2)}</span>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
              <span className="text-xs text-gray-500 font-bold block mb-0.5">الرصيد المتبقي</span>
              <span className="text-lg font-bold text-green-600">${(originalAmount - totalSettled).toFixed(2)}</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-800 text-white rounded-lg font-bold hover:bg-gray-700 transition-colors shadow-sm"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
}
