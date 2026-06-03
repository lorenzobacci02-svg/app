import { useState } from "react";
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
import { useAddDebt } from "@/lib/data";

export function AddDebtDialog({ defaultKind = "debt" }: { defaultKind?: "debt" | "credit" }) {
  const add = useAddDebt();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"debt" | "credit">(defaultKind);
  const [counterparty, setCounterparty] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount.replace(",", "."));
    if (!counterparty.trim() || isNaN(amt) || amt <= 0) {
      toast.error("Inserisci nome e importo validi");
      return;
    }
    try {
      await add.mutateAsync({
        kind,
        counterparty: counterparty.trim(),
        amount: amt,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        note: note.trim() || null,
      });
      toast.success(kind === "debt" ? "Debito aggiunto" : "Credito aggiunto");
      setCounterparty("");
      setAmount("");
      setDueDate("");
      setNote("");
      setOpen(false);
    } catch (err) {
      toast.error("Errore", { description: err instanceof Error ? err.message : "Riprova" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5"><Plus className="size-4" /> Nuovo</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Debito o credito</DialogTitle>
          <DialogDescription>Tieni traccia di soldi prestati o dovuti.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as "debt" | "credit")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="debt">Devo io</SelectItem>
                  <SelectItem value="credit">Mi devono</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amt">Importo (€)</Label>
              <Input id="amt" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp">{kind === "debt" ? "A chi devi" : "Chi ti deve"}</Label>
            <Input id="cp" value={counterparty} onChange={(e) => setCounterparty(e.target.value)} placeholder="Nome o azienda" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="due">Scadenza (opzionale)</Label>
              <Input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note">Nota</Label>
              <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Es. cena" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={add.isPending} className="w-full">
              {add.isPending ? "Salvataggio…" : "Salva"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
