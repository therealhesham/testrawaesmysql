import { useEffect, useMemo, useState } from 'react';
import { differenceInCalendarDays, isValid, parseISO, startOfDay } from 'date-fns';

function parseContractDate(s: string): Date | null {
  const t = s.trim();
  if (!t) return null;
  const fromIso = parseISO(t);
  if (isValid(fromIso)) return fromIso;
  const fallback = new Date(t);
  return isValid(fallback) ? fallback : null;
}

/** يوم تقويمي واحد: مستقبل | غير صالح | عدد الأيام منذ العقد */
function resolveElapsedCalendarDays(s: string | null | undefined): number | 'future' | null {
  if (!s || s.trim() === '' || s === 'N/A') return null;
  const start = parseContractDate(s);
  if (!start) return null;
  const today = startOfDay(new Date());
  const startDay = startOfDay(start);
  if (today.getTime() < startDay.getTime()) return 'future';
  return differenceInCalendarDays(today, startDay);
}

/** عدد الأيام (للتنسيق الشرطي؛ null إن لم يُحسب أو للمستقبل). */
export function getElapsedCalendarDaysSinceContract(s: string | null | undefined): number | null {
  const r = resolveElapsedCalendarDays(s);
  return typeof r === 'number' ? r : null;
}

/** نص المدة بالأيام فقط (للعرض والتصدير). */
export function formatElapsedSinceContractDate(s: string | null | undefined): string | null {
  const r = resolveElapsedCalendarDays(s);
  if (r === null) return null;
  if (r === 'future') return 'لم يحن تاريخ العقد بعد';

  const days = r;
  if (days === 0) return '0 يوم';
  if (days === 1) return 'يوم واحد';
  if (days === 2) return 'يومان';
  return `${days} يومًا`;
}

/** يُعرض بجانب تاريخ العقد: المدة بالأيام؛ أكثر من 70 يومًا بلون أحمر غامق. */
export default function ContractElapsedBadge({ contractDate }: { contractDate?: string | null }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((x) => x + 1), 60_000);
    return () => window.clearInterval(id);
  }, [contractDate]);

  const text = useMemo(() => formatElapsedSinceContractDate(contractDate), [contractDate, tick]);
  const days = useMemo(() => getElapsedCalendarDaysSinceContract(contractDate), [contractDate, tick]);

  if (!text) return null;

  const isLongDelay = days !== null && days > 70;
  const tone = isLongDelay ? 'text-red-900' : 'text-gray-600';
  const dotTone = isLongDelay ? 'text-red-800' : 'text-gray-400';

  return (
    <span className={`text-sm font-normal inline-block ${tone}`} title="المدة المنقضية منذ تاريخ العقد (بالأيام)">
      <span className={`mx-1 ${dotTone}`} aria-hidden>
        ·
      </span>
      <span className={`whitespace-nowrap ${isLongDelay ? 'font-semibold' : ''}`}>مضى {text}</span>
    </span>
  );
}
