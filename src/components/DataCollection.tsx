import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useTranslateType } from "@/i18n/helpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Save, Plus, Trash2, Users, Upload, Download, FileSpreadsheet } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import ExcelJS from "exceljs";
import InterviewDataBank from "@/components/InterviewDataBank";
import StepActionBar from "@/components/StepActionBar";

interface Outcome {
  id: string;
  statement: string;
  type: string;
  importance: number | null;
  satisfaction: number | null;
}

interface OutcomeScore {
  id: string;
  outcome_id: string;
  respondent: string;
  importance: number;
  satisfaction: number;
}

interface DataCollectionProps {
  ideaId: string;
  outcomes: Outcome[];
  interviewGuide: any;
  onRefresh: () => void;
  onComplete: () => void;
}

export default function DataCollection({ ideaId, outcomes, interviewGuide, onRefresh, onComplete }: DataCollectionProps) {
  const { t, locale } = useLanguage();
  const translateType = useTranslateType();

  // Per-respondent scores
  const [scores, setScores] = useState<OutcomeScore[]>([]);
  const [loading, setLoading] = useState(true);

  // New score entry
  const [newRespondent, setNewRespondent] = useState("");
  const [newScores, setNewScores] = useState<Record<string, { importance: string; satisfaction: string }>>({});

  // Market data
  const [marketSize, setMarketSize] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [saving, setSaving] = useState(false);

  // Import state
  const [importPreview, setImportPreview] = useState<{ respondent: string; scores: { outcome_id: string; importance: number; satisfaction: number }[] }[] | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine which outcomes are scored in interviews
  const scoredOutcomeStatements = new Set<string>();
  if (interviewGuide?.themes) {
    for (const theme of interviewGuide.themes) {
      for (const s of (theme.scored_outcomes || [])) {
        scoredOutcomeStatements.add(s);
      }
    }
  }

  const scoredOutcomes = scoredOutcomeStatements.size > 0
    ? outcomes.filter(o => scoredOutcomeStatements.has(o.statement))
    : outcomes.slice(0, 8); // fallback: first 8

  const fetchScores = useCallback(async () => {
    const { data } = await supabase
      .from("outcome_scores")
      .select("*")
      .eq("idea_id", ideaId)
      .order("created_at");
    setScores((data || []) as OutcomeScore[]);
    setLoading(false);
  }, [ideaId]);

  const fetchMarketData = useCallback(async () => {
    const { data } = await supabase
      .from("research_data")
      .select("*")
      .eq("idea_id", ideaId)
      .maybeSingle();
    if (data) {
      setMarketSize(data.market_size || "");
      setCompetitors(Array.isArray(data.competitors) ? (data.competitors as string[]).join(", ") : "");
    }
  }, [ideaId]);

  useEffect(() => {
    fetchScores();
    fetchMarketData();
  }, [fetchScores, fetchMarketData]);

  // Group scores by respondent
  const respondents = [...new Set(scores.map(s => s.respondent))];

  const addRespondentScores = async () => {
    if (!newRespondent.trim()) return;

    const rows = scoredOutcomes
      .filter(o => newScores[o.id]?.importance && newScores[o.id]?.satisfaction)
      .map(o => ({
        idea_id: ideaId,
        outcome_id: o.id,
        respondent: newRespondent.trim(),
        importance: parseFloat(newScores[o.id].importance),
        satisfaction: parseFloat(newScores[o.id].satisfaction),
      }))
      .filter(r => !isNaN(r.importance) && !isNaN(r.satisfaction) && r.importance >= 1 && r.importance <= 10 && r.satisfaction >= 1 && r.satisfaction <= 10);

    if (rows.length === 0) {
      toast.error(t("scoring.needScores"));
      return;
    }

    const { error } = await supabase.from("outcome_scores").insert(rows);
    if (error) {
      toast.error(t("data.saveFailed"));
      return;
    }
    toast.success(t("scoring.added"));
    setNewRespondent("");
    setNewScores({});
    fetchScores();
    // Update outcomes table with averages
    await updateOutcomeAverages();
  };

  const updateOutcomeAverages = async () => {
    // Fetch all scores for this idea and compute averages per outcome
    const { data: allScores } = await supabase
      .from("outcome_scores")
      .select("outcome_id, importance, satisfaction")
      .eq("idea_id", ideaId);

    if (!allScores) return;

    const avgMap: Record<string, { impSum: number; satSum: number; count: number }> = {};
    for (const s of allScores) {
      if (!avgMap[s.outcome_id]) avgMap[s.outcome_id] = { impSum: 0, satSum: 0, count: 0 };
      avgMap[s.outcome_id].impSum += Number(s.importance);
      avgMap[s.outcome_id].satSum += Number(s.satisfaction);
      avgMap[s.outcome_id].count++;
    }

    const updates = Object.entries(avgMap).map(([outcomeId, { impSum, satSum, count }]) =>
      supabase.from("outcomes").update({
        importance: Math.round((impSum / count) * 10) / 10,
        satisfaction: Math.round((satSum / count) * 10) / 10,
      }).eq("id", outcomeId)
    );
    await Promise.all(updates);
    onRefresh();
  };

  const deleteRespondent = async (respondent: string) => {
    const { error } = await supabase
      .from("outcome_scores")
      .delete()
      .eq("idea_id", ideaId)
      .eq("respondent", respondent);
    if (error) toast.error(t("data.saveFailed"));
    else {
      fetchScores();
      await updateOutcomeAverages();
    }
  };

  const handleSaveMarket = async () => {
    setSaving(true);
    try {
      const competitorsList = competitors.split(",").map(c => c.trim()).filter(Boolean);
      const { data: existing } = await supabase.from("research_data").select("id").eq("idea_id", ideaId).maybeSingle();
      if (existing) {
        await supabase.from("research_data").update({ market_size: marketSize || null, competitors: competitorsList }).eq("id", existing.id);
      } else {
        await supabase.from("research_data").insert({ idea_id: ideaId, market_size: marketSize || null, competitors: competitorsList });
      }
      toast.success(t("data.saved"));
    } catch {
      toast.error(t("data.saveFailed"));
    }
    setSaving(false);
  };

  const handleComplete = async () => {
    await handleSaveMarket();
    await updateOutcomeAverages();
    onComplete();
  };

  const updateNewScore = (outcomeId: string, field: "importance" | "satisfaction", value: string) => {
    setNewScores(prev => ({
      ...prev,
      [outcomeId]: { ...prev[outcomeId], [field]: value },
    }));
  };

  // --- CSV/Excel Import ---
  const downloadTemplate = () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Scores");
    
    // Header row: Respondent, then pairs of Imp/Sat for each scored outcome
    const headers = [t("dataBank.respondent")];
    for (const o of scoredOutcomes) {
      headers.push(`${o.statement} — ${t("data.importance")}`);
      headers.push(`${o.statement} — ${t("data.satisfaction")}`);
    }
    ws.addRow(headers);
    
    // Style header
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true };
    headerRow.eachCell(cell => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
    });
    
    // Example row
    const exampleRow = [t("label.exampleRespondent")];
    for (const _ of scoredOutcomes) {
      exampleRow.push("7", "4");
    }
    ws.addRow(exampleRow);
    
    // Auto-width
    ws.columns.forEach(col => {
      col.width = Math.min(40, Math.max(15, (col.header?.toString().length || 10) + 2));
    });
    
    wb.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "score_template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      
      if (ext === "csv") {
        const text = await file.text();
        const parsed = parseCSV(text);
        setImportPreview(parsed);
      } else if (ext === "xlsx" || ext === "xls") {
        const buffer = await file.arrayBuffer();
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(buffer);
        const ws = wb.worksheets[0];
        if (!ws) throw new Error("No worksheet found");
        
        const rows: string[][] = [];
        ws.eachRow((row, rowNumber) => {
          const vals = row.values as (string | number | undefined)[];
          // ExcelJS row.values is 1-indexed, first element is undefined
          rows.push(vals.slice(1).map(v => String(v ?? "")));
        });
        
        if (rows.length < 2) {
          toast.error(t("scoring.importInvalidFormat"));
          return;
        }
        
        const parsed = parseRows(rows.slice(1)); // skip header
        setImportPreview(parsed);
      } else {
        toast.error(t("scoring.importInvalidFormat"));
      }
    } catch (err) {
      console.error("Import error:", err);
      toast.error(t("scoring.importFailed"));
    }
    
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const parseCSV = (text: string) => {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];
    const rows = lines.slice(1).map(line => {
      // Handle quoted CSV
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') { inQuotes = !inQuotes; continue; }
        if ((char === "," || char === ";") && !inQuotes) { result.push(current.trim()); current = ""; continue; }
        current += char;
      }
      result.push(current.trim());
      return result;
    });
    return parseRows(rows);
  };

  const parseRows = (rows: string[][]): typeof importPreview => {
    // Expected format: respondent, imp1, sat1, imp2, sat2, ...
    const result: { respondent: string; scores: { outcome_id: string; importance: number; satisfaction: number }[] }[] = [];
    
    for (const row of rows) {
      if (!row[0]?.trim()) continue;
      const respondent = row[0].trim();
      const rowScores: { outcome_id: string; importance: number; satisfaction: number }[] = [];
      
      for (let i = 0; i < scoredOutcomes.length; i++) {
        const impVal = parseFloat(row[1 + i * 2] || "");
        const satVal = parseFloat(row[2 + i * 2] || "");
        if (!isNaN(impVal) && !isNaN(satVal) && impVal >= 1 && impVal <= 10 && satVal >= 1 && satVal <= 10) {
          rowScores.push({ outcome_id: scoredOutcomes[i].id, importance: impVal, satisfaction: satVal });
        }
      }
      
      if (rowScores.length > 0) {
        result.push({ respondent, scores: rowScores });
      }
    }
    return result;
  };

  const confirmImport = async () => {
    if (!importPreview || importPreview.length === 0) return;
    setImporting(true);
    
    try {
      const allRows = importPreview.flatMap(r =>
        r.scores.map(s => ({
          idea_id: ideaId,
          outcome_id: s.outcome_id,
          respondent: r.respondent,
          importance: s.importance,
          satisfaction: s.satisfaction,
        }))
      );
      
      const { error } = await supabase.from("outcome_scores").insert(allRows);
      if (error) throw error;
      
      toast.success(t("scoring.importSuccess"));
      setImportPreview(null);
      fetchScores();
      await updateOutcomeAverages();
    } catch {
      toast.error(t("scoring.importFailed"));
    }
    setImporting(false);
  };

  if (loading) return <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      {/* Interview Data Bank */}
      <InterviewDataBank ideaId={ideaId} />

      {/* Existing respondent scores */}
      {respondents.length > 0 && (
        <Card data-tour="dc-respondents">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t("scoring.respondents")} ({respondents.length})
            </CardTitle>
            <CardDescription>{t("scoring.respondentsDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {respondents.map(respondent => {
                const respondentScores = scores.filter(s => s.respondent === respondent);
                return (
                  <div key={respondent} className="rounded-md border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{respondent}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{respondentScores.length} {t("scoring.scores")}</Badge>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => deleteRespondent(respondent)} aria-label={`${locale === "fi" ? "Poista vastaaja" : "Delete respondent"} ${respondent}`}>
                          <Trash2 className="h-3 w-3" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">{t("outcomes.title")}</TableHead>
                            <TableHead className="text-xs w-[70px] text-right">{t("label.importance")}</TableHead>
                            <TableHead className="text-xs w-[70px] text-right">{t("label.satisfaction")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {respondentScores.map(s => {
                            const outcome = outcomes.find(o => o.id === s.outcome_id);
                            return (
                              <TableRow key={s.id}>
                                <TableCell className="text-xs">{outcome?.statement || "—"}</TableCell>
                                <TableCell className="text-xs text-right font-medium">{s.importance}</TableCell>
                                <TableCell className="text-xs text-right font-medium">{s.satisfaction}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add new respondent scores */}
      <Card data-tour="scoring-section">
        <CardHeader>
          <CardTitle>{t("scoring.addTitle")}</CardTitle>
          <CardDescription>{t("scoring.addDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted/60 p-3 text-sm text-muted-foreground">
            {t("scoring.howTo")}
          </div>
          <div className="space-y-2">
            <Label>{t("dataBank.respondent")}</Label>
            <Input
              value={newRespondent}
              onChange={e => setNewRespondent(e.target.value)}
              placeholder={t("dataBank.respondentPlaceholder")}
            />
          </div>

          {scoredOutcomes.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">{t("scoring.outcomesToScore")}</Label>
              {scoredOutcomes.map((o, i) => (
                <div key={o.id} className="rounded-md border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground">{i + 1}.</span>
                    <Badge variant="outline" className="text-xs">{translateType(o.type)}</Badge>
                    <span className="text-sm flex-1">{o.statement}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">{t("label.importance")}</Label>
                      <p className="text-[10px] text-muted-foreground">{t("label.importance") === "Kuinka tärkeää?" ? "1 = ei tärkeä, 10 = erittäin tärkeä" : "1 = not important, 10 = critical"}</p>
                      <div className="flex items-center gap-3">
                        <Slider
                          min={1}
                          max={10}
                          step={1}
                          value={[parseInt(newScores[o.id]?.importance) || 5]}
                          onValueChange={([v]) => updateNewScore(o.id, "importance", String(v))}
                          className="flex-1"
                          aria-label={`${t("label.importance")} — ${o.statement}`}
                        />
                        <span className="text-sm font-semibold w-6 text-right">{newScores[o.id]?.importance || "5"}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">{t("label.satisfaction")}</Label>
                      <p className="text-[10px] text-muted-foreground">{t("label.satisfaction") === "Kuinka hyvin ratkaistu?" ? "1 = ei ratkaistu, 10 = täysin ratkaistu" : "1 = unsolved, 10 = fully solved"}</p>
                      <div className="flex items-center gap-3">
                        <Slider
                          min={1}
                          max={10}
                          step={1}
                          value={[parseInt(newScores[o.id]?.satisfaction) || 5]}
                          onValueChange={([v]) => updateNewScore(o.id, "satisfaction", String(v))}
                          className="flex-1"
                          aria-label={`${t("label.satisfaction")} — ${o.statement}`}
                        />
                        <span className="text-sm font-semibold w-6 text-right">{newScores[o.id]?.satisfaction || "5"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button onClick={addRespondentScores} disabled={!newRespondent.trim()} className="gap-2">
            <Plus className="h-4 w-4" /> {t("scoring.addRespondent")}
          </Button>
        </CardContent>
      </Card>

      {/* Import scores from file */}
      <Card data-tour="dc-import">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            {t("scoring.importTitle")}
          </CardTitle>
          <CardDescription>{t("scoring.importDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
              <Download className="h-4 w-4" /> {t("scoring.downloadTemplate")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
              <Upload className="h-4 w-4" /> {t("scoring.importBtn")}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileImport}
              className="hidden"
            />
          </div>

          {/* Import preview */}
          {importPreview && importPreview.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">{t("scoring.importPreview")}</Label>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">{t("dataBank.respondent")}</TableHead>
                      {scoredOutcomes.map((o, i) => (
                        <TableHead key={o.id} className="text-xs text-center" colSpan={2}>
                          <span className="truncate block max-w-[120px]" title={o.statement}>{i + 1}. {o.statement.slice(0, 30)}…</span>
                        </TableHead>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableHead className="text-xs"></TableHead>
                      {scoredOutcomes.map(o => (
                        <>
                          <TableHead key={`${o.id}-imp`} className="text-xs text-center w-[50px]">{t("data.importance").slice(0, 3)}</TableHead>
                          <TableHead key={`${o.id}-sat`} className="text-xs text-center w-[50px]">{t("data.satisfaction").slice(0, 3)}</TableHead>
                        </>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importPreview.map((row, ri) => (
                      <TableRow key={ri}>
                        <TableCell className="text-xs font-medium">{row.respondent}</TableCell>
                        {scoredOutcomes.map(o => {
                          const s = row.scores.find(s => s.outcome_id === o.id);
                          return (
                            <>
                              <TableCell key={`${o.id}-${ri}-imp`} className="text-xs text-center">{s?.importance ?? "—"}</TableCell>
                              <TableCell key={`${o.id}-${ri}-sat`} className="text-xs text-center">{s?.satisfaction ?? "—"}</TableCell>
                            </>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex gap-2">
                <Button onClick={confirmImport} disabled={importing} className="gap-2">
                  <Plus className="h-4 w-4" /> {t("scoring.importConfirm").replace("{count}", String(importPreview.length))}
                </Button>
                <Button variant="ghost" onClick={() => setImportPreview(null)}>
                  {t("substep.back")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Market data */}
      <Card data-tour="dc-market">
        <CardHeader>
          <CardTitle>{t("data.marketTitle")}</CardTitle>
          <CardDescription>{t("data.marketDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("data.marketSize")}</Label>
            <Input value={marketSize} onChange={e => setMarketSize(e.target.value)} placeholder={t("data.marketPlaceholder")} />
          </div>
          <div className="space-y-2">
            <Label>{t("data.competitors")}</Label>
            <Textarea value={competitors} onChange={e => setCompetitors(e.target.value)} placeholder={t("data.competitorsPlaceholder")} rows={2} />
          </div>
          <Button variant="outline" size="sm" onClick={handleSaveMarket} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" /> {saving ? t("data.saving") : t("data.saveProgress")}
          </Button>
        </CardContent>
      </Card>

      <div data-tour="dc-complete">
        <StepActionBar
          onNext={handleComplete}
          nextLabel={t("data.completeBtn")}
        />
      </div>
    </div>
  );
}
