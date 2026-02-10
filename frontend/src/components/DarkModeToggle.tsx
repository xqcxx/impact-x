import { useTheme } from "../contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";

export function DarkModeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-secondary-100 dark:bg-dark-700 text-secondary-700 dark:text-dark-300 hover:bg-secondary-200 dark:hover:bg-dark-600 transition-colors"
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
    </button>
  );
}
