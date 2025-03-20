"use client";

import React, { ReactNode } from "react";
import Navbar from "./Navbar";
import { motion } from "framer-motion";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export default function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <motion.main 
        className={`flex-grow p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.main>
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          Book Report App &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
} 