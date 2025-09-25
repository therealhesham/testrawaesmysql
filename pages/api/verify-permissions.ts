import type { NextApiRequest, NextApiResponse } from "next";
import { jwtDecode } from "jwt-decode";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
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
      return res.status(401).json({ hasPermission: false, error: 'No auth token' });
    }

    // Simply try to decode the token to check if it's valid
    try {
      const token = jwtDecode(cookies.authToken) as any;
      
      // Check if token has expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (token.exp && token.exp < currentTime) {
        return res.status(401).json({ hasPermission: false, error: 'Token expired' });
      }

      // If token is valid and not expired, allow access
      return res.status(200).json({ 
        hasPermission: true,
        user: {
          id: token.id,
          username: token.username || 'مستخدم'
        }
      });

    } catch (error) {
      console.error("Token decode error:", error);
      return res.status(401).json({ hasPermission: false, error: 'Invalid token' });
    }

  } catch (error) {
    console.error("Permission verification error:", error);
    return res.status(500).json({ hasPermission: false, error: 'Internal server error' });
  }
}
