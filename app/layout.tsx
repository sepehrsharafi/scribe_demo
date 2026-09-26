import type { Metadata } from "next";
import { Raleway, Figtree, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { cn } from "@/lib/utils";
import { getI18n } from "@/lib/i18n/server";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/components/i18n-provider";

const raleway = Raleway({ subsets: ["latin"], variable: "--font-sans" });

const figtree = Figtree({ subsets: ["latin"], variable: "--font-heading" });

const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

/* The Farsi demo's one face, in its Farsi-digit cut: every numeral on the page
   is drawn in Persian without the data having to change. */
const vazirmatn = localFont({
  src: [
    { path: "./fonts/vazirmatn/Vazirmatn-FD-Regular.woff2", weight: "400" },
    { path: "./fonts/vazirmatn/Vazirmatn-FD-Medium.woff2", weight: "500" },
    { path: "./fonts/vazirmatn/Vazirmatn-FD-SemiBold.woff2", weight: "600" },
    { path: "./fonts/vazirmatn/Vazirmatn-FD-Bold.woff2", weight: "700" },
  ],
  variable: "--font-farsi",
  preload: false,
});

export const metadata: Metadata = {
  title: "Scribe",
  description: "A doctor-first AI medical scribe for capturing, reviewing, and approving consultation notes.",
};

/**
 * The document and the providers every screen shares, signed in or not. The
 * workspace chrome lives one level down, in app/(workspace)/layout.tsx, so the
 * sign-in screen can stand on its own.
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { locale, dir, changes, now } = await getI18n();

  return (
    <html
      lang={locale}
      dir={dir}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={cn(
        "h-full scroll-smooth antialiased",
        raleway.variable,
        figtree.variable,
        geistMono.variable,
        vazirmatn.variable,
      )}
    >
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <I18nProvider locale={locale} changes={changes} now={now}>
            <TooltipProvider>{children}</TooltipProvider>
            <Toaster position={dir === "rtl" ? "bottom-left" : "bottom-right"} />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
