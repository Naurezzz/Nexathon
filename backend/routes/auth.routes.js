const express = require('express');
const router = express.Router();
const User = require('../models/user.model.js');
const { supabase, authenticateUser } = require('../middleware/auth.middleware.js');

// Register/Login handler - creates user in MongoDB after Supabase auth
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, company } = req.body;

    // Sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Create user in MongoDB
    const user = await User.create({
      supabaseId: data.user.id,
      email: data.user.email,
      fullName,
      company,
      role: 'user', // Default role
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login handler
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Get user from MongoDB
    const user = await User.findOne({ supabaseId: data.user.id });

    if (!user) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    res.json({
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
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user profile
router.get('/me', authenticateUser, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      fullName: req.user.fullName,
      company: req.user.company,
    },
  });
});

// Logout
router.post('/logout', authenticateUser, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    await supabase.auth.signOut(token);
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Logout failed' });
  }
});

module.exports = router;
