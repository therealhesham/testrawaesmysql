import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "./globalprisma";
// @ts-ignore
import nodemailer from "nodemailer";

const DAYS = 20;

const SMTP_HOST = process.env.SMTP_HOST ?? "mail.rawaes.com";
const SMTP_USER = process.env.SMTP_USER ?? "wasl@rawaes.com";
const SMTP_PASS = process.env.SMTP_PASS ?? "M)czeC4JHXd~H42Q";

function getDateThreshold(): Date {
  const d = new Date();
  d.setDate(d.getDate() - DAYS);
  return d;
}

function groupByOffice(
  rows: { id: number; Name: string | null; officeName: string | null }[]
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const r of rows) {
    const office = (r.officeName || "Unknown Office").trim() || "Unknown Office";
    const name = r.Name || "Unknown Name";
    if (!map.has(office)) map.set(office, []);
    map.get(office)!.push(name);
  }
  return map;
}

function buildMailTransporter() {
  if (!SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: true,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

/**
 * يومياً (تشغيل يدوي): إخفاء العاملات الأقدم من 20 يوماً عبر isApproved=false،
 * وإشعار المكاتب بالعاملات غير المعتمدة وبدون طلب (نفس منطق n8n).
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.query.secret !== cronSecret) {
    return res.status(401).json({ ok: false, message: "Unauthorized" });
  }

  try {
    const dateThreshold = getDateThreshold();

    const candidates = await prisma.homemaid.findMany({
      where: {
        createdAt: { lt: dateThreshold },
        OR: [{ isApproved: false }, { isApproved: null }],
        NewOrder: { none: {} },
      },
      select: {
        id: true,
        Name: true,
        officeName: true,
      },
    });

    const updateResult = await prisma.homemaid.updateMany({
      where: { createdAt: { lt: dateThreshold } },
      data: { isApproved: false },
    });

    const grouped = groupByOffice(candidates);
    const officeKeys = [...Array.from(grouped.keys())].filter((k) => k !== "Unknown Office");
    const offices =
      officeKeys.length > 0
        ? await prisma.offices.findMany({
            where: { office: { in: officeKeys } },
            select: { office: true, email: true },
          })
        : [];
    const emailByOffice = new Map(
      offices.map((o) => [o.office || "", o.email || ""])
    );

    const transporter = buildMailTransporter();
    const emailsSent: string[] = [];
    const emailErrors: string[] = [];

    if (transporter && grouped.size > 0) {
      const from = process.env.SMTP_FROM ?? SMTP_USER;
      for (const [officeName, names] of Array.from(grouped.entries())) {
        const to = emailByOffice.get(officeName)?.trim();
        if (!to) {
          emailErrors.push(`${officeName}: no office email`);
          continue;
        }
        const bodyLines = names.map((n) => `- ${n}`).join("\n");
        const text = `الرجاء فحص العاملات التالية:\n${bodyLines}`;
        try {
          await transporter.sendMail({
            from,
            to,
            subject: "check the availabilty of homemaid",
            text,
          });
          emailsSent.push(to);
        } catch (e: any) {
          emailErrors.push(`${officeName}: ${e?.message || String(e)}`);
        }
      }
    } else if (!transporter && grouped.size > 0) {
      emailErrors.push("SMTP not configured (missing SMTP_PASS)");
    }

    return res.status(200).json({
      ok: true,
      dateThreshold: dateThreshold.toISOString(),
      candidatesForNotification: candidates.length,
      updatedRows: updateResult.count,
      emailsSentTo: emailsSent,
      emailErrors: emailErrors.length ? emailErrors : undefined,
    });
  } catch (error: any) {
    console.error("homemaid-hide-old-unapproved:", error);
    return res.status(500).json({
      ok: false,
      message: error?.message || "Internal error",
    });
  }
}
