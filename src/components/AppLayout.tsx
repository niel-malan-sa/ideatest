import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { LogOut, Home } from "lucide-react";
import { Link } from "react-router-dom";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const { locale, setLocale, t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      {/* Skip-to-content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm focus:font-medium focus:shadow-lg"
      >
        {locale === "fi" ? "Siirry sisältöön" : "Skip to content"}
      </a>
      <header className="sticky top-0 z-50 border-b bg-card backdrop-blur-sm supports-[backdrop-filter]:bg-card/80" role="banner">
        <nav className="container flex h-14 items-center justify-between" aria-label={t("app.title")}>
          <Link to="/" className="text-primary font-bold tracking-tight" aria-label={t("app.title")}>
            {t("app.title")}
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocale(locale === "fi" ? "en" : "fi")}
              className="text-xs font-medium px-2 py-1 rounded border border-border hover:bg-muted transition-colors"
              aria-label={locale === "fi" ? "Switch to English" : "Vaihda suomeksi"}
            >
              {locale === "fi" ? "EN" : "FI"}
            </button>
            <span className="hidden sm:inline text-sm text-muted-foreground" aria-hidden="true">{user?.email}</span>
            <Button variant="ghost" size="sm" asChild aria-label={t("app.title")}>
              <Link to="/"><Home className="h-4 w-4" aria-hidden="true" /></Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut} aria-label={locale === "fi" ? "Kirjaudu ulos" : "Sign out"}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </nav>
      </header>
      <main id="main-content" className="container py-6" role="main" tabIndex={-1}>{children}</main>
    </div>
  );
}
