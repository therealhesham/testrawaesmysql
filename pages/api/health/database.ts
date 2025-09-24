import type { NextApiRequest, NextApiResponse } from "next";
import { checkDatabaseHealth, testHomemaidQuery } from "../../../lib/database-health";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const [dbHealth, homemaidTest] = await Promise.all([
      checkDatabaseHealth(),
      testHomemaidQuery()
    ]);

    const isHealthy = dbHealth.status === 'healthy' && homemaidTest.success;

    res.status(isHealthy ? 200 : 500).json({
      success: isHealthy,
      database: dbHealth,
      homemaidQuery: homemaidTest,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });

  } catch (error) {
    console.error("Health check failed:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
