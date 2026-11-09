import React from 'react';
import { FileSpreadsheet, Printer, RotateCcw, HelpCircle, ShieldCheck } from 'lucide-react';

export default function Header({ hasResults, onReset, onPrint, onExport, onOpenHelp, supplierName }) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand & System Title */}
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center p-1.5 shrink-0 shadow-xs">
            <img src="./dora_logo.png" alt="درة السيارة" className="max-h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                درة السيارة — مطابقة كشوف حسابات الموردين
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>نظام محاسبي معتمد</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              مقارنة ذكية آلية لكشف حساب المورد مع كشف درة السيارة واستخراج الفواتير غير المسجلة وفروقات التسوية
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {hasResults && (
            <>
              <button
                type="button"
                onClick={onExport}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
                title="تصدير تقرير المطابقة إلى ملف إكسل شامل للمحاسب"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden sm:inline">تصدير إكسل</span>
              </button>

              <button
                type="button"
                onClick={onPrint}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
                title="طباعة تقرير المراجعة الرسمي للتوقيع والاعتماد"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">طباعة التقرير</span>
              </button>

              <button
                type="button"
                onClick={onReset}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-slate-200"
                title="بدء مطابقة جديدة لكشف آخر"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onOpenHelp}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer border border-slate-200"
            title="دليل استخدام النظام للمحاسب"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

