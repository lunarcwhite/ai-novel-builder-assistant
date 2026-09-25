"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("novel-builder-theme");
    if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("novel-builder-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("novel-builder-theme", "light");
    }
  };

  if (!mounted) {
    return (
      <button
        type="button"
        className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        aria-label="Ganti mode tampilan"
        disabled
      >
        <Sun className="w-4 h-4 opacity-50" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      aria-label={`Ganti ke mode ${theme === "light" ? "gelap" : "terang"}`}
      title={`Mode saat ini: ${theme === "light" ? "Terang" : "Gelap"} (Klik untuk beralih)`}
    >
      {theme === "light" ? (
        <Moon className="w-4 h-4" />
      ) : (
        <Sun className="w-4 h-4" />
      )}
      <span className="sr-only">
        Ganti ke mode {theme === "light" ? "gelap" : "terang"}
      </span>
    </button>
  );
}
