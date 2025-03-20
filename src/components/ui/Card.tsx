"use client";

import React, { ReactNode } from "react";
import { motion } from "framer-motion";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  padding?: "none" | "small" | "medium" | "large";
}

export default function Card({
  children,
  className = "",
  hover = false,
  clickable = false,
  onClick,
  padding = "medium",
}: CardProps) {
  const paddingStyles = {
    none: "",
    small: "p-3",
    medium: "p-4 sm:p-6",
    large: "p-6 sm:p-8",
  };

  const hoverClass = hover ? "hover:shadow-lg transition-all" : "";
  const clickableClass = clickable ? "cursor-pointer" : "";
  
  const baseClasses = "bg-white dark:bg-[var(--apple-gray-900)] rounded-2xl shadow-sm border border-[var(--apple-gray-100)] dark:border-[var(--apple-gray-700)]";

  return (
    <motion.div
      className={`${baseClasses} ${paddingStyles[padding]} ${hoverClass} ${clickableClass} ${className}`}
      onClick={onClick}
      whileHover={hover ? { y: -4, scale: 1.01 } : {}}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
} 