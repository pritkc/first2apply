import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Route,
  Link,
  createRoutesFromElements,
} from "react-router-dom";
import { AuthPage } from "./pages/auth";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/main_window" element={<AuthPage />}>
      <Route path="about" element={<div>About</div>} />
    </Route>
  )
);

/**
 * Main app component.
 */
function App() {
  return <RouterProvider router={router} />;
}

// render the app
const root = createRoot(document.body);
root.render(<App />);
