import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownCircle, ArrowUpCircle, Check, Trash2 } from "lucide-react";

import { useDebts, useRemoveDebt, useToggleDebt } from "@/lib/data";
import { AddDebtDialog } from "@/components/add-debt-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatEuro, daysUntil } from "@/lib/insights";
import { toast } from "sonner";

export const Route = createFileRoute("/debiti-crediti")({
  head: () => ({
    meta: [
      { title: "Debiti & Crediti — Fluxa" },
      { name: "description", content: "Tieni traccia dei soldi che devi e che ti devono, con eventuali scadenze." },
    ],
  }),
  component: DebtCreditPage,
});

function DebtCreditPage() {
  const debtsQ = useDebts();
  const toggle = useToggleDebt();
  const remove = useRemoveDebt();
  const items = debtsQ.data ?? [];
  const active = items.filter((d) => !d.settled);
  const settled = items.filter((d) => d.settled);

  const totalDebt = active.filter((d) => d.kind === "debt").reduce((a, b) => a + b.amount, 0);
  const totalCredit = active.filter((d) => d.kind === "credit").reduce((a, b) => a + b.amount, 0);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Debiti & Crediti</h1>
          <p className="text-muted-foreground mt-1">Soldi prestati o dovuti, con scadenza opzionale.</p>
        </div>
        <AddDebtDialog />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SummaryCard icon={<ArrowUpCircle className="size-4" />} label="Devo io" value={totalDebt} tone="warn" />
        <SummaryCard icon={<ArrowDownCircle className="size-4" />} label="Mi devono" value={totalCredit} tone="good" />
      </div>

      <Section title="Aperti">
        {active.length === 0 ? (
          <Empty />
        ) : (
          <div className="bg-surface ring-card rounded-2xl overflow-hidden">
            {active.map((d, i) => (
              <Row
                key={d.id}
                item={d}
                divider={i !== active.length - 1}
                onSettle={async () => { await toggle.mutateAsync({ id: d.id, settled: true }); toast.success("Segnato come saldato"); }}
                onRemove={async () => { await remove.mutateAsync(d.id); toast.success("Rimosso"); }}
              />
            ))}
          </div>
        )}
      </Section>

      {settled.length > 0 && (
        <Section title="Saldati">
          <div className="bg-surface/50 ring-card rounded-2xl overflow-hidden opacity-70">
            {settled.map((d, i) => (
              <Row
                key={d.id}
                item={d}
                divider={i !== settled.length - 1}
                onSettle={async () => { await toggle.mutateAsync({ id: d.id, settled: false }); }}
                onRemove={async () => { await remove.mutateAsync(d.id); }}
              />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Empty() {
  return (
    <div className="bg-surface ring-card rounded-2xl p-12 text-center text-muted-foreground text-sm">
      Nessun debito o credito. Aggiungi il primo per tenere tutto in chiaro.
    </div>
  );
}

function SummaryCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "warn" | "good" }) {
  return (
    <div className="bg-surface ring-card rounded-2xl p-5">
      <div className={`flex items-center gap-2 text-xs font-medium ${tone === "warn" ? "text-warning" : "text-success"}`}>
        {icon} {label}
      </div>
      <p className="font-display text-2xl font-semibold mt-2">{formatEuro(value)}</p>
    </div>
  );
}

function Row({ item, divider, onSettle, onRemove }: {
  item: { id: string; kind: "debt" | "credit"; counterparty: string; amount: number; dueDate: string | null; note?: string | null; settled: boolean };
  divider: boolean;
  onSettle: () => void;
  onRemove: () => void;
}) {
  const days = item.dueDate ? daysUntil(item.dueDate) : null;
  const isDebt = item.kind === "debt";
  return (
    <div className={`flex items-center gap-4 p-4 md:p-5 ${divider ? "border-b border-border" : ""}`}>
      <div className={`size-10 rounded-full grid place-items-center ${isDebt ? "bg-warning/15 text-warning" : "bg-success/15 text-success"}`}>
        {isDebt ? <ArrowUpCircle className="size-5" /> : <ArrowDownCircle className="size-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-display font-semibold truncate">{item.counterparty}</p>
          <Badge variant="outline" className="text-[10px]">{isDebt ? "Devo io" : "Mi deve"}</Badge>
          {item.dueDate && days !== null && !item.settled && (
            <Badge variant={days <= 5 ? "destructive" : "secondary"} className="text-[10px]">fra {days}gg</Badge>
          )}
        </div>
        {item.note && <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.note}</p>}
      </div>
      <p className={`font-display text-lg font-semibold ${isDebt ? "text-warning" : "text-success"}`}>
        {formatEuro(item.amount)}
      </p>
      {!item.settled && (
        <Button variant="ghost" size="icon" onClick={onSettle} aria-label="Saldato"><Check className="size-4" /></Button>
      )}
      <Button variant="ghost" size="icon" onClick={onRemove} aria-label="Rimuovi"><Trash2 className="size-4 text-muted-foreground" /></Button>
    </div>
  );
}
