import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  profileComplete: boolean | null; // null = still loading
  signOut: () => Promise<void>;
  recheckProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  profileComplete: null,
  signOut: async () => {},
  recheckProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);

  const checkProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("name, company")
      .eq("user_id", userId)
      .maybeSingle();

    // Profile is "complete" if name OR company is filled
    setProfileComplete(!!(data?.name || data?.company));
  };

  const recheckProfile = async () => {
    if (session?.user) {
      await checkProfile(session.user.id);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
        if (session?.user) {
          // Defer profile check to avoid Supabase client deadlock
          setTimeout(() => checkProfile(session.user.id), 0);
        } else {
          setProfileComplete(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session?.user) {
        checkProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfileComplete(null);
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, profileComplete, signOut, recheckProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
