const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user?.role) {
    return res.status(403).json({ message: 'Forbidden: Role not found' });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Forbidden: ${req.user.role} role does not have access`
    });
  }

  return next();
};

module.exports = {
  verifyToken,
  authorizeRoles
};
