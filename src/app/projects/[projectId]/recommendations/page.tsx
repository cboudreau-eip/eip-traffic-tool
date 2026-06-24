import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  buildPage2TrapRecs,
  buildLowCtrRecs,
  buildHighCtrLowImpressionsRecs,
  buildHighBounceRecs,
  buildLowConversionRecs,
  buildDecliningTrafficRecs,
  type Recommendation,
} from "@/lib/recommendations";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber, formatPercent } from "@/lib/utils";
import { TrendingUp, MousePointerClick, Eye, Lightbulb, ArrowUp, AlertCircle, TrendingDown, Target, Activity } from "lucide-react";
import { RegenerateButton } from "@/components/recommendations/regenerate-button";

export const dynamic = "force-dynamic";

const PRIORITY_STYLES = {
  high: "border-l-red-500",
  medium: "border-l-orange-400",
  low: "border-l-yellow-400",
};

const PRIORITY_LABELS = {
  high: "High Impact",
  medium: "Medium Impact",
  low: "Low Impact",
};

const TYPE_ICONS = {
  page2_trap: TrendingUp,
  low_ctr: MousePointerClick,
  high_ctr_low_impressions: Eye,
  high_bounce: Activity,
  low_conversion: Target,
  declining_traffic: TrendingDown,
};

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const Icon = TYPE_ICONS[rec.type];
  return (
    <div className={`rounded-xl border-l-4 border border-gray-200 bg-white p-5 shadow-sm ${PRIORITY_STYLES[rec.priority]}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50">
            <Icon className="h-4 w-4 text-gray-500" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${rec.tagColor}`}>
                {rec.tag}
              </span>
              <span className="text-xs text-gray-400">{PRIORITY_LABELS[rec.priority]}</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900">{rec.title}</h3>
            <p className="mt-1 text-xs text-gray-500 leading-relaxed">{rec.description}</p>
            <div className="mt-2 flex items-start gap-1.5">
              <ArrowUp className="mt-0.5 h-3 w-3 shrink-0 text-orange-500" />
              <p className="text-xs font-medium text-orange-600">{rec.action}</p>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="shrink-0 text-right">
          <p className="text-lg font-bold text-gray-900">
            +{formatNumber(rec.metrics.estimatedGain)}
          </p>
          <p className="text-xs text-gray-400">est. clicks</p>
          <div className="mt-2 space-y-0.5">
            <p className="text-xs text-gray-500">
              {formatNumber(rec.metrics.impressions)} imp
            </p>
            <p className="text-xs text-gray-500">
              {formatPercent(rec.metrics.ctr)} CTR
            </p>
            <p className="text-xs text-gray-500">
              pos {rec.metrics.position.toFixed(1)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  recs,
  emptyMsg,
}: {
  title: string;
  description: string;
  recs: Recommendation[];
  emptyMsg: string;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      {recs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-8 text-center">
          <p className="text-sm text-gray-400">{emptyMsg}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recs.map((rec) => (
            <RecommendationCard key={rec.id} rec={rec} />
          ))}
        </div>
      )}
    </div>
  );
}

export default async function RecommendationsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) notFound();

  const [gscGroups, ga4Groups, ga4DateRows, gscTotal, ga4Total] = await Promise.all([
    prisma.gscRow.groupBy({
      by: ["query"],
      where: { upload: { projectId }, query: { not: null } },
      _sum: { clicks: true, impressions: true },
      _avg: { ctr: true, position: true },
    }),
    prisma.ga4Row.groupBy({
      by: ["pagePath"],
      where: { upload: { projectId }, pagePath: { not: null } },
      _sum: { sessions: true, pageViews: true, conversions: true },
      _avg: { bounceRate: true, avgSessionDur: true },
    }),
    prisma.ga4Row.groupBy({
      by: ["pagePath", "date"],
      where: { upload: { projectId }, pagePath: { not: null }, date: { not: null } },
      _sum: { sessions: true },
    }),
    prisma.gscRow.count({ where: { upload: { projectId } } }),
    prisma.ga4Row.count({ where: { upload: { projectId } } }),
  ]);

  const page2Recs = buildPage2TrapRecs(gscGroups);
  const lowCtrRecs = buildLowCtrRecs(gscGroups);
  const highCtrRecs = buildHighCtrLowImpressionsRecs(gscGroups);
  const highBounceRecs = buildHighBounceRecs(ga4Groups);
  const lowConvRecs = buildLowConversionRecs(ga4Groups);
  const decliningRecs = buildDecliningTrafficRecs(ga4DateRows);

  const allRecs = [...page2Recs, ...lowCtrRecs, ...highCtrRecs, ...highBounceRecs, ...lowConvRecs, ...decliningRecs];
  const totalRecs = allRecs.length;
  const totalEstimatedGain = allRecs.reduce((sum, r) => sum + r.metrics.estimatedGain, 0);

  const hasGscData = gscGroups.length > 0;
  const hasGa4Data = ga4Groups.length > 0;
  const hasAnyData = gscTotal > 0 || ga4Total > 0;
  // GSC rows exist but none have a query column — page-level export
  const gscMissingQuery = gscTotal > 0 && gscGroups.length === 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        {totalRecs > 0 && (
          <p className="text-sm" style={{ color: "#5d6a80" }}>
            <span className="font-bold text-orange-500">+{formatNumber(totalEstimatedGain)}</span>
            {" "}estimated clicks available
          </p>
        )}
        <div className="ml-auto">
          <RegenerateButton />
        </div>
      </div>

      {!hasAnyData && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <Lightbulb className="h-6 w-6 text-orange-500" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900">No data yet</h2>
          <p className="mt-2 max-w-sm text-sm text-gray-500">
            Upload a Google Search Console or GA4 export to generate recommendations.
          </p>
        </div>
      )}

      {gscMissingQuery && !hasGa4Data && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-orange-200 bg-orange-50 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <AlertCircle className="h-6 w-6 text-orange-500" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-gray-900">GSC data found, but no query column</h2>
          <p className="mt-2 max-w-md text-sm text-gray-500">
            Your Search Console export appears to be a <strong>page-level</strong> report. Recommendations need a <strong>query-level</strong> export.
          </p>
          <p className="mt-3 max-w-md text-xs text-gray-400">
            In Google Search Console → Search Results → make sure <strong>Queries</strong> is selected as the dimension before exporting.
          </p>
        </div>
      )}

      {(hasGscData || hasGa4Data) && totalRecs === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <AlertCircle className="h-6 w-6 text-green-500" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-gray-900">No major issues found</h2>
          <p className="mt-2 max-w-sm text-sm text-gray-500">
            Your GSC data looks healthy. Upload more data or check back after your next export.
          </p>
        </div>
      )}

      {(hasGscData || hasGa4Data) && totalRecs > 0 && (
        <>
          {/* Summary bar */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Page 2 Trap", count: page2Recs.length, gain: page2Recs.reduce((s, r) => s + r.metrics.estimatedGain, 0), color: "text-purple-600" },
              { label: "Low CTR Opportunities", count: lowCtrRecs.length, gain: lowCtrRecs.reduce((s, r) => s + r.metrics.estimatedGain, 0), color: "text-orange-600" },
              { label: "Visibility Gaps", count: highCtrRecs.length, gain: highCtrRecs.reduce((s, r) => s + r.metrics.estimatedGain, 0), color: "text-blue-600" },
              { label: "High Bounce Pages", count: highBounceRecs.length, gain: highBounceRecs.reduce((s, r) => s + r.metrics.estimatedGain, 0), color: "text-red-600" },
              { label: "Low Conversion Pages", count: lowConvRecs.length, gain: lowConvRecs.reduce((s, r) => s + r.metrics.estimatedGain, 0), color: "text-yellow-600" },
              { label: "Declining Pages", count: decliningRecs.length, gain: decliningRecs.reduce((s, r) => s + r.metrics.estimatedGain, 0), color: "text-gray-600" },
            ].map((item) => (
              <Card key={item.label}>
                <CardContent className="p-4">
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <p className={`mt-1 text-xl font-bold ${item.color}`}>{item.count} found</p>
                  <p className="text-xs text-gray-400">+{formatNumber(item.gain)} est. clicks</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {hasGscData && (
            <>
              <Section
                title="Page 2 Trap"
                description="Queries ranking positions 11–20 with enough impressions to be worth pushing to page 1."
                recs={page2Recs}
                emptyMsg="No page 2 opportunities found."
              />

              <Section
                title="Low CTR for Ranking"
                description="Queries ranking on page 1 but getting fewer clicks than expected — title or meta description needs work."
                recs={lowCtrRecs}
                emptyMsg="No low-CTR opportunities found."
              />

              <Section
                title="High CTR, Low Visibility"
                description="Content that converts well when people see it — but not enough people are seeing it."
                recs={highCtrRecs}
                emptyMsg="No visibility gap opportunities found."
              />
            </>
          )}

          {hasGa4Data && (
            <>
              <Section
                title="High Bounce Rate Pages"
                description="Pages with significant traffic but visitors leave immediately — content or intent mismatch."
                recs={highBounceRecs}
                emptyMsg="No high-bounce pages found."
              />

              <Section
                title="Low Conversion Pages"
                description="Pages getting sessions but failing to convert — missing CTAs or poor conversion path."
                recs={lowConvRecs}
                emptyMsg="No low-conversion opportunities found."
              />

              <Section
                title="Declining Traffic Pages"
                description="Pages where sessions dropped more than 20% from the first half to the second half of your date range."
                recs={decliningRecs}
                emptyMsg="No significant traffic declines detected."
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
