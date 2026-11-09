/**
 * Universal Statement Parser for Supplier and Dora Cars Statements
 * Powered by SheetJS (XLSX) and PDF.js (pdfjs-dist)
 */
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min?url';
import { formatDate, normalizeInvoiceNumber, fixGarbledArabic } from './formatters';

// Initialize PDF.js worker
if (typeof window !== 'undefined' && pdfjsLib?.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export const COLUMN_ROLES = {
  INVOICE_NUMBER: 'invoiceNumber',
  DATE: 'date',
  AMOUNT: 'amount',
  DEBIT: 'debit',
  CREDIT: 'credit',
  DESCRIPTION: 'description',
};

/**
 * Keywords for auto-detecting columns in Arabic and English
 */
const AUTO_DETECT_RULES = {
  [COLUMN_ROLES.INVOICE_NUMBER]: [
    'رقم الفاتورة', 'رقم فاتورة', 'رقم المستند', 'رقم المرجع', 'رقم السند', 'رقم القيد', 'رقم الاشعار',
    'الفاتورة', 'المستند', 'المرجع', 'السند', 'القيد',
    'invoice number', 'invoice no', 'inv no', 'inv #', 'bill no', 'doc no', 'ref no', 'invoice', 'reference'
  ],
  [COLUMN_ROLES.DATE]: [
    'التاريخ', 'تاريخ الفاتورة', 'تاريخ القيد', 'تاريخ المستند', 'تاريخ السند',
    'date', 'inv date', 'doc date', 'posting date', 'transaction date'
  ],
  [COLUMN_ROLES.AMOUNT]: [
    'المبلغ', 'القيمة', 'إجمالي المبلغ', 'الصافي', 'الإجمالي', 'قيمة الفاتورة',
    'amount', 'total', 'net amount', 'grand total', 'val'
  ],
  [COLUMN_ROLES.DEBIT]: [
    'مدين', 'حركات مدينة', 'debit', 'dr'
  ],
  [COLUMN_ROLES.CREDIT]: [
    'دائن', 'حركات دائنة', 'credit', 'cr'
  ],
  [COLUMN_ROLES.DESCRIPTION]: [
    'البيان', 'الوصف', 'ملاحظات', 'التفاصيل', 'شرح القيد', 'اسم الصنف', 'البيان والتفاصيل',
    'description', 'details', 'memo', 'notes', 'remarks', 'narration'
  ],
};

/**
 * Universal Statement Parser: Automatically routes Excel / CSV or PDF files
 */
export async function parseStatementFile(file) {
  const isPdf = file.name.toLowerCase().endsWith('.pdf');
  if (isPdf) {
    return parsePdfStatement(file);
  }
  return parseExcelStatement(file);
}

/**
 * Parses a PDF Statement using coordinate-based text extraction
 */
export async function parsePdfStatement(file) {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const doc = await loadingTask.promise;

  const rawRows = [];
  const detectedHeaders = ['رقم المستند', 'نوع العملية', 'التاريخ', 'البيان', 'المدين', 'الدائن', 'الرصيد'];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();

    // Group items by vertical position Y (tolerance +-3px)
    const rowsByY = {};
    for (const it of content.items) {
      const text = it.str ? it.str.trim() : '';
      if (!text) continue;
      const y = Math.round(it.transform[5]);
      let matchedY = Object.keys(rowsByY).map(Number).find(k => Math.abs(k - y) <= 3);
      if (!matchedY) {
        matchedY = y;
        rowsByY[matchedY] = [];
      }
      rowsByY[matchedY].push({ x: Math.round(it.transform[4]), str: text });
    }

    // Process rows top-to-bottom
    const sortedY = Object.keys(rowsByY).map(Number).sort((a, b) => b - a);
    for (const y of sortedY) {
      const items = rowsByY[y].sort((a, b) => a.x - b.x);

      // Document Number (typically x >= 500 && x <= 580)
      const docItem = items.find(it => it.x >= 500 && it.x <= 580 && /^\d+$/.test(it.str));
      // Date (x between 370 and 450)
      const dateItem = items.find(it => it.x >= 370 && it.x <= 450 && /^\d{4}[\/\-]\d{2}[\/\-]\d{2}$/.test(it.str));

      if (docItem && dateItem) {
        const debitItem = items.find(it => it.x >= 150 && it.x <= 220 && /^[\d,]+(\.\d{2})?$/.test(it.str));
        const creditItem = items.find(it => it.x >= 80 && it.x <= 149 && /^[\d,]+(\.\d{2})?$/.test(it.str));
        const balanceItem = items.find(it => it.x >= 20 && it.x <= 79 && /^[\d,]+(\.\d{2})?-?$/.test(it.str));
        const descItems = items.filter(it => it.x >= 220 && it.x <= 370);
        const typeItem = items.find(it => it.x >= 450 && it.x <= 509);

        const debit = debitItem ? parseFloat(debitItem.str.replace(/,/g, '')) : 0;
        const credit = creditItem ? parseFloat(creditItem.str.replace(/,/g, '')) : 0;
        const rawDesc = descItems.map(d => d.str).join(' ').trim();
        const rawType = typeItem ? typeItem.str : '';
        const desc = fixGarbledArabic(rawDesc);
        const type = fixGarbledArabic(rawType);

        const rowObj = {
          'رقم المستند': docItem.str,
          'نوع العملية': type,
          'التاريخ': dateItem.str.replace(/\//g, '-'),
          'البيان': desc || type,
          'المدين': debit,
          'الدائن': credit,
          'الرصيد': balanceItem ? balanceItem.str : '',
        };

        rawRows.push({
          _rowIdx: rawRows.length + 1,
          _raw: rowObj,
          page: p,
        });
      }
    }
  }

  const detectedMapping = {
    invoiceNumber: 'رقم المستند',
    date: 'التاريخ',
    amount: 'المدين',
    debit: 'المدين',
    credit: 'الدائن',
    description: 'البيان',
  };

  return {
    fileName: file.name,
    fileType: 'pdf',
    pageCount: doc.numPages,
    sheetNames: ['كشف الحساب PDF'],
    activeSheet: 'كشف الحساب PDF',
    headers: detectedHeaders,
    detectedMapping,
    rows: rawRows,
    totalRows: rawRows.length,
  };
}

/**
 * Parses an Excel or CSV file
 */
export async function parseExcelStatement(file) {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array', cellDates: true });
  
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('الملف لا يحتوي على أوراق عمل (Sheets)');
  }

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to array of arrays first to find the real header row
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  if (rawRows.length === 0) {
    throw new Error('ورقة العمل فارغة لا تحتوي على بيانات');
  }

  // Detect header row index
  // Requires at least 4 filled cells and presence of standard financial headers
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(rawRows.length, 20); i++) {
    const row = rawRows[i];
    if (!Array.isArray(row)) continue;
    const filledCount = row.filter(cell => String(cell).trim().length > 0).length;
    const joined = row.map(c => String(c).toLowerCase()).join(' ');
    const hasHeaderKeywords = ['التاريخ', 'تاريخ', 'المستند', 'مدين', 'دائن', 'رقم', 'بيان', 'date', 'debit', 'credit']
      .filter(k => joined.includes(k)).length >= 2;
    
    if (filledCount >= 4 && hasHeaderKeywords) {
      headerRowIndex = i;
      break;
    }
  }

  const rawHeaders = rawRows[headerRowIndex].map(h => String(h || '').trim());
  const validHeaders = rawHeaders.filter(h => h.length > 0);

  // Guess best column matches
  const detectedMapping = autoDetectColumns(rawHeaders);

  // Parse records
  const dataRows = rawRows.slice(headerRowIndex + 1);
  const rows = [];

  dataRows.forEach((row, rowIdx) => {
    if (!Array.isArray(row)) return;
    const isRowEmpty = row.every(cell => String(cell).trim() === '');
    if (isRowEmpty) return;

    // Filter out repeated header rows, pagination headers, and statement summary rows
    const firstCell = String(row[0] || '').trim();
    const thirdCell = String(row[2] || '').trim();
    const joinedRow = row.map(c => String(c || '').trim()).join(' ');

    if (
      firstCell === 'التاريخ' ||
      thirdCell === 'رقم المستند' ||
      firstCell === 'العملة' ||
      firstCell === 'رقم المورد' ||
      joinedRow.includes('إجمالي العمليات') ||
      joinedRow.includes('اجمالي العمليات') ||
      joinedRow.includes('إجمالي الرصيد') ||
      joinedRow.includes('اجمالي الرصيد') ||
      joinedRow.includes('الرصيد الإفتتاحي') ||
      joinedRow.includes('رصيد افتتاحي') ||
      (thirdCell === 'SAR' && joinedRow.includes('ريال سعودي'))
    ) {
      return;
    }

    const rowObj = {};
    rawHeaders.forEach((header, colIdx) => {
      if (header) {
        rowObj[header] = row[colIdx];
      }
    });

    rows.push({
      _rowIdx: rowIdx + headerRowIndex + 2, // 1-based Excel row number
      _raw: rowObj,
    });
  });

  return {
    fileName: file.name,
    fileType: 'excel',
    sheetNames: workbook.SheetNames,
    activeSheet: sheetName,
    headers: validHeaders,
    detectedMapping,
    rows,
    totalRows: rows.length,
  };
}

/**
 * Auto-detect column headers based on rules
 * Uses 2-pass detection: Exact match first, then substring match excluding 'نوع' for invoice numbers.
 */
export function autoDetectColumns(headers) {
  const mapping = {
    invoiceNumber: '',
    date: '',
    amount: '',
    debit: '',
    credit: '',
    description: '',
  };

  // Pass 1: Exact matches have highest priority
  headers.forEach(h => {
    const lower = h.toLowerCase().trim();
    if (!lower) return;
    for (const [role, keywords] of Object.entries(AUTO_DETECT_RULES)) {
      if (!mapping[role] && keywords.some(k => lower === k)) {
        mapping[role] = h;
        break;
      }
    }
  });

  // Pass 2: Substring matches for remaining unmapped roles
  // CRITICAL AUDIT FIX: Do not match columns containing 'نوع' as invoice numbers (e.g. 'نوع المستند')
  headers.forEach(h => {
    const lower = h.toLowerCase().trim();
    if (!lower) return;

    for (const [role, keywords] of Object.entries(AUTO_DETECT_RULES)) {
      if (!mapping[role]) {
        if (role === COLUMN_ROLES.INVOICE_NUMBER && lower.includes('نوع')) {
          continue; // Skip document type
        }
        const matched = keywords.some(k => lower.includes(k));
        if (matched) {
          mapping[role] = h;
          break;
        }
      }
    }
  });

  return mapping;
}

/**
 * Standardize extracted rows using confirmed column mappings and file scope
 * @param {Array} rawRows - Raw parsed row objects
 * @param {Object} columnMapping - Column mapping dictionary
 * @param {string} fileScope - 'supplier' | 'dora' | 'auto'
 */
export function standardizeRows(rawRows, columnMapping, fileScope = 'auto') {
  const standardized = [];

  rawRows.forEach((item, idx) => {
    const raw = item._raw || {};
    
    // Extract Raw Values
    const rawInv = raw[columnMapping.invoiceNumber];
    const rawDate = raw[columnMapping.date];
    const rawDesc = raw[columnMapping.description] || raw['نوع المستند'] || raw['نوع العملية'] || '';

    const debitVal = columnMapping.debit && raw[columnMapping.debit] !== undefined ? parseNumericAmount(raw[columnMapping.debit]) : 0;
    const creditVal = columnMapping.credit && raw[columnMapping.credit] !== undefined ? parseNumericAmount(raw[columnMapping.credit]) : 0;
    const genericAmount = columnMapping.amount && raw[columnMapping.amount] !== undefined ? parseNumericAmount(raw[columnMapping.amount]) : 0;

    let amount = 0;
    let txType = 'invoice'; // 'invoice' | 'payment'

    // Rigorous Financial Classification:
    // Supplier Statement: Debit = Invoices (Sales to customer), Credit = Payments received
    // Dora Cars Ledger: Credit = Invoices (Purchases from supplier), Debit = Payments disbursed to supplier
    if (debitVal > 0 && creditVal === 0) {
      if (fileScope === 'supplier') {
        txType = 'invoice';
        amount = debitVal;
      } else if (fileScope === 'dora') {
        txType = 'payment';
        amount = debitVal;
      } else {
        amount = debitVal;
      }
    } else if (creditVal > 0 && debitVal === 0) {
      if (fileScope === 'supplier') {
        txType = 'payment';
        amount = creditVal;
      } else if (fileScope === 'dora') {
        txType = 'invoice';
        amount = creditVal;
      } else {
        amount = creditVal;
      }
    } else if (genericAmount > 0) {
      amount = genericAmount;
    } else {
      amount = creditVal > 0 ? creditVal : debitVal;
    }

    const normalizedInv = normalizeInvoiceNumber(rawInv);
    const descText = fixGarbledArabic(String(rawDesc || '').trim());

    // Strict Accounting Guard: Skip opening balance, totals, grand totals, and non-transaction summary rows
    // (Prevents rows like 'إجمالي العمليات' or 'إجمالي الرصيد' from being matched as invoices)
    const isSummaryDesc =
      descText.includes('الرصيد الإفتتاحي') ||
      descText.includes('رصيد افتتاحي') ||
      descText.includes('الرصيد الافتتاحي') ||
      descText.includes('الرصيد السابق') ||
      descText.includes('رصيد سابق') ||
      descText.includes('إجمالي العمليات') ||
      descText.includes('اجمالي العمليات') ||
      descText.includes('إجمالي الرصيد') ||
      descText.includes('اجمالي الرصيد') ||
      descText.includes('المجموع العام') ||
      descText.includes('المجموع الكلي') ||
      descText.includes('الرصيد النهائي') ||
      descText.includes('إجمالي الحركات') ||
      descText.includes('اجمالي الحركات') ||
      descText.toLowerCase().includes('grand total') ||
      descText.toLowerCase().includes('total operations') ||
      descText.toLowerCase().includes('ending balance') ||
      descText.toLowerCase().includes('opening balance');

    const invalidInvoiceKeywords = ['SAR', 'ر.س', 'ريال', 'الإجمالي', 'الاجمالي', 'المجموع'];
    const isInvalidInv =
      invalidInvoiceKeywords.includes(normalizedInv.toUpperCase()) ||
      normalizedInv.includes('إجمالي') ||
      normalizedInv.includes('اجمالي') ||
      normalizedInv.includes('رصيد') ||
      normalizedInv.includes('مجموع');

    // Dual balance totals: A row having both massive debit and credit is an automated summary line
    const isDualTotalRow = debitVal > 0 && creditVal > 0 && (debitVal > 50000 || creditVal > 50000);

    if (isSummaryDesc || isInvalidInv || isDualTotalRow) return;
    if (!normalizedInv && amount === 0) return;

    standardized.push({
      id: `row-${idx + 1}`,
      excelRowNumber: item._rowIdx,
      rawInvoiceNumber: String(rawInv || '').trim(),
      normalizedInvoiceNumber: normalizedInv,
      date: formatDate(rawDate),
      amount: Math.abs(amount),
      signedAmount: amount,
      debit: debitVal,
      credit: creditVal,
      txType,
      fileScope,
      description: descText,
      _raw: raw,
    });
  });

  return standardized;
}

function parseNumericAmount(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const cleaned = String(val)
    .replace(/[^\d.-]/g, '')
    .trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}
