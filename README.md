# Cogniviz Technologies — CRM & Indian GST Billing Management System

An enterprise-grade, single-user Cloud CRM and Billing Management System built specifically for **Cogniviz Technologies**. Engineered for precision Indian GST invoicing, payment collection tracking, customer relationships, and statutory reporting.

---

## 📸 Design References Implemented

1. **Dashboard UI (Reference 1)**:
   - Clean white background with soft gray card surfaces (`#F8F9FA` / `#FFFFFF`).
   - Rounded cards (`rounded-2xl`), subtle borders (`border-slate-200`), and soft shadows.
   - Minimal navigation with global search (`⌘K`), quick action buttons, and clear profile indicator.
   - Six real-time KPI metric cards, interactive revenue & collection charts with Recharts, payment status badges, and recent invoice history.

2. **Tax Invoice PDF & Live Preview (Reference 2)**:
   - **Pixel-accurate 1:1 recreation of the uploaded tax invoice document structure**:
     - **Top Left**: Supplier Company details (Name, Address, State, GSTIN, Contact, Logo).
     - **Top Right**: Structured metadata grid (Invoice No, Dated, Delivery Note, Mode/Terms of Payment, Supplier Ref, Other Ref, Buyer's Order No, Order Date, Despatch Doc No, Delivery Note Date, Despatched through, Destination, Terms of Delivery).
     - **Buyer Box**: Customer Name, Company, Billing Address, Country, GSTIN, Place of Supply.
     - **Items Table**: Sl. No., Description, HSN/SAC, Quantity, Unit, Rate, Taxable Amount, GST %, Total Amount.
     - **Tax Summary Box**: Assessable Value, CGST (Rate & Amount), SGST (Rate & Amount), IGST (Rate & Amount), Total Tax Amount.
     - **Bottom Sections**: Grand Total, Amount Chargeable in words (`Indian Rupees ... Only`), Tax Amount in words, Bank & UPI Details, Declaration, and Authorized Signatory box (`for Cogniviz Technologies`, Signature/Stamp, `Authorised Signatory`).
     - **Footer**: `"This is a Computer Generated Invoice"`.
   - Adapted for **Indian GST (CGST/SGST intrastate, IGST interstate)**, **HSN/SAC codes**, and **INR (`₹`) currency**.

---

## 🛠 Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts
- **Backend**: Node.js, Express.js, TypeScript, Helmet, Rate Limiter
- **Database Engine**: Turso Cloud (libSQL / edge SQLite) with local SQLite fallback
- **ORM**: Prisma ORM with `@prisma/adapter-libsql` and `@libsql/client`
- **PDF Generation**: High-fidelity HTML/CSS print rendering via `puppeteer-core`
- **Hosting Platforms**:
  - **Online Database**: [Turso](https://turso.tech)
  - **Web Application**: [Render](https://render.com)

---

## 🚀 Quick Start (Local Development)

All files are stored in `e:\cogniviz Technologies\Billing system`.

### 1. Install Dependencies
```bash
# In the root folder:
npm run install:all
```

### 2. Database Initialization
```bash
cd server
npx prisma db push
npm run seed
```
This initializes `dev.db` and seeds the default administrator account:
- **Email**: `admin@cogniviz.com`
- **Password**: `Admin@Cogniviz2026`

### 3. Run Development Servers
In two separate terminals:
```bash
# Terminal 1 - Backend API (Port 5000):
cd server && npm run dev

# Terminal 2 - Frontend UI (Port 5173):
cd client && npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 🌐 Production Deployment Guide

### Step 1: Configure Online Database on Turso
1. Install Turso CLI or log in at [turso.tech](https://turso.tech):
   ```bash
   turso auth signup
   # or
   turso auth login
   ```
2. Create a new database:
   ```bash
   turso db create cogniviz-billing-db
   ```
3. Get your database URL:
   ```bash
   turso db show cogniviz-billing-db --url
   # Example: libsql://cogniviz-billing-db-yourorg.turso.io
   ```
4. Create an authentication token:
   ```bash
   turso db tokens create cogniviz-billing-db
   ```
5. Push schema to Turso:
   ```bash
   # Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in server/.env, then:
   cd server
   npx prisma db push
   npm run seed
   ```

---

### Step 2: Deploy to Render
1. Push your repository to GitHub or GitLab.
2. Sign in to [Render](https://render.com) and click **New +** → **Web Service**.
3. Connect your repository.
4. Set the following settings:
   - **Name**: `cogniviz-billing-system`
   - **Region**: Singapore (or nearest to India)
   - **Branch**: `main`
   - **Root Directory**: Leave blank (uses repository root)
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install && cd client && npm install && npm run build && cd ../server && npm install && npm run build && cd ..
     ```
   - **Start Command**:
     ```bash
     cd server && npm run start
     ```
   - **Plan**: `Free` or `Starter`

5. Add Environment Variables in the **Environment** tab on Render:
   | Key | Value |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `JWT_SECRET` | *(Generate a random 32+ character string)* |
   | `ADMIN_EMAIL` | `admin@cogniviz.com` |
   | `ADMIN_PASSWORD` | `YourSecurePassword2026` |
   | `ADMIN_NAME` | `Cogniviz Administrator` |
   | `TURSO_DATABASE_URL` | `libsql://cogniviz-billing-db-yourorg.turso.io` |
   | `TURSO_AUTH_TOKEN` | `your-turso-auth-token` |
   | `SMTP_HOST` | `smtp.gmail.com` *(or your SMTP host)* |
   | `SMTP_PORT` | `587` |
   | `SMTP_USER` | `billing@cogniviz.com` |
   | `SMTP_PASS` | `your-google-app-password` |
   | `SMTP_FROM` | `"Cogniviz Billing" <billing@cogniviz.com>` |

6. Click **Deploy Web Service**. Render will automatically build the React frontend into `client/dist`, compile the Express server, and serve the application on a free HTTPS URL (e.g. `https://cogniviz-billing-system.onrender.com`).

---

### Step 3: Connect Custom Domain & HTTPS
1. In your Render Dashboard, go to your Web Service → **Settings** → **Custom Domains**.
2. Click **Add Custom Domain** (e.g., `billing.cogniviz.com`).
3. In your DNS provider (GoDaddy, Cloudflare, Namecheap):
   - Add a `CNAME` record pointing `billing` to your Render service URL (e.g. `cogniviz-billing-system.onrender.com`).
4. Render automatically provisions and renews a free Let's Encrypt SSL/TLS certificate.

---

### Step 4: Configure Email Dispatch (Gmail / SMTP)
1. If using Gmail / Google Workspace:
   - Enable 2-Step Verification on your Google account.
   - Go to Google Account → **Security** → **App Passwords**.
   - Create an App Password for "Billing System".
   - Copy the 16-character password and set it as `SMTP_PASS` in your environment variables.
2. In the app, after issuing any invoice, click **Email** to instantly send the official PDF invoice with custom subject & body to the client.

---

### Step 5: WhatsApp Direct Sharing
1. For every issued invoice, click the **WhatsApp** button.
2. The system generates a direct, secure downloadable PDF link and opens WhatsApp Web / mobile app with a pre-filled, professional greeting and invoice link.
3. Every share action is tracked in the document audit trail.

---

### Step 6: Backup & Data Restoration
#### 1. Turso Cloud Automated Backups
Turso automatically replicates data and provides point-in-time recovery. To create a manual snapshot:
```bash
turso db dump cogniviz-billing-db > backup_$(date +%Y%m%d).sql
```

#### 2. Restoring from a Snapshot
```bash
turso db shell cogniviz-billing-db < backup_20261118.sql
```

---

## 🔒 Security Specifications
- **Single-Admin Security**: Public user registrations are permanently disabled.
- **Password Protection**: Passwords hashed using `bcryptjs` with 10 salt rounds.
- **Session Tokens**: JWT authentication with rate-limiting on login routes to prevent brute-force attacks.
- **Audit Logs**: Every invoice creation, modification, status change, payment collection, and email transmission is logged with timestamp and user details.
- **Monetary Precision**: Rounded to 2 decimal places with zero floating-point artifacts.
