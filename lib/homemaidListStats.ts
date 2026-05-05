import prisma from "lib/prisma";
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
  startDate?: string;
  endDate?: string;
};

/** نفس منطق تقرير الطلبات: أسبوع / شهر / سنة / مخصص — لاستخدامه في فلتر createdAt للطلبات */
export function resolveHomemaidOrderStatsDateRange(
  input: HomemaidOrderStatsPeriodInput
): { gte: Date; lte: Date } {
  const { period, monthSelection, startDate, endDate } = input;

  if (period === "week") {
    return { gte: subDays(new Date(), 7), lte: new Date() };
  }

  if (period === "month") {
    let targetMonth: Date;
    if (monthSelection === "previous") {
      targetMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    } else {
      targetMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    }
    const gte = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
    const lte = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0, 23, 59, 59, 999);
    return { gte, lte };
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

  // year (مطابق لـ pages/api/reports/orders.ts)
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
