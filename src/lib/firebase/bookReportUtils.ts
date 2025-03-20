import { db, storage } from "./firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  DocumentReference
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { Book, BookReport, ReadingStreak } from "../types";
import { getDeviceId } from "../utils";

// Collection names
const BOOKS_COLLECTION = "books";
const REPORTS_COLLECTION = "reports";
const STREAKS_COLLECTION = "streaks";

// Book functions
export const addBook = async (bookData: Omit<Book, "id" | "addedAt" | "lastReadAt" | "deviceId">): Promise<string> => {
  const deviceId = getDeviceId();
  const now = Timestamp.now();
  
  const bookWithMetadata: Omit<Book, "id"> = {
    ...bookData,
    deviceId,
    addedAt: now,
    lastReadAt: now,
  };
  
  const docRef = await addDoc(collection(db, BOOKS_COLLECTION), bookWithMetadata);
  return docRef.id;
};

export const getBooks = async (): Promise<Book[]> => {
  if (typeof window === "undefined") {
    console.warn("getBooks called on server side");
    return [];
  }
  
  try {
    const deviceId = getDeviceId();
    const q = query(
      collection(db, BOOKS_COLLECTION),
      where("deviceId", "==", deviceId),
      orderBy("lastReadAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Book));
  } catch (error) {
    console.error("Error fetching books:", error);
    return [];
  }
};

export const getBook = async (bookId: string): Promise<Book | null> => {
  const docRef = doc(db, BOOKS_COLLECTION, bookId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Book;
  }
  
  return null;
};

export const updateBook = async (bookId: string, data: Partial<Book>): Promise<void> => {
  const bookRef = doc(db, BOOKS_COLLECTION, bookId);
  await updateDoc(bookRef, {
    ...data,
    lastReadAt: Timestamp.now()
  });
};

export const deleteBook = async (bookId: string): Promise<void> => {
  // Also delete the book file from storage if it exists
  const book = await getBook(bookId);
  if (book?.fileUrl) {
    // Extract the path from the URL
    const fileUrl = new URL(book.fileUrl);
    const storagePath = decodeURIComponent(fileUrl.pathname.split('/o/')[1]?.split('?')[0]);
    
    if (storagePath) {
      try {
        const fileRef = ref(storage, storagePath);
        await deleteObject(fileRef);
      } catch (error) {
        console.error("Error deleting book file:", error);
      }
    }
  }
  
  // Delete the book document
  await deleteDoc(doc(db, BOOKS_COLLECTION, bookId));
};

// Book Report functions
export const addBookReport = async (reportData: Omit<BookReport, "id" | "createdAt" | "updatedAt" | "deviceId">): Promise<string> => {
  const deviceId = getDeviceId();
  const now = Timestamp.now();
  
  const reportWithMetadata: Omit<BookReport, "id"> = {
    ...reportData,
    deviceId,
    createdAt: now,
    updatedAt: now,
  };
  
  const docRef = await addDoc(collection(db, REPORTS_COLLECTION), reportWithMetadata);
  
  // Update the streak for this day
  const dateString = reportData.date.toDate().toISOString().split('T')[0];
  const streakId = `${deviceId}_${dateString}`;
  
  await updateDoc(doc(db, STREAKS_COLLECTION, streakId), {
    completed: true,
    reportId: docRef.id
  }).catch(async () => {
    // If updating fails (streak doesn't exist), create it
    await addDoc(collection(db, STREAKS_COLLECTION), {
      id: streakId,
      deviceId,
      date: reportData.date,
      completed: true,
      reportId: docRef.id
    });
  });
  
  return docRef.id;
};

export const getBookReports = async (bookId?: string): Promise<BookReport[]> => {
  const deviceId = getDeviceId();
  let q;
  
  if (bookId) {
    q = query(
      collection(db, REPORTS_COLLECTION),
      where("deviceId", "==", deviceId),
      where("bookId", "==", bookId),
      orderBy("date", "desc")
    );
  } else {
    q = query(
      collection(db, REPORTS_COLLECTION),
      where("deviceId", "==", deviceId),
      orderBy("date", "desc")
    );
  }
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as BookReport));
};

export const getBookReport = async (reportId: string): Promise<BookReport | null> => {
  const docRef = doc(db, REPORTS_COLLECTION, reportId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as BookReport;
  }
  
  return null;
};

export const updateBookReport = async (reportId: string, data: Partial<BookReport>): Promise<void> => {
  const reportRef = doc(db, REPORTS_COLLECTION, reportId);
  await updateDoc(reportRef, {
    ...data,
    updatedAt: Timestamp.now()
  });
};

export const deleteBookReport = async (reportId: string): Promise<void> => {
  await deleteDoc(doc(db, REPORTS_COLLECTION, reportId));
};

// File upload function specifically for books
export const uploadBookFile = async (file: File, bookTitle: string): Promise<{ fileUrl: string, fileType: "pdf" | "epub" }> => {
  const deviceId = getDeviceId();
  const extension = file.name.split('.').pop()?.toLowerCase();
  const fileType = extension === 'epub' ? 'epub' : 'pdf';
  
  // Create a clean filename with no spaces or special characters
  const cleanTitle = bookTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const fileName = `${cleanTitle}_${Date.now()}.${extension}`;
  const path = `books/${deviceId}/${fileName}`;
  
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const fileUrl = await getDownloadURL(storageRef);
  
  return { fileUrl, fileType: fileType as "pdf" | "epub" };
};

// File upload function for book cover images
export const uploadBookCover = async (file: File, bookTitle: string): Promise<string> => {
  const deviceId = getDeviceId();
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  // Create a clean filename
  const cleanTitle = bookTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const fileName = `${cleanTitle}_cover_${Date.now()}.${extension}`;
  const path = `covers/${deviceId}/${fileName}`;
  
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

// Reading Streak functions
export const getReadingStreaks = async (startDate?: Date, endDate?: Date): Promise<ReadingStreak[]> => {
  const deviceId = getDeviceId();
  let q = query(
    collection(db, STREAKS_COLLECTION),
    where("deviceId", "==", deviceId),
    orderBy("date", "desc")
  );
  
  const querySnapshot = await getDocs(q);
  let streaks = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as ReadingStreak));
  
  // Filter by date range if provided
  if (startDate || endDate) {
    return streaks.filter(streak => {
      const streakDate = streak.date.toDate();
      return (!startDate || streakDate >= startDate) && 
             (!endDate || streakDate <= endDate);
    });
  }
  
  return streaks;
}; 