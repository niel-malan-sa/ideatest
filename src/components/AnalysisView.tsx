import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useTranslatePriority, useTranslateType } from "@/i18n/helpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Sparkles, Loader2, Copy, Check, Crosshair, MessageSquare, RefreshCw, TrendingUp, TrendingDown, Minus, FileText } from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ReferenceArea, Label } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Outcome {
  id: string;
  statement: string;
  type: string;
  importance: number | null;
  satisfaction: number | null;
}

interface Analysis {
  id: string;
  summary: string | null;
  recommendations: any;
  go_no_go: string | null;
  market_potential: string | null;
  action_items: any;
}

interface AnalysisViewProps {
  ideaName: string;
  ideaId: string;
  outcomes: Outcome[];
  analysis: Analysis | null;
  positioning: any | null;
  salesMessages: any | null;
  onRefresh: () => void;
}

export default function AnalysisView({ ideaName, ideaId, outcomes, analysis, positioning, salesMessages, onRefresh }: AnalysisViewProps) {
  const { t } = useLanguage();
  const translatePriority = useTranslatePriority();
  const translateType = useTranslateType();
  const [generatingPositioning, setGeneratingPositioning] = useState(false);
  const [generatingSales, setGeneratingSales] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [varianceData, setVarianceData] = useState<any[]>([]);

  // Fetch per-respondent scores for variance chart
  useEffect(() => {
    if (!ideaId) return;
    (async () => {
      const { data } = await supabase
        .from("outcome_scores")
        .select("outcome_id, importance, satisfaction")
        .eq("idea_id", ideaId);
      if (data && data.length > 0) {
        // Group by outcome_id
        const grouped: Record<string, { imp: number[]; sat: number[] }> = {};
        for (const row of data) {
          if (!grouped[row.outcome_id]) grouped[row.outcome_id] = { imp: [], sat: [] };
          grouped[row.outcome_id].imp.push(Number(row.importance));
          grouped[row.outcome_id].sat.push(Number(row.satisfaction));
        }
        setVarianceData(Object.entries(grouped).map(([oid, vals]) => ({
          outcome_id: oid,
          impMin: Math.min(...vals.imp),
          impMax: Math.max(...vals.imp),
          impAvg: Math.round((vals.imp.reduce((a, b) => a + b, 0) / vals.imp.length) * 10) / 10,
          satMin: Math.min(...vals.sat),
          satMax: Math.max(...vals.sat),
          satAvg: Math.round((vals.sat.reduce((a, b) => a + b, 0) / vals.sat.length) * 10) / 10,
          count: vals.imp.length,
        })));
      }
    })();
  }, [ideaId]);

  // Unmet Needs Index calculation — use varianceData averages as fallback
  const typeWeight: Record<string, number> = { functional: 1.0, emotional: 0.8, social: 0.7 };
  const scoredOutcomes = outcomes
    .map(o => {
      // Use outcome values if available, otherwise fall back to varianceData averages
      const vd = varianceData.find(v => v.outcome_id === o.id);
      const imp = o.importance != null ? Number(o.importance) : vd?.impAvg ?? null;
      const sat = o.satisfaction != null ? Number(o.satisfaction) : vd?.satAvg ?? null;
      if (imp == null || sat == null) return null;
      const gap = Math.max(0, imp - sat);
      const weight = typeWeight[o.type] ?? 1.0;
      const unmet_index = Math.round(((imp * gap) / 10) * weight * 100) / 100;
      return { ...o, importance: imp, satisfaction: sat, gap, unmet_index };
    })
    .filter((o): o is NonNullable<typeof o> => o !== null)
    .sort((a, b) => b.unmet_index - a.unmet_index);

  const scatterData = scoredOutcomes.map(o => ({
    x: o.satisfaction, y: o.importance,
    statement: o.statement.substring(0, 50) + (o.statement.length > 50 ? "…" : ""),
    fullStatement: o.statement,
    type: o.type,
    unmet_index: o.unmet_index,
  }));

  const topBar = scoredOutcomes.slice(0, 15).map(o => ({
    name: o.statement,
    score: o.unmet_index,
    full: o.statement,
    type: o.type,
  }));

  const goNoGo = analysis?.go_no_go?.split(":")?.[0]?.trim() || "";
  const goColor = goNoGo === "GO" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
    : goNoGo === "NO-GO" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";

  const exportCSV = () => {
    const headers = `${t("label.statement")},${t("label.type")},${t("label.importance")},${t("label.satisfaction")},${t("label.gap")},${t("label.unmetIndex")}\n`;
    const rows = scoredOutcomes.map(o => `"${o.statement}","${o.type}",${o.importance},${o.satisfaction},${o.gap},${o.unmet_index}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${ideaName}_analysis.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    const container = document.getElementById("analysis-view-container");
    if (!container) { toast.error("Could not find analysis content"); return; }

    toast.info(t("analysis.exportPDF") + "...");

    const html2canvas = (await import("html2canvas")).default;
    const { default: jsPDF } = await import("jspdf");

    // Capture the full rendered DOM as a canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: 900,
    });

    const imgData = canvas.toDataURL("image/png");
    const imgWidth = 190; // A4 width minus margins
    const pageHeight = 277; // A4 height minus margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const doc = new jsPDF("p", "mm", "a4");
    let heightLeft = imgHeight;
    let position = 10;

    // First page
    doc.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Additional pages
    while (heightLeft > 0) {
      position = position - pageHeight;
      doc.addPage();
      doc.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    doc.save(`${ideaName}_analysis_report.pdf`);
    toast.success(t("analysis.exportPDF"));
  };

  // Type distribution data for donut chart
  const typeCounts = outcomes.reduce((acc, o) => {
    const t = o.type || "functional";
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const typeData = Object.entries(typeCounts).map(([type, count]) => ({
    name: translateType(type),
    value: count,
    type,
  }));
  const TYPE_COLORS: Record<string, string> = {
    functional: "hsl(var(--primary))",
    emotional: "hsl(24 95% 53%)",
    social: "hsl(262 83% 58%)",
  };

  // Variance chart data: merge with outcome statements
  const varianceChartData = varianceData
    .map(v => {
      const outcome = outcomes.find(o => o.id === v.outcome_id);
      if (!outcome) return null;
      return {
        ...v,
        statement: outcome.statement.length > 60 ? outcome.statement.substring(0, 57) + "…" : outcome.statement,
        fullStatement: outcome.statement,
        spread: v.impMax - v.impMin + v.satMax - v.satMin,
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.spread - a.spread)
    .slice(0, 8);

  const allRecommendations: any[] = [];
  if (analysis?.recommendations && Array.isArray(analysis.recommendations)) {
    allRecommendations.push(...analysis.recommendations);
  }
  if (analysis?.action_items && Array.isArray(analysis.action_items)) {
    for (const item of analysis.action_items) {
      allRecommendations.push({ title: item.action, explanation: item.rationale, priority: item.priority });
    }
  }

  const handleGeneratePositioning = async () => {
    setGeneratingPositioning(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-positioning`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ idea_id: ideaId }),
      });
      const data = await res.json();
      if (!res.ok) toast.error(data.error || t("positioning.failed"));
      else { toast.success(t("positioning.generated")); onRefresh(); }
    } catch { toast.error(t("positioning.failed")); }
    setGeneratingPositioning(false);
  };

  const handleGenerateSales = async () => {
    if (!positioning) { toast.error(t("sales.needPositioning")); return; }
    setGeneratingSales(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-sales-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ idea_id: ideaId }),
      });
      const data = await res.json();
      if (!res.ok) toast.error(data.error || t("sales.failed"));
      else { toast.success(t("sales.generated")); onRefresh(); }
    } catch { toast.error(t("sales.failed")); }
    setGeneratingSales(false);
  };

  const copyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(t("sales.copied"));
    setTimeout(() => setCopiedField(null), 2000);
  };

  const posStatement = positioning?.positioning_statement as any;
  const valueHierarchy = positioning?.value_hierarchy as any;
  const competitive = positioning?.competitive_positioning as any;
  const altAngles = positioning?.alternative_angles as any[];
  const pitch = salesMessages?.elevator_pitch as any;
  const email = salesMessages?.cold_email as any;

  return (
    <div id="analysis-view-container" className="space-y-6">
      {/* Executive Summary */}
      {analysis && (
        <Card data-tour="an-summary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("analysis.results")}</CardTitle>
                <CardDescription>{t("analysis.aiGenerated")}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={exportPDF} className="gap-2">
                <FileText className="h-4 w-4" /> {t("analysis.exportPDF")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed whitespace-pre-line">{analysis.summary}</p>
            {/* Positioning summary in executive summary */}
            {posStatement?.primary && (
              <div className="rounded-md border border-primary/20 bg-primary/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Crosshair className="h-4 w-4 text-primary" />
                  {t("positioning.statement")}
                </div>
                <p className="text-sm italic leading-relaxed">{posStatement.primary}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Unmet Needs Table */}
      {scoredOutcomes.length > 0 && (
        <Card data-tour="an-unmet-table">
          <CardHeader>
            <CardTitle>{t("label.unmetIndex")}</CardTitle>
            <CardDescription>{t("analysis.topOpportunitiesDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">{t("label.statement")}</TableHead>
                  <TableHead className="w-[100px]">{t("label.type")}</TableHead>
                  <TableHead className="w-[80px] text-right">{t("label.importance")}</TableHead>
                  <TableHead className="w-[80px] text-right">{t("label.satisfaction")}</TableHead>
                  <TableHead className="w-[60px] text-right">{t("label.gap")}</TableHead>
                  <TableHead className="w-[80px] text-right">{t("label.unmetIndex")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scoredOutcomes.slice(0, 20).map((o) => (
                  <TableRow key={o.id} className={o.unmet_index >= 5 ? "bg-destructive/5" : o.unmet_index >= 3 ? "bg-yellow-50 dark:bg-yellow-900/10" : ""}>
                    <TableCell className="text-sm">{o.statement}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{translateType(o.type)}</Badge></TableCell>
                    <TableCell className="text-right font-medium">{o.importance}</TableCell>
                    <TableCell className="text-right font-medium">{o.satisfaction}</TableCell>
                    <TableCell className="text-right font-medium">{o.gap}</TableCell>
                    <TableCell className="text-right font-bold">{o.unmet_index}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ===== GO/NO-GO SCORECARD ===== */}
      {analysis && goNoGo && (
        <Card data-tour="an-gonogo" className="overflow-hidden">
          <div className={`flex items-center gap-4 p-4 ${
            goNoGo === "GO" ? "bg-green-500/10 border-b border-green-500/20" 
            : goNoGo === "NO-GO" ? "bg-destructive/10 border-b border-destructive/20" 
            : "bg-yellow-500/10 border-b border-yellow-500/20"
          }`}>
            <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${
              goNoGo === "GO" ? "bg-green-500/20 text-green-700 dark:text-green-400" 
              : goNoGo === "NO-GO" ? "bg-destructive/20 text-destructive" 
              : "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
            }`}>
              {goNoGo === "GO" ? <TrendingUp className="w-6 h-6" /> : goNoGo === "NO-GO" ? <TrendingDown className="w-6 h-6" /> : <Minus className="w-6 h-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("analysis.recommendation")}</p>
              <p className="text-sm font-bold">{analysis.go_no_go}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-muted-foreground">{t("analysis.outcomesAnalyzed")}</p>
              <p className="text-base font-bold">{scoredOutcomes.length}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Charts — Needs Landscape + Respondent Variance side by side */}
      <div data-tour="an-charts" className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("analysis.opportunityLandscape")}</CardTitle>
            <CardDescription>{t("analysis.landscapeDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            {scatterData.length > 0 ? (
              <>
                <div aria-hidden="true">
                  <ResponsiveContainer width="100%" height={340}>
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 40, left: 20 }}>
                      <ReferenceArea x1={0} x2={5} y1={5} y2={10} fill="hsl(142 71% 45% / 0.08)" fillOpacity={1} strokeOpacity={0}>
                        <Label value={t("analysis.unmetNeeds")} position="insideTopLeft" style={{ fontSize: 11, fontWeight: 600, fill: 'hsl(142 71% 35%)' }} offset={10} />
                      </ReferenceArea>
                      <ReferenceArea x1={5} x2={10} y1={0} y2={5} fill="hsl(0 84% 60% / 0.08)" fillOpacity={1} strokeOpacity={0}>
                        <Label value={t("analysis.metNeeds")} position="insideBottomRight" style={{ fontSize: 11, fontWeight: 600, fill: 'hsl(0 84% 45%)' }} offset={10} />
                      </ReferenceArea>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" dataKey="x" name={t("data.satisfaction")} domain={[0, 10]} tick={{ fontSize: 10 }} label={{ value: t("data.satisfaction"), position: "bottom", offset: 20, style: { fontSize: 11 } }} />
                      <YAxis type="number" dataKey="y" name={t("data.importance")} domain={[0, 10]} tick={{ fontSize: 10 }} label={{ value: t("data.importance"), angle: -90, position: "insideLeft", offset: -5, style: { fontSize: 11 } }} />
                      <Tooltip cursor={{ strokeDasharray: "3 3" }} content={({ payload }) => {
                        if (!payload?.[0]) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="rounded bg-card border p-2 text-xs shadow-lg max-w-[260px]">
                            <p className="font-medium">{d.fullStatement}</p>
                            <p>{t("data.importance")}: {d.y}, {t("data.satisfaction")}: {d.x}</p>
                            <p>{t("label.unmetIndex")}: {d.unmet_index}</p>
                          </div>
                        );
                      }} />
                      <Scatter data={scatterData} fill="hsl(var(--primary))" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                {/* Screen reader alternative */}
                <table className="sr-only">
                  <caption>{t("analysis.opportunityLandscape")}</caption>
                  <thead>
                    <tr>
                      <th>{t("label.statement")}</th>
                      <th>{t("label.importance")}</th>
                      <th>{t("label.satisfaction")}</th>
                      <th>{t("label.unmetIndex")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scatterData.map((d, i) => (
                      <tr key={i}>
                        <td>{d.fullStatement}</td>
                        <td>{d.y}</td>
                        <td>{d.x}</td>
                        <td>{d.unmet_index}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <div className="h-[340px] rounded-md border border-dashed border-border bg-muted/30 flex items-center justify-center px-6 text-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{t("analysis.landscapeEmptyTitle")}</p>
                  <p className="text-xs text-muted-foreground">{t("analysis.landscapeEmptyDesc")}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

          {/* ===== RESPONDENT VARIANCE ===== */}
          {varianceChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("analysis.varianceTitle")}</CardTitle>
                <CardDescription>{t("analysis.varianceDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {varianceChartData.map((d: any, i: number) => (
                    <div key={i} className="space-y-1">
                      <p className="text-xs font-medium truncate" title={d.fullStatement}>{d.statement}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-16 shrink-0">{t("data.importance")}</span>
                        <div className="flex-1 h-4 bg-muted rounded-full relative">
                          <div className="absolute h-full bg-primary/25 rounded-full" style={{ left: `${(d.impMin / 10) * 100}%`, width: `${((d.impMax - d.impMin) / 10) * 100}%` }} />
                          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary border-2 border-background" style={{ left: `calc(${(d.impAvg / 10) * 100}% - 6px)` }} />
                        </div>
                        <span className="text-[10px] font-mono w-14 text-right shrink-0">{d.impMin}–{d.impMax} (ø{d.impAvg})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-16 shrink-0">{t("data.satisfaction")}</span>
                        <div className="flex-1 h-4 bg-muted rounded-full relative">
                          <div className="absolute h-full bg-orange-400/25 rounded-full" style={{ left: `${(d.satMin / 10) * 100}%`, width: `${((d.satMax - d.satMin) / 10) * 100}%` }} />
                          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-orange-500 border-2 border-background" style={{ left: `calc(${(d.satAvg / 10) * 100}% - 6px)` }} />
                        </div>
                        <span className="text-[10px] font-mono w-14 text-right shrink-0">{d.satMin}–{d.satMax} (ø{d.satAvg})</span>
                      </div>
                    </div>
                  ))}
                  <p className="text-[10px] text-muted-foreground mt-2">
                    ● = {t("analysis.average")} | ▬ = {t("analysis.range")} (min–max)
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

      {/* Top Unmet Needs bar chart */}
      {topBar.length > 0 && (
        <Card>
          <CardHeader><CardTitle>{t("analysis.topOpportunities")}</CardTitle></CardHeader>
          <CardContent>
            <div aria-hidden="true">
              <ResponsiveContainer width="100%" height={Math.max(300, topBar.length * 55)}>
                <BarChart data={topBar} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={350} tick={{ fontSize: 11, width: 340 }} interval={0} />
                  <Tooltip content={({ payload }) => {
                    if (!payload?.[0]) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded bg-card border p-2 text-xs shadow-lg max-w-[320px]">
                        <p className="font-medium">{d.full}</p>
                        <p>{t("label.unmetIndex")}: {d.score}</p>
                      </div>
                    );
                  }} />
                  <Bar dataKey="score" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Screen reader alternative */}
            <table className="sr-only">
              <caption>{t("analysis.topOpportunities")}</caption>
              <thead>
                <tr><th>{t("label.statement")}</th><th>{t("label.unmetIndex")}</th></tr>
              </thead>
              <tbody>
                {topBar.map((d, i) => (
                  <tr key={i}><td>{d.full}</td><td>{d.score}</td></tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {allRecommendations.length > 0 && (
        <Card data-tour="an-recommendations">
          <CardHeader><CardTitle>{t("analysis.recommendations")}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allRecommendations.map((r, i) => (
                <div key={i} className="rounded-md border p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {r.priority && (
                        <Badge variant={r.priority === "high" ? "destructive" : r.priority === "medium" ? "default" : "secondary"} className="shrink-0">
                          {translatePriority(r.priority)}
                        </Badge>
                      )}
                      <p className="text-sm font-semibold">{r.title || r.action || r.outcome}</p>
                    </div>
                    {(r.unmet_index != null || r.score != null) && (
                      <span className="text-xs text-muted-foreground shrink-0">{t("label.unmetIndex")}: {r.unmet_index ?? r.score}</span>
                    )}
                  </div>
                  {(r.explanation || r.recommendation || r.rationale) && (
                    <p className="text-sm">{r.explanation || r.recommendation || r.rationale}</p>
                  )}
                  {r.supporting_data && (
                    <p className="text-xs text-muted-foreground italic">{r.supporting_data}</p>
                  )}
                  {r.outcome && r.title && r.outcome !== r.title && (
                    <p className="text-xs text-muted-foreground">→ {r.outcome}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {analysis?.market_potential && (
        <Card>
          <CardHeader><CardTitle>{t("analysis.marketPotential")}</CardTitle></CardHeader>
          <CardContent><p className="text-sm leading-relaxed whitespace-pre-line">{analysis.market_potential}</p></CardContent>
        </Card>
      )}


      {/* ===== POSITIONING STRATEGY ===== */}
      <Card data-tour="an-positioning">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crosshair className="h-5 w-5 text-primary" />
                {t("positioning.title")}
              </CardTitle>
              <CardDescription>{t("positioning.desc")}</CardDescription>
            </div>
            {positioning && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGeneratePositioning}
                disabled={generatingPositioning}
                className="gap-2"
              >
                {generatingPositioning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {generatingPositioning ? t("positioning.generating") : t("positioning.regenerate")}
              </Button>
            )}
          </div>
        </CardHeader>
        {positioning ? (
          <CardContent className="space-y-6">
            {/* Positioning Statement */}
            {posStatement?.primary && (
              <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-5 space-y-3">
                <h4 className="text-sm font-semibold text-primary">{t("positioning.statement")}</h4>
                <p className="text-sm leading-relaxed italic">{posStatement.primary}</p>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {posStatement.targetAudience && <span>🎯 {posStatement.targetAudience}</span>}
                  {posStatement.category && <span>📦 {posStatement.category}</span>}
                  {posStatement.differentiator && <span>⚡ {posStatement.differentiator}</span>}
                </div>
                <Button variant="ghost" size="sm" onClick={() => copyText(posStatement.primary, "pos")} className="gap-1">
                  {copiedField === "pos" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {t("sales.copy")}
                </Button>
              </div>
            )}

            {/* Value Hierarchy */}
            {valueHierarchy && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">{t("positioning.valueHierarchy")}</h4>
                {valueHierarchy.coreValue?.statement && (
                  <div className="rounded-md border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10 p-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400 uppercase">{t("positioning.coreValue")}</div>
                    <p className="text-sm mt-1">{valueHierarchy.coreValue.statement}</p>
                    {(valueHierarchy.coreValue.unmetIndex || valueHierarchy.coreValue.gap) && (
                      <p className="text-xs text-muted-foreground mt-1">{t("label.unmetIndex")}: {valueHierarchy.coreValue.unmetIndex} | {t("label.gap")}: {valueHierarchy.coreValue.gap}</p>
                    )}
                  </div>
                )}
                {valueHierarchy.supportingValues?.length > 0 && (
                  <div className="rounded-md border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/10 p-3">
                    <div className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase mb-1">{t("positioning.supportingValues")}</div>
                    <ul className="space-y-1">
                      {valueHierarchy.supportingValues.map((v: any, i: number) => (
                        <li key={i} className="text-sm">• {v.statement} {v.unmetIndex ? `(${t("label.unmetIndex")}: ${v.unmetIndex})` : ""}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {valueHierarchy.emotionalValues?.length > 0 && (
                  <div className="rounded-md border-l-4 border-green-500 bg-green-50 dark:bg-green-900/10 p-3">
                    <div className="text-xs font-bold text-green-600 dark:text-green-400 uppercase mb-1">{t("positioning.emotionalValues")}</div>
                    <ul className="space-y-1">
                      {valueHierarchy.emotionalValues.map((v: any, i: number) => (
                        <li key={i} className="text-sm">• {v.statement}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Competitive Positioning */}
            {competitive?.marketGaps?.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">{t("positioning.competitive")}</h4>
                <p className="text-xs text-muted-foreground">{t("positioning.competitiveDesc")}</p>
                <div className="space-y-2">
                  {competitive.marketGaps.map((g: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-sm flex-1 min-w-0 truncate">{g.area}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-destructive/60 rounded-full" style={{ width: `${(g.currentSatisfaction / 10) * 100}%` }} />
                        </div>
                        <span className="text-xs font-medium w-10 text-right">{g.currentSatisfaction}/10</span>
                      </div>
                    </div>
                  ))}
                </div>
                {competitive.summary && (
                  <p className="text-sm italic text-muted-foreground border-l-2 border-muted pl-3">{competitive.summary}</p>
                )}
              </div>
            )}

            {/* Alternative Angles */}
            {altAngles?.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">{t("positioning.alternativeAngles")}</h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  {altAngles.map((a: any, i: number) => (
                    <div key={i} className="rounded-md border p-3 space-y-1">
                      <p className="text-sm font-medium">{a.angle}</p>
                      <p className="text-xs text-muted-foreground"><strong>{t("positioning.focus")}:</strong> {a.focus}</p>
                      <p className="text-xs text-muted-foreground"><strong>{t("positioning.bestFor")}:</strong> {a.bestFor}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        ) : (
          <CardContent>
            <p className="text-sm text-muted-foreground italic">{t("positioning.generating")}</p>
          </CardContent>
        )}
      </Card>

      {/* ===== SALES MESSAGES ===== */}
      <Card data-tour="an-sales">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                {t("sales.title")}
              </CardTitle>
              <CardDescription>{t("sales.desc")}</CardDescription>
            </div>
            {salesMessages && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateSales}
                disabled={generatingSales}
                className="gap-2"
              >
                {generatingSales ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {generatingSales ? t("sales.generating") : t("sales.regenerate")}
              </Button>
            )}
          </div>
        </CardHeader>
        {salesMessages ? (
          <CardContent>
            <Tabs defaultValue="pitch" className="space-y-4">
              <TabsList>
                <TabsTrigger value="pitch">🎤 {t("sales.elevatorPitch")}</TabsTrigger>
                <TabsTrigger value="email">📧 {t("sales.coldEmail")}</TabsTrigger>
              </TabsList>

              <TabsContent value="pitch">
                {pitch?.text && (
                  <div className="space-y-3">
                    <div className="rounded-md border p-4">
                      <p className="text-sm leading-relaxed whitespace-pre-line">{pitch.text}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <Button variant="ghost" size="sm" onClick={() => copyText(pitch.text, "pitch")} className="gap-1">
                        {copiedField === "pitch" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {t("sales.copy")}
                      </Button>
                    </div>
                    {pitch.basedOn && (
                      <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                        <p className="font-medium mb-1">ℹ️ {t("sales.basedOn")}:</p>
                        {pitch.basedOn.primaryOutcome && <p>• {pitch.basedOn.primaryOutcome} ({t("label.unmetIndex")}: {pitch.basedOn.unmetIndex})</p>}
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="email">
                {email && (
                  <div className="space-y-3">
                    {email.subjectLine && (
                      <div className="rounded-md bg-muted/50 p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">{t("sales.subjectLine")}</p>
                        <p className="text-sm font-semibold">{email.subjectLine}</p>
                      </div>
                    )}
                    {email.body && (
                      <div className="rounded-md border p-4">
                        <p className="text-sm leading-relaxed whitespace-pre-line">{email.body}</p>
                      </div>
                    )}
                    {email.cta && (
                      <div className="rounded-md bg-primary/5 border-primary/20 border p-3">
                        <p className="text-xs font-medium text-primary mb-1">{t("sales.cta")}</p>
                        <p className="text-sm font-medium">{email.cta}</p>
                      </div>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => copyText(`${email.subjectLine}\n\n${email.body}\n\n${email.cta || ""}`, "email")} className="gap-1">
                      {copiedField === "email" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {t("sales.copy")}
                    </Button>
                    {email.basedOn && (
                      <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                        <p className="font-medium mb-1">ℹ️ {t("sales.basedOn")}:</p>
                        {email.basedOn.painPoint && <p>• {email.basedOn.painPoint}</p>}
                        {email.basedOn.corePromise && <p>• {email.basedOn.corePromise}</p>}
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        ) : (
          <CardContent>
            <p className="text-sm text-muted-foreground italic">{t("sales.generating")}</p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
