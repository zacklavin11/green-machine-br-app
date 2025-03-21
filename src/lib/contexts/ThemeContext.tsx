"use client";

import React, { createContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";
type ColorTheme = "green" | "blue" | "red" | "yellow";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  colorTheme: ColorTheme;
  setColorTheme: (colorTheme: ColorTheme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
  colorTheme: "green",
  setColorTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [colorTheme, setColorTheme] = useState<ColorTheme>("green");
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    setMounted(true);
    
    if (typeof window !== "undefined") {
      try {
        const savedTheme = localStorage.getItem("theme") as Theme;
        const savedColorTheme = localStorage.getItem("colorTheme") as ColorTheme;
        const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        
        if (savedTheme) {
          setTheme(savedTheme);
        } else if (systemPrefersDark) {
          setTheme("dark");
        }
        
        if (savedColorTheme) {
          setColorTheme(savedColorTheme);
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
  
  // Update color theme CSS variable when color theme changes
  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    
    try {
      const root = window.document.documentElement;
      
      // Set the appropriate color based on the theme
      let themeColor = '#39e991'; // Default to green

      // For reports section, we'll use the selected theme color
      // but for the rest of the app, we'll use green
      let reportsThemeColor = themeColor;
      
      if (colorTheme === 'green') {
        reportsThemeColor = '#39e991'; // Original green
      } else if (colorTheme === 'blue') {
        reportsThemeColor = '#3B82F6'; // A nice blue
      } else if (colorTheme === 'red') {
        reportsThemeColor = '#EF4444'; // A nice red
      } else if (colorTheme === 'yellow') {
        reportsThemeColor = '#F59E0B'; // A nice yellow/amber
      }
      
      // Update the CSS variables
      root.style.setProperty('--theme-color', themeColor); // Main app theme stays green
      root.style.setProperty('--reports-theme-color', reportsThemeColor); // Reports section uses selected theme
      
      // Save to localStorage
      localStorage.setItem("colorTheme", colorTheme);
    } catch (error) {
      console.error("Error applying color theme:", error);
    }
  }, [colorTheme, mounted]);

  // Toggle between light and dark
  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
    colorTheme,
    setColorTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export { ThemeContext }; 