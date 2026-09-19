import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sun,
  Moon,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Trash2,
  Sparkles,
  ArrowRight,
  Database,
  Layers,
  History,
  Copy,
  Check
} from 'lucide-react';
import { validateProductCode, generateSampleCode } from './core/dfaEngine';
import {
  getProducts,
  saveProduct,
  deleteProduct,
  getLogs,
  saveLog,
  clearLogs,
  getTheme,
  setTheme
} from './services/storage';

const CATEGORY_OPTIONS = [
  { code: 'IT', name: 'Information Technology' },
  { code: 'EL', name: 'Electronics & Appliances' },
  { code: 'PR', name: 'Printing & Publishing' },
  { code: 'NW', name: 'Networking Equipment' },
  { code: 'OF', name: 'Office Furniture & Supplies' },
];

const PRESETS = [
  { label: 'VALID CODE', code: 'IT-2026-001' },
  { label: 'PREFIX ERROR', code: '1T-2026-001' },
  { label: 'YEAR ERROR', code: 'IT-202-001' },
  { label: 'DASH ERROR', code: 'IT2026-001' },
  { label: 'ALPHABET ERROR', code: 'IT#2026-001' },
];

export default function App() {
  const [theme, setThemeState] = useState(() => getTheme());
  const [activeTab, setActiveTab] = useState('simulator'); // 'simulator' | 'inventory'

  // Tab 1: Simulator state
  const [inputCode, setInputCode] = useState('IT-2026-001');
  const [logs, setLogs] = useState([]);
  const [animatingStep, setAnimatingStep] = useState(null); // index of currently highlighted step during sequential animation
  const animTimerRef = useRef(null);
  const animCompleteTimeoutRef = useRef(null);

  // Tab 2: Inventory state
  const [products, setProducts] = useState([]);
  const [regCategory, setRegCategory] = useState('IT');
  const [regName, setRegName] = useState('');
  const [regCode, setRegCode] = useState('IT-2026-001');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // Sync theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setTheme(theme);
  }, [theme]);

  // Load initial data
  useEffect(() => {
    setProducts(getProducts());
    setLogs(getLogs());
  }, []);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (animTimerRef.current) clearInterval(animTimerRef.current);
      if (animCompleteTimeoutRef.current) clearTimeout(animCompleteTimeoutRef.current);
    };
  }, []);

  // Compute DFA trace in real-time
  const dfa = useMemo(() => validateProductCode(inputCode), [inputCode]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Stop sequential animation
  const stopAnimation = () => {
    if (animTimerRef.current) {
      clearInterval(animTimerRef.current);
      animTimerRef.current = null;
    }
    if (animCompleteTimeoutRef.current) {
      clearTimeout(animCompleteTimeoutRef.current);
      animCompleteTimeoutRef.current = null;
    }
    setAnimatingStep(null);
  };

  // Trigger sequential animation from step 1 to halting step (45ms per step)
  const triggerSequentialAnimation = (trace) => {
    stopAnimation();
    if (!trace || trace.length === 0) return;

    let current = 0;
    setAnimatingStep(0);

    animTimerRef.current = setInterval(() => {
      current++;
      if (current >= trace.length) {
        if (animTimerRef.current) {
          clearInterval(animTimerRef.current);
          animTimerRef.current = null;
        }
        // Settle smoothly after short dwell
        animCompleteTimeoutRef.current = setTimeout(() => {
          setAnimatingStep(null);
        }, 350);
      } else {
        setAnimatingStep(current);
      }
    }, 45);
  };

  // Save log entry to storage
  const recordLog = (code) => {
    const res = validateProductCode(code);
    const updated = saveLog({
      id: Date.now() + Math.random(),
      input: code,
      isValid: res.isValid,
      state: res.finalState,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });
    setLogs(updated);
  };

  // Tab 1: Input handling
  const handleInputChange = (value) => {
    stopAnimation();
    setInputCode(value.toUpperCase());
  };

  const handleValidate = () => {
    recordLog(inputCode);
    triggerSequentialAnimation(dfa.trace);
  };

  const handleClear = () => {
    stopAnimation();
    setInputCode('');
  };

  const handleRunPreset = (code) => {
    setInputCode(code);
    const res = validateProductCode(code);
    recordLog(code);
    triggerSequentialAnimation(res.trace);
  };

  const handleReplayLog = (code) => {
    setActiveTab('simulator');
    setInputCode(code);
    const res = validateProductCode(code);
    recordLog(code);
    triggerSequentialAnimation(res.trace);
  };

  const handleClearLogs = () => {
    clearLogs();
    setLogs([]);
  };

  // Tab 2: Inventory actions
  const handleUseCurrentScanned = () => {
    setRegCode(inputCode);
    setRegError('');
    setRegSuccess('');
    // Auto-select category if code starts with known prefix
    const prefix = inputCode.slice(0, 2);
    if (CATEGORY_OPTIONS.some((c) => c.code === prefix)) {
      setRegCategory(prefix);
    }
  };

  const handleGenerateValid = () => {
    const generated = generateSampleCode(regCategory);
    setRegCode(generated);
    setRegError('');
    setRegSuccess('');
  };

  const handleRegisterProduct = (e) => {
    e.preventDefault();
    setRegSuccess('');

    if (!regName.trim()) {
      setRegError('Product name is required.');
      return;
    }

    const trimmedCode = regCode.trim().toUpperCase();
    const res = validateProductCode(trimmedCode);

    if (!res.isValid) {
      setRegError(`Invalid serial code: ${res.errorReason || 'DFA rejected'}`);
      return;
    }

    const formattedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    const updated = saveProduct({
      code: trimmedCode,
      category: regCategory,
      name: regName.trim(),
      registeredDate: formattedDate
    });

    setProducts(updated);
    setRegName('');
    setRegError('');
    setRegSuccess(`Registered "${trimmedCode}" successfully!`);
    setRegCode(generateSampleCode(regCategory));
  };

  const handleDeleteProduct = (code) => {
    const updated = deleteProduct(code);
    setProducts(updated);
  };

  // Domain styling helper for stepper
  const getDomainStyle = (domain, isError) => {
    if (isError) {
      return 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
    }
    switch (domain) {
      case 'Prefix':
        return 'bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800';
      case 'Delimiter':
        return 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
      case 'Year':
        return 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
      case 'Serial':
        return 'bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-150 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* 1. Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              DFA Product Code Validator
            </h1>
            <p className="text-xs sm:text-sm font-mono text-slate-500 dark:text-slate-400 mt-1">
              M = (Q, Σ, δ, q0, F) • 13 States • |Σ| = 37
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full text-xs font-mono font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 shadow-sm">
              CCAUTOMA Project
            </div>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm transition-colors"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600" />
                  <span>Dark</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* 2. Two-Tab Navigation Bar */}
        <nav
          role="tablist"
          aria-label="Main navigation tabs"
          className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800"
        >
          <button
            role="tab"
            id="tab-simulator"
            aria-selected={activeTab === 'simulator'}
            aria-controls="panel-simulator"
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg border-b-2 transition-all ${
              activeTab === 'simulator'
                ? 'border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 shadow-sm'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Tab 1: DFA Simulator</span>
          </button>

          <button
            role="tab"
            id="tab-inventory"
            aria-selected={activeTab === 'inventory'}
            aria-controls="panel-inventory"
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg border-b-2 transition-all ${
              activeTab === 'inventory'
                ? 'border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 shadow-sm'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Tab 2: Inventory Catalog ({products.length})</span>
          </button>
        </nav>

        {/* ========================================================================= */}
        {/* TAB 1: DFA SIMULATOR & AUDIT HISTORY                                       */}
        {/* ========================================================================= */}
        {activeTab === 'simulator' && (
          <div id="panel-simulator" role="tabpanel" aria-labelledby="tab-simulator" className="space-y-6">

            {/* Simulator Interactive Workbench Card */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-5 shadow-sm">
              
              {/* 1. Input Section */}
              <div className="space-y-2">
                <label
                  htmlFor="serial-input"
                  className="block text-xs font-mono font-medium text-slate-600 dark:text-slate-400"
                >
                  Serial Code Input
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    id="serial-input"
                    type="text"
                    value={inputCode}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="e.g. IT-2026-001"
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-slate-500 dark:focus:border-slate-500 rounded-lg px-4 py-2.5 font-mono text-base sm:text-lg text-slate-900 dark:text-slate-100 uppercase tracking-widest outline-none transition-colors"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleValidate}
                      className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-semibold rounded-lg shadow-sm transition-colors"
                    >
                      Validate
                    </button>
                    <button
                      type="button"
                      onClick={handleClear}
                      className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Quick Test Presets (Matching Python Style) */}
              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                <span className="block text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400">
                  Quick Test Presets
                </span>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleRunPreset(preset.code)}
                      className="px-3.5 py-1.5 text-xs font-mono font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 active:scale-95 shadow-sm transition-all"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Status Banner */}
              <div
                className={`p-4 rounded-xl border font-mono text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors ${
                  dfa.isValid
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {dfa.isValid ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
                  )}
                  <span className="font-semibold text-xs sm:text-sm">
                    {dfa.isValid
                      ? 'ACCEPTED (State: q11) — Valid Serial Code'
                      : `REJECTED (State: ${dfa.finalState}) — ${dfa.errorReason || 'Input rejected'}`}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs opacity-80 self-end sm:self-auto font-semibold">
                  <span>Progress:</span>
                  <span className="px-2 py-0.5 rounded bg-white/50 dark:bg-slate-900/50 border border-current">
                    {inputCode.length}/11
                  </span>
                </div>
              </div>

              {/* 4. Connected Transition Tape with Sequential Animation */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
                    Connected Transition Tape
                  </span>
                  {animatingStep !== null && (
                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Sequential Stepper Active (Step {animatingStep + 1}/{dfa.trace.length})
                    </span>
                  )}
                </div>

                {dfa.trace.length === 0 ? (
                  <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center font-mono text-xs text-slate-400 dark:text-slate-500">
                    Empty string ε — Enter a serial code to initiate state transitions.
                  </div>
                ) : (
                  <div className="overflow-x-auto pb-4 pt-1">
                    <div className="inline-flex items-center min-w-full">
                      {dfa.trace.map((t, index) => {
                        const isError = t.status === 'error';
                        const isCurrentAnim = animatingStep !== null && animatingStep === index;
                        const isFutureAnim = animatingStep !== null && index > animatingStep;

                        return (
                          <React.Fragment key={t.step}>
                            {/* Step Node */}
                            <div
                              className={`flex flex-col items-center rounded-xl p-3 border font-mono transition-all duration-150 shrink-0 w-28 ${
                                isFutureAnim
                                  ? 'opacity-35 scale-95'
                                  : isCurrentAnim
                                  ? 'scale-105 shadow-md ring-2 ring-emerald-500 dark:ring-emerald-400'
                                  : 'opacity-100'
                              } ${
                                isError
                                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-700 dark:text-rose-300'
                                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              {/* Step Index & Domain */}
                              <div className="flex items-center justify-between w-full mb-1.5">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                  #{t.step}
                                </span>
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getDomainStyle(
                                    t.domain,
                                    isError
                                  )}`}
                                >
                                  {t.domain}
                                </span>
                              </div>

                              {/* Consumed Symbol */}
                              <div className="my-1 text-center">
                                <span className="inline-block px-2.5 py-0.5 rounded-md font-mono text-base font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs">
                                  {t.symbol}
                                </span>
                              </div>

                              {/* State Transition */}
                              <div className="mt-1 text-[11px] font-semibold flex items-center justify-center gap-1 text-slate-600 dark:text-slate-400">
                                <span>{t.fromState}</span>
                                <ArrowRight className="w-2.5 h-2.5 opacity-60" />
                                <span className={isError ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>
                                  {t.toState}
                                </span>
                              </div>
                            </div>

                            {/* Connector Line with Symbol to next Step */}
                            {index < dfa.trace.length - 1 && (
                              <div className="flex flex-col items-center justify-center px-1 shrink-0">
                                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mb-0.5">
                                  '{dfa.trace[index + 1].symbol}'
                                </span>
                                <div className="flex items-center text-slate-300 dark:text-slate-700">
                                  <div className="w-3 h-0.5 bg-slate-300 dark:bg-slate-700"></div>
                                  <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                                </div>
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 5. Full-Width Validation Audit Log */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-500" />
                  <h2 className="text-sm font-semibold font-mono text-slate-900 dark:text-slate-100">
                    Validation Audit Log
                  </h2>
                  <span className="text-xs font-mono text-slate-400 dark:text-slate-500 ml-1">
                    ({logs.length} entries)
                  </span>
                </div>
                {logs.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearLogs}
                    className="text-xs font-mono font-medium text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  >
                    Clear Logs
                  </button>
                )}
              </div>

              {logs.length === 0 ? (
                <div className="py-8 text-center font-mono text-xs text-slate-400 dark:text-slate-500">
                  No validation logs recorded. Validate an input or click a preset above.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                        <th className="py-2.5 px-3 font-medium">Input String</th>
                        <th className="py-2.5 px-3 font-medium">Verdict Badge</th>
                        <th className="py-2.5 px-3 font-medium">Halting State</th>
                        <th className="py-2.5 px-3 font-medium">Timestamp</th>
                        <th className="py-2.5 px-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {logs.map((log) => (
                        <tr
                          key={log.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">
                            {log.input || 'ε'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                log.isValid
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                                  : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400'
                              }`}
                            >
                              {log.isValid ? 'ACCEPTED' : 'REJECTED'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                            {log.state}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 dark:text-slate-500 text-[11px]">
                            {log.time}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleReplayLog(log.input)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Replay</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: INVENTORY CATALOG & PRODUCT REGISTRATION                           */}
        {/* ========================================================================= */}
        {activeTab === 'inventory' && (
          <div id="panel-inventory" role="tabpanel" aria-labelledby="tab-inventory" className="space-y-6">

            {/* 1. Registration Form Card */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
              <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-sm font-semibold font-mono text-slate-900 dark:text-slate-100">
                  Product Registration
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Validate serial codes against the formal DFA grammar before persisting to inventory catalog.
                </p>
              </div>

              <form onSubmit={handleRegisterProduct} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Category Selection with Full Descriptive Names */}
                  <div>
                    <label
                      htmlFor="reg-category"
                      className="block text-xs font-mono font-medium text-slate-600 dark:text-slate-400 mb-1"
                    >
                      Department Category
                    </label>
                    <select
                      id="reg-category"
                      value={regCategory}
                      onChange={(e) => {
                        const cat = e.target.value;
                        setRegCategory(cat);
                        setRegCode(generateSampleCode(cat));
                        setRegError('');
                        setRegSuccess('');
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500"
                    >
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat.code} value={cat.code}>
                          {cat.code} — {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Product Name Input */}
                  <div>
                    <label
                      htmlFor="reg-name"
                      className="block text-xs font-mono font-medium text-slate-600 dark:text-slate-400 mb-1"
                    >
                      Product Name
                    </label>
                    <input
                      id="reg-name"
                      type="text"
                      placeholder="e.g. Dell Latitude 7420"
                      value={regName}
                      onChange={(e) => {
                        setRegName(e.target.value);
                        if (regError) setRegError('');
                        if (regSuccess) setRegSuccess('');
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500"
                    />
                  </div>

                  {/* Serial Code Input */}
                  <div>
                    <label
                      htmlFor="reg-code"
                      className="block text-xs font-mono font-medium text-slate-600 dark:text-slate-400 mb-1"
                    >
                      Serial Code
                    </label>
                    <input
                      id="reg-code"
                      type="text"
                      placeholder="e.g. IT-2026-001"
                      value={regCode}
                      onChange={(e) => {
                        setRegCode(e.target.value.toUpperCase());
                        if (regError) setRegError('');
                        if (regSuccess) setRegSuccess('');
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono uppercase text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500"
                    />
                  </div>
                </div>

                {/* Inline Errors / Success Messages */}
                {regError && (
                  <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400 font-mono text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}
                {regSuccess && (
                  <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{regSuccess}</span>
                  </div>
                )}

                {/* Form Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleUseCurrentScanned}
                      className="px-3 py-1.5 text-xs font-mono font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Use Current Scanned</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateValid}
                      className="px-3 py-1.5 text-xs font-mono font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Valid</span>
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-mono font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors"
                  >
                    Register Product
                  </button>
                </div>
              </form>
            </section>

            {/* 2. Full-Width Product Inventory Data Table */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-slate-500" />
                  <h2 className="text-sm font-semibold font-mono text-slate-900 dark:text-slate-100">
                    Product Inventory Catalog
                  </h2>
                  <span className="text-xs font-mono text-slate-400 dark:text-slate-500 ml-1">
                    ({products.length} registered)
                  </span>
                </div>
              </div>

              {products.length === 0 ? (
                <div className="py-10 text-center font-mono text-xs text-slate-400 dark:text-slate-500">
                  No products in catalog. Register an item above.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                        <th className="py-2.5 px-3 font-medium">Category</th>
                        <th className="py-2.5 px-3 font-medium">Product Code</th>
                        <th className="py-2.5 px-3 font-medium font-sans">Product Name</th>
                        <th className="py-2.5 px-3 font-medium">Registered Date</th>
                        <th className="py-2.5 px-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {products.map((product) => (
                        <tr
                          key={product.code}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-2.5 px-3">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold border bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                              {product.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">
                            {product.code}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-sans">
                            {product.name}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 dark:text-slate-500 text-[11px]">
                            {product.registeredDate || 'N/A'}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(product.code)}
                              aria-label={`Delete ${product.code}`}
                              className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
