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
  CollectionReference,
  orderBy,
  limit
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FirebaseError } from "firebase/app";

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

/**
 * Gets the most recent report for a user
 * @param userId - The user ID
 * @returns The most recent report or null if none exists
 */
export const getLatestReport = async (userId: string) => {
  try {
    console.log("Fetching latest report for user:", userId);
    
    // Define a type for the report data
    type ReportData = {
      id: string;
      bookTitle?: string;
      dayNumber?: string;
      date?: string;
      pages?: string;
      createdAt?: any;
      updatedAt?: any;
      [key: string]: any;
    };
    
    // Use a simpler approach - get all reports for this user in a single query
    const reportsRef = collection(db, "reports");
    const q = query(reportsRef, where("userId", "==", userId));
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log("No reports found for user");
      return null;
    }
    
    console.log(`Found ${querySnapshot.docs.length} reports, searching for the latest one...`);
    
    // Process all documents and find the most recent one
    let latestReport: ReportData | null = null;
    let latestDate: Date = new Date(0); // Start with oldest possible date
    
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      const report = {
        id: doc.id,
        ...data
      } as ReportData;
      
      // Convert Firestore timestamp to Date object
      let createdAtDate: Date;
      if (report.createdAt && typeof report.createdAt.toDate === 'function') {
        createdAtDate = report.createdAt.toDate();
      } else if (report.createdAt) {
        // Handle string or number timestamp
        createdAtDate = new Date(report.createdAt);
      } else {
        // Default to a very old date if createdAt is missing
        createdAtDate = new Date(0);
      }
      
      // Compare with current latest
      if (createdAtDate > latestDate) {
        latestDate = createdAtDate;
        latestReport = report;
        
        // Store the date object for easier use
        report.createdAt = createdAtDate;
        
        // Also convert updatedAt if it exists
        if (report.updatedAt && typeof report.updatedAt.toDate === 'function') {
          report.updatedAt = report.updatedAt.toDate();
        }
      }
    });
    
    if (latestReport) {
      // Force type casting for TypeScript
      const typedReport = latestReport as {
        id: string;
        bookTitle?: string;
        dayNumber?: string;
        pages?: string;
        createdAt?: any;
        updatedAt?: any;
        [key: string]: any;
      };
      
      console.log("Latest report found:", typedReport.id);
      console.log("Book title:", typedReport.bookTitle);
      console.log("Day number:", typedReport.dayNumber);
      console.log("Pages:", typedReport.pages);
      
      return typedReport;
    } else {
      console.log("No valid reports found");
      return null;
    }
  } catch (error) {
    console.error("Error getting latest report:", error);
    return null;
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
