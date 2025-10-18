const { createClient } = require('@supabase/supabase-js');
const User = require('../models/user.model');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Verify Supabase JWT token
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }

    // Verify with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
    }

    // Find user in MongoDB
    const user = await User.findOne({ supabaseId: data.user.id });

    if (!user || !user.isActive) {
      return res.status(403).json({ 
        success: false, 
        error: 'User not found or inactive' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Authentication failed' 
    });
  }
};

// Role-based authorization
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
      });
    }
    next();
  };
};

module.exports = { authenticateUser, authorizeRoles, supabase };
