import { createRoot } from "react-dom/client";
import {
  createMemoryRouter,
  RouterProvider,
  Route,
  Link,
  createRoutesFromElements,
} from "react-router-dom";
import { LoginPage } from "./pages/login";
import { SignupPage } from "./pages/signup";
import { SupabaseProvider } from "./hooks/supabase";
import { SessionProvider } from "./hooks/session";
import { withAuthGuard } from "./components/authGuard";
import { Home } from "./pages/home";
import { Toaster } from "./components/ui/toaster";
import { ThemeProvider } from "./components/themeProvider";

const AuthGuardedMainWindow = withAuthGuard(() => {
  return (
    <div>
      <Home />
      <Link to="/main_window/about">About</Link>
      <Link to="/main_window">MainWindow</Link>
    </div>
  );
});

const router = createMemoryRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<AuthGuardedMainWindow />}></Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/about" element={<div>About</div>} />
    </>
  ),
  { initialEntries: ["/"] }
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
