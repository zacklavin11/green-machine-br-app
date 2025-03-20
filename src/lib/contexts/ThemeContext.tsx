"use client";

import React, { createContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    setMounted(true);
    
    if (typeof window !== "undefined") {
      try {
        const savedTheme = localStorage.getItem("theme") as Theme;
        const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        
        if (savedTheme) {
          setTheme(savedTheme);
        } else if (systemPrefersDark) {
          setTheme("dark");
        }
      } catch (error) {
        console.error("Error getting theme preference:", error);
      }
    }
  }, []);

  // Update HTML class when theme changes
  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    
    try {
      const root = window.document.documentElement;
      
      // Remove previous theme class
      root.classList.remove("light", "dark");
      
      // Add current theme class
      root.classList.add(theme);
      
      // Save to localStorage
      localStorage.setItem("theme", theme);
    } catch (error) {
      console.error("Error applying theme:", error);
    }
  }, [theme, mounted]);

  // Toggle between light and dark
  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export { ThemeContext }; 