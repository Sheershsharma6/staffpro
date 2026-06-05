const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create super admin
  const adminHash = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@staffpro.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@staffpro.com',
      passwordHash: adminHash,
      role: 'SUPER_ADMIN',
      isActive: true
    }
  });
  console.log('Admin created:', admin.email);

  // Seed status configs
  const statuses = [
    // Recruitment
    { module: 'recruitment', label: 'New Lead', color: '#94a3b8', order: 1 },
    { module: 'recruitment', label: 'Contacted', color: '#60a5fa', order: 2 },
    { module: 'recruitment', label: 'Not Responding', color: '#f87171', order: 3 },
    { module: 'recruitment', label: 'Interested', color: '#34d399', order: 4 },
    { module: 'recruitment', label: 'Agreement Sent', color: '#fbbf24', order: 5 },
    { module: 'recruitment', label: 'Agreement Signed', color: '#10b981', order: 6 },
    { module: 'recruitment', label: 'Rejected', color: '#ef4444', order: 7 },
    { module: 'recruitment', label: 'Sent to Training', color: '#a78bfa', order: 8 },
    { module: 'recruitment', label: 'Sent to Marketing', color: '#f97316', order: 9 },
    // Training
    { module: 'training', label: 'Evaluation', color: '#94a3b8', order: 1 },
    { module: 'training', label: 'Training', color: '#60a5fa', order: 2 },
    { module: 'training', label: 'Interview Prep', color: '#fbbf24', order: 3 },
    { module: 'training', label: 'Mock Interview Scheduled', color: '#a78bfa', order: 4 },
    { module: 'training', label: 'Not Responding', color: '#f87171', order: 5 },
    { module: 'training', label: 'Ready for Marketing', color: '#10b981', order: 6 },
    { module: 'training', label: 'In Marketing', color: '#f97316', order: 7 },
    // Marketing
    { module: 'marketing', label: 'In Marketing', color: '#60a5fa', order: 1 },
    { module: 'marketing', label: 'Paused', color: '#f87171', order: 2 },
    { module: 'marketing', label: 'Interviewing', color: '#fbbf24', order: 3 },
    { module: 'marketing', label: 'Placed', color: '#10b981', order: 4 },
    { module: 'marketing', label: 'Closed', color: '#94a3b8', order: 5 },
    // Interview
    { module: 'interview', label: 'Scheduled', color: '#60a5fa', order: 1 },
    { module: 'interview', label: 'Completed', color: '#10b981', order: 2 },
    { module: 'interview', label: 'Rescheduled', color: '#fbbf24', order: 3 },
    { module: 'interview', label: 'No Show', color: '#f87171', order: 4 },
    { module: 'interview', label: 'Selected', color: '#34d399', order: 5 },
    { module: 'interview', label: 'Rejected', color: '#ef4444', order: 6 },
    { module: 'interview', label: 'Waiting for Feedback', color: '#94a3b8', order: 7 },
    { module: 'interview', label: 'Next Round', color: '#a78bfa', order: 8 },
    // Placement
    { module: 'placement', label: 'Offered', color: '#fbbf24', order: 1 },
    { module: 'placement', label: 'Accepted', color: '#60a5fa', order: 2 },
    { module: 'placement', label: 'Started', color: '#a78bfa', order: 3 },
    { module: 'placement', label: 'Active', color: '#10b981', order: 4 },
    { module: 'placement', label: 'Ended', color: '#94a3b8', order: 5 },
    { module: 'placement', label: 'Cancelled', color: '#ef4444', order: 6 }
  ];

  for (const s of statuses) {
    await prisma.statusConfig.upsert({
      where: { module_label: { module: s.module, label: s.label } },
      update: {},
      create: s
    });
  }
  console.log(`${statuses.length} status configs seeded`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
