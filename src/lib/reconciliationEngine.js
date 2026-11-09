/**
 * Intelligent Accounting Reconciliation Engine
 * Compares Supplier Statement vs Dora Cars Internal Ledger
 * Supports Strict Invoice Matching & Smart Composite Matching (Amount + Date Proximity)
 * With strict transaction type segregation (Invoices vs Payments) and Whole-Amount / Halalas Fractional Discard Rule
 * 
 * Core Rule: "أي كسر في التطابق تلاشاه يعني لو مثلا المبلغ 956.25 طابق المبلغ الثابت واترك .25 هلله اذا لقيت المبلغين الفرق بينهم بهذا النظام"
 */

import { roundToHalalas } from './formatters';

/**
 * Checks if two amounts match under the Halala / Fractional Discard Rule:
 * 1. Exact match (difference < 0.005) -> Tier 1
 * 2. Shared Fixed/Integer Amount (Math.trunc(a) === Math.trunc(b), e.g. 956.25 vs 956.00) -> Tier 2
 *    (Discards the fraction e.g. .25 and matches on 956)
 * 3. Fractional difference (< halalaTolerance, e.g. 956.99 vs 957.00) -> Tier 3
 */
export function isAmountMatch(amt1, amt2, halalaTolerance = 0.99) {
  const a1 = roundToHalalas(amt1);
  const a2 = roundToHalalas(amt2);
  const diff = roundToHalalas(a1 - a2);
  const absDiff = Math.abs(diff);

  // Tier 1: Exact mathematical match
  if (absDiff < 0.005) {
    return {
      matched: true,
      isExact: true,
      isFixedAmountMatch: true,
      fixedAmount: Math.trunc(a1),
      diff: 0,
      absDiff: 0,
      ignoredFraction: 0,
      tier: 1
    };
  }

  // If tolerance is set to zero (strict match only)
  if (halalaTolerance < 0.01) {
    return {
      matched: false,
      isExact: false,
      isFixedAmountMatch: false,
      fixedAmount: Math.trunc(a1),
      diff,
      absDiff,
      ignoredFraction: absDiff,
      tier: 0
    };
  }

  // Tier 2: Shared Fixed Amount (e.g. 956.25 vs 956.00, or 956.25 vs 956.50)
  const trunc1 = Math.trunc(a1);
  const trunc2 = Math.trunc(a2);
  const sameFixedAmount = trunc1 === trunc2;

  if (sameFixedAmount) {
    return {
      matched: true,
      isExact: false,
      isFixedAmountMatch: true,
      fixedAmount: trunc1,
      diff,
      absDiff,
      ignoredFraction: absDiff,
      tier: 2
    };
  }

  // Tier 3: Fractional / Halala difference within tolerance (< 1.00 SAR)
  if (absDiff <= halalaTolerance) {
    return {
      matched: true,
      isExact: false,
      isFixedAmountMatch: false,
      fixedAmount: trunc1,
      diff,
      absDiff,
      ignoredFraction: absDiff,
      tier: 3
    };
  }

  return {
    matched: false,
    isExact: false,
    isFixedAmountMatch: false,
    fixedAmount: trunc1,
    diff,
    absDiff,
    ignoredFraction: absDiff,
    tier: 0
  };
}

export function reconcileStatements(supplierItems = [], doraItems = [], options = {}) {
  const mode = options.mode || 'smart'; // 'smart' | 'strict'
  const filterType = options.filterType || 'invoices_only'; // 'invoices_only' | 'payments_only' | 'all'
  const dateToleranceDays = options.dateToleranceDays !== undefined ? options.dateToleranceDays : 7;
  
  // Halalas tolerance: Defaults to 0.99 SAR (any fraction less than 1 full Riyal)
  const halalaTolerance = options.halalaTolerance !== undefined ? Number(options.halalaTolerance) : 0.99;

  // Filter scoped items based on filterType
  let activeSupplier = supplierItems;
  let activeDora = doraItems;

  if (filterType === 'invoices_only') {
    activeSupplier = supplierItems.filter(it => it.txType === 'invoice');
    activeDora = doraItems.filter(it => it.txType === 'invoice');
  } else if (filterType === 'payments_only') {
    activeSupplier = supplierItems.filter(it => it.txType === 'payment');
    activeDora = doraItems.filter(it => it.txType === 'payment');
  }

  const result = mode === 'strict'
    ? reconcileStrict(activeSupplier, activeDora, { halalaTolerance })
    : reconcileSmart(activeSupplier, activeDora, { dateToleranceDays, halalaTolerance });

  // Attach overarching statement financial metadata
  result.filterType = filterType;
  result.fullScope = {
    allSupplierCount: supplierItems.length,
    allDoraCount: doraItems.length,
    supplierInvoicesCount: supplierItems.filter(it => it.txType === 'invoice').length,
    supplierPaymentsCount: supplierItems.filter(it => it.txType === 'payment').length,
    doraInvoicesCount: doraItems.filter(it => it.txType === 'invoice').length,
    doraPaymentsCount: doraItems.filter(it => it.txType === 'payment').length,
  };

  return result;
}

/**
 * Smart Reconciliation: Matches identical invoices first, then matches by Amount (with Fixed Amount & Halala rule) and Date proximity
 */
function reconcileSmart(supplierItems, doraItems, { dateToleranceDays, halalaTolerance }) {
  const matched = [];
  const amountMismatches = [];
  const doraMatchedIndices = new Set();
  const supplierUnmatched = [];

  // Pass 1: Strict invoice match if both have valid invoice numbers and same transaction type
  supplierItems.forEach(sup => {
    let matchedDoraIdx = -1;
    if (sup.normalizedInvoiceNumber && !sup.normalizedInvoiceNumber.startsWith('NO_INV')) {
      matchedDoraIdx = doraItems.findIndex((dora, dIdx) => {
        if (doraMatchedIndices.has(dIdx)) return false;
        // Strictly prevent cross-matching invoices with payments
        if (sup.txType && dora.txType && sup.txType !== dora.txType) return false;
        return dora.normalizedInvoiceNumber === sup.normalizedInvoiceNumber;
      });
    }

    if (matchedDoraIdx >= 0) {
      doraMatchedIndices.add(matchedDoraIdx);
      const dora = doraItems[matchedDoraIdx];
      const matchEval = isAmountMatch(sup.amount, dora.amount, halalaTolerance);

      if (matchEval.matched) {
        let matchMethod = 'رقم الفاتورة الصارم';
        if (matchEval.isFixedAmountMatch && !matchEval.isExact) {
          matchMethod = 'رقم الفاتورة (مطابقة المبلغ الثابت وإسقاط كسر الهللات)';
        } else if (!matchEval.isExact) {
          matchMethod = 'رقم الفاتورة (تجاوز فارق هللات)';
        }

        matched.push({
          invoiceNumber: sup.rawInvoiceNumber || dora.rawInvoiceNumber || '—',
          normalizedInvoice: sup.normalizedInvoiceNumber,
          txType: sup.txType || dora.txType || 'invoice',
          matchMethod,
          supplierDate: sup.date || '—',
          doraDate: dora.date || '—',
          supplierAmount: roundToHalalas(sup.amount),
          doraAmount: roundToHalalas(dora.amount),
          fixedAmount: matchEval.fixedAmount,
          difference: matchEval.diff,
          hasHalalaDiff: !matchEval.isExact,
          isFixedAmountMatch: matchEval.isFixedAmountMatch,
          ignoredFraction: matchEval.ignoredFraction,
          supplierDescription: sup.description || '—',
          doraDescription: dora.description || '—',
          supplierRows: [sup.excelRowNumber],
          doraRows: [dora.excelRowNumber],
        });
      } else {
        amountMismatches.push({
          invoiceNumber: sup.rawInvoiceNumber || dora.rawInvoiceNumber || '—',
          normalizedInvoice: sup.normalizedInvoiceNumber,
          txType: sup.txType || dora.txType || 'invoice',
          supplierDate: sup.date || '—',
          doraDate: dora.date || '—',
          supplierAmount: roundToHalalas(sup.amount),
          doraAmount: roundToHalalas(dora.amount),
          difference: matchEval.diff,
          supplierDescription: sup.description || '—',
          doraDescription: dora.description || '—',
          supplierRows: [sup.excelRowNumber],
          doraRows: [dora.excelRowNumber],
        });
      }
    } else {
      supplierUnmatched.push(sup);
    }
  });

  // Pass 2: Smart Match remaining by Amount (Fixed Amount / Halala rule) + Date proximity
  // CRITICAL AUDIT RULE: Only match items of the EXACT SAME transaction type (Invoice to Invoice, Payment to Payment)
  const remainingSupplier = [];
  supplierUnmatched.forEach(sup => {
    const supDate = sup.date ? new Date(sup.date) : null;
    const isValidSupDate = supDate && !isNaN(supDate.getTime());

    let bestIdx = -1;
    let bestMatchEval = null;
    let bestTier = 999;
    let minDaysDiff = Infinity;
    let minAmtDiff = Infinity;

    doraItems.forEach((dora, dIdx) => {
      if (doraMatchedIndices.has(dIdx)) return;
      // Strict segregation: Never mix invoice with payment
      if (sup.txType && dora.txType && sup.txType !== dora.txType) return;

      const matchEval = isAmountMatch(sup.amount, dora.amount, halalaTolerance);
      if (!matchEval.matched) return;

      let daysDiff = 0;
      let dateWithinTolerance = true;

      if (isValidSupDate && dora.date) {
        const dDate = new Date(dora.date);
        if (!isNaN(dDate.getTime())) {
          daysDiff = Math.abs((supDate - dDate) / (1000 * 60 * 60 * 24));
          if (daysDiff > dateToleranceDays) {
            dateWithinTolerance = false;
          }
        }
      }

      if (!dateWithinTolerance) return;

      // Candidate Selection Ranking:
      // 1. Tier (Exact match [1] > Shared Fixed Amount [2] > Fractional [3])
      // 2. Days Proximity (closer date)
      // 3. Amount Difference (smaller diff)
      const isBetter =
        matchEval.tier < bestTier ||
        (matchEval.tier === bestTier && daysDiff < minDaysDiff) ||
        (matchEval.tier === bestTier && daysDiff === minDaysDiff && matchEval.absDiff < minAmtDiff);

      if (isBetter) {
        bestTier = matchEval.tier;
        minDaysDiff = daysDiff;
        minAmtDiff = matchEval.absDiff;
        bestIdx = dIdx;
        bestMatchEval = matchEval;
      }
    });

    if (bestIdx >= 0 && bestMatchEval) {
      doraMatchedIndices.add(bestIdx);
      const dora = doraItems[bestIdx];

      let matchMethod = 'مطابقة ذكية (المبلغ وتاريخ متقارب)';
      if (bestMatchEval.isFixedAmountMatch && !bestMatchEval.isExact) {
        matchMethod = 'مطابقة ذكية (تطابق المبلغ الثابت وإسقاط كسر الهللات)';
      } else if (!bestMatchEval.isExact) {
        matchMethod = 'مطابقة ذكية (مع تجاوز فارق هللات)';
      }

      matched.push({
        invoiceNumber: sup.rawInvoiceNumber || dora.rawInvoiceNumber || '—',
        normalizedInvoice: sup.normalizedInvoiceNumber || dora.normalizedInvoiceNumber,
        txType: sup.txType || dora.txType || 'invoice',
        matchMethod,
        supplierDate: sup.date || '—',
        doraDate: dora.date || '—',
        supplierAmount: roundToHalalas(sup.amount),
        doraAmount: roundToHalalas(dora.amount),
        fixedAmount: bestMatchEval.fixedAmount,
        difference: bestMatchEval.diff,
        hasHalalaDiff: !bestMatchEval.isExact,
        isFixedAmountMatch: bestMatchEval.isFixedAmountMatch,
        ignoredFraction: bestMatchEval.ignoredFraction,
        supplierDescription: sup.description || '—',
        doraDescription: dora.description || '—',
        supplierRows: [sup.excelRowNumber],
        doraRows: [dora.excelRowNumber],
      });
    } else {
      remainingSupplier.push(sup);
    }
  });

  // Pass 3: Classify Unmatched
  const missingAtDora = remainingSupplier.map(sup => ({
    invoiceNumber: sup.rawInvoiceNumber || '—',
    normalizedInvoice: sup.normalizedInvoiceNumber,
    txType: sup.txType || 'invoice',
    date: sup.date || '—',
    amount: roundToHalalas(sup.amount),
    fixedAmount: Math.trunc(roundToHalalas(sup.amount)),
    description: sup.description || '—',
    supplierRows: [sup.excelRowNumber],
  }));

  const missingAtSupplier = doraItems
    .filter((_, idx) => !doraMatchedIndices.has(idx))
    .map(dora => ({
      invoiceNumber: dora.rawInvoiceNumber || '—',
      normalizedInvoice: dora.normalizedInvoiceNumber,
      txType: dora.txType || 'invoice',
      date: dora.date || '—',
      amount: roundToHalalas(dora.amount),
      fixedAmount: Math.trunc(roundToHalalas(dora.amount)),
      description: dora.description || '—',
      doraRows: [dora.excelRowNumber],
    }));

  return buildReconciliationSummary({
    supplierItems,
    doraItems,
    matched,
    missingAtDora,
    missingAtSupplier,
    amountMismatches,
    mode: 'smart',
    halalaTolerance,
  });
}

/**
 * Strict Invoice Reconciliation: Groups and matches strictly by Normalized Invoice Number + Transaction Type
 */
function reconcileStrict(supplierItems, doraItems, { halalaTolerance }) {
  const supplierMap = new Map();
  supplierItems.forEach(item => {
    // Segregate keys by transaction type so invoices and payments never collide
    const key = `${item.txType || 'invoice'}_${item.normalizedInvoiceNumber || 'NO_INV_SUP_' + item.id}`;
    if (!supplierMap.has(key)) {
      supplierMap.set(key, {
        key,
        normalizedInvoice: item.normalizedInvoiceNumber || key,
        rawInvoices: [item.rawInvoiceNumber],
        txType: item.txType || 'invoice',
        dates: [item.date],
        descriptions: [item.description],
        totalAmount: 0,
        items: []
      });
    }
    const group = supplierMap.get(key);
    group.totalAmount += item.amount;
    group.items.push(item);
    if (item.rawInvoiceNumber && !group.rawInvoices.includes(item.rawInvoiceNumber)) {
      group.rawInvoices.push(item.rawInvoiceNumber);
    }
    if (item.date && !group.dates.includes(item.date)) {
      group.dates.push(item.date);
    }
    if (item.description && !group.descriptions.includes(item.description)) {
      group.descriptions.push(item.description);
    }
  });

  const doraMap = new Map();
  doraItems.forEach(item => {
    const key = `${item.txType || 'invoice'}_${item.normalizedInvoiceNumber || 'NO_INV_DORA_' + item.id}`;
    if (!doraMap.has(key)) {
      doraMap.set(key, {
        key,
        normalizedInvoice: item.normalizedInvoiceNumber || key,
        rawInvoices: [item.rawInvoiceNumber],
        txType: item.txType || 'invoice',
        dates: [item.date],
        descriptions: [item.description],
        totalAmount: 0,
        items: []
      });
    }
    const group = doraMap.get(key);
    group.totalAmount += item.amount;
    group.items.push(item);
    if (item.rawInvoiceNumber && !group.rawInvoices.includes(item.rawInvoiceNumber)) {
      group.rawInvoices.push(item.rawInvoiceNumber);
    }
    if (item.date && !group.dates.includes(item.date)) {
      group.dates.push(item.date);
    }
    if (item.description && !group.descriptions.includes(item.description)) {
      group.descriptions.push(item.description);
    }
  });

  const missingAtDora = [];
  const missingAtSupplier = [];
  const amountMismatches = [];
  const matched = [];

  supplierMap.forEach((supGroup, key) => {
    if (doraMap.has(key)) {
      const doraGroup = doraMap.get(key);
      const matchEval = isAmountMatch(supGroup.totalAmount, doraGroup.totalAmount, halalaTolerance);

      if (matchEval.matched) {
        let matchMethod = 'رقم الفاتورة الصارم';
        if (matchEval.isFixedAmountMatch && !matchEval.isExact) {
          matchMethod = 'رقم الفاتورة (مطابقة المبلغ الثابت وإسقاط كسر الهللات)';
        } else if (!matchEval.isExact) {
          matchMethod = 'رقم الفاتورة (تجاوز فارق هللات)';
        }

        matched.push({
          invoiceNumber: supGroup.rawInvoices.join(' / ') || supGroup.normalizedInvoice,
          normalizedInvoice: supGroup.normalizedInvoice,
          txType: supGroup.txType || doraGroup.txType || 'invoice',
          matchMethod,
          supplierDate: supGroup.dates.join(', ') || '—',
          doraDate: doraGroup.dates.join(', ') || '—',
          supplierAmount: roundToHalalas(supGroup.totalAmount),
          doraAmount: roundToHalalas(doraGroup.totalAmount),
          fixedAmount: matchEval.fixedAmount,
          difference: matchEval.diff,
          hasHalalaDiff: !matchEval.isExact,
          isFixedAmountMatch: matchEval.isFixedAmountMatch,
          ignoredFraction: matchEval.ignoredFraction,
          supplierDescription: supGroup.descriptions.filter(Boolean).join(' | ') || '—',
          doraDescription: doraGroup.descriptions.filter(Boolean).join(' | ') || '—',
          supplierRows: supGroup.items.map(i => i.excelRowNumber),
          doraRows: doraGroup.items.map(i => i.excelRowNumber),
        });
      } else {
        amountMismatches.push({
          invoiceNumber: supGroup.rawInvoices.join(' / ') || supGroup.normalizedInvoice,
          normalizedInvoice: supGroup.normalizedInvoice,
          txType: supGroup.txType || doraGroup.txType || 'invoice',
          supplierDate: supGroup.dates.join(', ') || '—',
          doraDate: doraGroup.dates.join(', ') || '—',
          supplierAmount: roundToHalalas(supGroup.totalAmount),
          doraAmount: roundToHalalas(doraGroup.totalAmount),
          difference: matchEval.diff,
          supplierDescription: supGroup.descriptions.filter(Boolean).join(' | ') || '—',
          doraDescription: doraGroup.descriptions.filter(Boolean).join(' | ') || '—',
          supplierRows: supGroup.items.map(i => i.excelRowNumber),
          doraRows: doraGroup.items.map(i => i.excelRowNumber),
        });
      }
    } else {
      missingAtDora.push({
        invoiceNumber: supGroup.rawInvoices.join(' / ') || supGroup.normalizedInvoice,
        normalizedInvoice: supGroup.normalizedInvoice,
        txType: supGroup.txType || 'invoice',
        date: supGroup.dates.join(', ') || '—',
        amount: roundToHalalas(supGroup.totalAmount),
        fixedAmount: Math.trunc(roundToHalalas(supGroup.totalAmount)),
        description: supGroup.descriptions.filter(Boolean).join(' | ') || '—',
        supplierRows: supGroup.items.map(i => i.excelRowNumber),
      });
    }
  });

  doraMap.forEach((doraGroup, key) => {
    if (!supplierMap.has(key)) {
      missingAtSupplier.push({
        invoiceNumber: doraGroup.rawInvoices.join(' / ') || doraGroup.normalizedInvoice,
        normalizedInvoice: doraGroup.normalizedInvoice,
        txType: doraGroup.txType || 'invoice',
        date: doraGroup.dates.join(', ') || '—',
        amount: roundToHalalas(doraGroup.totalAmount),
        fixedAmount: Math.trunc(roundToHalalas(doraGroup.totalAmount)),
        description: doraGroup.descriptions.filter(Boolean).join(' | ') || '—',
        doraRows: doraGroup.items.map(i => i.excelRowNumber),
      });
    }
  });

  return buildReconciliationSummary({
    supplierItems,
    doraItems,
    matched,
    missingAtDora,
    missingAtSupplier,
    amountMismatches,
    mode: 'strict',
    halalaTolerance,
  });
}

function buildReconciliationSummary({ supplierItems, doraItems, matched, missingAtDora, missingAtSupplier, amountMismatches, mode, halalaTolerance }) {
  const totalSupplierAmount = roundToHalalas(supplierItems.reduce((acc, it) => acc + (it.amount || 0), 0));
  const totalDoraAmount = roundToHalalas(doraItems.reduce((acc, it) => acc + (it.amount || 0), 0));
  const netDifference = roundToHalalas(totalSupplierAmount - totalDoraAmount);

  const missingAtDoraTotal = roundToHalalas(missingAtDora.reduce((acc, it) => acc + it.amount, 0));
  const missingAtSupplierTotal = roundToHalalas(missingAtSupplier.reduce((acc, it) => acc + it.amount, 0));
  const matchedTotal = roundToHalalas(matched.reduce((acc, it) => acc + it.supplierAmount, 0));
  const amountMismatchDelta = roundToHalalas(amountMismatches.reduce((acc, it) => acc + it.difference, 0));

  // Halalas & Fixed Amount stats
  const halalaDiffItems = matched.filter(it => it.hasHalalaDiff);
  const fixedAmountMatchItems = matched.filter(it => it.isFixedAmountMatch && it.hasHalalaDiff);
  const halalasVarianceTotal = roundToHalalas(halalaDiffItems.reduce((acc, it) => acc + (it.difference || 0), 0));

  const totalInvoicesEvaluated = matched.length + missingAtDora.length + missingAtSupplier.length;
  const reconciliationRate = totalInvoicesEvaluated > 0
    ? Math.round((matched.length / totalInvoicesEvaluated) * 100)
    : 0;

  return {
    mode,
    halalaTolerance,
    kpis: {
      totalSupplierAmount,
      totalDoraAmount,
      netDifference,
      reconciliationRate,
      totalInvoicesEvaluated,
      matchedCount: matched.length,
      matchedTotal,
      missingAtDoraCount: missingAtDora.length,
      missingAtDoraTotal,
      missingAtSupplierCount: missingAtSupplier.length,
      missingAtSupplierTotal,
      amountMismatchCount: amountMismatches.length,
      amountMismatchDelta,
      halalaDiffCount: halalaDiffItems.length,
      fixedAmountMatchCount: fixedAmountMatchItems.length,
      halalasVarianceTotal,
    },
    missingAtDora: missingAtDora.sort((a, b) => b.amount - a.amount),
    missingAtSupplier: missingAtSupplier.sort((a, b) => b.amount - a.amount),
    amountMismatches: amountMismatches.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference)),
    matched: matched.sort((a, b) => b.supplierAmount - a.supplierAmount),
  };
}
