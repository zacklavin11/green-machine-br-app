import { NextRequest, NextResponse } from 'next/server';
import { processCloudStorageLink } from '@/lib/firebase/bookUtils';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid URL provided' },
        { status: 400 }
      );
    }
    
    // Process the storage link
    const result = processCloudStorageLink(url);
    
    if (result.isValid) {
      // If valid, we should also check if the URL is accessible
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(result.processedUrl, { 
          method: 'HEAD',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          return NextResponse.json({
            success: true,
            data: {
              ...result,
              isAccessible: true
            }
          });
        } else {
          return NextResponse.json({
            success: true,
            data: {
              ...result,
              isAccessible: false,
              accessError: `URL returned status ${response.status}`
            }
          });
        }
      } catch (accessError) {
        // The URL is valid but not accessible
        return NextResponse.json({
          success: true,
          data: {
            ...result,
            isAccessible: false,
            accessError: accessError instanceof Error ? accessError.message : 'Unknown error accessing URL'
          }
        });
      }
    }
    
    // Return the validation result
    return NextResponse.json({ 
      success: true, 
      data: result 
    });
    
  } catch (error) {
    console.error('Error validating storage link:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error validating link' 
      },
      { status: 500 }
    );
  }
} 