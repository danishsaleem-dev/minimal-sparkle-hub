import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL, BRAND_COLOR, SOCIAL } from "@/lib/seo";

const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      // Default title / description (overridden per-page)
      { title: `${SITE_NAME} — Minimal Fashion Accessories` },
      { name: "description", content: SITE_DESCRIPTION },
      // Robots
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      // Brand / misc
      { name: "author", content: SITE_NAME },
      { name: "theme-color", content: BRAND_COLOR },
      { name: "format-detection", content: "telephone=no" },
      // Open Graph defaults
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_PK" },
      // Twitter Card defaults
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@byareeqaan" },
      { name: "twitter:creator", content: "@byareeqaan" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      // Favicon
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
      // DNS prefetch + preconnect for fonts
      { rel: "dns-prefetch", href: "//fonts.googleapis.com" },
      { rel: "dns-prefetch", href: "//fonts.gstatic.com" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      // DNS prefetch for Supabase CDN
      { rel: "dns-prefetch", href: "//supabase.co" },
      // Web manifest
      { rel: "manifest", href: "/site.webmanifest" },
      // Canonical for root — per-page canonical overrides this in child routes
      { rel: "canonical", href: SITE_URL + "/" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

// Global JSON-LD: WebSite + Organization
const globalSchema = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    publisher: { "@type": "Organization", name: SITE_NAME },
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    sameAs: Object.values(SOCIAL),
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+92-336-4246604",
      contactType: "customer service",
      availableLanguage: ["English", "Urdu"],
    },
    address: { "@type": "PostalAddress", addressCountry: "PK" },
  },
];

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en-PK">
      <head>
        <HeadContent />
        {/* Non-blocking Google Fonts — avoids render-blocking stylesheet */}
        <link rel="preload" href={FONT_URL} as="style" />
        <link
          rel="stylesheet"
          href={FONT_URL}
          media="print"
          // @ts-ignore – valid HTML attribute, ignored by React types
          onLoad="this.media='all'"
        />
        <noscript>
          <link rel="stylesheet" href={FONT_URL} />
        </noscript>
        {/* Global JSON-LD */}
        {globalSchema.map((schema, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
