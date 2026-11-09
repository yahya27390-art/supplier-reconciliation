import React, { useState } from 'react';
import Header from './components/Header';
import FileUploadZone from './components/FileUploadZone';
import ColumnMappingModal from './components/ColumnMappingModal';
import SummaryCards from './components/SummaryCards';
import ComparisonTable from './components/ComparisonTable';
import ReconcileAuditReport from './components/ReconcileAuditReport';
import InstructionsModal from './components/InstructionsModal';
import { parseStatementFile, standardizeRows } from './lib/statementParser';
import { reconcileStatements } from './lib/reconciliationEngine';
import { exportReconciliationToExcel } from './lib/reportExporter';
import { LayoutDashboard, FileText, AlertCircle, Sparkles } from 'lucide-react';

export default function App() {
  // File State
  const [supplierFile, setSupplierFile] = useState(null);
  const [doraFile, setDoraFile] = useState(null);

  // Audit Metadata
  const [supplierName, setSupplierName] = useState('تسلا الخليج للتجارة');
  const [period, setPeriod] = useState('حتى 8-11-2026');
  const [matchingMode, setMatchingMode] = useState('smart'); // 'smart' | 'strict'
  const [halalaTolerance, setHalalaTolerance] = useState(0.99); // Ignore halalas (< 1.00 SAR)
  const [scopeFilter, setScopeFilter] = useState('invoices_only'); // 'invoices_only' | 'payments_only' | 'all'

  // Processing & Errors
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Reconciliation Results
  const [reconciliationResult, setReconciliationResult] = useState(null);
  const [activeTab, setActiveTab] = useState('missingAtDora');
  const [viewMode, setViewMode] = useState('interactive'); // 'interactive' | 'auditReport'

  // Modals
  const [isSupplierMappingOpen, setIsSupplierMappingOpen] = useState(false);
  const [isDoraMappingOpen, setIsDoraMappingOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Upload Supplier File
  const handleUploadSupplierFile = async (file) => {
    setErrorMsg(null);
    try {
      const parsed = await parseStatementFile(file);
      setSupplierFile({
        file,
        name: file.name,
        parsed,
        mapping: { ...parsed.detectedMapping }
      });
      // Auto-extract supplier name from file name if possible
      if (file.name.includes('تسلا') || file.name.includes('Tesla')) {
        setSupplierName('تسلا الخليج للتجارة');
      } else if (file.name.includes('عثيمان') || file.name.includes('صالح')) {
        setSupplierName('صالح / العثيمان الرياض');
      } else if (file.name.includes('جبر')) {
        setSupplierName('محمد الجبر');
      } else if (file.name.includes('ناغي') || file.name.includes('الناغي')) {
        setSupplierName('شركة محمد يوسف الناغي');
      } else if (file.name.includes('وعلان') || file.name.includes('الوعلان')) {
        setSupplierName('شركة الوعلان للتجارة');
      }
    } catch (err) {
      console.error('Supplier file parse error:', err);
      setErrorMsg(`خطأ في قراءة ملف كشف المورد: ${err.message || 'الملف غير صالح'}`);
    }
  };

  // Upload Dora Cars File
  const handleUploadDoraFile = async (file) => {
    setErrorMsg(null);
    try {
      const parsed = await parseStatementFile(file);
      setDoraFile({
        file,
        name: file.name,
        parsed,
        mapping: { ...parsed.detectedMapping }
      });
    } catch (err) {
      console.error('Dora file parse error:', err);
      setErrorMsg(`خطأ في قراءة ملف كشف درة السيارة: ${err.message || 'الملف غير صالح'}`);
    }
  };

  // Run Reconciliation
  const handleExecuteReconciliation = () => {
    if (!supplierFile?.parsed || !doraFile?.parsed) return;
    setErrorMsg(null);
    setIsProcessing(true);

    try {
      // 1. Standardize both sets of records using confirmed column mappings and file scopes
      const supplierStandard = standardizeRows(supplierFile.parsed.rows, supplierFile.mapping, 'supplier');
      const doraStandard = standardizeRows(doraFile.parsed.rows, doraFile.mapping, 'dora');

      if (supplierStandard.length === 0) {
        throw new Error('لم يتم العثور على حركات فواتير صالحة في ملف المورد. يرجى مراجعة تعيين الأعمدة.');
      }
      if (doraStandard.length === 0) {
        throw new Error('لم يتم العثور على حركات فواتير صالحة في ملف درة السيارة. يرجى مراجعة تعيين الأعمدة.');
      }

      // 2. Run Engine with selected scope, matching mode & halala tolerance
      const result = reconcileStatements(supplierStandard, doraStandard, {
        mode: matchingMode,
        filterType: scopeFilter,
        halalaTolerance: Number(halalaTolerance)
      });
      setReconciliationResult(result);
      setActiveTab('missingAtDora');
      setViewMode('interactive');
    } catch (err) {
      console.error('Reconciliation error:', err);
      setErrorMsg(err.message || 'حدث خطأ أثناء إجراء المطابقة المحاسبية');
    } finally {
      setIsProcessing(false);
    }
  };

  // Print Report
  const handlePrint = () => {
    setViewMode('auditReport');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Export Excel
  const handleExport = () => {
    if (!reconciliationResult) return;
    exportReconciliationToExcel(reconciliationResult, {
      supplierName,
      period,
    });
  };

  // Reset
  const handleReset = () => {
    setSupplierFile(null);
    setDoraFile(null);
    setReconciliationResult(null);
    setErrorMsg(null);
    setViewMode('interactive');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 selection:bg-blue-600 selection:text-white">
      {/* App Header */}
      <Header
        hasResults={Boolean(reconciliationResult)}
        onReset={handleReset}
        onPrint={handlePrint}
        onExport={handleExport}
        onOpenHelp={() => setIsHelpOpen(true)}
        supplierName={supplierName}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Error Notification Alert */}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs animate-shake">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-rose-500 hover:text-rose-800 text-sm font-bold px-2 py-0.5"
            >
              ✕
            </button>
          </div>
        )}

        {/* Section 1: Dual File Upload & Metadata */}
        <FileUploadZone
          supplierFile={supplierFile}
          doraFile={doraFile}
          onUploadSupplierFile={handleUploadSupplierFile}
          onUploadDoraFile={handleUploadDoraFile}
          onOpenSupplierMapping={() => setIsSupplierMappingOpen(true)}
          onOpenDoraMapping={() => setIsDoraMappingOpen(true)}
          supplierName={supplierName}
          setSupplierName={setSupplierName}
          period={period}
          setPeriod={setPeriod}
          matchingMode={matchingMode}
          setMatchingMode={setMatchingMode}
          halalaTolerance={halalaTolerance}
          setHalalaTolerance={setHalalaTolerance}
          scopeFilter={scopeFilter}
          setScopeFilter={setScopeFilter}
          onExecuteReconciliation={handleExecuteReconciliation}
          isProcessing={isProcessing}
        />

        {/* Section 2: Results Display */}
        {reconciliationResult && (
          <div className="space-y-6">
            {/* View Mode Switcher: Interactive Dashboard vs Printable Accounting Report */}
            <div className="flex items-center justify-between bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 mr-2">طريقة العرض:</span>
                <button
                  type="button"
                  onClick={() => setViewMode('interactive')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    viewMode === 'interactive'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>لوحة التحكم التفاعلية</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('auditReport')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    viewMode === 'auditReport'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>تقرير المطابقة الرسمي للطباعة والتوقيع (A4)</span>
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>
                  تم فحص {reconciliationResult.kpis.totalInvoicesEvaluated} حركة • نسبة المطابقة{' '}
                  <strong className="text-slate-900">{reconciliationResult.kpis.reconciliationRate}%</strong>
                </span>
              </div>
            </div>

            {/* View 1: Interactive Dashboard */}
            {viewMode === 'interactive' && (
              <>
                {/* 6 Executive KPI Cards */}
                <SummaryCards
                  kpis={reconciliationResult.kpis}
                  activeTab={activeTab}
                  onSelectTab={setActiveTab}
                />

                {/* Line Items Table with Tabs, Search, and Live Filtering */}
                <ComparisonTable
                  activeTab={activeTab}
                  onSelectTab={setActiveTab}
                  missingAtDora={reconciliationResult.missingAtDora}
                  missingAtSupplier={reconciliationResult.missingAtSupplier}
                  amountMismatches={reconciliationResult.amountMismatches}
                  matched={reconciliationResult.matched}
                  supplierName={supplierName}
                  period={period}
                />
              </>
            )}

            {/* View 2: Printable Formal Accounting Audit Report */}
            {viewMode === 'auditReport' && (
              <ReconcileAuditReport
                kpis={reconciliationResult.kpis}
                missingAtDora={reconciliationResult.missingAtDora}
                missingAtSupplier={reconciliationResult.missingAtSupplier}
                amountMismatches={reconciliationResult.amountMismatches}
                matched={reconciliationResult.matched}
                supplierName={supplierName}
                period={period}
              />
            )}
          </div>
        )}
      </main>

      {/* Supplier Column Mapping Modal */}
      {isSupplierMappingOpen && supplierFile?.parsed && (
        <ColumnMappingModal
          title={`تعيين أعمدة كشف المورد: ${supplierFile.name}`}
          headers={supplierFile.parsed.headers}
          mapping={supplierFile.mapping}
          onSaveMapping={(newMapping) => {
            setSupplierFile(prev => ({ ...prev, mapping: newMapping }));
            setIsSupplierMappingOpen(false);
          }}
          onClose={() => setIsSupplierMappingOpen(false)}
          rowsPreview={supplierFile.parsed.rows.slice(0, 5)}
        />
      )}

      {/* Dora Cars Column Mapping Modal */}
      {isDoraMappingOpen && doraFile?.parsed && (
        <ColumnMappingModal
          title={`تعيين أعمدة كشف درة السيارة: ${doraFile.name}`}
          headers={doraFile.parsed.headers}
          mapping={doraFile.mapping}
          onSaveMapping={(newMapping) => {
            setDoraFile(prev => ({ ...prev, mapping: newMapping }));
            setIsDoraMappingOpen(false);
          }}
          onClose={() => setIsDoraMappingOpen(false)}
          rowsPreview={doraFile.parsed.rows.slice(0, 5)}
        />
      )}

      {/* Accountant Quick Guide Modal */}
      {isHelpOpen && <InstructionsModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />}
    </div>
  );
}
