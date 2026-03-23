import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { LanguageProvider } from "@/i18n/LanguageContext";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NewIdea from "./pages/NewIdea";
import IdeaDetail from "./pages/IdeaDetail";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, profileComplete } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (profileComplete === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!profileComplete) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, profileComplete } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (profileComplete === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  if (profileComplete) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
              <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/ideas/new" element={<ProtectedRoute><NewIdea /></ProtectedRoute>} />
              <Route path="/ideas/:id" element={<ProtectedRoute><IdeaDetail /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
