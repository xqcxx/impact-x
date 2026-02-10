import { useTheme } from "../contexts/ThemeContext";
import { useEffect } from "react";
import { Moon, Sun } from "lucide-react";

export function DarkModeToggle() {
  const { theme, toggleTheme } = useTheme();

  // Keyboard shortcut: Cmd/Ctrl+Shift+L
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "L") {
        e.preventDefault();
        toggleTheme();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleTheme]);

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-secondary-100 dark:bg-dark-700 text-secondary-700 dark:text-dark-300 hover:bg-secondary-200 dark:hover:bg-dark-600 transition-colors"
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      title="Toggle theme (⌘/Ctrl+Shift+L)"
    >
      {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
    </button>
  );
}
