/**
 * Formatters and Normalizers for Supplier Reconciliation System
 */

export function formatSAR(val) {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

export function formatNumber(val, decimals = 2) {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
}

/**
 * Rounds a number strictly to standard currency halalas (2 decimal places)
 * Prevents floating point artifacts like 955.0175 or 864.000048
 */
export function roundToHalalas(val) {
  return Math.round((Number(val) || 0) * 100) / 100;
}

/**
 * Splits an amount into its Fixed/Whole Integer part and its fractional Halalas (0-99)
 * Example: 956.25 -> { fixed: 956, fraction: 25, full: 956.25 }
 */
export function splitAmountHalalas(val) {
  const full = roundToHalalas(val);
  const fixed = Math.trunc(full);
  const fraction = Math.round(Math.abs(full - fixed) * 100);
  return { fixed, fraction, full };
}

export function formatDate(val) {
  if (!val) return '—';
  if (val instanceof Date && !isNaN(val)) {
    return val.toISOString().split('T')[0];
  }
  const s = String(val).trim();
  if (!s) return '—';

  // Excel serial date number
  if (/^\d{5}$/.test(s)) {
    const epoch = new Date(1899, 11, 30);
    epoch.setDate(epoch.getDate() + parseInt(s, 10));
    return epoch.toISOString().split('T')[0];
  }

  // Handle ISO or common YYYY-MM-DD or DD/MM/YYYY
  const parts = s.split(/[\/\-\.]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    if (parts[2].length === 4) {
      // DD-MM-YYYY or MM-DD-YYYY -> Return as YYYY-MM-DD
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }

  return s;
}

/**
 * Normalizes an invoice number to ensure robust matching across statements:
 * - Converts Arabic-Indic numbers (٠-٩) to Latin (0-9)
 * - Strips common Arabic and English prefixes ("فاتورة", "فاتورة رقم", "INV-", "FT-", "#")
 * - Trims whitespaces, leading zeroes, hyphens
 */
export function normalizeInvoiceNumber(raw) {
  if (raw === null || raw === undefined) return '';
  let str = String(raw).trim();
  if (!str) return '';

  // 1. Convert Arabic-Indic numerals
  const arabicIndicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  arabicIndicDigits.forEach((d, idx) => {
    str = str.replaceAll(d, String(idx));
  });

  // 2. Remove common words & prefixes
  str = str.replace(/^(?:فاتورة\s*رقم|فاتورة|سند\s*رقم|سند|قيد\s*رقم|قيد|اشعار\s*رقم|اشعار|invoice\s*no\.?|inv\s*#?|doc\s*#?|bill\s*#?|ft|so|po|rec|no\.?)\s*[:\-_\s]+/i, '');
  str = str.replace(/^#+\s*/, '');

  // 3. Remove leading and trailing symbols
  str = str.replace(/^[\s\-_\/]+|[\s\-_\/]+$/g, '');

  // 4. Strip leading zeros if purely numeric (e.g. "0004521" -> "4521")
  if (/^0+[1-9]\d*$/.test(str)) {
    str = str.replace(/^0+/, '');
  }

  return str.toUpperCase();
}

const PDF_ARABIC_CHAR_MAP = {
  '΍': 'ا', 'Ύ': 'ا', 'أ': 'أ', 'إ': 'إ', 'آ': 'آ', '·': 'إ',
  'Ώ': 'ب', 'Α': 'ب',
  'Ε': 'ت', 'Η': 'ت', 'ة': 'ة', 'Γ': 'ة', 'Δ': 'ة',
  'ث': 'ث',
  'Ο': 'ج', 'Ν': 'ج',
  'Σ': 'ح',
  'Φ': 'خ', 'Χ': 'خ', 'Ϧ': 'خ',
  'Ω': 'د', 'Ϊ': 'د',
  'ذ': 'ذ', 'ﺫ': 'ذ',
  'έ': 'ر',
  'ί': 'ز',
  'γ': 'س',
  'η': 'ش', 'Ψ': 'ش',
  'λ': 'ص', 'ι': 'ص',
  'ν': 'ض', 'ﺿ': 'ض',
  'ρ': 'ط', 'الط': 'ط', 'ﻃ': 'ط',
  'υ': 'ظ', 'ظ': 'ظ', 'ﻅ': 'ظ',
  'ω': 'ع', 'ό': 'ع', 'ϊ': 'ع', 'ϋ': 'ع',
  'Ϗ': 'غ', 'ϐ': 'غ',
  'ϓ': 'ف', 'ϔ': 'ف', 'ϑ': 'ف',
  'ϗ': 'ق', 'Ϙ': 'ق', 'ϖ': 'ق',
  'ϛ': 'ك',
  'ϟ': 'ل', 'Ϡ': 'ل', 'ϝ': 'ل',
  'ϡ': 'م', 'ϣ': 'م',
  'ϥ': 'ن', 'ϧ': 'ن',
  'Ϫ': 'ه', 'Ϭ': 'ه',
  'ϭ': 'و',
  'ϳ': 'ي', 'ϲ': 'ي', 'ϰ': 'ى', '΋': 'ئ', 'ء': 'ء',
  'ϼ': 'لا', 'ϻ': 'لا'
};

/**
 * Decodes garbled Arabic text extracted from PDFs with non-standard legacy font encodings
 * Converts reversed Greek/Extended glyphs (e.g. "ΏΎγΣϟ΍ ϰϟ· ΩϳϘΗ") into proper readable Arabic ("تقيد إلى الحساب")
 */
export function fixGarbledArabic(str) {
  if (!str) return '';
  const s = String(str);
  const hasGarbled = /[\u0370-\u03FF]/.test(s);
  if (!hasGarbled) return s.replace(/[\u0000-\u001F]+/g, ' ').trim();

  // Split into words by whitespace and ASCII control codes
  const words = s.split(/[\s\u0000-\u001F]+/);
  const fixedWords = words.map(w => {
    const mappedChars = Array.from(w).map(c => PDF_ARABIC_CHAR_MAP[c] || c);
    return mappedChars.reverse().join('');
  });

  const decoded = fixedWords.filter(Boolean).reverse().join(' ');
  // Polish common accounting terms
  const polished = decoded
    .replace(/\bتقيد إلى الحساب\b/g, 'تقييد إلى الحساب')
    .replace(/\bاجمالي\b/g, 'إجمالي')
    .replace(/\bكش[فϑ] حساب\b/g, 'كشف حساب');

  return polished;
}

/**
 * Safely parses a date string into a timestamp for chronological comparison
 */
export function parseDateToTimestamp(raw) {
  if (!raw || raw === '—') return NaN;
  const s = String(raw).trim();
  if (!s || s === '—') return NaN;

  // Standard ISO: YYYY-MM-DD
  const mIso = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (mIso) {
    const y = parseInt(mIso[1], 10);
    const m = parseInt(mIso[2], 10) - 1;
    const d = parseInt(mIso[3], 10);
    return new Date(y, m, d).getTime();
  }

  // DD-MM-YYYY or DD/MM/YYYY
  const mDmy = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (mDmy) {
    const d = parseInt(mDmy[1], 10);
    const m = parseInt(mDmy[2], 10) - 1;
    const y = parseInt(mDmy[3], 10);
    return new Date(y, m, d).getTime();
  }

  const dt = new Date(s);
  return isNaN(dt.getTime()) ? NaN : dt.getTime();
}

/**
 * Compares two items by date in ASCENDING order (الأقدم فوق والأحدث تحت)
 * Oldest dates (earliest timestamp) come first.
 * If dates are equal, ties are broken by invoice number or amount.
 */
export function compareByDateAsc(a, b, keyA = 'date', keyB = 'date') {
  const valA = a[keyA] || a.date || a.supplierDate || a.doraDate || '';
  const valB = b[keyB] || b.date || b.supplierDate || b.doraDate || '';

  const tA = parseDateToTimestamp(valA);
  const tB = parseDateToTimestamp(valB);

  const validA = !isNaN(tA);
  const validB = !isNaN(tB);

  if (validA && validB) {
    if (tA !== tB) return tA - tB; // Ascending: Oldest first
  } else if (validA && !validB) {
    return -1; // Valid date comes before missing date
  } else if (!validA && validB) {
    return 1;
  }

  // Tie-breaker: invoice number
  const invA = String(a.invoiceNumber || a.normalizedInvoice || '');
  const invB = String(b.invoiceNumber || b.normalizedInvoice || '');
  if (invA && invB) {
    const cmp = invA.localeCompare(invB, undefined, { numeric: true });
    if (cmp !== 0) return cmp;
  }

  // Tie-breaker 2: amount
  const amtA = Number(a.amount || a.supplierAmount || 0);
  const amtB = Number(b.amount || b.supplierAmount || 0);
  return amtA - amtB;
}

