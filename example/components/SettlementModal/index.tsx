import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import axios from 'axios';
import Style from "styles/Home.module.css";

interface SettlementRecord {
  id: number;
  date: string;
  clientName: string;
  contractNumber: string;
  description: string;
  credit: number;
  debit: number;
  remaining: number;
  settledAmount: number;
  invoiceNumber?: string;
}

interface GroupedCredit {
  isGroup: true;
  id: string; // e.g. "INV-1234"
  invoiceNumber: string;
  totalRemaining: number;
  totalCredit: number;
  records: SettlementRecord[];
}

type RenderableCredit = SettlementRecord | GroupedCredit;

interface SettlementModalProps {
  officeId: number;
  officeName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SettlementModal({ officeId, officeName, onClose, onSuccess }: SettlementModalProps) {
  const [debits, setDebits] = useState<SettlementRecord[]>([]);
  const [credits, setCredits] = useState<SettlementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };
  
  const [selectedDebits, setSelectedDebits] = useState<Record<number, boolean>>({});
  const [selectedCredits, setSelectedCredits] = useState<Record<string, number>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  
  // New states for manual allocation
  const [manualDebitAllocations, setManualDebitAllocations] = useState<Record<number, number> | null>(null);
  const [showManualAllocationPanel, setShowManualAllocationPanel] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const middleBoxRef = useRef<HTMLDivElement>(null);
  const debitsContainerRef = useRef<HTMLDivElement>(null);
  const debitCardRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [svgLines, setSvgLines] = useState<{ id: number, path: string }[]>([]);

  const updateLines = useCallback(() => {
    if (!containerRef.current || !middleBoxRef.current || !debitsContainerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const middleRect = middleBoxRef.current.getBoundingClientRect();
    const debitsListRect = debitsContainerRef.current.getBoundingClientRect();
    
    const newLines: { id: number, path: string }[] = [];
    // Start from the right edge of the middle box
    const startX = middleRect.right - containerRect.left;
    const startY = middleRect.top + middleRect.height / 2 - containerRect.top;
    
    Object.entries(selectedDebits).forEach(([idStr, isSelected]) => {
      if (!isSelected) return;
      const debitId = Number(idStr);
      const debitRef = debitCardRefs.current[debitId];
      if (!debitRef) return;
      
      const debitRect = debitRef.getBoundingClientRect();
      
      // Stop rendering if card is fully scrolled out of the view (above the header or below the list)
      if (debitRect.bottom < debitsListRect.top || debitRect.top > debitsListRect.bottom) {
        return;
      }
      
      // Target the vertical center of the card's left edge
      const endX = debitRect.left - containerRect.left;
      const endY = debitRect.top + debitRect.height / 2 - containerRect.top;
      
      const offset = Math.abs(endX - startX) * 0.5;
      const path = `M ${startX} ${startY} C ${startX + offset} ${startY}, ${endX - offset} ${endY}, ${endX} ${endY}`;
      newLines.push({ id: debitId, path });
    });
    
    setSvgLines(newLines);
  }, [selectedDebits, debits]);

  useEffect(() => {
    updateLines();
    window.addEventListener('resize', updateLines);
    return () => window.removeEventListener('resize', updateLines);
  }, [updateLines]);

  useEffect(() => {
    fetchUnsettledRecords();
  }, [officeId]);

  const fetchUnsettledRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`/api/foreign-offices-financial/settlements?officeId=${officeId}`);
      setDebits(res.data.debits || []);
      setCredits(res.data.credits || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'حدث خطأ أثناء جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  const convertArabicToEnglish = (str: string) => {
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return str.replace(/[٠-٩]/g, function (w) {
      return arabicNumbers.indexOf(w).toString();
    });
  };

  const handleCreditAmountChange = (creditId: string, amount: string, maxAllowed: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const englishAmount = convertArabicToEnglish(amount);
    const val = parseFloat(englishAmount);
    
    // Calculate the absolute max allowed based on available debits
    const currentTotalOtherCredits = totalSettlementAmount - (selectedCredits[creditId] || 0);
    const availableFromDebits = totalSelectedDebitsRemaining - currentTotalOtherCredits;
    const absoluteMaxAllowed = Math.max(0, Math.min(maxAllowed, availableFromDebits));

    if (isNaN(val) || val < 0 || englishAmount === '') {
      const updated = { ...selectedCredits };
      delete updated[creditId];
      setSelectedCredits(updated);
      e.target.value = '';
    } else {
      let clampedVal = val;
      if (val > absoluteMaxAllowed) {
        clampedVal = absoluteMaxAllowed;
        if (absoluteMaxAllowed < maxAllowed) {
           showToast(`المبلغ يتجاوز رصيد المديونيات المتاح (${availableFromDebits.toFixed(2)}$)`);
        } else {
           showToast(`المبلغ يتجاوز المتبقي من الفاتورة (${maxAllowed.toFixed(2)}$)`);
        }
      }
      setSelectedCredits({ ...selectedCredits, [creditId]: clampedVal });
      if (val !== clampedVal || amount !== englishAmount) {
        e.target.value = clampedVal.toString();
      }
    }
  };

  const groupedCredits = useMemo(() => {
    const groups: Record<string, GroupedCredit> = {};
    const renderable: RenderableCredit[] = [];
    
    credits.forEach(credit => {
      if (credit.invoiceNumber) {
        if (!groups[credit.invoiceNumber]) {
          const newGroup: GroupedCredit = {
            isGroup: true,
            id: `INV-${credit.invoiceNumber}`,
            invoiceNumber: credit.invoiceNumber,
            totalRemaining: 0,
            totalCredit: 0,
            records: []
          };
          groups[credit.invoiceNumber] = newGroup;
          renderable.push(newGroup);
        }
        groups[credit.invoiceNumber].records.push(credit);
        groups[credit.invoiceNumber].totalRemaining += credit.remaining;
        groups[credit.invoiceNumber].totalCredit += credit.credit;
      } else {
        renderable.push(credit);
      }
    });
    return renderable;
  }, [credits]);

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleDebitSelection = (debitId: number) => {
    setSelectedDebits(prev => ({
      ...prev,
      [debitId]: !prev[debitId]
    }));
  };

  const selectedDebitIdsList = Object.keys(selectedDebits).filter(id => selectedDebits[Number(id)]).map(Number);
  const totalSelectedDebitsRemaining = debits
    .filter(d => selectedDebits[d.id])
    .reduce((sum, d) => sum + d.remaining, 0);

  const selectedIndices = debits.map((d, i) => selectedDebits[d.id] ? i : -1).filter(i => i !== -1);
  const firstSelectedIndex = selectedIndices.length > 0 ? selectedIndices[0] : -1;
  const lastSelectedIndex = selectedIndices.length > 0 ? selectedIndices[selectedIndices.length - 1] : -1;

  const totalSettlementAmount = Object.values(selectedCredits).reduce((sum, val) => sum + val, 0);
  const hasSelectedDebits = selectedDebitIdsList.length > 0;

  useEffect(() => {
    // إلغاء توزيع الخصم إذا قام المستخدم بإزالة المديونية وأصبح الإجمالي المتاح أقل من الموزع
    if (totalSettlementAmount > totalSelectedDebitsRemaining) {
      setSelectedCredits({});
    }
  }, [totalSelectedDebitsRemaining, totalSettlementAmount]);

  const debitAllocations = useMemo(() => {
    const allocations: Record<number, number> = {};
    let totalNeeded = totalSettlementAmount;
    
    if (manualDebitAllocations) {
      let manualSum = 0;
      // الخطوة 1: تطبيق المبالغ المدخلة يدوياً
      debits.forEach(debit => {
        if (selectedDebits[debit.id] && manualDebitAllocations[debit.id] !== undefined) {
          const requested = Math.min(debit.remaining, manualDebitAllocations[debit.id]);
          allocations[debit.id] = requested;
          manualSum += requested;
        }
      });
      
      // الخطوة 2: إذا كان المجموع اليدوي أكبر من المطلوب، نقوم بتقليله من الأحدث للأقدم
      if (manualSum > totalNeeded) {
        let overage = manualSum - totalNeeded;
        for (let i = debits.length - 1; i >= 0; i--) {
          const debitId = debits[i].id;
          if (allocations[debitId] > 0) {
            const reduceBy = Math.min(allocations[debitId], overage);
            allocations[debitId] -= reduceBy;
            overage -= reduceBy;
            if (overage <= 0) break;
          }
        }
        totalNeeded = 0;
      } else {
        totalNeeded -= manualSum;
      }
    }
    
    // الخطوة 3: التوزيع الآلي لأي مبالغ متبقية مطلوبة
    if (totalNeeded > 0) {
      // المحاولة الأولى: التوزيع على المديونيات التي لم يتم تعديلها يدوياً
      debits.forEach(debit => {
        if (selectedDebits[debit.id] && (!manualDebitAllocations || manualDebitAllocations[debit.id] === undefined)) {
          const currentAlloc = allocations[debit.id] || 0;
          const available = debit.remaining - currentAlloc;
          if (available > 0) {
            const added = Math.min(available, totalNeeded);
            allocations[debit.id] = currentAlloc + added;
            totalNeeded -= added;
          }
        }
      });
      
      // المحاولة الثانية: إذا بقي نقص، نسحب من أي مديونية متاحة (حتى لو تم تعديلها يدوياً)
      if (totalNeeded > 0) {
        debits.forEach(debit => {
          if (selectedDebits[debit.id]) {
            const currentAlloc = allocations[debit.id] || 0;
            const available = debit.remaining - currentAlloc;
            if (available > 0) {
              const added = Math.min(available, totalNeeded);
              allocations[debit.id] = currentAlloc + added;
              totalNeeded -= added;
            }
          }
        });
      }
    }
    
    return allocations;
  }, [debits, selectedDebits, totalSettlementAmount, manualDebitAllocations]);

  // Calculate simulated allocation for each credit
  const creditAllocations = useMemo(() => {
    const allocations: Record<number, number> = {};
    groupedCredits.forEach(item => {
      if ('isGroup' in item) {
        const group = item as GroupedCredit;
        if (selectedCredits[group.id]) {
          let dist = selectedCredits[group.id];
          group.records.forEach(credit => {
            const allocated = Math.min(credit.remaining, dist);
            allocations[credit.id] = allocated;
            dist -= allocated;
          });
        } else {
           group.records.forEach(credit => {
             if (selectedCredits[credit.id.toString()]) {
                allocations[credit.id] = selectedCredits[credit.id.toString()];
             }
           });
        }
      } else {
        const credit = item as SettlementRecord;
        if (selectedCredits[credit.id.toString()]) {
          allocations[credit.id] = selectedCredits[credit.id.toString()];
        }
      }
    });
    return allocations;
  }, [groupedCredits, selectedCredits]);

  const handleSubmit = async () => {
    if (!hasSelectedDebits) {
      setError('الرجاء تحديد مديونية واحدة على الأقل للتسوية.');
      return;
    }

    const settlementsPayload = Object.entries(selectedCredits)
      .filter(([_, amount]) => amount > 0)
      .map(([creditId, amount]) => ({
        creditRecordId: creditId.startsWith('INV-') ? creditId : Number(creditId),
        amount: Number(amount)
      }));

    if (settlementsPayload.length === 0) {
      setError('الرجاء تحديد المبالغ المراد تسويتها من الفواتير.');
      return;
    }

    if (totalSettlementAmount > totalSelectedDebitsRemaining) {
      setError('إجمالي مبالغ التسوية يتجاوز الرصيد المتبقي لإجمالي المديونيات المحددة.');
      return;
    }

    const exactDebitAllocations = Object.entries(debitAllocations)
      .filter(([id, amount]) => amount > 0)
      .map(([id, amount]) => ({
        id: Number(id),
        allocatedAmount: Number(amount)
      }));

    try {
      setSubmitting(true);
      setError(null);
      await axios.post('/api/foreign-offices-financial/settlements', {
        debitAllocations: exactDebitAllocations,
        settlements: settlementsPayload
      });
      onSuccess(); // Close and refresh
    } catch (err: any) {
      setError(err.response?.data?.error || 'حدث خطأ أثناء حفظ التسوية');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
      {toastMessage && (
        <div className="fixed top-6 right-6 bg-red-500 text-white px-5 py-3 rounded shadow-xl z-[100] flex items-center gap-3 text-sm font-bold opacity-100 transition-all">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {toastMessage}
        </div>
      )}
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-[#1A4D4F]">مركز تسوية الفواتير - {officeName}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 text-2xl font-bold">&times;</button>
        </div>

        {/* Body */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-gray-50 p-6 gap-6 relative"
        >
          {/* Dynamic SVG Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ minHeight: '100%' }}>
            {svgLines.map(line => (
              <path 
                key={line.id} 
                d={line.path} 
                fill="none" 
                stroke="#F87171" 
                strokeWidth="3" 
                className="transition-all duration-75"
              />
            ))}
          </svg>

          {loading ? (
            <div className="flex-1 flex justify-center items-center">جاري التحميل...</div>
          ) : (
            <>
              {/* القسم الأيمن: المديونيات */}
              <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col overflow-hidden relative">
                <div className="bg-red-50 p-4 border-b border-red-100 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                    <h3 className="text-lg font-bold text-red-800">مصدر الأموال (المديونيات المحددة)</h3>
                  </div>
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold">
                    {debits.length} سجل
                  </span>
                </div>
                <div 
                  className="flex-1 overflow-y-auto p-4" 
                  dir="ltr" 
                  ref={debitsContainerRef}
                  onScroll={updateLines}
                >
                  <div dir="rtl">
                    {debits.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">لا توجد مديونيات غير مسواة</div>
                    ) : (
                      debits.map((debit, index) => {
                      const isSelected = selectedDebits[debit.id];
                      const allocated = debitAllocations[debit.id] || 0;
                      const simulatedRemaining = debit.remaining - allocated;
                      const isFullyAllocated = isSelected && simulatedRemaining <= 0.001;

                      return (
                        <div 
                          key={debit.id} 
                          ref={(el) => { debitCardRefs.current[debit.id] = el; }}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all relative mb-4 ${isSelected ? 'border-red-500 bg-red-50 shadow-md scale-[1.02] z-10' : 'border-gray-200 hover:border-red-300 bg-white'}`}
                          onClick={() => toggleDebitSelection(debit.id)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}>
                                {isSelected && (
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                )}
                              </div>
                              <span className="font-bold text-gray-800 text-lg">{debit.clientName}</span>
                            </div>
                            <span className={`font-bold text-lg ${isSelected ? 'text-gray-800' : 'text-red-600'}`}>${debit.remaining.toFixed(2)}</span>
                          </div>
                          <div className="text-sm text-gray-600 mb-3 mr-9">{debit.description}</div>
                          
                          <div className="mr-9">
                            {isSelected ? (
                              <div className="flex flex-col gap-1">
                                <div className="flex justify-between text-xs font-bold">
                                  <span className={isFullyAllocated ? 'text-green-600' : 'text-blue-600'}>
                                    سيُخصم: ${allocated.toFixed(2)}
                                  </span>
                                  <span className="text-gray-600">الباقي بعد السداد: ${simulatedRemaining.toFixed(2)}</span>
                                </div>
                                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all ${isFullyAllocated ? 'bg-green-500' : 'bg-blue-500'}`}
                                    style={{ width: `${(allocated / debit.remaining) * 100}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-between text-xs text-gray-500">
                                <span className="bg-white px-2 py-1 rounded border border-gray-200">عقد: {debit.contractNumber || 'لا يوجد'}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  </div>
                </div>
              </div>

              {/* القسم الأوسط: اتجاه السداد وشريط التقدم */}
              <div className="flex flex-col justify-center items-center px-2 py-4 gap-4 relative z-0">
                <div 
                  ref={middleBoxRef}
                  className="flex flex-col items-center bg-white p-4 rounded-xl border-2 border-red-200 shadow-sm w-64 text-center relative z-20 transition-all"
                >
                  <span className="text-sm text-gray-500 mb-1">الرصيد المتاح للتوزيع</span>
                  <span className="text-2xl font-bold text-gray-800">${totalSelectedDebitsRemaining.toFixed(2)}</span>
                  <div className="w-full h-2 bg-gray-100 rounded-full mt-3 overflow-hidden">
                    <div 
                      className={`h-full transition-all ${totalSettlementAmount === totalSelectedDebitsRemaining ? 'bg-green-500' : totalSettlementAmount > totalSelectedDebitsRemaining ? 'bg-red-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min((totalSettlementAmount / (totalSelectedDebitsRemaining || 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 mt-2">
                    مطلوب توزيعه: <span className="font-bold text-gray-800">${totalSettlementAmount.toFixed(2)}</span>
                  </span>

                  {hasSelectedDebits && totalSettlementAmount > 0 && (
                    <div className="w-full mt-4 pt-4 border-t border-gray-100 flex flex-col items-center">
                      <button
                        onClick={() => setShowManualAllocationPanel(!showManualAllocationPanel)}
                        className="flex items-center justify-center gap-1 text-xs font-bold text-[#1A4D4F] hover:bg-[#1A4D4F]/10 px-3 py-1.5 rounded-full transition-colors w-full"
                      >
                        <svg className={`w-4 h-4 transition-transform ${showManualAllocationPanel ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        تخصيص السحب (يدوي)
                      </button>

                      {showManualAllocationPanel && (
                        <div className="w-full mt-3 flex flex-col gap-3 text-right overflow-y-auto max-h-[300px] pr-1 scrollbar-thin scrollbar-thumb-gray-300">
                          {manualDebitAllocations && (
                             <button
                               onClick={() => setManualDebitAllocations(null)}
                               className="text-[10px] text-red-500 hover:text-white hover:bg-red-500 border border-red-500 px-2 py-1 rounded transition-colors self-end mb-1"
                             >
                               إعادة التوزيع آلياً
                             </button>
                          )}
                          {debits.filter(d => selectedDebits[d.id]).map((debit) => {
                            const val = debitAllocations[debit.id] || 0;
                            return (
                              <div key={debit.id} className="flex flex-col gap-1 bg-gray-50 p-2 rounded border border-gray-200">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-bold text-gray-700 truncate max-w-[120px]">{debit.clientName}</span>
                                  <span className="text-gray-500">${debit.remaining.toFixed(2)}</span>
                                </div>
                                <div className="flex gap-2 items-center mt-1">
                                  <input 
                                    type="range"
                                    min="0"
                                    max={debit.remaining}
                                    step="0.5"
                                    value={val}
                                    onChange={(e) => {
                                      const newVal = parseFloat(e.target.value);
                                      setManualDebitAllocations(prev => ({
                                        ...(prev || {}),
                                        [debit.id]: newVal
                                      }));
                                    }}
                                    className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1A4D4F]"
                                  />
                                  <input 
                                    type="text"
                                    inputMode="decimal"
                                    value={val || ''}
                                    onChange={(e) => {
                                      const amount = e.target.value;
                                      const englishAmount = convertArabicToEnglish(amount);
                                      const valNum = parseFloat(englishAmount);
                                      if (isNaN(valNum) || valNum < 0 || englishAmount === '') {
                                        setManualDebitAllocations(prev => {
                                          const next = { ...(prev || {}) };
                                          delete next[debit.id];
                                          return next;
                                        });
                                        e.target.value = '';
                                      } else {
                                        let clampedVal = valNum;
                                        if (valNum > debit.remaining) {
                                          clampedVal = debit.remaining;
                                          showToast(`لا يمكنك سحب مبلغ يتجاوز رصيد المديونية (${debit.remaining.toFixed(2)}$)`);
                                        }
                                        setManualDebitAllocations(prev => ({
                                          ...(prev || {}),
                                          [debit.id]: clampedVal
                                        }));
                                        if (valNum !== clampedVal || amount !== englishAmount) {
                                          e.target.value = clampedVal.toString();
                                        }
                                      }
                                    }}
                                    className="w-16 p-1 text-xs border border-gray-300 rounded text-center"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-gray-400">
                  <svg className="w-10 h-10 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </div>
              </div>

              {/* القسم الأيسر: الفواتير */}
              <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col overflow-hidden relative">
                {!hasSelectedDebits && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
                    <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                    <h4 className="text-xl font-bold text-gray-700 mb-2">الرجاء تحديد مديونية أولاً</h4>
                    <p className="text-gray-500">للبدء بتوزيع الخصومات، قم بتحديد مديونية واحدة أو أكثر من القائمة اليمنى لتشكل "مصدر الأموال".</p>
                  </div>
                )}
                
                <div className="bg-green-50 p-4 border-b border-green-100 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                    <h3 className="text-lg font-bold text-green-800">وجهة الخصم (الفواتير)</h3>
                  </div>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                    {credits.length} سجل
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {groupedCredits.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">لا توجد فواتير غير مسواة</div>
                  ) : (
                    groupedCredits.map(item => {
                      if ('isGroup' in item) {
                        const group = item as GroupedCredit;
                        const isExpanded = expandedGroups[group.id];
                        const isParentSelected = !!selectedCredits[group.id];
                        const childrenTotalSelected = group.records.reduce((sum, r) => sum + (selectedCredits[r.id.toString()] || 0), 0);
                        const isChildSelected = childrenTotalSelected > 0;
                        const totalGroupSettle = isParentSelected ? (selectedCredits[group.id] || 0) : childrenTotalSelected;
                        
                        return (
                            <div key={group.id} className={`border-2 rounded-lg overflow-hidden transition-all ${isExpanded ? 'border-[#1A4D4F] shadow-md' : 'border-gray-200 bg-white'}`}>
                              {/* Parent Row */}
                              <div className={`transition-all ${(isParentSelected || isChildSelected) ? 'bg-[#f0f9fa]' : 'hover:bg-gray-50'}`}>
                                
                                {/* Header Section (Clickable) */}
                                <div 
                                  className="flex flex-wrap items-center justify-between p-4 cursor-pointer gap-3 border-b border-gray-100"
                                  onClick={() => toggleGroup(group.id)}
                                >
                                  {/* Right side: Icon + Texts */}
                                  <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                                    <div className={`shrink-0 p-2.5 rounded-lg ${isExpanded ? 'bg-[#1A4D4F] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-bold text-[#1A4D4F] text-base leading-none">فاتورة مجمعة #{group.invoiceNumber}</h3>
                                        <span className="bg-[#1A4D4F]/10 text-[#1A4D4F] text-[11px] font-bold px-2 py-0.5 rounded-md leading-none">
                                          {group.records.length} عقود
                                        </span>
                                      </div>
                                      <span className="text-[11px] text-gray-500 flex items-center gap-1 font-semibold hover:text-[#1A4D4F]">
                                        <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        {isExpanded ? 'إخفاء العقود الفردية' : 'انقر لعرض وتخصيص العقود'}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Left side: Remaining Amount */}
                                  <div className="flex flex-col items-end justify-center bg-green-50/80 px-3 py-1.5 rounded-md border border-green-100 shrink-0">
                                    <span className="text-[10px] text-green-700 font-bold mb-0.5">المبلغ الاجمالي </span>
                                    <span className="font-bold text-green-700 text-sm leading-none">${group.totalRemaining.toFixed(2)}</span>
                                  </div>
                                </div>
                                
                                {/* Input Section */}
                                <div className="p-4 bg-white/40">
                                  <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-2">
                                    <label className="text-sm font-bold text-gray-700">تخصيص الخصم على الفاتورة ككل:</label>
                                    <input 
                                      type="text" 
                                      inputMode="decimal"
                                      disabled={!hasSelectedDebits || isChildSelected}
                                      value={selectedCredits[group.id] || ''}
                                      onChange={(e) => handleCreditAmountChange(group.id, e.target.value, group.totalRemaining, e)}
                                      className="w-full p-2.5 text-lg font-bold border border-gray-300 rounded focus:ring-[#1A4D4F] focus:border-[#1A4D4F] disabled:bg-gray-100 disabled:opacity-60"
                                      placeholder={isChildSelected ? `تم الخصم يدوياً من العقود: $${childrenTotalSelected}` : "أدخل المبلغ ليُوزع آلياً..."}
                                    />
                                    {(isParentSelected || isChildSelected) && (
                                      <div className="mt-2 text-xs font-bold text-[#1A4D4F] flex justify-between bg-blue-50 p-2.5 rounded-lg border border-blue-100">
                                        <div className="flex flex-col">
                                          <span className="text-gray-500 mb-1">الخصم المطبق</span>
                                          <span className="text-sm">${totalGroupSettle.toFixed(2)}</span>
                                        </div>
                                        <div className="flex flex-col items-end text-green-700">
                                          <span className="text-gray-500 mb-1">مبلغ الفاتورة بعد الخصم</span>
                                          <span className="text-sm">${(group.totalRemaining - totalGroupSettle).toFixed(2)}</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                            {/* Children Rows */}
                            {isExpanded && (
                              <div className="bg-gray-50 p-4 border-t border-gray-200 space-y-3">
                                {group.records.map(credit => {
                                  const allocated = creditAllocations[credit.id] || 0;
                                  const isDirectlySelected = !!selectedCredits[credit.id.toString()];
                                  const isReceivingAllocation = allocated > 0;
                                  const isSelected = isDirectlySelected || isReceivingAllocation;
                                  const simulatedRemaining = credit.remaining - allocated;
                                  const isFullyAllocated = isSelected && simulatedRemaining <= 0.001;

                                  return (
                                    <div key={credit.id} className={`p-3 rounded-lg border transition-all ${isSelected ? 'border-green-500 bg-white shadow-sm' : 'border-gray-200 bg-white'}`}>
                                      <div className="flex justify-between mb-1">
                                        <span className="font-bold text-gray-800 text-sm">{credit.clientName || 'بدون اسم'}</span>
                                        <span className="font-bold text-green-600 text-sm">متبقي: ${credit.remaining.toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between text-xs text-gray-500 mb-2">
                                        <span>عقد: {credit.contractNumber || 'لا يوجد'}</span>
                                      </div>
                                      <div className="flex items-center gap-2 mb-2">
                                        <label className="text-xs font-bold text-gray-700 whitespace-nowrap">مبلغ الخصم للعقد:</label>
                                        <input 
                                          type="text" 
                                          inputMode="decimal"
                                          disabled={!hasSelectedDebits || isParentSelected}
                                          value={selectedCredits[credit.id.toString()] || ''}
                                          onChange={(e) => handleCreditAmountChange(credit.id.toString(), e.target.value, credit.remaining, e)}
                                          className="w-full p-1.5 text-sm border border-gray-300 rounded focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:opacity-60"
                                          placeholder={isParentSelected ? "الفاتورة موزعة بالكامل" : "المبلغ..."}
                                        />
                                      </div>
                                      
                                      {/* شريط التقدم للخصم */}
                                      {isSelected && (
                                        <div className="mt-2 text-xs font-bold flex flex-col gap-1">
                                          <div className="flex justify-between">
                                            <span className={isFullyAllocated ? 'text-green-600' : 'text-blue-600'}>
                                              سيُخصم: ${allocated.toFixed(2)}
                                            </span>
                                            <span className="text-gray-600">الباقي بعد السداد: ${simulatedRemaining.toFixed(2)}</span>
                                          </div>
                                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                              className={`h-full transition-all ${isFullyAllocated ? 'bg-green-500' : 'bg-blue-500'}`}
                                              style={{ width: `${Math.min((allocated / credit.remaining) * 100, 100)}%` }}
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Standalone record (not in a group)
                      const credit = item as SettlementRecord;
                      const allocated = creditAllocations[credit.id] || 0;
                      const isSelected = !!selectedCredits[credit.id.toString()];
                      const simulatedRemaining = credit.remaining - allocated;
                      const isFullyAllocated = isSelected && simulatedRemaining <= 0.001;

                      return (
                        <div key={credit.id} className={`p-4 rounded-lg border-2 transition-all ${isSelected ? 'border-green-500 bg-green-50 shadow-md' : 'border-gray-200 bg-white'}`}>
                          <div className="flex justify-between mb-2">
                            <span className="font-bold text-gray-800">{credit.clientName || 'بدون اسم'}</span>
                            <span className="font-bold text-green-600">متبقي: ${credit.remaining.toFixed(2)}</span>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">{credit.description}</div>
                          <div className="flex justify-between text-xs text-gray-500 mb-3">
                            <span>عقد: {credit.contractNumber || 'لا يوجد'}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <label className="text-sm font-bold text-gray-700 whitespace-nowrap">مبلغ الخصم:</label>
                            <input 
                              type="text" 
                              inputMode="decimal"
                              disabled={!hasSelectedDebits}
                              value={selectedCredits[credit.id.toString()] || ''}
                              onChange={(e) => handleCreditAmountChange(credit.id.toString(), e.target.value, credit.remaining, e)}
                              className="w-full p-2 border border-gray-300 rounded focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
                              placeholder="أدخل المبلغ..."
                            />
                          </div>
                          
                          {/* شريط التقدم للخصم */}
                          {isSelected && (
                            <div className="mt-2 text-xs font-bold flex flex-col gap-1">
                              <div className="flex justify-between">
                                <span className={isFullyAllocated ? 'text-green-600' : 'text-blue-600'}>
                                  سيُخصم: ${allocated.toFixed(2)}
                                </span>
                                <span className="text-gray-600">الباقي بعد السداد: ${simulatedRemaining.toFixed(2)}</span>
                              </div>
                              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all ${isFullyAllocated ? 'bg-green-500' : 'bg-blue-500'}`}
                                  style={{ width: `${Math.min((allocated / credit.remaining) * 100, 100)}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-100 flex justify-between items-center">
          <div className="flex flex-col">
            {error && <div className="text-red-500 font-bold mb-1">{error}</div>}
            {hasSelectedDebits && (
              <div className="text-sm font-bold text-gray-700 flex gap-4">
                <span className="bg-white px-3 py-1 rounded shadow-sm border border-gray-200">
                  إجمالي المديونيات: <span className="text-gray-900">${totalSelectedDebitsRemaining.toFixed(2)}</span>
                </span>
                <span className="bg-white px-3 py-1 rounded shadow-sm border border-gray-200">
                  تم التوزيع: <span className="text-blue-600">${totalSettlementAmount.toFixed(2)}</span>
                </span>
                <span className="bg-white px-3 py-1 rounded shadow-sm border border-gray-200">
                  الرصيد المتبقي للتوزيع: <span className={totalSelectedDebitsRemaining - totalSettlementAmount < 0 ? 'text-red-600' : 'text-green-600'}>${(totalSelectedDebitsRemaining - totalSettlementAmount).toFixed(2)}</span>
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-gray-300 text-gray-800 rounded font-bold hover:bg-gray-400 transition-colors"
            >
              إلغاء
            </button>
            <button 
              onClick={handleSubmit}
              disabled={submitting || !hasSelectedDebits || totalSettlementAmount <= 0 || totalSettlementAmount > totalSelectedDebitsRemaining}
              className="px-6 py-2 bg-[#1A4D4F] text-white rounded font-bold hover:bg-[#13393b] disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {submitting ? 'جاري المعالجة...' : 'تأكيد التسوية المتعددة'}
              {!submitting && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
