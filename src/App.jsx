import { useState, useEffect, useMemo, useRef } from 'react';
import { Sun, Moon, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { validateProductCode, generateSampleCode } from './core/dfaEngine';
import { getProducts, saveProduct, deleteProduct, getLogs, saveValidationLog, clearLogs, getTheme, setTheme } from './services/storage';

const PRESETS = [
  { label: 'VALID CODE', val: 'IT-2026-001' },
  { label: 'PREFIX ERROR', val: '1T-2026-001' },
  { label: 'YEAR ERROR', val: 'IT-202-001' },
  { label: 'DASH ERROR', val: 'IT2026-001' },
  { label: 'ALPHABET ERROR', val: 'IT#2026-001' }
];

const CATEGORIES = [
  { id: 'IT', name: 'Information Technology' },
  { id: 'EL', name: 'Electronics & Appliances' },
  { id: 'PR', name: 'Printing & Publishing' },
  { id: 'NW', name: 'Networking Equipment' },
  { id: 'OF', name: 'Office Furniture & Supplies' }
];


const STATUS_CLS = {
  ok: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
  err: 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400'
};
const INP_CLS = "w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs outline-none focus:border-slate-500 text-slate-900 dark:text-slate-100";
const LBL_CLS = "block text-xs font-mono font-medium text-slate-600 dark:text-slate-400 mb-1";
const CARD_CLS = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-6 space-y-4 shadow-sm";

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

const Table = ({ headers, rows, emptyMsg }) => !rows.length ? (
  <div className="py-8 text-center font-mono text-xs text-slate-400 dark:text-slate-500">{emptyMsg}</div>
) : (
  <div className="overflow-x-auto">
    <table className="w-full text-left font-mono text-xs border-collapse">
      <thead><tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">{headers.map((h, i) => <th key={i} className={`py-2.5 px-3 font-medium whitespace-nowrap ${h.cls || ''}`}>{h.title || h}</th>)}</tr></thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">{rows.map((r, i) => <tr key={r.key || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">{r.cells.map((c, j) => <td key={j} className={`py-2.5 px-3 ${c.cls || ''}`}>{c.val}</td>)}</tr>)}</tbody>
    </table>
  </div>
);

export default function App() {
  const [theme, setThemeState] = useState(() => getTheme());
  const [activeTab, setActiveTab] = useState('simulator');
  const [input, setInput] = useState('IT-2026-001');
  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logLimit, setLogLimit] = useState(25);
  const [catalogLimit, setCatalogLimit] = useState(25);
  const [category, setCategory] = useState('IT');
  const [productName, setProductName] = useState('');
  const [regCode, setRegCode] = useState('');
  const [activeStep, setActiveStep] = useState(null);
  const [formMsg, setFormMsg] = useState(null);
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

  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); setTheme(theme); }, [theme]);
  useEffect(() => { setProducts(getProducts()); setLogs(getLogs()); return () => clearTimer(); }, []);

  const dfa = useMemo(() => validateProductCode(input), [input]);
  const trapIndex = useMemo(() => dfa.trace.findIndex(t => t.status === 'error' || t.toState === 'q_trap'), [dfa.trace]);

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
  const displayedProducts = useMemo(() => products.slice(0, catalogLimit), [products, catalogLimit]);

  const recordLog = (code, res) => {
    setLogs(saveValidationLog({
      id: Date.now() + Math.random(), input: code, isValid: res.isValid, state: res.finalState,
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

  const handleValidate = () => { recordLog(input, dfa); runAnimation(dfa.trace, trapIndex); };
  const handleClearInput = () => { resetAnimation(); setInput(''); };

  const handleRegisterProduct = (e) => {
    e.preventDefault(); setFormMsg(null);
    if (!productName.trim()) return setFormMsg({ type: 'err', text: 'Product name is required.' });
    if (!regCode.trim()) return setFormMsg({ type: 'err', text: 'Serial code is required.' });
    const code = regCode.trim().toUpperCase(), res = validateProductCode(code);
    if (!res.isValid) return setFormMsg({ type: 'err', text: `Invalid serial code: ${res.errorReason || 'DFA rejected'}` });
    const now = new Date();
    const registeredDate = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const registeredTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const saveResult = saveProduct({ code, category, name: productName.trim(), registeredDate, registeredTime });
    if (!saveResult.success) {
      return setFormMsg({ type: 'err', text: `Serial code "${code}" already exists in the inventory.` });
    }
    setProducts(saveResult.data);
    setProductName('');
    setRegCode('');
    setFormMsg({ type: 'ok', text: `Registered "${code}" successfully!` });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-150 p-3.5 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6">
        <header className="flex items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Product Code Validator</h1>
            <p className="text-[11px] sm:text-sm font-mono text-slate-500 dark:text-slate-400 mt-0.5">M = (Q, Σ, δ, q0, F) • 13 States • |Σ| = 37</p>
          </div>
          <button onClick={() => setThemeState((p) => p === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm transition-colors shrink-0">
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </header>

        <nav role="tablist" aria-label="Main navigation tabs" className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
          {[{ id: 'simulator', label: 'DFA Simulator' }, { id: 'catalog', label: `Inventory (${products.length})` }].map((tab) => (
            <button key={tab.id} role="tab" id={`tab-${tab.id}`} aria-selected={activeTab === tab.id} aria-controls={`panel-${tab.id}`} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg border-b-2 transition-all ${activeTab === tab.id ? 'border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 shadow-sm' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}>{tab.label}</button>
          ))}
        </nav>

        {activeTab === 'simulator' && (
          <div id="panel-simulator" role="tabpanel" aria-labelledby="tab-simulator" className="space-y-5 sm:space-y-6">
            <section className={`${CARD_CLS} space-y-4 sm:space-y-5`}>
              <div className="space-y-2">
                <label htmlFor="serial-input" className={LBL_CLS}>Serial Code Input</label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input id="serial-input" type="text" value={input} onChange={(e) => { resetAnimation(); setInput(e.target.value.toUpperCase()); }} placeholder="e.g. IT-2026-001" className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-slate-500 rounded-lg px-4 py-2.5 font-mono text-base sm:text-lg text-slate-900 dark:text-slate-100 uppercase tracking-widest outline-none transition-colors" />
                  <div className="flex gap-2 sm:w-auto">
                    <button type="button" onClick={handleValidate} className="flex-[3] sm:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-semibold rounded-lg shadow-sm transition-colors">Validate</button>
                    <button type="button" onClick={handleClearInput} className="flex-[1] sm:flex-none px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">Clear</button>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                <span className="block text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400">Quick Test Presets</span>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <button key={p.label} type="button" onClick={() => handleSimulate(p.val)} className="px-3.5 py-1.5 text-xs font-mono font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 hover:border-slate-300 active:scale-95 shadow-sm transition-all">{p.label}</button>
                  ))}
                </div>
              </div>

              <div className={`p-3.5 sm:p-4 rounded-xl border font-mono text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${dfa.isValid ? STATUS_CLS.ok : STATUS_CLS.err}`}>
                <div className="flex items-center gap-2.5">
                  {dfa.isValid ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" /> : <XCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />}
                  <span className="font-semibold text-xs sm:text-sm">{dfa.isValid ? 'ACCEPTED (State: q11) — Valid Serial Code' : `REJECTED (State: ${dfa.finalState}) — ${dfa.errorReason || 'Input rejected'}`}</span>
                </div>
                <div className="flex items-center gap-2 text-xs opacity-80 self-end sm:self-auto font-semibold"><span>Progress:</span><span className="px-2 py-0.5 rounded bg-white/50 dark:bg-slate-900/50 border border-current">{input.length}/11</span></div>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">  Input Scanner </span>
                  {activeStep !== null && (
                    <span className="text-[11px] font-mono text-blue-500 dark:text-blue-400 flex items-center gap-1.5 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-blue-500" /> Inspecting Step {activeStep + 1}
                    </span>
                  )}
                </div>

                <div className="w-full overflow-x-auto pb-2 pt-1">
                  <div className="w-max min-w-full mx-auto flex flex-col items-center">
                    <div className="w-full min-w-[480px] max-w-4xl flex flex-col items-center">
                      {/* 11 Continuous Tape Cells */}
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

                      {/* State Row: q1 through q11 */}
                      <div className="grid grid-cols-11 w-full mt-2 px-0.5 text-slate-400">
                        {tapeCells.map((c, i) => (
                          <div
                            key={i}
                            className={`text-center font-mono text-[10px] sm:text-xs md:text-sm truncate transition-colors ${c.stateCls}`}
                          >
                            {c.state}
                          </div>
                        ))}
                      </div>

                      {/* Domain Row: Prefix (2 cells), -, Year (4 cells), -, Serial (3 cells) */}
                      <div className="grid grid-cols-11 w-full items-center mt-2 px-0.5 text-center">
                        <div className="col-span-2 py-1 mx-0.5 rounded border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] sm:text-xs font-semibold tracking-wider truncate">
                          PREFIX
                        </div>
                        <div className="col-span-1 text-slate-400 dark:text-slate-600 text-xs font-mono font-bold">—</div>
                        <div className="col-span-4 py-1 mx-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] sm:text-xs font-semibold tracking-wider truncate">
                          YEAR
                        </div>
                        <div className="col-span-1 text-slate-400 dark:text-slate-600 text-xs font-mono font-bold">—</div>
                        <div className="col-span-3 py-1 mx-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] sm:text-xs font-semibold tracking-wider truncate">
                          SERIAL
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
                      className="text-xs font-mono font-medium text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    >
                      Clear Logs
                    </button>
                  )}
                </div>
              </div>
              <Table emptyMsg="No validation logs recorded. Validate an input or click a preset above." headers={['Input String', 'Result', 'Final State', 'Timestamp', { title: 'Actions', cls: 'text-right' }]} rows={displayedLogs.map((l) => ({
                key: l.id, cells: [
                  { val: l.input || 'ε', cls: 'font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap' },
                  { val: <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${l.isValid ? STATUS_CLS.ok : STATUS_CLS.err}`}>{l.isValid ? 'ACCEPTED' : 'REJECTED'}</span> },
                  { val: l.state, cls: 'text-slate-600 dark:text-slate-300 whitespace-nowrap' }, { val: l.time, cls: 'text-slate-400 dark:text-slate-500 text-[11px] whitespace-nowrap' },
                  { val: <button type="button" onClick={() => handleSimulate(l.input)} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap"><RotateCcw className="w-3 h-3" /> Replay</button>, cls: 'text-right whitespace-nowrap' }
                ]
              }))} />
            </section>
          </div>
        )}

        {activeTab === 'catalog' && (
          <div id="panel-catalog" role="tabpanel" aria-labelledby="tab-catalog" className="space-y-6">
            <section className={CARD_CLS}>
              <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-sm font-semibold font-mono text-slate-900 dark:text-slate-100">Product Registration</h2><p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Verify serial numbers and add new items to your inventory.</p>
              </div>
              <form onSubmit={handleRegisterProduct} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label htmlFor="reg-category" className={LBL_CLS}>Department Category</label><select id="reg-category" value={category} onChange={(e) => { setCategory(e.target.value); setFormMsg(null); }} className={`${INP_CLS} font-mono`}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.id} — {c.name}</option>)}</select></div>
                  <div><label htmlFor="reg-name" className={LBL_CLS}>Product Name</label><input id="reg-name" type="text" placeholder="e.g. Dell Latitude 7420" value={productName} onChange={(e) => { setProductName(e.target.value); setFormMsg(null); }} className={INP_CLS} /></div>
                  <div><label htmlFor="reg-code" className={LBL_CLS}>Serial Code</label><input id="reg-code" type="text" placeholder="e.g. IT-2026-001" value={regCode} onChange={(e) => { setRegCode(e.target.value.toUpperCase()); setFormMsg(null); }} className={`${INP_CLS} font-mono uppercase`} /></div>
                </div>
                {formMsg && (
                  <div className={`p-3 rounded-lg border font-mono text-xs flex items-center gap-2 ${STATUS_CLS[formMsg.type]}`}>
                    {formMsg.type === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" /> : <XCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />}
                    <span>{formMsg.text}</span>
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <button type="button" onClick={() => { setRegCode(generateSampleCode(category)); setFormMsg(null); }} className="px-3 py-1.5 text-xs font-mono font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors">Generate Code</button>
                  <button type="submit" className="px-5 py-2 text-xs font-mono font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors">Register Product</button>
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
                <LimitSelector id="catalog-limit" value={catalogLimit} onChange={(e) => setCatalogLimit(Number(e.target.value))} />
              </div>
              <Table emptyMsg="No products in catalog. Register an item above." headers={['Category', 'Product Code', { title: 'Product Name', cls: 'font-sans' }, 'Registered Date', { title: 'Actions', cls: 'text-right' }]} rows={displayedProducts.map((p) => ({
                key: p.code, cells: [
                  { val: <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold border bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700">{p.category}</span> },
                  { val: p.code, cls: 'font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap' }, { val: p.name, cls: 'text-slate-700 dark:text-slate-300 font-sans min-w-[140px]' },
                  {
                    val: (
                      <span className="whitespace-nowrap text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                        {p.registeredDate || 'N/A'}{p.registeredTime ? ` ${p.registeredTime}` : ''}
                      </span>
                    ), cls: 'text-slate-400 dark:text-slate-500'
                  },
                  {
                    val: (
                      <div className="flex items-center justify-end gap-3 font-mono text-xs whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleSimulate(p.code)}
                          aria-label={`Scan ${p.code}`}
                          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 font-medium transition-colors"
                        >
                          Scan
                        </button>
                        <button
                          type="button"
                          onClick={() => setProducts(deleteProduct(p.code))}
                          aria-label={`Delete ${p.code}`}
                          className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    ), cls: 'text-right whitespace-nowrap'
                  }
                ]
              }))} />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
