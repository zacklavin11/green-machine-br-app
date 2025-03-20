import { Timestamp } from "firebase/firestore";

export interface Book {
  id?: string;
  title: string;
  author: string;
  coverImageUrl: string;
  fileUrl: string;
  fileType: "pdf" | "epub";
  addedAt: Timestamp;
  lastReadAt: Timestamp;
  totalPages: number;
  currentPage: number;
  deviceId: string;
}

export interface PDCA {
  plannedHappen: boolean;
  senseOfUrgency: boolean;
  timeManagement: boolean;
  learnings: string;
}

export interface BookReport {
  id?: string;
  deviceId: string;
  bookId: string;
  dayNumber: number;
  date: Timestamp;
  pagesRead: string;
  whatSection: string[];
  soWhatSection: string;
  whatNowSection: string[];
  pdca: PDCA;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ReadingStreak {
  id?: string;
  deviceId: string;
  date: Timestamp;
  completed: boolean;
  reportId?: string;
}

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
} 