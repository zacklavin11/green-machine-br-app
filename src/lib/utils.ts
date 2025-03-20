/**
 * Generates or retrieves a unique device ID for anonymous tracking
 * @returns A unique string identifier for the current device
 */
export const getDeviceId = (): string => {
  // Return a placeholder during server-side rendering
  if (typeof window === "undefined") return "server_render";
  
  try {
    // Try to get existing device ID from localStorage
    let deviceId = localStorage.getItem("bookReportDeviceId");
    
    // If no ID exists, create a new one
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("bookReportDeviceId", deviceId);
    }
    
    return deviceId;
  } catch (error) {
    console.error("Error with device ID:", error);
    // Return a fallback device ID if localStorage is not available
    return `temp_device_${Date.now()}`;
  }
};

/**
 * Format a date as a string in 'YYYY-MM-DD' format
 * @param date Date to format
 * @returns Formatted date string
 */
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Truncate a string to a specified length
 * @param str String to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated string with ellipsis if needed
 */
export const truncateString = (str: string, maxLength: number = 50): string => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}; 