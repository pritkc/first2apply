import { createRoot } from "react-dom/client";
import {
  createMemoryRouter,
  RouterProvider,
  Route,
  Link,
  createRoutesFromElements,
} from "react-router-dom";
import { AuthPage } from "./pages/auth";
import { SupabaseProvider } from "./hooks/supabase";
import { SessionProvider } from "./hooks/session";
import { withAuthGuard } from "./components/authGuard";

const AuthGuardedMainWindow = withAuthGuard(() => {
  return (
    <div>
      <Link to="/main_window/about">About</Link>
      <Link to="/main_window">MainWindow</Link>
    </div>
  );
});

const router = createMemoryRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<AuthGuardedMainWindow />}></Route>
      <Route path="/login" element={<AuthPage></AuthPage>} />
      <Route path="/about" element={<div>About</div>} />
    </>
  ),
  { initialEntries: ["/"] }
);

/**
 * Main app component.
 */
function App() {
  return (
    <SupabaseProvider>
      <SessionProvider>
        <RouterProvider router={router}></RouterProvider>
      </SessionProvider>
    </SupabaseProvider>
  );
}

// render the app
const root = createRoot(document.body.querySelector("#app")!);
root.render(<App />);
