import { useState, useEffect, useMemo, useRef } from 'react';
import { Sun, Moon, CheckCircle2, XCircle, RotateCcw, AlertCircle, PlusCircle } from 'lucide-react';
import { validateProductCode, generateSampleCode } from './core/dfaEngine';
import { resolveProductMetadata } from './core/productResolver';
import DisclaimerModal from './components/DisclaimerModal';
import {
  getProducts,
  findProduct,
  saveProduct,
  deleteProduct,
  getLogs,
  saveValidationLog,
  clearLogs,
  getTheme,
  setTheme,
  isDisclaimerAcknowledged,
  setDisclaimerAcknowledged
} from './services/storage';

const PRESETS = [
  { label: 'VALID CODE', val: 'IT-2026-001' },
  { label: 'PREFIX ERROR', val: '1T-2026-001' },
  { label: 'YEAR ERROR', val: 'IT-202-001' },
  { label: 'DASH ERROR', val: 'IT2026-001' },
  { label: 'ALPHABET ERROR', val: 'IT#2026-001' }
];

const CATEGORY_OPTIONS = [
  { prefix: 'IT', label: 'Information Technology (IT)' },
  { prefix: 'EL', label: 'Electronics & Power (EL)' },
  { prefix: 'OF', label: 'Office Furniture (OF)' },
  { prefix: 'NW', label: 'Network Infrastructure (NW)' },
  { prefix: 'PR', label: 'Peripherals & Accessories (PR)' }
];

const STATUS_CLS = {
  ok: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
  err: 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400'
};
const CARD_CLS = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-6 space-y-4 shadow-sm";
const INP_CLS = "w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs outline-none focus:border-slate-500 text-slate-900 dark:text-slate-100";
const LBL_CLS = "block text-xs font-mono font-medium text-slate-600 dark:text-slate-400 mb-1";

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const LimitSelector = ({ id, value, onChange }) => (
  <div className="flex items-center gap-1.5 font-mono text-xs text-slate-500 dark:text-slate-400">
    <label htmlFor={id} className="font-medium text-[11px]">Show:</label>
    <select
      id={id}
      value={value}
      onChange={onChange}
      aria-label="Show entries limit"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-colors cursor-pointer shadow-sm"
    >
      {[25, 50, 75, 100].map((v) => <option key={v} value={v}>{v}</option>)}
    </select>
  </div>
);

export default function App() {
  const [theme, setThemeState] = useState(() => getTheme());
  const [activeTab, setActiveTab] = useState('simulator');
  const [input, setInput] = useState('IT-2026-001');
  const [products, setProducts] = useState(() => getProducts());
  const [logs, setLogs] = useState(() => getLogs());
  const [logLimit, setLogLimit] = useState(25);
  const [catalogLimit, setCatalogLimit] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStep, setActiveStep] = useState(null);
  const [regCode, setRegCode] = useState('');
  const [productName, setProductName] = useState('');
  const [formMsg, setFormMsg] = useState(null);
  const [showDisclaimer, setShowDisclaimer] = useState(() => !isDisclaimerAcknowledged());
  const timerRef = useRef(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const resetAnimation = () => {
    clearTimer();
    setActiveStep(null);
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    setTheme(theme);
  }, [theme]);

  useEffect(() => clearTimer, []);

  const dfa = useMemo(() => validateProductCode(input), [input]);
  const trapIndex = useMemo(
    () => dfa.trace.findIndex(t => t.status === 'error' || t.toState === 'q_trap'),
    [dfa.trace]
  );
  const isSyntaxValid = dfa.isAccepted && dfa.finalState === 'q11';

  const catalogMatch = useMemo(
    () => (isSyntaxValid ? findProduct(input) : null),
    [input, isSyntaxValid, products]
  );

  const regDfa = useMemo(() => validateProductCode(regCode), [regCode]);
  const regResolved = useMemo(
    () => (regDfa.isAccepted ? resolveProductMetadata(regCode) : null),
    [regCode, regDfa.isAccepted]
  );

  const currentPrefix = regCode.slice(0, 2).toUpperCase();
  const isKnownPrefix = CATEGORY_OPTIONS.some((c) => c.prefix === currentPrefix);
  const isCustomPrefix = !isKnownPrefix && /^[A-Z]{2}$/.test(currentPrefix);
  const selectedCategoryValue = isKnownPrefix || isCustomPrefix ? currentPrefix : '';

  const isRegDuplicate = useMemo(
    () => Boolean(regCode.trim() && findProduct(regCode)),
    [regCode, products]
  );

  const isRegisterButtonActive = regDfa.isAccepted && !isRegDuplicate && Boolean(productName.trim());

  const tapeCells = useMemo(() => Array.from({ length: 11 }, (_, i) => {
    const char = input[i] || '·';
    const isTrap = trapIndex !== -1 && i === trapIndex && (activeStep === null || activeStep >= i);
    const isActive = activeStep === i;
    const isUnreached = (trapIndex !== -1 && i > trapIndex) || (activeStep !== null && i > activeStep) || i >= dfa.trace.length;
    const isDone = !isTrap && !isActive && !isUnreached;

    return {
      char,
      state: isTrap ? 'q_trap' : isUnreached ? '·' : (dfa.trace[i]?.toState || '·'),
      cellCls: isTrap
        ? 'bg-rose-500/20 text-rose-500 border-rose-500 font-bold ring-1 ring-inset ring-rose-500'
        : isActive
          ? 'bg-blue-500/20 text-blue-400 dark:text-blue-300 ring-1 ring-inset ring-blue-500'
          : isDone
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold'
            : 'opacity-40 text-slate-400 dark:text-slate-600',
      stateCls: isTrap
        ? 'text-rose-500 font-bold'
        : isUnreached
          ? 'text-slate-400/40 dark:text-slate-600'
          : 'text-slate-500 dark:text-slate-400'
    };
  }), [input, trapIndex, activeStep, dfa.trace]);

  const runAnimation = (trace, trapIdx = trapIndex) => {
    clearTimer();
    if (!trace?.length) return setActiveStep(null);
    const targetEnd = Math.min(10, trapIdx !== -1 ? trapIdx : trace.length - 1);
    setActiveStep(0);
    if (targetEnd === 0) {
      timerRef.current = setTimeout(() => setActiveStep(null), 350);
      return;
    }
    let step = 0;
    timerRef.current = setInterval(() => {
      step++;
      if (step >= targetEnd) {
        setActiveStep(targetEnd);
        clearTimer();
        timerRef.current = setTimeout(() => setActiveStep(null), 350);
      } else {
        setActiveStep(step);
      }
    }, 45);
  };

  const displayedLogs = useMemo(() => logs.slice(0, logLimit), [logs, logLimit]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p =>
      (p?.name && p.name.toLowerCase().includes(q)) ||
      (p?.code && p.code.toLowerCase().includes(q)) ||
      (p?.category && p.category.toLowerCase().includes(q)) ||
      (p?.year && String(p.year).toLowerCase().includes(q))
    );
  }, [products, searchQuery]);

  const displayedProducts = useMemo(() => filteredProducts.slice(0, catalogLimit), [filteredProducts, catalogLimit]);

  const recordLog = (code, res) => {
    setLogs(saveValidationLog({
      id: Date.now() + Math.random(),
      input: code,
      isValid: res.isValid,
      state: res.finalState,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }));
  };

  const handleSimulate = (code) => {
    setActiveTab('simulator');
    setInput(code);
    const res = validateProductCode(code);
    const tIdx = res.trace.findIndex(t => t.status === 'error' || t.toState === 'q_trap');
    recordLog(code, res);
    runAnimation(res.trace, tIdx);
  };

  const handleValidate = () => {
    recordLog(input, dfa);
    runAnimation(dfa.trace, trapIndex);
  };

  const handleCategoryChange = (e) => {
    const p = e.target.value;
    if (!p) return;
    setFormMsg(null);
    setRegCode(regCode.length >= 2 ? p + regCode.slice(2) : `${p}-`);
  };

  const handleRegisterProduct = (e) => {
    e.preventDefault();
    setFormMsg(null);
    if (!regDfa.isAccepted || regDfa.finalState !== 'q11') {
      return setFormMsg({ type: 'err', text: `Invalid Product Code: ${regDfa.errorReason || 'DFA rejected'}` });
    }
    if (isRegDuplicate) {
      return setFormMsg({ type: 'err', text: `Product Code "${regCode}" already exists in the inventory.` });
    }
    if (!productName.trim()) {
      return setFormMsg({ type: 'err', text: 'Product name cannot be empty.' });
    }

    const saveResult = saveProduct({
      code: regCode,
      name: productName.trim(),
      category: regResolved?.category || 'Unassigned Category',
      year: regResolved?.year || ''
    });

    if (!saveResult.success) {
      return setFormMsg({ type: 'err', text: `Duplicate code: "${regCode}" is already in inventory.` });
    }

    setProducts(saveResult.data);
    setFormMsg({ type: 'ok', text: `Registered "${regCode.toUpperCase()}" successfully!` });
    setRegCode('');
    setProductName('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-150 p-3.5 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6">
        <header className="flex items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Product Code Validator</h1>
            <p className="text-[11px] sm:text-sm font-mono text-slate-500 dark:text-slate-400 mt-0.5">M = (Q, Σ, δ, q0, F) • 13 States • |Σ| = 37</p>
          </div>
          <button
            type="button"
            onClick={() => setThemeState((p) => p === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm transition-colors shrink-0 cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </header>

        <nav role="tablist" aria-label="Main navigation tabs" className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
          {[
            { id: 'simulator', label: 'DFA Simulator' },
            { id: 'catalog', label: `Inventory (${products.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg border-b-2 transition-all cursor-pointer ${activeTab === tab.id
                ? 'border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 shadow-sm'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'simulator' && (
          <div id="panel-simulator" role="tabpanel" aria-labelledby="tab-simulator" className="space-y-5 sm:space-y-6">
            <section className={`${CARD_CLS} space-y-4 sm:space-y-5`}>
              <div className="space-y-2">
                <label htmlFor="serial-input" className={LBL_CLS}>Product Code Input</label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    id="serial-input"
                    type="text"
                    value={input}
                    onChange={(e) => { resetAnimation(); setInput(e.target.value); }}
                    placeholder="e.g. IT-2026-001"
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-slate-500 rounded-lg px-4 py-2.5 font-mono text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-widest outline-none transition-colors"
                  />
                  <div className="flex gap-2 sm:w-auto">
                    <button type="button" onClick={handleValidate} className="flex-[3] sm:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer">Validate</button>
                    <button type="button" onClick={() => { resetAnimation(); setInput(''); }} className="flex-[1] sm:flex-none px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer">Clear</button>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                <span className="block text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400">Quick Test Presets</span>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <button key={p.label} type="button" onClick={() => handleSimulate(p.val)} className="px-3.5 py-1.5 text-xs font-mono font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 hover:border-slate-300 active:scale-95 shadow-sm transition-all cursor-pointer">{p.label}</button>
                  ))}
                  <button type="button" onClick={() => handleSimulate(generateSampleCode())} className="px-3.5 py-1.5 text-xs font-mono font-semibold rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 active:scale-95 shadow-sm transition-all cursor-pointer">Sample Code</button>
                </div>
              </div>

              <div className={`p-3.5 sm:p-4 rounded-xl border font-mono text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${dfa.isValid ? STATUS_CLS.ok : STATUS_CLS.err}`}>
                <div className="flex items-center gap-2.5">
                  {dfa.isValid ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" /> : <XCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />}
                  <span className="font-semibold text-xs sm:text-sm">{dfa.isValid ? 'ACCEPTED (State: q11) — Valid Product Code' : `REJECTED (State: ${dfa.finalState}) — ${dfa.errorReason || 'Input rejected'}`}</span>
                </div>
                <div className="flex items-center gap-2 text-xs opacity-80 self-end sm:self-auto font-semibold"><span>Progress:</span><span className="px-2 py-0.5 rounded bg-white/50 dark:bg-slate-900/50 border border-current">{input.length}/11</span></div>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">Read Tape (11 Cells)</span>
                  {activeStep !== null && (
                    <span className="text-[11px] font-mono text-blue-500 dark:text-blue-400 flex items-center gap-1.5 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-blue-500" /> Step {activeStep + 1}
                    </span>
                  )}
                </div>

                <div className="w-full overflow-x-auto pb-2 pt-1">
                  <div className="w-max min-w-full mx-auto flex flex-col items-center">
                    <div className="w-full min-w-[480px] max-w-4xl flex flex-col items-center">
                      <div className="flex w-full rounded-xl border border-slate-300 dark:border-slate-700 divide-x divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900/90 shadow-md overflow-hidden">
                        {tapeCells.map((c, i) => (
                          <div
                            key={i}
                            className={`flex-1 min-w-0 h-12 sm:h-18 md:h-22 flex items-center justify-center font-mono text-base sm:text-2xl md:text-3xl font-bold transition-colors ${c.cellCls}`}
                          >
                            {c.char}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-11 w-full mt-2 px-0.5 text-slate-400">
                        {tapeCells.map((c, i) => (
                          <div key={i} className={`text-center font-mono text-[10px] sm:text-xs md:text-sm truncate transition-colors ${c.stateCls}`}>
                            {c.state}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-11 w-full items-center mt-2 px-0.5 text-center">
                        <div className="col-span-2 py-1 mx-0.5 rounded border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] sm:text-xs font-semibold tracking-wider truncate">PREFIX</div>
                        <div className="col-span-1 text-slate-400 dark:text-slate-600 text-xs font-mono font-bold">—</div>
                        <div className="col-span-4 py-1 mx-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] sm:text-xs font-semibold tracking-wider truncate">YEAR</div>
                        <div className="col-span-1 text-slate-400 dark:text-slate-600 text-xs font-mono font-bold">—</div>
                        <div className="col-span-3 py-1 mx-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] sm:text-xs font-semibold tracking-wider truncate">SERIAL</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {isSyntaxValid && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">Product Status</span>
                    {catalogMatch ? (
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified in Inventory
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" /> Valid Format — Not in Catalog
                      </span>
                    )}
                  </div>

                  {catalogMatch ? (
                    <div className="p-4 sm:p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            {catalogMatch.category}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                            Created: {formatDate(catalogMatch.addedAt)}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                            Year: {catalogMatch.year}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">{catalogMatch.name}</h3>
                        <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                          Product Code: <span className="font-semibold text-slate-700 dark:text-slate-300">{catalogMatch.code}</span>
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveTab('catalog')}
                          className="w-full sm:w-auto px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-mono text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                        >
                          View in Inventory
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 sm:p-5 rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5 min-w-0">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">Product Not Found</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400">This product code follows a valid format, but no product record exists in the inventory yet.</p>
                        <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                          Product Code: <span className="font-semibold text-slate-700 dark:text-slate-300">{input}</span>
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('catalog');
                            setRegCode(input);
                            setFormMsg(null);
                          }}
                          className="w-full sm:w-auto px-5 py-2 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-mono text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Register This Product</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className={CARD_CLS}>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold font-mono text-slate-900 dark:text-slate-100">Validation History</h2>
                  <span className="text-xs font-mono text-slate-400 dark:text-slate-500 ml-1">
                    ({displayedLogs.length} of {logs.length} entries)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <LimitSelector id="log-limit" value={logLimit} onChange={(e) => setLogLimit(Number(e.target.value))} />
                  {logs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setLogs(clearLogs())}
                      className="text-xs font-mono font-medium text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      Clear Logs
                    </button>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                      <th className="py-2.5 px-3 font-medium whitespace-nowrap">Input String</th>
                      <th className="py-2.5 px-3 font-medium whitespace-nowrap">Result</th>
                      <th className="py-2.5 px-3 font-medium whitespace-nowrap">Final State</th>
                      <th className="py-2.5 px-3 font-medium whitespace-nowrap">Timestamp</th>
                      <th className="py-2.5 px-3 font-medium whitespace-nowrap text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {!displayedLogs.length ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center font-mono text-xs text-slate-400 dark:text-slate-500">
                          No validation logs recorded. Validate an input or click a preset above.
                        </td>
                      </tr>
                    ) : (
                      displayedLogs.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap font-mono">{l.input || 'ε'}</td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${l.isValid ? STATUS_CLS.ok : STATUS_CLS.err}`}>
                              {l.isValid ? 'ACCEPTED' : 'REJECTED'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap font-mono">{l.state}</td>
                          <td className="py-2.5 px-3 text-slate-400 dark:text-slate-500 text-[11px] whitespace-nowrap">{l.time}</td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleSimulate(l.input)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" /> Replay
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'catalog' && (
          <div id="panel-catalog" role="tabpanel" aria-labelledby="tab-catalog" className="space-y-6">
            <section className={CARD_CLS}>
              <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-sm font-semibold font-mono text-slate-900 dark:text-slate-100">Product Registration</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Verify serial codes and register new items into the catalog.</p>
              </div>
              <form onSubmit={handleRegisterProduct} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="reg-code" className={LBL_CLS}>Product Code</label>
                    <input
                      id="reg-code"
                      type="text"
                      placeholder="e.g. IT-2026-004"
                      value={regCode}
                      onChange={(e) => { setRegCode(e.target.value); setFormMsg(null); }}
                      className={`${INP_CLS} font-mono`}
                    />
                    {regCode.length > 0 && !regDfa.isAccepted && (
                      <p className="text-[11px] font-mono text-rose-600 dark:text-rose-400 mt-1.5 flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{regDfa.errorReason || 'Invalid code format (rejected by DFA)'}</span>
                      </p>
                    )}
                    {regCode.length > 0 && regDfa.isAccepted && isRegDuplicate && (
                      <p className="text-[11px] font-mono text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1.5">
                        <span>Product code already registered in inventory.</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="reg-name" className={LBL_CLS}>Product Name</label>
                    <input
                      id="reg-name"
                      type="text"
                      placeholder="e.g. Enterprise Workstation"
                      value={productName}
                      onChange={(e) => { setProductName(e.target.value); setFormMsg(null); }}
                      className={INP_CLS}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="reg-category" className={LBL_CLS}>Category</label>
                    <select
                      id="reg-category"
                      value={selectedCategoryValue}
                      onChange={handleCategoryChange}
                      aria-label="Category Selection"
                      className={`${INP_CLS} font-mono cursor-pointer`}
                    >
                      <option value="" disabled>Select Category...</option>
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c.prefix} value={c.prefix}>{c.label}</option>
                      ))}
                      {isCustomPrefix && (
                        <option value={currentPrefix}>Unassigned Category ({currentPrefix})</option>
                      )}
                    </select>
                    <p className="text-[10px] font-mono text-slate-400 mt-1">Selecting a category updates the 2-letter prefix in the code.</p>
                  </div>

                  <div>
                    <label className={LBL_CLS}>Manufacturing Year</label>
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono min-h-[34px] flex items-center justify-between text-slate-700 dark:text-slate-200">
                      <span>{regResolved ? regResolved.year : '—'}</span>
                      {regResolved && <span className="text-[10px] text-slate-400">Serial: {regResolved.serial}</span>}
                    </div>
                  </div>
                </div>

                {formMsg && (
                  <div className={`p-3 rounded-lg border font-mono text-xs flex items-center gap-2 ${STATUS_CLS[formMsg.type]}`}>
                    {formMsg.type === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" /> : <XCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />}
                    <span>{formMsg.text}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setRegCode(generateSampleCode()); setFormMsg(null); }}
                    className="px-3 py-1.5 text-xs font-mono font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    Generate Code
                  </button>

                  <button
                    type="submit"
                    disabled={!isRegisterButtonActive}
                    className={`px-5 py-2 text-xs font-mono font-semibold rounded-lg shadow-sm transition-all ${isRegisterButtonActive
                      ? 'bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white cursor-pointer'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                      }`}
                  >
                    Register Product
                  </button>
                </div>
              </form>
            </section>

            <section className={CARD_CLS}>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold font-mono text-slate-900 dark:text-slate-100">Product Inventory</h2>
                  <span className="text-xs font-mono text-slate-400 dark:text-slate-500 ml-1">
                    ({displayedProducts.length} of {products.length} registered)
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <input
                    type="text"
                    placeholder="Search by code, name, category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search catalog by name or code"
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-colors shadow-sm w-44 sm:w-56"
                  />
                  <LimitSelector id="catalog-limit" value={catalogLimit} onChange={(e) => setCatalogLimit(Number(e.target.value))} />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                      <th className="py-2.5 px-3 font-medium whitespace-nowrap">Product Code</th>
                      <th className="py-2.5 px-3 font-medium whitespace-nowrap font-sans">Product Name</th>
                      <th className="py-2.5 px-3 font-medium whitespace-nowrap">Category</th>
                      <th className="py-2.5 px-3 font-medium whitespace-nowrap">Manufacturing Year</th>
                      <th className="py-2.5 px-3 font-medium whitespace-nowrap">Date Added</th>
                      <th className="py-2.5 px-3 font-medium whitespace-nowrap text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {!displayedProducts.length ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center font-mono text-xs text-slate-400 dark:text-slate-500">
                          No products in catalog. Register an item above.
                        </td>
                      </tr>
                    ) : (
                      displayedProducts.map((p) => (
                        <tr key={p.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap font-mono">{p.code}</td>
                          <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 font-sans font-medium min-w-[140px]">{p.name}</td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                              {p.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-mono text-xs whitespace-nowrap">{p.year}</td>
                          <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap font-mono">{formatDate(p.addedAt)}</td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-3 font-mono text-xs">
                              <button
                                type="button"
                                onClick={() => handleSimulate(p.code)}
                                aria-label={`Inspect ${p.code}`}
                                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 font-medium transition-colors cursor-pointer"
                              >
                                Inspect
                              </button>
                              <button
                                type="button"
                                onClick={() => setProducts(deleteProduct(p.code))}
                                aria-label={`Delete ${p.code}`}
                                className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-medium transition-colors cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        <footer className="pt-6 pb-2 border-t border-slate-200 dark:border-slate-800/80 text-center space-y-2 text-xs font-mono text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] sm:text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              CCAUTOMA — Academic Demonstration Prototype
            </span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
            <span>Automata Theory & Formal Languages </span>
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span>For requirement specification and educational evaluation only. Not a production system.</span>
            <span>•</span>
            <button
              type="button"
              onClick={() => setShowDisclaimer(true)}
              className="text-emerald-600 dark:text-emerald-400 hover:underline underline-offset-2 font-medium cursor-pointer transition-colors"
            >
              Disclaimer
            </button>
          </div>
        </footer>
      </div>

      <DisclaimerModal
        isOpen={showDisclaimer}
        onAcknowledge={() => {
          setDisclaimerAcknowledged(true);
          setShowDisclaimer(false);
        }}
      />
    </div>
  );
}
