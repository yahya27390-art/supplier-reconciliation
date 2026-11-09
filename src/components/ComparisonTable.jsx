import React, { useState, useMemo } from 'react';
import { formatSAR, fixGarbledArabic } from '../lib/formatters';
import {
  Search, Copy, Check, AlertOctagon, AlertTriangle, CheckCircle2,
  ArrowUpDown, Filter, Layers, Info
} from 'lucide-react';

export default function ComparisonTable({
  activeTab,
  onSelectTab,
  missingAtDora = [],
  missingAtSupplier = [],
  amountMismatches = [],
  matched = [],
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [checkedItems, setCheckedItems] = useState(new Set());

  const handleCopy = (text, id) => {
    navigator.clipboard?.writeText(String(text));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleCheck = (id) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Determine current active list
  const currentList = useMemo(() => {
    switch (activeTab) {
      case 'missingAtDora': return missingAtDora;
      case 'missingAtSupplier': return missingAtSupplier;
      case 'amountMismatches': return amountMismatches;
      case 'matched': return matched;
      default: return missingAtDora;
    }
  }, [activeTab, missingAtDora, missingAtSupplier, amountMismatches, matched]);

  // Filter list by search query
  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentList;
    return currentList.filter(item => {
      const invMatch = item.invoiceNumber && String(item.invoiceNumber).toLowerCase().includes(q);
      const rawDesc = item.description || item.supplierDescription || item.doraDescription || '';
      const cleanDesc = fixGarbledArabic(rawDesc);
      const descMatch = rawDesc.toLowerCase().includes(q) || cleanDesc.toLowerCase().includes(q);
      const amountMatch = String(item.amount || item.supplierAmount || '').includes(q);
      return invMatch || descMatch || amountMatch;
    });
  }, [currentList, searchQuery]);

  // Total for current filtered view
  const currentTotal = useMemo(() => {
    if (activeTab === 'amountMismatches') {
      return filteredList.reduce((acc, it) => acc + Math.abs(it.difference || 0), 0);
    }
    return filteredList.reduce((acc, it) => acc + (it.amount || it.supplierAmount || 0), 0);
  }, [filteredList, activeTab]);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden no-print">
      {/* Tab Navigation Header */}
      <div className="border-b border-slate-200 bg-slate-50/70 p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => onSelectTab('missingAtDora')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'missingAtDora'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>فواتير لم تسجل عندنا ({missingAtDora.length})</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('missingAtSupplier')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'missingAtSupplier'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>فواتير لم تسجل عند المورد ({missingAtSupplier.length})</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('amountMismatches')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'amountMismatches'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>فروقات المبالغ ({amountMismatches.length})</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('matched')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'matched'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>المطابقة تماماً ({matched.length})</span>
          </button>
        </div>

        {/* Live Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم الفاتورة أو البيان..."
            className="w-full bg-white border border-slate-300 rounded-xl pr-9 pl-3 py-2 text-xs font-medium text-slate-900 focus:outline-hidden focus:border-blue-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Tab Context Banner */}
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between text-xs font-medium">
        {activeTab === 'missingAtDora' && (
          <div className="text-rose-950 flex items-center gap-2 font-bold">
            <span className="w-2 h-2 rounded-full bg-rose-600" />
            <span>هذه الفواتير مسجلة في كشف حساب المورد ولكن لم يتم إثباتها أو تسجيلها في دفاتر ومشتريات درة السيارة (مستحقات واجبة التحقق).</span>
          </div>
        )}
        {activeTab === 'missingAtSupplier' && (
          <div className="text-amber-950 flex items-center gap-2 font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-600" />
            <span>هذه الفواتير مسجلة في دفاتر درة السيارة ولكنها غير ظاهرة في كشف حساب المورد (سندات سداد أو فواتير لم يرحلها المورد).</span>
          </div>
        )}
        {activeTab === 'amountMismatches' && (
          <div className="text-purple-950 flex items-center gap-2 font-bold">
            <span className="w-2 h-2 rounded-full bg-purple-600" />
            <span>الفواتير الموجودة في كلا الكشفين ولكن بقيم مختلفة (قد يعود السبب لاختلاف احتساب الضريبة، خصم، أو خطأ تسعير).</span>
          </div>
        )}
        {activeTab === 'matched' && (
          <div className="text-emerald-950 flex items-center gap-2 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>الفواتير المتطابقة بنسبة 100% بين كشف المورد ودفاتر درة السيارة من حيث رقم الفاتورة والمبلغ المالي.</span>
          </div>
        )}

        <div className="text-slate-500 font-mono text-[11px] shrink-0 mr-4">
          عرض {filteredList.length} من أصل {currentList.length} قيد
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="p-3 w-10 text-center">تدقيق</th>
              <th className="p-3 w-12 text-center">#</th>
              <th className="p-3">رقم الفاتورة / المستند</th>
              <th className="p-3">تاريخ القيد</th>
              {activeTab === 'amountMismatches' ? (
                <>
                  <th className="p-3">المبلغ عند المورد</th>
                  <th className="p-3">المبلغ عندنا</th>
                  <th className="p-3">فارق المبلغ</th>
                </>
              ) : (
                <th className="p-3">المبلغ (ر.س)</th>
              )}
              <th className="p-3">البيان والتفاصيل</th>
              <th className="p-3 w-28 text-center">أسطر الملف</th>
              <th className="p-3 w-16 text-center">نسخ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-400 font-bold">
                  {searchQuery ? 'لا توجد نتائج تطابق بحثك' : 'لا توجد قيود في هذا التبويب'}
                </td>
              </tr>
            ) : (
              filteredList.map((item, idx) => {
                const itemId = `${activeTab}-${item.normalizedInvoice || idx}`;
                const isChecked = checkedItems.has(itemId);

                return (
                  <tr
                    key={itemId}
                    className={`transition-colors ${
                      isChecked
                        ? 'bg-emerald-50/50 text-slate-500'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    {/* Checkbox for Accountant Review */}
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCheck(itemId)}
                        className="rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        title="تأشير تمت المراجعة والتدقيق مع المحاسب"
                      />
                    </td>

                    {/* Sequential Index */}
                    <td className="p-3 text-center font-mono text-slate-400 font-bold">
                      {idx + 1}
                    </td>

                    {/* Invoice Number & Type Badge */}
                    <td className="p-3 font-mono font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span className={isChecked ? 'line-through text-slate-400' : ''}>
                          {item.invoiceNumber}
                        </span>
                        {item.txType === 'payment' ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-800 font-bold font-sans">
                            سند سداد
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 font-medium font-sans border border-blue-200">
                            فاتورة
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="p-3 font-mono text-slate-600 whitespace-nowrap">
                      {item.date || item.supplierDate || item.doraDate || '—'}
                    </td>

                    {/* Amounts */}
                    {activeTab === 'amountMismatches' ? (
                      <>
                        <td className="p-3 font-mono font-bold text-blue-700">
                          {formatSAR(item.supplierAmount)}
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-700">
                          {formatSAR(item.doraAmount)}
                        </td>
                        <td className="p-3 font-mono font-bold">
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] ${
                            item.difference > 0 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900'
                          }`}>
                            {item.difference > 0 ? `+${formatSAR(item.difference)}` : formatSAR(item.difference)}
                          </span>
                        </td>
                      </>
                    ) : (
                      <td className="p-3 font-mono font-bold text-slate-900">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span>{formatSAR(item.amount || item.supplierAmount)}</span>
                            {activeTab === 'matched' && item.doraAmount && item.supplierAmount && item.hasHalalaDiff && (
                              <span className="text-[10px] text-slate-400 font-normal font-sans">
                                (درة: {formatSAR(item.doraAmount)})
                              </span>
                            )}
                          </div>
                          {item.hasHalalaDiff && (
                            <div className="flex items-center gap-1 mt-1">
                              {item.isFixedAmountMatch ? (
                                <span
                                  className="text-[10px] font-sans font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-flex items-center gap-1"
                                  title={`المبلغ الثابت المشترك: ${item.fixedAmount} ر.س — تم إهمال كسر ${item.ignoredFraction?.toFixed(2)} هللة`}
                                >
                                  <span>✓ تطابق ثابت: {item.fixedAmount} ر.س</span>
                                  <span className="text-emerald-600 font-normal">
                                    (ترك .{Math.round((item.ignoredFraction || 0) * 100)} هللة)
                                  </span>
                                </span>
                              ) : (
                                <span
                                  className="text-[10px] font-sans font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200"
                                  title="تم تجاوز فارق الهللات واعتبار الفاتورة متطابقة"
                                >
                                  تجاوز هللات: {item.difference > 0 ? `+${item.difference.toFixed(2)}` : item.difference.toFixed(2)} ر.س
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    )}

                    {/* Description */}
                    <td
                      className="p-3 text-slate-600 max-w-xs truncate"
                      title={fixGarbledArabic(item.description || item.supplierDescription || item.doraDescription)}
                    >
                      {fixGarbledArabic(item.description || item.supplierDescription || item.doraDescription) || '—'}
                    </td>

                    {/* Source Excel Rows */}
                    <td className="p-3 text-center font-mono text-[11px] text-slate-400">
                      {item.supplierRows?.join(', ') || item.doraRows?.join(', ') || '—'}
                    </td>

                    {/* Copy Button */}
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleCopy(item.invoiceNumber, itemId)}
                        className="p-1.5 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors cursor-pointer"
                        title="نسخ رقم الفاتورة"
                      >
                        {copiedId === itemId ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Table Footer Summary */}
          {filteredList.length > 0 && (
            <tfoot className="bg-slate-100/90 font-bold border-t border-slate-300 text-slate-900">
              <tr>
                <td colSpan={4} className="p-3 text-left">
                  إجمالي المبالغ في هذا التبويب:
                </td>
                <td className="p-3 font-mono text-sm text-slate-900" colSpan={activeTab === 'amountMismatches' ? 3 : 1}>
                  {formatSAR(currentTotal)}
                </td>
                <td colSpan={3} className="p-3 text-slate-500 font-normal text-[11px]">
                  ({filteredList.length} حركة)
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

