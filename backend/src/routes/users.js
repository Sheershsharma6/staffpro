const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();
const prisma = new PrismaClient();

router.get('/', requireAdmin, async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id:true, name:true, email:true, role:true, isActive:true, country:true, shiftType:true, createdAt:true }
  });
  res.json(users);
});

router.post('/', requireAdmin, async (req, res) => {
  const { name, email, password, role, country, shiftType } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role, country, shiftType },
    select: { id:true, name:true, email:true, role:true, isActive:true }
  });
  res.status(201).json(user);
});

router.patch('/:id', requireAdmin, async (req, res) => {
  const { password, ...rest } = req.body;
  const data = { ...rest };
  if (password) data.passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.update({
    where: { id: req.params.id }, data,
    select: { id:true, name:true, email:true, role:true, isActive:true }
  });
  res.json(user);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.json({ message: 'User deactivated' });
});

module.exports = router;
