import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl || !tursoUrl.startsWith('libsql://')) {
  console.error('❌ Error: TURSO_DATABASE_URL is not set or does not start with "libsql://"');
  console.error('Please set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in server/.env');
  process.exit(1);
}

const client = createClient({
  url: tursoUrl,
  authToken: tursoToken,
});

const ddlStatements = [
  `CREATE TABLE IF NOT EXISTS "AdminUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS "CompanySettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "companyName" TEXT NOT NULL DEFAULT 'Cogniviz Technologies',
    "tagline" TEXT NOT NULL DEFAULT '"AI TO SIMPLIFY, TECH TO AMPLIFY"',
    "logoUrl" TEXT DEFAULT '/logo.png',
    "address" TEXT NOT NULL DEFAULT 'Gurunanak Pura, Nagpur',
    "gstin" TEXT NOT NULL DEFAULT '27ABCDE1234F1Z5',
    "state" TEXT NOT NULL DEFAULT 'Maharashtra',
    "stateCode" TEXT NOT NULL DEFAULT '27',
    "country" TEXT NOT NULL DEFAULT 'India',
    "email" TEXT NOT NULL DEFAULT 'contact.cogniviz@gmail.com',
    "phone" TEXT NOT NULL DEFAULT '+91-9373879915',
    "website" TEXT NOT NULL DEFAULT 'www.cogniviz.com',
    "bankName" TEXT NOT NULL DEFAULT 'HDFC Bank',
    "accountName" TEXT NOT NULL DEFAULT 'Cogniviz Technologies',
    "accountNumber" TEXT NOT NULL DEFAULT '50200012345678',
    "ifsc" TEXT NOT NULL DEFAULT 'HDFC0001234',
    "branch" TEXT NOT NULL DEFAULT 'Nagpur Main Branch',
    "upiId" TEXT NOT NULL DEFAULT 'cogniviz@hdfcbank',
    "invoicePrefix" TEXT NOT NULL DEFAULT 'INV',
    "invoiceNextNumber" INTEGER NOT NULL DEFAULT 1,
    "financialYear" TEXT NOT NULL DEFAULT '2026-27',
    "defaultCurrency" TEXT NOT NULL DEFAULT 'INR',
    "currencySymbol" TEXT NOT NULL DEFAULT '₹',
    "defaultDeclaration" TEXT NOT NULL DEFAULT 'We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct.',
    "invoiceFooter" TEXT NOT NULL DEFAULT 'This is a Computer Generated Invoice',
    "signatureUrl" TEXT,
    "stampUrl" TEXT,
    "showDeliveryNote" BOOLEAN NOT NULL DEFAULT true,
    "showModeOfPayment" BOOLEAN NOT NULL DEFAULT true,
    "showSupplierRef" BOOLEAN NOT NULL DEFAULT true,
    "showOtherRef" BOOLEAN NOT NULL DEFAULT true,
    "showBuyersOrder" BOOLEAN NOT NULL DEFAULT true,
    "showDespatchDoc" BOOLEAN NOT NULL DEFAULT true,
    "showDespatchedThrough" BOOLEAN NOT NULL DEFAULT true,
    "showDestination" BOOLEAN NOT NULL DEFAULT true,
    "showTermsOfDelivery" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerCode" TEXT,
    "name" TEXT NOT NULL,
    "companyName" TEXT,
    "gstin" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "billingAddress" TEXT,
    "state" TEXT,
    "stateCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'India',
    "notes" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "customerId" TEXT,
    "customerSnapshot" TEXT,
    "supplierSnapshot" TEXT,
    "deliveryNote" TEXT,
    "paymentTerms" TEXT,
    "supplierRef" TEXT,
    "otherRef" TEXT,
    "buyersOrderNo" TEXT,
    "orderDate" DATETIME,
    "despatchDocNo" TEXT,
    "despatchDate" DATETIME,
    "despatchedThrough" TEXT,
    "destination" TEXT,
    "placeOfSupply" TEXT,
    "termsOfDelivery" TEXT,
    "isInterstate" BOOLEAN NOT NULL DEFAULT false,
    "subtotal" REAL NOT NULL DEFAULT 0,
    "discount" REAL NOT NULL DEFAULT 0,
    "taxableAmount" REAL NOT NULL DEFAULT 0,
    "cgstAmount" REAL NOT NULL DEFAULT 0,
    "sgstAmount" REAL NOT NULL DEFAULT 0,
    "igstAmount" REAL NOT NULL DEFAULT 0,
    "totalTaxAmount" REAL NOT NULL DEFAULT 0,
    "otherCharges" REAL NOT NULL DEFAULT 0,
    "roundOff" REAL NOT NULL DEFAULT 0,
    "grandTotal" REAL NOT NULL DEFAULT 0,
    "amountInWords" TEXT,
    "amountReceived" REAL NOT NULL DEFAULT 0,
    "outstandingBalance" REAL NOT NULL DEFAULT 0,
    "pdfUrl" TEXT,
    "emailStatus" TEXT NOT NULL DEFAULT 'NOT_SENT',
    "emailSentAt" DATETIME,
    "whatsappShareCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "termsAndConditions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS "InvoiceItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "serialNumber" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "hsnSac" TEXT,
    "quantity" REAL NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'Nos',
    "rate" REAL NOT NULL DEFAULT 0,
    "taxableAmount" REAL NOT NULL DEFAULT 0,
    "gstRate" REAL NOT NULL DEFAULT 18,
    "cgstRate" REAL NOT NULL DEFAULT 0,
    "sgstRate" REAL NOT NULL DEFAULT 0,
    "igstRate" REAL NOT NULL DEFAULT 0,
    "cgstAmount" REAL NOT NULL DEFAULT 0,
    "sgstAmount" REAL NOT NULL DEFAULT 0,
    "igstAmount" REAL NOT NULL DEFAULT 0,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "customerId" TEXT,
    "paymentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" REAL NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'UPI',
    "transactionRef" TEXT,
    "notes" TEXT,
    "receiptNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS "ServiceItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "hsnSac" TEXT,
    "defaultRate" REAL NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'Nos',
    "defaultGstRate" REAL NOT NULL DEFAULT 18,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS "InvoiceCommunication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "subject" TEXT,
    "message" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvoiceCommunication_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS "InvoiceAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "performedBy" TEXT NOT NULL DEFAULT 'Admin',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvoiceAuditLog_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS "FileRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE UNIQUE INDEX IF NOT EXISTS "AdminUser_email_key" ON "AdminUser"("email");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Customer_customerCode_key" ON "Customer"("customerCode");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");`,
];

async function initTurso() {
  console.log(`📡 Connecting to Turso cloud database: ${tursoUrl}`);

  for (const sql of ddlStatements) {
    await client.execute(sql);
  }
  console.log('✅ Turso cloud tables created successfully!');

  // Seed default admin
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@cogniviz.com';
  const rawPassword = process.env.ADMIN_PASSWORD || 'Admin@Cogniviz2026';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(rawPassword, salt);

  await client.execute({
    sql: `INSERT INTO "AdminUser" ("id", "email", "passwordHash", "name", "role", "updatedAt")
          VALUES (?, ?, ?, ?, 'ADMIN', CURRENT_TIMESTAMP)
          ON CONFLICT("email") DO UPDATE SET "passwordHash" = excluded."passwordHash";`,
    args: ['admin_user_1', adminEmail, passwordHash, 'Cogniviz Administrator'],
  });
  console.log(`✅ Admin account seeded on Turso: ${adminEmail}`);

  // Seed company settings
  await client.execute({
    sql: `INSERT INTO "CompanySettings" (
            "id", "companyName", "tagline", "logoUrl", "address", "gstin", "state", "stateCode", "country",
            "email", "phone", "website", "bankName", "accountName", "accountNumber", "ifsc", "branch", "upiId",
            "invoicePrefix", "invoiceNextNumber", "financialYear", "defaultCurrency", "currencySymbol",
            "defaultDeclaration", "invoiceFooter"
          ) VALUES (
            'default', 'Cogniviz Technologies', '"AI TO SIMPLIFY, TECH TO AMPLIFY"', '/logo.png',
            'Gurunanak Pura, Nagpur', '27ABCDE1234F1Z5', 'Maharashtra', '27', 'India',
            'contact.cogniviz@gmail.com', '+91-9373879915', 'www.cogniviz.com',
            'HDFC Bank', 'Cogniviz Technologies', '50200012345678', 'HDFC0001234', 'Nagpur Main Branch', 'cogniviz@hdfcbank',
            'INV', 1, '2026-27', 'INR', '₹',
            'We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct.',
            'This is a Computer Generated Invoice'
          ) ON CONFLICT("id") DO UPDATE SET "tagline" = excluded."tagline", "address" = excluded."address";`,
    args: [],
  });
  console.log('✅ Company settings seeded on Turso!');

  // Seed Services Library
  const existingServices = await client.execute('SELECT COUNT(*) as count FROM "ServiceItem";');
  const count = Number(existingServices.rows[0].count) || 0;

  if (count === 0) {
    const services = [
      ['svc_1', 'Custom Web & Mobile App Development', 'Full-stack software engineering, architecture, frontend & backend implementation.', '998314', 75000, 'Month', 18],
      ['svc_2', 'AI & Machine Learning Consulting', 'Specialized enterprise AI integration, model fine-tuning, and prompt workflow automation.', '998313', 50000, 'Project', 18],
      ['svc_3', 'Cloud Infrastructure & DevOps Setup', 'Docker, CI/CD pipeline automation, Render/AWS cluster provisioning, and security hardening.', '998315', 35000, 'Nos', 18],
      ['svc_4', 'UI/UX Design & Prototyping', 'High-fidelity Figma design systems, wireframing, and interactive product prototypes.', '998399', 25000, 'Sprint', 18],
      ['svc_5', 'Software Maintenance & Support Retainer', 'Monthly technical support, bug fixing, security updates, and performance monitoring.', '998316', 20000, 'Month', 18],
    ];

    for (const [id, name, desc, hsn, rate, unit, gst] of services) {
      await client.execute({
        sql: `INSERT INTO "ServiceItem" ("id", "name", "description", "hsnSac", "defaultRate", "unit", "defaultGstRate", "updatedAt")
              VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP);`,
        args: [id, name, desc, hsn, rate, unit, gst],
      });
    }
    console.log('✅ Default Services/Items library seeded on Turso!');
  }

  console.log('🎉 Turso cloud database is 100% ready for production!');
}

initTurso().catch((err) => {
  console.error('❌ Turso initialization failed:', err);
  process.exit(1);
});

