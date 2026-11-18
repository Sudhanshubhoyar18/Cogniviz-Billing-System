import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with updated company profile...');

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

  const settings = await prisma.companySettings.upsert({
    where: { id: 'default' },
    update: {
      companyName: 'Cogniviz Technologies',
      tagline: '"AI TO SIMPLIFY, TECH TO AMPLIFY"',
      address: 'Gurunanak Pura, Nagpur',
      gstin: '27ABCDE1234F1Z5',
      state: 'Maharashtra',
      stateCode: '27',
      country: 'India',
      email: 'contact.cogniviz@gmail.com',
      phone: '+91-9373879915',
      logoUrl: '/logo.png',
      accountName: 'Cogniviz Technologies',
      branch: 'Nagpur Main Branch',
    },
    create: {
      id: 'default',
      companyName: 'Cogniviz Technologies',
      tagline: '"AI TO SIMPLIFY, TECH TO AMPLIFY"',
      address: 'Gurunanak Pura, Nagpur',
      gstin: '27ABCDE1234F1Z5',
      state: 'Maharashtra',
      stateCode: '27',
      country: 'India',
      email: 'contact.cogniviz@gmail.com',
      phone: '+91-9373879915',
      website: 'www.cogniviz.com',
      logoUrl: '/logo.png',
      bankName: 'HDFC Bank',
      accountName: 'Cogniviz Technologies',
      accountNumber: '50200012345678',
      ifsc: 'HDFC0001234',
      branch: 'Nagpur Main Branch',
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
  console.log(`✅ Company settings updated: ${settings.companyName} - ${settings.tagline}`);

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
