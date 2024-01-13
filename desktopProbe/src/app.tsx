import { createRoot } from "react-dom/client";
import {
  createMemoryRouter,
  RouterProvider,
  Route,
  createRoutesFromElements,
} from "react-router-dom";
import { SupabaseProvider } from "./hooks/supabase";
import { SessionProvider } from "./hooks/session";
import { withAuthGuard } from "./components/authGuard";
import { Home } from "./pages/home";
import { Toaster } from "./components/ui/toaster";
import { ThemeProvider } from "./components/themeProvider";
import { LoginPage } from "./pages/login";
import { SignupPage } from "./pages/signup";
import { SettingsPage } from "./pages/settings";
import { ComponentType } from "react";
import { LinksPage } from "./pages/links";

// auth guarded component wrapper
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
      <Route path="/about" element={<div>About</div>} />
    </>
  ),
  { initialEntries: ["/links"] }
);

/**
 * Main app component.
 */
function App() {
  // @ts-ignore
  console.log(window.electron?.theme);

  return (
    <>
      <SupabaseProvider>
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            // @ts-ignore
            defaultTheme={window.electron?.theme || "light"}
            disableTransitionOnChange
          >
            <RouterProvider router={router}></RouterProvider>
          </ThemeProvider>
        </SessionProvider>
      </SupabaseProvider>
      <Toaster />
    </>
  );
}

// render the app
const root = createRoot(document.body.querySelector("#app")!);
root.render(<App />);
