import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, Trash2, FileText, FileSpreadsheet, Plus, X, Pencil, Check } from "lucide-react";
import ExcelJS from "exceljs";
import mammoth from "mammoth";

interface InterviewNote {
  id: string;
  idea_id: string;
  respondent: string;
  source_file: string | null;
  content: string;
  created_at: string;
}

interface InterviewDataBankProps {
  ideaId: string;
}

export default function InterviewDataBank({ ideaId }: InterviewDataBankProps) {
  const { locale, t } = useLanguage();
  const [notes, setNotes] = useState<InterviewNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRespondent, setNewRespondent] = useState("");
  const [newContent, setNewContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ respondent: "", content: "" });
  const [statusMessage, setStatusMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchNotes = useCallback(async () => {
    const { data } = await supabase
      .from("interview_notes")
      .select("*")
      .eq("idea_id", ideaId)
      .order("created_at");
    setNotes((data as InterviewNote[]) || []);
    setLoading(false);
  }, [ideaId]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const addNote = async () => {
    if (!newContent.trim()) return;
    const { error } = await supabase.from("interview_notes").insert({
      idea_id: ideaId,
      respondent: newRespondent.trim() || `${t("dataBank.respondent")} ${notes.length + 1}`,
      content: newContent.trim(),
    });
    if (error) { toast.error(t("dataBank.saveFailed")); return; }
    setNewRespondent("");
    setNewContent("");
    setStatusMessage(locale === "fi" ? "Muistiinpano lisätty" : "Note added");
    fetchNotes();
  };

  const saveEdit = async (id: string) => {
    const { error } = await supabase.from("interview_notes")
      .update({ respondent: editData.respondent, content: editData.content })
      .eq("id", id);
    if (error) { toast.error(t("dataBank.saveFailed")); return; }
    setEditingId(null);
    setStatusMessage(locale === "fi" ? "Muistiinpano päivitetty" : "Note updated");
    fetchNotes();
  };

  const deleteNote = async (id: string) => {
    await supabase.from("interview_notes").delete().eq("id", id);
    setStatusMessage(locale === "fi" ? "Muistiinpano poistettu" : "Note deleted");
    fetchNotes();
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      try {
        const ext = file.name.split(".").pop()?.toLowerCase();

        if (ext === "xlsx" || ext === "xls") {
          const data = await file.arrayBuffer();
          const wb = new ExcelJS.Workbook();
          await wb.xlsx.load(data);
          const ws = wb.worksheets[0];
          const rows: string[] = [];
          ws.eachRow((row) => {
            const values = (row.values as any[]).slice(1).map(v => v ?? '');
            rows.push(values.join(','));
          });
          const text = rows.join('\n');
          await supabase.from("interview_notes").insert({
            idea_id: ideaId,
            respondent: file.name.replace(/\.[^.]+$/, ""),
            source_file: file.name,
            content: text,
          });
        } else if (ext === "docx") {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          const text = result.value;
          const sections = text.split(/\n(?=#{1,3}\s|Haastateltava|Respondent|Interview\s*\d)/i);

          if (sections.length > 1) {
            for (let i = 0; i < sections.length; i++) {
              const section = sections[i].trim();
              if (!section) continue;
              const firstLine = section.split("\n")[0].trim();
              await supabase.from("interview_notes").insert({
                idea_id: ideaId,
                respondent: firstLine.substring(0, 80) || `${file.name} - ${i + 1}`,
                source_file: file.name,
                content: section,
              });
            }
          } else {
            await supabase.from("interview_notes").insert({
              idea_id: ideaId,
              respondent: file.name.replace(/\.[^.]+$/, ""),
              source_file: file.name,
              content: text,
            });
          }
        } else if (ext === "txt" || ext === "csv") {
          const text = await file.text();
          await supabase.from("interview_notes").insert({
            idea_id: ideaId,
            respondent: file.name.replace(/\.[^.]+$/, ""),
            source_file: file.name,
            content: text,
          });
        } else {
          toast.error(`${t("dataBank.unsupportedFormat")}: ${file.name}`);
          continue;
        }

        toast.success(`${t("dataBank.imported")}: ${file.name}`);
      } catch (err) {
        console.error("File import error:", err);
        toast.error(`${t("dataBank.importFailed")}: ${file.name}`);
      }
    }

    fetchNotes();
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <Card data-tour="dc-databank">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle id="databank-title">{t("dataBank.title")}</CardTitle>
            <CardDescription>{t("dataBank.desc")}</CardDescription>
          </div>
          <Badge variant="secondary" aria-label={`${notes.length} ${t("dataBank.entries")}`}>{notes.length} {t("dataBank.entries")}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Live region for status announcements */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">{statusMessage}</div>

        {/* Import buttons */}
        <div className="flex gap-2 flex-wrap">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.docx,.txt,.csv"
            multiple
            onChange={handleFileImport}
            className="hidden"
            aria-label={locale === "fi" ? "Tuo haastattelutiedostoja" : "Import interview files"}
          />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-2" aria-label={locale === "fi" ? "Tuo tiedostoja (.xlsx, .docx, .txt, .csv)" : "Import files (.xlsx, .docx, .txt, .csv)"}>
            <Upload className="h-4 w-4" aria-hidden="true" /> {t("dataBank.importFiles")}
          </Button>
          <span className="text-xs text-muted-foreground self-center" aria-hidden="true">{t("label.fileFormats")}</span>
        </div>

        {/* Existing notes */}
        {notes.length > 0 && (
          <div className="space-y-3 max-h-[400px] overflow-y-auto" role="list" aria-label={locale === "fi" ? "Haastattelumuistiinpanot" : "Interview notes"}>
            {notes.map(note => (
              <div key={note.id} className="rounded-md border p-3 space-y-2 group" role="listitem">
                {editingId === note.id ? (
                  <div className="space-y-2" role="form" aria-label={locale === "fi" ? "Muokkaa muistiinpanoa" : "Edit note"}>
                    <Label htmlFor={`edit-respondent-${note.id}`} className="sr-only">{t("dataBank.respondent")}</Label>
                    <Input id={`edit-respondent-${note.id}`} value={editData.respondent} onChange={e => setEditData(d => ({ ...d, respondent: e.target.value }))} placeholder={t("dataBank.respondent")} />
                    <Label htmlFor={`edit-content-${note.id}`} className="sr-only">{locale === "fi" ? "Sisältö" : "Content"}</Label>
                    <Textarea id={`edit-content-${note.id}`} value={editData.content} onChange={e => setEditData(d => ({ ...d, content: e.target.value }))} rows={4} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEdit(note.id)} aria-label={locale === "fi" ? "Tallenna muutokset" : "Save changes"}>
                        <Check className="h-4 w-4 mr-1" aria-hidden="true" /> OK
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} aria-label={locale === "fi" ? "Peruuta muokkaus" : "Cancel editing"}>
                        <X className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{note.respondent}</span>
                        {note.source_file && (
                          <Badge variant="outline" className="text-xs gap-1">
                            {note.source_file.endsWith(".docx") ? <FileText className="h-3 w-3" aria-hidden="true" /> : <FileSpreadsheet className="h-3 w-3" aria-hidden="true" />}
                            {note.source_file}
                          </Badge>
                        )}
                      </div>
                      <div className="shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => { setEditingId(note.id); setEditData({ respondent: note.respondent, content: note.content }); }}
                          aria-label={`${locale === "fi" ? "Muokkaa" : "Edit"}: ${note.respondent}`}
                        >
                          <Pencil className="h-3 w-3" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteNote(note.id)}
                          aria-label={`${locale === "fi" ? "Poista" : "Delete"}: ${note.respondent}`}
                        >
                          <Trash2 className="h-3 w-3" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-pre-line line-clamp-4">{note.content}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Manual add */}
        <div className="rounded-md border border-dashed p-3 space-y-2" role="form" aria-label={locale === "fi" ? "Lisää uusi muistiinpano" : "Add new note"}>
          <Label htmlFor="new-respondent" className="sr-only">{t("dataBank.respondent")}</Label>
          <Input id="new-respondent" value={newRespondent} onChange={e => setNewRespondent(e.target.value)} placeholder={t("dataBank.respondentPlaceholder")} />
          <Label htmlFor="new-content" className="sr-only">{locale === "fi" ? "Muistiinpanon sisältö" : "Note content"}</Label>
          <Textarea id="new-content" value={newContent} onChange={e => setNewContent(e.target.value)} placeholder={t("dataBank.contentPlaceholder")} rows={3} />
          <Button size="sm" onClick={addNote} disabled={!newContent.trim()} className="gap-1">
            <Plus className="h-4 w-4" aria-hidden="true" /> {t("dataBank.addNote")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
