import { createFileRoute } from "@tanstack/react-router";
import { Check, Crown, Sparkles } from "lucide-react";
import { useProfile } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/piano")({
  head: () => ({
    meta: [
      { title: "Abbonamento Fluxa — Piano" },
      { name: "description", content: "Prova gratuita di 1 mese, poi solo 2€/mese per tutte le funzionalità di Fluxa." },
    ],
  }),
  component: Piano,
});

function daysLeft(iso?: string) {
  if (!iso) return 30;
  const end = new Date(iso).getTime() + 30 * 86400000;
  return Math.max(0, Math.ceil((end - Date.now()) / 86400000));
}

function Piano() {
  const profileQ = useProfile();
  const profile = profileQ.data;
  const left = daysLeft(profile?.trialStartedAt);
  const inTrial = left > 0 && !profile?.isPaid;

  const features = [
    "Bollette, abbonamenti e scadenze illimitate",
    "Spese quotidiane: alimentari, salute, trasporti",
    "Debiti & crediti con scadenze",
    "Coach IA con chat in italiano",
    "Piano 50/30/20 personalizzato",
    "Tema chiaro e scuro",
    "Backup automatico sul cloud",
  ];

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto w-full space-y-8">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-medium">
          <Crown className="size-3.5" /> Abbonamento Fluxa
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
          Tutto Fluxa, ogni mese
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          1 mese gratis per provare. Poi solo <span className="text-foreground font-semibold">2€/mese</span>. Cancelli quando vuoi.
        </p>
      </div>

      {/* Trial banner */}
      {inTrial && (
        <div className="glow-indigo bg-primary border border-white/20 p-5 rounded-2xl flex items-center gap-4">
          <Sparkles className="size-6 text-white shrink-0" />
          <div className="flex-1">
            <p className="text-white font-display font-semibold">Sei in prova gratuita</p>
            <p className="text-white/85 text-sm">Restano <span className="font-semibold">{left} giorni</span> di accesso completo.</p>
          </div>
        </div>
      )}

      {/* Plan card */}
      <div className="bg-surface ring-card rounded-2xl p-6 md:p-8 space-y-6">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Piano Pro</p>
            <p className="font-display text-4xl font-semibold tracking-tight">
              2€<span className="text-muted-foreground text-base font-normal">/mese</span>
            </p>
          </div>
          <p className="text-xs text-muted-foreground">Fatturato mensilmente · annulla quando vuoi</p>
        </div>

        <ul className="space-y-2.5">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-sm">
              <Check className="size-4 text-primary shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        <Button
          size="lg"
          className="w-full"
          onClick={() =>
            toast.info("Pagamenti in arrivo", {
              description: "L'attivazione del pagamento sarà disponibile a breve. Continuiamo a darti accesso pieno.",
            })
          }
        >
          {profile?.isPaid ? "Gestisci abbonamento" : inTrial ? "Continua dopo la prova" : "Attiva Fluxa Pro"}
        </Button>

        <p className="text-[11px] text-center text-muted-foreground">
          Cliccando attivi una sottoscrizione ricorrente di 2€/mese. Puoi annullarla in qualsiasi momento.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center text-xs text-muted-foreground">
        <div className="bg-surface/60 ring-card rounded-xl p-4">
          <p className="font-display font-semibold text-foreground text-sm mb-1">Nessuna pubblicità</p>
          Solo le tue finanze, niente distrazioni.
        </div>
        <div className="bg-surface/60 ring-card rounded-xl p-4">
          <p className="font-display font-semibold text-foreground text-sm mb-1">Crittografia</p>
          I dati sono cifrati e accessibili solo a te.
        </div>
        <div className="bg-surface/60 ring-card rounded-xl p-4">
          <p className="font-display font-semibold text-foreground text-sm mb-1">Cancellazione facile</p>
          Esci con un click, niente vincoli.
        </div>
      </div>
    </div>
  );
}
