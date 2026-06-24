import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { jwtDecode } from "jwt-decode";

const prisma = new PrismaClient();

export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Missing Homemaid ID" });
  }

  try {
    // Read user token to log who performed the action
    const cookieHeader = req.headers.cookie;
    let userName = "System";
    if (cookieHeader) {
      const cookies: { [key: string]: string } = {};
      cookieHeader.split(";").forEach((cookie) => {
        const [key, value] = cookie.trim().split("=");
        cookies[key] = decodeURIComponent(value);
      });
      if (cookies.authToken) {
        try {
          const decoded: any = jwtDecode(cookies.authToken);
          userName = decoded.username || userName;
        } catch (e) {
          console.error("Invalid token", e);
        }
      }
    }

    // 1. Reactivate the Homemaid
    const updatedHomemaid = await prisma.homemaid.update({
      where: { id: Number(id) },
      data: {
        bookingstatus: "", // Or you can set to 'available' depending on your default
        // We don't set isApproved here because it requires administrative check,
        // or we can set it back to true if you want. Let's leave isApproved as it is or set to true?
        // Usually, the admin will approve it again manually, or we can just reactivate it fully.
      },
    });

    // 2. Unhide their neworders and make them available again
    await prisma.neworder.updateMany({
      where: { HomemaidId: Number(id) },
      data: {
        isHidden: false,
        isAvailable: true,
      },
    });

    // 3. Log the reactivation action
    await prisma.logs.create({
      data: {
        Status: "إعادة تنشيط",
        Details: "إعادة تنشيط عاملة بعد مغادرة خارجية",
        userId: userName,
        homemaidId: Number(id),
      },
    });

    return res.status(200).json({
      message: "تم إعادة تنشيط العاملة بنجاح",
      homemaid: updatedHomemaid,
    });
  } catch (error: any) {
    console.error("Error reactivating homemaid:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    await prisma.$disconnect();
  }
}
