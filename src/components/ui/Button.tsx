"use client";

import React, { ReactNode, ButtonHTMLAttributes } from "react";
import { motion } from "framer-motion";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  fullWidth = false,
  icon,
  iconPosition = "left",
  className = "",
  disabled,
  ...rest
}: ButtonProps) {
  // Variant styles
  const variantStyles = {
    primary: "bg-[var(--green-primary)] hover:brightness-95 text-[var(--apple-gray-900)] border border-transparent font-medium shadow-sm",
    secondary: "bg-[var(--apple-gray-100)] hover:bg-[var(--apple-gray-200)] text-[var(--apple-gray-900)] dark:bg-[var(--apple-gray-700)] dark:hover:bg-[var(--apple-gray-500)] dark:text-white border border-transparent",
    outline: "bg-transparent hover:bg-[var(--apple-gray-50)] text-[var(--green-primary)] hover:text-[var(--green-primary)]/90 border border-[var(--green-primary)] dark:text-[var(--green-primary)] dark:border-[var(--green-primary)] dark:hover:bg-[var(--apple-gray-800)]",
    danger: "bg-red-500 hover:brightness-95 text-white border border-transparent font-medium shadow-sm",
  };

  // Size styles
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  };

  const baseClasses = "font-medium rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--green-primary)] inline-flex items-center justify-center";
  const widthClass = fullWidth ? "w-full" : "";
  const disabledClass = (disabled || isLoading) ? "opacity-60 cursor-not-allowed" : "";
  
  const buttonContent = (
    <>
      {isLoading && (
        <svg className="animate-spin mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      
      {!isLoading && icon && iconPosition === "left" && (
        <span className="mr-2">{icon}</span>
      )}
      
      {children}
      
      {!isLoading && icon && iconPosition === "right" && (
        <span className="ml-2">{icon}</span>
      )}
    </>
  );

  return (
    <button
      className={`${baseClasses} ${variantStyles[variant]} ${sizeStyles[size]} ${widthClass} ${disabledClass} ${className}`}
      disabled={disabled || isLoading}
      {...rest}
    >
      {buttonContent}
    </button>
  );
} 