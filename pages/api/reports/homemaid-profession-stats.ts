import type { NextApiRequest, NextApiResponse } from "next";
import { buildHomemaidListStats, emptyHomemaidListStats } from "lib/homemaidListStats";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const [recruitment, rental] = await Promise.all([
      buildHomemaidListStats("recruitment"),
      buildHomemaidListStats("rental"),
    ]);
    return res.status(200).json({ recruitment, rental });
  } catch (e) {
    console.error("homemaid-profession-stats:", e);
    const empty = emptyHomemaidListStats();
    return res.status(200).json({ recruitment: empty, rental: empty });
  }
}
