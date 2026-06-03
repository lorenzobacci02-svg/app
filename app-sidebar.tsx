import { Link, useRouterState } from "@tanstack/react-router";
import {
  Coins,
  LayoutDashboard,
  LogOut,
  Receipt,
  Repeat,
  ShoppingBag,
  Sparkles,
  Wallet,
  Crown,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useExpenses, useProfile } from "@/lib/data";
import { formatEuro, totalMonthly } from "@/lib/insights";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Bollette & Scadenze", url: "/bollette", icon: Receipt },
  { title: "Abbonamenti", url: "/abbonamenti", icon: Repeat },
  { title: "Spese quotidiane", url: "/spese-quotidiane", icon: ShoppingBag },
  { title: "Debiti & Crediti", url: "/debiti-crediti", icon: Coins },
  { title: "Coach IA", url: "/coach", icon: Sparkles },
  { title: "Abbonamento Fluxa", url: "/piano", icon: Crown },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const expenses = useExpenses();
  const profile = useProfile();
  const { signOut, user } = useAuth();
  const monthly = totalMonthly(expenses.data ?? []);

  async function logout() {
    await signOut();
    toast.success("Disconnesso");
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="size-8 rounded-lg bg-primary grid place-items-center glow-indigo">
            <Wallet className="size-4 text-primary-foreground" />
          </div>
          <div className="font-display text-lg font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
            Fluxa
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="space-y-2">
        <div className="p-3 rounded-xl bg-surface-elevated/40 border border-primary/20 group-data-[collapsible=icon]:hidden">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
            Spesa mensile
          </p>
          <p className="font-display text-lg font-semibold">{formatEuro(monthly)}</p>
        </div>
        <div className="px-2 group-data-[collapsible=icon]:hidden">
          <p className="text-xs font-medium truncate">{profile.data?.name || user?.email}</p>
          <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          aria-label="Esci dall'account"
          className="justify-start gap-2 w-full text-muted-foreground hover:text-foreground"
        >
          <LogOut className="size-4" />
          <span className="group-data-[collapsible=icon]:hidden">Esci dall'account</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
