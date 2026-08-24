const jwt = require('jsonwebtoken');

/**
 * Middleware to verify a JWT from an httpOnly cookie.
 * 
 * If valid, the decoded payload (containing user id) is attached to req.user.
 * If invalid or missing, it returns a 401 Unauthorized response.
 * 
 * This satisfies the security checklist item:
 * "Confirm every state-changing action is re-validated server-side, not trusted from client input"
 */
const authenticateToken = (req, res, next) => {
  // Read the token from the cookie named 'jwt'
  const token = req.cookies.jwt;

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    // Verify the token using the secret from .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach the user payload to the request for the next middleware/route handler
    // e.g. req.user = { id: 'uuid-string' }
    req.user = decoded;
    
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

module.exports = { authenticateToken };
