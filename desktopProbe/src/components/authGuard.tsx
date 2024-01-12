// auth guard decorator for nextjs that automatically redirects to login page
import { useSession } from "@/hooks/session";

import { memo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// if the user is not logged in
export const withAuthGuard = (Component: React.ComponentType) => {
  const AuthGuard = (props: any) => {
    const location = useLocation();
    const navigate = useNavigate();

    const { isLoading, isLoggedIn } = useSession();

    // redirect to login page if the user is not logged in
    // after the session has finished loaded
    useEffect(() => {
      if (!isLoading && !isLoggedIn) {
        navigate("/login");
      }
    }, [isLoading, isLoggedIn, navigate]);

    // bypass if this is the login page
    if (location.pathname === "/login") {
      return <Component {...props} />;
    }

    // make sure the component is not rendered if the user is not logged in
    if (isLoading || !isLoggedIn) {
      return <AuthGuardLoading />;
    }

    return <Component {...props} />;
  };

  return memo(AuthGuard);
};

/**
 * Loading component for the auth guard.
 */
export const AuthGuardLoading = () => {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center w-full">
      <div className="w-16 h-16 border-b-4 border-gray-900 rounded-full animate-spin"></div>
    </main>
  );
};
