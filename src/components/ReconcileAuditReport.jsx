import React from 'react';
import { formatSAR, fixGarbledArabic, compareByDateAsc } from '../lib/formatters';
import { ShieldCheck, Building2, Calendar, FileText } from 'lucide-react';

export default function ReconcileAuditReport(props) {
  const result = props.reconciliationResult || props;
  const kpis = result.kpis || props.kpis;
  if (!kpis) return null;

  // Strictly sort chronologically by date: Oldest on top, newest at bottom (من الأقدم إلى الأحدث)
  const missingAtDora = [...(result.missingAtDora || props.missingAtDora || [])].sort((a, b) => compareByDateAsc(a, b, 'date', 'date'));
  const missingAtSupplier = [...(result.missingAtSupplier || props.missingAtSupplier || [])].sort((a, b) => compareByDateAsc(a, b, 'date', 'date'));
  const amountMismatches = [...(result.amountMismatches || props.amountMismatches || [])].sort((a, b) => compareByDateAsc(a, b, 'supplierDate', 'supplierDate'));
  const matched = [...(result.matched || props.matched || [])].sort((a, b) => compareByDateAsc(a, b, 'supplierDate', 'supplierDate'));
  const supplierName = props.supplierName || props.metadata?.supplierName || 'المورد';
  const period = props.period || props.metadata?.period || 'كافة الفترات المسجلة';
  const currentDate = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-slate-200 print:border-none print:shadow-none print:p-0 space-y-8">
      {/* Formal Header */}
      <div className="border-b-2 border-slate-900 pb-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 p-2 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
            <img src="./dora_logo.png" alt="درة السيارة" className="max-h-full object-contain" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              درة السيارة لقطع غيار السيارات
            </h2>
            <p className="text-xs text-slate-600 font-bold">
              إدارة الحسابات العامة والمراجعة والتدقيق المالي
            </p>
            <p className="text-[11px] text-slate-400">
              تقرير المطابقة المحاسبية الرسمية لكشف حساب المورد
            </p>
          </div>
        </div>

        <div className="text-left text-xs space-y-1 font-mono">
          <div className="text-slate-500 font-bold">تاريخ التدقيق:</div>
          <div className="text-slate-900 font-black">{currentDate}</div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
            <span>مستند تدقيق مالي معتمد</span>
          </div>
        </div>
      </div>

      {/* Meta Box */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
        <div>
          <span className="text-slate-400 block text-[10px]">اسم المورد:</span>
          <span className="text-slate-900 text-sm font-black">{supplierName}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">الفترة المحاسبية:</span>
          <span className="text-slate-800 font-mono">{period}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">نسبة المطابقة المحققة:</span>
          <span className="text-emerald-700 font-mono text-sm">{kpis.reconciliationRate}%</span>
        </div>
      </div>

      {/* Halala Tolerance Audit Policy Note */}
      <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs text-emerald-950 font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>قاعدة المراجعة المعتمدة: مطابقة المبلغ الثابت وإسقاط كسور الهللات الناتجة عن تقريب ضريبة القيمة المضافة (مثال: 956.25 يطابق 956 مع ترك 0.25 هللة).</span>
        </div>
        {kpis.halalaDiffCount > 0 && (
          <span className="text-[11px] font-mono text-emerald-800 shrink-0 bg-white px-2 py-0.5 rounded border border-emerald-200">
            {kpis.halalaDiffCount} فواتير طوبقت بإسقاط كسر الهللات
          </span>
        )}
      </div>

      {/* Balances Summary */}
      <div className="space-y-3">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <span>أولاً: ملخص مقارنة الأرصدة الإجمالية</span>
        </h3>
        <table className="w-full text-right text-xs border border-slate-300">
          <thead className="bg-slate-100 font-bold text-slate-800">
            <tr>
              <th className="p-2.5 border border-slate-300">البيان</th>
              <th className="p-2.5 border border-slate-300">المبلغ (ر.س)</th>
              <th className="p-2.5 border border-slate-300">الأثر المالي / الملاحظة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-mono">
            <tr>
              <td className="p-2.5 border border-slate-300 font-sans font-bold">إجمالي رصيد كشف حساب المورد</td>
              <td className="p-2.5 border border-slate-300 font-black text-blue-900">{formatSAR(kpis.totalSupplierAmount)}</td>
              <td className="p-2.5 border border-slate-300 font-sans text-slate-500">حسب الكشف المرسل من المورد</td>
            </tr>
            <tr>
              <td className="p-2.5 border border-slate-300 font-sans font-bold">إجمالي رصيد دفاتر درة السيارة</td>
              <td className="p-2.5 border border-slate-300 font-black text-emerald-900">{formatSAR(kpis.totalDoraAmount)}</td>
              <td className="p-2.5 border border-slate-300 font-sans text-slate-500">حسب فواتير المشتريات والقيود المسجلة عندنا</td>
            </tr>
            <tr className="bg-slate-50 font-black text-slate-900">
              <td className="p-2.5 border border-slate-300 font-sans">صافي الفارق الإجمالي</td>
              <td className="p-2.5 border border-slate-300 text-sm">{formatSAR(Math.abs(kpis.netDifference))}</td>
              <td className="p-2.5 border border-slate-300 font-sans font-bold text-slate-700">
                {kpis.netDifference > 0 ? 'مبلغ يطالب به المورد زيادة عما هو مسجل عندنا' : 'مبالغ مسجلة عندنا لم يثبتها المورد بكشفه'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Section 1: Invoices Missing at Dora Cars */}
      <div className="space-y-3 print-avoid-break">
        <div className="flex items-center justify-between border-b border-rose-200 pb-2">
          <h3 className="text-sm font-black text-rose-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
            <span>ثانياً: فواتير مسجلة عند المورد ولم تسجل عندنا (مستحقات معلقة للمراجعة)</span>
          </h3>
          <span className="text-xs font-mono font-bold text-rose-700">
            {missingAtDora.length} فواتير · الإجمالي: {formatSAR(kpis.missingAtDoraTotal)}
          </span>
        </div>

        {missingAtDora.length === 0 ? (
          <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold text-center border border-emerald-200">
            ✓ ممتاز: لا توجد أي فواتير مسجلة عند المورد غير مثبتة عندنا.
          </div>
        ) : (
          <table className="w-full text-right text-xs border border-slate-300">
            <thead className="bg-rose-50 text-rose-950 font-bold border-b border-slate-300">
              <tr>
                <th className="p-2 w-12 text-center border border-slate-300">#</th>
                <th className="p-2 border border-slate-300">رقم الفاتورة</th>
                <th className="p-2 border border-slate-300">التاريخ</th>
                <th className="p-2 border border-slate-300">المبلغ (ر.س)</th>
                <th className="p-2 border border-slate-300">البيان / التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {missingAtDora.map((it, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-2 text-center text-slate-400 border border-slate-300">{idx + 1}</td>
                  <td className="p-2 font-bold text-slate-900 border border-slate-300">{it.invoiceNumber}</td>
                  <td className="p-2 text-slate-600 border border-slate-300">{it.date}</td>
                  <td className="p-2 font-bold text-rose-700 border border-slate-300">{formatSAR(it.amount)}</td>
                  <td className="p-2 font-sans text-slate-700 border border-slate-300">{fixGarbledArabic(it.description)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-rose-100/70 font-bold border-t-2 border-slate-300 text-rose-950 font-mono">
              <tr>
                <td colSpan={3} className="p-2 text-left font-sans">إجمالي الفواتير غير المسجلة عندنا:</td>
                <td className="p-2 font-black text-sm">{formatSAR(kpis.missingAtDoraTotal)}</td>
                <td className="p-2 font-sans font-normal text-[11px] text-slate-500">({missingAtDora.length} فواتير)</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Section 2: Invoices Missing at Supplier */}
      <div className="space-y-3 print-avoid-break">
        <div className="flex items-center justify-between border-b border-amber-200 pb-2">
          <h3 className="text-sm font-black text-amber-950 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
            <span>ثالثاً: فواتير مسجلة في دفاتر درة السيارة ولم تسجل عند المورد</span>
          </h3>
          <span className="text-xs font-mono font-bold text-amber-800">
            {missingAtSupplier.length} فواتير · الإجمالي: {formatSAR(kpis.missingAtSupplierTotal)}
          </span>
        </div>

        {missingAtSupplier.length === 0 ? (
          <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold text-center border border-emerald-200">
            ✓ ممتاز: كافة الفواتير المسجلة في دفاتر درة السيارة مثبتة في كشف المورد.
          </div>
        ) : (
          <table className="w-full text-right text-xs border border-slate-300">
            <thead className="bg-amber-50 text-amber-950 font-bold border-b border-slate-300">
              <tr>
                <th className="p-2 w-12 text-center border border-slate-300">#</th>
                <th className="p-2 border border-slate-300">رقم الفاتورة</th>
                <th className="p-2 border border-slate-300">التاريخ</th>
                <th className="p-2 border border-slate-300">المبلغ (ر.س)</th>
                <th className="p-2 border border-slate-300">البيان / التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {missingAtSupplier.map((it, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-2 text-center text-slate-400 border border-slate-300">{idx + 1}</td>
                  <td className="p-2 font-bold text-slate-900 border border-slate-300">{it.invoiceNumber}</td>
                  <td className="p-2 text-slate-600 border border-slate-300">{it.date}</td>
                  <td className="p-2 font-bold text-amber-800 border border-slate-300">{formatSAR(it.amount)}</td>
                  <td className="p-2 font-sans text-slate-700 border border-slate-300">{fixGarbledArabic(it.description)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-amber-100/70 font-bold border-t-2 border-slate-300 text-amber-950 font-mono">
              <tr>
                <td colSpan={3} className="p-2 text-left font-sans">إجمالي الفواتير غير المسجلة عند المورد:</td>
                <td className="p-2 font-black text-sm">{formatSAR(kpis.missingAtSupplierTotal)}</td>
                <td className="p-2 font-sans font-normal text-[11px] text-slate-500">({missingAtSupplier.length} فواتير)</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Section 3: Amount Mismatches (If any) */}
      {amountMismatches.length > 0 && (
        <div className="space-y-3 print-avoid-break">
          <div className="flex items-center justify-between border-b border-purple-200 pb-2">
            <h3 className="text-sm font-black text-purple-950 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
              <span>رابعاً: فواتير مسجلة بالطرفين بوجود فارق مالي (اختلاف قيمة الفاتورة)</span>
            </h3>
            <span className="text-xs font-mono font-bold text-purple-800">
              {amountMismatches.length} فواتير
            </span>
          </div>

          <table className="w-full text-right text-xs border border-slate-300">
            <thead className="bg-purple-50 text-purple-950 font-bold border-b border-slate-300">
              <tr>
                <th className="p-2 w-12 text-center border border-slate-300">#</th>
                <th className="p-2 border border-slate-300">رقم الفاتورة</th>
                <th className="p-2 border border-slate-300">المبلغ عند المورد</th>
                <th className="p-2 border border-slate-300">المبلغ عندنا</th>
                <th className="p-2 border border-slate-300">الفارق المالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {amountMismatches.map((it, idx) => (
                <tr key={idx}>
                  <td className="p-2 text-center text-slate-400 border border-slate-300">{idx + 1}</td>
                  <td className="p-2 font-bold text-slate-900 border border-slate-300">{it.invoiceNumber}</td>
                  <td className="p-2 text-blue-800 border border-slate-300">{formatSAR(it.supplierAmount)}</td>
                  <td className="p-2 text-emerald-800 border border-slate-300">{formatSAR(it.doraAmount)}</td>
                  <td className="p-2 font-black border border-slate-300">
                    <span className={it.difference > 0 ? 'text-rose-700' : 'text-amber-800'}>
                      {it.difference > 0 ? `+${formatSAR(it.difference)}` : formatSAR(it.difference)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Official Signatures & Approval Box */}
      <div className="pt-8 border-t-2 border-slate-900 grid grid-cols-3 gap-6 text-center text-xs print-avoid-break">
        <div className="space-y-8">
          <div className="font-bold text-slate-700">إعداد المحاسب المسؤول</div>
          <div className="border-b border-dashed border-slate-400 w-32 mx-auto" />
          <div className="text-[10px] text-slate-400">التوقيع / التاريخ</div>
        </div>

        <div className="space-y-8">
          <div className="font-bold text-slate-700">مراجعة المحاسب القانوني / المالي</div>
          <div className="border-b border-dashed border-slate-400 w-32 mx-auto" />
          <div className="text-[10px] text-slate-400">التوقيع / التاريخ</div>
        </div>

        <div className="space-y-8">
          <div className="font-bold text-slate-700">اعتماد إدارة شركة درة السيارة</div>
          <div className="border-b border-dashed border-slate-400 w-32 mx-auto" />
          <div className="text-[10px] text-slate-400">الختم والاعتماد الرسمي</div>
        </div>
      </div>
    </div>
  );
}

