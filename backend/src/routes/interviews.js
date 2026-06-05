const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('../services/activityService');

const prisma = new PrismaClient();
const router = express.Router();

// ─── INTERVIEWS ───────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { candidateId, type, status, page = 1, limit = 20 } = req.query;
  const where = {};
  if (candidateId) where.candidateId = candidateId;
  if (type) where.type = type;
  if (status) where.status = status;

  const [interviews, total] = await Promise.all([
    prisma.interview.findMany({
      where, skip: (parseInt(page)-1)*parseInt(limit), take: parseInt(limit),
      include: {
        candidate: { select: { id:true, firstName:true, lastName:true, country:true } },
        createdBy: { select: { id:true, name:true } }
      },
      orderBy: { scheduledAt: 'desc' }
    }),
    prisma.interview.count({ where })
  ]);
  res.json({ interviews, total });
});

router.post('/', async (req, res) => {
  const interview = await prisma.interview.create({
    data: { ...req.body, createdById: req.user.id },
    include: { candidate: true }
  });
  await logActivity(req.body.candidateId, req.user.id, 'interview',
    `${req.body.type} scheduled`, `${req.body.clientName} - ${req.body.jobTitle}`);
  res.status(201).json(interview);
});

router.patch('/:id', async (req, res) => {
  const interview = await prisma.interview.update({ where: { id: req.params.id }, data: req.body });
  await logActivity(interview.candidateId, req.user.id, 'interview', `Interview updated: ${req.body.status || ''}`, null);
  res.json(interview);
});

module.exports = router;
