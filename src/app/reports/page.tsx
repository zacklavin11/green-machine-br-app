"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Search, PlusCircle, Filter, ArrowLeft, Book, Calendar } from "lucide-react";
import { useAuth } from "../../lib/hooks/useAuth";
import { getDocuments } from "../../lib/firebase/firebaseUtils";
import { formatDistanceToNow } from "date-fns";

type Report = {
  id: string;
  userId: string;
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
  };
  actionItems: {
    text: string;
    completed: boolean;
  }[];
  createdAt: Date;
};

export default function ReportsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  
  // Fetch reports from Firebase
  useEffect(() => {
    let isMounted = true;
    const loadTimeout = setTimeout(() => {
      if (isMounted && loading && connectionAttempts < 3) {
        console.log("Loading timeout - retrying connection");
        setConnectionAttempts(prev => prev + 1);
        setLoading(false);
        // Force a re-render to trigger the effect again
        setTimeout(() => {
          if (isMounted) setLoading(true);
        }, 800);
      } else if (isMounted && loading) {
        setError("Connection issue detected. Please check your internet connection and try again.");
        setLoading(false);
      }
    }, 10000); // 10s timeout for initial loading attempt

    async function fetchReports() {
      if (!user) {
        if (isMounted) {
          setLoading(false);
          setError("Please sign in to view your reports");
        }
        return;
      }
      
      if (!isMounted) return;
      
      try {
        console.log(`Attempting to fetch reports (attempt ${retryCount + 1})`);
        if (isMounted) {
          setLoading(true);
          setError(null);
        }
        
        // Get reports where userId matches current user
        const fetchedReports = await getDocuments("reports");
        
        if (!isMounted) return;
        
        // Check if fetchedReports is valid before processing
        if (!Array.isArray(fetchedReports)) {
          console.error("Invalid reports data:", fetchedReports);
          if (isMounted) {
            setError("Failed to load reports. Please refresh the page or try again later.");
            setReports([]);
          }
        } else {
          const userReports = fetchedReports
            .filter((report: any) => report.userId === user.uid)
            .map((report: any) => ({
              ...report,
              createdAt: report.createdAt instanceof Date 
                ? report.createdAt 
                : new Date(report.createdAt?.seconds ? report.createdAt.seconds * 1000 : Date.now())
            }))
            .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
          
          if (isMounted) {
            setReports(userReports);
            setError(null); // Clear any previous errors
            console.log(`Successfully loaded ${userReports.length} reports`);
          }
        }
      } catch (error) {
        console.error("Error fetching reports:", error);
        if (isMounted) {
          setError("Failed to load reports. Please check your connection and try again.");
          // Ensure we exit loading state even on error
          setReports([]);
        }
      } finally {
        // Always set loading to false if component is still mounted
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    if (loading) {
      fetchReports();
    }
    
    return () => {
      isMounted = false;
      clearTimeout(loadTimeout);
    };
  }, [user, loading, retryCount]);

  // Function to manually retry loading reports
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setConnectionAttempts(0);
    setLoading(true);
    console.log("Manual retry initiated");
  };

  // Filter reports based on search term
  const filteredReports = reports.filter(report => 
    report.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.what.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.soWhat.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Link 
            href="/" 
            className="mr-4 p-2 rounded-full hover:bg-[var(--apple-gray-100)] dark:hover:bg-[var(--apple-gray-700)]"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5 text-[var(--apple-gray-500)]" />
          </Link>
          <h1 className="text-3xl font-bold text-[var(--apple-gray-900)] dark:text-white">All Reports</h1>
        </div>
        <Link
          href="/reports/new"
          className="apple-button-green flex items-center"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          New Report
        </Link>
      </div>

      {/* Search and filters */}
      <div className="apple-card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-[var(--apple-gray-400)]" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-[var(--apple-gray-300)] dark:border-[var(--apple-gray-600)] rounded-md shadow-sm focus:ring-[var(--reports-theme-color)] focus:border-[var(--reports-theme-color)] bg-white dark:bg-[var(--apple-gray-700)] text-[var(--apple-gray-900)] dark:text-white"
              placeholder="Search reports by title or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-[var(--apple-gray-300)] dark:border-[var(--apple-gray-600)] text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)] rounded-md hover:bg-[var(--apple-gray-50)] dark:hover:bg-[var(--apple-gray-700)]">
            <Filter className="h-5 w-5 mr-2" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="apple-card p-8 flex flex-col items-center justify-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[var(--reports-theme-color)]"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 bg-white dark:bg-[var(--apple-gray-800)] rounded-full"></div>
            </div>
          </div>
          <h2 className="text-xl font-bold text-[var(--apple-gray-900)] dark:text-white mt-4 mb-2">Loading your reports</h2>
          <p className="text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)]">
            This may take a moment...
          </p>
          {connectionAttempts > 0 && (
            <div className="mt-4 text-sm text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)]">
              Connection attempt {connectionAttempts + 1}/4
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="apple-card p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[var(--apple-gray-900)] dark:text-white mb-2">{error}</h2>
          <p className="text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)] mb-6 max-w-md mx-auto">
            There was a problem loading your reports. This might be due to a connection issue or server problem.
          </p>
          <button
            onClick={handleRetry}
            className="apple-button-green inline-flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry Loading
          </button>
          <div className="mt-4 text-sm text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)]">
            Attempt {retryCount + 1} of 4
          </div>
        </div>
      )}

      {/* Reports grid/list */}
      {!loading && !error && filteredReports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => (
            <Link href={`/reports/${report.id}`} key={report.id} className="apple-card hover:shadow-md transition-shadow group overflow-hidden">
              <div className="relative">
                {/* Colored top bar to indicate completion status */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${report.pdca?.didPlannedHappen && report.pdca?.hadUrgency && report.pdca?.managedTime ? 'bg-[var(--reports-theme-color)]' : 'bg-amber-400'}`}></div>
                
                {/* Card content with slightly more padding */}
                <div className="p-6 pt-7">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center">
                        <h2 className="text-lg font-bold text-[var(--apple-gray-900)] dark:text-white">
                          {report.dayNumber ? `Day ${report.dayNumber}` : 'No Day #'}
                        </h2>
                        {report.pdca?.didPlannedHappen && report.pdca?.hadUrgency && report.pdca?.managedTime && (
                          <div className="ml-2 flex items-center justify-center bg-[var(--reports-theme-color)] rounded-full h-5 w-5">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)] mt-1">
                        <Book className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="truncate max-w-[180px]">{report.bookTitle || 'Untitled Book'}</span>
                      </div>
                    </div>
                    <div className="text-xs text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)] flex flex-col items-end">
                      <div className="flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        <span>{report.date ? new Date(report.date).toLocaleDateString() : new Date(report.createdAt).toLocaleDateString()}</span>
                      </div>
                      <span className="mt-1 text-xs italic">
                        {formatDistanceToNow(report.createdAt, { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  
                  {/* PDCA indicators in a row */}
                  <div className="flex items-center space-x-1 mb-3">
                    <div className={`text-xs px-2 py-0.5 rounded-full ${report.pdca?.didPlannedHappen ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'}`}>
                      Plan
                    </div>
                    <div className={`text-xs px-2 py-0.5 rounded-full ${report.pdca?.hadUrgency ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'}`}>
                      Urgency
                    </div>
                    <div className={`text-xs px-2 py-0.5 rounded-full ${report.pdca?.managedTime ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'}`}>
                      Time
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <h3 className="text-xs font-medium text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)] uppercase mb-1">
                      Brief Summary
                    </h3>
                    <p className="text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)] text-sm line-clamp-2">
                      {report.what || 'No summary added'}
                    </p>
                  </div>
                  
                  <div className="mb-3">
                    <h3 className="text-xs font-medium text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)] uppercase mb-1">
                      Internalization
                    </h3>
                    <p className="text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)] text-sm line-clamp-2">
                      {report.soWhat || 'No internalization added'}
                    </p>
                  </div>
                  
                  {report.actionItems && report.actionItems.length > 0 && (
                    <div>
                      <h3 className="text-xs font-medium text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)] uppercase mb-1 flex items-center">
                        <span>Action Items</span>
                        <span className="ml-2 bg-[var(--apple-gray-100)] dark:bg-[var(--apple-gray-700)] text-xs px-1.5 py-0.5 rounded">
                          {report.actionItems.filter(item => item.completed).length}/{report.actionItems.length}
                        </span>
                      </h3>
                      <div className="text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)] text-sm">
                        {report.actionItems.slice(0, 2).map((item, index) => (
                          <div key={index} className="flex items-center mb-1">
                            <div className={`flex-shrink-0 h-3.5 w-3.5 rounded-full mr-2 flex items-center justify-center ${item.completed ? 'bg-[var(--reports-theme-color)]' : 'border border-[var(--apple-gray-400)]'}`}>
                              {item.completed && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <p className={`line-clamp-1 ${item.completed ? 'line-through text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-500)]' : ''}`}>{item.text}</p>
                          </div>
                        ))}
                        {report.actionItems.length > 2 && (
                          <p className="text-xs text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)] mt-1 ml-5">
                            +{report.actionItems.length - 2} more items
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* View details button that appears on hover */}
                  <div className="mt-4 pt-2 border-t border-[var(--apple-gray-200)] dark:border-[var(--apple-gray-700)] flex justify-end">
                    <span className="text-xs text-[var(--reports-theme-color)] font-medium group-hover:underline">
                      View Details →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : !loading ? (
        <div className="apple-card p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-[var(--reports-theme-color)]/10 flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-[var(--reports-theme-color)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--apple-gray-900)] dark:text-white mb-2">No reports yet</h2>
          <p className="text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)] mb-6 max-w-md mx-auto">
            Start tracking your running progress by creating your first report. Each report helps you build consistency and track your 90-day journey.
          </p>
          <Link
            href="/reports/new"
            className="apple-button-green inline-flex items-center"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Create First Report
          </Link>
        </div>
      ) : null}
    </div>
  );
} 