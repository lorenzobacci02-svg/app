import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Category, DebtCredit, Expense, Frequency, Profile } from "@/lib/store";

const emptyProfile: Profile = {
  name: "",
  email: "",
  monthlySalary: 0,
  fixedCosts: 0,
  savingsGoal: "",
  riskTolerance: "",
  completed: false,
};

function rowToExpense(r: {
  id: string;
  name: string;
  amount: number | string;
  category: string;
  frequency: string;
  due_date: string;
  note: string | null;
  created_at: string;
}): Expense {
  return {
    id: r.id,
    name: r.name,
    amount: Number(r.amount),
    category: r.category as Category,
    frequency: r.frequency as Frequency,
    dueDate: r.due_date,
    note: r.note ?? undefined,
    createdAt: r.created_at,
  };
}

function rowToProfile(r: {
  user_id: string;
  name: string;
  email: string;
  monthly_salary: number | string;
  fixed_costs: number | string;
  savings_goal: string;
  risk_tolerance: string;
  completed: boolean;
  trial_started_at: string;
  is_paid: boolean;
}): Profile {
  return {
    user_id: r.user_id,
    name: r.name,
    email: r.email,
    monthlySalary: Number(r.monthly_salary),
    fixedCosts: Number(r.fixed_costs),
    savingsGoal: (r.savings_goal as Profile["savingsGoal"]) || "",
    riskTolerance: (r.risk_tolerance as Profile["riskTolerance"]) || "",
    completed: r.completed,
    trialStartedAt: r.trial_started_at,
    isPaid: r.is_paid,
  };
}

function rowToDebt(r: {
  id: string;
  kind: string;
  counterparty: string;
  amount: number | string;
  due_date: string | null;
  note: string | null;
  settled: boolean;
  created_at: string;
}): DebtCredit {
  return {
    id: r.id,
    kind: r.kind as "debt" | "credit",
    counterparty: r.counterparty,
    amount: Number(r.amount),
    dueDate: r.due_date,
    note: r.note,
    settled: r.settled,
    createdAt: r.created_at,
  };
}

export function useExpenses() {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: ["expenses", user?.id],
    queryFn: async (): Promise<Expense[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("due_date", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(rowToExpense);
    },
    enabled: !loading && !!user,
  });
}

export function useProfile() {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async (): Promise<Profile> => {
      if (!user) return emptyProfile;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return { ...emptyProfile, email: user.email ?? "" };
      return rowToProfile(data);
    },
    enabled: !loading && !!user,
  });
}

export function useDebts() {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: ["debts", user?.id],
    queryFn: async (): Promise<DebtCredit[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("debts_credits")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(rowToDebt);
    },
    enabled: !loading && !!user,
  });
}

export function useAddExpense() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (e: Omit<Expense, "id" | "createdAt">) => {
      if (!user) throw new Error("Non autenticato");
      const { error } = await supabase.from("expenses").insert({
        user_id: user.id,
        name: e.name,
        amount: e.amount,
        category: e.category,
        frequency: e.frequency,
        due_date: e.dueDate,
        note: e.note ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });
}

export function useAddExpensesBulk() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (items: Omit<Expense, "id" | "createdAt">[]) => {
      if (!user) throw new Error("Non autenticato");
      const rows = items.map((e) => ({
        user_id: user.id,
        name: e.name,
        amount: e.amount,
        category: e.category,
        frequency: e.frequency,
        due_date: e.dueDate,
        note: e.note ?? null,
      }));
      const { error } = await supabase.from("expenses").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });
}

export function useRemoveExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (p: Partial<Profile>) => {
      if (!user) throw new Error("Non autenticato");
      const row: {
        name?: string;
        email?: string;
        monthly_salary?: number;
        fixed_costs?: number;
        savings_goal?: string;
        risk_tolerance?: string;
        completed?: boolean;
      } = {};
      if (p.name !== undefined) row.name = p.name;
      if (p.email !== undefined) row.email = p.email;
      if (p.monthlySalary !== undefined) row.monthly_salary = p.monthlySalary;
      if (p.fixedCosts !== undefined) row.fixed_costs = p.fixedCosts;
      if (p.savingsGoal !== undefined) row.savings_goal = p.savingsGoal;
      if (p.riskTolerance !== undefined) row.risk_tolerance = p.riskTolerance;
      if (p.completed !== undefined) row.completed = p.completed;
      const { error } = await supabase
        .from("profiles")
        .update(row)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Omit<Expense, "id" | "createdAt">> }) => {
      const row: {
        name?: string;
        amount?: number;
        category?: string;
        frequency?: string;
        due_date?: string;
        note?: string | null;
      } = {};
      if (patch.name !== undefined) row.name = patch.name;
      if (patch.amount !== undefined) row.amount = patch.amount;
      if (patch.category !== undefined) row.category = patch.category;
      if (patch.frequency !== undefined) row.frequency = patch.frequency;
      if (patch.dueDate !== undefined) row.due_date = patch.dueDate;
      if (patch.note !== undefined) row.note = patch.note ?? null;
      const { error } = await supabase.from("expenses").update(row).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });
}

export function useAddDebt() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (d: Omit<DebtCredit, "id" | "createdAt" | "settled">) => {
      if (!user) throw new Error("Non autenticato");
      const { error } = await supabase.from("debts_credits").insert({
        user_id: user.id,
        kind: d.kind,
        counterparty: d.counterparty,
        amount: d.amount,
        due_date: d.dueDate,
        note: d.note ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["debts"] }),
  });
}

export function useToggleDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, settled }: { id: string; settled: boolean }) => {
      const { error } = await supabase
        .from("debts_credits")
        .update({ settled })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["debts"] }),
  });
}

export function useRemoveDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("debts_credits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["debts"] }),
  });
}
