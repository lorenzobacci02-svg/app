import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Send, Sparkles } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

import { useExpenses, useProfile, useUpdateProfile } from "@/lib/data";
import { buildCoachPlan, formatEuro, spendingByCategory, totalMonthly } from "@/lib/insights";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Profile } from "@/lib/store";

export const Route = createFileRoute("/coach")({
  head: () => ({
    meta: [
      { title: "Coach IA — Fluxa" },
      { name: "description", content: "Chiedi consigli finanziari al Coach IA e ottieni un piano 50/30/20 personalizzato." },
    ],
  }),
  component: Coach,
});

const goalOptions = [
  { value: "casa", label: "Acquisto casa" },
  { value: "investimenti", label: "Investire" },
  { value: "viaggi", label: "Viaggi & desideri" },
  { value: "emergenza", label: "Fondo emergenza" },
] as const;

const riskOptions = [
  { value: "bassa", label: "Prudente", desc: "Preferisco non rischiare" },
  { value: "media", label: "Bilanciato", desc: "Rischio moderato" },
  { value: "alta", label: "Dinamico", desc: "Accetto oscillazioni per crescere di più" },
] as const;

function Coach() {
  const profileQ = useProfile();
  const expensesQ = useExpenses();
  const updateProfile = useUpdateProfile();
  const profile = profileQ.data;
  const expenses = expensesQ.data ?? [];

  const [name, setName] = useState(profile?.name ?? "");
  const [salary, setSalary] = useState(profile?.monthlySalary ? String(profile.monthlySalary) : "");
  const [fixed, setFixed] = useState(profile?.fixedCosts ? String(profile.fixedCosts) : "");
  const [goal, setGoal] = useState<Profile["savingsGoal"]>(profile?.savingsGoal ?? "");
  const [risk, setRisk] = useState<Profile["riskTolerance"]>(profile?.riskTolerance ?? "");

  async function save() {
    const s = parseFloat(salary.replace(",", "."));
    if (!s || s <= 0) {
      toast.error("Inserisci uno stipendio mensile valido");
      return;
    }
    try {
      await updateProfile.mutateAsync({
        name: name.trim(),
        monthlySalary: s,
        fixedCosts: parseFloat(fixed.replace(",", ".")) || 0,
        savingsGoal: goal || "investimenti",
        riskTolerance: risk || "media",
        completed: true,
      });
      toast.success("Piano aggiornato");
    } catch (err) {
      toast.error("Errore", { description: err instanceof Error ? err.message : "Riprova" });
    }
  }

  const effective: Profile = {
    name,
    email: profile?.email ?? "",
    monthlySalary: parseFloat(salary.replace(",", ".")) || profile?.monthlySalary || 0,
    fixedCosts: parseFloat(fixed.replace(",", ".")) || profile?.fixedCosts || 0,
    savingsGoal: (goal || profile?.savingsGoal || "investimenti") as Profile["savingsGoal"],
    riskTolerance: (risk || profile?.riskTolerance || "media") as Profile["riskTolerance"],
    completed: true,
  };
  const plan = buildCoachPlan(effective, expenses);
  const hasSalary = effective.monthlySalary > 0;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full space-y-10">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-medium">
          <Sparkles className="size-3.5" /> Wealth Coach
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
          Costruisci il tuo piano finanziario
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Compila il tuo profilo e poi chatta con il Coach IA per qualsiasi domanda.
        </p>
      </div>

      <div className="bg-surface ring-card rounded-2xl p-6 md:p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Come ti chiami?</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Marco" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salary">Stipendio mensile netto (€)</Label>
            <Input id="salary" inputMode="decimal" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="2500" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="fixed">Spese fisse mensili (€) <span className="text-muted-foreground font-normal">— opzionale</span></Label>
            <Input id="fixed" inputMode="decimal" value={fixed} onChange={(e) => setFixed(e.target.value)} placeholder="Es. 900 (affitto + utenze + auto)" />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Obiettivo principale</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {goalOptions.map((g) => {
              const active = goal === g.value;
              return (
                <button key={g.value} type="button" onClick={() => setGoal(g.value)}
                  className={`px-3 py-3 rounded-xl border text-sm font-medium transition-all text-left ${active ? "border-primary bg-primary/15 text-foreground" : "border-border bg-background hover:border-primary/40"}`}>
                  {g.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Profilo di rischio</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {riskOptions.map((r) => {
              const active = risk === r.value;
              return (
                <button key={r.value} type="button" onClick={() => setRisk(r.value)}
                  className={`p-4 rounded-xl border text-left transition-all ${active ? "border-primary bg-primary/15" : "border-border bg-background hover:border-primary/40"}`}>
                  <p className="font-display font-semibold text-sm">{r.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        <Button onClick={save} size="lg" className="w-full md:w-auto gap-2" disabled={updateProfile.isPending}>
          <Sparkles className="size-4" />
          {profile?.completed ? "Aggiorna il mio piano" : "Genera il mio piano"}
        </Button>
      </div>

      {hasSalary && (
        <section className="space-y-6">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Il tuo piano 50 / 30 / 20</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PlanCard label="Bisogni" amount={plan.bisogni} percent={50} hint="Casa, bollette, alimentari, trasporti." />
            <PlanCard label="Desideri" amount={plan.desideri} percent={30} hint="Tempo libero, abbonamenti, ristoranti." />
            <PlanCard label="Risparmio & investimenti" amount={plan.risparmio} percent={20} hint={`Di cui ${formatEuro(plan.investimento)} investiti.`} accent />
          </div>

          <div className="bg-surface ring-card rounded-2xl p-6 md:p-8 space-y-4">
            <h3 className="font-display text-lg font-semibold">Consigli del Coach</h3>
            <ul className="space-y-3">
              {plan.suggestions.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed">
                  <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Fondo di emergenza consigliato: <span className="text-foreground font-semibold">{formatEuro(plan.emergencyTarget)}</span> (≈ 6 mesi di spese fisse).
              </p>
            </div>
          </div>
        </section>
      )}

      <CoachChat profile={effective} expenses={expenses} />
    </div>
  );
}

function PlanCard({ label, amount, percent, hint, accent }: { label: string; amount: number; percent: number; hint: string; accent?: boolean }) {
  return (
    <div className={`p-6 rounded-2xl ring-card ${accent ? "bg-primary text-primary-foreground glow-indigo border border-white/20" : "bg-surface"}`}>
      <p className={`text-[10px] uppercase tracking-widest font-medium mb-2 ${accent ? "text-white/70" : "text-muted-foreground"}`}>{label} · {percent}%</p>
      <p className="font-display text-3xl font-semibold tracking-tight">{formatEuro(amount)}</p>
      <p className={`text-xs mt-2 ${accent ? "text-white/80" : "text-muted-foreground"}`}>{hint}</p>
    </div>
  );
}

function CoachChat({ profile, expenses }: { profile: Profile; expenses: ReturnType<typeof useExpenses>["data"] }) {
  const [input, setInput] = useState("");

  const context = useMemo(() => {
    const list = expenses ?? [];
    return {
      name: profile.name || undefined,
      monthlySalary: profile.monthlySalary || undefined,
      fixedCosts: profile.fixedCosts || undefined,
      monthlyExpenses: totalMonthly(list),
      topCategories: spendingByCategory(list).slice(0, 5),
      savingsGoal: profile.savingsGoal || undefined,
      riskTolerance: profile.riskTolerance || undefined,
    };
  }, [profile, expenses]);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({ context }),
    }),
  });

  const busy = status === "submitted" || status === "streaming";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    await sendMessage({ text });
  }

  const suggestions = [
    "Come posso risparmiare 200€ al mese?",
    "Cosa sono gli ETF?",
    "Conviene chiudere uno dei miei abbonamenti?",
    "Come costruisco un fondo di emergenza?",
  ];

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Chiedi al Coach</h2>
        <p className="text-sm text-muted-foreground">Domande su risparmio, abbonamenti, investimenti. Risposte in italiano.</p>
      </div>

      <div className="bg-surface ring-card rounded-2xl flex flex-col h-[480px]">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Prova a chiedere:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => sendMessage({ text: s })}
                    className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => {
            const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
            return (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] ${m.role === "user" ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5" : "text-foreground"}`}>
                  <p className={`text-sm whitespace-pre-wrap leading-relaxed ${m.role === "user" ? "" : ""}`}>{text}</p>
                </div>
              </div>
            );
          })}
          {busy && messages[messages.length - 1]?.role === "user" && (
            <p className="text-sm text-muted-foreground animate-pulse">Sto pensando…</p>
          )}
        </div>
        <form onSubmit={submit} className="border-t border-border p-3 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Scrivi un messaggio…"
            disabled={busy}
            autoFocus
          />
          <Button type="submit" size="icon" disabled={busy || !input.trim()}>
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </section>
  );
}
