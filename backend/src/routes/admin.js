const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();
const prisma = new PrismaClient();

// ─── STATUS CONFIG ─────────────────────────────────────────────────────────────
router.get('/statuses', async (req, res) => {
  const { module } = req.query;
  const where = module ? { module } : {};
  const statuses = await prisma.statusConfig.findMany({ where, orderBy: { order: 'asc' } });
  res.json(statuses);
});

router.post('/statuses', requireAdmin, async (req, res) => {
  const status = await prisma.statusConfig.create({ data: req.body });
  res.status(201).json(status);
});

router.patch('/statuses/:id', requireAdmin, async (req, res) => {
  const status = await prisma.statusConfig.update({ where: { id: req.params.id }, data: req.body });
  res.json(status);
});

router.delete('/statuses/:id', requireAdmin, async (req, res) => {
  await prisma.statusConfig.delete({ where: { id: req.params.id } });
  res.json({ message: 'Deleted' });
});

module.exports = router;
