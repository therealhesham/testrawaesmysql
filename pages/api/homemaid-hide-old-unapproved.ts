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

type OfficeRow = { id: number; name: string };

function groupByOffice(
  rows: { id: number; Name: string | null; officeName: string | null }[]
): Map<string, OfficeRow[]> {
  const map = new Map<string, OfficeRow[]>();
  for (const r of rows) {
    const office = (r.officeName || "Unknown Office").trim() || "Unknown Office";
    const name = r.Name || "Unknown Name";
    if (!map.has(office)) map.set(office, []);
    map.get(office)!.push({ id: r.id, name });
  }
  return map;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHomemaidTableEmailHtml(officeName: string, rows: OfficeRow[]): string {
  const tableRows = rows
    .map(
      (row, i) => `
    <tr style="background-color: ${i % 2 === 0 ? "#ffffff" : "#f8f9fa"};">
      <td style="padding: 10px 14px; border: 1px solid #dee2e6; text-align: center; font-size: 14px; color: #333;">${i + 1}</td>
      <td style="padding: 10px 14px; border: 1px solid #dee2e6; text-align: center; font-size: 14px; color: #115e59; font-weight: 600;">${row.id}</td>
      <td style="padding: 10px 14px; border: 1px solid #dee2e6; text-align: right; font-size: 14px; color: #333;">${escapeHtml(row.name)}</td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Tahoma,Arial,sans-serif;background:#f4f4f4;direction:rtl;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:16px auto;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.08);overflow:hidden;">
    <tr>
      <td style="background:linear-gradient(90deg,#0d9488,#14b8a6);padding:18px 20px;text-align:right;">
        <h1 style="color:#fff;margin:0;font-size:18px;font-weight:bold;">تنبيه: مراجعة توفر العاملات</h1>
        <p style="color:#e0f2f1;margin:8px 0 0;font-size:14px;">المكتب: <strong>${escapeHtml(officeName)}</strong></p>
      </td>
    </tr>
    <tr>
      <td style="padding:20px;">
        <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 16px;">
          الرجاء فحص العاملات التالية (هل ما زالت بدون طلب):
        </p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
          <thead>
            <tr>
              <th style="background:#f1f5f9;padding:12px;border:1px solid #cbd5e1;text-align:center;font-size:13px;color:#334155;">#</th>
              <th style="background:#f1f5f9;padding:12px;border:1px solid #cbd5e1;text-align:center;font-size:13px;color:#334155;">معرّف العاملة</th>
              <th style="background:#f1f5f9;padding:12px;border:1px solid #cbd5e1;text-align:right;font-size:13px;color:#334155;">الاسم</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </td>
    </tr>
    <tr>
      <td style="background:#f8fafc;padding:12px;text-align:center;border-top:1px solid #e2e8f0;">
        <p style="color:#64748b;font-size:12px;margin:0;">روائس — قسم الاستقدام</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildHomemaidTablePlainText(officeName: string, rows: OfficeRow[]): string {
  const header = `المكتب: ${officeName}\nالرجاء فحص العاملات التالية:\n\n`;
  const lines = rows.map(
    (r, i) => `${i + 1}. [${r.id}] ${r.name}`
  );
  return header + lines.join("\n");
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
      for (const [officeName, rows] of Array.from(grouped.entries())) {
        const to = emailByOffice.get(officeName)?.trim();
        if (!to) {
          emailErrors.push(`${officeName}: no office email`);
          continue;
        }
        const html = buildHomemaidTableEmailHtml(officeName, rows);
        const text = buildHomemaidTablePlainText(officeName, rows);
        try {
          await transporter.sendMail({
            from,
            to,
            subject: "check the availabilty of homemaid",
            text,
            html,
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
