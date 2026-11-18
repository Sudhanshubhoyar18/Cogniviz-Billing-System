import nodemailer from 'nodemailer';
import { config } from '../config.js';

export interface SendInvoiceEmailParams {
  to: string;
  customerName: string;
  invoiceNumber: string;
  grandTotal: number;
  pdfPath: string;
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
      error: 'SMTP credentials not configured in Settings/.env. Please update SMTP settings to enable automated email dispatch.',
    };
  }

  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });

  const subject = customSubject || `Tax Invoice ${invoiceNumber} from Cogniviz Technologies`;
  const defaultBody = `Dear ${customerName},\n\nPlease find attached your Tax Invoice ${invoiceNumber} for the amount of ₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.\n\nThank you for choosing Cogniviz Technologies.\n\nBest regards,\nCogniviz Technologies`;
  const text = customMessage || defaultBody;

  try {
    const info = await transporter.sendMail({
      from: config.smtp.from,
      to,
      subject,
      text,
      attachments: [
        {
          filename: `Invoice_${invoiceNumber.replace(/[\/\\?%*:|"<>]/g, '_')}.pdf`,
          path: pdfPath,
        },
      ],
    });

    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error('Email send failed:', err);
    return { success: false, error: err.message || 'Failed to dispatch email' };
  }
}
