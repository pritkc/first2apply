import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { GoogleAnalytics } from "@next/third-parties/google";
import { ThemeProvider } from "@/components/themeProvider";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <Component {...pageProps} />
      </ThemeProvider>
      <GoogleAnalytics gaId="G-YZM4X6MLS6" />
    </>
  );
}
