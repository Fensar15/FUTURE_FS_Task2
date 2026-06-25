import jwt from 'jsonwebtoken';

// Protects admin-only routes. Expects "Authorization: Bearer <token>".
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
    req.admin = jwt.verify(token, secret);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Your session has expired. Please log in again.' });
  }
}
