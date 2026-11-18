import React from 'react';
import { CompanySettings, Customer, InvoiceItem } from '../../types';
import { formatNumberOnly, formatDate } from '../../utils/formatters';
import { numberToIndianWords } from '../../utils/numberToWords';

interface InvoicePreviewProps {
  invoiceNumber: string;
  invoiceDate: string | Date;
  supplier: CompanySettings | null;
  customer: Partial<Customer> | null;
  items: InvoiceItem[];
  deliveryNote?: string;
  paymentTerms?: string;
  supplierRef?: string;
  otherRef?: string;
  buyersOrderNo?: string;
  orderDate?: string | Date;
  despatchDocNo?: string;
  despatchDate?: string | Date;
  despatchedThrough?: string;
  destination?: string;
  placeOfSupply?: string;
  termsOfDelivery?: string;
  isInterstate: boolean;
  subtotal: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTaxAmount: number;
  grandTotal: number;
  amountInWords?: string;
  className?: string;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  invoiceNumber,
  invoiceDate,
  supplier,
  customer,
  items,
  deliveryNote,
  paymentTerms,
  supplierRef,
  otherRef,
  buyersOrderNo,
  orderDate,
  despatchDocNo,
  despatchDate,
  despatchedThrough,
  destination,
  placeOfSupply,
  termsOfDelivery,
  isInterstate,
  subtotal,
  taxableAmount,
  cgstAmount,
  sgstAmount,
  igstAmount,
  totalTaxAmount,
  grandTotal,
  amountInWords,
  className = '',
}) => {
  const calculatedWords = amountInWords || numberToIndianWords(grandTotal);
  const taxWords = numberToIndianWords(totalTaxAmount);
  const totalQty = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);

  const supName = supplier?.companyName || 'Cogniviz Technologies';
  const supTagline = supplier?.tagline || '"AI TO SIMPLIFY, TECH TO AMPLIFY"';
  const supAddress = supplier?.address || 'Gurunanak Pura, Nagpur';
  const supState = supplier?.state || 'Maharashtra';
  const supStateCode = supplier?.stateCode || '27';
  const supGstin = supplier?.gstin || '27ABCDE1234F1Z5';
  const supEmail = supplier?.email || 'contact.cogniviz@gmail.com';
  const supPhone = supplier?.phone || '+91-9373879915';

  const buyerState = customer?.state || supState;
  const buyerPos = placeOfSupply || buyerState;

  return (
    <div className={`bg-white text-black text-[10px] leading-tight font-sans shadow-md border border-slate-300 p-4 md:p-6 rounded-lg select-text ${className}`}>
      {/* Title */}
      <div className="text-center font-bold text-sm uppercase tracking-wide mb-2 pb-1 border-b border-black">
        Tax Invoice
      </div>

      <div className="border border-black">
        {/* Top Header Grid: Supplier & Buyer on Left, Structured Metadata on Right */}
        <div className="grid grid-cols-2 border-b border-black divide-x divide-black">
          {/* Left Column: Supplier + Buyer */}
          <div className="flex flex-col">
            {/* Supplier Details (Text-only: Company Name, Tagline & Address) */}
            <div className="p-2 border-b border-black min-h-[90px]">
              <div className="font-bold text-xs uppercase tracking-wide text-black">{supName}</div>
              <div className="text-[9px] font-bold text-blue-900 tracking-wide mb-0.5">{supTagline}</div>
              <div className="text-[9.5px] text-neutral-800">{supAddress}</div>
              <div className="text-[9.5px] mt-0.5">
                <span className="font-semibold">State:</span> {supState} (Code: {supStateCode})
              </div>
              <div className="text-[9.5px]">
                <span className="font-semibold">GSTIN:</span> {supGstin}
              </div>
              <div className="text-[9px] text-neutral-700">
                Phone: {supPhone} | Email: {supEmail}
              </div>
            </div>

            {/* Buyer Details */}
            <div className="p-2 flex-1 bg-white">
              <div className="font-bold text-[9px] text-neutral-600 uppercase mb-0.5">Buyer</div>
              <div className="font-bold text-xs text-black">
                {customer?.name || 'Walk-in Customer'}
              </div>
              {customer?.companyName && (
                <div className="font-semibold text-[9.5px]">{customer.companyName}</div>
              )}
              <div className="text-[9.5px] text-neutral-700">{customer?.billingAddress || '-'}</div>
              <div className="text-[9.5px]">
                <span className="font-semibold">State:</span> {buyerState} | <span className="font-semibold">Country:</span> {customer?.country || 'India'}
              </div>
              {customer?.gstin && (
                <div className="text-[9.5px]">
                  <span className="font-semibold">GSTIN:</span> {customer.gstin}
                </div>
              )}
              <div className="text-[9.5px]">
                <span className="font-semibold">Place of supply:</span> {buyerPos}
              </div>
            </div>
          </div>

          {/* Right Column: Structured Metadata Grid (Exact Ref 2) */}
          <div className="flex flex-col divide-y divide-black">
            {/* Row 1: Invoice No & Dated */}
            <div className="grid grid-cols-2 divide-x divide-black min-h-[28px]">
              <div className="p-1.5">
                <div className="text-[8.5px] text-neutral-600">Invoice No.</div>
                <div className="font-bold text-[10.5px]">{invoiceNumber || 'INV/2026-27/001'}</div>
              </div>
              <div className="p-1.5">
                <div className="text-[8.5px] text-neutral-600">Dated</div>
                <div className="font-semibold text-[10.5px]">{formatDate(invoiceDate)}</div>
              </div>
            </div>

            {/* Row 2: Delivery Note & Terms of Payment */}
            {(deliveryNote || paymentTerms) && (
              <div className="grid grid-cols-2 divide-x divide-black min-h-[28px]">
                <div className="p-1.5">
                  <div className="text-[8.5px] text-neutral-600">Delivery Note</div>
                  <div className="font-medium text-[9.5px]">{deliveryNote || '-'}</div>
                </div>
                <div className="p-1.5">
                  <div className="text-[8.5px] text-neutral-600">Mode/Terms of Payment</div>
                  <div className="font-medium text-[9.5px]">{paymentTerms || '-'}</div>
                </div>
              </div>
            )}

            {/* Row 3: Supplier's Ref & Other Ref */}
            {(supplierRef || otherRef) && (
              <div className="grid grid-cols-2 divide-x divide-black min-h-[28px]">
                <div className="p-1.5">
                  <div className="text-[8.5px] text-neutral-600">Supplier's Ref.</div>
                  <div className="font-medium text-[9.5px]">{supplierRef || '-'}</div>
                </div>
                <div className="p-1.5">
                  <div className="text-[8.5px] text-neutral-600">Other Reference(s)</div>
                  <div className="font-medium text-[9.5px]">{otherRef || '-'}</div>
                </div>
              </div>
            )}

            {/* Row 4: Buyer's Order No & Order Date */}
            {(buyersOrderNo || orderDate) && (
              <div className="grid grid-cols-2 divide-x divide-black min-h-[28px]">
                <div className="p-1.5">
                  <div className="text-[8.5px] text-neutral-600">Buyer's Order No.</div>
                  <div className="font-medium text-[9.5px]">{buyersOrderNo || '-'}</div>
                </div>
                <div className="p-1.5">
                  <div className="text-[8.5px] text-neutral-600">Dated</div>
                  <div className="font-medium text-[9.5px]">{orderDate ? formatDate(orderDate) : '-'}</div>
                </div>
              </div>
            )}

            {/* Row 5: Despatch Document No & Delivery Note Date */}
            {(despatchDocNo || despatchDate) && (
              <div className="grid grid-cols-2 divide-x divide-black min-h-[28px]">
                <div className="p-1.5">
                  <div className="text-[8.5px] text-neutral-600">Despatch Document No.</div>
                  <div className="font-medium text-[9.5px]">{despatchDocNo || '-'}</div>
                </div>
                <div className="p-1.5">
                  <div className="text-[8.5px] text-neutral-600">Delivery Note Date</div>
                  <div className="font-medium text-[9.5px]">{despatchDate ? formatDate(despatchDate) : '-'}</div>
                </div>
              </div>
            )}

            {/* Row 6: Despatched through & Destination */}
            {(despatchedThrough || destination) && (
              <div className="grid grid-cols-2 divide-x divide-black min-h-[28px]">
                <div className="p-1.5">
                  <div className="text-[8.5px] text-neutral-600">Despatched through</div>
                  <div className="font-medium text-[9.5px]">{despatchedThrough || '-'}</div>
                </div>
                <div className="p-1.5">
                  <div className="text-[8.5px] text-neutral-600">Destination</div>
                  <div className="font-medium text-[9.5px]">{destination || '-'}</div>
                </div>
              </div>
            )}

            {/* Row 7: Terms of Delivery */}
            {termsOfDelivery && (
              <div className="p-1.5 min-h-[24px]">
                <div className="text-[8.5px] text-neutral-600">Terms of Delivery</div>
                <div className="font-medium text-[9.5px]">{termsOfDelivery}</div>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto border-b border-black">
          <table className="w-full text-[9.5px] border-collapse">
            <thead>
              <tr className="bg-neutral-100 border-b border-black text-center font-bold">
                <th className="p-1 border-r border-black w-8">Sl No.</th>
                <th className="p-1 border-r border-black text-left">Description of Goods / Services</th>
                <th className="p-1 border-r border-black w-14">HSN/SAC</th>
                <th className="p-1 border-r border-black w-12 text-right">Quantity</th>
                <th className="p-1 border-r border-black w-16 text-right">Rate (₹)</th>
                <th className="p-1 border-r border-black w-10">per</th>
                <th className="p-1 border-r border-black w-16 text-right">Taxable (₹)</th>
                <th className="p-1 border-r border-black w-10">GST %</th>
                <th className="p-1 w-20 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-neutral-50/50">
                  <td className="p-1.5 border-r border-black text-center align-top">{idx + 1}</td>
                  <td className="p-1.5 border-r border-black text-left align-top">
                    <div className="font-semibold text-black">{item.description}</div>
                  </td>
                  <td className="p-1.5 border-r border-black text-center align-top text-neutral-600">
                    {item.hsnSac || '-'}
                  </td>
                  <td className="p-1.5 border-r border-black text-right align-top font-medium">
                    {item.quantity}
                  </td>
                  <td className="p-1.5 border-r border-black text-right align-top font-mono">
                    {formatNumberOnly(item.rate)}
                  </td>
                  <td className="p-1.5 border-r border-black text-center align-top text-neutral-600">
                    {item.unit || 'Nos'}
                  </td>
                  <td className="p-1.5 border-r border-black text-right align-top font-mono font-medium">
                    {formatNumberOnly(item.taxableAmount || item.quantity * item.rate)}
                  </td>
                  <td className="p-1.5 border-r border-black text-center align-top">
                    {item.gstRate}%
                  </td>
                  <td className="p-1.5 text-right align-top font-mono font-bold text-black">
                    {formatNumberOnly(item.totalAmount)}
                  </td>
                </tr>
              ))}

              {/* Total Summary Row */}
              <tr className="bg-neutral-100 font-bold border-t border-black">
                <td colSpan={3} className="p-1.5 text-right border-r border-black pr-2">
                  Total
                </td>
                <td className="p-1.5 text-right border-r border-black font-semibold">
                  {totalQty}
                </td>
                <td colSpan={2} className="border-r border-black"></td>
                <td className="p-1.5 text-right border-r border-black font-mono">
                  ₹{formatNumberOnly(subtotal)}
                </td>
                <td className="border-r border-black"></td>
                <td className="p-1.5 text-right font-mono font-bold text-black">
                  ₹{formatNumberOnly(grandTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bottom Section: Words, Bank Details, Declaration & Signatory */}
        <div className="grid grid-cols-12 divide-x divide-black border-b border-black">
          {/* Bottom Left: 7 Columns */}
          <div className="col-span-7 p-2 flex flex-col justify-between space-y-2">
            <div>
              <div className="text-[8.5px] text-neutral-500 uppercase font-semibold">
                Amount Chargeable (in words)
              </div>
              <div className="font-bold text-[10px] text-black">{calculatedWords}</div>
            </div>

            <div>
              <div className="text-[8.5px] text-neutral-500 uppercase font-semibold">
                Tax Amount (in words)
              </div>
              <div className="font-semibold text-[9.5px] text-neutral-800">{taxWords}</div>
            </div>

            {/* Bank Details */}
            <div className="border border-neutral-300 p-1.5 rounded bg-neutral-50/60 text-[9px] space-y-0.5">
              <div className="font-bold uppercase text-neutral-700 text-[8.5px]">Bank & Payment Details</div>
              <div>Bank: <span className="font-semibold">{supplier?.bankName}</span> | A/C: <span className="font-semibold">{supplier?.accountNumber}</span></div>
              <div>A/C Name: <span className="font-semibold">{supplier?.accountName}</span> | IFSC: <span className="font-semibold">{supplier?.ifsc}</span></div>
              <div>Branch: <span>{supplier?.branch}</span> | UPI ID: <span className="font-semibold text-blue-700">{supplier?.upiId}</span></div>
            </div>

            {/* Declaration */}
            <div className="text-[8.5px] text-neutral-600 pt-1">
              <span className="font-bold text-black uppercase block">Declaration:</span>
              {supplier?.defaultDeclaration || 'We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct.'}
            </div>
          </div>

          {/* Bottom Right: 5 Columns */}
          <div className="col-span-5 p-2 flex flex-col justify-between">
            {/* Tax Summary Table */}
            <table className="w-full text-[8.5px] border border-black mb-2 border-collapse">
              <thead>
                <tr className="bg-neutral-100 border-b border-black text-center font-bold">
                  <th className="p-1 border-r border-black">Taxable Val (₹)</th>
                  {isInterstate ? (
                    <th className="p-1 border-r border-black">IGST (₹)</th>
                  ) : (
                    <>
                      <th className="p-1 border-r border-black">CGST (₹)</th>
                      <th className="p-1 border-r border-black">SGST (₹)</th>
                    </>
                  )}
                  <th className="p-1">Total Tax (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="text-right font-mono">
                  <td className="p-1 border-r border-black">{formatNumberOnly(taxableAmount)}</td>
                  {isInterstate ? (
                    <td className="p-1 border-r border-black">{formatNumberOnly(igstAmount)}</td>
                  ) : (
                    <>
                      <td className="p-1 border-r border-black">{formatNumberOnly(cgstAmount)}</td>
                      <td className="p-1 border-r border-black">{formatNumberOnly(sgstAmount)}</td>
                    </>
                  )}
                  <td className="p-1 font-bold">{formatNumberOnly(totalTaxAmount)}</td>
                </tr>
              </tbody>
            </table>

            {/* Grand Total Display */}
            <div className="border border-black bg-neutral-100 p-1.5 flex justify-between items-center font-bold text-[11px] mb-3">
              <span>Grand Total</span>
              <span className="font-mono text-sm text-black">₹ {formatNumberOnly(grandTotal)}</span>
            </div>

            {/* Authorized Signatory */}
            <div className="text-right pt-2 flex flex-col items-end justify-end">
              <div className="font-bold text-[9.5px]">for {supName}</div>
              {supplier?.signatureUrl ? (
                <img src={supplier.signatureUrl} alt="Signature" className="max-h-8 max-w-[120px] object-contain my-1" />
              ) : (
                <div className="h-8"></div>
              )}
              <div className="border-t border-dashed border-neutral-400 pt-0.5 text-[8.5px] font-semibold text-neutral-700">
                Authorised Signatory
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[8.5px] text-neutral-500 uppercase tracking-widest mt-1.5">
        {supplier?.invoiceFooter || 'This is a Computer Generated Invoice'}
      </div>
    </div>
  );
};

