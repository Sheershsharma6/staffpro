const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/reports/dashboard - main dashboard stats
router.get('/dashboard', async (req, res) => {
  const [
    totalCandidates, candidatesByCountry, candidatesByStatus,
    totalInterviews, totalPlacements, activePlacements,
    totalSubscriptions, activeSubscriptions
  ] = await Promise.all([
    prisma.candidate.count(),
    prisma.candidate.groupBy({ by: ['country'], _count: { id: true } }),
    prisma.candidateRecruitment.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.interview.count(),
    prisma.placement.count(),
    prisma.placement.count({ where: { status: 'Active' } }),
    prisma.subscription.count(),
    prisma.subscription.count({ where: { status: 'active' } })
  ]);

  res.json({
    totalCandidates,
    candidatesByCountry: candidatesByCountry.map(r => ({ country: r.country, count: r._count.id })),
    candidatesByStatus: candidatesByStatus.map(r => ({ status: r.status, count: r._count.id })),
    totalInterviews,
    totalPlacements,
    activePlacements,
    totalSubscriptions,
    activeSubscriptions
  });
});

// GET /api/reports/recruitment
router.get('/recruitment', async (req, res) => {
  const { country, recruiterId, startDate, endDate } = req.query;
  const where = {};
  if (country) where.candidate = { country };
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [byStatus, byRecruiter, agreementStats] = await Promise.all([
    prisma.candidateRecruitment.groupBy({ by: ['status'], where, _count: { id: true } }),
    prisma.candidate.groupBy({ by: ['assignedRecruiterId'], _count: { id: true } }),
    prisma.candidateRecruitment.aggregate({
      _sum: { agreementSent: true },
      where: {}
    })
  ]);

  res.json({ byStatus: byStatus.map(r => ({ status: r.status, count: r._count.id })), byRecruiter, agreementStats });
});

// GET /api/reports/training
router.get('/training', async (req, res) => {
  const [byStatus, byTrainer, avgRatings] = await Promise.all([
    prisma.candidateTraining.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.candidateTraining.groupBy({ by: ['trainerId'], _count: { id: true } }),
    prisma.candidateTraining.aggregate({
      _avg: { technicalRating: true, communicationRating: true, confidenceRating: true }
    })
  ]);
  res.json({ byStatus: byStatus.map(r => ({ status: r.status, count: r._count.id })), byTrainer, avgRatings });
});

// GET /api/reports/marketing
router.get('/marketing', async (req, res) => {
  const [byStatus, byDayRecruiter, byNightRecruiter, byDayLead, byNightLead] = await Promise.all([
    prisma.candidateMarketing.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.candidateMarketing.groupBy({ by: ['dayRecruiterId'], _count: { id: true } }),
    prisma.candidateMarketing.groupBy({ by: ['nightRecruiterId'], _count: { id: true } }),
    prisma.candidateMarketing.groupBy({ by: ['dayTeamLeadId'], _count: { id: true } }),
    prisma.candidateMarketing.groupBy({ by: ['nightTeamLeadId'], _count: { id: true } })
  ]);
  res.json({ byStatus: byStatus.map(r => ({ status: r.status, count: r._count.id })), byDayRecruiter, byNightRecruiter, byDayLead, byNightLead });
});

// GET /api/reports/placement
router.get('/placement', async (req, res) => {
  const { country } = req.query;
  const where = country ? { country } : {};
  const [byStatus, byCountry, revenueStats] = await Promise.all([
    prisma.placement.groupBy({ by: ['status'], where, _count: { id: true } }),
    prisma.placement.groupBy({ by: ['country'], _count: { id: true } }),
    prisma.placement.aggregate({ _sum: { margin: true, billRate: true }, _avg: { margin: true } })
  ]);
  res.json({ byStatus: byStatus.map(r => ({ status: r.status, count: r._count.id })), byCountry, revenueStats });
});

// GET /api/reports/interviews
router.get('/interviews', async (req, res) => {
  const [byType, byResult, byStatus] = await Promise.all([
    prisma.interview.groupBy({ by: ['type'], _count: { id: true } }),
    prisma.interview.groupBy({ by: ['result'], _count: { id: true } }),
    prisma.interview.groupBy({ by: ['status'], _count: { id: true } })
  ]);
  res.json({
    byType: byType.map(r => ({ type: r.type, count: r._count.id })),
    byResult: byResult.map(r => ({ result: r.result, count: r._count.id })),
    byStatus: byStatus.map(r => ({ status: r.status, count: r._count.id }))
  });
});

// GET /api/reports/payments
router.get('/payments', async (req, res) => {
  const [totalRevenue, failedPayments, activeSubscriptions, canceledSubscriptions] = await Promise.all([
    prisma.payment.aggregate({ where: { status: 'succeeded' }, _sum: { amount: true } }),
    prisma.payment.count({ where: { status: 'failed' } }),
    prisma.subscription.count({ where: { status: 'active' } }),
    prisma.subscription.count({ where: { status: 'canceled' } })
  ]);
  res.json({ totalRevenue: totalRevenue._sum.amount || 0, failedPayments, activeSubscriptions, canceledSubscriptions });
});

module.exports = router;
