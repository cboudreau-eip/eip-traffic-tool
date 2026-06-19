export type RecommendationType =
  | "page2_trap"
  | "low_ctr"
  | "high_ctr_low_impressions"
  | "high_bounce"
  | "low_conversion"
  | "declining_traffic";
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

type Ga4Group = {
  pagePath: string | null;
  _sum: { sessions: number | null; pageViews: number | null; conversions: number | null };
  _avg: { bounceRate: number | null; avgSessionDur: number | null };
};

export function buildHighBounceRecs(rows: Ga4Group[]): Recommendation[] {
  return rows
    .filter((r) => {
      const sessions = r._sum.sessions ?? 0;
      const bounceRate = r._avg.bounceRate ?? 0;
      return r.pagePath && sessions >= 50 && bounceRate > 0.7;
    })
    .map((r) => {
      const sessions = r._sum.sessions ?? 0;
      const bounceRate = r._avg.bounceRate ?? 0;
      const conversions = r._sum.conversions ?? 0;
      // Estimated gain: if bounce rate dropped to 50%, sessions that could convert
      const estimatedGain = Math.round(sessions * (bounceRate - 0.5));

      return {
        id: `highbounce_${r.pagePath}`,
        type: "high_bounce" as RecommendationType,
        priority: getPriority(estimatedGain),
        tag: "Engagement",
        tagColor: "bg-red-100 text-red-700",
        title: `High bounce rate on "${r.pagePath}"`,
        description: `${(bounceRate * 100).toFixed(0)}% of ${sessions.toLocaleString()} sessions bounce immediately — visitors aren't finding what they need. Average session duration is low.`,
        action: "Improve above-the-fold content, ensure the page matches search/ad intent, and add clear next steps.",
        page: r.pagePath ?? undefined,
        metrics: { impressions: 0, clicks: conversions, ctr: bounceRate, position: 0, estimatedGain: Math.max(0, estimatedGain) },
      };
    })
    .filter((r) => r.metrics.estimatedGain > 0)
    .sort((a, b) => b.metrics.estimatedGain - a.metrics.estimatedGain)
    .slice(0, 10);
}

export function buildLowConversionRecs(rows: Ga4Group[]): Recommendation[] {
  return rows
    .filter((r) => {
      const sessions = r._sum.sessions ?? 0;
      const conversions = r._sum.conversions ?? 0;
      const convRate = sessions > 0 ? conversions / sessions : 0;
      return r.pagePath && sessions >= 50 && convRate < 0.005;
    })
    .map((r) => {
      const sessions = r._sum.sessions ?? 0;
      const conversions = r._sum.conversions ?? 0;
      const convRate = sessions > 0 ? conversions / sessions : 0;
      // Estimated gain: conversions if rate improved to 1%
      const estimatedGain = Math.round(sessions * (0.01 - convRate));

      return {
        id: `lowconv_${r.pagePath}`,
        type: "low_conversion" as RecommendationType,
        priority: getPriority(estimatedGain),
        tag: "Conversions",
        tagColor: "bg-yellow-100 text-yellow-700",
        title: `"${r.pagePath}" gets traffic but no conversions`,
        description: `${sessions.toLocaleString()} sessions with only ${conversions} conversion${conversions !== 1 ? "s" : ""} (${(convRate * 100).toFixed(2)}% rate). This page has traffic but isn't driving action.`,
        action: "Add a clear call-to-action, reduce friction in the conversion path, or test a new offer.",
        page: r.pagePath ?? undefined,
        metrics: { impressions: 0, clicks: conversions, ctr: convRate, position: 0, estimatedGain: Math.max(0, estimatedGain) },
      };
    })
    .filter((r) => r.metrics.estimatedGain > 0)
    .sort((a, b) => b.metrics.estimatedGain - a.metrics.estimatedGain)
    .slice(0, 10);
}

type Ga4DateRow = {
  pagePath: string | null;
  date: string | null;
  _sum: { sessions: number | null };
};

export function buildDecliningTrafficRecs(rows: Ga4DateRow[]): Recommendation[] {
  const pageSessionsByDate = new Map<string, Map<string, number>>();
  for (const r of rows) {
    if (!r.pagePath || !r.date) continue;
    if (!pageSessionsByDate.has(r.pagePath)) pageSessionsByDate.set(r.pagePath, new Map());
    const dateMap = pageSessionsByDate.get(r.pagePath)!;
    dateMap.set(r.date, (dateMap.get(r.date) ?? 0) + (r._sum.sessions ?? 0));
  }

  const recs: Recommendation[] = [];

  for (const [pagePath, dateMap] of pageSessionsByDate) {
    const sortedDates = [...dateMap.keys()].sort();
    if (sortedDates.length < 4) continue;

    const mid = Math.floor(sortedDates.length / 2);
    const earlyDates = sortedDates.slice(0, mid);
    const lateDates = sortedDates.slice(mid);

    const earlySessions = earlyDates.reduce((s, d) => s + (dateMap.get(d) ?? 0), 0);
    const lateSessions = lateDates.reduce((s, d) => s + (dateMap.get(d) ?? 0), 0);

    if (earlySessions < 30) continue;

    const declineRate = (earlySessions - lateSessions) / earlySessions;
    if (declineRate < 0.2) continue;

    const estimatedGain = Math.round(earlySessions - lateSessions);

    recs.push({
      id: `declining_${pagePath}`,
      type: "declining_traffic" as RecommendationType,
      priority: getPriority(estimatedGain),
      tag: "Trend",
      tagColor: "bg-gray-100 text-gray-700",
      title: `Traffic to "${pagePath}" is declining`,
      description: `Sessions dropped ${(declineRate * 100).toFixed(0)}% from the first half to the second half of the date range (${earlySessions.toLocaleString()} → ${lateSessions.toLocaleString()} sessions). The page may be losing ranking or relevance.`,
      action: "Review ranking changes, refresh the content, and check for technical issues or cannibalization.",
      page: pagePath,
      metrics: { impressions: 0, clicks: lateSessions, ctr: declineRate, position: 0, estimatedGain },
    });
  }

  return recs.sort((a, b) => b.metrics.estimatedGain - a.metrics.estimatedGain).slice(0, 10);
}
