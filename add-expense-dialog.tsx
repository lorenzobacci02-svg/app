import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  type Category,
  type Expense,
  type Frequency,
  categoryLabel,
  frequencyLabel,
} from "@/lib/store";
import { useAddExpense, useUpdateExpense } from "@/lib/data";

interface Props {
  defaultCategory?: Category;
  trigger?: React.ReactNode;
  expense?: Expense;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
}

export function AddExpenseDialog({ defaultCategory, trigger, expense, open: openProp, onOpenChange }: Props) {
  const add = useAddExpense();
  const update = useUpdateExpense();
  const isEdit = !!expense;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [name, setName] = useState(expense?.name ?? "");
  const [amount, setAmount] = useState(expense ? String(expense.amount) : "");
  const [category, setCategory] = useState<Category>(expense?.category ?? defaultCategory ?? "bolletta");
  const [frequency, setFrequency] = useState<Frequency>(expense?.frequency ?? "mensile");
  const [dueDate, setDueDate] = useState(
    (expense?.dueDate ?? new Date(Date.now() + 7 * 86400000).toISOString()).slice(0, 10),
  );

  useEffect(() => {
    if (open && expense) {
      setName(expense.name);
      setAmount(String(expense.amount));
      setCategory(expense.category);
      setFrequency(expense.frequency);
      setDueDate(expense.dueDate.slice(0, 10));
    }
  }, [open, expense]);

  function reset() {
    setName("");
    setAmount("");
    setCategory(defaultCategory ?? "bolletta");
    setFrequency("mensile");
    setDueDate(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount.replace(",", "."));
    if (!name.trim() || isNaN(amt) || amt <= 0) {
      toast.error("Inserisci nome e importo validi");
      return;
    }
    try {
      if (isEdit && expense) {
        await update.mutateAsync({
          id: expense.id,
          patch: {
            name: name.trim(),
            amount: amt,
            category,
            frequency,
            dueDate: new Date(dueDate).toISOString(),
          },
        });
        toast.success("Spesa aggiornata");
      } else {
        await add.mutateAsync({
          name: name.trim(),
          amount: amt,
          category,
          frequency,
          dueDate: new Date(dueDate).toISOString(),
        });
        toast.success("Spesa aggiunta", { description: `${name} — ${amt.toFixed(2)}€` });
        reset();
      }
      setOpen(false);
    } catch (err) {
      toast.error("Errore", { description: err instanceof Error ? err.message : "Riprova" });
    }
  }

  const pending = add.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" /> Aggiungi spesa
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{isEdit ? "Modifica spesa" : "Nuova spesa"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Aggiorna i dettagli di questa voce." : "Inserisci una bolletta, un abbonamento o qualunque costo."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Bolletta gas" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Importo (€)</Label>
              <Input id="amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="due">Scadenza</Label>
              <Input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(categoryLabel) as Category[]).map((c) => (
                    <SelectItem key={c} value={c}>{categoryLabel[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Frequenza</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(frequencyLabel) as Frequency[]).map((f) => (
                    <SelectItem key={f} value={f}>{frequencyLabel[f]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Salvataggio…" : isEdit ? "Salva modifiche" : "Salva spesa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
