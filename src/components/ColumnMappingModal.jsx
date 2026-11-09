import React, { useState } from 'react';
import { X, Check, Sliders, Table } from 'lucide-react';

export default function ColumnMappingModal({
  isOpen,
  onClose,
  targetName,
  parsedData,
  currentMapping,
  onSaveMapping
}) {
  if (!isOpen || !parsedData) return null;

  const [mapping, setMapping] = useState({ ...currentMapping });

  const headers = parsedData.headers || [];
  const previewRows = (parsedData.rows || []).slice(0, 3);

  const handleSave = () => {
    onSaveMapping(mapping);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in no-print">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">تحديد وتعيين أعمدة {targetName}</h3>
              <p className="text-xs text-slate-400">
                الملف: {parsedData.fileName} · ورقة العمل: {parsedData.activeSheet}
              </p>
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

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          <div className="bg-blue-50/70 border border-blue-200 p-3.5 rounded-2xl text-blue-950 font-medium">
            يقوم النظام باكتشاف الأعمدة تلقائياً. يمكنك هنا تعديل أو اختيار العمود المقابل لكل بيان في ملف الإكسل لضمان دقة المطابقة.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Invoice Number Column */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                عمود رقم الفاتورة / المستند <span className="text-rose-500">*</span>
              </label>
              <select
                value={mapping.invoiceNumber || ''}
                onChange={(e) => setMapping({ ...mapping, invoiceNumber: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-blue-500 cursor-pointer"
              >
                <option value="">-- اختر العمود --</option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Column */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                عمود تاريخ الفاتورة / القيد
              </label>
              <select
                value={mapping.date || ''}
                onChange={(e) => setMapping({ ...mapping, date: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-blue-500 cursor-pointer"
              >
                <option value="">-- اختياري (تلقائي) --</option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount Column */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                عمود المبلغ / القيمة الإجمالية <span className="text-rose-500">*</span>
              </label>
              <select
                value={mapping.amount || ''}
                onChange={(e) => setMapping({ ...mapping, amount: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-blue-500 cursor-pointer"
              >
                <option value="">-- اختر العمود --</option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* Description Column */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                عمود البيان / الوصف / التفاصيل
              </label>
              <select
                value={mapping.description || ''}
                onChange={(e) => setMapping({ ...mapping, description: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-blue-500 cursor-pointer"
              >
                <option value="">-- اختياري (تلقائي) --</option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Data Sample Preview */}
          {previewRows.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Table className="w-3.5 h-3.5 text-slate-500" />
                <span>معاينة لأول {previewRows.length} أسطر من الملف:</span>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-x-auto bg-slate-50/50">
                <table className="w-full text-right text-[11px]">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2">السطر</th>
                      {headers.slice(0, 5).map((h) => (
                        <th key={h} className="p-2 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {previewRows.map((r, i) => (
                      <tr key={i} className="hover:bg-white">
                        <td className="p-2 font-mono text-slate-400">{r._rowIdx}</td>
                        {headers.slice(0, 5).map((h) => (
                          <td key={h} className="p-2 whitespace-nowrap text-slate-800">
                            {String(r._raw?.[h] || '—')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>حفظ واعتماد التعيين</span>
          </button>
        </div>
      </div>
    </div>
  );
}

