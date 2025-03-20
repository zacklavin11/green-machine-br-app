"use client";

import React, { TextareaHTMLAttributes, forwardRef } from "react";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, fullWidth = true, className = "", rows = 4, ...rest }, ref) => {
    const textareaClasses = `
      px-4 py-2 rounded-md border 
      ${error 
        ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
        : "border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500"
      }
      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
      focus:outline-none focus:ring-2 focus:ring-opacity-50
      ${fullWidth ? "w-full" : ""}
      resize-vertical min-h-[100px]
      ${className}
    `;

    return (
      <div className={`${fullWidth ? "w-full" : ""} mb-4`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
        )}
        <textarea ref={ref} className={textareaClasses} rows={rows} {...rest} />
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

TextArea.displayName = "TextArea";

export default TextArea; 