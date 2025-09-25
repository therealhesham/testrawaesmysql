import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { jwtDecode } from "jwt-decode";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get token from cookies first
    const cookieHeader = req.headers.cookie;
    console.log(cookieHeader);
    let cookies: { [key: string]: string } = {};
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie) => {
        const [key, value] = cookie.trim().split("=");
        cookies[key] = decodeURIComponent(value);
      });
    }

    if (!cookies.authToken) {
      return res.status(401).json({ hasPermission: false, error: 'No auth token' });
    }

    let tokenUserId;
    try {
      const token = jwtDecode(cookies.authToken) as any;
      tokenUserId = token.id;
    } catch (error) {
      console.error("Token decode error:", error);
      return res.status(401).json({ hasPermission: false, error: 'Invalid token' });
    }

    // Find user with role and permissions
    const findUser = await prisma.user.findUnique({
      where: { id: Number(tokenUserId) },
      include: { role: true },
    });

    if (!findUser) {
      return res.status(404).json({ hasPermission: false, error: 'User not found' });
    }

    if (!findUser.role) {
      return res.status(403).json({ hasPermission: false, error: 'No role assigned' });
    }

    // Check if user has the required permission
    const permissions = findUser.role.permissions as any;
    const hasPermission = permissions?.["إدارة الطلبات"]?.["عرض"] === true;

    console.log("User permissions check:", {
      userId: findUser.id,
      role: findUser.role.name,
      permissions: permissions,
      hasOrderManagementView: hasPermission
    });

    return res.status(200).json({ 
      hasPermission,
      user: {
        id: findUser.id,
        username: findUser.username,
        role: findUser.role?.name
      }
    });

  } catch (error) {
    console.error("Permission verification error:", error);
    return res.status(500).json({ hasPermission: false, error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
