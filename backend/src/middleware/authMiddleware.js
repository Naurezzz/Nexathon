import jwt from 'jsonwebtoken';

const SUPABASE_JWT_SECRET = 'your-supabase-jwt-secret'; // We'll get this from Supabase

export const authenticateUser = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      // Decode JWT token (Supabase tokens are base64 encoded)
      const [, payloadBase64] = token.split('.');
      const payloadJson = Buffer.from(payloadBase64, 'base64').toString();
      const decoded = JSON.parse(payloadJson);
      
      if (!decoded) {
        throw new Error('Invalid token');
      }
      
      // Check if token is expired
      if (decoded.exp && decoded.exp < Date.now() / 1000) {
        return res.status(401).json({ error: 'Token expired' });
      }
      
      // Extract user info from token
      req.user = {
        id: decoded.sub, // Supabase user ID
        email: decoded.email,
        role: decoded.user_metadata?.role || 'company_user',
        isAdmin: decoded.user_metadata?.role === 'company_admin' || decoded.user_metadata?.role === 'super_admin',
        isGovernment: decoded.user_metadata?.role === 'government_official',
        metadata: decoded.user_metadata || {}
      };
      
      console.log(`✅ Authenticated user: ${req.user.email} (${req.user.role})`);
      next();
      
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

