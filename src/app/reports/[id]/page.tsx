"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Book, CheckCircle, XCircle, Clock, Loader2, Download, Send, Share2, FileText, Camera } from "lucide-react";
import { useAuth } from "../../../lib/hooks/useAuth";
import { getDocuments, getUserProfile, updateDocument } from "../../../lib/firebase/firebaseUtils";
import { format, formatDistanceToNow } from "date-fns";
import dynamic from "next/dynamic";

// Import html2canvas properly
import html2canvas from 'html2canvas';

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

export default function ReportPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let loadingTimeout: NodeJS.Timeout;

    async function fetchReport() {
      if (!user) {
        if (isMounted) {
          setLoading(false);
          setError("Please sign in to view this report");
        }
        return;
      }

      try {
        if (isMounted) {
          setLoading(true);
          setError(null);
          setLoadingStartTime(Date.now());
        }
        
        console.log(`Fetching report ${params.id} (attempt ${retryCount + 1})`);
        const reports = await getDocuments("reports");
        
        if (!isMounted) return;
        
        // Handle case where reports is undefined or not an array
        if (!Array.isArray(reports)) {
          console.error("Reports data is invalid:", reports);
          if (isMounted) {
            setError("Failed to load report data. Please try again.");
            setLoading(false);
          }
          return;
        }
        
        const foundReport = reports.find((r: any) => r.id === params.id) as any;
        
        if (!foundReport) {
          if (isMounted) {
            setError("Report not found. It may have been deleted.");
            setLoading(false);
          }
          return;
        }
        
        if (foundReport.userId !== user.uid) {
          if (isMounted) {
            setError("You don't have permission to view this report");
            setLoading(false);
          }
          return;
        }
        
        // Convert Firestore timestamp to Date if needed
        const reportWithDate: Report = {
          id: foundReport.id,
          userId: foundReport.userId,
          dayNumber: foundReport.dayNumber || '',
          bookTitle: foundReport.bookTitle || '',
          date: foundReport.date || '',
          pages: foundReport.pages || '',
          what: foundReport.what || '',
          soWhat: foundReport.soWhat || '',
          pdca: foundReport.pdca || {
            didPlannedHappen: false,
            hadUrgency: false,
            managedTime: false,
            adjustments: ''
          },
          actionItems: foundReport.actionItems || [],
          createdAt: foundReport.createdAt instanceof Date 
            ? foundReport.createdAt 
            : new Date(foundReport.createdAt?.seconds ? foundReport.createdAt.seconds * 1000 : Date.now())
        };
        
        if (isMounted) {
          setReport(reportWithDate);
          setLoading(false);
          setLoadingStartTime(null);
          console.log("Report loaded successfully");
        }
      } catch (err) {
        console.error("Error fetching report:", err);
        if (isMounted) {
          setError("Failed to load report. Please try again.");
          setLoading(false);
          setLoadingStartTime(null);
        }
      }
    }
    
    if (loading) {
      fetchReport();
      
      // Set a timeout to ensure loading state doesn't persist indefinitely
      loadingTimeout = setTimeout(() => {
        if (isMounted && loading) {
          const timeElapsed = loadingStartTime ? Date.now() - loadingStartTime : 0;
          console.log(`Loading timeout reached after ${timeElapsed}ms`);
          
          if (retryCount < 3) {
            // Auto retry up to 3 times
            console.log("Auto-retrying report fetch...");
            if (isMounted) {
              setRetryCount(prev => prev + 1);
              // Reset the loading state to trigger a new fetch
              setLoading(false);
              setTimeout(() => {
                if (isMounted) setLoading(true);
              }, 800);
            }
          } else {
            if (isMounted) {
              setError("Loading took too long. Please try again later.");
              setLoading(false);
            }
          }
        }
      }, 8000); // 8 second timeout
    }
    
    return () => {
      isMounted = false;
      if (loadingTimeout) clearTimeout(loadingTimeout);
    };
  }, [params.id, user, loading, retryCount, loadingStartTime]);

  useEffect(() => {
    let isMounted = true;

    async function fetchUserName() {
      if (!user) return;

      try {
        if (isMounted) {
          // First try to use the display name directly from Firebase Auth
          if (user.displayName) {
            setUserName(user.displayName);
            return;
          }
          
          // Fall back to profile in Firestore if no display name
          const userProfile = await getUserProfile(user.uid);
          if (userProfile) {
            setUserName(userProfile.name || user.email || null);
          }
        }
      } catch (err) {
        console.error("Error fetching user name:", err);
        // Fallback to email if available
        if (user.email && isMounted) {
          setUserName(user.email);
        }
      }
    }

    if (user) {
      fetchUserName();
    }

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Function to manually retry loading the report
  const handleRetry = () => {
    setRetryCount(0);
    setLoadingStartTime(null);
    setError(null);
    setLoading(true);
    console.log("Manual retry initiated for report fetch");
  };

  // Function to toggle action item completion status
  const handleToggleActionItem = async (index: number, newStatus: boolean) => {
    if (!report || !user) return;
    
    try {
      // Create a copy of the action items and update the completed status
      const updatedActionItems = [...report.actionItems];
      updatedActionItems[index] = {
        ...updatedActionItems[index],
        completed: newStatus
      };
      
      // Update the report in the database
      await updateDocument("reports", report.id, {
        actionItems: updatedActionItems
      });
      
      // Update the local state
      setReport({
        ...report,
        actionItems: updatedActionItems
      });
    } catch (error) {
      console.error("Error updating action item:", error);
      alert("Failed to update action item. Please try again.");
    }
  };

  // Update the captureReportAsImage function to use html2canvas directly
  const captureReportAsImage = async () => {
    if (!report) return;
    
    setIsExporting(true);
    
    try {
      const reportElement = document.getElementById('report-container');
      
      if (!reportElement) {
        throw new Error('Report element not found');
      }
      
      // Display a message that we're generating the image
      const captureMessage = document.createElement('div');
      captureMessage.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
      captureMessage.innerHTML = `
        <div class="bg-white dark:bg-[var(--apple-gray-800)] p-6 rounded-lg text-center">
          <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--reports-theme-color)] mx-auto mb-4"></div>
          <p class="text-[var(--apple-gray-900)] dark:text-white font-medium">Capturing report as image...</p>
        </div>
      `;
      document.body.appendChild(captureMessage);
      
      // Wait a moment to ensure the message is displayed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use html2canvas to capture the report as an image with improved settings for SMS sharing
      const canvas = await html2canvas(reportElement, {
        scale: 1.5, // Slightly lower resolution for better compatibility
        useCORS: true,
        logging: false,
        backgroundColor: window.getComputedStyle(document.body).backgroundColor,
        windowHeight: document.documentElement.offsetHeight,
        windowWidth: document.documentElement.offsetWidth,
        height: reportElement.scrollHeight + 40, // Extra padding to ensure footer is captured
        onclone: (clonedDoc) => {
          // Make sure all elements are fully expanded in the clone
          const clonedContainer = clonedDoc.getElementById('report-container');
          if (clonedContainer) {
            clonedContainer.style.padding = '0 0 40px 0'; // Increased padding at bottom
            
            // Add extra styling to make sure footer is visible
            const clonedFooter = clonedDoc.getElementById('report-footer');
            if (clonedFooter) {
              clonedFooter.style.padding = '20px 0';
              clonedFooter.style.marginTop = '20px';
              clonedFooter.style.borderTop = '1px solid #eee';
              clonedFooter.style.fontWeight = 'bold';
            }
          }
        }
      });
      
      // Remove the capture message
      document.body.removeChild(captureMessage);
      
      // Convert the canvas to a data URL - using JPEG format with 0.9 quality for better SMS compatibility
      const imageUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      // Create a simple filename
      const fileName = `Day${report.dayNumber}Report.jpg`;
      
      // Create a blob from the image URL
      const blob = await (await fetch(imageUrl)).blob();
      
      // Create custom modal instead of using confirm()
      const modalElement = document.createElement('div');
      modalElement.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
      modalElement.innerHTML = `
        <div class="bg-white dark:bg-[var(--apple-gray-800)] p-6 rounded-lg text-center max-w-md w-full mx-4">
          <div class="mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[var(--reports-theme-color)] mx-auto">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </div>
          <h3 class="text-[var(--apple-gray-900)] dark:text-white text-xl font-bold mb-2">Your report image is ready!</h3>
          <p class="text-[var(--apple-gray-600)] dark:text-[var(--apple-gray-300)] mb-6">How would you like to share it?</p>
          <div class="flex flex-col space-y-3">
            <button id="downloadBtn" class="apple-button-green w-full py-3">Download</button>
            <button id="shareBtn" class="border border-[var(--apple-gray-300)] dark:border-[var(--apple-gray-600)] rounded-lg py-3 px-4 text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)] hover:bg-[var(--apple-gray-50)] dark:hover:bg-[var(--apple-gray-700)] transition w-full">Direct sharing</button>
          </div>
        </div>
      `;
      document.body.appendChild(modalElement);
      
      // Add event listeners for the buttons
      return new Promise((resolve) => {
        const downloadBtn = modalElement.querySelector('#downloadBtn');
        const shareBtn = modalElement.querySelector('#shareBtn');
        
        if (downloadBtn) {
          downloadBtn.addEventListener('click', async () => {
            document.body.removeChild(modalElement);
            
            // User chose download - create a download link
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            alert("Image downloaded successfully! You can now attach it to your message.");
            resolve(true);
          });
        }
        
        if (shareBtn) {
          shareBtn.addEventListener('click', async () => {
            document.body.removeChild(modalElement);
            
            // User wants to try direct sharing
            try {
              // Create File object from Blob
              const file = new File([blob], fileName, { type: 'image/jpeg' });
              
              if (navigator.share) {
                // Check if device supports sharing files
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                  try {
                    await navigator.share({
                      files: [file],
                      title: `90 Day Run Tracker - Day ${report.dayNumber}`,
                      text: `Day ${report.dayNumber} Report for ${report.bookTitle || 'Book'}`
                    });
                    console.log('File shared successfully');
                    resolve(true);
                    return; // Exit early on successful share
                  } catch (shareError) {
                    console.error('Error sharing file:', shareError);
                    // Continue to text-only sharing attempt
                  }
                }
                
                // Try text-only sharing if file sharing fails or isn't supported
                try {
                  await navigator.share({
                    title: `90 Day Run Tracker - Day ${report.dayNumber}`,
                    text: `Day ${report.dayNumber} Report for ${report.bookTitle || 'Book'}`
                  });
                  console.log('Text shared successfully');
                  
                  // Also download the file since we can't share it directly
                  const link = document.createElement('a');
                  link.href = imageUrl;
                  link.download = fileName;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  
                  alert("We've shared the text and downloaded the image for you to share separately.");
                  resolve(true);
                  return; // Exit early on successful share
                } catch (textShareError) {
                  console.error('Error sharing text:', textShareError);
                  throw new Error('Both file and text sharing failed');
                }
              } else {
                // Web Share API not supported
                throw new Error('Web Share API not supported');
              }
            } catch (error) {
              console.error('Error sharing:', error);
              
              // On any error, silently fall back to download without alerts
              const link = document.createElement('a');
              link.href = imageUrl;
              link.download = fileName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              
              resolve(false);
            }
          });
        }
      });
    } catch (err) {
      console.error('Error capturing report:', err);
      alert('Failed to capture report as image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="apple-card p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--reports-theme-color)] mb-4"></div>
            <h2 className="text-xl font-bold text-[var(--apple-gray-900)] dark:text-white mb-2">Loading report...</h2>
            <p className="text-[var(--apple-gray-600)] dark:text-[var(--apple-gray-400)]">
              This may take a moment. Please wait.
            </p>
            {retryCount > 0 && (
              <p className="text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)] mt-2 text-sm">
                Attempt {retryCount + 1} of 4...
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="apple-card p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="text-red-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[var(--apple-gray-900)] dark:text-white mb-2">{error}</h2>
            <p className="text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)] mb-6">
              {error.includes("sign in") 
                ? "You need to be logged in to view this report." 
                : error.includes("permission")
                  ? "You don't have access to this report."
                  : "There was a problem loading this report."}
            </p>
            <div className="flex space-x-4">
              <Link
                href="/reports"
                className="px-4 py-2 border border-[var(--apple-gray-300)] dark:border-[var(--apple-gray-600)] rounded-md text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)] hover:bg-[var(--apple-gray-50)] dark:hover:bg-[var(--apple-gray-700)]"
              >
                Back to Reports
              </Link>
              {!error.includes("sign in") && !error.includes("permission") && !error.includes("not found") && (
                <button
                  onClick={handleRetry}
                  className="apple-button-green flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8 text-center">
        <div className="apple-card p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="text-[var(--apple-gray-400)] mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[var(--apple-gray-900)] dark:text-white mb-2">Report Not Found</h2>
            <p className="text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)] mb-6">
              The report you're looking for doesn't exist or has been deleted.
            </p>
            <Link
              href="/reports"
              className="apple-button-green"
            >
              Back to Reports
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-[var(--apple-gray-900)] dark:text-white">
            {report.dayNumber ? `Day ${report.dayNumber}` : 'Report'}
          </h1>
        </div>
        <div className="flex space-x-2">
          <Link
            href={`/reports/edit/${params.id}`}
            className="apple-button-green flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Report
          </Link>
          <button 
            onClick={captureReportAsImage}
            disabled={isExporting}
            className="apple-button-blue flex items-center"
          >
            <Camera className="h-5 w-5 mr-2" />
            {isExporting ? 'Capturing...' : 'Share as Image'}
          </button>
        </div>
      </div>

      <div id="report-container" className="max-w-4xl mx-auto">
        {/* Report header with user info */}
        <div className="apple-card mb-6 overflow-hidden">
          <div className={`absolute inset-0 flex items-start justify-center rounded-t-md ${report.pdca?.didPlannedHappen && report.pdca?.hadUrgency && report.pdca?.managedTime ? 'bg-[var(--reports-theme-color)]' : 'bg-amber-400'}`}></div>
          <div className="relative px-8 py-6 border-b border-[var(--apple-gray-200)] dark:border-[var(--apple-gray-700)]">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-[var(--apple-gray-900)] dark:text-white">
                    {report.dayNumber ? `Day ${report.dayNumber}` : 'Report'}
                  </h1>
                  {report.pdca?.didPlannedHappen && report.pdca?.hadUrgency && report.pdca?.managedTime && (
                    <div className="flex items-center justify-center bg-[var(--reports-theme-color)] rounded-full h-6 w-6">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 items-center mt-2">
                  <div className="flex items-center text-sm text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)]">
                    <span className="font-medium">Book:</span>
                    <span className="ml-2">{report.bookTitle || 'Untitled Book'}</span>
                  </div>
                  <div className="flex items-center text-sm text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)]">
                    <span className="font-medium">Date:</span>
                    <span className="ml-2">{format(report.createdAt, 'PPP')}</span>
                  </div>
                  {report.pages && (
                    <div className="flex items-center text-sm text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)]">
                      <span className="font-medium">Pages:</span>
                      <span className="ml-2">{report.pages}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)]">
                  <span className="font-medium">Created by:</span>
                  <span className="ml-2">{userName || (user?.displayName || user?.email || 'Anonymous User')}</span>
                </div>
                <div className="text-xs text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)] mt-1">
                  {formatDistanceToNow(report.createdAt, { addSuffix: true })}
                </div>
              </div>
            </div>
            
            {/* PDCA indicators in a row */}
            <div className="flex items-center space-x-2 mt-4">
              <div className={`text-xs px-3 py-1 rounded-full ${report.pdca?.didPlannedHappen ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'}`}>
                Planned: {report.pdca?.didPlannedHappen ? 'Yes' : 'No'}
              </div>
              <div className={`text-xs px-3 py-1 rounded-full ${report.pdca?.hadUrgency ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'}`}>
                Urgency: {report.pdca?.hadUrgency ? 'Yes' : 'No'}
              </div>
              <div className={`text-xs px-3 py-1 rounded-full ${report.pdca?.managedTime ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'}`}>
                Time Management: {report.pdca?.managedTime ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
        
          {/* Brief Summary */}
          <div className="px-8 py-6 border-b border-[var(--apple-gray-200)] dark:border-[var(--apple-gray-700)]">
            <h2 className="text-xl font-bold text-[var(--apple-gray-900)] dark:text-white mb-4">Brief Summary</h2>
            <div className="text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)] whitespace-pre-wrap">
              {report.what || 'No summary added'}
            </div>
          </div>
        
          {/* Internalization */}
          <div className="px-8 py-6 border-b border-[var(--apple-gray-200)] dark:border-[var(--apple-gray-700)]">
            <h2 className="text-xl font-bold text-[var(--apple-gray-900)] dark:text-white mb-4">Internalization</h2>
            <div className="text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)] whitespace-pre-wrap">
              {report.soWhat || 'No internalization added'}
            </div>
          </div>
        
          {/* PDCA Analysis */}
          <div className="px-8 py-6 border-b border-[var(--apple-gray-200)] dark:border-[var(--apple-gray-700)]">
            <h2 className="text-xl font-bold text-[var(--apple-gray-900)] dark:text-white mb-4">PDCA Analysis</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className={`p-4 rounded-lg border ${report.pdca?.didPlannedHappen ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20' : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20'}`}>
                <div className="flex items-center">
                  <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${report.pdca?.didPlannedHappen ? 'bg-green-500' : 'bg-red-500'}`}>
                    {report.pdca?.didPlannedHappen ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className={`text-sm font-medium ${report.pdca?.didPlannedHappen ? 'text-green-800 dark:text-green-100' : 'text-red-800 dark:text-red-100'}`}>PLANNED HAPPENED</h3>
                    <p className={`text-xs ${report.pdca?.didPlannedHappen ? 'text-green-700 dark:text-green-200' : 'text-red-700 dark:text-red-200'}`}>
                      {report.pdca?.didPlannedHappen ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className={`p-4 rounded-lg border ${report.pdca?.hadUrgency ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20' : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20'}`}>
                <div className="flex items-center">
                  <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${report.pdca?.hadUrgency ? 'bg-green-500' : 'bg-red-500'}`}>
                    {report.pdca?.hadUrgency ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className={`text-sm font-medium ${report.pdca?.hadUrgency ? 'text-green-800 dark:text-green-100' : 'text-red-800 dark:text-red-100'}`}>HAD URGENCY</h3>
                    <p className={`text-xs ${report.pdca?.hadUrgency ? 'text-green-700 dark:text-green-200' : 'text-red-700 dark:text-red-200'}`}>
                      {report.pdca?.hadUrgency ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className={`p-4 rounded-lg border ${report.pdca?.managedTime ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20' : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20'}`}>
                <div className="flex items-center">
                  <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${report.pdca?.managedTime ? 'bg-green-500' : 'bg-red-500'}`}>
                    {report.pdca?.managedTime ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className={`text-sm font-medium ${report.pdca?.managedTime ? 'text-green-800 dark:text-green-100' : 'text-red-800 dark:text-red-100'}`}>MANAGED TIME</h3>
                    <p className={`text-xs ${report.pdca?.managedTime ? 'text-green-700 dark:text-green-200' : 'text-red-700 dark:text-red-200'}`}>
                      {report.pdca?.managedTime ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)] mb-2">Adjustments for Next Time</h3>
              <div className="p-4 rounded-lg border border-[var(--apple-gray-200)] dark:border-[var(--apple-gray-700)] bg-[var(--apple-gray-50)] dark:bg-[var(--apple-gray-800)]">
                <p className="text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)] text-sm whitespace-pre-wrap">
                  {report.pdca?.adjustments || 'No adjustments noted'}
                </p>
              </div>
            </div>
          </div>
        
          {/* Action Items */}
          {report.actionItems && report.actionItems.length > 0 && (
            <div className="px-8 py-6">
              <h2 className="text-xl font-bold text-[var(--apple-gray-900)] dark:text-white mb-4 flex items-center">
                <span>Action Items</span>
                <span className="ml-3 px-3 py-1 rounded-full text-xs font-medium bg-[var(--apple-gray-100)] dark:bg-[var(--apple-gray-700)] text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)]">
                  {report.actionItems.filter(item => item.completed).length}/{report.actionItems.length} completed
                </span>
              </h2>
              <div className="space-y-3">
                {report.actionItems.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <div 
                      onClick={() => handleToggleActionItem(index, !item.completed)}
                      className={`flex-shrink-0 h-5 w-5 rounded-full mr-3 flex items-center justify-center cursor-pointer ${item.completed ? 'bg-[var(--reports-theme-color)]' : 'border border-[var(--apple-gray-400)]'}`}
                    >
                      {item.completed && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <p className={`text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)] ${item.completed ? 'line-through text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-500)]' : ''}`}>
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div id="report-footer" className="text-center text-xs text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)] mt-4 py-4">
          Created {format(report.createdAt, 'PPP')} at {format(report.createdAt, 'p')} • 90 Day Run Tracker
        </div>
      </div>
    </div>
  );
} 