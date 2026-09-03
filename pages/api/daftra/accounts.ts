import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// In-Memory Cache for Accounts and Categories (5 minutes TTL)
let cachedAccountsData: any = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function invalidateAccountsCache() {
  cachedAccountsData = null;
  lastCacheTime = 0;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const subdomain = process.env.DAFTRA_SUBDOMAIN || req.body?.subdomain || req.query?.subdomain;
  const apiKey = process.env.DAFTRA_API_KEY || req.body?.apiKey || req.query?.apiKey;
  const forceRefresh = req.body?.forceRefresh || req.query?.forceRefresh === 'true';

  if (!subdomain || !apiKey) {
    return res.status(400).json({ message: 'Missing subdomain or apiKey in .env or request' });
  }

  const now = Date.now();
  if (!forceRefresh && cachedAccountsData && (now - lastCacheTime < CACHE_TTL_MS)) {
    return res.status(200).json({ ...cachedAccountsData, fromCache: true });
  }

  try {
    const [accRes, catRes] = await Promise.allSettled([
      axios.get(`https://${subdomain}.daftra.com/v2/api/entity/journal_account/list?per_page=1000`, {
        headers: {
          'Accept': 'application/json',
          'APIKEY': apiKey,
        },
        timeout: 12000,
      }),
      axios.get(`https://${subdomain}.daftra.com/v2/api/entity/journal_cat/list?per_page=1000`, {
        headers: {
          'Accept': 'application/json',
          'APIKEY': apiKey,
        },
        timeout: 12000,
      })
    ]);

    const accounts = accRes.status === 'fulfilled' && accRes.value.data?.data ? accRes.value.data.data : [];
    const categories = catRes.status === 'fulfilled' && catRes.value.data?.data ? catRes.value.data.data : [];

    // Mark categories as is_category: true so they can be identified as parent categories
    const formattedCategories = categories.map((cat: any) => {
      const c = cat.JournalCat || cat;
      return {
        ...cat,
        is_category: true,
        is_parent: 1,
        id: c.id,
        name: c.name,
        code: c.code || '',
        JournalAccount: {
          id: c.id,
          name: c.name,
          code: c.code || '',
          is_category: true,
          is_parent: 1
        }
      };
    });

    const combined = [...formattedCategories, ...accounts];
    const result = { data: combined, categories, accounts };

    if (combined.length > 0) {
      cachedAccountsData = result;
      lastCacheTime = Date.now();
    }

    res.status(200).json({ ...result, fromCache: false });
  } catch (error: any) {
    if (cachedAccountsData) {
      return res.status(200).json({ ...cachedAccountsData, fromCache: true, fallback: true });
    }
    console.error('Error fetching accounts from Daftra:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: 'فشل في جلب شجرة الحسابات',
      error: error.response?.data || error.message
    });
  }
}

