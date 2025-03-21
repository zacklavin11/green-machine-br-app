import { auth, db, storage } from "./firebase";
import {
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  User
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FirebaseError } from "firebase/app";
import { BookReport, PDCA } from "../types";

// Auth functions
export const logoutUser = () => signOut(auth);

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

// User profile functions
export const getUserProfile = async (userId: string) => {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Define a type that includes streakData to avoid TypeScript errors
      type UserProfile = {
        id: string;
        name?: string;
        email?: string;
        photoURL?: string;
        createdAt?: Date;
        updatedAt?: Date;
        streakData?: {
          activeCalendarDays: any[];
          currentStreak: number;
          lastActiveDate: string | null;
          longestStreak: number;
        };
        [key: string]: any;
      };
      
      // Cast the data to the correct type
      return { id: docSnap.id, ...docSnap.data() } as UserProfile;
    } else {
      // Return null if user profile doesn't exist
      return null;
    }
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
};

export const updateUserProfile = async (userId: string, data: Record<string, any>) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Update existing document
      await updateDoc(userRef, {
        ...data,
        updatedAt: new Date()
      });
    } else {
      // Create new document if it doesn't exist
      await setDoc(userRef, {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        streakData: {
          activeCalendarDays: [],
          currentStreak: 0,
          lastActiveDate: null,
          longestStreak: 0
        }
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

export const createUserProfile = async (user: User, additionalData: Record<string, any> = {}) => {
  if (!user) return null;

  try {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      const { displayName, email, photoURL } = user;
      const createdAt = new Date();
      
      await setDoc(userRef, {
        name: displayName,
        email,
        photoURL,
        createdAt,
        updatedAt: createdAt,
        streakData: {
          activeCalendarDays: [],
          currentStreak: 0,
          lastActiveDate: null,
          longestStreak: 0
        },
        ...additionalData,
      });
      
      return { id: user.uid, name: displayName, email, createdAt };
    }
    
    return { id: user.uid, ...userDoc.data() };
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
};

// Reading data functions
export const getUserData = async (userId: string, collectionName: string) => {
  try {
    const dataRef = collection(db, collectionName);
    const q = query(dataRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Error getting user ${collectionName}:`, error);
    throw error;
  }
};

// Streak and calendar functions
export const updateUserStreak = async (userId: string, streakData: any) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { streakData });
    return streakData;
  } catch (error) {
    console.error("Error updating user streak:", error);
    throw error;
  }
};

export const getActiveCalendarDays = async (userId: string): Promise<number[]> => {
  try {
    const userProfile = await getUserProfile(userId);
    if (userProfile && 
        userProfile.streakData && 
        Array.isArray(userProfile.streakData.activeCalendarDays)) {
      return userProfile.streakData.activeCalendarDays;
    }
    return [];
  } catch (error) {
    console.error("Error getting active calendar days:", error);
    return [];
  }
};

// Firestore functions with retries
export const addDocument = async (collectionName: string, data: any) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), data);
    return docRef;
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error;
  }
};

export const getDocuments = async (collectionName: string, maxRetries = 3) => {
  let retryCount = 0;
  
  const fetchWithRetry = async (): Promise<any[]> => {
    try {
      console.log(`Fetching documents from ${collectionName}...`);
      const querySnapshot = await getDocs(collection(db, collectionName));
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log(`Successfully fetched ${documents.length} documents from ${collectionName}`);
      return documents;
    } catch (error) {
      if (retryCount < maxRetries) {
        retryCount++;
        console.log(`Retrying fetch for ${collectionName}, attempt ${retryCount}...`);
        // Exponential backoff: 300ms, 900ms, 2700ms
        const delay = 300 * Math.pow(3, retryCount - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry();
      }
      console.error(`Error getting documents from ${collectionName} after ${maxRetries} attempts:`, error);
      throw error;
    }
  };
  
  return fetchWithRetry();
};

export const updateDocument = (collectionName: string, id: string, data: any) =>
  updateDoc(doc(db, collectionName, id), data);

export const deleteDocument = (collectionName: string, id: string) =>
  deleteDoc(doc(db, collectionName, id));

// Storage functions
export const uploadFile = async (file: File, path: string) => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

// Book Report Collection Reference
const bookReportsCollection = collection(db, "bookReports");

// Create a new book report
export const createBookReport = async (reportData: Omit<BookReport, 'id'>) => {
  try {
    // Format dates as Firestore Timestamps if they're not already
    const formattedData = {
      ...reportData,
      createdAt: reportData.createdAt || Timestamp.now(),
      updatedAt: reportData.updatedAt || Timestamp.now()
    };

    const docRef = await addDoc(bookReportsCollection, formattedData);
    return { id: docRef.id, ...formattedData };
  } catch (error) {
    console.error("Error creating book report:", error);
    throw error;
  }
};

// Get a book report by ID
export const getBookReportById = async (reportId: string) => {
  try {
    const docRef = doc(db, "bookReports", reportId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as BookReport;
    } else {
      console.log("No such book report!");
      return null;
    }
  } catch (error) {
    console.error("Error getting book report:", error);
    throw error;
  }
};

// Get all book reports for a user
export const getUserBookReports = async (deviceId: string) => {
  try {
    const q = query(
      bookReportsCollection, 
      where("deviceId", "==", deviceId),
      orderBy("date", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BookReport[];
  } catch (error) {
    console.error("Error getting user book reports:", error);
    throw error;
  }
};

// Get book reports for a specific book
export const getBookReportsForBook = async (bookId: string) => {
  try {
    const q = query(
      bookReportsCollection, 
      where("bookId", "==", bookId),
      orderBy("date", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BookReport[];
  } catch (error) {
    console.error("Error getting book reports for book:", error);
    throw error;
  }
};

// Update a book report
export const updateBookReport = async (reportId: string, reportData: Partial<BookReport>) => {
  try {
    const reportRef = doc(db, "bookReports", reportId);
    
    // Include updated timestamp
    const updatedData = {
      ...reportData,
      updatedAt: Timestamp.now()
    };
    
    await updateDoc(reportRef, updatedData);
    
    // Get the updated document
    const updatedDoc = await getDoc(reportRef);
    return { id: updatedDoc.id, ...updatedDoc.data() } as BookReport;
  } catch (error) {
    console.error("Error updating book report:", error);
    throw error;
  }
};

// Delete a book report
export const deleteBookReport = async (reportId: string) => {
  try {
    await deleteDoc(doc(db, "bookReports", reportId));
    return true;
  } catch (error) {
    console.error("Error deleting book report:", error);
    throw error;
  }
};

// Get reports with a specific day number (for streak checking)
export const getReportsByDayNumber = async (deviceId: string, dayNumber: number) => {
  try {
    const q = query(
      bookReportsCollection,
      where("deviceId", "==", deviceId),
      where("dayNumber", "==", dayNumber)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BookReport[];
  } catch (error) {
    console.error("Error getting reports by day number:", error);
    throw error;
  }
};

// Get reports for a date range
export const getReportsForDateRange = async (deviceId: string, startDate: Date, endDate: Date) => {
  try {
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);
    
    const q = query(
      bookReportsCollection,
      where("deviceId", "==", deviceId),
      where("date", ">=", startTimestamp),
      where("date", "<=", endTimestamp),
      orderBy("date", "asc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BookReport[];
  } catch (error) {
    console.error("Error getting reports for date range:", error);
    throw error;
  }
};

// Get recent reports
export const getRecentReports = async (deviceId: string, limit: number = 10) => {
  try {
    const q = query(
      bookReportsCollection,
      where("deviceId", "==", deviceId),
      orderBy("date", "desc"),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .slice(0, limit)
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BookReport[];
  } catch (error) {
    console.error("Error getting recent reports:", error);
    throw error;
  }
};

// Get PDCA data for analysis
export const getPDCAData = async (deviceId: string) => {
  try {
    const reports = await getUserBookReports(deviceId);
    
    // Extract and analyze PDCA data
    return reports.map(report => report.pdca);
  } catch (error) {
    console.error("Error getting PDCA data:", error);
    throw error;
  }
};

// Get reading stats
export const getReadingStats = async (deviceId: string) => {
  try {
    const reports = await getUserBookReports(deviceId);
    
    // Calculate statistics
    const totalReports = reports.length;
    
    // Total pages read (assuming pagesRead is stored as a string with format "10-20")
    let totalPagesRead = 0;
    reports.forEach(report => {
      if (report.pagesRead) {
        const pageRange = report.pagesRead.split("-");
        if (pageRange.length === 2) {
          const startPage = parseInt(pageRange[0], 10);
          const endPage = parseInt(pageRange[1], 10);
          if (!isNaN(startPage) && !isNaN(endPage)) {
            totalPagesRead += (endPage - startPage) + 1;
          }
        }
      }
    });
    
    // Calculate PDCA stats
    const pdcaStats = {
      plannedHappen: 0,
      senseOfUrgency: 0,
      timeManagement: 0
    };
    
    let validPDCACount = 0;
    
    reports.forEach(report => {
      if (report.pdca) {
        validPDCACount++;
        if (report.pdca.plannedHappen) pdcaStats.plannedHappen++;
        if (report.pdca.senseOfUrgency) pdcaStats.senseOfUrgency++;
        if (report.pdca.timeManagement) pdcaStats.timeManagement++;
      }
    });
    
    const pdcaPercentages = validPDCACount > 0 ? {
      plannedHappen: (pdcaStats.plannedHappen / validPDCACount) * 100,
      senseOfUrgency: (pdcaStats.senseOfUrgency / validPDCACount) * 100,
      timeManagement: (pdcaStats.timeManagement / validPDCACount) * 100
    } : {
      plannedHappen: 0,
      senseOfUrgency: 0,
      timeManagement: 0
    };
    
    return {
      totalReports,
      totalPagesRead,
      pdcaStats,
      pdcaPercentages
    };
  } catch (error) {
    console.error("Error getting reading stats:", error);
    throw error;
  }
};

// Get most recent day number
export const getMostRecentDayNumber = async (deviceId: string) => {
  try {
    const reports = await getUserBookReports(deviceId);
    
    if (reports.length === 0) {
      return 0; // No reports yet
    }
    
    // Find max day number
    return Math.max(...reports.map(report => report.dayNumber));
  } catch (error) {
    console.error("Error getting most recent day number:", error);
    return 0;
  }
};
