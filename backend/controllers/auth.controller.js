const User = require('../models/user.model');
const { supabase } = require('../middleware/auth.middleware');

// Register new user
exports.register = async (req, res) => {
  try {
    const { email, password, fullName, company } = req.body;

    // Sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }

    // Create user in MongoDB
    const user = await User.create({
      supabaseId: data.user.id,
      email: data.user.email,
      fullName,
      company,
      role: 'user',
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Registration failed' 
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }

    // Get user from MongoDB
    const user = await User.findOne({ supabaseId: data.user.id });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found in database' 
      });
    }

    res.json({
      success: true,
      message: 'Login successful',
      token: data.session.access_token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        company: user.company,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Login failed' 
    });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      fullName: req.user.fullName,
      company: req.user.company,
    },
  });
};

// Logout user
exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    await supabase.auth.signOut(token);
    res.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Logout failed' 
    });
  }
};
