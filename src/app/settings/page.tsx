"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Save, LogOut, Palette } from "lucide-react";
import { useAuth } from "../../lib/hooks/useAuth";
import { useTheme } from "../../lib/hooks/useTheme";
import { getUserProfile, updateUserProfile } from "../../lib/firebase/firebaseUtils";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { colorTheme, setColorTheme } = useTheme();
  const router = useRouter();
  const [name, setName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [userGoal, setUserGoal] = useState(0);

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
          setUserGoal(userProfile.goal || 0);
        } else {
          // If no profile exists yet, use the display name from Google
          setName(user.displayName || "");
          setOriginalName(user.displayName || "");
          setUserGoal(0);
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
      await updateUserProfile(user.uid, { name, goal: userGoal });
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

  const handleColorThemeChange = (newTheme: "green" | "blue" | "red" | "yellow") => {
    setColorTheme(newTheme);
    setMessage({
      text: `Theme color changed to ${newTheme}!`,
      type: "success"
    });
    setTimeout(() => setMessage(null), 3000);
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
                    className="block w-full pl-10 pr-3 py-2 border border-[var(--apple-gray-300)] dark:border-[var(--apple-gray-600)] rounded-md shadow-sm focus:ring-[var(--theme-color)] focus:border-[var(--theme-color)] bg-white dark:bg-[var(--apple-gray-700)] text-[var(--apple-gray-900)] dark:text-white"
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
        
        {/* Theme Settings Card */}
        <div className="apple-card mb-6">
          <div className="p-6 border-b border-[var(--apple-gray-200)] dark:border-[var(--apple-gray-700)]">
            <div className="flex items-center">
              <Palette className="h-5 w-5 mr-2 text-[var(--theme-color)]" />
              <h2 className="text-xl font-bold text-[var(--apple-gray-900)] dark:text-white mb-1">Report Colors</h2>
            </div>
            <p className="text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)]">
              Update color of your reports for sharing
            </p>
          </div>
          
          <div className="p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)] mb-3">
                Choose a color for your shared reports
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <button 
                  onClick={() => handleColorThemeChange("red")}
                  className={`flex flex-col items-center p-4 rounded-lg border transition-all ${
                    colorTheme === "red" 
                      ? 'border-[#EF4444] bg-[#EF4444]/10 dark:bg-[#EF4444]/5' 
                      : 'border-[var(--apple-gray-200)] dark:border-[var(--apple-gray-700)] hover:border-[#EF4444] hover:bg-[#EF4444]/5'
                  }`}
                >
                  <div className="h-12 w-12 rounded-full bg-[#EF4444] mb-2"></div>
                  <span className="text-sm font-medium text-[var(--apple-gray-900)] dark:text-white">Red</span>
                </button>

                <button 
                  onClick={() => handleColorThemeChange("green")}
                  className={`flex flex-col items-center p-4 rounded-lg border transition-all ${
                    colorTheme === "green" 
                      ? 'border-[#39e991] bg-[#39e991]/10 dark:bg-[#39e991]/5' 
                      : 'border-[var(--apple-gray-200)] dark:border-[var(--apple-gray-700)] hover:border-[#39e991] hover:bg-[#39e991]/5'
                  }`}
                >
                  <div className="h-12 w-12 rounded-full bg-[#39e991] mb-2"></div>
                  <span className="text-sm font-medium text-[var(--apple-gray-900)] dark:text-white">Green</span>
                </button>
                
                <button 
                  onClick={() => handleColorThemeChange("yellow")}
                  className={`flex flex-col items-center p-4 rounded-lg border transition-all ${
                    colorTheme === "yellow" 
                      ? 'border-[#F59E0B] bg-[#F59E0B]/10 dark:bg-[#F59E0B]/5' 
                      : 'border-[var(--apple-gray-200)] dark:border-[var(--apple-gray-700)] hover:border-[#F59E0B] hover:bg-[#F59E0B]/5'
                  }`}
                >
                  <div className="h-12 w-12 rounded-full bg-[#F59E0B] mb-2"></div>
                  <span className="text-sm font-medium text-[var(--apple-gray-900)] dark:text-white">Yellow</span>
                </button>
                
                <button 
                  onClick={() => handleColorThemeChange("blue")}
                  className={`flex flex-col items-center p-4 rounded-lg border transition-all ${
                    colorTheme === "blue" 
                      ? 'border-[#3B82F6] bg-[#3B82F6]/10 dark:bg-[#3B82F6]/5' 
                      : 'border-[var(--apple-gray-200)] dark:border-[var(--apple-gray-700)] hover:border-[#3B82F6] hover:bg-[#3B82F6]/5'
                  }`}
                >
                  <div className="h-12 w-12 rounded-full bg-[#3B82F6] mb-2"></div>
                  <span className="text-sm font-medium text-[var(--apple-gray-900)] dark:text-white">Blue</span>
                </button>
              </div>
              <p className="mt-3 text-sm text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)]">
                Select a color to style your exported and shared reports.
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

        <div className="apple-card mb-6">
          <div className="p-6 border-b border-[var(--apple-gray-200)] dark:border-[var(--apple-gray-700)]">
            <h2 className="text-xl font-bold text-[var(--apple-gray-900)] dark:text-white mb-1">Goal</h2>
            <p className="text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)]">
              Set or edit your goal
            </p>
          </div>
          
          <div className="p-6">
            <div className="mb-6">
              <label htmlFor="goal" className="block text-sm font-medium text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)] mb-2">
                Goal
              </label>
              <div className="flex items-center">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-[var(--apple-gray-400)]" />
                  </div>
                  <input
                    type="number"
                    id="goal"
                    value={userGoal}
                    onChange={(e) => setUserGoal(Number(e.target.value))}
                    className="block w-full pl-10 pr-3 py-2 border border-[var(--apple-gray-300)] dark:border-[var(--apple-gray-600)] rounded-md shadow-sm focus:ring-[var(--theme-color)] focus:border-[var(--theme-color)] bg-white dark:bg-[var(--apple-gray-700)] text-[var(--apple-gray-900)] dark:text-white"
                    placeholder="Enter your goal"
                  />
                </div>
                <button
                  onClick={() => setIsEditingGoal(!isEditingGoal)}
                  className="text-sm text-[var(--theme-color)] font-medium hover:underline"
                >
                  {isEditingGoal ? 'Cancel' : userGoal ? 'Edit Goal' : 'Set Goal'}
                </button>
              </div>
              <p className="mt-2 text-sm text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)]">
                Set your goal for the 90 Day Run Tracker
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 