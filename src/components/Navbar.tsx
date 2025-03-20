"use client";

import Link from "next/link";
import { useTheme } from "../lib/hooks/useTheme";
import { useAuth } from "../lib/hooks/useAuth";
import { useState, useEffect } from "react";
import { Moon, Sun, Menu, X, BookOpen, Calendar, Home, BarChart2, LogOut, User, Footprints, FileText, Settings, PlusCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import SignInWithGoogle from "./SignInWithGoogle";

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, signInWithGoogle, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);
  const toggleProfile = () => setProfileOpen(!profileOpen);
  const closeProfile = () => setProfileOpen(false);

  return (
    <nav className="bg-white dark:bg-[var(--apple-gray-900)] border-b border-[var(--apple-gray-100)] dark:border-[var(--apple-gray-700)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and desktop nav links */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-[#39e991] flex items-center">
                <Footprints className="h-6 w-6 mr-2" />
                <span>90 Day Run Tracker</span>
              </Link>
            </div>
            
            {/* Desktop Nav Links */}
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <Link 
                href="/" 
                className={`inline-flex items-center px-1 pt-1 border-b-2 ${pathname === '/' ? 'border-[#39e991] text-[var(--apple-gray-900)] dark:text-white' : 'border-transparent text-[var(--apple-gray-700)] hover:text-[var(--apple-gray-900)] hover:border-[#39e991] dark:text-[var(--apple-gray-300)] dark:hover:text-white'}`}
              >
                <Home className="h-4 w-4 mr-1" />
                Home
              </Link>
              <Link 
                href="/books" 
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-[var(--apple-gray-700)] hover:text-[var(--apple-gray-900)] hover:border-[#39e991] dark:text-[var(--apple-gray-300)] dark:hover:text-white"
              >
                <BookOpen className="h-4 w-4 mr-1" />
                My Books
              </Link>
              <Link 
                href="/reports" 
                className={`inline-flex items-center px-1 pt-1 border-b-2 ${pathname === '/reports' || pathname.startsWith('/reports/') ? 'border-[#39e991] text-[var(--apple-gray-900)] dark:text-white' : 'border-transparent text-[var(--apple-gray-700)] hover:text-[var(--apple-gray-900)] hover:border-[#39e991] dark:text-[var(--apple-gray-300)] dark:hover:text-white'}`}
              >
                <FileText className="h-4 w-4 mr-1" />
                Reports
              </Link>
              <Link 
                href="/settings" 
                className={`inline-flex items-center px-1 pt-1 border-b-2 ${pathname === '/settings' ? 'border-[#39e991] text-[var(--apple-gray-900)] dark:text-white' : 'border-transparent text-[var(--apple-gray-700)] hover:text-[var(--apple-gray-900)] hover:border-[#39e991] dark:text-[var(--apple-gray-300)] dark:hover:text-white'}`}
              >
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Link>
            </div>
          </div>

          {/* User menu and theme toggle */}
          <div className="flex items-center">
            {/* Dark mode toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full text-[var(--apple-gray-500)] hover:text-[var(--apple-gray-900)] dark:text-[var(--apple-gray-400)] dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#39e991]"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Login/Logout button */}
            {user ? (
              <div className="relative ml-4">
                <button
                  onClick={toggleProfile}
                  className="flex items-center text-sm font-medium text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)] hover:text-[var(--apple-gray-900)] dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#39e991] rounded-full"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-[#39e991] flex items-center justify-center text-[var(--apple-gray-900)]">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="User" className="h-8 w-8 rounded-full" />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </div>
                </button>
                
                {/* Profile dropdown */}
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg py-1 bg-white dark:bg-[var(--apple-gray-800)] ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="px-4 py-2 text-sm text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)] border-b border-[var(--apple-gray-100)] dark:border-[var(--apple-gray-700)]">
                      <p className="font-medium">{user.displayName || 'User'}</p>
                      <p className="text-xs truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/settings"
                      onClick={closeProfile}
                      className="block w-full text-left px-4 py-2 text-sm text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)] hover:bg-[var(--apple-gray-50)] dark:hover:bg-[var(--apple-gray-700)]"
                    >
                      <div className="flex items-center">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </div>
                    </Link>
                    <button
                      onClick={() => {
                        signOut();
                        closeProfile();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)] hover:bg-[var(--apple-gray-50)] dark:hover:bg-[var(--apple-gray-700)]"
                    >
                      <div className="flex items-center">
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign out
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="ml-4 px-4 py-2 text-sm text-[var(--apple-gray-900)] bg-[#39e991] hover:brightness-95 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#39e991] font-medium"
              >
                Sign In
              </button>
            )}

            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden ml-4">
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-[var(--apple-gray-500)] hover:text-[var(--apple-gray-900)] hover:bg-[var(--apple-gray-50)] dark:text-[var(--apple-gray-400)] dark:hover:text-white dark:hover:bg-[var(--apple-gray-700)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#39e991]"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {menuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`sm:hidden ${menuOpen ? 'block' : 'hidden'}`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link
            href="/"
            className={`block pl-3 pr-4 py-2 border-l-4 ${pathname === '/' ? 'border-[#39e991] bg-[var(--apple-gray-50)] dark:bg-[var(--apple-gray-700)] text-[var(--apple-gray-900)] dark:text-white' : 'border-transparent text-[var(--apple-gray-700)] hover:text-[var(--apple-gray-900)] hover:bg-[var(--apple-gray-50)] hover:border-[#39e991] dark:text-[var(--apple-gray-300)] dark:hover:text-white dark:hover:bg-[var(--apple-gray-700)]'}`}
            onClick={closeMenu}
          >
            <div className="flex items-center">
              <Home className="h-5 w-5 mr-2" />
              Home
            </div>
          </Link>
          <Link
            href="/reports"
            className={`block pl-3 pr-4 py-2 border-l-4 ${pathname === '/reports' || pathname.startsWith('/reports/') ? 'border-[#39e991] bg-[var(--apple-gray-50)] dark:bg-[var(--apple-gray-700)] text-[var(--apple-gray-900)] dark:text-white' : 'border-transparent text-[var(--apple-gray-700)] hover:text-[var(--apple-gray-900)] hover:bg-[var(--apple-gray-50)] hover:border-[#39e991] dark:text-[var(--apple-gray-300)] dark:hover:text-white dark:hover:bg-[var(--apple-gray-700)]'}`}
            onClick={closeMenu}
          >
            <div className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Reports
            </div>
          </Link>
          <Link
            href="/settings"
            className={`block pl-3 pr-4 py-2 border-l-4 ${pathname === '/settings' ? 'border-[#39e991] bg-[var(--apple-gray-50)] dark:bg-[var(--apple-gray-700)] text-[var(--apple-gray-900)] dark:text-white' : 'border-transparent text-[var(--apple-gray-700)] hover:text-[var(--apple-gray-900)] hover:bg-[var(--apple-gray-50)] hover:border-[#39e991] dark:text-[var(--apple-gray-300)] dark:hover:text-white dark:hover:bg-[var(--apple-gray-700)]'}`}
            onClick={closeMenu}
          >
            <div className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Settings
            </div>
          </Link>
        </div>
      </div>

      <div className={`absolute top-0 right-0 w-64 h-screen bg-white dark:bg-[var(--apple-gray-800)] shadow-lg transform ${menuOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-200 ease-in-out z-20`}>
        <div className="p-5 border-b border-[var(--apple-gray-200)] dark:border-[var(--apple-gray-700)] flex justify-between items-center">
          <span className="font-bold text-[var(--apple-gray-900)] dark:text-white">Menu</span>
          <button onClick={toggleMenu} className="p-2 rounded-full hover:bg-[var(--apple-gray-100)] dark:hover:bg-[var(--apple-gray-700)]">
            <X className="h-6 w-6 text-[var(--apple-gray-500)]" />
          </button>
        </div>
        <nav className="p-5">
          <ul className="space-y-4">
            <li>
              <Link href="/" className={`flex items-center p-2 rounded-md ${pathname === '/' ? 'bg-[var(--apple-gray-100)] dark:bg-[var(--apple-gray-700)] text-[#39e991]' : 'text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)] hover:bg-[var(--apple-gray-50)] dark:hover:bg-[var(--apple-gray-700)]'}`} onClick={closeMenu}>
                <Home className="h-5 w-5 mr-3" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/reports/new" className={`flex items-center p-2 rounded-md ${pathname === '/reports/new' ? 'bg-[var(--apple-gray-100)] dark:bg-[var(--apple-gray-700)] text-[#39e991]' : 'text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)] hover:bg-[var(--apple-gray-50)] dark:hover:bg-[var(--apple-gray-700)]'}`} onClick={closeMenu}>
                <PlusCircle className="h-5 w-5 mr-3" />
                New Report
              </Link>
            </li>
            <li>
              <Link href="/reports" className={`flex items-center p-2 rounded-md ${pathname === '/reports' || (pathname.startsWith('/reports/') && pathname !== '/reports/new') ? 'bg-[var(--apple-gray-100)] dark:bg-[var(--apple-gray-700)] text-[#39e991]' : 'text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)] hover:bg-[var(--apple-gray-50)] dark:hover:bg-[var(--apple-gray-700)]'}`} onClick={closeMenu}>
                <FileText className="h-5 w-5 mr-3" />
                Reports
              </Link>
            </li>
            <li>
              <Link href="/settings" className={`flex items-center p-2 rounded-md ${pathname === '/settings' ? 'bg-[var(--apple-gray-100)] dark:bg-[var(--apple-gray-700)] text-[#39e991]' : 'text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)] hover:bg-[var(--apple-gray-50)] dark:hover:bg-[var(--apple-gray-700)]'}`} onClick={closeMenu}>
                <Settings className="h-5 w-5 mr-3" />
                Settings
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </nav>
  );
} 