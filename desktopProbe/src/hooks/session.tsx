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
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // todo-2: implement the session manager
    setIsLoading(false);
  }, [user]);

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
