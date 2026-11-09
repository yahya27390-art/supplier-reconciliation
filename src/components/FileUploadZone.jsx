import React, { useRef } from 'react';
import { UploadCloud, FileSpreadsheet, FileText, CheckCircle2, AlertCircle, Settings2, ArrowLeftRight, Building2, Calendar, Zap, Coins, SlidersHorizontal } from 'lucide-react';

export const COMMON_SUPPLIERS = [
  'تسلا الخليج للتجارة',
  'صالح / العثيمان الرياض',
  'محمد الجبر',
  'شركة محمد يوسف الناغي',
  'شركة الوعلان للتجارة',
  'المجدوعي للسيارات',
  'الرميزان لقطع الغيار',
  'بن حماد لقطع الغيار',
  'مؤسسة التقوى لقطع الغيار',
  'مورد الرياض العام',
  'وكالة كيا الجبر'
];

export default function FileUploadZone({
  supplierFile,
  doraFile,
  onUploadSupplierFile,
  onUploadDoraFile,
  onOpenSupplierMapping,
  onOpenDoraMapping,
  supplierName,
  setSupplierName,
  period,
  setPeriod,
  matchingMode = 'smart',
  setMatchingMode,
  halalaTolerance = 0.99,
  setHalalaTolerance,
  scopeFilter = 'invoices_only',
  setScopeFilter,
  onExecuteReconciliation,
  isProcessing
}) {
  const supplierInputRef = useRef(null);
  const doraInputRef = useRef(null);

  const handleDrop = (e, target) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      if (target === 'supplier') onUploadSupplierFile(files[0]);
      if (target === 'dora') onUploadDoraFile(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const isReadyToReconcile = Boolean(supplierFile?.parsed && doraFile?.parsed && !isProcessing);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
      {/* Audit Meta Fields: Supplier Name & Statement Period */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>اسم المورد المعتمد للمراجعة:</span>
          </label>
          <input
            type="text"
            list="supplier-suggestions"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            placeholder="مثال: تسلا الخليج للتجارة / صالح العثيمان..."
            className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 transition-all focus:outline-hidden"
          />
          <datalist id="supplier-suggestions">
            {COMMON_SUPPLIERS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>فترة كشف الحساب الخاضعة للتسوية:</span>
          </label>
          <input
            type="text"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder="مثال: حتى 8-11-2026 / شهر أكتوبر 2026..."
            className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 transition-all focus:outline-hidden"
          />
        </div>
      </div>

      {/* Advanced Reconciliation Options: Scope, Method, Halala Policy */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
        {/* Option 1: Scope Filter (Invoices vs Payments vs All) */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <span className="text-xs font-bold text-slate-800">نطاق المطابقة المطلوب:</span>
              <span className="text-[11px] text-slate-500 mr-2">
                {scopeFilter === 'invoices_only'
                  ? 'مطابقة فواتير المشتريات والمبيعات فقط (فصل تام عن سندات السداد والحوالات)'
                  : scopeFilter === 'payments_only'
                  ? 'مطابقة سندات السداد والحوالات البنكية فقط'
                  : 'مطابقة شاملة مع فرز الفواتير عن السداد (يمنع خلط الفاتورة بسند السداد)'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs self-stretch lg:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setScopeFilter && setScopeFilter('invoices_only')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                scopeFilter === 'invoices_only'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              🧾 فواتير المشتريات (Invoices)
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter && setScopeFilter('payments_only')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                scopeFilter === 'payments_only'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              💳 سندات السداد (Payments)
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter && setScopeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                scopeFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              📑 الكل (مفروز)
            </button>
          </div>
        </div>

        {/* Option 2: Matching Method */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <span className="text-xs font-bold text-slate-800">طريقة مطابقة الفواتير:</span>
              <span className="text-[11px] text-slate-500 mr-2">
                {matchingMode === 'smart'
                  ? 'المطابقة الذكية تفحص الفواتير برقمها أولاً، ثم بالمبلغ وتاريخ مقارب (±7 أيام) للكشوف المتباينة'
                  : 'المطابقة برقم الفاتورة فقط تتطلب تطابقاً تاماً بين رقم المستند في كشف درة وكشف المورد'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs self-stretch lg:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setMatchingMode && setMatchingMode('smart')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                matchingMode === 'smart'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              ✓ المطابقة الذكية (موصى بها)
            </button>
            <button
              type="button"
              onClick={() => setMatchingMode && setMatchingMode('strict')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                matchingMode === 'strict'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              رقم الفاتورة الصارم فقط
            </button>
          </div>
        </div>

        {/* Option 3: Halalas & Whole Amount Tolerance Policy */}
        <div className="pt-2.5 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="text-xs font-bold text-slate-800">قاعدة إسقاط كسور الهللات ومطابقة المبلغ الثابت:</span>
              <span className="text-[11px] text-slate-500 mr-2">
                مطابقة المبلغ الثابت وإسقاط أي كسر هللات ناتج عن تقريب الضريبة (مثال: 956.25 يطابق 956 مع ترك 0.25 هللة)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs self-stretch sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setHalalaTolerance && setHalalaTolerance(0.99)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                halalaTolerance >= 0.9
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="تطابق المبلغ الثابت وإسقاط أي كسر هللات أقل من ريال (< 1.00 ر.س)"
            >
              ✓ إسقاط كسر الهللات (&lt; 1 ريال)
            </button>

            <button
              type="button"
              onClick={() => setHalalaTolerance && setHalalaTolerance(0.50)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                Math.abs(halalaTolerance - 0.50) < 0.05
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="تجاوز حتى نصف ريال (50 هللة)"
            >
              حتى 50 هللة
            </button>

            <button
              type="button"
              onClick={() => setHalalaTolerance && setHalalaTolerance(0.00)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                halalaTolerance < 0.01
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="تطابق حسابي تام بدون أي تجاوز للهللات"
            >
              تطابق تام (بدون تجاوز)
            </button>
          </div>
        </div>
      </div>

      {/* Dual Upload Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
        {/* File 1: Supplier Statement */}
        <div
          onDrop={(e) => handleDrop(e, 'supplier')}
          onDragOver={handleDragOver}
          onClick={() => supplierInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer relative group ${
            supplierFile?.parsed
              ? 'border-blue-400 bg-blue-50/40 hover:bg-blue-50/60'
              : 'border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/20'
          }`}
        >
          <input
            type="file"
            ref={supplierInputRef}
            onChange={(e) => e.target.files?.[0] && onUploadSupplierFile(e.target.files[0])}
            accept=".xlsx, .xls, .csv, .pdf, .PDF"
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 ${
              supplierFile?.parsed ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-200'
            }`}>
              {supplierFile?.parsed ? (
                <CheckCircle2 className="w-7 h-7" />
              ) : (
                <UploadCloud className="w-7 h-7" />
              )}
            </div>

            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 mb-1">
                <span>الملف رقم 1 (المورد)</span>
                {supplierFile?.parsed?.fileType === 'pdf' && (
                  <span className="bg-red-500 text-white px-1.5 py-0.2 rounded text-[10px]">PDF</span>
                )}
                {supplierFile?.parsed?.fileType === 'excel' && (
                  <span className="bg-emerald-600 text-white px-1.5 py-0.2 rounded text-[10px]">Excel</span>
                )}
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                كشف حساب المورد (PDF أو Excel)
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                {supplierFile?.name || 'اسحب وأفلت كشف المورد هنا (يدعم PDF ككشف تسلا الخليج أو Excel)'}
              </p>
            </div>

            {supplierFile?.parsed && (
              <div className="pt-2 w-full space-y-2">
                <div className="bg-white p-3 rounded-xl border border-blue-200 text-xs text-slate-700 flex items-center justify-between">
                  <span className="font-bold">عدد القيود المقروءة:</span>
                  <span className="font-mono font-bold text-blue-700">
                    {supplierFile.parsed.totalRows} حركة
                    {supplierFile.parsed.pageCount ? ` (${supplierFile.parsed.pageCount} صفحة)` : ''}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenSupplierMapping();
                  }}
                  className="w-full py-1.5 px-3 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>تعديل تعيين الأعمدة (الأعمدة المكتشفة)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Separator Badge */}
        <div className="hidden lg:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900 text-white items-center justify-center shadow-lg border-2 border-white z-10">
          <ArrowLeftRight className="w-4 h-4" />
        </div>

        {/* File 2: Dora Cars Statement */}
        <div
          onDrop={(e) => handleDrop(e, 'dora')}
          onDragOver={handleDragOver}
          onClick={() => doraInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer relative group ${
            doraFile?.parsed
              ? 'border-emerald-400 bg-emerald-50/40 hover:bg-emerald-50/60'
              : 'border-slate-300 hover:border-emerald-400 bg-slate-50/60 hover:bg-emerald-50/20'
          }`}
        >
          <input
            type="file"
            ref={doraInputRef}
            onChange={(e) => e.target.files?.[0] && onUploadDoraFile(e.target.files[0])}
            accept=".xlsx, .xls, .csv, .pdf, .PDF"
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 ${
              doraFile?.parsed ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-600 border border-emerald-200'
            }`}>
              {doraFile?.parsed ? <CheckCircle2 className="w-7 h-7" /> : <UploadCloud className="w-7 h-7" />}
            </div>

            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 mb-1">
                <span>الملف رقم 2 (درة السيارة)</span>
                {doraFile?.parsed?.fileType === 'pdf' && (
                  <span className="bg-red-500 text-white px-1.5 py-0.2 rounded text-[10px]">PDF</span>
                )}
                {doraFile?.parsed?.fileType === 'excel' && (
                  <span className="bg-emerald-600 text-white px-1.5 py-0.2 rounded text-[10px]">Excel</span>
                )}
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                كشف حساب درة السيارة (دفاترنا ومشترياتنا)
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                {doraFile?.name || 'اسحب وأفلت ملف إكسل كشف الحساب الخاص بدرة السيارة هنا'}
              </p>
            </div>

            {doraFile?.parsed && (
              <div className="pt-2 w-full space-y-2">
                <div className="bg-white p-3 rounded-xl border border-emerald-200 text-xs text-slate-700 flex items-center justify-between">
                  <span className="font-bold">عدد القيود المقروءة:</span>
                  <span className="font-mono font-bold text-emerald-700">{doraFile.parsed.totalRows} حركة</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDoraMapping();
                  }}
                  className="w-full py-1.5 px-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>تعديل تعيين الأعمدة (الأعمدة المكتشفة)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Start Reconciliation CTA */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500 font-medium">
          {isReadyToReconcile ? (
            <span className="text-emerald-700 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              جاهز للمطابقة: تم تحميل كشف المورد وكشف درة السيارة بنجاح (فصل تام بين الفواتير والسداد)
            </span>
          ) : (
            <span>يرجى رفع ملف كشف المورد وملف كشف درة السيارة للبدء في المطابقة الفورية</span>
          )}
        </div>

        <button
          type="button"
          onClick={onExecuteReconciliation}
          disabled={!isReadyToReconcile}
          className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl text-xs font-black shadow-lg transition-all flex items-center justify-center gap-2 ${
            isReadyToReconcile
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25 active:scale-[0.98] cursor-pointer'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>جارٍ التدقيق والمطابقة المحاسبية...</span>
            </>
          ) : (
            <>
              <ArrowLeftRight className="w-4 h-4" />
              <span>بدء المطابقة الآلية واستخراج تقرير الفروقات ➔</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
