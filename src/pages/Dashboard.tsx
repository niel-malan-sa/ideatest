import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Clock, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface Idea {
  id: string;
  name: string;
  description: string | null;
  status: string;
  industry: string | null;
  created_at: string;
  updated_at: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  framework_ready: "bg-primary/10 text-primary",
  data_collection: "bg-accent/10 text-accent-foreground",
  analyzed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchIdeas(); }, []);

  const fetchIdeas = async () => {
    const { data, error } = await supabase
      .from("ideas")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) toast.error(t("dashboard.failedLoad"));
    else setIdeas(data || []);
    setLoading(false);
  };

  const statusLabel = (status: string) => {
    const key = `status.${status}` as any;
    return t(key) || status;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.title")}</h1>
            <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
          </div>
          <Button onClick={() => navigate("/ideas/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("dashboard.newIdea")}
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader><div className="h-5 w-32 rounded bg-muted" /><div className="h-4 w-48 rounded bg-muted mt-2" /></CardHeader>
              </Card>
            ))}
          </div>
        ) : ideas.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" aria-hidden="true" />
              <h3 className="text-lg font-medium">{t("dashboard.noIdeas")}</h3>
              <p className="text-muted-foreground mt-1 mb-4">{t("dashboard.noIdeasDesc")}</p>
              <Button onClick={() => navigate("/ideas/new")} className="gap-2">
                <Plus className="h-4 w-4" />
                {t("dashboard.createFirst")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ideas.map(idea => (
              <Card key={idea.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate(`/ideas/${idea.id}`)} role="article" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") navigate(`/ideas/${idea.id}`); }} aria-label={`${idea.name} — ${statusLabel(idea.status)}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{idea.name}</CardTitle>
                    <Badge variant="secondary" className={statusColors[idea.status] || ""}>
                      {statusLabel(idea.status)}
                    </Badge>
                  </div>
                  {idea.description && <CardDescription className="line-clamp-2">{idea.description}</CardDescription>}
                </CardHeader>
                <CardContent className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {new Date(idea.updated_at).toLocaleDateString()}
                  </span>
                  {idea.industry && <span>{idea.industry}</span>}
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
