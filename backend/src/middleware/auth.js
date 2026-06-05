const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true, isActive: true, country: true, shiftType: true }
    });
    if (!user || !user.isActive) return res.status(401).json({ error: 'Invalid or inactive user' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const requireRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

const requireAdmin = requireRoles('SUPER_ADMIN', 'ADMIN');
const requireRecruitment = requireRoles('SUPER_ADMIN', 'ADMIN', 'RECRUITMENT_MANAGER', 'SALES_RECRUITER');
const requireTraining = requireRoles('SUPER_ADMIN', 'ADMIN', 'TRAINING_MANAGER', 'TRAINER');
const requireMarketing = requireRoles('SUPER_ADMIN', 'ADMIN', 'MARKETING_MANAGER', 'DAY_MARKETING_RECRUITER', 'NIGHT_MARKETING_RECRUITER');
const requirePlacement = requireRoles('SUPER_ADMIN', 'ADMIN', 'PLACEMENT_MANAGER');
const requireFinance = requireRoles('SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN');

module.exports = {
  authenticateToken,
  requireRoles,
  requireAdmin,
  requireRecruitment,
  requireTraining,
  requireMarketing,
  requirePlacement,
  requireFinance
};
