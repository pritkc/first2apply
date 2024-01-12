import { User } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";

import { useSupabase } from "./supabase";
import { getExceptionMessage } from "@/lib/error";

// Create a context for the session manager
const SessionContext = createContext<{
  isLoading: boolean;
  user: User | null;
  isLoggedIn: boolean;
  logout: () => Promise<void>;
}>({
  isLoading: true,
  user: null,
  isLoggedIn: false,
  logout: async () => {},
});

/**
 * Global hook used to access the session manager.
 */
export const useSession = () => {
  const sessionManager = useContext(SessionContext);
  if (sessionManager === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return sessionManager;
};

// Create a provider for the session
export const SessionProvider = ({ children }: React.PropsWithChildren) => {
  const supabase = useSupabase();

  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // effect to store the session in localStorage
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  // callback used to remove the session from localStorage and reset supabase
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.log(getExceptionMessage(error));
    }
  };

  return (
    <SessionContext.Provider
      value={{ isLoading, user, isLoggedIn: !!user, logout }}
    >
      {children}
    </SessionContext.Provider>
  );
};
