import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Trash2 } from "lucide-react";

import { frequencyLabel } from "@/lib/store";
import { formatEuro, monthlyEquivalent } from "@/lib/insights";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useExpenses, useRemoveExpense } from "@/lib/data";

export const Route = createFileRoute("/abbonamenti")({
  head: () => ({
    meta: [
      { title: "Abbonamenti — Fluxa" },
      { name: "description", content: "Tutti i tuoi abbonamenti ricorrenti con costo mensile e annuale." },
    ],
  }),
  component: Abbonamenti,
});

const palette = [
  "oklch(0.55 0.22 274)",
  "oklch(0.62 0.22 25)",
  "oklch(0.7 0.18 155)",
  "oklch(0.65 0.2 220)",
  "oklch(0.7 0.18 60)",
  "oklch(0.62 0.22 320)",
];

function Abbonamenti() {
  const expensesQ = useExpenses();
  const remove = useRemoveExpense();
  const subs = (expensesQ.data ?? []).filter((e) => e.category === "abbonamento");
  const monthlyTotal = subs.reduce((a, b) => a + monthlyEquivalent(b), 0);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto w-full space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Abbonamenti</h1>
          <p className="text-muted-foreground mt-1">
            {subs.length} attivi · {formatEuro(monthlyTotal)}/mese · {formatEuro(monthlyTotal * 12)}/anno
          </p>
        </div>
        <AddExpenseDialog defaultCategory="abbonamento" />
      </div>

      {subs.length === 0 ? (
        <div className="bg-surface ring-card rounded-2xl p-12 text-center text-muted-foreground text-sm">
          Nessun abbonamento registrato.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {subs.map((s, i) => {
            const color = palette[i % palette.length];
            return (
              <div key={s.id} className="bg-surface ring-card p-5 rounded-2xl flex flex-col gap-4 hover:border-primary/30 transition-colors group">
                <div className="flex items-start justify-between">
                  <div className="size-11 rounded-xl grid place-items-center font-display font-bold text-base" style={{ background: `color-mix(in oklab, ${color} 15%, transparent)`, color }}>
                    {s.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <AddExpenseDialog
                      expense={s}
                      trigger={
                        <Button size="icon" variant="ghost" aria-label="Modifica">
                          <Pencil className="size-3.5 text-muted-foreground" />
                        </Button>
                      }
                    />
                    <Button size="icon" variant="ghost" onClick={async () => { await remove.mutateAsync(s.id); toast.success("Rimosso"); }} aria-label="Rimuovi">
                      <Trash2 className="size-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="font-display font-semibold truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{frequencyLabel[s.frequency]}</p>
                </div>
                <div className="mt-auto">
                  <p className="font-display text-lg font-semibold">{formatEuro(s.amount)}</p>
                  {s.frequency === "annuale" && (
                    <p className="text-[10px] text-muted-foreground">≈ {formatEuro(s.amount / 12)}/mese</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
