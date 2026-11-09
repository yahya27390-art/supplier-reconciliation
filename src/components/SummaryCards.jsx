import React from 'react';
import { formatSAR, formatNumber } from '../lib/formatters';
import {
  DollarSign, AlertOctagon, AlertTriangle, CheckCircle2,
  TrendingDown, TrendingUp, Scale, Percent
} from 'lucide-react';

export default function SummaryCards({ kpis, activeTab, onSelectTab }) {
  if (!kpis) return null;

  const isBalanced = Math.abs(kpis.netDifference) < 0.05;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 no-print">
      {/* 1. Supplier Statement Total */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[11px] font-bold">إجمالي كشف المورد</span>
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-base font-black text-slate-900 font-mono">
          {formatSAR(kpis.totalSupplierAmount)}
        </div>
        <div className="text-[10px] text-slate-400 font-medium">
          مجموع القيود في كشف المورد
        </div>
      </div>

      {/* 2. Dora Cars Ledger Total */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[11px] font-bold">إجمالي كشف درة السيارة</span>
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-base font-black text-slate-900 font-mono">
          {formatSAR(kpis.totalDoraAmount)}
        </div>
        <div className="text-[10px] text-slate-400 font-medium">
          مجموع القيود في دفاترنا
        </div>
      </div>

      {/* 3. Net Statement Difference */}
      <div className={`p-4 rounded-2xl border shadow-xs space-y-1 ${
        isBalanced
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
          : kpis.netDifference > 0
          ? 'bg-rose-50/70 border-rose-200 text-rose-950'
          : 'bg-amber-50/70 border-amber-200 text-amber-950'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold">صافي فارق الكشفين</span>
          <div className={`p-1.5 rounded-lg ${isBalanced ? 'bg-emerald-100 text-emerald-700' : 'bg-white shadow-xs'}`}>
            <Scale className="w-4 h-4" />
          </div>
        </div>
        <div className="text-base font-black font-mono">
          {formatSAR(Math.abs(kpis.netDifference))}
        </div>
        <div className="text-[10px] font-bold flex items-center gap-1">
          {isBalanced ? (
            <span className="text-emerald-700">✓ كشف الحساب متطابق بالكامل</span>
          ) : kpis.netDifference > 0 ? (
            <span className="text-rose-700 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> المورد يطالب بفارق أعلى
            </span>
          ) : (
            <span className="text-amber-700 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> درة السيارة مسجلة مبالغ أعلى
            </span>
          )}
        </div>
      </div>

      {/* 4. Missing in Dora Cars (Button to filter) */}
      <button
        type="button"
        onClick={() => onSelectTab('missingAtDora')}
        className={`p-4 rounded-2xl border text-right transition-all cursor-pointer shadow-xs space-y-1 ${
          activeTab === 'missingAtDora'
            ? 'ring-2 ring-rose-500 bg-rose-50 border-rose-300'
            : 'bg-white hover:bg-rose-50/40 border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between text-rose-600">
          <span className="text-[11px] font-bold">لم تسجل عندنا</span>
          <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
            <AlertOctagon className="w-4 h-4" />
          </div>
        </div>
        <div className="text-base font-black text-rose-700 font-mono">
          {formatSAR(kpis.missingAtDoraTotal)}
        </div>
        <div className="text-[10px] text-rose-600 font-bold">
          {kpis.missingAtDoraCount} فواتير مسجلة عند المورد فقط
        </div>
      </button>

      {/* 5. Missing in Supplier (Button to filter) */}
      <button
        type="button"
        onClick={() => onSelectTab('missingAtSupplier')}
        className={`p-4 rounded-2xl border text-right transition-all cursor-pointer shadow-xs space-y-1 ${
          activeTab === 'missingAtSupplier'
            ? 'ring-2 ring-amber-500 bg-amber-50 border-amber-300'
            : 'bg-white hover:bg-amber-50/40 border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between text-amber-700">
          <span className="text-[11px] font-bold">لم تسجل عند المورد</span>
          <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="text-base font-black text-amber-800 font-mono">
          {formatSAR(kpis.missingAtSupplierTotal)}
        </div>
        <div className="text-[10px] text-amber-700 font-bold">
          {kpis.missingAtSupplierCount} فواتير مسجلة بدفاترنا فقط
        </div>
      </button>

      {/* 6. Reconciliation Match Rate */}
      <button
        type="button"
        onClick={() => onSelectTab('matched')}
        className={`p-4 rounded-2xl border text-right transition-all cursor-pointer shadow-xs space-y-1 ${
          activeTab === 'matched'
            ? 'ring-2 ring-emerald-500 bg-emerald-50 border-emerald-300'
            : 'bg-white hover:bg-emerald-50/40 border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between text-emerald-600">
          <span className="text-[11px] font-bold">نسبة المطابقة</span>
          <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <div className="text-base font-black text-emerald-700 font-mono">
          {kpis.reconciliationRate}%
        </div>
        <div className="text-[10px] text-emerald-600 font-bold flex flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            <span>{kpis.matchedCount} فواتير متطابقة</span>
          </div>
          {kpis.halalaDiffCount > 0 && (
            <span className="text-[9px] text-amber-700 font-medium">
              (منها {kpis.halalaDiffCount} بإسقاط كسر الهللات ومطابقة الثابت)
            </span>
          )}
        </div>
      </button>
    </div>
  );
}

