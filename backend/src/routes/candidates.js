const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { logActivity } = require('../services/activityService');
const resumeParser = require('../services/resumeParser');

const router = express.Router();
const prisma = new PrismaClient();

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/resumes');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/candidates - list with filters
router.get('/', async (req, res) => {
  const { search, country, status, source, page = 1, limit = 20, recruiterId } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { technology: { contains: search, mode: 'insensitive' } }
    ];
  }
  if (country) where.country = country;
  if (source) where.source = source;
  if (recruiterId) where.assignedRecruiterId = recruiterId;

  const [candidates, total] = await Promise.all([
    prisma.candidate.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        addedBy: { select: { id: true, name: true } },
        assignedRecruiter: { select: { id: true, name: true } },
        recruitment: { select: { status: true } },
        training: { select: { status: true } },
        marketing: { select: { status: true } },
        placement: { select: { status: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.candidate.count({ where })
  ]);

  res.json({ candidates, total, page: parseInt(page), limit: parseInt(limit) });
});

// GET /api/candidates/:id - full profile
router.get('/:id', async (req, res) => {
  const candidate = await prisma.candidate.findUnique({
    where: { id: req.params.id },
    include: {
      addedBy: { select: { id: true, name: true, role: true } },
      assignedRecruiter: { select: { id: true, name: true } },
      recruitment: true,
      training: { include: { trainer: { select: { id: true, name: true } } } },
      marketing: {
        include: {
          dayRecruiter: { select: { id: true, name: true } },
          nightRecruiter: { select: { id: true, name: true } },
          dayTeamLead: { select: { id: true, name: true } },
          nightTeamLead: { select: { id: true, name: true } }
        }
      },
      placement: {
        include: {
          recruiter: { select: { id: true, name: true } },
          marketingRecruiter: { select: { id: true, name: true } },
          trainer: { select: { id: true, name: true } }
        }
      },
      interviews: { orderBy: { scheduledAt: 'desc' } },
      subscriptions: { include: { plan: true }, orderBy: { createdAt: 'desc' } },
      payments: { orderBy: { createdAt: 'desc' } },
      notes: {
        include: { author: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'desc' }
      },
      documents: { orderBy: { uploadedAt: 'desc' } },
      activities: {
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'desc' }
      }
    }
  });
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
  res.json(candidate);
});

// POST /api/candidates - create
router.post('/', [
  body('firstName').notEmpty(),
  body('lastName').notEmpty(),
  body('email').isEmail(),
  body('country').isIn(['USA', 'UK', 'CANADA']),
  body('yearsOfExperience')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 }).withMessage('yearsOfExperience must be a non-negative integer')
    .toInt()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const candidateData = { ...req.body, addedById: req.user.id };
    if (candidateData.yearsOfExperience === '') {
      candidateData.yearsOfExperience = null;
    }

    const candidate = await prisma.candidate.create({
      data: candidateData
    });
    await prisma.candidateRecruitment.create({ data: { candidateId: candidate.id } });
    await logActivity(candidate.id, req.user.id, 'recruitment', 'Candidate added', `Added by ${req.user.name}`);
    res.status(201).json(candidate);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/candidates/:id
router.patch('/:id', async (req, res) => {
  try {
    const updateData = { ...req.body };
    if ('yearsOfExperience' in updateData) {
      updateData.yearsOfExperience = updateData.yearsOfExperience === ''
        ? null
        : parseInt(updateData.yearsOfExperience, 10);
    }

    const candidate = await prisma.candidate.update({
      where: { id: req.params.id },
      data: updateData
    });
    await logActivity(req.params.id, req.user.id, 'system', 'Profile updated', `Updated by ${req.user.name}`);
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/candidates/:id/resume - upload resume
router.post('/:id/resume', upload.single('resume'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const filePath = `/uploads/resumes/${req.file.filename}`;
    let parsedData = null;
    try {
      parsedData = await resumeParser.parse(req.file.path);
    } catch (e) {
      console.warn('Resume parsing failed:', e.message);
    }

    const updated = await prisma.candidate.update({
      where: { id: req.params.id },
      data: { resumePath: filePath, ...(parsedData && { resumeParsedData: parsedData }) }
    });
    await prisma.document.create({
      data: { candidateId: req.params.id, name: req.file.originalname, path: filePath, type: 'resume' }
    });
    await logActivity(req.params.id, req.user.id, 'system', 'Resume uploaded', req.file.originalname);
    res.json({ candidate: updated, parsedData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/candidates/:id/notes
router.post('/:id/notes', [body('content').notEmpty(), body('module').notEmpty()], async (req, res) => {
  const note = await prisma.note.create({
    data: { candidateId: req.params.id, authorId: req.user.id, module: req.body.module, content: req.body.content },
    include: { author: { select: { id: true, name: true, role: true } } }
  });
  await logActivity(req.params.id, req.user.id, req.body.module, 'Note added', req.body.content.substring(0, 100));
  res.status(201).json(note);
});

module.exports = router;
