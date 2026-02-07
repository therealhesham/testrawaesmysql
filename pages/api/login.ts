import jwt from "jsonwebtoken";
import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
// Secret key for JWT token signing
const JWT_SECRET = "your-secret-key";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST method
  if (req.method !== "POST") {
    return res.status(405).json({ message: "الطريقة غير مسموحة" });
  }

  try {
    const { id, password } = req.body;

    // Validate input
    if (!id) {
      return res.status(400).json({ message: "الرقم التعريفي مطلوب" });
    }

    // Find user by idnumber
    const user = await prisma.user.findUnique({
      where: {
        idnumber: Number(id),
      },
    });

    if (!user) {
      return res.status(401).json({ message: "البيانات غير صحيحة" });
    }

    if (!user?.idnumber) {
      return res.status(401).json({ message: "الرقم التعريفي غير صحيح" });
    }

    // Password login: if user has a password set, require and verify it (plain text comparison)
    const hasPassword = !!user.password && String(user.password).trim().length > 0;
    if (hasPassword) {
      const passwordProvided = typeof password === "string" && password.length > 0;
      if (!passwordProvided) {
        return res.status(401).json({ message: "كلمة المرور مطلوبة" });
      }
      if (user.password !== password) {
        return res.status(401).json({ message: "كلمة المرور غير صحيحة" });
      }
    }
   

    // Create JWT token
    const token = jwt.sign(
      { username: user.username, role: user.roleId, picture: user.pictureurl, id: user.id },
      "rawaesecret",
      { expiresIn: "6h" } // Token expires in 6 hours
    );

    // Set JWT token as an HTTP-only cookie in the response
    res.setHeader(
      "Set-Cookie",
      "authToken=" + token + "; Path=/; HttpOnly; Secure; SameSite=Strict"
    );
    // Respond with success message
    res.status(200).json(token);
  } catch (e: any) {
    console.log(e);
    
    // Check if it's a Prisma database error
    if (e.code && e.code.startsWith('P')) {
      // Prisma error codes
      if (e.code === 'P2002') {
        return res.status(409).json({ message: "خطأ في قاعدة البيانات: البيانات مكررة" });
      }
      if (e.code === 'P2025') {
        return res.status(404).json({ message: "خطأ في قاعدة البيانات: السجل غير موجود" });
      }
      if (e.code === 'P1001' || e.code === 'P1002' || e.code === 'P1003') {
        return res.status(503).json({ message: "خطأ في قاعدة البيانات: لا يمكن الاتصال بقاعدة البيانات" });
      }
      if (e.code === 'P2003') {
        return res.status(400).json({ message: "خطأ في قاعدة البيانات: انتهاك القيود المرجعية" });
      }
      // Generic Prisma error
      return res.status(500).json({ message: `خطأ في قاعدة البيانات: ${e.message || "حدث خطأ غير متوقع"}` });
    }

    // Check if it's a JWT error
    if (e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') {
      return res.status(500).json({ message: "خطأ في إنشاء رمز الدخول" });
    }

    // Check if it's a validation error
    if (e.name === 'ValidationError') {
      return res.status(400).json({ message: `خطأ في البيانات: ${e.message}` });
    }

    // Generic error
    return res.status(500).json({ message: "حدث خطأ في الخادم" });
  }
}
