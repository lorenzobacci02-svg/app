import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  useNavigate,
  HeadContent,
  Scripts,
  Link,
} from "@tanstack/react-router";
import { useEffect } from "react";

import appCss from "../styles.css?url";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import { FirstRunWizard } from "@/components/first-run-wizard";
import { ThemeToggle } from "@/components/theme-toggle";
import { useUi } from "@/lib/store";
import { AuthProvider, useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Pagina non trovata</h2>
        <Link to="/" className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110">
          Torna alla dashboard
        </Link>
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
        <h1 className="font-display text-xl font-semibold">La pagina non si è caricata</h1>
        <p className="mt-2 text-sm text-muted-foreground">Qualcosa è andato storto. Riprova.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110"
          >Riprova</button>
          <a href="/" className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent">Home</a>
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
      { title: "Fluxa — Gestione finanziaria intelligente" },
      { name: "description", content: "Bollette, abbonamenti, debiti/crediti e Coach IA. Gestione patrimoniale semplice." },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AuthGate() {
  const { user, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const theme = useUi((s) => s.theme);
  const qc = useQueryClient();

  // Apply theme class
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Invalidate caches on auth change
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      qc.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [qc]);

  useEffect(() => {
    if (loading) return;
    if (!user && pathname !== "/login") navigate({ to: "/login" });
  }, [user, loading, pathname, navigate]);

  if (pathname === "/login") {
    return (
      <>
        <Outlet />
        <Toaster richColors theme={theme} position="top-right" />
      </>
    );
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-sm text-muted-foreground">
        Caricamento…
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border px-4 sticky top-0 z-20 bg-background/70 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-sm text-muted-foreground hidden sm:inline">Riepilogo finanziario</span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <AddExpenseDialog />
            </div>
          </header>
          <main className="flex-1"><Outlet /></main>
        </div>
      </div>
      <FirstRunWizard />
      <Toaster richColors theme={theme} position="top-right" />
    </SidebarProvider>
  );
}
