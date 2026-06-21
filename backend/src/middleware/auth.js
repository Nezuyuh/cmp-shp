const supabase = require('../lib/supabase');

/**
 * Verifies the Supabase JWT from the Authorization header.
 * Attaches the decoded user to req.user.
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }

  req.user = data.user;
  next();
}

/**
 * Requires the authenticated user to have role === 'admin' in user_metadata.
 * Must be used after the authenticate middleware.
 */
async function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }

  // Check user_metadata for admin role (set via Supabase Admin API or trigger)
  const role = req.user.user_metadata?.role;

  if (role !== 'admin') {
    // Also check user_profiles table as a fallback
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (error || profile?.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
  }

  next();
}

module.exports = { authenticate, requireAdmin };
