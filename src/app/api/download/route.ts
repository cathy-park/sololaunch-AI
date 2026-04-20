import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fileUrl = searchParams.get('url');
  const fileName = searchParams.get('filename') || 'download';

  if (!fileUrl) {
    return new NextResponse('Missing file URL', { status: 400 });
  }

  try {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const blob = await response.blob();
    const headers = new Headers();
    
    // 강제 다운로드를 위한 헤더 설정
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    headers.set('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');
    
    return new NextResponse(blob, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('Download error:', error);
    return new NextResponse(`Download failed: ${error.message}`, { status: 500 });
  }
}
