import type { NextApiRequest, NextApiResponse } from "next";
import { jwtDecode } from "jwt-decode";
import prisma from "lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get token from cookies
    const cookieHeader = req.headers.cookie;
    let cookies: { [key: string]: string } = {};
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie) => {
        const [key, value] = cookie.trim().split("=");
        cookies[key] = decodeURIComponent(value);
      });
    }

    if (!cookies.authToken) {
      return res.status(401).json({ error: 'No auth token' });
    }

    // Decode the token
    try {
      const token = jwtDecode(cookies.authToken) as any;
      
      // Check if token has expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (token.exp && token.exp < currentTime) {
        return res.status(401).json({ error: 'Token expired' });
      }
      
      // Get user with role and permissions
      const user = await prisma.user.findUnique({
        where: { id: Number(token.id) },
        include: { role: true }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const rolePermissions = user.role?.permissions as any;

      // Return user info with permissions
      return res.status(200).json({ 
        user: {
          id: token.id,
          username: token.username || 'مستخدم',
          role: token.role,
          picture: token.picture,
          permissions: rolePermissions || {}
        }
      });

    } catch (error) {
      console.error("Token decode error:", error);
      return res.status(401).json({ error: 'Invalid token' });
    }

  } catch (error) {
    console.error("Error getting user:", error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

