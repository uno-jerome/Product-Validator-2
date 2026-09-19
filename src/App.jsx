import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sun, Moon, CheckCircle2, XCircle, RotateCcw, Trash2, ArrowRight } from 'lucide-react';
import { validateProductCode, generateSampleCode } from './core/dfaEngine';
import { getProducts, saveProduct, deleteProduct, getLogs, saveLog, clearLogs, getTheme, setTheme } from './services/storage';

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

const DOMAINS = {
  Prefix: 'bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
  Delimiter: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  Year: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  Serial: 'bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800'
};
const getDomainStyle = (d, err) => err ? 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800' : (DOMAINS[d] || 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700');

const Table = ({ headers, rows, emptyMsg }) => !rows.length ? (
  <div className="py-8 text-center font-mono text-xs text-slate-400 dark:text-slate-500">{emptyMsg}</div>
) : (
  <div className="overflow-x-auto">
    <table className="w-full text-left font-mono text-xs border-collapse">
      <thead><tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">{headers.map((h, i) => <th key={i} className={`py-2.5 px-3 font-medium ${h.cls || ''}`}>{h.title || h}</th>)}</tr></thead>
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
  const [category, setCategory] = useState('IT');
  const [productName, setProductName] = useState('');
  const [animatedStep, setAnimatedStep] = useState(-1);
  const [formMsg, setFormMsg] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); setTheme(theme); }, [theme]);
  useEffect(() => { setProducts(getProducts()); setLogs(getLogs()); return () => clearInterval(timerRef.current); }, []);

  const dfa = useMemo(() => validateProductCode(input), [input]);

  const runAnimation = (trace) => {
    clearInterval(timerRef.current);
    if (!trace?.length) return setAnimatedStep(-1);
    setAnimatedStep(0);
    let step = 0;
    timerRef.current = setInterval(() => {
      step++;
      if (step >= trace.length) { clearInterval(timerRef.current); setTimeout(() => setAnimatedStep(-1), 350); }
      else setAnimatedStep(step);
    }, 40);
  };

  const recordLog = (code, res) => setLogs(saveLog({
    id: Date.now() + Math.random(), input: code, isValid: res.isValid, state: res.finalState,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }));

  const handleValidate = () => { recordLog(input, dfa); runAnimation(dfa.trace); };
  const handleRunPreset = (val) => { setInput(val); const res = validateProductCode(val); recordLog(val, res); runAnimation(res.trace); };
  const handleReplayLog = (code) => { setActiveTab('simulator'); setInput(code); const res = validateProductCode(code); recordLog(code, res); runAnimation(res.trace); };

  const handleRegisterProduct = (e) => {
    e.preventDefault(); setFormMsg(null);
    if (!productName.trim()) return setFormMsg({ type: 'err', text: 'Product name is required.' });
    const code = input.trim().toUpperCase(), res = validateProductCode(code);
    if (!res.isValid) return setFormMsg({ type: 'err', text: `Invalid serial code: ${res.errorReason || 'DFA rejected'}` });
    const registeredDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    setProducts(saveProduct({ code, category, name: productName.trim(), registeredDate }));
    setProductName(''); setFormMsg({ type: 'ok', text: `Registered "${code}" successfully!` }); setInput(generateSampleCode(category));
  };

  const btnSec = "px-3 py-1.5 text-xs font-mono font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors";
  const inCls = "w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs outline-none focus:border-slate-500 text-slate-900 dark:text-slate-100";
  const lblCls = "block text-xs font-mono font-medium text-slate-600 dark:text-slate-400 mb-1";
  const cardCls = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-4 shadow-sm";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-150 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div><h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">DFA Product Code Validator</h1><p className="text-xs sm:text-sm font-mono text-slate-500 dark:text-slate-400 mt-1">M = (Q, Σ, δ, q0, F) • 13 States • |Σ| = 37</p></div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full text-xs font-mono font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 shadow-sm">CCAUTOMA Project</div>
            <button onClick={() => setThemeState((p) => p === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme" className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm transition-colors">
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}<span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </header>

        <nav role="tablist" aria-label="Main navigation tabs" className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
          {[{ id: 'simulator', label: 'DFA Simulator' }, { id: 'catalog', label: `Inventory Catalog (${products.length})` }].map((tab) => (
            <button key={tab.id} role="tab" id={`tab-${tab.id}`} aria-selected={activeTab === tab.id} aria-controls={`panel-${tab.id}`} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg border-b-2 transition-all ${activeTab === tab.id ? 'border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 shadow-sm' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}>{tab.label}</button>
          ))}
        </nav>

        {activeTab === 'simulator' && (
          <div id="panel-simulator" role="tabpanel" aria-labelledby="tab-simulator" className="space-y-6">
            <section className={`${cardCls} space-y-5`}>
              <div className="space-y-2">
                <label htmlFor="serial-input" className={lblCls}>Serial Code Input</label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input id="serial-input" type="text" value={input} onChange={(e) => { setAnimatedStep(-1); setInput(e.target.value.toUpperCase()); }} placeholder="e.g. IT-2026-001" className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-slate-500 rounded-lg px-4 py-2.5 font-mono text-base sm:text-lg text-slate-900 dark:text-slate-100 uppercase tracking-widest outline-none transition-colors" />
                  <div className="flex gap-2">
                    <button type="button" onClick={handleValidate} className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-semibold rounded-lg shadow-sm transition-colors">Validate</button>
                    <button type="button" onClick={() => { setAnimatedStep(-1); setInput(''); }} className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">Clear</button>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                <span className="block text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400">Quick Test Presets</span>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <button key={p.label} type="button" onClick={() => handleRunPreset(p.val)} className="px-3.5 py-1.5 text-xs font-mono font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 hover:border-slate-300 active:scale-95 shadow-sm transition-all">{p.label}</button>
                  ))}
                </div>
              </div>

              <div className={`p-4 rounded-xl border font-mono text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors ${dfa.isValid ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400'}`}>
                <div className="flex items-center gap-2.5">
                  {dfa.isValid ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" /> : <XCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />}
                  <span className="font-semibold text-xs sm:text-sm">{dfa.isValid ? 'ACCEPTED (State: q11) — Valid Serial Code' : `REJECTED (State: ${dfa.finalState}) — ${dfa.errorReason || 'Input rejected'}`}</span>
                </div>
                <div className="flex items-center gap-2 text-xs opacity-80 self-end sm:self-auto font-semibold"><span>Progress:</span><span className="px-2 py-0.5 rounded bg-white/50 dark:bg-slate-900/50 border border-current">{input.length}/11</span></div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">Connected Transition Tape</span>
                  {animatedStep >= 0 && <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-pulse"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Sequential Stepper Active (Step {animatedStep + 1}/{dfa.trace.length})</span>}
                </div>

                {!dfa.trace.length ? (
                  <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center font-mono text-xs text-slate-400 dark:text-slate-500">Empty string ε — Enter a serial code to initiate state transitions.</div>
                ) : (
                  <div className="overflow-x-auto pb-4 pt-1"><div className="inline-flex items-center min-w-full">
                    {dfa.trace.map((t, i) => (
                      <React.Fragment key={t.step}>
                        <div className={`flex flex-col items-center rounded-xl p-3 border font-mono transition-all duration-150 shrink-0 w-28 ${animatedStep >= 0 && i > animatedStep ? 'opacity-35 scale-95' : animatedStep === i ? 'scale-105 shadow-md ring-2 ring-emerald-500 dark:ring-emerald-400' : 'opacity-100'} ${t.status === 'error' ? 'bg-rose-500/10 border-rose-500/40 text-rose-700 dark:text-rose-300' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'}`}>
                          <div className="flex items-center justify-between w-full mb-1.5"><span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">#{t.step}</span><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getDomainStyle(t.domain, t.status === 'error')}`}>{t.domain}</span></div>
                          <div className="my-1 text-center"><span className="inline-block px-2.5 py-0.5 rounded-md font-mono text-base font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">{t.symbol}</span></div>
                          <div className="mt-1 text-[11px] font-semibold flex items-center justify-center gap-1 text-slate-600 dark:text-slate-400"><span>{t.fromState}</span><ArrowRight className="w-2.5 h-2.5 opacity-60" /><span className={t.status === 'error' ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>{t.toState}</span></div>
                        </div>
                        {i < dfa.trace.length - 1 && (
                          <div className="flex flex-col items-center justify-center px-1 shrink-0"><span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mb-0.5">'{dfa.trace[i + 1].symbol}'</span><div className="flex items-center text-slate-300 dark:text-slate-700"><div className="w-3 h-0.5 bg-slate-300 dark:bg-slate-700" /><ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-500" /></div></div>
                        )}
                      </React.Fragment>
                    ))}
                  </div></div>
                )}
              </div>
            </section>

            <section className={cardCls}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2"><h2 className="text-sm font-semibold font-mono text-slate-900 dark:text-slate-100">Validation Audit History</h2><span className="text-xs font-mono text-slate-400 dark:text-slate-500 ml-1">({logs.length} entries)</span></div>
                {logs.length > 0 && <button type="button" onClick={() => { clearLogs(); setLogs([]); }} className="text-xs font-mono font-medium text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors">Clear Logs</button>}
              </div>
              <Table emptyMsg="No validation logs recorded. Validate an input or click a preset above." headers={['Input String', 'Verdict Badge', 'Halting State', 'Timestamp', { title: 'Actions', cls: 'text-right' }]} rows={logs.map((l) => ({
                key: l.id, cells: [
                  { val: l.input || 'ε', cls: 'font-bold text-slate-900 dark:text-slate-100' },
                  { val: <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${l.isValid ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400'}`}>{l.isValid ? 'ACCEPTED' : 'REJECTED'}</span> },
                  { val: l.state, cls: 'text-slate-600 dark:text-slate-300' }, { val: l.time, cls: 'text-slate-400 dark:text-slate-500 text-[11px]' },
                  { val: <button type="button" onClick={() => handleReplayLog(l.input)} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"><RotateCcw className="w-3 h-3" /> Replay</button>, cls: 'text-right' }
                ]
              }))} />
            </section>
          </div>
        )}

        {activeTab === 'catalog' && (
          <div id="panel-catalog" role="tabpanel" aria-labelledby="tab-catalog" className="space-y-6">
            <section className={cardCls}>
              <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-sm font-semibold font-mono text-slate-900 dark:text-slate-100">Product Registration</h2><p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Verify serial numbers and add new items to your inventory.</p>
              </div>
              <form onSubmit={handleRegisterProduct} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label htmlFor="reg-category" className={lblCls}>Department Category</label><select id="reg-category" value={category} onChange={(e) => { const c = e.target.value; setCategory(c); setInput(generateSampleCode(c)); setFormMsg(null); }} className={`${inCls} font-mono`}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.id} — {c.name}</option>)}</select></div>
                  <div><label htmlFor="reg-name" className={lblCls}>Product Name</label><input id="reg-name" type="text" placeholder="e.g. Dell Latitude 7420" value={productName} onChange={(e) => { setProductName(e.target.value); setFormMsg(null); }} className={inCls} /></div>
                  <div><label htmlFor="reg-code" className={lblCls}>Serial Code</label><input id="reg-code" type="text" placeholder="e.g. IT-2026-001" value={input} onChange={(e) => { setInput(e.target.value.toUpperCase()); setFormMsg(null); }} className={`${inCls} font-mono uppercase`} /></div>
                </div>
                {formMsg && (
                  <div className={`p-3 rounded-lg border font-mono text-xs flex items-center gap-2 ${formMsg.type === 'ok' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400'}`}>
                    {formMsg.type === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                    <span>{formMsg.text}</span>
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <button type="button" onClick={() => { setInput(generateSampleCode(category)); setFormMsg(null); }} className={btnSec}>Generate Valid</button>
                  <button type="submit" className="px-5 py-2 text-xs font-mono font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors">Register Product</button>
                </div>
              </form>
            </section>

            <section className={cardCls}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-sm font-semibold font-mono text-slate-900 dark:text-slate-100">Product Inventory Catalog <span className="text-xs font-normal text-slate-400 dark:text-slate-500 ml-1">({products.length} registered)</span></h2>
              </div>
              <Table emptyMsg="No products in catalog. Register an item above." headers={['Category', 'Product Code', { title: 'Product Name', cls: 'font-sans' }, 'Registered Date', { title: 'Actions', cls: 'text-right' }]} rows={products.map((p) => ({
                key: p.code, cells: [
                  { val: <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold border bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700">{p.category}</span> },
                  { val: p.code, cls: 'font-bold text-slate-900 dark:text-slate-100' }, { val: p.name, cls: 'text-slate-700 dark:text-slate-300 font-sans' },
                  { val: p.registeredDate || 'N/A', cls: 'text-slate-400 dark:text-slate-500 text-[11px]' },
                  { val: <button type="button" onClick={() => setProducts(deleteProduct(p.code))} aria-label={`Delete ${p.code}`} className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>, cls: 'text-right' }
                ]
              }))} />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
