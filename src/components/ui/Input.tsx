"use client";

import React, { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, fullWidth = true, icon, className = "", ...rest }, ref) => {
    const inputClasses = `
      px-4 py-3 rounded-lg border 
      ${error 
        ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
        : "border-[var(--apple-gray-200)] dark:border-[var(--apple-gray-700)] focus:border-[var(--green-primary)] focus:ring-[var(--green-primary)]"
      }
      bg-white dark:bg-[var(--apple-gray-800)] text-[var(--apple-gray-900)] dark:text-white
      focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all
      ${icon ? "pl-10" : ""}
      ${fullWidth ? "w-full" : ""}
      ${className}
    `;

    return (
      <div className={`${fullWidth ? "w-full" : ""} mb-4`}>
        {label && (
          <label className="block text-sm font-medium text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)] mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)]">
              {icon}
            </div>
          )}
          <input ref={ref} className={inputClasses} {...rest} />
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input; 