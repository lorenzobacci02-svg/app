import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Category =
  | "bolletta"
  | "abbonamento"
  | "auto"
  | "casa"
  | "alimentari"
  | "salute"
  | "tempo-libero"
  | "trasporti"
  | "altro";

export type Frequency = "una-tantum" | "mensile" | "annuale";

export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: Category;
  frequency: Frequency;
  dueDate: string;
  note?: string;
  createdAt: string;
}

export interface Profile {
  user_id?: string;
  name: string;
  email: string;
  monthlySalary: number;
  fixedCosts: number;
  savingsGoal: "casa" | "investimenti" | "viaggi" | "emergenza" | "";
  riskTolerance: "bassa" | "media" | "alta" | "";
  completed: boolean;
  trialStartedAt?: string;
  isPaid?: boolean;
}

export interface DebtCredit {
  id: string;
  kind: "debt" | "credit";
  counterparty: string;
  amount: number;
  dueDate: string | null;
  note?: string | null;
  settled: boolean;
  createdAt: string;
}

export type Theme = "light" | "dark";

interface UiState {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      theme: "dark",
      setTheme: (t) => set({ theme: t }),
    }),
    { name: "fluxa-ui" },
  ),
);

export const categoryLabel: Record<Category, string> = {
  bolletta: "Bolletta",
  abbonamento: "Abbonamento",
  auto: "Auto & Bollo",
  casa: "Casa & Affitto",
  alimentari: "Alimentari",
  salute: "Salute",
  "tempo-libero": "Tempo libero",
  trasporti: "Trasporti",
  altro: "Altro",
};

export const frequencyLabel: Record<Frequency, string> = {
  "una-tantum": "Una tantum",
  mensile: "Mensile",
  annuale: "Annuale",
};
