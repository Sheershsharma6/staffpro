const express = require('express');
const Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireFinance } = require('../middleware/auth');
const { logActivity } = require('../services/activityService');

const router = express.Router();
const prisma = new PrismaClient();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Webhook - raw body required
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const data = event.data.object;

  switch (event.type) {
    case 'payment_intent.succeeded':
      await prisma.payment.updateMany({
        where: { stripePaymentIntentId: data.id },
        data: { status: 'succeeded' }
      });
      break;
    case 'payment_intent.payment_failed':
      await prisma.payment.updateMany({
        where: { stripePaymentIntentId: data.id },
        data: { status: 'failed' }
      });
      break;
    case 'customer.subscription.updated':
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: data.id },
        data: {
          status: data.status,
          currentPeriodStart: new Date(data.current_period_start * 1000),
          currentPeriodEnd: new Date(data.current_period_end * 1000)
        }
      });
      break;
    case 'customer.subscription.deleted':
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: data.id },
        data: { status: 'canceled', canceledAt: new Date() }
      });
      break;
    case 'invoice.payment_succeeded':
      if (data.subscription) {
        const sub = await prisma.subscription.findFirst({ where: { stripeSubscriptionId: data.subscription } });
        if (sub) {
          await prisma.payment.create({
            data: {
              candidateId: sub.candidateId,
              subscriptionId: sub.id,
              stripeInvoiceId: data.id,
              amount: data.amount_paid / 100,
              currency: data.currency,
              status: 'succeeded',
              invoiceUrl: data.hosted_invoice_url
            }
          });
        }
      }
      break;
  }

  res.json({ received: true });
});

// All routes below require auth
router.use(authenticateToken);

// GET /api/payments/plans
router.get('/plans', async (req, res) => {
  const plans = await prisma.subscriptionPlan.findMany({ where: { isActive: true } });
  res.json(plans);
});

// POST /api/payments/plans - admin
router.post('/plans', requireFinance, async (req, res) => {
  const { name, stripePriceId, amount, currency, interval, description } = req.body;
  const plan = await prisma.subscriptionPlan.create({
    data: { name, stripePriceId, amount, currency: currency || 'usd', interval: interval || 'month', description }
  });
  res.status(201).json(plan);
});

// POST /api/payments/create-customer
router.post('/create-customer', requireFinance, async (req, res) => {
  const { candidateId } = req.body;
  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
  if (candidate.stripeCustomerId) return res.json({ customerId: candidate.stripeCustomerId });

  const customer = await stripe.customers.create({
    email: candidate.email,
    name: `${candidate.firstName} ${candidate.lastName}`,
    metadata: { candidateId }
  });

  await prisma.candidate.update({ where: { id: candidateId }, data: { stripeCustomerId: customer.id } });
  await logActivity(candidateId, req.user.id, 'payment', 'Stripe customer created', null);
  res.json({ customerId: customer.id });
});

// POST /api/payments/create-subscription
router.post('/create-subscription', requireFinance, async (req, res) => {
  const { candidateId, planId } = req.body;
  const [candidate, plan] = await Promise.all([
    prisma.candidate.findUnique({ where: { id: candidateId } }),
    prisma.subscriptionPlan.findUnique({ where: { id: planId } })
  ]);
  if (!candidate || !plan) return res.status(404).json({ error: 'Candidate or plan not found' });
  if (!candidate.stripeCustomerId) return res.status(400).json({ error: 'Stripe customer not created yet' });

  const stripeSub = await stripe.subscriptions.create({
    customer: candidate.stripeCustomerId,
    items: [{ price: plan.stripePriceId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent']
  });

  const subscription = await prisma.subscription.create({
    data: {
      candidateId,
      planId,
      stripeSubscriptionId: stripeSub.id,
      status: stripeSub.status,
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000)
    }
  });
  await logActivity(candidateId, req.user.id, 'payment', `Subscription created: ${plan.name}`, null);
  res.json({ subscription, clientSecret: stripeSub.latest_invoice?.payment_intent?.client_secret });
});

// POST /api/payments/cancel-subscription
router.post('/cancel-subscription', requireFinance, async (req, res) => {
  const { subscriptionId } = req.body;
  const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!sub) return res.status(404).json({ error: 'Subscription not found' });

  await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: 'canceled', canceledAt: new Date() }
  });
  await logActivity(sub.candidateId, req.user.id, 'payment', 'Subscription canceled', null);
  res.json(updated);
});

// GET /api/payments/portal - Stripe Customer Portal session
router.get('/portal/:candidateId', async (req, res) => {
  const candidate = await prisma.candidate.findUnique({ where: { id: req.params.candidateId } });
  if (!candidate?.stripeCustomerId) return res.status(400).json({ error: 'No Stripe customer' });

  const session = await stripe.billingPortal.sessions.create({
    customer: candidate.stripeCustomerId,
    return_url: `${process.env.FRONTEND_URL}/payments`
  });
  res.json({ url: session.url });
});

// GET /api/payments/history/:candidateId
router.get('/history/:candidateId', async (req, res) => {
  const payments = await prisma.payment.findMany({
    where: { candidateId: req.params.candidateId },
    include: { subscription: { include: { plan: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(payments);
});

module.exports = router;
