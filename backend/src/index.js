require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const authRoutes = require('./routes/auth');
const candidateRoutes = require('./routes/candidates');
const { recruitmentRouter, trainingRouter, marketingRouter } = require('./routes/recruitment');
const interviewRoutes = require('./routes/interviews');
const placementRoutes = require('./routes/placements');
const paymentRoutes = require('./routes/payments');
const reportRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/users');

const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET environment variable. Set JWT_SECRET in backend/.env or your environment.');
  process.exit(1);
}

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Stripe webhook (must be before json parser for raw body)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/candidates', authenticateToken, candidateRoutes);
app.use('/api/recruitment', authenticateToken, recruitmentRouter);
app.use('/api/training', authenticateToken, trainingRouter);
app.use('/api/marketing', authenticateToken, marketingRouter);
app.use('/api/interviews', authenticateToken, interviewRoutes);
app.use('/api/placements', authenticateToken, placementRoutes);
app.use('/api/payments', paymentRoutes); // webhook needs raw body
app.use('/api/reports', authenticateToken, reportRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/users', authenticateToken, userRoutes);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`StaffPro API running on port ${PORT}`);
});

module.exports = app;
