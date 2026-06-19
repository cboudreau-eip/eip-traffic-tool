import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  buildPage2TrapRecs,
  buildLowCtrRecs,
  buildHighCtrLowImpressionsRecs,
  type Recommendation,
} from "@/lib/recommendations";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatPercent } from "@/lib/utils";
import { TrendingUp, MousePointerClick, Eye, Lightbulb, ArrowUp, AlertCircle } from "lucide-react";

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

  const gscGroups = await prisma.gscRow.groupBy({
    by: ["query"],
    where: { upload: { projectId }, query: { not: null } },
    _sum: { clicks: true, impressions: true },
    _avg: { ctr: true, position: true },
  });

  const page2Recs = buildPage2TrapRecs(gscGroups);
  const lowCtrRecs = buildLowCtrRecs(gscGroups);
  const highCtrRecs = buildHighCtrLowImpressionsRecs(gscGroups);

  const totalRecs = page2Recs.length + lowCtrRecs.length + highCtrRecs.length;
  const totalEstimatedGain =
    [...page2Recs, ...lowCtrRecs, ...highCtrRecs].reduce(
      (sum, r) => sum + r.metrics.estimatedGain,
      0
    );

  const hasGscData = gscGroups.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recommendations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Actionable SEO opportunities ranked by estimated impact
          </p>
        </div>
        {totalRecs > 0 && (
          <div className="text-right">
            <p className="text-2xl font-bold text-orange-500">+{formatNumber(totalEstimatedGain)}</p>
            <p className="text-xs text-gray-500">estimated clicks available</p>
          </div>
        )}
      </div>

      {!hasGscData && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <Lightbulb className="h-6 w-6 text-orange-500" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900">No GSC data yet</h2>
          <p className="mt-2 max-w-sm text-sm text-gray-500">
            Upload a Google Search Console export to generate recommendations.
          </p>
        </div>
      )}

      {hasGscData && totalRecs === 0 && (
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

      {hasGscData && totalRecs > 0 && (
        <>
          {/* Summary bar */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Page 2 Trap", count: page2Recs.length, gain: page2Recs.reduce((s, r) => s + r.metrics.estimatedGain, 0), color: "text-purple-600" },
              { label: "Low CTR Opportunities", count: lowCtrRecs.length, gain: lowCtrRecs.reduce((s, r) => s + r.metrics.estimatedGain, 0), color: "text-orange-600" },
              { label: "Visibility Gaps", count: highCtrRecs.length, gain: highCtrRecs.reduce((s, r) => s + r.metrics.estimatedGain, 0), color: "text-blue-600" },
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
    </div>
  );
}
