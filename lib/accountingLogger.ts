import prisma from './prisma';
import { NextApiRequest } from 'next';
import { jwtDecode } from 'jwt-decode';

// Helper function to get user info from cookies
export const getUserFromCookies = (req: NextApiRequest) => {
  const cookieHeader = req.headers.cookie;
  let cookies: { [key: string]: string } = {};
  if (cookieHeader) {
    cookieHeader.split(";").forEach((cookie) => {
      const [key, value] = cookie.trim().split("=");
      cookies[key] = decodeURIComponent(value);
    });
  }
  
  if (cookies.authToken) {
    try {
      const token = jwtDecode(cookies.authToken) as any;
      return { userId: Number(token.id), username: token.username };
    } catch (error) {
      console.error('Error decoding token:', error);
      return { userId: null, username: 'غير محدد' };
    }
  }
  
  return { userId: null, username: 'غير محدد' };
};

// Interface for accounting log data
interface AccountingLogData {
  action: string;
  actionType: string;
  actionStatus?: 'success' | 'failed';
  actionAmount?: number | string;
  actionClientId?: number;
  actionUserId?: number;
  actionNotes?: string;
  pageRoute?: string;
}

/**
 * Helper function to log accounting actions to AccountSystemLogs
 * @param data - The log data to be recorded
 */
export async function logAccountingAction(data: AccountingLogData): Promise<void> {
  try {
    await prisma.accountSystemLogs.create({
      data: {
        action: data.action,
        actionType: data.actionType,
        actionStatus: data.actionStatus || 'success',
        actionAmount: data.actionAmount ? Number(data.actionAmount) : null,
        actionClientId: data.actionClientId || null,
        actionUserId: data.actionUserId || null,
        actionNotes: data.actionNotes || null,
      }
    });
  } catch (error) {
    console.error('Error creating accounting system log:', error);
    // Don't throw error to prevent breaking the main operation
  }
}

/**
 * Helper function to log accounting actions from API request
 * Automatically extracts user info from cookies
 */
export async function logAccountingActionFromRequest(
  req: NextApiRequest,
  data: Omit<AccountingLogData, 'actionUserId'>
): Promise<void> {
  const { userId } = getUserFromCookies(req);
  await logAccountingAction({
    ...data,
    actionUserId: userId || undefined,
  });
}

