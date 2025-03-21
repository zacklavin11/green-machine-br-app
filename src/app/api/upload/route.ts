import { NextRequest, NextResponse } from 'next/server';
import { storage } from '../../../lib/firebase/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const fileType = formData.get('fileType') as string;
    
    if (!file || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          }
        }
      );
    }

    // Ensure we have valid file and user data
    if (!file.size || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Invalid file uploaded' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          }
        }
      );
    }

    // Create a unique filename
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const safeFileName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
    
    // Choose the correct storage path based on file type
    const storageFolder = fileType === 'cover' ? 'bookCovers' : 'books';
    const filePath = `${storageFolder}/${userId}/${Date.now()}-${safeFileName}`;
    
    console.log(`Server upload: Uploading ${fileType} to ${filePath}`);
    
    try {
      // Create reference and upload
      const storageRef = ref(storage, filePath);
      
      // Convert File to ArrayBuffer for upload
      const bytes = await file.arrayBuffer();
      
      // Upload file
      await uploadBytes(storageRef, new Uint8Array(bytes));
      console.log("Server upload: Upload successful");
      
      // Get the download URL
      const url = await getDownloadURL(storageRef);
      console.log("Server upload: Got download URL");
      
      return NextResponse.json(
        { url },
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          }
        }
      );
    } catch (uploadError) {
      console.error("Firebase storage error:", uploadError);
      return NextResponse.json(
        { error: 'Firebase upload failed: ' + (uploadError instanceof Error ? uploadError.message : String(uploadError)) },
        { 
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          }
        }
      );
    }
  } catch (error) {
    console.error("Server upload error:", error);
    return NextResponse.json(
      { error: 'Upload failed: ' + (error instanceof Error ? error.message : String(error)) },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        }
      }
    );
  }
} 