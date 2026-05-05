import prisma from "lib/prisma";
import { getBookingQuotaWindow, getPreviousBookingQuotaWindow } from "lib/bookingGenderQuota";
import { subDays } from "date-fns";

export type HomemaidListStats = {
  gender: { male: number; female: number; other: number; total: number };
  byProfession: { name: string; count: number; professionId: number | null }[];
};

export function emptyHomemaidListStats(): HomemaidListStats {
  return {
    gender: { male: 0, female: 0, other: 0, total: 0 },
    byProfession: [],
  };
}

function normalizeProfessionGender(g: string | null | undefined): "male" | "female" | "other" {
  const v = (g ?? "").trim().toLowerCase();
  if (v === "male" || v === "m" || v === "ذكر") return "male";
  if (v === "female" || v === "f" || v === "أنثى" || v === "انثى") return "female";
  return "other";
}

function isOrderExcludedByStatus(bookingstatus: string | null | undefined): boolean {
  const s = (bookingstatus ?? "").trim().toLowerCase();
  return s === "cancelled" || s === "rejected";
}

export type HomemaidOrderStatsPeriodInput = {
  period: string;
  monthSelection?: string;
  /** YYYY-MM — لاختيار نافذة 8→7 لأي شهر (يتجاوز monthSelection إن أُعطي) */
  referenceMonth?: string;
  startDate?: string;
  endDate?: string;
};

function parseReferenceMonth(value: string | undefined): Date | null {
  if (!value) return null;
  const m = value.match(/^(\d{4})-(\d{1,2})$/);
  if (!m) return null;
  const year = Number(m[1]);
  const monthIndex = Number(m[2]) - 1;
  if (!Number.isFinite(year) || monthIndex < 0 || monthIndex > 11) return null;
  return new Date(year, monthIndex, 15, 12, 0, 0, 0);
}

/** أسبوع / «شهري» بنافذة 8→7 (مثل حصص الحجز) / سنة / مخصص — لفلتر createdAt للطلبات */
export function resolveHomemaidOrderStatsDateRange(
  input: HomemaidOrderStatsPeriodInput
): { gte: Date; lte: Date } {
  const { period, monthSelection, referenceMonth, startDate, endDate } = input;

  if (period === "week") {
    return { gte: subDays(new Date(), 7), lte: new Date() };
  }

  if (period === "month") {
    const refDate = parseReferenceMonth(referenceMonth);
    if (refDate) {
      // أي شهر تختاره → نافذة 8→7 المنطلقة من ذلك الشهر
      const start = new Date(refDate.getFullYear(), refDate.getMonth(), 8, 0, 0, 0, 0);
      const end = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 7, 23, 59, 59, 999);
      return { gte: start, lte: end };
    }
    if (monthSelection === "previous") {
      const { start, end } = getPreviousBookingQuotaWindow();
      return { gte: start, lte: end };
    }
    const { start, end } = getBookingQuotaWindow();
    return { gte: start, lte: end };
  }

  if (period === "custom") {
    if (startDate && endDate) {
      const gte = new Date(startDate);
      const lte = new Date(endDate);
      lte.setHours(23, 59, 59, 999);
      return { gte, lte };
    }
    throw new Error("custom period requires startDate and endDate");
  }

  // year (مطابق لتقرير الطلبات عند period !== week|month|custom)
  return {
    gte: new Date(new Date().getFullYear(), 0, 1),
    lte: new Date(new Date().getFullYear() + 1, 0, 1),
  };
}

/**
 * إحصائيات مبنية على الطلبات (neworder): كل طلب (غير ملغى/مرفوض) يُحسب مرة واحدة،
 * والجنس والمهنة من العاملة المرتبطة عبر HomemaidId وجدول professions.
 * @param dateRange إن وُجد يُقيَّد الطلبات بـ createdAt ضمن النطاق
 */
export async function buildHomemaidListStats(
  contractType: "recruitment" | "rental",
  dateRange?: { gte: Date; lte: Date } | null
): Promise<HomemaidListStats> {
  const orders = await prisma.neworder.findMany({
    where: {
      HomemaidId: { not: null },
      HomeMaid: { contractType },
      ...(dateRange
        ? {
            createdAt: {
              gte: dateRange.gte,
              lte: dateRange.lte,
            },
          }
        : {}),
    },
    select: {
      id: true,
      bookingstatus: true,
      HomeMaid: {
        select: {
          professionId: true,
          profession: { select: { id: true, name: true, gender: true } },
        },
      },
    },
  });

  const filtered = orders.filter((o) => !isOrderExcludedByStatus(o.bookingstatus));

  let male = 0;
  let female = 0;
  let other = 0;
  /** مفتاح داخلي للتجميع — القيمة تحتوي professionId الحقيقي للفلترة في القائمة */
  const professionBuckets = new Map<
    string,
    { professionId: number | null; name: string; count: number }
  >();

  const bumpProfession = (bucketKey: string, professionId: number | null, displayName: string) => {
    const prev = professionBuckets.get(bucketKey);
    if (prev) {
      prev.count += 1;
    } else {
      professionBuckets.set(bucketKey, { professionId, name: displayName, count: 1 });
    }
  };

  for (const o of filtered) {
    const maid = o.HomeMaid;
    if (!maid) {
      other += 1;
      bumpProfession("orphan", null, "طلب بدون بيان عاملة");
      continue;
    }

    const pid = maid.professionId ?? null;
    const prof = maid.profession;
    const profName = prof?.name ?? "بدون مهنة";

    if (pid == null) {
      bumpProfession("noprof", null, "بدون مهنة");
    } else {
      bumpProfession(`id:${pid}`, pid, profName);
    }

    if (pid == null || !prof) {
      other += 1;
      continue;
    }

    const bucket = normalizeProfessionGender(prof.gender);
    if (bucket === "male") male += 1;
    else if (bucket === "female") female += 1;
    else other += 1;
  }

  const byProfession: HomemaidListStats["byProfession"] = Array.from(professionBuckets.values()).map(
    ({ professionId, name, count }) => ({
      name,
      count,
      professionId,
    })
  );
  byProfession.sort((a, b) => b.count - a.count);

  const total = male + female + other;
  return {
    gender: { male, female, other, total },
    byProfession,
  };
}
