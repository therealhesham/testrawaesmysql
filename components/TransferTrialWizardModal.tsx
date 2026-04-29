import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { X } from 'lucide-react';

/** يُقرأ في صفحة AddTransactionForm بعد التوجيه */
export const HOUSING_TRANSFER_WIZARD_STORAGE_KEY = 'housingTransferWizardDraft';

interface ClientSuggestion {
  id: number;
  fullname: string;
  phonenumber: string;
  nationalId: string;
  city: string;
}

export type TransferWizardWorker = {
  id: number;
  homeMaid_id: number | null;
  maidDisplayName: string;
  oldClientId: number | null;
  oldClientName: string;
};

type DurationMode = 'days' | 'months';

const STEP_LABELS = ['بيانات التجربة', 'بيانات العميل', 'إجراءات التجربة', 'نقل الكفالة'];

const numOk = (s: string) => /^\d+(\.\d+)?$/.test(s.trim());

function filterNumericInput(raw: string): string {
  return raw.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
}

export default function TransferTrialWizardModal({
  open,
  onClose,
  worker,
}: {
  open: boolean;
  onClose: () => void;
  worker: TransferWizardWorker | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [durationMode, setDurationMode] = useState<DurationMode>('days');
  const [daysCount, setDaysCount] = useState('');
  const [dayRate, setDayRate] = useState('');
  const [monthsCount, setMonthsCount] = useState('');
  const [monthlyRate, setMonthlyRate] = useState('');

  const [trialClientName, setTrialClientName] = useState('');
  const [newClientSuggestions, setNewClientSuggestions] = useState<ClientSuggestion[]>([]);
  const [showNewDropdown, setShowNewDropdown] = useState(false);
  const [searchingClient, setSearchingClient] = useState(false);
  const [pickedNewClient, setPickedNewClient] = useState<ClientSuggestion | null>(null);

  const [trialAction, setTrialAction] = useState('');
  const [returnedFromTrial, setReturnedFromTrial] = useState(false);
  const [trialResult, setTrialResult] = useState<'ناجحة' | 'فاشلة' | ''>('');
  const [trialNotes, setTrialNotes] = useState('');

  useEffect(() => {
    if (!open) {
      setStep(0);
      setDurationMode('days');
      setDaysCount('');
      setDayRate('');
      setMonthsCount('');
      setMonthlyRate('');
      setTrialClientName('');
      setPickedNewClient(null);
      setNewClientSuggestions([]);
      setShowNewDropdown(false);
      setTrialAction('');
      setReturnedFromTrial(false);
      setTrialResult('');
      setTrialNotes('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = trialClientName.trim();
    if (t.length < 1) {
      setNewClientSuggestions([]);
      setShowNewDropdown(false);
      return;
    }
    const id = window.setTimeout(async () => {
      setSearchingClient(true);
      try {
        const res = await fetch(`/api/clients/suggestions?q=${encodeURIComponent(t)}`);
        if (res.ok) {
          const data = await res.json();
          setNewClientSuggestions(data.suggestions || []);
          setShowNewDropdown(true);
        }
      } catch {
        setNewClientSuggestions([]);
      } finally {
        setSearchingClient(false);
      }
    }, 300);
    return () => window.clearTimeout(id);
  }, [trialClientName, open]);

  const experimentDurationSummary = useMemo(() => {
    if (durationMode === 'days' && numOk(daysCount) && numOk(dayRate)) {
      return `${daysCount.trim()} يوم — ${dayRate.trim()} ريال/يوم`;
    }
    if (durationMode === 'months' && numOk(monthsCount) && numOk(monthlyRate)) {
      return `${monthsCount.trim()} شهر — ${monthlyRate.trim()} ريال/شهر`;
    }
    return '';
  }, [durationMode, daysCount, dayRate, monthsCount, monthlyRate]);

  const estimatedCost = useMemo(() => {
    if (durationMode === 'days' && numOk(daysCount) && numOk(dayRate)) {
      return (parseFloat(daysCount) * parseFloat(dayRate)).toFixed(2);
    }
    if (durationMode === 'months' && numOk(monthsCount) && numOk(monthlyRate)) {
      return (parseFloat(monthsCount) * parseFloat(monthlyRate)).toFixed(2);
    }
    return '';
  }, [durationMode, daysCount, dayRate, monthsCount, monthlyRate]);

  const step1Valid =
    durationMode === 'days'
      ? numOk(daysCount) && numOk(dayRate) && parseFloat(daysCount) > 0 && parseFloat(dayRate) >= 0
      : numOk(monthsCount) && numOk(monthlyRate) && parseFloat(monthsCount) > 0 && parseFloat(monthlyRate) >= 0;

  const step2Valid = trialClientName.trim().length >= 2;

  const step3Valid = trialResult !== '';

  const canNext =
    (step === 0 && step1Valid) || (step === 1 && step2Valid) || (step === 2 && step3Valid);

  const pickNewClient = (c: ClientSuggestion) => {
    setPickedNewClient(c);
    setTrialClientName(c.fullname);
    setShowNewDropdown(false);
  };

  const buildDraft = () => {
    if (!worker || !worker.homeMaid_id || !worker.oldClientId) return null;
    const notesParts = [
      trialNotes.trim(),
      trialAction ? `إجراء: ${trialAction}` : '',
      `إعادة من التجربة: ${returnedFromTrial ? 'نعم' : 'لا'}`,
      experimentDurationSummary ? `ملخص المدة: ${experimentDurationSummary}` : '',
    ].filter(Boolean);

    return {
      homeMaidId: worker.homeMaid_id,
      maidName: worker.maidDisplayName,
      oldClientId: worker.oldClientId,
      oldClientName: worker.oldClientName,
      durationMode,
      daysCount: durationMode === 'days' ? daysCount.trim() : '',
      dayRate: durationMode === 'days' ? dayRate.trim() : '',
      monthsCount: durationMode === 'months' ? monthsCount.trim() : '',
      monthlyRate: durationMode === 'months' ? monthlyRate.trim() : '',
      experimentDurationSummary,
      estimatedCost,
      trialClientName: trialClientName.trim(),
      newClientId: pickedNewClient?.id,
      newClientPhone: pickedNewClient?.phonenumber ?? '',
      newClientNationalId: pickedNewClient?.nationalId ?? '',
      newClientCity: pickedNewClient?.city ?? '',
      returnedFromTrial,
      trialResult,
      trialNotes: notesParts.join('\n'),
    };
  };

  const handleStartTransfer = () => {
    const draft = buildDraft();
    if (!draft) return;
    try {
      sessionStorage.setItem(HOUSING_TRANSFER_WIZARD_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      return;
    }
    onClose();
    router.push('/admin/AddTransactionForm');
  };

  if (!open || !worker) return null;

  const missingIds = !worker.homeMaid_id || !worker.oldClientId;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-teal-900 text-white">
          <h2 className="text-lg font-semibold m-0">نقل كفالة عاملة</h2>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-teal-800" aria-label="إغلاق">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 pt-4 flex gap-1 justify-between">
          {STEP_LABELS.map((label, i) => (
            <div
              key={label}
              className={`flex-1 text-center text-xs py-2 rounded-md border ${
                i === step
                  ? 'bg-teal-100 border-teal-600 text-teal-900 font-semibold'
                  : i < step
                    ? 'bg-teal-50 border-teal-200 text-teal-800'
                    : 'bg-gray-50 border-gray-200 text-gray-500'
              }`}
            >
              <span className="block text-[10px] text-gray-500 mb-0.5">{i + 1}</span>
              {label}
            </div>
          ))}
        </div>

        <div className="p-4 overflow-y-auto flex-1 text-right">
          {missingIds && (
            <p className="text-red-600 text-sm mb-3">
              لا يمكن المتابعة: يجب أن تكون العاملة مرتبطة بسجل عاملة (homeMaid) ولها عميل كفيل معروف في النظام.
            </p>
          )}

          {step === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 m-0">الخطوة 1: بيانات التجربة</p>
              <div>
                <label className="block text-sm text-gray-700 mb-2">مدة التجربة</label>
                <div className="flex gap-3 flex-wrap">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dur"
                      checked={durationMode === 'days'}
                      onChange={() => setDurationMode('days')}
                    />
                    بالأيام
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dur"
                      checked={durationMode === 'months'}
                      onChange={() => setDurationMode('months')}
                    />
                    شهر أو أكثر
                  </label>
                </div>
              </div>
              {durationMode === 'days' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">عدد الأيام</label>
                    <input
                      className="w-full border border-gray-300 rounded-md p-2 text-right"
                      inputMode="decimal"
                      value={daysCount}
                      onChange={(e) => setDaysCount(filterNumericInput(e.target.value))}
                      placeholder="أرقام فقط"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">تكلفة اليوم الواحد</label>
                    <input
                      className="w-full border border-gray-300 rounded-md p-2 text-right"
                      inputMode="decimal"
                      value={dayRate}
                      onChange={(e) => setDayRate(filterNumericInput(e.target.value))}
                      placeholder="أرقام فقط"
                    />
                  </div>
                </div>
              )}
              {durationMode === 'months' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">عدد الشهور</label>
                    <input
                      className="w-full border border-gray-300 rounded-md p-2 text-right"
                      inputMode="decimal"
                      value={monthsCount}
                      onChange={(e) => setMonthsCount(filterNumericInput(e.target.value))}
                      placeholder="أرقام فقط"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">التكلفة الشهرية</label>
                    <input
                      className="w-full border border-gray-300 rounded-md p-2 text-right"
                      inputMode="decimal"
                      value={monthlyRate}
                      onChange={(e) => setMonthlyRate(filterNumericInput(e.target.value))}
                      placeholder="أرقام فقط"
                    />
                  </div>
                </div>
              )}
              {experimentDurationSummary && (
                <p className="text-sm text-teal-800 bg-teal-50 rounded-md p-2 m-0">{experimentDurationSummary}</p>
              )}
              {estimatedCost && (
                <p className="text-sm text-gray-700 m-0">
                  التقدير التقريبي للتكلفة: <strong>{estimatedCost}</strong> ريال
                </p>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 m-0">الخطوة 2: بيانات العميل</p>
              <div className="relative new-client-wizard-search">
                <label className="block text-sm text-gray-700 mb-1">
                  اسم الشخص الذي خرجت العاملة للتجربة لديه
                </label>
                <input
                  className="w-full border border-gray-300 rounded-md p-2 text-right"
                  value={trialClientName}
                  onChange={(e) => {
                    setTrialClientName(e.target.value);
                    setPickedNewClient(null);
                  }}
                  onFocus={() => trialClientName.trim().length >= 1 && setShowNewDropdown(true)}
                  placeholder="ابحث أو اكتب الاسم"
                />
                {searchingClient && (
                  <div className="absolute left-3 top-9 text-xs text-gray-400">جاري البحث...</div>
                )}
                {showNewDropdown && newClientSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {newClientSuggestions.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full text-right p-2 hover:bg-gray-100 border-b text-sm"
                        onClick={() => pickNewClient(c)}
                      >
                        {c.fullname}
                        <span className="block text-xs text-gray-500">{c.phonenumber}</span>
                      </button>
                    ))}
                  </div>
                )}
                {pickedNewClient && (
                  <p className="text-xs text-teal-700 mt-1 m-0">تم اختيار عميل مسجل: #{pickedNewClient.id}</p>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 m-0">الخطوة 3: إجراءات التجربة</p>
              <div>
                <label className="block text-sm text-gray-700 mb-1">إجراءات (اختياري)</label>
                <select
                  className="w-full border border-gray-300 rounded-md p-2 text-right bg-white"
                  value={trialAction}
                  onChange={(e) => setTrialAction(e.target.value)}
                >
                  <option value="">— اختر —</option>
                  <option value="إعادة من التجربة">إعادة من التجربة</option>
                  <option value="متابعة التجربة">متابعة التجربة</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>
              <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={returnedFromTrial}
                  onChange={(e) => setReturnedFromTrial(e.target.checked)}
                />
                تمت إعادة العاملة من التجربة
              </label>
              <div>
                <label className="block text-sm text-gray-700 mb-1">نتيجة التجربة</label>
                <div className="flex gap-4 flex-wrap">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="res"
                      checked={trialResult === 'ناجحة'}
                      onChange={() => setTrialResult('ناجحة')}
                    />
                    ناجحة
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="res"
                      checked={trialResult === 'فاشلة'}
                      onChange={() => setTrialResult('فاشلة')}
                    />
                    فاشلة
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">ملاحظات على التجربة (اختياري)</label>
                <textarea
                  className="w-full border border-gray-300 rounded-md p-2 text-right min-h-[88px]"
                  value={trialNotes}
                  onChange={(e) => setTrialNotes(e.target.value)}
                  placeholder="تفاصيل إضافية..."
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 m-0">الخطوة 4: نقل الكفالة</p>
              <p className="text-sm text-gray-600 m-0">
                سيتم فتح نموذج نقل الكفالة مع تعبئة بيانات التجربة والعميل تلقائياً قدر الإمكان. أكمل باقي الحقول
                واحفظ المعاملة من الصفحة التالية.
              </p>
              <button
                type="button"
                disabled={missingIds}
                onClick={handleStartTransfer}
                className="w-full py-3 rounded-lg bg-teal-900 text-white font-semibold hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                بدء إجراء نقل الكفالة
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm"
            onClick={() => (step > 0 ? setStep(step - 1) : onClose())}
          >
            {step === 0 ? 'إلغاء' : 'السابق'}
          </button>
          {step < 3 && (
            <button
              type="button"
              disabled={!canNext || missingIds}
              className="px-4 py-2 rounded-md bg-teal-800 text-white text-sm hover:bg-teal-900 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setStep(step + 1)}
            >
              التالي
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
