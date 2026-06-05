const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('../services/activityService');
const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  const { status, country, recruiterId, page = 1, limit = 20 } = req.query;
  const where = {};
  if (status) where.status = status;
  if (country) where.country = country;
  if (recruiterId) where.recruiterId = recruiterId;

  const [placements, total] = await Promise.all([
    prisma.placement.findMany({
      where, skip: (parseInt(page)-1)*parseInt(limit), take: parseInt(limit),
      include: {
        candidate: { select: { id:true, firstName:true, lastName:true, email:true } },
        recruiter: { select: { id:true, name:true } },
        marketingRecruiter: { select: { id:true, name:true } },
        trainer: { select: { id:true, name:true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.placement.count({ where })
  ]);
  res.json({ placements, total });
});

router.post('/', async (req, res) => {
  const placement = await prisma.placement.create({ data: req.body });
  await logActivity(req.body.candidateId, req.user.id, 'placement', 'Placement created', `${req.body.clientName} - ${req.body.jobTitle}`);
  res.status(201).json(placement);
});

router.patch('/:id', async (req, res) => {
  const placement = await prisma.placement.update({ where: { id: req.params.id }, data: req.body });
  await logActivity(placement.candidateId, req.user.id, 'placement', `Placement updated: ${req.body.status || ''}`, null);
  res.json(placement);
});

module.exports = router;
