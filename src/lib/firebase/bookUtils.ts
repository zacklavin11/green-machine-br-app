/**
 * Utility functions for book-related operations with Firebase
 */

/**
 * Process a Firebase Cloud Storage link to validate and extract useful information
 * 
 * @param url The storage URL to process
 * @returns Object with processed URL and validation info
 */
export const processCloudStorageLink = (url: string) => {
  // Default result structure
  const result = {
    isValid: false,
    originalUrl: url,
    processedUrl: '',
    fileName: '',
    fileType: '',
    error: ''
  };

  try {
    // Basic URL validation
    if (!url || !url.trim()) {
      result.error = 'URL is empty';
      return result;
    }

    // Create a URL object to parse the URL
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (error) {
      result.error = 'Invalid URL format';
      return result;
    }

    // Check if it's a Firebase Storage URL
    const isFirebaseStorageUrl = 
      parsedUrl.hostname.includes('firebasestorage.googleapis.com') || 
      parsedUrl.hostname.includes('storage.googleapis.com');

    if (!isFirebaseStorageUrl) {
      result.error = 'Not a valid Firebase Storage URL';
      return result;
    }

    // Extract the file name from the URL
    const pathSegments = parsedUrl.pathname.split('/');
    const fileName = pathSegments[pathSegments.length - 1];
    
    // Decode the file name if it's URL encoded
    const decodedFileName = decodeURIComponent(fileName);
    
    // Extract file extension
    const fileExtension = decodedFileName.split('.').pop()?.toLowerCase() || '';
    
    // Determine file type
    let fileType = '';
    if (['pdf', 'epub'].includes(fileExtension)) {
      fileType = fileExtension;
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
      fileType = 'image';
    } else {
      fileType = 'unknown';
    }

    // Format the result
    result.isValid = true;
    result.processedUrl = url;
    result.fileName = decodedFileName;
    result.fileType = fileType;
    
    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error processing URL';
    return result;
  }
}; 