import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, TrendingDown, TrendingUp, ArrowDownCircle, ArrowUpCircle } from "lucide-react";

import { useExpenses, useProfile, useDebts } from "@/lib/data";
import {
  daysUntil,
  formatEuro,
  generateInsights,
  spendingByCategory,
  totalMonthly,
} from "@/lib/insights";
import { categoryLabel } from "@/lib/store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Fluxa" },
      { name: "description", content: "Tutte le tue scadenze, abbonamenti e finanze in un colpo d'occhio." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const expensesQ = useExpenses();
  const profileQ = useProfile();
  const debtsQ = useDebts();
  const expenses = expensesQ.data ?? [];
  const profile = profileQ.data;
  const debts = debtsQ.data ?? [];

  const monthly = totalMonthly(expenses);
  const byCat = spendingByCategory(expenses);
  const maxCat = byCat[0]?.amount ?? 1;
  const insights = generateInsights(expenses, profile ?? {
    name: "", email: "", monthlySalary: 0, fixedCosts: 0, savingsGoal: "", riskTolerance: "", completed: false,
  });
  const topInsight = insights[0];

  const upcoming = [...expenses]
    .filter((e) => e.frequency !== "una-tantum" || new Date(e.dueDate).getTime() > Date.now())
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  const totalDebt = debts.filter((d) => d.kind === "debt" && !d.settled).reduce((a, b) => a + b.amount, 0);
  const totalCredit = debts.filter((d) => d.kind === "credit" && !d.settled).reduce((a, b) => a + b.amount, 0);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full space-y-12">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
          Ciao{profile?.name ? `, ${profile.name}` : ""} 👋
        </h1>
        <p className="text-muted-foreground">
          Le tue finanze in un colpo d'occhio.
        </p>
      </div>

      {/* Mini KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Spese / mese" value={formatEuro(monthly)} />
        <Kpi label="Devi" value={formatEuro(totalDebt)} tone={totalDebt > 0 ? "warn" : undefined} icon={<ArrowUpCircle className="size-4" />} />
        <Kpi label="Ti devono" value={formatEuro(totalCredit)} tone={totalCredit > 0 ? "good" : undefined} icon={<ArrowDownCircle className="size-4" />} />
        <Kpi label="Scadenze 7gg" value={String(upcoming.filter((e) => daysUntil(e.dueDate) <= 7).length)} />
      </div>

      <section className="space-y-5">
        <div className="flex items-end justify-between">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Prossime scadenze</h2>
          <Link to="/bollette" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
            Vedi tutto <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {upcoming.length === 0 && (
            <div className="col-span-full p-8 rounded-2xl bg-surface ring-card text-center text-muted-foreground text-sm">
              Nessuna scadenza imminente.
            </div>
          )}
          {upcoming.map((e) => {
            const days = daysUntil(e.dueDate);
            const percent = Math.max(5, Math.min(95, ((30 - days) / 30) * 100));
            const tone = days <= 5 ? "text-destructive" : days <= 14 ? "text-warning" : "text-success";
            return (
              <div key={e.id} className="bg-surface ring-card p-5 rounded-2xl flex items-center gap-5">
                <div className="size-14 rounded-full p-1 grid place-items-center" style={{ background: `conic-gradient(var(--primary) ${percent}%, var(--surface-elevated) 0)` }}>
                  <div className="size-full bg-surface rounded-full grid place-items-center">
                    <span className={`text-[10px] font-semibold ${tone}`}>{days}gg</span>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium truncate">
                    {categoryLabel[e.category]} • {e.name}
                  </p>
                  <p className="font-display text-xl font-semibold">{formatEuro(e.amount)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
        <div className="lg:col-span-8 space-y-6">
          {topInsight ? (
            <div className="glow-indigo bg-primary border border-white/20 p-6 rounded-2xl relative overflow-hidden">
              <div className="relative z-10 flex gap-5 items-start">
                <div className="size-10 bg-white/20 rounded-full grid place-items-center shrink-0">
                  <Sparkles className="size-5 text-white" />
                </div>
                <div className="space-y-1.5 max-w-[60ch]">
                  <p className="text-[10px] uppercase tracking-widest text-white/70 font-semibold">Coach IA · {topInsight.tone}</p>
                  <p className="text-white font-display font-semibold text-lg">{topInsight.title}</p>
                  <p className="text-white/85 text-sm leading-relaxed">{topInsight.body}</p>
                  {topInsight.saving ? (
                    <p className="text-white text-xs font-medium mt-2">Risparmio stimato: {formatEuro(topInsight.saving)}/mese</p>
                  ) : null}
                </div>
              </div>
              <div className="absolute -right-8 -top-8 size-40 bg-white/10 blur-3xl rounded-full" />
            </div>
          ) : (
            <div className="bg-surface ring-card p-6 rounded-2xl flex items-center gap-4">
              <Sparkles className="size-5 text-primary" />
              <p className="text-sm text-muted-foreground">Aggiungi qualche spesa: il Coach IA inizierà a darti consigli.</p>
            </div>
          )}

          {insights.length > 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.slice(1, 5).map((i) => (
                <div key={i.id} className="bg-surface ring-card p-5 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2">
                    {i.tone === "attenzione" ? <TrendingUp className="size-4 text-warning" /> : i.tone === "ok" ? <TrendingDown className="size-4 text-success" /> : <Sparkles className="size-4 text-primary" />}
                    <p className="font-display font-semibold text-sm">{i.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{i.body}</p>
                </div>
              ))}
            </div>
          )}

          <div className="bg-surface ring-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display font-semibold">Parla con il Coach</h3>
              <Link to="/coach"><Button size="sm" variant="ghost" className="gap-1.5">Apri chat <ArrowRight className="size-3.5" /></Button></Link>
            </div>
            <p className="text-sm text-muted-foreground">Chiedi qualsiasi cosa su risparmio, investimenti, abbonamenti: il Coach IA risponde in italiano.</p>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface ring-card p-6 rounded-2xl space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-1">Spesa mensile</p>
                <p className="font-display text-3xl font-semibold tracking-tight">{formatEuro(monthly)}</p>
              </div>
              {profile && profile.monthlySalary > 0 && (
                <p className="text-xs text-muted-foreground text-right">
                  {((monthly / profile.monthlySalary) * 100).toFixed(0)}%<br />dello stipendio
                </p>
              )}
            </div>
            <div className="space-y-3">
              {byCat.length === 0 && <p className="text-xs text-muted-foreground">Nessuna spesa registrata.</p>}
              {byCat.slice(0, 5).map((c) => (
                <div key={c.category} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">{categoryLabel[c.category as keyof typeof categoryLabel]}</span>
                    <span className="text-foreground">{formatEuro(c.amount)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-elevated rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${(c.amount / maxCat) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, tone, icon }: { label: string; value: string; tone?: "warn" | "good"; icon?: React.ReactNode }) {
  return (
    <div className="bg-surface ring-card rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{label}</p>
        {icon && <span className={tone === "warn" ? "text-warning" : tone === "good" ? "text-success" : "text-muted-foreground"}>{icon}</span>}
      </div>
      <p className={`font-display text-xl font-semibold mt-1 ${tone === "warn" ? "text-warning" : tone === "good" ? "text-success" : ""}`}>{value}</p>
    </div>
  );
}
