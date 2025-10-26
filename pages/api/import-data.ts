import type { NextApiRequest, NextApiResponse } from "next";
import { formidable } from "formidable";
import fs from "fs";
import xlsx from "xlsx";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = formidable({ uploadDir: "./Uploads", keepExtensions: true });

  try {
    const { fields, files } = await new Promise<{ fields: any; files: any }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    const file = Array.isArray(files.excelFile) ? files.excelFile[0] : files.excelFile;
    const mappings = JSON.parse(fields.mappings as string);

    if (!file) {
      return res.status(400).json({ error: "لم يتم رفع ملف" });
    }

    // قراءة ملف Excel
    const workbook = xlsx.readFile(file.filepath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet);

    // تحويل البيانات بناءً على المطابقة
    const prismaData = rows.map((row: any) => {
      const mappedRow: any = {};
      for (const [excelHeader, prismaField] of Object.entries(mappings)) {
        if (prismaField) {
          mappedRow[prismaField] = row[excelHeader] || null;
        }
      }
      return mappedRow;
    });

    // رفع البيانات إلى Prisma
    await prisma.homemaid.createMany({
      data: prismaData,
      skipDuplicates: true,
    });

    // حذف الملف بعد الرفع
    fs.unlinkSync(file.filepath);

    res.status(200).json({ message: "تم رفع البيانات بنجاح" });
  } catch (error) {
    console.error("Error importing data:", error);
    res.status(500).json({ error: "فشل في رفع البيانات" });
  }
}