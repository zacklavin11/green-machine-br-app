"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Flame, Award, TrendingUp, PlusCircle, User } from "lucide-react";
import { useAuth } from "../lib/hooks/useAuth";
import SignInWithGoogle from "../components/SignInWithGoogle";
import { 
  createUserProfile, 
  getUserProfile, 
  getActiveCalendarDays, 
  updateUserStreak,
  updateDocument,
  getDocuments
} from "../lib/firebase/firebaseUtils";
import { DocumentData } from "firebase/firestore";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeCalendarDays, setActiveCalendarDays] = useState<number[]>([]);
  const [missedDays, setMissedDays] = useState<number[]>([]);
  const [userStats, setUserStats] = useState({
    currentStreak: 0,
    longestStreak: 0,
    completionRate: 0,
    totalReports: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userGoal, setUserGoal] = useState("");
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [modalAction, setModalAction] = useState<'mark' | 'unmark'>('mark');
  
  // Helper function to calculate how many days in a month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Helper function to calculate streak
  const calculateUserStreak = (reports: any[]): { currentStreak: number, longestStreak: number } => {
    if (!reports || !reports.length) return { currentStreak: 0, longestStreak: 0 };
    
    console.log(`Starting streak calculation with ${reports.length} reports`);
    
    // Sort reports by date (newest first)
    const sortedReports = [...reports].sort((a, b) => {
      const dateA = a.createdAt instanceof Date 
        ? a.createdAt 
        : new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : Date.now());
      
      const dateB = b.createdAt instanceof Date 
        ? b.createdAt 
        : new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : Date.now());
      
      return dateB.getTime() - dateA.getTime();
    });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    // Group reports by date to handle multiple reports on the same day
    const reportsByDate = new Map<string, any[]>();
    sortedReports.forEach(report => {
      // Make sure createdAt is a Date object
      const reportDate = report.createdAt instanceof Date 
        ? report.createdAt 
        : new Date(report.createdAt?.seconds ? report.createdAt.seconds * 1000 : Date.now());
      
      // Set to start of day for consistent comparison
      const date = new Date(reportDate);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];
      
      if (!reportsByDate.has(dateStr)) {
        reportsByDate.set(dateStr, []);
      }
      reportsByDate.get(dateStr)!.push(report);
    });
    
    // Get all unique dates with reports, sorted descending
    const reportDates = Array.from(reportsByDate.keys())
      .map(dateStr => new Date(dateStr))
      .sort((a, b) => b.getTime() - a.getTime());
    
    console.log(`Report dates:`, reportDates.map(d => d.toISOString().split('T')[0]));
    
    // For calendar view, handle streak calculation differently
    // We need to check if the sorted days form a consecutive streak
    
    // Get all day numbers in descending order (for current month view)
    const days = sortedReports.map(report => {
      const date = report.createdAt instanceof Date 
        ? report.createdAt 
        : new Date(report.createdAt?.seconds ? report.createdAt.seconds * 1000 : Date.now());
      return date.getDate();
    }).sort((a, b) => b - a); // Sort in descending order
    
    console.log("Calendar days in descending order:", days);
    
    // For calendar view, check if today's date or yesterday's date is included
    const todayDate = today.getDate();
    const yesterdayDate = new Date(today);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayDay = yesterdayDate.getDate();
    
    const isCurrentMonth = currentDate.getMonth() === today.getMonth() && 
                           currentDate.getFullYear() === today.getFullYear();
    
    console.log(`Is current month: ${isCurrentMonth}`, {
      currentDateMonth: currentDate.getMonth(),
      todayMonth: today.getMonth(),
      currentDateYear: currentDate.getFullYear(),
      todayYear: today.getFullYear(),
      todayDate,
      yesterdayDay
    });
    
    // Check if the most recent day is today or yesterday
    // For calendar view (using days of month)
    if (isCurrentMonth) {
      // If viewing current month, check if we have today or yesterday
      const hasTodayOrYesterday = days.includes(todayDate) || days.includes(yesterdayDay);
      
      if (days.length > 0 && hasTodayOrYesterday) {
        // Start with a streak of 1 for the most recent day
        currentStreak = 1;
        
        // Sort days in descending order for the current month
        const sortedDays = Array.from(new Set(days)).sort((a, b) => b - a);
        console.log("Sorted unique days:", sortedDays);
        
        if (sortedDays.length > 1) {
          // Start from second day (index 1) since we already counted the first day
          let expectedDay = sortedDays[0] - 1;
          
          for (let i = 1; i < sortedDays.length; i++) {
            const currentDay = sortedDays[i];
            console.log(`Checking streak: expectedDay=${expectedDay}, currentDay=${currentDay}`);
            
            if (currentDay === expectedDay) {
              // This is a consecutive day
              currentStreak++;
              expectedDay--;
              console.log(`Consecutive day found, streak now: ${currentStreak}`);
            } else {
              // Break in streak
              console.log(`Break in streak found: expected ${expectedDay}, found ${currentDay}`);
              break;
            }
          }
        }
      }
    } else {
      // Historical data uses the original method with date objects
      const mostRecentReportDate = reportDates[0];
      if (mostRecentReportDate) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        console.log(`Today: ${today.toISOString().split('T')[0]}`);
        console.log(`Yesterday: ${yesterday.toISOString().split('T')[0]}`);
        console.log(`Most recent report: ${mostRecentReportDate.toISOString().split('T')[0]}`);
        
        const isToday = mostRecentReportDate.getTime() === today.getTime();
        const isYesterday = mostRecentReportDate.getTime() === yesterday.getTime();
        
        console.log(`Historical data check - isToday: ${isToday}, isYesterday: ${isYesterday}`);
        
        if (isToday || isYesterday) {
          currentStreak = 1; // Start with 1 for the most recent day
          
          for (let i = 1; i < reportDates.length; i++) {
            const currentDate = reportDates[i-1];
            const prevDate = reportDates[i];
            
            // Calculate days between reports
            const diffTime = currentDate.getTime() - prevDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            console.log(`Historical streak check: diffDays=${diffDays}`);
            
            if (diffDays === 1) {
              // Consecutive day, continue streak
              currentStreak++;
              console.log(`Historical consecutive day found, streak now: ${currentStreak}`);
            } else {
              // Break in streak
              console.log(`Historical break in streak found: diffDays=${diffDays}`);
              break;
            }
          }
        }
      }
    }
    
    // Calculate longest streak (similar logic as current streak)
    if (isCurrentMonth && days.length > 0) {
      // For current month view
      const sortedDays = Array.from(new Set(days)).sort((a, b) => b - a);
      
      if (sortedDays.length > 0) {
        tempStreak = 1;
        let expectedDay = sortedDays[0] - 1;
        
        for (let i = 1; i < sortedDays.length; i++) {
          const currentDay = sortedDays[i];
          
          if (currentDay === expectedDay) {
            // This is a consecutive day
            tempStreak++;
            expectedDay--;
          } else {
            // Break in streak
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
            expectedDay = currentDay - 1;
          }
        }
      }
    } else if (reportDates.length > 0) {
      // Historical data uses the original method
      tempStreak = 1;
      
      for (let i = 1; i < reportDates.length; i++) {
        const prevDateObj = reportDates[i-1];
        const currentDateObj = reportDates[i];
        
        // Calculate days between reports
        const diffTime = prevDateObj.getTime() - currentDateObj.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          // Consecutive day
          tempStreak++;
        } else {
          // Break in streak, update longest and reset temp
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    
    // Final check for longest streak
    longestStreak = Math.max(longestStreak, tempStreak);
    console.log(`Calculated streak: current=${currentStreak}, longest=${longestStreak}`);
    
    return { currentStreak, longestStreak };
  };
  
  // Load user data from Firebase
  useEffect(() => {
    async function loadUserData() {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        // Check if user profile exists, create if not
        let userProfile: DocumentData | null = null;
        
        try {
          userProfile = await getUserProfile(user.uid) as DocumentData | null;
        } catch (err) {
          console.error("Error fetching user profile:", err);
        }
        
        if (!userProfile) {
          // First time user, create profile with default data
          try {
            userProfile = await createUserProfile(user, {
              streakData: {
                currentStreak: 0,
                longestStreak: 0,
                completionRate: 0,
                totalReports: 0,
                activeCalendarDays: []
              },
              goal: ""
            }) as DocumentData | null;
          } catch (err) {
            console.error("Error creating user profile:", err);
          }
        }
        
        // Load active calendar days
        try {
          const activeDays = await getActiveCalendarDays(user.uid);
          setActiveCalendarDays(activeDays);
          
          // Calculate streaks based on active calendar days
          if (activeDays && activeDays.length > 0) {
            // Convert active days to report-like objects for streak calculation
            const simulatedReports = activeDays.map(day => {
              // Create a date for this day in the current month/year
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              return {
                createdAt: date,
                date: date.toISOString().split('T')[0]
              };
            });
            
            // Calculate streak based on these simulated reports
            const streak = calculateUserStreak(simulatedReports);
            
            // Update user stats if needed
            if (userProfile && 
                (userProfile.streakData?.currentStreak !== streak.currentStreak || 
                 userProfile.streakData?.longestStreak !== streak.longestStreak)) {
              
              await updateUserStreak(user.uid, {
                ...userProfile.streakData,
                currentStreak: streak.currentStreak,
                longestStreak: Math.max(streak.longestStreak, userProfile.streakData?.longestStreak || 0),
                activeCalendarDays: activeDays
              });
              
              setUserStats(prev => ({
                ...prev,
                currentStreak: streak.currentStreak,
                longestStreak: Math.max(streak.longestStreak, userProfile.streakData?.longestStreak || 0),
              }));
            }
          }
        } catch (err) {
          console.error("Error loading active days:", err);
          setActiveCalendarDays([]);
        }
        
        // Set user stats from profile (as fallback and to preserve other stats)
        if (userProfile && userProfile.streakData) {
          setUserStats({
            currentStreak: userProfile.streakData.currentStreak || 0,
            longestStreak: userProfile.streakData.longestStreak || 0,
            completionRate: userProfile.streakData.completionRate || 0,
            totalReports: userProfile.streakData.totalReports || 0
          });
        }
        
        // Set user goal if available
        if (userProfile && userProfile.goal) {
          setUserGoal(userProfile.goal);
        }

        // Load recent reports
        try {
          setLoadingReports(true);
          const allReports = await getDocuments("reports");
          if (Array.isArray(allReports)) {
            const userReports = allReports
              .filter((report: any) => report.userId === user.uid)
              .map((report: any) => ({
                ...report,
                createdAt: report.createdAt instanceof Date 
                  ? report.createdAt 
                  : new Date(report.createdAt?.seconds ? report.createdAt.seconds * 1000 : Date.now())
              }))
              .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
            
            const recentOnes = userReports.slice(0, 3); // Only show 3 most recent reports
            setRecentReports(recentOnes);
            
            // Collect report days for the current month (for missed days calculation only)
            const reportDays = new Set<number>();
            const missedDaysList: number[] = [];
            
            // Current month reports
            userReports.forEach((report: any) => {
              const reportDate = new Date(report.createdAt);
              if (reportDate.getMonth() === currentDate.getMonth() && 
                  reportDate.getFullYear() === currentDate.getFullYear()) {
                reportDays.add(reportDate.getDate());
                
                // Consider days with reports as active days too
                const reportDay = reportDate.getDate();
                if (!activeCalendarDays.includes(reportDay)) {
                  // Update local state with the additional active day
                  setActiveCalendarDays(prev => [...prev, reportDay].sort((a, b) => a - b));
                }
              }
            });
            
            // Calculate missed days (days before today without reports OR active calendar days)
            const today = new Date();
            if (today.getMonth() === currentDate.getMonth() && 
                today.getFullYear() === currentDate.getFullYear()) {
              const todayDate = today.getDate();
              for (let i = 1; i < todayDate; i++) {
                // Only consider it missed if not in active days AND not in report days
                if (!activeCalendarDays.includes(i) && !reportDays.has(i)) {
                  missedDaysList.push(i);
                }
              }
            } else if (
              (today.getFullYear() > currentDate.getFullYear()) || 
              (today.getFullYear() === currentDate.getFullYear() && today.getMonth() > currentDate.getMonth())
            ) {
              // If viewing a past month, days without reports or calendar marks are missed
              for (let i = 1; i <= daysInMonth; i++) {
                // Only consider it missed if not in active days AND not in report days
                if (!activeCalendarDays.includes(i) && !reportDays.has(i)) {
                  missedDaysList.push(i);
                }
              }
            }
            
            // Important: DON'T overwrite activeCalendarDays here to preserve user's manual calendar marks
            setMissedDays(missedDaysList);
            
            // Calculate completion rate (percentage of days in current month that have reports or are marked as active)
            const calculateCompletionRate = () => {
              // Only calculate for days up to today (or all days for past months)
              const today = new Date();
              const isCurrentMonth = currentDate.getMonth() === today.getMonth() && 
                                    currentDate.getFullYear() === today.getFullYear();
              
              // Get days in current month
              const daysInMonth = new Date(
                currentDate.getFullYear(), 
                currentDate.getMonth() + 1, 
                0
              ).getDate();
              
              // For current month, only consider days up to today
              const totalDaysToConsider = isCurrentMonth ? today.getDate() : daysInMonth;
              
              // Count active days (combining calendar marked days and report days)
              const combinedActiveDays = new Set([
                ...activeCalendarDays,
                ...Array.from(reportDays)
              ]);
              
              // Filter to only include days up to the cutoff (today or end of month)
              const validActiveDays = Array.from(combinedActiveDays).filter(day => day <= totalDaysToConsider);
              
              // Calculate percentage - avoid division by zero
              const completionPercentage = totalDaysToConsider > 0 
                ? Math.round((validActiveDays.length / totalDaysToConsider) * 100) 
                : 0;
              
              return completionPercentage;
            };
            
            // Get the completion rate
            const completionRate = calculateCompletionRate();
            
            // Update streak data with the new completion rate
            if (userProfile && userProfile.streakData) {
              const updatedStreakData = {
                ...userProfile.streakData,
                completionRate,
                totalReports: userReports.length
              };
              
              // Update Firebase
              await updateUserStreak(user.uid, updatedStreakData);
              
              // Update local state
              setUserStats(prev => ({
                ...prev,
                completionRate,
                totalReports: userReports.length
              }));
            }
          }
        } catch (err) {
          console.error("Error loading recent reports:", err);
        } finally {
          setLoadingReports(false);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (!authLoading) {
      loadUserData();
    }
  }, [user, authLoading, currentDate]);

  // Get day of week for the first day of the month (0 = Sunday, 6 = Saturday)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDayOfMonth = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // Create calendar grid
  const calendarDays = [];
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      const userProfile = await getUserProfile(user.uid);
      await updateDocument("users", user.uid, {
        ...userProfile,
        goal: userGoal
      });
      setIsEditingGoal(false);
    } catch (error) {
      console.error("Error updating goal:", error);
    }
  };

  // Function to handle calendar day click
  const handleCalendarDayClick = (day: number) => {
    // Determine if we're marking or unmarking the day
    if (activeCalendarDays.includes(day)) {
      setModalAction('unmark');
    } else {
      setModalAction('mark');
    }
    
    setSelectedDay(day);
    setShowCalendarModal(true);
  };

  // Function to mark/unmark a day in the calendar
  const handleUpdateCalendarDay = async () => {
    if (!selectedDay || !user) return;
    
    try {
      const userProfile = await getUserProfile(user.uid);
      if (!userProfile || !userProfile.streakData) return;
      
      let updatedActiveDays = [...activeCalendarDays];
      let updatedMissedDays = [...missedDays];
      
      if (modalAction === 'mark') {
        // Add day to active days
        if (!updatedActiveDays.includes(selectedDay)) {
          updatedActiveDays.push(selectedDay);
          updatedActiveDays.sort((a, b) => a - b); // Keep days sorted
        }
        // Remove from missed days if present
        updatedMissedDays = updatedMissedDays.filter(day => day !== selectedDay);
      } else {
        // Remove day from active days
        updatedActiveDays = updatedActiveDays.filter(day => day !== selectedDay);
        // Add to missed days if day is in the past
        const today = new Date();
        const currentViewingDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay);
        if (currentViewingDate < today) {
          if (!updatedMissedDays.includes(selectedDay)) {
            updatedMissedDays.push(selectedDay);
            updatedMissedDays.sort((a, b) => a - b); // Keep days sorted
          }
        }
      }
      
      // Update local state first
      setActiveCalendarDays(updatedActiveDays);
      setMissedDays(updatedMissedDays);
      
      // Now recalculate streak based on the active calendar days
      // Convert active days to report-like objects for streak calculation
      const simulatedReports = updatedActiveDays.map(day => {
        // Create a date for this day in the current month/year
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        return {
          createdAt: date,
          date: date.toISOString().split('T')[0]
        };
      });
      
      // Calculate streak based on these simulated reports
      const streak = calculateUserStreak(simulatedReports);
      
      // Update streak in Firebase with the new values
      const updatedStreakData = {
        ...userProfile.streakData,
        currentStreak: streak.currentStreak,
        longestStreak: Math.max(streak.longestStreak, userProfile.streakData?.longestStreak || 0),
        activeCalendarDays: updatedActiveDays
      };
      
      await updateUserStreak(user.uid, updatedStreakData);
      
      // Update local state with new streak values
      setUserStats(prev => ({
        ...prev,
        currentStreak: streak.currentStreak,
        longestStreak: Math.max(streak.longestStreak, userProfile.streakData?.longestStreak || 0),
      }));
      
      console.log("Calendar day updated successfully", {
        action: modalAction,
        day: selectedDay,
        newActiveDays: updatedActiveDays,
        newStreak: streak
      });
    } catch (error) {
      console.error("Error updating calendar day:", error);
    } finally {
      setShowCalendarModal(false);
      setSelectedDay(null);
    }
  };

  // If loading, show loading state
  if (authLoading || isLoading) {
    return (
      <div className="p-8 flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--theme-color)]"></div>
      </div>
    );
  }

  // If user is not logged in, show sign-in UI
  if (!user) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-[80vh]">
        <div className="apple-card p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-[var(--apple-gray-900)] dark:text-white mb-4">Welcome to 90 Day Run Tracker</h1>
          <p className="text-[var(--apple-gray-600)] dark:text-[var(--apple-gray-400)] mb-8">
            Please sign in with your Google account to start tracking your reading progress and create book reports.
          </p>
          <div className="flex justify-center">
            <SignInWithGoogle />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* User Greeting */}
      <div className="apple-card p-8 mb-8 text-center">
        <h1 className="text-4xl font-bold text-[var(--apple-gray-900)] dark:text-white mb-2">
          Hey {user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'there'}!
        </h1>
        <p className="text-lg text-[var(--apple-gray-600)] dark:text-[var(--apple-gray-400)]">
          Welcome to your 90 Day Run Tracker
        </p>
      </div>

      {/* Goals Tracker */}
      <div className="apple-card p-8 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[var(--apple-gray-900)] dark:text-white">What do I want?</h2>
          <button 
            onClick={() => setIsEditingGoal(!isEditingGoal)}
            className="text-sm text-[var(--theme-color)] font-medium hover:underline"
          >
            {isEditingGoal ? 'Cancel' : userGoal ? 'Edit Goal' : 'Set Goal'}
          </button>
        </div>
        
        {isEditingGoal ? (
          <form onSubmit={handleGoalSubmit} className="mt-4">
            <textarea
              value={userGoal}
              onChange={(e) => setUserGoal(e.target.value)}
              placeholder="Enter your primary goal here..."
              className="w-full p-4 border border-[var(--apple-gray-300)] dark:border-[var(--apple-gray-600)] rounded-lg focus:ring-[var(--theme-color)] focus:border-[var(--theme-color)] bg-white dark:bg-[var(--apple-gray-700)] text-[var(--apple-gray-900)] dark:text-white"
              rows={3}
            />
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-[var(--theme-color)] hover:brightness-95 text-[var(--apple-gray-900)] font-medium rounded-md"
              >
                Save Goal
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-4 p-6 bg-[var(--theme-color)]/10 dark:bg-[var(--theme-color)]/5 rounded-lg border border-[var(--theme-color)]/20 dark:border-[var(--theme-color)]/10">
            {userGoal ? (
              <p className="text-3xl font-bold text-center text-[var(--apple-gray-900)] dark:text-white py-6">
                {userGoal}
              </p>
            ) : (
              <p className="text-xl text-center text-[var(--apple-gray-600)] dark:text-[var(--apple-gray-400)] py-6">
                No goal set yet. Click "Set Goal" to define what you want to achieve.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Current Streak */}
        <div className="apple-card p-6">
          <div className="flex items-center mb-2">
            <Flame className="text-orange-500 h-6 w-6 mr-2" />
            <h2 className="text-[var(--apple-gray-600)] dark:text-[var(--apple-gray-400)] font-medium">Current Streak</h2>
          </div>
          <div className="mt-2">
            <p className="text-3xl font-bold text-[var(--apple-gray-900)] dark:text-white">{userStats.currentStreak} days</p>
            <p className="text-sm text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)] mt-1">
              {userStats.currentStreak > 0 ? "Keep it going!" : "Start your streak today!"}
            </p>
          </div>
        </div>

        {/* Longest Streak */}
        <div className="apple-card p-6">
          <div className="flex items-center mb-2">
            <Award className="text-yellow-500 h-6 w-6 mr-2" />
            <h2 className="text-[var(--apple-gray-600)] dark:text-[var(--apple-gray-400)] font-medium">Longest Streak</h2>
          </div>
          <div className="mt-2">
            <p className="text-3xl font-bold text-[var(--apple-gray-900)] dark:text-white">{userStats.longestStreak} days</p>
            <p className="text-sm text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)] mt-1">
              {userStats.longestStreak > 0 ? "Your personal best" : "Set your first record!"}
            </p>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="apple-card p-6">
          <div className="flex items-center mb-2">
            <TrendingUp className="text-[var(--theme-color)] h-6 w-6 mr-2" />
            <h2 className="text-[var(--apple-gray-600)] dark:text-[var(--apple-gray-400)] font-medium">Completion Rate</h2>
          </div>
          <div className="mt-2">
            <p className="text-3xl font-bold text-[var(--apple-gray-900)] dark:text-white">{userStats.completionRate}%</p>
            <p className="text-sm text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)] mt-1">
              {userStats.completionRate > 0 ? "This month" : "No data yet"}
            </p>
          </div>
        </div>

        {/* Total Reports */}
        <div className="apple-card p-6">
          <div className="flex items-center mb-2">
            <Calendar className="text-blue-500 h-6 w-6 mr-2" />
            <h2 className="text-[var(--apple-gray-600)] dark:text-[var(--apple-gray-400)] font-medium">Total Days</h2>
          </div>
          <div className="mt-2">
            <p className="text-3xl font-bold text-[var(--apple-gray-900)] dark:text-white">{userStats.totalReports}</p>
            <p className="text-sm text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)] mt-1">
              {userStats.totalReports > 0 ? "Reports created" : "No reports yet"}
            </p>
          </div>
        </div>
      </div>

      {/* Reading Streak Calendar */}
      <div className="apple-card p-6 mb-8">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h2 className="text-lg font-bold text-[var(--apple-gray-900)] dark:text-white">Reading Streak</h2>
            <p className="text-xs text-[var(--apple-gray-600)] dark:text-[var(--apple-gray-400)]">Track your daily reading habit</p>
          </div>
          <div className="text-xs text-[var(--apple-gray-600)] dark:text-[var(--apple-gray-400)] flex items-center space-x-4">
            <div>Current: {userStats.currentStreak} days</div>
            <div>Longest: {userStats.longestStreak} days</div>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium text-[var(--apple-gray-900)] dark:text-white">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <div className="flex space-x-1">
            <button 
              onClick={() => navigateMonth(-1)}
              className="p-1 rounded-md hover:bg-[var(--apple-gray-100)] dark:hover:bg-[var(--apple-gray-700)] text-sm"
              aria-label="Previous month"
            >
              &lt;
            </button>
            <button 
              onClick={() => navigateMonth(1)}
              className="p-1 rounded-md hover:bg-[var(--apple-gray-100)] dark:hover:bg-[var(--apple-gray-700)] text-sm"
              aria-label="Next month"
            >
              &gt;
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 max-w-2xl mx-auto">
          {/* Day names */}
          {dayNames.map((day, index) => (
            <div key={index} className="text-center text-xs font-medium text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)] py-1">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((day, index) => (
            <div key={index} className={`${!day ? 'invisible' : ''} flex justify-center`}>
              {day && (
                <div 
                  onClick={() => handleCalendarDayClick(day)}
                  className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium cursor-pointer
                    ${activeCalendarDays.includes(day) 
                      ? 'bg-[#39e991] text-[var(--apple-gray-900)]' 
                      : missedDays.includes(day)
                        ? 'bg-red-400 text-white'
                        : 'hover:bg-[var(--apple-gray-100)] dark:hover:bg-[var(--apple-gray-700)] text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)]'
                    }
                  `}
                >
                  {day}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      <div className="apple-card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[var(--apple-gray-900)] dark:text-white">Recent Reports</h2>
          <Link href="/reports" className="text-[var(--theme-color)] hover:brightness-95 text-sm font-medium">
            View all
          </Link>
        </div>

        {loadingReports ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--theme-color)] mx-auto"></div>
            <p className="text-sm text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)] mt-3">
              Loading reports...
            </p>
          </div>
        ) : recentReports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentReports.map((report) => (
              <Link 
                href={`/reports/${report.id}`} 
                key={report.id} 
                className="border border-[var(--apple-gray-200)] dark:border-[var(--apple-gray-700)] rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center mb-2">
                  <div className="w-2 h-2 rounded-full mr-2 bg-[#39e991]"></div>
                  <p className="text-sm font-medium text-[var(--apple-gray-900)] dark:text-white">
                    {report.dayNumber ? `Day ${report.dayNumber}: ` : ''}{report.bookTitle || 'Untitled Report'}
                  </p>
                </div>
                <p className="text-xs text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)] mt-2">
                  {new Date(report.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-[var(--apple-gray-600)] dark:text-[var(--apple-gray-400)] py-6">
            No reports found.
          </p>
        )}
      </div>

      {/* Calendar day modal */}
      {showCalendarModal && selectedDay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[var(--apple-gray-800)] rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-[var(--apple-gray-900)] dark:text-white mb-4">
              {modalAction === 'mark' ? 'Mark day as complete?' : 'Remove completed status?'}
            </h3>
            <p className="text-[var(--apple-gray-600)] dark:text-[var(--apple-gray-400)] mb-6">
              {modalAction === 'mark' 
                ? `This will mark ${monthNames[currentDate.getMonth()]} ${selectedDay} as a completed reading day.` 
                : `This will remove ${monthNames[currentDate.getMonth()]} ${selectedDay} from your completed reading days.`
              }
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => {
                  setShowCalendarModal(false);
                  setSelectedDay(null);
                }}
                className="px-4 py-2 border border-[var(--apple-gray-300)] dark:border-[var(--apple-gray-600)] text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)] rounded-md hover:bg-[var(--apple-gray-100)] dark:hover:bg-[var(--apple-gray-700)]"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCalendarDay}
                className={`px-4 py-2 rounded-md text-white ${
                  modalAction === 'mark' 
                    ? 'bg-[#39e991] hover:brightness-95' 
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {modalAction === 'mark' ? 'Mark Complete' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}