import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Seed or update Admin User
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@cogniviz.com';
  const rawPassword = process.env.ADMIN_PASSWORD || 'Admin@Cogniviz2026';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(rawPassword, salt);

  const admin = await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      name: process.env.ADMIN_NAME || 'Cogniviz Administrator',
    },
    create: {
      email: adminEmail,
      passwordHash,
      name: process.env.ADMIN_NAME || 'Cogniviz Administrator',
      role: 'ADMIN',
    },
  });
  console.log(`✅ Admin account initialized: ${admin.email}`);

  // 2. Seed Default Company Settings
  const settings = await prisma.companySettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      companyName: 'Cogniviz Technologies',
      address: 'Plot 12, Tech Park, Electronic City, Bengaluru, Karnataka 560100',
      gstin: '29ABCDE1234F1Z5',
      state: 'Karnataka',
      stateCode: '29',
      country: 'India',
      email: 'contact@cogniviz.com',
      phone: '+91 9876543210',
      website: 'www.cogniviz.com',
      bankName: 'HDFC Bank',
      accountName: 'Cogniviz Technologies Pvt Ltd',
      accountNumber: '50200012345678',
      ifsc: 'HDFC0001234',
      branch: 'Electronic City, Bengaluru',
      upiId: 'cogniviz@hdfcbank',
      invoicePrefix: 'INV',
      invoiceNextNumber: 1,
      financialYear: '2026-27',
      defaultCurrency: 'INR',
      currencySymbol: '₹',
      defaultDeclaration: 'We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct.',
      invoiceFooter: 'This is a Computer Generated Invoice',
      showDeliveryNote: true,
      showModeOfPayment: true,
      showSupplierRef: true,
      showOtherRef: true,
      showBuyersOrder: true,
      showDespatchDoc: true,
      showDespatchedThrough: true,
      showDestination: true,
      showTermsOfDelivery: true,
    },
  });
  console.log(`✅ Company settings initialized: ${settings.companyName}`);

  // 3. Seed Default Reusable Services / Items Library
  const existingServicesCount = await prisma.serviceItem.count();
  if (existingServicesCount === 0) {
    await prisma.serviceItem.createMany({
      data: [
        {
          name: 'Custom Web & Mobile App Development',
          description: 'Full-stack software engineering, architecture, frontend & backend implementation.',
          hsnSac: '998314',
          defaultRate: 75000,
          unit: 'Month',
          defaultGstRate: 18,
        },
        {
          name: 'AI & Machine Learning Consulting',
          description: 'Specialized enterprise AI integration, model fine-tuning, and prompt workflow automation.',
          hsnSac: '998313',
          defaultRate: 50000,
          unit: 'Project',
          defaultGstRate: 18,
        },
        {
          name: 'Cloud Infrastructure & DevOps Setup',
          description: 'Docker, CI/CD pipeline automation, Render/AWS cluster provisioning, and security hardening.',
          hsnSac: '998315',
          defaultRate: 35000,
          unit: 'Nos',
          defaultGstRate: 18,
        },
        {
          name: 'UI/UX Design & Prototyping',
          description: 'High-fidelity Figma design systems, wireframing, and interactive product prototypes.',
          hsnSac: '998399',
          defaultRate: 25000,
          unit: 'Sprint',
          defaultGstRate: 18,
        },
        {
          name: 'Software Maintenance & Support Retainer',
          description: 'Monthly technical support, bug fixing, security updates, and performance monitoring.',
          hsnSac: '998316',
          defaultRate: 20000,
          unit: 'Month',
          defaultGstRate: 18,
        }
      ]
    });
    console.log('✅ Default Services/Items library seeded.');
  }

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
