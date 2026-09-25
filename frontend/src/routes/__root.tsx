import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl lowercase">404</h1>
        <h2 className="mt-4 font-display text-xl lowercase">page not found</h2>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          the page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-stone-900 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-stone-50 hover:bg-stone-800"
          >
            go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl lowercase">this page didn't load</h1>
        <p className="mt-2 font-mono text-xs text-muted-foreground">something went wrong on our end.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-md bg-stone-900 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-stone-50"
          >
            try again
          </button>
          <a href="/" className="rounded-md border border-input bg-background px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em]">go home</a>
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
      { title: "keeberia — spatial design for custom input hardware" },
      { name: "description", content: "keeberia is a browser-based design environment for creating custom macropads and small input devices — layout first, manufacturing later." },
      { name: "author", content: "keeberia" },
      { property: "og:title", content: "keeberia — spatial design for custom input hardware" },
      { property: "og:description", content: "design custom macropads and keyboards visually. keeberia translates layout into pcb, case, and firmware outputs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Rubik:wght@300;400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
