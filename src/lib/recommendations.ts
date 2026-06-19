export type RecommendationType = "page2_trap" | "low_ctr" | "high_ctr_low_impressions";
export type Priority = "high" | "medium" | "low";

export interface Recommendation {
  id: string;
  type: RecommendationType;
  priority: Priority;
  tag: string;
  tagColor: string;
  title: string;
  description: string;
  action: string;
  query?: string;
  page?: string;
  metrics: {
    impressions: number;
    clicks: number;
    ctr: number;
    position: number;
    estimatedGain: number;
  };
}

// Industry average CTR by position
const CTR_BENCHMARK: Record<number, number> = {
  1: 0.28, 2: 0.15, 3: 0.11, 4: 0.08, 5: 0.07,
  6: 0.05, 7: 0.04, 8: 0.03, 9: 0.025, 10: 0.02,
};

export function getBenchmarkCtr(position: number): number {
  const rounded = Math.round(position);
  if (rounded <= 1) return CTR_BENCHMARK[1];
  if (rounded >= 10) return CTR_BENCHMARK[10];
  return CTR_BENCHMARK[rounded] ?? 0.02;
}

export function getPriority(estimatedGain: number): Priority {
  if (estimatedGain >= 100) return "high";
  if (estimatedGain >= 30) return "medium";
  return "low";
}

type GscGroup = {
  query: string | null;
  _sum: { clicks: number | null; impressions: number | null };
  _avg: { ctr: number | null; position: number | null };
};

export function buildPage2TrapRecs(rows: GscGroup[]): Recommendation[] {
  return rows
    .filter(
      (r) =>
        r.query &&
        (r._avg.position ?? 0) >= 11 &&
        (r._avg.position ?? 0) <= 20 &&
        (r._sum.impressions ?? 0) >= 50
    )
    .map((r) => {
      const impressions = r._sum.impressions ?? 0;
      const clicks = r._sum.clicks ?? 0;
      const ctr = r._avg.ctr ?? 0;
      const position = r._avg.position ?? 0;
      // Estimated gain: if this query moved to position 5
      const estimatedGain = Math.round(impressions * (0.07 - ctr));

      return {
        id: `page2_${r.query}`,
        type: "page2_trap" as RecommendationType,
        priority: getPriority(estimatedGain),
        tag: "Ranking",
        tagColor: "bg-purple-100 text-purple-700",
        title: `"${r.query}" is stuck on page 2`,
        description: `This query gets ${impressions.toLocaleString()} impressions at position ${position.toFixed(1)} — just off page 1. A small ranking improvement could unlock significant traffic.`,
        action: "Strengthen the page with updated content, better internal links, or targeted link building.",
        query: r.query ?? undefined,
        metrics: { impressions, clicks, ctr, position, estimatedGain: Math.max(0, estimatedGain) },
      };
    })
    .filter((r) => r.metrics.estimatedGain > 0)
    .sort((a, b) => b.metrics.estimatedGain - a.metrics.estimatedGain)
    .slice(0, 10);
}

export function buildLowCtrRecs(rows: GscGroup[]): Recommendation[] {
  return rows
    .filter((r) => {
      const position = r._avg.position ?? 0;
      const impressions = r._sum.impressions ?? 0;
      const ctr = r._avg.ctr ?? 0;
      const benchmark = getBenchmarkCtr(position);
      return (
        r.query &&
        position >= 1 &&
        position <= 10 &&
        impressions >= 100 &&
        ctr < benchmark * 0.6  // CTR is less than 60% of the benchmark for that position
      );
    })
    .map((r) => {
      const impressions = r._sum.impressions ?? 0;
      const clicks = r._sum.clicks ?? 0;
      const ctr = r._avg.ctr ?? 0;
      const position = r._avg.position ?? 0;
      const benchmark = getBenchmarkCtr(position);
      const estimatedGain = Math.round(impressions * (benchmark * 0.6 - ctr));

      return {
        id: `lowctr_${r.query}`,
        type: "low_ctr" as RecommendationType,
        priority: getPriority(estimatedGain),
        tag: "CTR",
        tagColor: "bg-orange-100 text-orange-700",
        title: `"${r.query}" has weak CTR for its ranking`,
        description: `Ranking at position ${(r._avg.position ?? 0).toFixed(1)} with ${((ctr) * 100).toFixed(1)}% CTR — expected is ~${(benchmark * 100).toFixed(0)}% at that position. ${impressions.toLocaleString()} impressions are being wasted.`,
        action: "Rewrite the title tag and meta description to be more compelling and match search intent.",
        query: r.query ?? undefined,
        metrics: { impressions, clicks, ctr, position, estimatedGain: Math.max(0, estimatedGain) },
      };
    })
    .filter((r) => r.metrics.estimatedGain > 0)
    .sort((a, b) => b.metrics.estimatedGain - a.metrics.estimatedGain)
    .slice(0, 10);
}

export function buildHighCtrLowImpressionsRecs(rows: GscGroup[]): Recommendation[] {
  return rows
    .filter((r) => {
      const ctr = r._avg.ctr ?? 0;
      const impressions = r._sum.impressions ?? 0;
      const clicks = r._sum.clicks ?? 0;
      return r.query && ctr >= 0.05 && impressions < 500 && clicks >= 3;
    })
    .map((r) => {
      const impressions = r._sum.impressions ?? 0;
      const clicks = r._sum.clicks ?? 0;
      const ctr = r._avg.ctr ?? 0;
      const position = r._avg.position ?? 0;
      // Estimated gain if impressions doubled
      const estimatedGain = Math.round(impressions * ctr);

      return {
        id: `highctr_${r.query}`,
        type: "high_ctr_low_impressions" as RecommendationType,
        priority: getPriority(estimatedGain),
        tag: "Visibility",
        tagColor: "bg-blue-100 text-blue-700",
        title: `"${r.query}" converts well but lacks visibility`,
        description: `${((ctr) * 100).toFixed(1)}% CTR shows this content resonates with searchers — but only ${impressions.toLocaleString()} people see it. It ranks at position ${position.toFixed(1)}.`,
        action: "Build internal links to this page and target related keywords to grow impressions.",
        query: r.query ?? undefined,
        metrics: { impressions, clicks, ctr, position, estimatedGain: Math.max(0, estimatedGain) },
      };
    })
    .sort((a, b) => b.metrics.ctr - a.metrics.ctr)
    .slice(0, 10);
}
