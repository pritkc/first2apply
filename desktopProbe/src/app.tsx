import { useEffect, ComponentType } from "react";

import { withAuthGuard } from "./components/authGuard";

import {
  createMemoryRouter,
  RouterProvider,
  Route,
  createRoutesFromElements,
} from "react-router-dom";

import { createRoot } from "react-dom/client";

import { SessionProvider } from "./hooks/session";
import { ThemeProvider } from "./components/themeProvider";
import { SitesProvider } from "./hooks/sites";
import { LinksProvider } from "./hooks/links";
import { SettingsProvider } from "./hooks/settings";

import { Home } from "./pages/home";
import { LoginPage } from "./pages/login";
import { SignupPage } from "./pages/signup";
import { SettingsPage } from "./pages/settings";
import { LinksPage } from "./pages/links";

import { Toaster } from "./components/ui/toaster";
import { ForgotPasswordPage } from "./pages/forgotPassword";
import { ResetPasswordPage } from "./pages/resetPassword";

// Auth guarded component wrapper
function AuthGuardedComponent({ component }: { component: ComponentType }) {
  const Component = withAuthGuard(component);
  return <Component />;
}

const router = createMemoryRouter(
  createRoutesFromElements(
    <>
      <Route
        path="/"
        element={<AuthGuardedComponent component={Home} />}
      ></Route>
      <Route
        path="/links"
        element={<AuthGuardedComponent component={LinksPage} />}
      ></Route>
      <Route
        path="/settings"
        element={<AuthGuardedComponent component={SettingsPage} />}
      ></Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
    </>
  ),
  { initialEntries: ["/"] }
);

/**
 * Main app component.
 */
function App() {
  // subscribe to navigation events
  useEffect(() => {
    // @ts-ignore
    window.electron?.on("navigate", (_, { path }) => {
      router.navigate(`${path}?r=${Date.now()}`, {});
    });
  }, []);

  return (
    <>
      <SessionProvider>
        <ThemeProvider
          attribute="class"
          // @ts-ignore
          defaultTheme={window.electron?.theme || "light"}
          // defaultTheme={"light"}
          disableTransitionOnChange
        >
          <SettingsProvider>
            <SitesProvider>
              <LinksProvider>
                <RouterProvider router={router}></RouterProvider>
              </LinksProvider>
            </SitesProvider>
          </SettingsProvider>
        </ThemeProvider>
      </SessionProvider>

      <Toaster />
    </>
  );
}

// Render the app
const root = createRoot(document.body.querySelector("#app")!);
root.render(<App />);
