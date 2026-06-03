import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Accedi — Fluxa" },
      { name: "description", content: "Accedi a Fluxa per gestire bollette, abbonamenti e finanze personali." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Account creato!", { description: "Stiamo configurando il tuo Fluxa…" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error("Errore", { description: err instanceof Error ? err.message : "Riprova" });
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    const r = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (r.error) {
      toast.error("Google non disponibile", {
        description: r.error instanceof Error ? r.error.message : String(r.error),
      });
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="size-10 rounded-xl bg-primary grid place-items-center glow-indigo">
            <Wallet className="size-5 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-semibold tracking-tight">Fluxa</span>
        </div>

        <div className="bg-surface ring-card rounded-2xl p-6 md:p-8 space-y-5">
          <div className="space-y-1 text-center">
            <h1 className="font-display text-xl font-semibold">
              {mode === "signup" ? "Crea il tuo account" : "Bentornato"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "signup"
                ? "1 mese di prova gratuita, poi solo 2€/mese. Il profilo parte vuoto e lo configuri dopo."
                : "Accedi per riprendere la tua gestione."}
            </p>
          </div>

          <Button onClick={google} disabled={busy} variant="outline" className="w-full gap-2">
            <GoogleIcon /> Continua con Google
          </Button>

          <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> oppure <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="marco@email.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Almeno 6 caratteri" />
            </div>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Attendi…" : mode === "signup" ? "Inizia gratis" : "Accedi"}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            {mode === "signup" ? "Hai già un account?" : "Non hai un account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="text-primary font-medium hover:underline"
            >
              {mode === "signup" ? "Accedi" : "Registrati"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M22 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.6c-.2 1.3-1 2.4-2.1 3.1v2.6h3.4c2-1.8 3.1-4.5 3.1-7.5z" />
      <path fill="#34A853" d="M12 22c2.8 0 5.2-1 6.9-2.5l-3.4-2.6c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.7v2.7C4.4 19.8 7.9 22 12 22z" />
      <path fill="#FBBC05" d="M6.2 13.6c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V6.9H2.7C1.9 8.5 1.5 10.2 1.5 12s.4 3.5 1.2 5.1l3.5-2.7z" />
      <path fill="#EA4335" d="M12 5.8c1.5 0 2.9.5 4 1.5l3-3C17.2 2.7 14.8 1.8 12 1.8 7.9 1.8 4.4 4 2.7 6.9l3.5 2.7c.8-2.5 3.1-3.8 5.8-3.8z" />
    </svg>
  );
}
