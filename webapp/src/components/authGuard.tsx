"use client";

// auth guard decorator for nextjs that automatically redirects to login page
import { useSession } from "@/hooks/session";
import { useRouter } from "next/navigation";
import { memo, useEffect } from "react";

// if the user is not logged in
export const WithAuthGuard = (Component: React.ComponentType) => {
  const AuthGuard = (props: any) => {
    const router = useRouter();

    const { isLoading, isLoggedIn } = useSession();

    // redirect to login page if the user is not logged in
    // after the session has finished loaded
    useEffect(() => {
      if (!isLoading && !isLoggedIn) {
        router.push("/login");
      }
    }, [isLoading, isLoggedIn, router]);

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
    <main className="flex min-h-screen w-full flex-col items-center justify-center">
      <div className="h-16 w-16 animate-spin rounded-full border-b-4 border-gray-900"></div>
    </main>
  );
};
