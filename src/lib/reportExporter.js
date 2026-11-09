/**
 * Accounting Report Exporter (Excel & Print PDF)
 */
import * as XLSX from 'xlsx';
import { fixGarbledArabic, compareByDateAsc } from './formatters';

export function exportReconciliationToExcel(reconciliationResult, metadata = {}) {
  const { kpis } = reconciliationResult;
  // Strictly sort chronologically by date: Oldest on top, newest at bottom (من الأقدم إلى الأحدث)
  const missingAtDora = [...(reconciliationResult.missingAtDora || [])].sort((a, b) => compareByDateAsc(a, b, 'date', 'date'));
  const missingAtSupplier = [...(reconciliationResult.missingAtSupplier || [])].sort((a, b) => compareByDateAsc(a, b, 'date', 'date'));
  const amountMismatches = [...(reconciliationResult.amountMismatches || [])].sort((a, b) => compareByDateAsc(a, b, 'supplierDate', 'supplierDate'));
  const matched = [...(reconciliationResult.matched || [])].sort((a, b) => compareByDateAsc(a, b, 'supplierDate', 'supplierDate'));
  const supplierName = metadata.supplierName || 'المورد';
  const statementPeriod = metadata.period || 'كافة الفترات';
  const auditDate = new Date().toLocaleDateString('ar-SA');

  const wb = XLSX.utils.book_new();

  // 1. Summary Sheet
  const summaryData = [
    ['تقرير مطابقة وتسوية كشف حساب المورد — درة السيارة لقطع غيار السيارات'],
    ['اسم المورد:', supplierName],
    ['تاريخ إعداد المطابقة:', auditDate],
    ['الفترة المحاسبية:', statementPeriod],
    [],
    ['المؤشر المالي', 'القيمة / العدد'],
    ['إجمالي رصيد كشف المورد (ر.س)', kpis.totalSupplierAmount],
    ['إجمالي رصيد كشف درة السيارة (ر.س)', kpis.totalDoraAmount],
    ['صافي الفارق الإجمالي (ر.س)', kpis.netDifference],
    ['نسبة المطابقة (%)', `${kpis.reconciliationRate}%`],
    ['عدد الفواتير غير المسجلة عندنا', kpis.missingAtDoraCount],
    ['إجمالي قيمة الفواتير غير المسجلة عندنا (ر.س)', kpis.missingAtDoraTotal],
    ['عدد الفواتير غير المسجلة عند المورد', kpis.missingAtSupplierCount],
    ['إجمالي قيمة الفواتير غير المسجلة عند المورد (ر.س)', kpis.missingAtSupplierTotal],
    ['عدد فواتير فروقات المبالغ', kpis.amountMismatchCount],
    ['صافي فارق مبالغ الفواتير (ر.س)', kpis.amountMismatchDelta],
    ['عدد الفواتير المطابقة تماماً', kpis.matchedCount],
    ['إجمالي قيمة الفواتير المطابقة (ر.س)', kpis.matchedTotal],
    ['عدد الفواتير المطابقة بإسقاط كسر الهللات', kpis.halalaDiffCount || 0],
    ['إجمالي فروق الهللات المتجاوز عنها (ر.س)', kpis.halalasVarianceTotal || 0],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'الملخص التنفيذي');

  // 2. Missing at Dora Cars
  const missingDoraData = [
    ['الفواتير المسجلة عند المورد ولم تسجل في دفاتر درة السيارة (مستحقات معلقة للمراجعة)'],
    ['رقم الفاتورة', 'تاريخ الفاتورة', 'المبلغ (ر.س)', 'البيان والتفاصيل', 'أسطر ملف المورد'],
    ...missingAtDora.map(it => [
      it.invoiceNumber,
      it.date,
      it.amount,
      fixGarbledArabic(it.description),
      it.supplierRows?.join(', ') || ''
    ]),
    [],
    ['الإجمالي', '', kpis.missingAtDoraTotal, `${missingAtDora.length} فواتير`, '']
  ];
  const wsMissingDora = XLSX.utils.aoa_to_sheet(missingDoraData);
  XLSX.utils.book_append_sheet(wb, wsMissingDora, 'فواتير لم تسجل عندنا');

  // 3. Missing at Supplier
  const missingSupplierData = [
    ['الفواتير المسجلة عند درة السيارة ولم تسجل عند المورد (فروقات لصالحنا / مسددات معلقة)'],
    ['رقم الفاتورة', 'تاريخ الفاتورة', 'المبلغ (ر.س)', 'البيان والتفاصيل', 'أسطر ملف درة السيارة'],
    ...missingAtSupplier.map(it => [
      it.invoiceNumber,
      it.date,
      it.amount,
      fixGarbledArabic(it.description),
      it.doraRows?.join(', ') || ''
    ]),
    [],
    ['الإجمالي', '', kpis.missingAtSupplierTotal, `${missingAtSupplier.length} فواتير`, '']
  ];
  const wsMissingSupplier = XLSX.utils.aoa_to_sheet(missingSupplierData);
  XLSX.utils.book_append_sheet(wb, wsMissingSupplier, 'فواتير لم تسجل عند المورد');

  // 4. Amount Mismatches
  if (amountMismatches.length > 0) {
    const mismatchData = [
      ['فواتير مسجلة في الطرفين ولكن بوجود فارق في القيمة (اختلاف ضريبة أو مرتجع أو خطأ تسعير)'],
      ['رقم الفاتورة', 'تاريخ المورد', 'تاريخ درة السيارة', 'المبلغ عند المورد (ر.س)', 'المبلغ عند درة السيارة (ر.س)', 'الفارق (ر.س)', 'بيان المورد', 'بيان درة السيارة'],
      ...amountMismatches.map(it => [
        it.invoiceNumber,
        it.supplierDate,
        it.doraDate,
        it.supplierAmount,
        it.doraAmount,
        it.difference,
        fixGarbledArabic(it.supplierDescription),
        fixGarbledArabic(it.doraDescription)
      ])
    ];
    const wsMismatch = XLSX.utils.aoa_to_sheet(mismatchData);
    XLSX.utils.book_append_sheet(wb, wsMismatch, 'فروقات المبالغ');
  }

  // 5. Matched
  if (matched.length > 0) {
    const matchedData = [
      ['الفواتير المطابقة بين كشف المورد ودفاتر درة السيارة (تشمل الفواتير المطابقة مع إسقاط كسر الهللات)'],
      ['رقم الفاتورة', 'تاريخ المورد', 'تاريخ درة السيارة', 'المبلغ عند المورد (ر.س)', 'المبلغ عند درة (ر.س)', 'المبلغ الثابت المتطابق (ر.س)', 'كسر الهللات المتجاهل (ر.س)', 'طريقة المطابقة', 'بيان المورد', 'بيان درة السيارة'],
      ...matched.map(it => [
        it.invoiceNumber,
        it.supplierDate,
        it.doraDate,
        it.supplierAmount,
        it.doraAmount || it.supplierAmount,
        it.fixedAmount || Math.trunc(it.supplierAmount),
        it.hasHalalaDiff ? (it.ignoredFraction || Math.abs(it.difference) || 0) : 0,
        it.matchMethod || 'مطابقة تامة',
        fixGarbledArabic(it.supplierDescription),
        fixGarbledArabic(it.doraDescription)
      ])
    ];
    const wsMatched = XLSX.utils.aoa_to_sheet(matchedData);
    XLSX.utils.book_append_sheet(wb, wsMatched, 'الفواتير المطابقة');
  }

  // Generate Filename
  const safeName = supplierName.replace(/[\\/:*?"<>|]/g, '_');
  const filename = `مطابقة_كشف_حساب_${safeName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}

