import type { Expense, Profile } from "./store";

export interface Insight {
  id: string;
  title: string;
  body: string;
  saving?: number;
  tone: "ottimizza" | "attenzione" | "ok";
}

/** Normalizza una spesa a costo equivalente mensile. */
export function monthlyEquivalent(e: Expense): number {
  if (e.frequency === "mensile") return e.amount;
  if (e.frequency === "annuale") return e.amount / 12;
  return 0; // una tantum non rientra nel ricorrente
}

export function totalMonthly(expenses: Expense[]): number {
  return expenses.reduce((acc, e) => acc + monthlyEquivalent(e), 0);
}

export function spendingByCategory(expenses: Expense[]) {
  const map = new Map<string, number>();
  for (const e of expenses) {
    const v = monthlyEquivalent(e);
    map.set(e.category, (map.get(e.category) ?? 0) + v);
  }
  return [...map.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

const streamingKeywords = ["netflix", "disney", "prime", "now tv", "paramount", "apple tv", "sky"];
const musicKeywords = ["spotify", "apple music", "tidal", "deezer", "youtube music"];

export function generateInsights(expenses: Expense[], profile: Profile): Insight[] {
  const insights: Insight[] = [];
  const subs = expenses.filter((e) => e.category === "abbonamento");
  const streaming = subs.filter((e) =>
    streamingKeywords.some((k) => e.name.toLowerCase().includes(k)),
  );
  const music = subs.filter((e) =>
    musicKeywords.some((k) => e.name.toLowerCase().includes(k)),
  );

  if (streaming.length >= 2) {
    const total = streaming.reduce((a, b) => a + monthlyEquivalent(b), 0);
    const saving = total - Math.min(...streaming.map(monthlyEquivalent));
    insights.push({
      id: "streaming-dup",
      title: "Abbonamenti streaming sovrapposti",
      body: `Hai ${streaming.length} servizi di streaming attivi (${streaming
        .map((s) => s.name)
        .join(", ")}). Mantenendone uno alla volta a rotazione potresti risparmiare ~${saving.toFixed(2)}€/mese.`,
      saving,
      tone: "ottimizza",
    });
  }

  if (music.length >= 2) {
    const total = music.reduce((a, b) => a + monthlyEquivalent(b), 0);
    insights.push({
      id: "music-dup",
      title: "Musica duplicata",
      body: `Stai pagando ${total.toFixed(2)}€/mese per più servizi musicali. Sceglierne uno libera budget per il risparmio.`,
      saving: total / 2,
      tone: "ottimizza",
    });
  }

  const monthly = totalMonthly(expenses);
  if (profile.monthlySalary > 0) {
    const ratio = monthly / profile.monthlySalary;
    if (ratio > 0.6) {
      insights.push({
        id: "high-ratio",
        title: "Spese fisse elevate",
        body: `Le tue uscite ricorrenti sono il ${(ratio * 100).toFixed(0)}% dello stipendio. La regola 50/30/20 suggerisce di restare sotto il 50% per i costi fissi.`,
        tone: "attenzione",
      });
    } else if (ratio < 0.3) {
      insights.push({
        id: "low-ratio",
        title: "Ottimo controllo",
        body: `Le tue spese ricorrenti sono solo il ${(ratio * 100).toFixed(0)}% dello stipendio. Hai margine per aumentare investimenti o risparmio.`,
        tone: "ok",
      });
    }
  }

  const totalSubs = subs.reduce((a, b) => a + monthlyEquivalent(b), 0);
  if (totalSubs > 50) {
    insights.push({
      id: "subs-total",
      title: "Abbonamenti totali",
      body: `Stai spendendo ${totalSubs.toFixed(2)}€/mese in abbonamenti (${(totalSubs * 12).toFixed(0)}€/anno). Rivedili una volta al trimestre.`,
      tone: "ottimizza",
      saving: totalSubs * 0.2,
    });
  }

  return insights;
}

export interface CoachPlan {
  bisogni: number;
  desideri: number;
  risparmio: number;
  investimento: number;
  emergencyTarget: number;
  suggestions: string[];
}

export function buildCoachPlan(profile: Profile, expenses: Expense[]): CoachPlan {
  const salary = profile.monthlySalary || 0;
  // Regola 50/30/20
  const bisogni = salary * 0.5;
  const desideri = salary * 0.3;
  const risparmio = salary * 0.2;

  // Allocazione risparmio per profilo di rischio
  let investQuota = 0.5;
  if (profile.riskTolerance === "alta") investQuota = 0.75;
  if (profile.riskTolerance === "bassa") investQuota = 0.25;
  const investimento = risparmio * investQuota;

  const emergencyTarget = (profile.fixedCosts || totalMonthly(expenses)) * 6;

  const suggestions: string[] = [];
  if (salary > 0) {
    suggestions.push(
      `Imposta un bonifico automatico di ${risparmio.toFixed(0)}€ il giorno dello stipendio verso un conto separato.`,
    );
  }
  if (investimento > 0) {
    const label =
      profile.riskTolerance === "alta"
        ? "PAC su ETF azionario globale (es. MSCI World)"
        : profile.riskTolerance === "bassa"
          ? "BTP o conto deposito vincolato"
          : "PAC bilanciato 60% azionario / 40% obbligazionario";
    suggestions.push(`Investi ${investimento.toFixed(0)}€/mese tramite ${label}.`);
  }
  if (profile.savingsGoal === "casa") {
    suggestions.push("Tieni la quota destinata alla casa su strumenti a basso rischio: la liquidità ti servirà entro pochi anni.");
  }
  if (profile.savingsGoal === "viaggi") {
    suggestions.push("Apri un sotto-conto 'Viaggi' e versa una quota fissa: vedrai crescere l'obiettivo concretamente.");
  }
  suggestions.push(
    `Costruisci un fondo di emergenza di ${emergencyTarget.toFixed(0)}€ (6 mesi di spese fisse) prima di esporti a rischi.`,
  );

  return {
    bisogni,
    desideri,
    risparmio,
    investimento,
    emergencyTarget,
    suggestions,
  };
}

export function formatEuro(n: number): string {
  return n.toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
}

export function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}
