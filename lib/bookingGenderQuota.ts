import type { PrismaClient } from "@prisma/client";

/** نافذة الحجز: من 8 الشهر الميلادي الحالي (حسب اليوم) إلى 6 الشهر التالي — انظر التعليق في getBookingQuotaWindow */
export function getBookingQuotaWindow(reference: Date = new Date()): { start: Date; end: Date } {
  const y = reference.getFullYear();
  const m = reference.getMonth();
  const d = reference.getDate();

  let startYear = y;
  let startMonth = m;
  if (d < 7) {
    startMonth = m - 1;
    if (startMonth < 0) {
      startMonth = 11;
      startYear -= 1;
    }
  }

  const start = new Date(startYear, startMonth, 8, 0, 0, 0, 0);
  const endMonth = startMonth + 1;
  const endYear = endMonth > 11 ? startYear + 1 : startYear;
  const endM = endMonth > 11 ? 0 : endMonth;
  const end = new Date(endYear, endM, 6, 23, 59, 59, 999);
  return { start, end };
}

/** نافذة 8→7 التي تسبق `getBookingQuotaWindow(reference)` مباشرةً (للتقارير: «المدة السابقة»). */
export function getPreviousBookingQuotaWindow(reference: Date = new Date()): { start: Date; end: Date } {
  const cur = getBookingQuotaWindow(reference);
  const start = new Date(cur.start);
  start.setMonth(start.getMonth() - 1);
  const end = new Date(cur.end);
  end.setMonth(end.getMonth() - 1);
  return { start, end };
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

/** استجابة الخادم عند تجاوز النسبة دون تأكيد المستخدم بعد */
export const REQUIRES_GENDER_QUOTA_CONFIRMATION = "requiresGenderQuotaConfirmation" as const;

export type BookingGenderQuotaEvaluation =
  | { ok: true }
  /** خطأ يمنع الطلب (مثل عاملة غير موجودة) */
  | { ok: false; hardBlock: true; message: string }
  /** تجاوز نسبة الحجز — يُسمح بعد تأكيد المستخدم في الواجهة ثم إعادة الإرسال مع confirmGenderQuotaWarning */
  | { ok: false; hardBlock: false; message: string };

/**
 * تقييم نسب الذكور/الإناث في نافذة الحجز (٨–٧). لا يُستخدم للمنع الصارم:
 * عند تجاوز الحد يُرجع hardBlock: false مع رسالة تنبيه للـ confirm في الواجهة.
 */
export async function evaluateBookingGenderQuota(
  prisma: PrismaClient,
  homemaidId: number
): Promise<BookingGenderQuotaEvaluation> {
  const maid = await prisma.homemaid.findUnique({
    where: { id: homemaidId },
    select: {
      id: true,
      contractType: true,
      professionId: true,
      profession: { select: { gender: true } },
    },
  });

  if (!maid) {
    return { ok: false, hardBlock: true, message: "العاملة غير موجودة" };
  }

  const bucket = normalizeProfessionGender(maid.profession?.gender ?? null);
  if (bucket === "other") {
    return { ok: true };
  }

  const cfg = await prisma.percentage.findFirst({
    orderBy: { id: "desc" },
    select: { malePercentage: true, femalePercentage: true },
  });

  const maxMale = cfg?.malePercentage != null ? Number(cfg.malePercentage) : null;
  const maxFemale = cfg?.femalePercentage != null ? Number(cfg.femalePercentage) : null;

  if (maxMale == null && maxFemale == null) {
    return { ok: true };
  }

  const { start, end } = getBookingQuotaWindow();
  const contractType = maid.contractType || "recruitment";

  const orders = await prisma.neworder.findMany({
    where: {
      HomemaidId: { not: null },
      createdAt: { gte: start, lte: end },
      HomeMaid: { contractType },
    },
    select: {
      bookingstatus: true,
      HomeMaid: {
        select: {
          profession: { select: { gender: true } },
        },
      },
    },
  });

  const active = orders.filter((o) => !isOrderExcludedByStatus(o.bookingstatus));

  let male = 0;
  let female = 0;
  let other = 0;
  for (const o of active) {
    const g = normalizeProfessionGender(o.HomeMaid?.profession?.gender ?? null);
    if (g === "male") male++;
    else if (g === "female") female++;
    else other++;
  }

  const total = male + female + other;
  const nextTotal = total + 1;
  const nextMale = male + (bucket === "male" ? 1 : 0);
  const nextFemale = female + (bucket === "female" ? 1 : 0);

  if (bucket === "male" && maxMale != null) {
    const pct = (nextMale / nextTotal) * 100;
    if (pct > maxMale + 1e-6) {
      return {
        ok: false,
        hardBlock: false,
        message: `تنبيه: بعد هذا الحجز ستصبح نسبة طلبات الذكور أعلى من الحد المسموح (${maxMale}٪) خلال فترة الحجز الحالية (${start.toLocaleDateString("ar-EG")} – ${end.toLocaleDateString("ar-EG")}).`,
      };
    }
  }

  if (bucket === "female" && maxFemale != null) {
    const pct = (nextFemale / nextTotal) * 100;
    if (pct > maxFemale + 1e-6) {
      return {
        ok: false,
        hardBlock: false,
        message: `تنبيه: بعد هذا الحجز ستصبح نسبة طلبات الإناث أعلى من الحد المسموح (${maxFemale}٪) خلال فترة الحجز الحالية (${start.toLocaleDateString("ar-EG")} – ${end.toLocaleDateString("ar-EG")}).`,
      };
    }
  }

  return { ok: true };
}

export function parseConfirmGenderQuotaWarning(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const v = (body as Record<string, unknown>).confirmGenderQuotaWarning;
  return v === true || v === "true";
}
