import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';

/** مفتاح قديم – محفوظ للتوافق في حال كان هناك كود يقرأه */
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

const STEP_LABELS = ['بيانات التجربة', 'بيانات العميل', 'إجراءات التجربة', 'إتمام النقل'];

const numOk = (s: string) => /^\d+(\.\d+)?$/.test(s.trim()) && parseFloat(s.trim()) >= 0;

function numInput(raw: string) {
  return raw.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
}

// ─── مكوّن حقل نصي بسيط ───────────────────────────────────────────────────
function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  required = false,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 mr-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={`w-full border rounded-md p-2 text-right text-sm ${
          readOnly ? 'bg-gray-100 text-gray-500 border-gray-200' : 'border-gray-300 bg-white'
        }`}
      />
    </div>
  );
}

export default function TransferTrialWizardModal({
  open,
  onClose,
  worker,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  worker: TransferWizardWorker | null;
  onSuccess?: () => void;
}) {
  // ── Step ──────────────────────────────────────────────────────────────────
  const [step, setStep] = useState(0);

  // ── Step 1: بيانات التجربة ────────────────────────────────────────────────
  const [durationMode, setDurationMode] = useState<DurationMode>('days');
  const [daysCount, setDaysCount] = useState('');
  const [dayRate, setDayRate] = useState('');
  const [monthsCount, setMonthsCount] = useState('');
  const [monthlyRate, setMonthlyRate] = useState('');

  // ── Step 2: بيانات العميل ─────────────────────────────────────────────────
  const [trialClientName, setTrialClientName] = useState('');
  const [newClientSuggestions, setNewClientSuggestions] = useState<ClientSuggestion[]>([]);
  const [showNewDropdown, setShowNewDropdown] = useState(false);
  const [searchingClient, setSearchingClient] = useState(false);
  const [pickedNewClient, setPickedNewClient] = useState<ClientSuggestion | null>(null);
  const [creatingClient, setCreatingClient] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  // ── Step 3: إجراءات التجربة ───────────────────────────────────────────────
  const [trialAction, setTrialAction] = useState('');
  const [returnedFromTrial, setReturnedFromTrial] = useState(false);
  const [trialResult, setTrialResult] = useState<'ناجحة' | 'فاشلة' | ''>('');
  const [trialNotes, setTrialNotes] = useState('');

  // ── Step 4: إتمام النقل ────────────────────────────────────────────────────
  const [contractDate, setContractDate] = useState('');
  const [workDuration, setWorkDuration] = useState('');
  const [cost, setCost] = useState('');
  const [paid, setPaid] = useState('');
  const [nationalID, setNationalID] = useState('');
  const [transferOpNum, setTransferOpNum] = useState('');
  const [transferingDate, setTransferingDate] = useState('');

  // ── Submit state ──────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedId, setSavedId] = useState<number | null>(null);

  // ── Reset when closed ────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      setStep(0);
      setDurationMode('days'); setDaysCount(''); setDayRate(''); setMonthsCount(''); setMonthlyRate('');
      setTrialClientName(''); setPickedNewClient(null); setNewClientSuggestions([]); setShowNewDropdown(false);
      setTrialAction(''); setReturnedFromTrial(false); setTrialResult(''); setTrialNotes('');
      setContractDate(''); setWorkDuration(''); setCost(''); setPaid('');
      setNationalID(''); setTransferOpNum(''); setTransferingDate('');
      setSaving(false); setSaveError(''); setSavedId(null);
    }
  }, [open]);

  // ── Client search debounce ────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const t = trialClientName.trim();
    if (t.length < 1) { setNewClientSuggestions([]); setShowNewDropdown(false); return; }
    const id = window.setTimeout(async () => {
      setSearchingClient(true);
      try {
        const res = await fetch(`/api/clients/suggestions?q=${encodeURIComponent(t)}`);
        if (res.ok) { const d = await res.json(); setNewClientSuggestions(d.suggestions || []); setShowNewDropdown(true); }
      } catch { setNewClientSuggestions([]); }
      finally { setSearchingClient(false); }
    }, 300);
    return () => window.clearTimeout(id);
  }, [trialClientName, open]);

  // ── حساب موضع الـ dropdown (fixed) حسب المساحة المتاحة ─────────────────
  useEffect(() => {
    if (!showNewDropdown || !searchInputRef.current) return;
    const rect = searchInputRef.current.getBoundingClientRect();
    const dropdownH = 200;
    const gap = 4;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const openUp = spaceBelow < dropdownH && spaceAbove > spaceBelow;
    setDropdownStyle({
      position: 'fixed',
      width: `${rect.width}px`,
      left: `${rect.left}px`,
      zIndex: 9999,
      ...(openUp
        ? { bottom: `${window.innerHeight - rect.top + gap}px`, maxHeight: `${Math.min(spaceAbove, 240)}px` }
        : { top: `${rect.bottom + gap}px`, maxHeight: `${Math.min(spaceBelow, 240)}px` }),
    });
  }, [showNewDropdown, newClientSuggestions]);

  // ── Pre-fill cost from step 1 when entering step 4 ───────────────────────
  useEffect(() => {
    if (step !== 3) return;
    if (!cost) {
      const est = durationMode === 'days' && numOk(daysCount) && numOk(dayRate)
        ? (parseFloat(daysCount) * parseFloat(dayRate)).toFixed(2)
        : durationMode === 'months' && numOk(monthsCount) && numOk(monthlyRate)
        ? (parseFloat(monthsCount) * parseFloat(monthlyRate)).toFixed(2)
        : '';
      if (est) setCost(est);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // ── Computed ──────────────────────────────────────────────────────────────
  const estimatedCost = useMemo(() => {
    if (durationMode === 'days' && numOk(daysCount) && numOk(dayRate))
      return (parseFloat(daysCount) * parseFloat(dayRate)).toFixed(2);
    if (durationMode === 'months' && numOk(monthsCount) && numOk(monthlyRate))
      return (parseFloat(monthsCount) * parseFloat(monthlyRate)).toFixed(2);
    return '';
  }, [durationMode, daysCount, dayRate, monthsCount, monthlyRate]);

  const durationSummary = useMemo(() => {
    if (durationMode === 'days' && numOk(daysCount) && numOk(dayRate))
      return `${daysCount.trim()} يوم × ${dayRate.trim()} ريال`;
    if (durationMode === 'months' && numOk(monthsCount) && numOk(monthlyRate))
      return `${monthsCount.trim()} شهر × ${monthlyRate.trim()} ريال`;
    return '';
  }, [durationMode, daysCount, dayRate, monthsCount, monthlyRate]);

  const remaining = useMemo(() => {
    const c = parseFloat(cost || '0');
    const p = parseFloat(paid || '0');
    if (isNaN(c) || isNaN(p)) return '';
    return (c - p).toFixed(2);
  }, [cost, paid]);

  const missingIds = !worker?.homeMaid_id || !worker?.oldClientId;

  const step1Valid =
    durationMode === 'days'
      ? numOk(daysCount) && numOk(dayRate) && parseFloat(daysCount) > 0
      : numOk(monthsCount) && numOk(monthlyRate) && parseFloat(monthsCount) > 0;

  const step2Valid = !!pickedNewClient;

  const step3Valid = trialResult !== '';

  const canNext =
    (step === 0 && step1Valid) ||
    (step === 1 && step2Valid) ||
    (step === 2 && step3Valid);

  // ── Create new client on-the-fly ─────────────────────────────────────────
  const handleCreateClient = async () => {
    const name = trialClientName.trim();
    if (!name) return;
    setCreatingClient(true);
    try {
      const res = await fetch('/api/clientssearch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullname: name }),
      });
      if (res.ok) {
        const created: ClientSuggestion = await res.json();
        setPickedNewClient(created);
        setTrialClientName(created.fullname);
        setShowNewDropdown(false);
      }
    } catch { /* keep going */ }
    finally { setCreatingClient(false); }
  };

  // ── Save transfer ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!worker || !worker.homeMaid_id || !worker.oldClientId || !pickedNewClient) return;
    setSaving(true);
    setSaveError('');
    const notesParts = [
      trialNotes.trim(),
      trialAction ? `إجراء: ${trialAction}` : '',
      `إعادة من التجربة: ${returnedFromTrial ? 'نعم' : 'لا'}`,
      durationSummary ? `مدة التجربة: ${durationSummary}` : '',
    ].filter(Boolean).join('\n');

    const durationText = durationSummary || (
      durationMode === 'days'
        ? `${daysCount} يوم`
        : `${monthsCount} شهر`
    );

    const body = {
      HomeMaidId: worker.homeMaid_id,
      OldClientId: worker.oldClientId,
      NewClientId: pickedNewClient.id,
      ExperimentDuration: durationText,
      ExperimentRate: trialResult,
      Notes: notesParts || undefined,
      Cost: cost || undefined,
      Paid: paid || undefined,
      WorkDuration: workDuration || undefined,
      ContractDate: contractDate || undefined,
      NationalID: nationalID || undefined,
      TransferOperationNumber: transferOpNum || undefined,
      TransferingDate: transferingDate || undefined,
      transferStage: 'انشاء الطلب',
    };

    try {
      const res = await fetch('/api/transferSponsorShips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ في الحفظ');
      setSavedId(data.id);
      onSuccess?.();
    } catch (e: any) {
      setSaveError(e.message || 'حدث خطأ غير متوقع');
    } finally {
      setSaving(false);
    }
  };

  if (!open || !worker) return null;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 bg-teal-900 text-white rounded-t-xl">
          <h2 className="text-base font-semibold m-0">
            نقل كفالة — {worker.maidDisplayName}
          </h2>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-teal-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step bar */}
        {!savedId && (
          <div className="px-4 pt-3 pb-1 flex gap-1">
            {STEP_LABELS.map((label, i) => (
              <div
                key={label}
                className={`flex-1 text-center text-xs py-1.5 rounded border ${
                  i === step
                    ? 'bg-teal-100 border-teal-500 text-teal-900 font-semibold'
                    : i < step
                    ? 'bg-teal-50 border-teal-200 text-teal-700'
                    : 'bg-gray-50 border-gray-200 text-gray-400'
                }`}
              >
                <span className="block text-[9px] text-gray-400">{i + 1}</span>
                {label}
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 text-right">

          {/* ─── نجاح الحفظ ─── */}
          {savedId ? (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <CheckCircle className="w-14 h-14 text-teal-600" />
              <p className="text-lg font-semibold text-teal-800">تم تسجيل معاملة نقل الكفالة</p>
              <p className="text-sm text-gray-500">رقم المعاملة: #{savedId}</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-6 py-2 bg-teal-800 text-white rounded-lg hover:bg-teal-900 text-sm"
              >
                إغلاق
              </button>
            </div>
          ) : (
            <>
              {missingIds && (
                <p className="text-red-600 text-sm mb-3 bg-red-50 border border-red-200 rounded p-2">
                  تحذير: لا يمكن المتابعة — العاملة أو الكفيل الحالي غير مرتبط بالنظام.
                </p>
              )}

              {/* ─── الخطوة 1 ─── */}
              {step === 0 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 m-0">بيانات فترة التجربة</p>
                  <div className="flex gap-4">
                    {(['days', 'months'] as DurationMode[]).map((m) => (
                      <label key={m} className="inline-flex items-center gap-2 cursor-pointer text-sm">
                        <input type="radio" name="dur" checked={durationMode === m} onChange={() => setDurationMode(m)} />
                        {m === 'days' ? 'بالأيام' : 'شهر أو أكثر'}
                      </label>
                    ))}
                  </div>
                  {durationMode === 'days' ? (
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="عدد الأيام" required value={daysCount} onChange={(v) => setDaysCount(numInput(v))} placeholder="أرقام فقط" />
                      <Field label="تكلفة اليوم (ريال)" required value={dayRate} onChange={(v) => setDayRate(numInput(v))} placeholder="أرقام فقط" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="عدد الشهور" required value={monthsCount} onChange={(v) => setMonthsCount(numInput(v))} placeholder="أرقام فقط" />
                      <Field label="التكلفة الشهرية (ريال)" required value={monthlyRate} onChange={(v) => setMonthlyRate(numInput(v))} placeholder="أرقام فقط" />
                    </div>
                  )}
                  {durationSummary && (
                    <div className="rounded-md bg-teal-50 border border-teal-200 px-3 py-2 text-sm text-teal-800">
                      {durationSummary}
                      {estimatedCost && <span className="mr-2 font-semibold">= {estimatedCost} ريال</span>}
                    </div>
                  )}
                </div>
              )}

              {/* ─── الخطوة 2 ─── */}
              {step === 1 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 m-0">اسم العميل الذي خرجت العاملة للتجربة لديه</p>
                  <div className="relative">
                    <input
                      ref={searchInputRef}
                      className="w-full border border-gray-300 rounded-md p-2 text-right text-sm"
                      value={trialClientName}
                      onChange={(e) => { setTrialClientName(e.target.value); setPickedNewClient(null); }}
                      onFocus={() => trialClientName.trim().length >= 1 && setShowNewDropdown(true)}
                      placeholder="ابحث بالاسم أو رقم الهاتف"
                    />
                    {searchingClient && (
                      <div className="absolute left-3 top-2.5 text-xs text-gray-400">جاري البحث...</div>
                    )}
                    {showNewDropdown && newClientSuggestions.length > 0 && (
                      <div
                        style={dropdownStyle}
                        className="bg-white border border-gray-200 rounded-md shadow-xl overflow-y-auto"
                      >
                        {newClientSuggestions.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            className="w-full text-right p-2 hover:bg-gray-100 border-b text-sm"
                            onClick={() => { setPickedNewClient(c); setTrialClientName(c.fullname); setShowNewDropdown(false); }}
                          >
                            {c.fullname}
                            <span className="block text-xs text-gray-500">{c.phonenumber}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {pickedNewClient ? (
                    <div className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-md px-3 py-2 text-sm">
                      <span className="text-teal-800 font-medium">{pickedNewClient.fullname}</span>
                      <button
                        type="button"
                        className="text-xs text-gray-500 hover:text-red-500"
                        onClick={() => { setPickedNewClient(null); setTrialClientName(''); }}
                      >
                        تغيير
                      </button>
                    </div>
                  ) : trialClientName.trim().length >= 2 && !searchingClient && newClientSuggestions.length === 0 ? (
                    <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-sm">
                      <span className="text-amber-800">لم يُعثر على العميل — إضافة كعميل جديد؟</span>
                      <button
                        type="button"
                        disabled={creatingClient}
                        onClick={handleCreateClient}
                        className="text-xs bg-teal-700 text-white px-3 py-1 rounded hover:bg-teal-800 disabled:opacity-50"
                      >
                        {creatingClient ? '...' : 'إضافة'}
                      </button>
                    </div>
                  ) : null}
                </div>
              )}

              {/* ─── الخطوة 3 ─── */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">إجراءات (اختياري)</label>
                    <select
                      className="w-full border border-gray-300 rounded-md p-2 text-right bg-white text-sm"
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
                    <input type="checkbox" checked={returnedFromTrial} onChange={(e) => setReturnedFromTrial(e.target.checked)} />
                    تمت إعادة العاملة من التجربة
                  </label>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">نتيجة التجربة <span className="text-red-500">*</span></label>
                    <div className="flex gap-5">
                      {(['ناجحة', 'فاشلة'] as const).map((v) => (
                        <label key={v} className="inline-flex items-center gap-2 cursor-pointer text-sm">
                          <input type="radio" name="res" checked={trialResult === v} onChange={() => setTrialResult(v)} />
                          {v}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">ملاحظات (اختياري)</label>
                    <textarea
                      className="w-full border border-gray-300 rounded-md p-2 text-right text-sm min-h-[80px]"
                      value={trialNotes}
                      onChange={(e) => setTrialNotes(e.target.value)}
                      placeholder="أي تفاصيل إضافية..."
                    />
                  </div>
                </div>
              )}

              {/* ─── الخطوة 4 ─── */}
              {step === 3 && (
                <div className="space-y-4">
                  {/* ملخص */}
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">العاملة</span>
                      <span className="font-medium">{worker.maidDisplayName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">الكفيل الحالي</span>
                      <span className="font-medium">{worker.oldClientName || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">العميل الجديد</span>
                      <span className="font-medium text-teal-800">{pickedNewClient?.fullname || trialClientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">نتيجة التجربة</span>
                      <span className={`font-medium ${trialResult === 'ناجحة' ? 'text-green-700' : 'text-red-600'}`}>{trialResult}</span>
                    </div>
                    {durationSummary && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">مدة التجربة</span>
                        <span>{durationSummary}</span>
                      </div>
                    )}
                  </div>

                  {/* حقول إضافية */}
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="تاريخ العقد" type="date" value={contractDate} onChange={setContractDate} />
                    <Field label="مدة العمل" value={workDuration} onChange={setWorkDuration} placeholder="مثال: سنة واحدة" />
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">التكلفة (ريال)</label>
                      <input
                        className="w-full border border-gray-300 rounded-md p-2 text-right text-sm"
                        inputMode="decimal"
                        value={cost}
                        onChange={(e) => setCost(numInput(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">المدفوع (ريال)</label>
                      <input
                        className="w-full border border-gray-300 rounded-md p-2 text-right text-sm"
                        inputMode="decimal"
                        value={paid}
                        onChange={(e) => setPaid(numInput(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    {remaining && (
                      <div className="col-span-2">
                        <Field label="المتبقي (ريال)" value={remaining} readOnly />
                      </div>
                    )}
                    <Field label="رقم الإقامة" value={nationalID} onChange={setNationalID} placeholder="اختياري" />
                    <Field label="رقم عملية النقل" value={transferOpNum} onChange={setTransferOpNum} placeholder="اختياري" />
                    <div className="col-span-2">
                      <Field label="تاريخ تنفيذ النقل" type="date" value={transferingDate} onChange={setTransferingDate} />
                    </div>
                  </div>

                  {saveError && (
                    <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">{saveError}</p>
                  )}

                  <button
                    type="button"
                    disabled={saving || missingIds || !pickedNewClient}
                    onClick={handleSave}
                    className="w-full py-2.5 rounded-lg bg-teal-900 text-white font-semibold hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {saving ? 'جاري الحفظ...' : 'حفظ معاملة نقل الكفالة'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!savedId && (
          <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
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
                className="px-5 py-2 rounded-md bg-teal-800 text-white text-sm hover:bg-teal-900 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setStep(step + 1)}
              >
                التالي
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
