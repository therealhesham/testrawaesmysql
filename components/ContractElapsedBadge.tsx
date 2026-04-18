import { useEffect, useMemo, useState } from 'react';
import { intervalToDuration, isValid, parseISO } from 'date-fns';

function parseContractDate(s: string): Date | null {
  const t = s.trim();
  if (!t) return null;
  const fromIso = parseISO(t);
  if (isValid(fromIso)) return fromIso;
  const fallback = new Date(t);
  return isValid(fallback) ? fallback : null;
}

/** نص المدة المنقضية منذ تاريخ العقد (للعرض في الجداول والتصدير دون مكوّن React). */
export function formatElapsedSinceContractDate(s: string | null | undefined): string | null {
  if (!s || s.trim() === '' || s === 'N/A') return null;
  const start = parseContractDate(s);
  if (!start) return null;
  const end = new Date();
  if (end.getTime() < start.getTime()) return 'لم يحن تاريخ العقد بعد';

  const { years = 0, months = 0, days = 0, hours = 0, minutes = 0 } = intervalToDuration({
    start,
    end,
  });
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'سنة' : 'سنوات'}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? 'شهراً' : 'أشهر'}`);
  if (days > 0) parts.push(`${days} ${days === 1 ? 'يوماً' : 'أياماً'}`);
  if (parts.length === 0) {
    if (hours > 0) return `${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`;
    if (minutes > 0) return `${minutes} دقيقة`;
    return 'أقل من دقيقة';
  }
  return parts.join(' و ');
}

/** يُعرض بجانب تاريخ العقد: المدة المنقضية منذ ذلك التاريخ (يُحدَّث كل دقيقة). */
export default function ContractElapsedBadge({ contractDate }: { contractDate?: string | null }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((x) => x + 1), 60_000);
    return () => window.clearInterval(id);
  }, [contractDate]);

  const text = useMemo(() => formatElapsedSinceContractDate(contractDate), [contractDate, tick]);
  if (!text) return null;

  return (
    <span
      className="text-sm text-gray-600 font-normal inline-block"
      title="المدة المنقضية منذ تاريخ العقد"
    >
      <span className="text-gray-400 mx-1" aria-hidden>
        ·
      </span>
      <span className="whitespace-nowrap">مضى {text}</span>
    </span>
  );
}
