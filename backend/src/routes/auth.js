const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { authenticate } = require('../middleware/auth');

// POST /api/auth/register
// Body: { email, password, full_name? }
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, password',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters',
      });
    }

    // Create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // auto-confirm for server-side registration
      user_metadata: { role: 'user', full_name: full_name ?? null },
    });

    if (authError) {
      return res.status(400).json({ success: false, error: authError.message });
    }

    const user = authData.user;

    // Create user profile row
    const { error: profileError } = await supabase.from('user_profiles').insert({
      id: user.id,
      role: 'user',
      full_name: full_name ?? null,
    });

    if (profileError) {
      // Non-fatal — profile can be created later; auth user exists
      console.error('Profile insert failed:', profileError.message);
    }

    return res.status(201).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        full_name: full_name ?? null,
        role: 'user',
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/login
// Body: { email, password }
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, password',
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return res.status(401).json({ success: false, error: error.message });
    }

    const { user, session } = data;

    // Fetch role from user_profiles
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: profile?.role ?? 'user',
          full_name: profile?.full_name ?? null,
        },
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/logout
// Requires Authorization: Bearer <access_token>
router.post('/logout', authenticate, async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];

    // Sign out the specific session using the admin API
    const { error } = await supabase.auth.admin.signOut(token);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.json({ success: true, data: { message: 'Logged out successfully' } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/me — get current user info (authenticated)
router.get('/me', authenticate, async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('role, full_name, created_at')
      .eq('id', req.user.id)
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      data: {
        id: req.user.id,
        email: req.user.email,
        role: profile?.role ?? 'user',
        full_name: profile?.full_name ?? null,
        created_at: profile?.created_at,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
