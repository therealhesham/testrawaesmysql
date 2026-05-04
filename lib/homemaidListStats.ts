import prisma from "lib/prisma";

export interface HomemaidListStats {
  gender: { male: number; female: number; other: number; total: number };
  byProfession: { name: string; count: number; professionId: number | null }[];
}

function normalizeProfessionGender(g: string | null | undefined): "male" | "female" | "other" {
  const v = (g ?? "").trim().toLowerCase();
  if (v === "male" || v === "m" || v === "ذكر") return "male";
  if (v === "female" || v === "f" || v === "أنثى" || v === "انثى") return "female";
  return "other";
}

export async function buildHomemaidListStats(
  contractType: "recruitment" | "rental"
): Promise<HomemaidListStats> {
  const groups = await prisma.homemaid.groupBy({
    by: ["professionId"],
    where: { contractType },
    _count: { _all: true },
  });

  const ids = Array.from(
    new Set(groups.map((g) => g.professionId).filter((id): id is number => id != null))
  );
  const profList =
    ids.length > 0
      ? await prisma.professions.findMany({
          where: { id: { in: ids } },
          select: { id: true, name: true, gender: true },
        })
      : [];
  const profById = new Map(profList.map((p) => [p.id, p]));

  let male = 0;
  let female = 0;
  let other = 0;
  const byProfession: HomemaidListStats["byProfession"] = [];

  for (const g of groups) {
    const cnt = g._count._all;
    const prof = g.professionId != null ? profById.get(g.professionId) : undefined;
    const name = prof?.name ?? "بدون مهنة";
    byProfession.push({ name, count: cnt, professionId: g.professionId ?? null });

    if (g.professionId == null || !prof) {
      other += cnt;
      continue;
    }
    const bucket = normalizeProfessionGender(prof.gender);
    if (bucket === "male") male += cnt;
    else if (bucket === "female") female += cnt;
    else other += cnt;
  }

  byProfession.sort((a, b) => b.count - a.count);
  const total = male + female + other;
  return {
    gender: { male, female, other, total },
    byProfession,
  };
}

export const emptyHomemaidListStats = (): HomemaidListStats => ({
  gender: { male: 0, female: 0, other: 0, total: 0 },
  byProfession: [],
});
