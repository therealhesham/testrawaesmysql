import type { NextApiRequest, NextApiResponse } from "next";
import {
  buildHomemaidListStats,
  emptyHomemaidListStats,
  resolveHomemaidOrderStatsDateRange,
} from "lib/homemaidListStats";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const period = (req.query.period as string) || "month";
    const monthSelection = (req.query.monthSelection as string) || "current";
    const startDate = typeof req.query.startDate === "string" ? req.query.startDate : undefined;
    const endDate = typeof req.query.endDate === "string" ? req.query.endDate : undefined;

    if (period === "custom" && (!startDate || !endDate)) {
      return res.status(400).json({ error: "startDate and endDate are required for custom period" });
    }

    const dateRange = resolveHomemaidOrderStatsDateRange({
      period,
      monthSelection,
      startDate,
      endDate,
    });

    const [recruitment, rental] = await Promise.all([
      buildHomemaidListStats("recruitment", dateRange),
      buildHomemaidListStats("rental", dateRange),
    ]);

    return res.status(200).json({
      recruitment,
      rental,
      dateRange: {
        start: dateRange.gte.toISOString(),
        end: dateRange.lte.toISOString(),
        period,
        monthSelection: period === "month" ? monthSelection : undefined,
      },
    });
  } catch (e) {
    console.error("homemaid-profession-stats:", e);
    const empty = emptyHomemaidListStats();
    return res.status(200).json({
      recruitment: empty,
      rental: empty,
      dateRange: null,
    });
  }
}
