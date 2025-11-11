import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { isAuthenticated: false, user: null },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    
    if (!decoded) {
      const response = NextResponse.json(
        { isAuthenticated: false, user: null },
        { status: 200 }
      );
      
      // Clear invalid token
      response.cookies.delete('token');
      return response;
    }

    return NextResponse.json(
      { 
        isAuthenticated: true, 
        user: { 
          id: decoded.id, 
          email: decoded.email 
        } 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { isAuthenticated: false, user: null, error: 'Authentication check failed' },
      { status: 500 }
    );
  }
}
