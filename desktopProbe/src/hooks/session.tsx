import { getUser } from "@/lib/electronMainSdk";
import { getExceptionMessage } from "@/lib/error";
import { User } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";

// Create a context for the session manager
const SessionContext = createContext<{
  isLoading: boolean;
  user: User | null;
  isLoggedIn: boolean;
  login: (user: User) => void;
  logout: () => void;
}>({
  isLoading: true,
  user: null,
  isLoggedIn: false,
  login: async (user: User) => {},
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
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Load the user on mount
  useEffect(() => {
    const asyncLoad = async () => {
      try {
        const currentUser = await getUser();
        setUser(currentUser);
        setIsLoading(false);
      } catch (error) {
        console.error(getExceptionMessage(error));
      }
    };

    asyncLoad();
  }, []);

  return (
    <SessionContext.Provider
      value={{
        isLoading,
        user,
        isLoggedIn: !!user,
        logout: () => setUser(null),
        login: async (user: User) => setUser(user),
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};
