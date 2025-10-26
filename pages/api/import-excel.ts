import type { NextApiRequest, NextApiResponse } from "next";
import { formidable } from "formidable";
import fs from "fs";
import xlsx from "xlsx";

// تعطيل body parser عشان نستقبل ملفات
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
    if (!file) {
      return res.status(400).json({ error: "لم يتم رفع ملف" });
    }

    const workbook = xlsx.readFile(file.filepath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    // استخراج الـ headers (أول صف)
    const headers = data[0] as string[];

    // حذف الملف بعد القراءة
    fs.unlinkSync(file.filepath);

    res.status(200).json({ headers });
  } catch (error) {
    console.error("Error reading Excel file:", error);
    res.status(500).json({ error: "فشل في قراءة الملف" });
  }
}