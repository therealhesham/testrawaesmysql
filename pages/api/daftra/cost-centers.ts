import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// In-Memory Cache for Cost Centers (5 minutes TTL)
let cachedCostCentersData: any = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function invalidateCostCentersCache() {
  cachedCostCentersData = null;
  lastCacheTime = 0;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const subdomain = process.env.DAFTRA_SUBDOMAIN || req.body?.subdomain || req.query?.subdomain;
  const apiKey = process.env.DAFTRA_API_KEY || req.body?.apiKey || req.query?.apiKey;
  const forceRefresh = req.body?.forceRefresh || req.query?.forceRefresh === 'true';

  if (!subdomain || !apiKey) {
    return res.status(400).json({ message: 'Missing subdomain or API key in .env or request' });
  }

  const now = Date.now();
  if (!forceRefresh && cachedCostCentersData && (now - lastCacheTime < CACHE_TTL_MS)) {
    return res.status(200).json({ ...cachedCostCentersData, fromCache: true });
  }

  try {
    const response = await axios.get(`https://${subdomain}.daftra.com/v2/api/entity/cost_center/list?per_page=1000`, {
      headers: {
        'Accept': 'application/json',
        'APIKEY': apiKey,
      },
      timeout: 10000,
    });

    cachedCostCentersData = response.data;
    lastCacheTime = Date.now();

    res.status(200).json({ ...response.data, fromCache: false });
  } catch (error: any) {
    // If Daftra fails or times out, fallback to cache if available
    if (cachedCostCentersData) {
      return res.status(200).json({ ...cachedCostCentersData, fromCache: true, fallback: true });
    }
    console.error('Error fetching cost centers from Daftra:', error?.response?.data || error.message);
    res.status(error?.response?.status || 500).json(error?.response?.data || { message: 'Internal Server Error' });
  }
}

