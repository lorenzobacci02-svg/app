import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Trash2, ShoppingBag, Pill, Bus } from "lucide-react";

import { categoryLabel, type Category } from "@/lib/store";
import { formatEuro, monthlyEquivalent } from "@/lib/insights";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useExpenses, useRemoveExpense } from "@/lib/data";

export const Route = createFileRoute("/spese-quotidiane")({
  head: () => ({
    meta: [
      { title: "Spese quotidiane — Fluxa" },
      { name: "description", content: "Spesa al supermercato, medicinali e trasporti: tutte le tue spese di tutti i giorni." },
    ],
  }),
  component: Spese,
});

const dailyCats: Category[] = ["alimentari", "salute", "trasporti"];

const groups = [
  { cat: "alimentari" as Category, label: "Alimentari", icon: ShoppingBag, defaultCat: "alimentari" as Category },
  { cat: "salute" as Category, label: "Salute & Medicinali", icon: Pill, defaultCat: "salute" as Category },
  { cat: "trasporti" as Category, label: "Trasporti", icon: Bus, defaultCat: "trasporti" as Category },
];

function Spese() {
  const expensesQ = useExpenses();
  const remove = useRemoveExpense();
  const items = (expensesQ.data ?? []).filter((e) => dailyCats.includes(e.category));
  const monthly = items.reduce((a, b) => a + monthlyEquivalent(b), 0);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto w-full space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Spese quotidiane</h1>
          <p className="text-muted-foreground mt-1">
            Spesa, medicinali, trasporti · {formatEuro(monthly)}/mese
          </p>
        </div>
        <AddExpenseDialog defaultCategory="alimentari" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {groups.map((g) => {
          const list = items.filter((i) => i.category === g.cat);
          const total = list.reduce((a, b) => a + monthlyEquivalent(b), 0);
          return (
            <div key={g.cat} className="bg-surface ring-card rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-9 rounded-lg bg-primary/15 text-primary grid place-items-center">
                    <g.icon className="size-4" />
                  </div>
                  <p className="font-display font-semibold">{g.label}</p>
                </div>
                <p className="font-display text-sm font-semibold">{formatEuro(total)}</p>
              </div>
              <div className="space-y-1.5">
                {list.length === 0 && (
                  <p className="text-xs text-muted-foreground">Nessuna voce.</p>
                )}
                {list.map((e) => (
                  <div key={e.id} className="flex items-center gap-2 text-sm py-1.5 border-b border-border/50 last:border-0">
                    <span className="flex-1 truncate">{e.name}</span>
                    <span className="font-medium">{formatEuro(e.amount)}</span>
                    <AddExpenseDialog
                      expense={e}
                      trigger={
                        <Button size="icon" variant="ghost" className="size-7" aria-label="Modifica">
                          <Pencil className="size-3 text-muted-foreground" />
                        </Button>
                      }
                    />
                    <Button size="icon" variant="ghost" className="size-7" onClick={async () => { await remove.mutateAsync(e.id); toast.success("Rimosso"); }} aria-label="Rimuovi">
                      <Trash2 className="size-3 text-muted-foreground" />
                    </Button>
                  </div>
                ))}

              </div>
              <AddExpenseDialog
                defaultCategory={g.defaultCat}
                trigger={
                  <Button variant="ghost" size="sm" className="w-full">
                    + Aggiungi {categoryLabel[g.cat].toLowerCase()}
                  </Button>
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
