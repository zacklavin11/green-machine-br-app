"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, FileText, Settings, Home, PlusCircle, Footprints } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  
  const isActiveLink = (path: string) => {
    return pathname === path;
  };

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-[var(--apple-gray-900)] border-r border-[var(--apple-gray-100)] dark:border-[var(--apple-gray-700)] z-10 shadow-sm">
      <div className="h-full flex flex-col">
        {/* Logo */}
        <div className="py-6 px-6 border-b border-[var(--apple-gray-100)] dark:border-[var(--apple-gray-700)]">
          <Link href="/" className="flex items-center">
            <Footprints className="h-6 w-6 text-[var(--green-primary)] mr-2" />
            <span className="text-xl font-semibold text-[var(--apple-gray-900)] dark:text-white">
              90 Day Run Tracker
            </span>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-6 px-4 space-y-1">
          <Link
            href="/"
            className={`flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all ${
              isActiveLink("/")
                ? "bg-[#ebfbf3] text-[var(--apple-gray-900)] dark:bg-[var(--green-primary)]/10 dark:text-[var(--green-primary)]"
                : "text-[var(--apple-gray-700)] hover:bg-[var(--apple-gray-50)] dark:text-[var(--apple-gray-300)] dark:hover:bg-[var(--apple-gray-700)]"
            }`}
          >
            <Home className={`mr-3 h-5 w-5 ${isActiveLink("/") ? "text-[var(--green-primary)]" : "text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)]"}`} />
            Dashboard
          </Link>

          <Link
            href="/reports/new"
            className={`flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all ${
              isActiveLink("/reports/new")
                ? "bg-[#ebfbf3] text-[var(--apple-gray-900)] dark:bg-[var(--green-primary)]/10 dark:text-[var(--green-primary)]"
                : "text-[var(--apple-gray-700)] hover:bg-[var(--apple-gray-50)] dark:text-[var(--apple-gray-300)] dark:hover:bg-[var(--apple-gray-700)]"
            }`}
          >
            <PlusCircle className={`mr-3 h-5 w-5 ${isActiveLink("/reports/new") ? "text-[var(--green-primary)]" : "text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)]"}`} />
            New Report
          </Link>

          <Link
            href="/reports"
            className={`flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all ${
              isActiveLink("/reports")
                ? "bg-[#ebfbf3] text-[var(--apple-gray-900)] dark:bg-[var(--green-primary)]/10 dark:text-[var(--green-primary)]"
                : "text-[var(--apple-gray-700)] hover:bg-[var(--apple-gray-50)] dark:text-[var(--apple-gray-300)] dark:hover:bg-[var(--apple-gray-700)]"
            }`}
          >
            <FileText className={`mr-3 h-5 w-5 ${isActiveLink("/reports") ? "text-[var(--green-primary)]" : "text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)]"}`} />
            All Reports
          </Link>

          <Link
            href="/settings"
            className={`flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all ${
              isActiveLink("/settings")
                ? "bg-[#ebfbf3] text-[var(--apple-gray-900)] dark:bg-[var(--green-primary)]/10 dark:text-[var(--green-primary)]"
                : "text-[var(--apple-gray-700)] hover:bg-[var(--apple-gray-50)] dark:text-[var(--apple-gray-300)] dark:hover:bg-[var(--apple-gray-700)]"
            }`}
          >
            <Settings className={`mr-3 h-5 w-5 ${isActiveLink("/settings") ? "text-[var(--green-primary)]" : "text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)]"}`} />
            Settings
          </Link>
        </nav>
      </div>
    </aside>
  );
} 