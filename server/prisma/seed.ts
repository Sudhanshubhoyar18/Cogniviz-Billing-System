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

  // Seed 3D Printing & Manufacturing Services & Products Library
  console.log('📦 Seeding 3D Printing Services, Modelling & Filament Library...');
  const servicesData = [
    {
      name: '3D Printing Service',
      description: 'Standard FDM/SLA/SLS additive manufacturing service including setup, printing, and post-processing.',
      hsnSac: '998898',
      defaultRate: 15,
      unit: 'Gram',
      defaultGstRate: 18,
    },
    {
      name: 'Basic 3D Printing Service',
      description: 'Rapid prototyping and draft print service for proof-of-concept models and test fits.',
      hsnSac: '998898',
      defaultRate: 8,
      unit: 'Gram',
      defaultGstRate: 18,
    },
    {
      name: '3D Modelling & CAD Design',
      description: '3D parametric modeling, reverse engineering, CAD drafting, and print-ready STL/STEP file preparation.',
      hsnSac: '998391',
      defaultRate: 1200,
      unit: 'Hour',
      defaultGstRate: 18,
    },
    {
      name: '3D Printing Filament Reselling',
      description: 'High-grade thermoplastic 3D printer filament (1.75mm PLA / PETG / ABS / TPU 1kg spool).',
      hsnSac: '39169090',
      defaultRate: 950,
      unit: 'Spool',
      defaultGstRate: 18,
    },
    {
      name: 'Custom Product Development',
      description: 'End-to-end product design, functional prototyping, iterative DFAM development, and pilot batching.',
      hsnSac: '998333',
      defaultRate: 15000,
      unit: 'Project',
      defaultGstRate: 18,
    },
    {
      name: 'Custom 3D Printed Key Chains',
      description: 'Customized embossed or dual-color personalized 3D printed key chains with metal ring.',
      hsnSac: '39269099',
      defaultRate: 75,
      unit: 'Nos',
      defaultGstRate: 18,
    },
    {
      name: 'Home Decors & Ornamental Products',
      description: '3D printed aesthetic home decor items, planters, lithophane lamps, and modern decorative vases.',
      hsnSac: '39264049',
      defaultRate: 650,
      unit: 'Nos',
      defaultGstRate: 18,
    },
    {
      name: 'Custom Parts & Components',
      description: 'Functional precision plastic components, replacement gears, mounting brackets, and enclosures.',
      hsnSac: '39269099',
      defaultRate: 350,
      unit: 'Nos',
      defaultGstRate: 18,
    },
    {
      name: '3D Printing with Customer Filament',
      description: 'Job-work 3D printing service using customer-supplied raw material / filament (labor & machine time).',
      hsnSac: '998873',
      defaultRate: 60,
      unit: 'Hour',
      defaultGstRate: 18,
    },
  ];

  for (const svc of servicesData) {
    const existing = await prisma.serviceItem.findFirst({
      where: { name: svc.name },
    });

    if (existing) {
      await prisma.serviceItem.update({
        where: { id: existing.id },
        data: {
          description: svc.description,
          hsnSac: svc.hsnSac,
          defaultRate: svc.defaultRate,
          unit: svc.unit,
          defaultGstRate: svc.defaultGstRate,
        },
      });
    } else {
      await prisma.serviceItem.create({
        data: svc,
      });
    }
  }
  console.log('✅ 3D Printing Services & HSN/SAC items initialized!');

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
