import { useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Receipt, Wallet, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { useExpenses, useProfile, useAddExpensesBulk, useUpdateProfile } from "@/lib/data";
import type { Category, Frequency } from "@/lib/store";
import { formatEuro } from "@/lib/insights";

interface Suggestion {
  name: string;
  amount: number;
  category: Category;
  frequency: Frequency;
  defaultOn?: boolean;
}

const SUGGESTIONS: Suggestion[] = [
  { name: "Affitto / Mutuo", amount: 650, category: "casa", frequency: "mensile" },
  { name: "Bolletta luce", amount: 60, category: "bolletta", frequency: "mensile" },
  { name: "Bolletta gas", amount: 50, category: "bolletta", frequency: "mensile" },
  { name: "Internet / WiFi", amount: 30, category: "bolletta", frequency: "mensile" },
  { name: "Telefono", amount: 10, category: "bolletta", frequency: "mensile" },
  { name: "Netflix", amount: 14.99, category: "abbonamento", frequency: "mensile" },
  { name: "Spotify", amount: 10.99, category: "abbonamento", frequency: "mensile" },
  { name: "Disney+", amount: 8.99, category: "abbonamento", frequency: "mensile" },
  { name: "Amazon Prime", amount: 4.99, category: "abbonamento", frequency: "mensile" },
  { name: "Palestra", amount: 40, category: "tempo-libero", frequency: "mensile" },
  { name: "Spesa alimentari", amount: 350, category: "alimentari", frequency: "mensile" },
  { name: "Carburante", amount: 120, category: "trasporti", frequency: "mensile" },
  { name: "Assicurazione auto", amount: 480, category: "auto", frequency: "annuale" },
  { name: "Bollo auto", amount: 215, category: "auto", frequency: "annuale" },
];

export function FirstRunWizard() {
  const profile = useProfile();
  const expenses = useExpenses();
  const updateProfile = useUpdateProfile();
  const addBulk = useAddExpensesBulk();

  // Show only when profile not completed and no expenses yet
  const shouldShow =
    profile.isSuccess &&
    expenses.isSuccess &&
    !profile.data.completed &&
    expenses.data.length === 0;

  const [open, setOpen] = useState(true);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [salary, setSalary] = useState("");
  const [items, setItems] = useState<Array<Suggestion & { selected: boolean }>>(() =>
    SUGGESTIONS.map((s) => ({ ...s, selected: !!s.defaultOn })),
  );
  const [custom, setCustom] = useState<{ name: string; amount: string }>({ name: "", amount: "" });

  const totalSelected = useMemo(() => {
    return items
      .filter((s) => s.selected)
      .reduce((acc, s) => acc + (s.frequency === "annuale" ? s.amount / 12 : s.amount), 0);
  }, [items]);

  if (!shouldShow) return null;

  function updateItem(i: number, patch: Partial<Suggestion & { selected: boolean }>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }

  async function finish() {
    const sal = parseFloat(salary.replace(",", ".")) || 0;
    try {
      await updateProfile.mutateAsync({
        name: name.trim() || profile.data?.name || "",
        monthlySalary: sal,
        completed: true,
      });
      const toAdd = items
        .filter((s) => s.selected && s.amount > 0)
        .map((s) => ({
          name: s.name,
          amount: s.amount,
          category: s.category,
          frequency: s.frequency,
          dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        }));
      const cAmt = parseFloat(custom.amount.replace(",", "."));
      if (custom.name.trim() && !isNaN(cAmt) && cAmt > 0) {
        toAdd.push({
          name: custom.name.trim(),
          amount: cAmt,
          category: "altro",
          frequency: "mensile",
          dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        });
      }
      if (toAdd.length) await addBulk.mutateAsync(toAdd);
      toast.success("Tutto pronto!", { description: "Fluxa è configurato. Buon controllo!" });
      setOpen(false);
    } catch (err) {
      toast.error("Errore", { description: err instanceof Error ? err.message : "Riprova" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-xl p-0 overflow-hidden border-border [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="bg-gradient-to-br from-primary/20 via-primary/5 to-transparent px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-primary grid place-items-center">
              <Wallet className="size-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-semibold">Benvenuto in Fluxa</span>
          </div>
          <div className="mt-4 flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        </div>

        <div className="px-6 pb-6 pt-2 space-y-5 max-h-[70vh] overflow-y-auto">
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-xl font-semibold tracking-tight">Configuriamo Fluxa</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Parti da zero: i dati restano vuoti finché non decidi tu cosa inserire.
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Come ti chiami? (facoltativo)</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Lascia vuoto se vuoi" autoFocus />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Stipendio mensile netto (€) facoltativo</label>
                <Input inputMode="decimal" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="Lascia vuoto per ora" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-xl font-semibold tracking-tight inline-flex items-center gap-2">
                  <Sparkles className="size-5 text-primary" /> Suggerimenti di spese
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Ti consigliamo alcune spese comuni: attivale solo se ti servono e modifica liberamente gli importi.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {items.map((s, i) => (
                  <div
                    key={s.name}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 transition-colors"
                  >
                    <Checkbox
                      checked={s.selected}
                      onCheckedChange={(v) => updateItem(i, { selected: v === true })}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{s.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {s.frequency === "mensile" ? "Mensile" : "Annuale"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Input
                        inputMode="decimal"
                        value={String(s.amount)}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value.replace(",", "."));
                          updateItem(i, { amount: isNaN(v) ? 0 : v, selected: true });
                        }}
                        className="h-8 w-20 text-right text-sm"
                      />
                      <span className="text-xs text-muted-foreground">€</span>
                    </div>
                  </div>
                ))}
              </div>


              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-2">Aggiungi una spesa personalizzata (opzionale)</p>
                <div className="grid grid-cols-[1fr_120px] gap-2">
                  <Input value={custom.name} onChange={(e) => setCustom((c) => ({ ...c, name: e.target.value }))} placeholder="Es. Asilo" />
                  <Input inputMode="decimal" value={custom.amount} onChange={(e) => setCustom((c) => ({ ...c, amount: e.target.value }))} placeholder="€/mese" />
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-xs">
                Totale stimato:{" "}
                <span className="font-display font-semibold text-foreground">
                  {formatEuro(totalSelected)}/mese
                </span>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-xl font-semibold tracking-tight">Come funziona Fluxa</h2>
                <p className="text-sm text-muted-foreground mt-1">Ecco cosa puoi fare adesso.</p>
              </div>
              <ul className="space-y-3">
                <Feature icon={<Receipt className="size-4" />} title="Bollette & scadenze" desc="Tutte le scadenze ordinate per urgenza, con bollo auto e affitto." />
                <Feature icon={<Sparkles className="size-4" />} title="Coach IA" desc="Chiedi consigli sul risparmio. Gemini risponde in italiano." />
                <Feature icon={<Wallet className="size-4" />} title="Debiti & crediti" desc="Tieni traccia di soldi prestati o dovuti, anche con scadenza." />
              </ul>
              <p className="text-xs text-muted-foreground">
                🎁 Hai 1 mese di prova gratuita. Poi solo 2€/mese.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-1">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>Indietro</Button>
            ) : (
              <span className="text-xs text-muted-foreground">Modificabile in qualsiasi momento</span>
            )}
            {step < 2 ? (
              <Button onClick={() => setStep(step + 1)} className="gap-2">
                Continua <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button onClick={finish} disabled={updateProfile.isPending || addBulk.isPending} className="gap-2">
                {updateProfile.isPending || addBulk.isPending ? "Salvataggio…" : <>Inizia <CheckCircle2 className="size-4" /></>}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <li className="flex gap-3">
      <div className="size-8 rounded-lg bg-primary/15 text-primary grid place-items-center shrink-0">{icon}</div>
      <div>
        <p className="font-display font-semibold text-sm">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
      </div>
    </li>
  );
}
