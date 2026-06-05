const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('../services/activityService');

const prisma = new PrismaClient();

// ─── RECRUITMENT ROUTER ───────────────────────────────────────────────────────
const recruitmentRouter = express.Router();

recruitmentRouter.get('/', async (req, res) => {
  const { status, country, recruiterId, agreementSent, agreementSigned, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};
  if (status) where.status = status;
  if (agreementSent !== undefined) where.agreementSent = agreementSent === 'true';
  if (agreementSigned !== undefined) where.agreementSigned = agreementSigned === 'true';

  const candidateWhere = {};
  if (country) candidateWhere.country = country;
  if (recruiterId) candidateWhere.assignedRecruiterId = recruiterId;

  const [records, total] = await Promise.all([
    prisma.candidateRecruitment.findMany({
      where: { ...where, candidate: candidateWhere },
      skip, take: parseInt(limit),
      include: {
        candidate: {
          include: {
            addedBy: { select: { id: true, name: true } },
            assignedRecruiter: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    }),
    prisma.candidateRecruitment.count({ where: { ...where, candidate: candidateWhere } })
  ]);
  res.json({ records, total, page: parseInt(page), limit: parseInt(limit) });
});

recruitmentRouter.patch('/:candidateId', async (req, res) => {
  const { candidateId } = req.params;
  const data = req.body;

  if (data.status === 'Sent to Training' && !data.sentToTraining) {
    data.sentToTraining = true;
    data.sentToTrainingAt = new Date();
    await prisma.candidateTraining.upsert({
      where: { candidateId },
      create: { candidateId },
      update: {}
    });
  }

  if (data.status === 'Sent to Marketing' && !data.sentToMarketing) {
    data.sentToMarketing = true;
    data.sentToMarketingAt = new Date();
    await prisma.candidateMarketing.upsert({
      where: { candidateId },
      create: { candidateId },
      update: {}
    });
  }

  const updated = await prisma.candidateRecruitment.update({ where: { candidateId }, data });
  await logActivity(candidateId, req.user.id, 'recruitment', `Status updated to ${data.status || 'updated'}`, null);
  res.json(updated);
});

// ─── TRAINING ROUTER ──────────────────────────────────────────────────────────
const trainingRouter = express.Router();

trainingRouter.get('/', async (req, res) => {
  const { status, trainerId, country, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};
  if (status) where.status = status;
  if (trainerId) where.trainerId = trainerId;

  const [records, total] = await Promise.all([
    prisma.candidateTraining.findMany({
      where: { ...where, ...(country && { candidate: { country } }) },
      skip, take: parseInt(limit),
      include: {
        candidate: { select: { id: true, firstName: true, lastName: true, email: true, country: true, technology: true } },
        trainer: { select: { id: true, name: true } }
      },
      orderBy: { updatedAt: 'desc' }
    }),
    prisma.candidateTraining.count({ where })
  ]);
  res.json({ records, total });
});

trainingRouter.patch('/:candidateId', async (req, res) => {
  const data = req.body;
  if (data.status === 'Ready for Marketing') {
    data.readyForMarketing = true;
    data.readyAt = new Date();
    await prisma.candidateMarketing.upsert({
      where: { candidateId: req.params.candidateId },
      create: { candidateId: req.params.candidateId },
      update: {}
    });
  }
  const updated = await prisma.candidateTraining.update({ where: { candidateId: req.params.candidateId }, data });
  await logActivity(req.params.candidateId, req.user.id, 'training', `Training updated: ${data.status || ''}`, null);
  res.json(updated);
});

// ─── MARKETING ROUTER ─────────────────────────────────────────────────────────
const marketingRouter = express.Router();

marketingRouter.get('/', async (req, res) => {
  const { status, dayRecruiterId, nightRecruiterId, dayTeamLeadId, nightTeamLeadId, country, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};
  if (status) where.status = status;
  if (dayRecruiterId) where.dayRecruiterId = dayRecruiterId;
  if (nightRecruiterId) where.nightRecruiterId = nightRecruiterId;
  if (dayTeamLeadId) where.dayTeamLeadId = dayTeamLeadId;
  if (nightTeamLeadId) where.nightTeamLeadId = nightTeamLeadId;

  const [records, total] = await Promise.all([
    prisma.candidateMarketing.findMany({
      where: { ...where, ...(country && { candidate: { country } }) },
      skip, take: parseInt(limit),
      include: {
        candidate: { select: { id: true, firstName: true, lastName: true, email: true, country: true, technology: true } },
        dayRecruiter: { select: { id: true, name: true } },
        nightRecruiter: { select: { id: true, name: true } },
        dayTeamLead: { select: { id: true, name: true } },
        nightTeamLead: { select: { id: true, name: true } }
      },
      orderBy: { updatedAt: 'desc' }
    }),
    prisma.candidateMarketing.count({ where })
  ]);
  res.json({ records, total });
});

marketingRouter.patch('/:candidateId', async (req, res) => {
  const data = req.body;
  if (data.status === 'Placed') {
    data.placementDate = new Date();
    await prisma.placement.upsert({
      where: { candidateId: req.params.candidateId },
      create: { candidateId: req.params.candidateId, clientName: data.clientName || 'TBD', jobTitle: data.jobTitle || 'TBD', country: data.country || 'USA', status: 'Offered' },
      update: {}
    });
  }
  const updated = await prisma.candidateMarketing.update({ where: { candidateId: req.params.candidateId }, data });
  await logActivity(req.params.candidateId, req.user.id, 'marketing', `Marketing updated: ${data.status || ''}`, null);
  res.json(updated);
});

module.exports = { recruitmentRouter, trainingRouter, marketingRouter };
