"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Calendar, PlusCircle, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuth } from "../../../lib/hooks/useAuth";
import { 
  addDocument, 
  getUserProfile, 
  updateUserStreak, 
  getLatestReport,
  getDocuments
} from "../../../lib/firebase/firebaseUtils";

export default function NewReportPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionItems, setActionItems] = useState([{ text: "", completed: false }]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagesError, setPagesError] = useState(false);
  const [showFeedbackMessage, setShowFeedbackMessage] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  
  const [formData, setFormData] = useState<{
    dayNumber: string;
    bookTitle: string;
    date: string;
    pages: string;
    what: string;
    soWhat: string;
    pdca: {
      didPlannedHappen: boolean;
      hadUrgency: boolean;
      managedTime: boolean;
      adjustments: string;
    }
  }>({
    dayNumber: "",
    bookTitle: "",
    date: new Date().toISOString().split('T')[0],
    pages: "",
    what: "",
    soWhat: "",
    pdca: {
      didPlannedHappen: false,
      hadUrgency: false,
      managedTime: false,
      adjustments: ""
    }
  });

  // Function to process report data and populate the form
  const processAndPopulateReport = (report: any) => {
    console.log("Processing report for form population:", report);
    
    if (!report) {
      console.log("No report data to process");
      setIsLoading(false);
      return;
    }
    
    try {
      // Calculate next day number
      const nextDayNumber = report.dayNumber ? String(Number(report.dayNumber) + 1) : "1";
      console.log("Calculated next day number:", nextDayNumber);
      
      // Extract page numbers to suggest next page
      let nextStartPage = "";
      if (report.pages) {
        console.log("Previous pages text:", report.pages);
        const pagesMatch = report.pages.match(/(\d+)-(\d+)/);
        if (pagesMatch && pagesMatch[2]) {
          nextStartPage = String(Number(pagesMatch[2]) + 1);
          console.log("Extracted next start page:", nextStartPage);
        } else {
          console.log("Could not extract page range from:", report.pages);
        }
      }
      
      // Prepare updated values
      const updatedValues = {
        bookTitle: report.bookTitle || '',
        dayNumber: nextDayNumber,
        pages: nextStartPage ? `${nextStartPage}-` : '',
      };
      
      console.log("Setting form data with values:", updatedValues);
      
      // Update form data
      setFormData(prevData => ({
        ...prevData,
        ...updatedValues
      }));
      
      console.log("Form data updated successfully");
      
      // Directly update DOM inputs as a fallback
      setTimeout(() => {
        try {
          const bookTitleInput = document.getElementById('bookTitle') as HTMLInputElement;
          const dayNumberInput = document.getElementById('dayNumber') as HTMLInputElement;
          const pagesInput = document.getElementById('pages') as HTMLInputElement;
          
          if (bookTitleInput) bookTitleInput.value = updatedValues.bookTitle;
          if (dayNumberInput) dayNumberInput.value = updatedValues.dayNumber;
          if (pagesInput) pagesInput.value = updatedValues.pages;
          
          console.log("Manual DOM update attempted");
        } catch (err) {
          console.error("Error updating DOM directly:", err);
        }
        
        // Ensure loading is set to false after DOM updates
        setIsLoading(false);
      }, 100);
    } catch (error) {
      console.error("Error processing report data:", error);
      setIsLoading(false);
    }
  };

  // Fetch the last report when component mounts
  useEffect(() => {
    const fetchPreviousReport = async () => {
      if (!user) {
        console.log("No user found, can't fetch previous report");
        setIsLoading(false);
        return;
      }
      
      console.log("Attempting to fetch previous report for user:", user.uid);
      setIsLoading(true);
      
      try {
        // Add demo data handler - this will provide example data when Firestore fails
        const useDemoData = () => {
          console.log("Using demo data to populate form");
          const demoReport = {
            id: "demo-report-id",
            bookTitle: "Atomic Habits",
            dayNumber: "3",
            pages: "25-42",
            createdAt: new Date()
          };
          processAndPopulateReport(demoReport);
        };
        
        // First try to get from localStorage as a fallback
        const cachedReportStr = localStorage.getItem('latestReport');
        let cachedReport = null;
        
        if (cachedReportStr) {
          try {
            cachedReport = JSON.parse(cachedReportStr);
            console.log("Found cached report:", cachedReport);
          } catch (e) {
            console.error("Error parsing cached report:", e);
          }
        }
        
        // Attempt to get the latest report from Firestore
        try {
          const latestReport = await getLatestReport(user.uid);
          
          // If we found a report from Firestore, use that and update the cache
          if (latestReport) {
            console.log("Found latest report from Firestore:", latestReport);
            
            // Cache the latest report in localStorage
            localStorage.setItem('latestReport', JSON.stringify(latestReport));
            
            // Process the latest report
            processAndPopulateReport(latestReport);
            return;
          } else {
            // No Firestore report found, try fallbacks
            if (cachedReport) {
              console.log("Using cached report instead:", cachedReport);
              processAndPopulateReport(cachedReport);
            } else {
              // Use demo data as last resort
              useDemoData();
            }
          }
        } catch (firestoreError) {
          console.error("Firestore error:", firestoreError);
          
          // If Firestore failed but we have a cached report, use that
          if (cachedReport) {
            console.log("Using cached report instead:", cachedReport);
            processAndPopulateReport(cachedReport);
          } else {
            // Use demo data as last resort
            useDemoData();
          }
        }
      } catch (error) {
        console.error("Error fetching previous report:", error);
        
        // Use demo data for development
        const demoReport = {
          id: "demo-report-id",
          bookTitle: "Atomic Habits",
          dayNumber: "3", 
          pages: "25-42",
          createdAt: new Date()
        };
        processAndPopulateReport(demoReport);
      }
    };
    
    fetchPreviousReport();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev };
      (newData as any)[name] = value;
      return newData;
    });
  };

  const handlePdcaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    const isCheckbox = (e.target as HTMLInputElement).type === 'checkbox';
    
    setFormData(prev => ({
      ...prev,
      pdca: {
        ...prev.pdca,
        [name]: isCheckbox ? checked : value
      }
    }));
  };

  const addActionItem = () => {
    setActionItems([...actionItems, { text: "", completed: false }]);
  };

  const updateActionItem = (index: number, text: string) => {
    const newItems = [...actionItems];
    newItems[index].text = text;
    setActionItems(newItems);
  };

  const removeActionItem = (index: number) => {
    setActionItems(actionItems.filter((_, i) => i !== index));
  };

  const toggleActionItem = (index: number) => {
    const newItems = [...actionItems];
    newItems[index].completed = !newItems[index].completed;
    setActionItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert("Please sign in to create a report");
      return;
    }
    
    // Form validation
    if (!formData.bookTitle.trim()) {
      alert("Please enter a book title");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Filter out empty action items
      const filteredActionItems = actionItems.filter(item => item.text.trim() !== "");
      
      // Prepare report data with user ID
      const reportData = {
        ...formData,
        actionItems: filteredActionItems,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log("Saving report to Firestore...");
      
      // Save to Firebase
      const docRef = await addDocument("reports", reportData);
      const docId = docRef?.id;
      
      if (!docId) {
        throw new Error("Failed to get document ID after saving");
      }
      
      console.log("Report saved successfully with ID:", docId);
      
      // Update user streak data
      try {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Get existing streak data
        const userProfile = await getUserProfile(user.uid);
        
        // Define the streak data type
        interface StreakData {
          activeCalendarDays: number[];
          currentStreak: number;
          lastActiveDate: string | null;
          longestStreak: number;
          completionRate: number;
          totalReports: number;
        }
        
        // Initialize with proper typing
        let streakData: StreakData = userProfile?.streakData as StreakData || { 
          activeCalendarDays: [], 
          currentStreak: 0,
          lastActiveDate: null,
          longestStreak: 0,
          completionRate: 0,
          totalReports: 0
        };
        
        // Ensure activeCalendarDays is an array
        if (!Array.isArray(streakData.activeCalendarDays)) {
          streakData.activeCalendarDays = [];
        }
        
        // Add today to active calendar days if not already present
        const todayDate = new Date().getDate(); // Get day of month as a number
        if (!streakData.activeCalendarDays.includes(todayDate)) {
          streakData.activeCalendarDays.push(todayDate);
          
          // Update streak counter
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          if (streakData.lastActiveDate === yesterdayStr) {
            streakData.currentStreak += 1;
          } else if (streakData.lastActiveDate !== today) {
            streakData.currentStreak = 1;
          }
          
          streakData.lastActiveDate = today;
          
          // Calculate completion rate for the current month
          const calculateCompletionRate = async () => {
            // Get the current month's active days
            const activeCalendarDays = streakData.activeCalendarDays || [];
            
            // Get all reports for the current month
            try {
              const allReports = await getDocuments("reports");
              if (!Array.isArray(allReports)) return 0;
              
              const currentDate = new Date();
              
              // Filter for user's reports from current month
              const userReportsThisMonth = allReports.filter((report: any) => {
                if (report.userId !== user.uid) return false;
                
                const reportDate = report.createdAt instanceof Date 
                  ? report.createdAt 
                  : new Date(report.createdAt?.seconds ? report.createdAt.seconds * 1000 : Date.now());
                
                return reportDate.getMonth() === currentDate.getMonth() && 
                       reportDate.getFullYear() === currentDate.getFullYear();
              });
              
              // Collect report days for the current month
              const reportDays = new Set<number>();
              userReportsThisMonth.forEach((report: any) => {
                const reportDate = new Date(report.createdAt);
                reportDays.add(reportDate.getDate());
              });
              
              // Also add this new report's day
              const todayDate = new Date().getDate();
              reportDays.add(todayDate);
              
              // Combine with active calendar days
              const combinedActiveDays = new Set([
                ...activeCalendarDays,
                ...Array.from(reportDays)
              ]);
              
              // Get days in current month
              const daysInMonth = new Date(
                currentDate.getFullYear(), 
                currentDate.getMonth() + 1, 
                0
              ).getDate();
              
              // For current month, only consider days up to today
              const totalDaysToConsider = currentDate.getDate();
              
              // Filter to only include days up to today
              const validActiveDays = Array.from(combinedActiveDays).filter(day => day <= totalDaysToConsider);
              
              // Calculate percentage
              const completionPercentage = Math.round((validActiveDays.length / totalDaysToConsider) * 100);
              
              return completionPercentage;
            } catch (error) {
              console.error("Error calculating completion rate:", error);
              return 0;
            }
          };
          
          // Calculate the completion rate
          const completionRate = await calculateCompletionRate();
          
          // Update streak data with completion rate and increment total reports
          streakData.completionRate = completionRate;
          streakData.totalReports = (streakData.totalReports || 0) + 1;
          
          // Save streak data
          await updateUserStreak(user.uid, streakData);
          console.log("User streak updated successfully");
        }
      } catch (streakError) {
        console.error("Error updating streak:", streakError);
        // Don't fail the entire operation if streak update fails
      }
      
      // Show success message
      alert("Report saved successfully!");
      
      // Add a longer delay before redirecting to ensure Firestore has time to process
      // This helps prevent loading issues on the reports page
      setTimeout(() => {
        // Redirect to reports page after submission
        router.push("/reports");
      }, 2500);
    } catch (error) {
      console.error("Error saving report:", error);
      alert("Failed to save report. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link 
            href="/reports" 
            className="mr-4 p-2 rounded-full hover:bg-[var(--apple-gray-100)] dark:hover:bg-[var(--apple-gray-700)]"
            aria-label="Back to reports"
          >
            <ArrowLeft className="h-5 w-5 text-[var(--apple-gray-500)]" />
          </Link>
          <h1 className="text-2xl font-bold text-[var(--apple-gray-900)] dark:text-white">Create New Report</h1>
        </div>
      </div>

      <div className="apple-card">
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--reports-theme-color)] mx-auto"></div>
              <span className="ml-3 text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)]">Loading previous report data...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h2 className="text-xl font-semibold text-[var(--apple-gray-900)] dark:text-white mb-2">Report Details</h2>
              <p className="text-[var(--apple-gray-600)] dark:text-[var(--apple-gray-400)] mb-6 text-sm">Fill in the details of your daily book report.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Day # */}
                <div>
                  <label className="block text-sm font-medium text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)] mb-1">
                    Day #
                  </label>
                  <input
                    type="text"
                    name="dayNumber"
                    value={formData.dayNumber}
                    onChange={handleChange}
                    className="block w-full py-2 px-3 border border-[var(--apple-gray-300)] dark:border-[var(--apple-gray-600)] rounded-md shadow-sm focus:ring-[var(--reports-theme-color)] focus:border-[var(--reports-theme-color)] bg-white dark:bg-[var(--apple-gray-700)] text-[var(--apple-gray-900)] dark:text-white"
                    placeholder="e.g. 1, 2, 3, etc."
                  />
                </div>
                
                {/* Book Title */}
                <div>
                  <label className="block text-sm font-medium text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)] mb-1">
                    Book Title
                  </label>
                  <input
                    type="text"
                    name="bookTitle"
                    value={formData.bookTitle}
                    onChange={handleChange}
                    className="block w-full py-2 px-3 border border-[var(--apple-gray-300)] dark:border-[var(--apple-gray-600)] rounded-md shadow-sm focus:ring-[var(--reports-theme-color)] focus:border-[var(--reports-theme-color)] bg-white dark:bg-[var(--apple-gray-700)] text-[var(--apple-gray-900)] dark:text-white"
                    placeholder="Enter book title"
                  />
                </div>
              </div>
              
              {/* Date */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)] mb-1">
                  Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-[var(--apple-gray-400)]" />
                  </div>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="block w-full py-2 pl-10 pr-3 border border-[var(--apple-gray-300)] dark:border-[var(--apple-gray-600)] rounded-md shadow-sm focus:ring-[var(--reports-theme-color)] focus:border-[var(--reports-theme-color)] bg-white dark:bg-[var(--apple-gray-700)] text-[var(--apple-gray-900)] dark:text-white"
                  />
                </div>
              </div>
              
              {/* Pages Read */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)] mb-1">
                  Pages Read
                </label>
                <input
                  type="text"
                  name="pages"
                  value={formData.pages}
                  onChange={handleChange}
                  className="block w-full py-2 px-3 border border-[var(--apple-gray-300)] dark:border-[var(--apple-gray-600)] rounded-md shadow-sm focus:ring-[var(--reports-theme-color)] focus:border-[var(--reports-theme-color)] bg-white dark:bg-[var(--apple-gray-700)] text-[var(--apple-gray-900)] dark:text-white"
                  placeholder="e.g. 10-25 or Chapter 3"
                />
              </div>

              {/* PDCA Section */}
              <div className="bg-[var(--reports-theme-color)]/10 dark:bg-[var(--reports-theme-color)]/5 p-4 rounded-md mb-6 border border-[var(--reports-theme-color)]/20 dark:border-[var(--reports-theme-color)]/10">
                <h3 className="font-semibold text-[var(--apple-gray-900)] dark:text-white mb-3">Daily PDCA:</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <div className="flex h-5 items-center">
                      <input
                        type="checkbox"
                        name="didPlannedHappen"
                        checked={formData.pdca.didPlannedHappen}
                        onChange={handlePdcaChange}
                        className="h-4 w-4 rounded border-[var(--apple-gray-300)] text-[var(--reports-theme-color)] focus:ring-[var(--reports-theme-color)]"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label className="font-medium text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)]">Did what I planned happen?</label>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="flex h-5 items-center">
                      <input
                        type="checkbox"
                        name="hadUrgency"
                        checked={formData.pdca.hadUrgency}
                        onChange={handlePdcaChange}
                        className="h-4 w-4 rounded border-[var(--apple-gray-300)] text-[var(--reports-theme-color)] focus:ring-[var(--reports-theme-color)]"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label className="font-medium text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)]">Did I have a sense of urgency in each of my appointments?</label>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="flex h-5 items-center">
                      <input
                        type="checkbox"
                        name="managedTime"
                        checked={formData.pdca.managedTime}
                        onChange={handlePdcaChange}
                        className="h-4 w-4 rounded border-[var(--apple-gray-300)] text-[var(--reports-theme-color)] focus:ring-[var(--reports-theme-color)]"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label className="font-medium text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)]">Did I manage my time so that all urgent and important things happened?</label>
                    </div>
                  </li>
                  <li className="mt-3">
                    <label className="block text-sm font-medium text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)] mb-1">
                      What did I learn, and if needed, how can I adjust?
                    </label>
                    <textarea
                      name="adjustments"
                      value={formData.pdca.adjustments}
                      onChange={handlePdcaChange}
                      rows={2}
                      className="block w-full py-2 px-3 border border-[var(--apple-gray-300)] dark:border-[var(--apple-gray-600)] rounded-md shadow-sm focus:ring-[var(--reports-theme-color)] focus:border-[var(--reports-theme-color)] bg-white dark:bg-[var(--apple-gray-700)] text-[var(--apple-gray-900)] dark:text-white"
                      placeholder="Note any adjustments needed..."
                    ></textarea>
                  </li>
                </ul>
              </div>
              
              {/* What -> Brief Summary */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)] mb-1">
                  Brief Summary
                </label>
                <textarea
                  name="what"
                  value={formData.what}
                  onChange={handleChange}
                  rows={4}
                  className="block w-full py-3 px-4 border border-[var(--apple-gray-300)] dark:border-[var(--apple-gray-600)] rounded-md shadow-sm focus:ring-[var(--reports-theme-color)] focus:border-[var(--reports-theme-color)] bg-white dark:bg-[var(--apple-gray-700)] text-[var(--apple-gray-900)] dark:text-white"
                  placeholder="Briefly summarize what you read..."
                ></textarea>
              </div>
              
              {/* So What -> Internalization */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)] mb-1">
                  Internalization
                </label>
                <textarea
                  name="soWhat"
                  value={formData.soWhat}
                  onChange={handleChange}
                  rows={4}
                  className="block w-full py-2 px-3 border border-[var(--apple-gray-300)] dark:border-[var(--apple-gray-600)] rounded-md shadow-sm focus:ring-[var(--reports-theme-color)] focus:border-[var(--reports-theme-color)] bg-white dark:bg-[var(--apple-gray-700)] text-[var(--apple-gray-900)] dark:text-white"
                  placeholder="How have you internalized what you read?"
                ></textarea>
              </div>
              
              {/* What Now -> Action Items */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)]">
                    Action Items
                  </label>
                  <button 
                    type="button" 
                    onClick={addActionItem}
                    className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-[var(--reports-theme-color)] bg-[var(--reports-theme-color)]/10 hover:bg-[var(--reports-theme-color)]/20 dark:bg-[var(--reports-theme-color)]/5 dark:hover:bg-[var(--reports-theme-color)]/10"
                  >
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Add Item
                  </button>
                </div>
                
                <div className="space-y-2">
                  {actionItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => toggleActionItem(index)}
                        className="h-4 w-4 rounded border-[var(--apple-gray-300)] text-[var(--reports-theme-color)] focus:ring-[var(--reports-theme-color)]"
                      />
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => updateActionItem(index, e.target.value)}
                        className="block w-full py-2 px-3 border border-[var(--apple-gray-300)] dark:border-[var(--apple-gray-600)] rounded-md shadow-sm focus:ring-[var(--reports-theme-color)] focus:border-[var(--reports-theme-color)] bg-white dark:bg-[var(--apple-gray-700)] text-[var(--apple-gray-900)] dark:text-white"
                        placeholder="Add an action item..."
                      />
                      <button
                        type="button"
                        onClick={() => removeActionItem(index)}
                        className="p-2 text-[var(--apple-gray-500)] hover:text-red-500 dark:text-[var(--apple-gray-400)]"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Submit button */}
              <div className="flex justify-between mt-8">
                <Link
                  href="/reports"
                  className="px-4 py-2 border border-[var(--apple-gray-300)] dark:border-[var(--apple-gray-600)] text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)] rounded-md hover:bg-[var(--apple-gray-50)] dark:hover:bg-[var(--apple-gray-700)]"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="apple-button-green flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                      <span>Saving Report...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="h-5 w-5 mr-2" />
                      <span>Create Report</span>
                    </>
                  )}
                </button>
              </div>

              {/* Loading overlay */}
              {isSubmitting && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white dark:bg-[var(--apple-gray-800)] rounded-lg p-8 max-w-md w-full shadow-xl text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--reports-theme-color)] mx-auto mb-4"></div>
                    <h2 className="text-xl font-bold text-[var(--apple-gray-900)] dark:text-white mb-2">
                      Saving Your Report
                    </h2>
                    <p className="text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)]">
                      Please wait while we save your report. This may take a moment...
                    </p>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 