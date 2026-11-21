export function formatCurrency(amount: number = 0): string {
  const num = Number(amount) || 0;
  return '₹' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatNumberOnly(amount: number = 0): string {
  const num = Number(amount) || 0;
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDate(dateStr?: string | Date | null): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const yr = String(d.getFullYear()).slice(-2);
  return `${day}-${month}-${yr}`;
}

export function formatFullDate(dateStr?: string | Date | null): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getStatusBadge(status: string) {
  switch (status?.toUpperCase()) {
    case 'PAID':
    case 'SUCCESS':
      return {
        label: 'Paid',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/60',
        dot: 'bg-emerald-500',
      };
    case 'PARTIALLY_PAID':
      return {
        label: 'Partially Paid',
        bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800/60',
        dot: 'bg-blue-500',
      };
    case 'PENDING':
    case 'ISSUED':
      return {
        label: 'Pending',
        bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800/60',
        dot: 'bg-amber-500',
      };
    case 'DRAFT':
      return {
        label: 'Draft',
        bg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        dot: 'bg-slate-400',
      };
    case 'OVERDUE':
      return {
        label: 'Overdue',
        bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800/60',
        dot: 'bg-rose-500',
      };
    case 'CANCELLED':
    case 'CANCELED':
      return {
        label: 'Cancelled',
        bg: 'bg-gray-100 text-gray-500 border-gray-200 line-through dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700',
        dot: 'bg-gray-400',
      };
    default:
      return {
        label: status || 'Unknown',
        bg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        dot: 'bg-slate-400',
      };
  }
}

