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
        } catch (err) {
          console.error("Error loading active days:", err);
          setActiveCalendarDays([]);
        }
        
        // Set user stats from profile
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
            
            // Update active calendar days based on reports
            const reportDays = new Set<number>();
            const missedDaysList: number[] = [];
            
            // Current month reports
            userReports.forEach((report: any) => {
              const reportDate = new Date(report.createdAt);
              if (reportDate.getMonth() === currentDate.getMonth() && 
                  reportDate.getFullYear() === currentDate.getFullYear()) {
                reportDays.add(reportDate.getDate());
              }
            });
            
            // Calculate missed days (days before today without reports)
            const today = new Date();
            if (today.getMonth() === currentDate.getMonth() && 
                today.getFullYear() === currentDate.getFullYear()) {
              const todayDate = today.getDate();
              for (let i = 1; i < todayDate; i++) {
                if (!reportDays.has(i)) {
                  missedDaysList.push(i);
                }
              }
            } else if (
              (today.getFullYear() > currentDate.getFullYear()) || 
              (today.getFullYear() === currentDate.getFullYear() && today.getMonth() > currentDate.getMonth())
            ) {
              // If viewing a past month, all days without reports are missed
              for (let i = 1; i <= daysInMonth; i++) {
                if (!reportDays.has(i)) {
                  missedDaysList.push(i);
                }
              }
            }
            
            setActiveCalendarDays(Array.from(reportDays));
            setMissedDays(missedDaysList);
            
            // Update streak in Firebase only if we have reports and viewing current month
            if (userReports.length > 0 && 
                today.getMonth() === currentDate.getMonth() && 
                today.getFullYear() === currentDate.getFullYear()) {
              
              const streak = calculateUserStreak(userReports);
              if (userProfile && 
                  (userProfile.streakData?.currentStreak !== streak.currentStreak || 
                   userProfile.streakData?.longestStreak !== streak.longestStreak)) {
                
                // Update streak in Firebase
                await updateUserStreak(user.uid, {
                  ...userProfile.streakData,
                  currentStreak: streak.currentStreak,
                  longestStreak: Math.max(streak.longestStreak, userProfile.streakData?.longestStreak || 0),
                  totalReports: userReports.length,
                  activeCalendarDays: Array.from(reportDays)
                });
                
                // Update local state
                setUserStats(prev => ({
                  ...prev,
                  currentStreak: streak.currentStreak,
                  longestStreak: Math.max(streak.longestStreak, userProfile.streakData?.longestStreak || 0),
                  totalReports: userReports.length
                }));
              }
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

  // Helper function to calculate streak
  const calculateUserStreak = (reports: any[]): { currentStreak: number, longestStreak: number } => {
    if (!reports.length) return { currentStreak: 0, longestStreak: 0 };
    
    // Sort reports by date (newest first)
    const sortedReports = [...reports].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    // Group reports by date
    const reportsByDate = new Map<string, any[]>();
    sortedReports.forEach(report => {
      const date = new Date(report.createdAt);
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
    
    // Calculate current streak (must include today or yesterday)
    const mostRecentReportDate = reportDates[0];
    if (mostRecentReportDate) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const isToday = mostRecentReportDate.getTime() === today.getTime();
      const isYesterday = mostRecentReportDate.getTime() === yesterday.getTime();
      
      if (isToday || isYesterday) {
        currentStreak = 1; // Start with 1 for the most recent day
        
        for (let i = 1; i < reportDates.length; i++) {
          const currentDate = reportDates[i-1];
          const prevDate = reportDates[i];
          
          // Calculate days between reports
          const diffTime = currentDate.getTime() - prevDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            // Consecutive day, continue streak
            currentStreak++;
          } else {
            // Break in streak
            break;
          }
        }
      }
    }
    
    // Calculate longest streak
    for (let i = 0; i < reportDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const currentDate = reportDates[i-1];
        const nextDate = reportDates[i];
        
        // Calculate days between reports
        const diffTime = currentDate.getTime() - nextDate.getTime();
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
    
    return { currentStreak, longestStreak };
  };

  // Get current month days
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

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
          }
        }
      }
      
      // Update streak data in Firebase
      await updateUserStreak(user.uid, {
        ...userProfile.streakData,
        activeCalendarDays: updatedActiveDays
      });
      
      // Update local state
      setActiveCalendarDays(updatedActiveDays);
      setMissedDays(updatedMissedDays);
      
      // Recalculate streak
      const allReports = await getDocuments("reports");
      if (Array.isArray(allReports)) {
        const userReports = allReports
          .filter((report: any) => report.userId === user.uid)
          .map((report: any) => ({
            ...report,
            createdAt: report.createdAt instanceof Date 
              ? report.createdAt 
              : new Date(report.createdAt?.seconds ? report.createdAt.seconds * 1000 : Date.now())
          }));
          
        const streak = calculateUserStreak(userReports);
        
        // Update streak in Firebase
        await updateUserStreak(user.uid, {
          ...userProfile.streakData,
          currentStreak: streak.currentStreak,
          longestStreak: Math.max(streak.longestStreak, userProfile.streakData?.longestStreak || 0),
          totalReports: userReports.length,
          activeCalendarDays: updatedActiveDays
        });
        
        // Update local state
        setUserStats(prev => ({
          ...prev,
          currentStreak: streak.currentStreak,
          longestStreak: Math.max(streak.longestStreak, userProfile.streakData?.longestStreak || 0),
        }));
      }
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#39e991]"></div>
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[var(--apple-gray-900)] dark:text-white">90 Day Run Tracker</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <User className="h-5 w-5 text-[var(--apple-gray-500)] mr-2" />
            <span className="text-sm text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)]">
              {user.displayName || user.email}
            </span>
          </div>
          <Link
            href="/reports/new"
            className="apple-button-green flex items-center"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            New Report
          </Link>
        </div>
      </div>

      {/* User Greeting */}
      <div className="apple-card p-8 mb-8 text-center">
        <h2 className="text-4xl font-bold text-[var(--apple-gray-900)] dark:text-white mb-2">
          Hi there, {user.displayName ? user.displayName.split(' ')[0] : 'Friend'}!
        </h2>
        <p className="text-lg text-[var(--apple-gray-600)] dark:text-[var(--apple-gray-400)]">
          Welcome to your 90 Day Run Tracker dashboard
        </p>
      </div>

      {/* Goals Tracker */}
      <div className="apple-card p-8 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[var(--apple-gray-900)] dark:text-white">What do I want?</h2>
          <button 
            onClick={() => setIsEditingGoal(!isEditingGoal)}
            className="text-sm text-[#39e991] font-medium hover:underline"
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
              className="w-full p-4 border border-[var(--apple-gray-300)] dark:border-[var(--apple-gray-600)] rounded-lg focus:ring-[#39e991] focus:border-[#39e991] bg-white dark:bg-[var(--apple-gray-700)] text-[var(--apple-gray-900)] dark:text-white"
              rows={3}
            />
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-[#39e991] hover:brightness-95 text-[var(--apple-gray-900)] font-medium rounded-md"
              >
                Save Goal
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-4 p-6 bg-[#39e991]/10 dark:bg-[#39e991]/5 rounded-lg border border-[#39e991]/20 dark:border-[#39e991]/10">
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
            <TrendingUp className="text-[#39e991] h-6 w-6 mr-2" />
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
          <Link href="/reports" className="text-[#39e991] hover:brightness-95 text-sm font-medium">
            View all
          </Link>
        </div>

        {loadingReports ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#39e991] mx-auto"></div>
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
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    report.pdca?.didPlannedHappen && report.pdca?.hadUrgency && report.pdca?.managedTime 
                      ? 'bg-[#39e991]' 
                      : 'bg-amber-400'
                  }`}></div>
                  <h3 className="text-sm font-medium text-[var(--apple-gray-900)] dark:text-white truncate">
                    {report.dayNumber ? `Day ${report.dayNumber}` : 'Report'}
                  </h3>
                </div>
                <p className="text-xs text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)]">
                  {report.bookTitle || 'Untitled Book'}
                </p>
                <p className="text-xs text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)] mt-2">
                  {new Date(report.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)]">
            <p className="mb-4">No reports yet. Create your first report!</p>
            <Link
              href="/reports/new"
              className="apple-button-green inline-flex items-center"
            >
              Create Report
            </Link>
          </div>
        )}
      </div>

      {/* Calendar Day Modal */}
      {showCalendarModal && selectedDay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[var(--apple-gray-800)] p-6 rounded-lg max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold text-[var(--apple-gray-900)] dark:text-white mb-3">
              {modalAction === 'mark' ? 'Mark Day as Complete' : 'Unmark Day'}
            </h3>
            <p className="text-[var(--apple-gray-600)] dark:text-[var(--apple-gray-400)] mb-6">
              {modalAction === 'mark' 
                ? `Mark ${monthNames[currentDate.getMonth()]} ${selectedDay} as a day you completed reading?` 
                : `Remove ${monthNames[currentDate.getMonth()]} ${selectedDay} from your completed days?`}
            </p>
            <div className="flex flex-col-reverse sm:flex-row justify-end space-y-reverse space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowCalendarModal(false)}
                className="px-4 py-2 border border-[var(--apple-gray-300)] dark:border-[var(--apple-gray-600)] rounded-lg text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)]"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCalendarDay}
                className={`px-4 py-2 rounded-lg ${
                  modalAction === 'mark' 
                    ? 'bg-[#39e991] text-[var(--apple-gray-900)]' 
                    : 'bg-red-400 text-white'
                }`}
              >
                {modalAction === 'mark' ? 'Mark as Complete' : 'Remove Day'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
