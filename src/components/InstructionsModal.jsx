import React from 'react';
import { X, BookOpen, CheckCircle2, AlertOctagon, AlertTriangle, ArrowUpDown, FileSpreadsheet, Printer } from 'lucide-react';

export default function InstructionsModal({ isOpen = true, onClose }) {
  if (isOpen === false) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in no-print">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">دليل استخدام نظام مطابقة كشوف حسابات الموردين</h3>
              <p className="text-xs text-slate-400">إرشادات المحاسب المالي لشركة درة السيارة</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 leading-relaxed flex-1">
          {/* Step 1 */}
          <div className="flex items-start gap-3 p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
              1
            </div>
            <div className="space-y-1">
              <div className="font-bold text-blue-950 text-sm">تجهيز ملف كشف حساب المورد</div>
              <p className="text-slate-600 text-xs">
                احصل على ملف إكسل أو CSV لكشف الحساب الصادر من المورد (مثل كشف صالح العثيمان، الجبر، الوعلان...)، واسحبه في الخانة المخصصة للمورد.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
              2
            </div>
            <div className="space-y-1">
              <div className="font-bold text-emerald-950 text-sm">تجهيز ملف كشف حساب درة السيارة</div>
              <p className="text-slate-600 text-xs">
                قم بتصدير كشف حساب المورد من برنامج المحاسبة الخاص بدرة السيارة أو ملف إكسل فواتير المشتريات، واسحبه في الخانة المخصصة لدرة السيارة.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3 p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl">
            <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0">
              3
            </div>
            <div className="space-y-1">
              <div className="font-bold text-purple-950 text-sm">التعرف التلقائي على الأعمدة</div>
              <p className="text-slate-600 text-xs">
                يقوم النظام بالتعرف الذكي التلقائي على أعمدة (رقم الفاتورة، التاريخ، المبلغ، البيان). وإذا كانت مسميات الأعمدة غير مألوفة، يمكنك الضغط على <strong>«تعديل تعيين الأعمدة»</strong> لاختيارها يدوياً بدقة.
              </p>
            </div>
          </div>

          {/* Classification breakdown */}
          <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50">
            <div className="font-black text-slate-900 text-xs">كيف يحلل النظام البيانات المحاسبية؟</div>
            
            <div className="space-y-2 text-[11px]">
              <div className="flex items-center gap-2 font-bold text-rose-700">
                <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
                <span>فواتير لم تسجل عندنا: فواتير يطالب بها المورد ولكنها سقطت أو لم تُرحل لدفاترنا (يطلب صورها من المورد).</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>فواتير لم تسجل عند المورد: فواتير أو دفعات سددناها ولكن المورد لم يثبتها في كشفه.</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-purple-700">
                <ArrowUpDown className="w-3.5 h-3.5 shrink-0" />
                <span>فروقات المبالغ: نفس الفاتورة مسجلة لدى الطرفين ولكن بقيم متباينة (اختلاف ضريبة، مرتجع جزئي، خطأ تسعير).</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>المطابقة تماماً: فواتير متطابقة في الرقم والمبلغ بالمليم.</span>
              </div>
            </div>
          </div>

          {/* Export / Print */}
          <div className="flex items-center gap-2 text-slate-600 text-xs pt-1">
            <Printer className="w-4 h-4 text-slate-900 shrink-0" />
            <span>يمكنك بنقرة زر طباعة تقرير المطابقة الرسمي بتوقيع المحاسب والإدارة أو تصديره إلى ملف Excel بـ 5 أوراق مفصلة.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            إغلاق الدليل
          </button>
        </div>
      </div>
    </div>
  );
}

