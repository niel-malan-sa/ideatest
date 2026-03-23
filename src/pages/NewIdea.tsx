import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function NewIdea() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", industry: "", target_audience: "", language: "en",
  });

  // Pre-fill from profile
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("industry, target_audience").eq("user_id", user.id).maybeSingle();
      if (data) {
        setForm(f => ({
          ...f,
          industry: data.industry || f.industry,
          target_audience: data.target_audience || f.target_audience,
        }));
      }
    })();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("ideas").insert({ ...form, user_id: user.id }).select().single();
    if (error) toast.error(t("newIdea.failed"));
    else { toast.success(t("newIdea.created")); navigate(`/ideas/${data.id}`); }
    setLoading(false);
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> {t("newIdea.back")}
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{t("newIdea.title")}</CardTitle>
            <CardDescription>{t("newIdea.desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("newIdea.name")} *</Label>
                <Input id="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t("newIdea.namePlaceholder")} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t("newIdea.description")} *</Label>
                <Textarea id="description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder={t("newIdea.descPlaceholder")} rows={4} required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="industry">{t("newIdea.industry")}</Label>
                  <Input id="industry" value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} placeholder={t("newIdea.industryPlaceholder")} />
                  <p className="text-[10px] text-muted-foreground">{t("newIdea.prefilled")}</p>
                </div>
                <div className="space-y-2">
                  <Label>{t("newIdea.aiLanguage")}</Label>
                  <Select value={form.language} onValueChange={v => setForm(f => ({ ...f, language: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fi">Suomi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_audience">{t("newIdea.targetAudience")}</Label>
                <Textarea id="target_audience" value={form.target_audience} onChange={e => setForm(f => ({ ...f, target_audience: e.target.value }))} placeholder={t("newIdea.audiencePlaceholder")} rows={3} />
                <p className="text-[10px] text-muted-foreground">{t("newIdea.prefilled")}</p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>{t("newIdea.cancel")}</Button>
                <Button type="submit" disabled={loading}>{loading ? t("newIdea.creating") : t("newIdea.create")}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
