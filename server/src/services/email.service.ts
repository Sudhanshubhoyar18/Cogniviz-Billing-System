import fs from 'fs';
import nodemailer from 'nodemailer';
import { config } from '../config.js';

export interface SendInvoiceEmailParams {
  to: string;
  customerName: string;
  invoiceNumber: string;
  grandTotal: number;
  pdfPath?: string;
  customSubject?: string;
  customMessage?: string;
}

export async function sendInvoiceEmail(
  params: SendInvoiceEmailParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, customerName, invoiceNumber, grandTotal, pdfPath, customSubject, customMessage } = params;

  if (!config.smtp.user || !config.smtp.pass) {
    return {
      success: false,
      error: 'SMTP credentials not configured in .env. Please provide SMTP_USER and SMTP_PASS (Google App Password).',
    };
  }

  const transporter = nodemailer.createTransport({
    host: config.smtp.host || 'smtp.gmail.com',
    port: config.smtp.port || 587,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass.replace(/\s+/g, ''), // Strip any accidental spaces from 16-char app password
    },
  });

  const subject = customSubject || `Tax Invoice ${invoiceNumber} from Cogniviz Technologies`;
  const defaultBody = `Dear ${customerName},\n\nPlease find attached your Tax Invoice ${invoiceNumber} for the amount of ₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.\n\nThank you for choosing Cogniviz Technologies.\n\nBest regards,\nCogniviz Technologies`;
  const text = customMessage || defaultBody;

  const attachments: Array<{ filename: string; path: string }> = [];
  if (pdfPath && fs.existsSync(pdfPath)) {
    attachments.push({
      filename: `Invoice_${invoiceNumber.replace(/[\/\\?%*:|"<>]/g, '_')}.pdf`,
      path: pdfPath,
    });
  }

  try {
    const info = await transporter.sendMail({
      from: config.smtp.from,
      to,
      subject,
      text,
      attachments,
    });

    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error('Email send failed:', err);
    let msg = err.message || 'Failed to dispatch email';
    if (
      err.code === 'EAUTH' ||
      msg.includes('535') ||
      msg.includes('BadCredentials') ||
      msg.includes('Username and Password not accepted')
    ) {
      msg = 'Gmail Authentication Failed (535): Google does not accept standard account passwords for SMTP. You must use a 16-character Google "App Password" (generate at https://myaccount.google.com/apppasswords) in SMTP_PASS.';
    }
    return { success: false, error: msg };
  }
}

