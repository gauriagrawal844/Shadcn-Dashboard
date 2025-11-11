import jwt from 'jsonwebtoken';

export async function verifyToken(token) {
  try {
    if (!token) return null;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export function requireAuth(handler) {
  return async (req, res) => {
    const token = req.cookies.get('token')?.value;
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      const decoded = await verifyToken(token);
      if (!decoded) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired token' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Add user to request object for use in API routes
      req.user = decoded;
      return handler(req, res);
    } catch (error) {
      console.error('Authentication error:', error);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
}
