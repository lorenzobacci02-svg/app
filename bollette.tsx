import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Trash2 } from "lucide-react";

import { categoryLabel, frequencyLabel } from "@/lib/store";
import { daysUntil, formatEuro } from "@/lib/insights";
import { Button } from "@/components/ui/button";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useExpenses, useRemoveExpense } from "@/lib/data";


export const Route = createFileRoute("/bollette")({
  head: () => ({
    meta: [
      { title: "Bollette & Spese — Fluxa" },
      { name: "description", content: "Tutte le tue bollette, bollo auto e spese ricorrenti con scadenze." },
    ],
  }),
  component: Bollette,
});

function Bollette() {
  const expensesQ = useExpenses();
  const remove = useRemoveExpense();

  // Esclude alimentari/salute/trasporti (gestite in spese quotidiane) e abbonamenti
  const dailyCats = new Set(["alimentari", "salute", "trasporti", "abbonamento"]);
  const items = (expensesQ.data ?? []).filter((e) => !dailyCats.has(e.category));
  const sorted = [...items].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto w-full space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Bollette & Scadenze</h1>
          <p className="text-muted-foreground mt-1">Bollette, affitto, bollo auto. Ordinate per scadenza.</p>
        </div>
        <AddExpenseDialog defaultCategory="bolletta" />
      </div>

      <div className="bg-surface ring-card rounded-2xl overflow-hidden">
        {sorted.length === 0 && (
          <div className="p-12 text-center text-muted-foreground text-sm">Nessuna scadenza registrata.</div>
        )}
        {sorted.map((e, i) => {
          const days = daysUntil(e.dueDate);
          const tone = days <= 5 ? "destructive" : days <= 14 ? "secondary" : "outline";
          return (
            <div key={e.id} className={`flex items-center gap-4 p-4 md:p-5 ${i !== sorted.length - 1 ? "border-b border-border" : ""}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-display font-semibold truncate">{e.name}</p>
                  <Badge variant="outline" className="text-[10px]">{categoryLabel[e.category]}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{frequencyLabel[e.frequency]}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Scade il {new Date(e.dueDate).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-lg font-semibold">{formatEuro(e.amount)}</p>
                <Badge variant={tone as never} className="text-[10px] mt-1">fra {days}gg</Badge>
              </div>
              <AddExpenseDialog
                expense={e}
                trigger={
                  <Button variant="ghost" size="icon" aria-label="Modifica">
                    <Pencil className="size-4 text-muted-foreground" />
                  </Button>
                }
              />
              <Button variant="ghost" size="icon" onClick={async () => { await remove.mutateAsync(e.id); toast.success("Rimosso"); }} aria-label="Rimuovi">
                <Trash2 className="size-4 text-muted-foreground" />
              </Button>

            </div>
          );
        })}
      </div>
    </div>
  );
}
