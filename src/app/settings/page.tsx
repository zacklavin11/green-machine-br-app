"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Save, LogOut } from "lucide-react";
import { useAuth } from "../../lib/hooks/useAuth";
import { getUserProfile, updateUserProfile } from "../../lib/firebase/firebaseUtils";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    async function loadUserProfile() {
      if (!user) {
        router.push("/");
        return;
      }

      try {
        const userProfile = await getUserProfile(user.uid);
        if (userProfile) {
          setName(userProfile.name || user.displayName || "");
          setOriginalName(userProfile.name || user.displayName || "");
        } else {
          // If no profile exists yet, use the display name from Google
          setName(user.displayName || "");
          setOriginalName(user.displayName || "");
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
        setMessage({
          text: "Failed to load your profile. Please try again.",
          type: "error"
        });
      }
    }

    loadUserProfile();
  }, [user, router]);

  const handleSaveName = async () => {
    if (!user) return;
    
    // Don't save if nothing changed
    if (name === originalName) {
      setMessage({
        text: "No changes to save",
        type: "success"
      });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    
    setIsSaving(true);
    setMessage(null);
    
    try {
      await updateUserProfile(user.uid, { name });
      setOriginalName(name);
      setMessage({
        text: "Profile updated successfully!",
        type: "success"
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error updating user profile:", error);
      setMessage({
        text: "Failed to update profile. Please try again.",
        type: "error"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
      setIsSigningOut(false);
      setMessage({
        text: "Failed to sign out. Please try again.",
        type: "error"
      });
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center mb-8">
        <Link 
          href="/" 
          className="mr-4 p-2 rounded-full hover:bg-[var(--apple-gray-100)] dark:hover:bg-[var(--apple-gray-700)]"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="h-5 w-5 text-[var(--apple-gray-500)]" />
        </Link>
        <h1 className="text-3xl font-bold text-[var(--apple-gray-900)] dark:text-white">Settings</h1>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Message display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-100'}`}>
            {message.text}
          </div>
        )}

        <div className="apple-card mb-6">
          <div className="p-6 border-b border-[var(--apple-gray-200)] dark:border-[var(--apple-gray-700)]">
            <h2 className="text-xl font-bold text-[var(--apple-gray-900)] dark:text-white mb-1">Profile</h2>
            <p className="text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)]">
              Update your personal information
            </p>
          </div>
          
          <div className="p-6">
            <div className="mb-6">
              <label htmlFor="name" className="block text-sm font-medium text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)] mb-2">
                Display Name
              </label>
              <div className="flex items-center">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-[var(--apple-gray-400)]" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-[var(--apple-gray-300)] dark:border-[var(--apple-gray-600)] rounded-md shadow-sm focus:ring-[#39e991] focus:border-[#39e991] bg-white dark:bg-[var(--apple-gray-700)] text-[var(--apple-gray-900)] dark:text-white"
                    placeholder="Your name"
                  />
                </div>
                <button
                  onClick={handleSaveName}
                  disabled={isSaving || name === originalName}
                  className="ml-3 apple-button-green flex items-center"
                >
                  {isSaving ? (
                    <>
                      <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-r-transparent animate-spin mr-2"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Save
                    </>
                  )}
                </button>
              </div>
              <p className="mt-2 text-sm text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)]">
                This name will be displayed on your reports and dashboard.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)] mb-2">
                Email
              </label>
              <p className="text-[var(--apple-gray-900)] dark:text-white py-2 px-3 border border-[var(--apple-gray-300)] dark:border-[var(--apple-gray-600)] rounded-md bg-[var(--apple-gray-50)] dark:bg-[var(--apple-gray-800)]">
                {user?.email || 'Not signed in'}
              </p>
              <p className="mt-2 text-sm text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)]">
                Email associated with your Google account.
              </p>
            </div>
          </div>
        </div>
        
        <div className="apple-card mb-6">
          <div className="p-6 border-b border-[var(--apple-gray-200)] dark:border-[var(--apple-gray-700)]">
            <h2 className="text-xl font-bold text-[var(--apple-gray-900)] dark:text-white mb-1">Account</h2>
            <p className="text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)]">
              Manage your account settings
            </p>
          </div>
          
          <div className="p-6">
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="flex items-center px-4 py-2 border border-red-300 text-red-700 dark:border-red-800 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              {isSigningOut ? (
                <>
                  <span className="inline-block h-4 w-4 rounded-full border-2 border-red-700 dark:border-red-400 border-r-transparent animate-spin mr-2"></span>
                  Signing Out...
                </>
              ) : (
                <>
                  <LogOut className="h-5 w-5 mr-2" />
                  Sign Out
                </>
              )}
            </button>
            <p className="mt-2 text-sm text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)]">
              Sign out of your Google account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 