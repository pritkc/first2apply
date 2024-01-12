import { ENV } from "../env";

import { createClient } from "@supabase/supabase-js";
import React from "react";

const SUPABASE_CLIENT = createClient(ENV.supabase.url, ENV.supabase.key);

// Create a context for the Supabase client
const SupabaseContext = React.createContext(SUPABASE_CLIENT);

/**
 * Global hook used to access the supabase client.
 */
export const useSupabase = () => {
  const supabase = React.useContext(SupabaseContext);
  if (!supabase) {
    throw new Error("useSupabase must be used within a SupabaseProvider");
  }
  return supabase;
};

/**
 * Global hook used to access the supabase client.
 */
export const SupabaseProvider = ({ children }: React.PropsWithChildren) => {
  return (
    <SupabaseContext.Provider value={SUPABASE_CLIENT}>
      {children}
    </SupabaseContext.Provider>
  );
};
