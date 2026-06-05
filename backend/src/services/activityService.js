const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const logActivity = async (candidateId, userId, module, action, detail = null, metadata = null) => {
  try {
    await prisma.activityLog.create({
      data: { candidateId, userId, module, action, detail, metadata }
    });
  } catch (err) {
    console.error('Activity log failed:', err.message);
  }
};

module.exports = { logActivity };
