export interface ItemInput {
  description: string;
  hsnSac?: string;
  quantity: number;
  unit?: string;
  rate: number;
  gstRate: number; // e.g. 18 for 18%
}

export interface CalculatedItem extends ItemInput {
  serialNumber: number;
  taxableAmount: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
}

export interface InvoiceCalculationResult {
  items: CalculatedItem[];
  subtotal: number;
  discount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTaxAmount: number;
  otherCharges: number;
  roundOff: number;
  grandTotal: number;
  isInterstate: boolean;
}

export function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Determine if a transaction is interstate based on supplier state and place of supply.
 */
export function isInterstateTransaction(
  supplierState?: string | null,
  placeOfSupply?: string | null
): boolean {
  if (!supplierState || !placeOfSupply) return false;
  const cleanSup = supplierState.trim().toLowerCase();
  const cleanPos = placeOfSupply.trim().toLowerCase();
  return cleanSup !== cleanPos;
}

/**
 * Calculates complete Indian GST breakdown for invoice items and totals.
 */
export function calculateInvoiceTotals(
  rawItems: ItemInput[],
  isInterstate: boolean,
  discount: number = 0,
  otherCharges: number = 0
): InvoiceCalculationResult {
  let subtotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  const items: CalculatedItem[] = rawItems.map((item, idx) => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const gstRate = Number(item.gstRate) || 0;

    const itemTaxable = roundToTwo(qty * rate);
    subtotal += itemTaxable;

    let cgstRate = 0;
    let sgstRate = 0;
    let igstRate = 0;

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (isInterstate) {
      igstRate = gstRate;
      igstAmount = roundToTwo((itemTaxable * igstRate) / 100);
      totalIgst += igstAmount;
    } else {
      cgstRate = roundToTwo(gstRate / 2);
      sgstRate = roundToTwo(gstRate / 2);
      cgstAmount = roundToTwo((itemTaxable * cgstRate) / 100);
      sgstAmount = roundToTwo((itemTaxable * sgstRate) / 100);
      totalCgst += cgstAmount;
      totalSgst += sgstAmount;
    }

    const itemTaxTotal = isInterstate ? igstAmount : roundToTwo(cgstAmount + sgstAmount);
    const itemTotal = roundToTwo(itemTaxable + itemTaxTotal);

    return {
      serialNumber: idx + 1,
      description: item.description,
      hsnSac: item.hsnSac || '',
      quantity: qty,
      unit: item.unit || 'Nos',
      rate: rate,
      gstRate: gstRate,
      taxableAmount: itemTaxable,
      cgstRate,
      sgstRate,
      igstRate,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalAmount: itemTotal,
    };
  });

  subtotal = roundToTwo(subtotal);
  const discountVal = roundToTwo(Math.max(0, Number(discount) || 0));
  const otherChargesVal = roundToTwo(Number(otherCharges) || 0);

  // If overall invoice discount applies proportionally, or subtotal - discount
  const taxableAmount = roundToTwo(Math.max(0, subtotal - discountVal));
  const totalTax = isInterstate
    ? roundToTwo(totalIgst)
    : roundToTwo(totalCgst + totalSgst);

  const rawGrandTotal = roundToTwo(taxableAmount + totalTax + otherChargesVal);
  const roundedGrandTotal = Math.round(rawGrandTotal);
  const roundOff = roundToTwo(roundedGrandTotal - rawGrandTotal);

  return {
    items,
    subtotal,
    discount: discountVal,
    taxableAmount,
    cgstAmount: roundToTwo(totalCgst),
    sgstAmount: roundToTwo(totalSgst),
    igstAmount: roundToTwo(totalIgst),
    totalTaxAmount: totalTax,
    otherCharges: otherChargesVal,
    roundOff,
    grandTotal: roundedGrandTotal,
    isInterstate,
  };
}
