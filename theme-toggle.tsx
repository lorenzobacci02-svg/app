import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUi } from "@/lib/store";

export function ThemeToggle() {
  const theme = useUi((s) => s.theme);
  const setTheme = useUi((s) => s.setTheme);
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Cambia tema"
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
