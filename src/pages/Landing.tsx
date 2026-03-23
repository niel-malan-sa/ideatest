import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Github, Search, BarChart3, Lightbulb, MessageSquare } from "lucide-react";


export default function Landing() {
  const { user, loading } = useAuth();
  const { locale, setLocale, t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm" role="banner">
        <nav className="container flex h-14 items-center justify-between" aria-label={t("app.title")}>
          <div className="text-primary font-bold tracking-tight">
            <span className="hidden sm:inline">{t("app.title")}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocale(locale === "fi" ? "en" : "fi")}
              className="text-xs font-medium px-2 py-1 rounded border border-border hover:bg-muted transition-colors"
              aria-label={locale === "fi" ? "Switch to English" : "Vaihda suomeksi"}
            >
              {locale === "fi" ? "EN" : "FI"}
            </button>
            {!loading && (
              user ? (
                <Button asChild size="sm">
                  <Link to="/dashboard">{t("landing.goToDashboard")}</Link>
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/auth">{t("auth.signIn")}</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link to="/auth">{t("auth.signUp")}</Link>
                  </Button>
                </div>
              )
            )}
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden" aria-labelledby="hero-title">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" aria-hidden="true" />
        <div className="container relative py-20 md:py-32 text-center space-y-8">
          <div className="space-y-4 max-w-3xl mx-auto">
            <h1 id="hero-title" className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              {t("landing.heroTitle")}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t("landing.heroSubtitle")}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Button size="lg" asChild className="gap-2 text-base px-8">
                <Link to="/dashboard">
                  {t("landing.goToDashboard")} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            ) : (
              <>
                <Button size="lg" asChild className="gap-2 text-base px-8">
                  <Link to="/auth">
                    {t("landing.getStarted")} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="gap-2 text-base px-8">
                  <a href="https://github.com/your-org/your-repo" target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4" aria-hidden="true" /> {t("landing.viewOnGithub")}
                  </a>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="container py-16 md:py-24" aria-labelledby="video-title">
        <div className="max-w-4xl mx-auto space-y-6 text-center">
          <h2 id="video-title" className="text-2xl md:text-3xl font-bold text-foreground">{t("landing.videoTitle")}</h2>
          <p className="text-muted-foreground">{t("landing.videoSubtitle")}</p>
          <div className="relative aspect-video rounded-xl overflow-hidden border border-border bg-black">
            <video
              src="/landing-video.mp4"
              controls
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              aria-label={t("landing.videoPlaceholder")}
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/30 border-y" aria-labelledby="how-title">
        <div className="container py-16 md:py-24 space-y-12">
          <div className="text-center space-y-3">
            <h2 id="how-title" className="text-2xl md:text-3xl font-bold text-foreground">{t("landing.howTitle")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{t("landing.howSubtitle")}</p>
          </div>
          <ol className="grid gap-8 md:grid-cols-4 list-none p-0 m-0">
            {[
              { icon: Lightbulb, titleKey: "landing.step1Title" as const, descKey: "landing.step1Desc" as const },
              { icon: Search, titleKey: "landing.step2Title" as const, descKey: "landing.step2Desc" as const },
              { icon: BarChart3, titleKey: "landing.step3Title" as const, descKey: "landing.step3Desc" as const },
              { icon: MessageSquare, titleKey: "landing.step4Title" as const, descKey: "landing.step4Desc" as const },
            ].map((step, i) => (
              <li key={i}>
                <Card className="relative border-none shadow-sm bg-card h-full">
                  <div className="absolute -top-4 left-6 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold" aria-hidden="true">
                    {i + 1}
                  </div>
                  <CardContent className="pt-8 pb-6 px-6 space-y-2">
                    <step.icon className="h-6 w-6 text-accent mb-1" aria-hidden="true" />
                    <h3 className="font-semibold text-foreground">{t(step.titleKey)}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{t(step.descKey)}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Open Source Section */}
      <section className="container py-16 md:py-24" aria-labelledby="oss-title">
        <div className="max-w-3xl mx-auto">
          <Card className="overflow-hidden border-2">
            <div className="bg-gradient-to-r from-foreground to-foreground/80 p-8 md:p-12 text-card space-y-6">
              <div className="flex items-center gap-3">
                <Github className="h-8 w-8" aria-hidden="true" />
                <h2 id="oss-title" className="text-2xl md:text-3xl font-bold">{t("landing.ossTitle")}</h2>
              </div>
              <p className="text-card/80 leading-relaxed max-w-xl">
                {t("landing.ossDesc")}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="secondary" size="lg" asChild className="gap-2">
                  <a href="https://github.com/your-org/your-repo" target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4" aria-hidden="true" /> {t("landing.viewOnGithub")}
                  </a>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/20" role="contentinfo">
        <div className="container py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>{t("app.title")}</span>
          <div className="flex items-center gap-4">
            <a href="https://github.com/your-org/your-repo" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              GitHub
            </a>
            <span aria-hidden="true">·</span>
            <span>{t("landing.footerOss")}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
