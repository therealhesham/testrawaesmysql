import { NextApiRequest, NextApiResponse } from 'next';
import prisma from 'pages/api/globalprisma';
import { jwtDecode } from 'jwt-decode';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authentication check
  const cookieHeader = req.headers.cookie;
  let cookies: { [key: string]: string } = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach((cookie) => {
      const [key, value] = cookie.trim().split('=');
      cookies[key] = decodeURIComponent(value);
    });
  }

  if (!cookies.authToken) {
    return res.status(401).json({ error: 'Please log in first' });
  }

  try {
    // Verify token
    try {
      jwtDecode(cookies.authToken);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Fetch all users with their role names
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        phonenumber: true,
        email: true,
        role: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        username: 'asc',
      },
    });

    // Format the response to match the frontend expectations
    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.username,
      position: user.role?.name || 'مستقبل',
      department: user.role?.name || 'عام',
      phoneNumber: user.phonenumber || '',
      email: user.email || '',
      isActive: true,
    }));

    res.status(200).json(formattedUsers);
  } catch (error) {
    console.error('Error fetching users for SMS:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}
