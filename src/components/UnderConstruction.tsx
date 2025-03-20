"use client";

import React from "react";
import { motion } from "framer-motion";
import { Construction } from "lucide-react";
import Link from "next/link";

interface UnderConstructionProps {
  title: string;
  message?: string;
  backLink?: string;
  backText?: string;
  isCalendar?: boolean;
}

export default function UnderConstruction({
  title, 
  message = "This feature is coming soon!", 
  backLink = "/", 
  backText = "Back to Home",
  isCalendar = false
}: UnderConstructionProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${isCalendar ? 'py-28' : 'py-16'} text-center`}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Construction className={`${isCalendar ? 'h-24 w-24' : 'h-16 w-16'} text-[#39e991] mb-4 mx-auto`} />
      </motion.div>
      
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className={`${isCalendar ? 'text-3xl' : 'text-2xl'} font-bold text-[var(--apple-gray-900)] dark:text-white mb-3`}
      >
        {title}
      </motion.h1>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className={`text-[var(--apple-gray-600)] dark:text-[var(--apple-gray-300)] mb-8 ${isCalendar ? 'max-w-xl text-lg' : 'max-w-md'} mx-auto`}
      >
        {message}
      </motion.p>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <Link 
          href={backLink} 
          className="px-4 py-2 bg-[#39e991] hover:brightness-95 text-[var(--apple-gray-900)] rounded-full transition-all font-medium"
        >
          {backText}
        </Link>
      </motion.div>
    </div>
  );
} 