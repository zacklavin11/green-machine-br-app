"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import { Book } from "../lib/types";
import { updateBook } from "../lib/firebase/bookReportUtils";
import Button from "./ui/Button";

interface EReaderProps {
  book: Book;
  onPageChange?: (currentPage: number) => void;
}

export default function EReader({ book, onPageChange }: EReaderProps) {
  const [currentPage, setCurrentPage] = useState(book.currentPage || 1);
  const [isLoading, setIsLoading] = useState(true);

  // This is a simplified version that doesn't actually render PDF/EPUB
  // In a real implementation, you would integrate with PDF.js or epub.js
  useEffect(() => {
    // Simulate loading the document
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [book.fileUrl]);

  const changePage = (newPage: number) => {
    if (newPage < 1 || newPage > (book.totalPages || 100)) return;
    
    setCurrentPage(newPage);
    
    if (onPageChange) {
      onPageChange(newPage);
    }
  };

  const saveProgress = async () => {
    try {
      await updateBook(book.id!, {
        currentPage
      });
    } catch (error) {
      console.error("Error saving reading progress:", error);
    }
  };

  return (
    <div className="flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {/* Controls */}
      <div className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-700">
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage <= 1 || isLoading}
            variant="secondary"
            size="sm"
            icon={<ChevronLeft className="h-4 w-4" />}
          >
            Prev
          </Button>
          
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Page {currentPage} of {book.totalPages || "?"}
          </span>
          
          <Button
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage >= (book.totalPages || 100) || isLoading}
            variant="secondary"
            size="sm"
            icon={<ChevronRight className="h-4 w-4" />}
          >
            Next
          </Button>
        </div>
        
        <Button
          onClick={saveProgress}
          variant="primary"
          size="sm"
          icon={<Save className="h-4 w-4" />}
        >
          Save Progress
        </Button>
      </div>
      
      {/* Content */}
      <div className="relative min-h-[400px] p-4">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="mb-4 text-center">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {book.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                by {book.author}
              </p>
            </div>
            
            <div className="w-full p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                File format: {book.fileType.toUpperCase()}
              </p>
              
              <a 
                href={book.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Open in new tab to read
              </a>
              
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Note: Full e-reader functionality will be implemented in the next phase.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 