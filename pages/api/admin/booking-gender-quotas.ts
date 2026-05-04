import type { NextApiRequest, NextApiResponse } from "next";
import { jwtDecode } from "jwt-decode";
import prisma from "lib/prisma";

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((c) => {
    const [k, ...rest] = c.trim().split("=");
    if (k) cookies[k] = decodeURIComponent(rest.join("=") || "");
  });
  return cookies;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cookies = parseCookies(req.headers.cookie);
  if (!cookies.authToken) {
    return res.status(401).json({ message: "غير مصرح" });
  }

  try {
    jwtDecode(cookies.authToken) as { id: number };
  } catch {
    return res.status(401).json({ message: "جلسة غير صالحة" });
  }

  if (req.method === "GET") {
    try {
      const row = await prisma.percentage.findFirst({
        orderBy: { id: "desc" },
        select: { id: true, malePercentage: true, femalePercentage: true },
      });
      return res.status(200).json({
        id: row?.id ?? null,
        malePercentage: row?.malePercentage != null ? Number(row.malePercentage) : null,
        femalePercentage: row?.femalePercentage != null ? Number(row.femalePercentage) : null,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "خطأ في جلب الإعدادات" });
    }
  }

  if (req.method === "PUT" || req.method === "POST") {
    const male = req.body?.malePercentage;
    const female = req.body?.femalePercentage;
    const m = male === "" || male === undefined || male === null ? null : Number(male);
    const f = female === "" || female === undefined || female === null ? null : Number(female);
    if (m != null && (Number.isNaN(m) || m < 0 || m > 100)) {
      return res.status(400).json({ message: "نسبة الذكور يجب أن تكون بين 0 و 100" });
    }
    if (f != null && (Number.isNaN(f) || f < 0 || f > 100)) {
      return res.status(400).json({ message: "نسبة الإناث يجب أن تكون بين 0 و 100" });
    }
    try {
      const existing = await prisma.percentage.findFirst({ orderBy: { id: "desc" } });
      if (existing) {
        await prisma.percentage.update({
          where: { id: existing.id },
          data: {
            malePercentage: m ?? undefined,
            femalePercentage: f ?? undefined,
          },
        });
      } else {
        await prisma.percentage.create({
          data: {
            malePercentage: m ?? undefined,
            femalePercentage: f ?? undefined,
          },
        });
      }
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "فشل حفظ الإعدادات" });
    }
  }

  res.setHeader("Allow", "GET, PUT, POST");
  return res.status(405).json({ message: "Method not allowed" });
}
