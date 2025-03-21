"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Settings, Home, PlusCircle, Footprints, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  
  // Handle window resize to determine if it's mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    // Set initial value
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobileView) {
      setIsMobileMenuOpen(false);
    }
  }, [pathname, isMobileView]);
  
  const isActiveLink = (path: string) => {
    return pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button
        onClick={toggleMobileMenu}
        className="md:hidden fixed top-4 left-4 z-50 bg-[var(--green-primary)] p-2 rounded-lg text-white shadow-md"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      
      <aside 
        className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-[var(--apple-gray-900)] border-r border-[var(--apple-gray-100)] dark:border-[var(--apple-gray-700)] z-40 shadow-sm transition-transform duration-300 ease-in-out ${
          isMobileView && !isMobileMenuOpen ? '-translate-x-full' : 'translate-x-0'
        } md:translate-x-0`}
      >
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
      
      {/* Overlay for mobile when sidebar is open */}
      {isMobileView && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={toggleMobileMenu}
          aria-hidden="true"
        />
      )}
    </>
  );
} 