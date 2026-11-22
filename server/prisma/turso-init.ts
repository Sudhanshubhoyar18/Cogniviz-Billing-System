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

  // Seed 3D Printing & Manufacturing Services & Products Library with Statutory GST Classifications
  const services = [
    ['svc_gst_1', 'PLA / ABS / PETG / TPU 3D Printing Filament Resale', 'High-grade thermoplastic 3D printer filament (1.75mm PLA / PETG / ABS / TPU 1kg spool).', '39169090', 950, 'Spool', 18],
    ['svc_gst_2', '3D Printing Service – Customer Supplied Filament', 'Job-work 3D printing service using customer-supplied raw material / filament (labor & machine time).', '998920', 60, 'Hour', 18],
    ['svc_gst_3', '3D Modelling / CAD Design Services', '3D parametric modeling, reverse engineering, CAD drafting, and print-ready STL/STEP file preparation.', '998391', 1200, 'Hour', 18],
    ['svc_gst_4', 'Plastic Keychains / General Custom Plastic Parts', 'Customized embossed keychains and precision functional plastic components.', '39269099', 75, 'Nos', 18],
    ['svc_gst_5', 'Plastic Home Decor / Ornamental Products', '3D printed aesthetic home decor items, ornamental products, planters, and decorative vases.', '39264099', 650, 'Nos', 18],
    ['svc_gst_6', 'Plastic Household Utility Articles', 'Plastic household utility articles, organizers, brackets, kitchen aids, and functional wares.', '39249090', 250, 'Nos', 18],
    ['svc_3d_1', '3D Printing Service', 'Standard FDM/SLA/SLS additive manufacturing service including setup, printing, and post-processing.', '998898', 15, 'Gram', 18],
    ['svc_3d_2', 'Basic 3D Printing Service', 'Rapid prototyping and draft print service for proof-of-concept models and test fits.', '998898', 8, 'Gram', 18],
    ['svc_3d_5', 'Custom Product Development', 'End-to-end product design, functional prototyping, iterative DFAM development, and pilot batching.', '998333', 15000, 'Project', 18],
    ['svc_3d_4', '3D Printing Filament Reselling', 'High-grade thermoplastic 3D printer filament (1.75mm PLA / PETG / ABS / TPU 1kg spool).', '39169090', 950, 'Spool', 18],
    ['svc_3d_7', 'Home Decors & Ornamental Products', '3D printed aesthetic home decor items, planters, lithophane lamps, and modern decorative vases.', '39264099', 650, 'Nos', 18],
    ['svc_3d_9', '3D Printing with Customer Filament', 'Job-work 3D printing service using customer-supplied raw material / filament (labor & machine time).', '998920', 60, 'Hour', 18],
  ];

  for (const [id, name, desc, hsn, rate, unit, gst] of services) {
    await client.execute({
      sql: `INSERT INTO "ServiceItem" ("id", "name", "description", "hsnSac", "defaultRate", "unit", "defaultGstRate", "updatedAt")
            VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT("id") DO UPDATE SET
              "name" = excluded."name",
              "description" = excluded."description",
              "hsnSac" = excluded."hsnSac",
              "defaultRate" = excluded."defaultRate",
              "unit" = excluded."unit",
              "defaultGstRate" = excluded."defaultGstRate";`,
      args: [id, name, desc, hsn, rate, unit, gst],
    });
  }
  console.log('✅ 3D Printing & Product Services library seeded on Turso!');

  console.log('🎉 Turso cloud database is 100% ready for production!');
}

initTurso().catch((err) => {
  console.error('❌ Turso initialization failed:', err);
  process.exit(1);
});

