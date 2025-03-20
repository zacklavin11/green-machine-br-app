"use client";

import React from "react";
import { motion } from "framer-motion";

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label?: string;
  description?: string;
  size?: "sm" | "md" | "lg";
}

export default function Toggle({
  enabled,
  onChange,
  label,
  description,
  size = "md",
}: ToggleProps) {
  const handleClick = () => {
    onChange(!enabled);
  };

  const sizes = {
    sm: {
      switch: "w-8 h-4",
      circle: "h-3 w-3",
      translate: "translate-x-4",
    },
    md: {
      switch: "w-11 h-6",
      circle: "h-5 w-5",
      translate: "translate-x-5",
    },
    lg: {
      switch: "w-14 h-7",
      circle: "h-6 w-6",
      translate: "translate-x-7",
    },
  };

  return (
    <div className="flex items-center mb-4">
      <button
        type="button"
        onClick={handleClick}
        className={`
          ${enabled ? "bg-[var(--green-primary)]" : "bg-[var(--apple-gray-200)] dark:bg-[var(--apple-gray-700)]"} 
          relative inline-flex flex-shrink-0 
          ${sizes[size].switch} 
          rounded-full border-2 border-transparent 
          cursor-pointer transition-all ease-out duration-200 
          focus:outline-none focus:ring-2 focus:ring-[var(--green-primary)] focus:ring-offset-2
        `}
        role="switch"
        aria-checked={enabled}
      >
        <span className="sr-only">Toggle</span>
        <motion.span
          animate={{ x: enabled ? parseInt(sizes[size].translate.split("-x-")[1]) : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={`
            ${enabled ? "translate-x-5" : "translate-x-0"} 
            pointer-events-none inline-block 
            ${sizes[size].circle} 
            rounded-full bg-white shadow-sm
            transform ring-0 transition ease-out duration-200
          `}
        />
      </button>
      {(label || description) && (
        <div className="ml-3">
          {label && (
            <div className="text-sm font-medium text-[var(--apple-gray-900)] dark:text-white">
              {label}
            </div>
          )}
          {description && (
            <div className="text-sm text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)]">
              {description}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 