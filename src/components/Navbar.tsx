"use client";

import Link from "next/link";
import { useAuth } from "../lib/hooks/useAuth";
import { useState } from "react";
import { Plus } from "lucide-react";

export default function Navbar() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const toggleProfile = () => setProfileOpen(!profileOpen);
  const closeProfile = () => setProfileOpen(false);

  return (
    <div className="flex justify-between items-center p-4 border-b border-gray-200 relative">
      <h1 className="text-xl md:text-2xl font-bold truncate pl-10 md:pl-0">90 Day Run Tracker</h1>
      
      <div className="flex items-center gap-2 md:gap-4">
        {user && (
          <>
            <div className="relative flex items-center">
              <button
                onClick={toggleProfile}
                className="flex items-center text-sm font-medium hover:text-gray-700"
              >
                {user.photoURL && !imageError ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    className="w-8 h-8 rounded-full mr-2"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <span className="hidden md:inline">{user.displayName || 'User'}</span>
              </button>
              
              {profileOpen && (
                <div className="absolute right-0 top-10 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <Link
                    href="/settings"
                    onClick={closeProfile}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      closeProfile();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
            
            <Link 
              href="/reports/new" 
              className="inline-flex items-center px-2 py-2 md:px-3 md:py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-[#39e991] hover:brightness-95 focus:outline-none shadow-sm"
            >
              <Plus className="h-4 w-4 md:mr-1" />
              <span className="hidden md:inline">New Report</span>
            </Link>
          </>
        )}
        
        {!user && (
          <button
            onClick={signInWithGoogle}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-[#39e991] hover:brightness-95 focus:outline-none"
          >
            Sign In
          </button>
        )}
      </div>
    </div>
  );
} 