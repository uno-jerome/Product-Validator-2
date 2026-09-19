import React, { useState, useEffect, useMemo } from 'react';
import { validateProductCode, generateSampleCode } from './core/dfaEngine';
import { getProducts, saveProduct, deleteProduct, getLogs, saveLog, clearAll } from './services/storage';

export default function App() {
  const [inputCode, setInputCode] = useState('IT-2026-001');
  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [newCat, setNewCat] = useState('IT');
  const [newName, setNewName] = useState('');

  useEffect(() => {
    setProducts(getProducts());
    setLogs(getLogs());
  }, []);

  const dfa = useMemo(() => validateProductCode(inputCode), [inputCode]);

  const handleValidate = (codeToTest) => {
    const code = codeToTest !== undefined ? codeToTest : inputCode;
    if (codeToTest !== undefined) setInputCode(code);
    const res = validateProductCode(code);
    const updated = saveLog({
      id: Date.now(),
      input: code,
      isValid: res.isValid,
      state: res.finalState,
      time: new Date().toLocaleTimeString()
    });
    setLogs(updated);
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!dfa.isValid || !newName.trim()) return;
    const updated = saveProduct({ id: Date.now(), code: inputCode, category: newCat, name: newName.trim() });
    setProducts(updated);
    handleValidate(inputCode);
    setNewName('');
    setInputCode(generateSampleCode(newCat));
  };

  const handleDeleteProduct = (id) => setProducts(deleteProduct(id));
  const handleClearHistory = () => { clearAll(); setProducts([]); setLogs([]); };

  const presets = [
    { label: 'IT-2026-001 (Valid)', code: 'IT-2026-001' },
    { label: '1T-2026-001 (Invalid Prefix)', code: '1T-2026-001' },
    { label: 'IT-202-001 (Invalid Year)', code: 'IT-202-001' },
    { label: 'IT#2026-001 (Illegal Symbol)', code: 'IT#2026-001' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="border-b border-slate-800 pb-4">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Product Code Validator — Deterministic Finite Automaton (DFA)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1">
            CCAUTOMA Course Project | M = (Q, Σ, δ, q0, F)
          </p>
        </header>

        {/* Scanner Panel */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="text-xs font-mono uppercase text-slate-400">Input String w (Monospaced):</label>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p.code}
                  onClick={() => handleValidate(p.code)}
                  className="px-2.5 py-1 text-xs font-mono rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="e.g. IT-2026-001"
              className="flex-1 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg px-4 py-2.5 font-mono text-lg text-white uppercase tracking-widest outline-none"
            />
            <button
              onClick={() => handleValidate()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-semibold rounded-lg"
            >
              Log Attempt
            </button>
          </div>

          {/* Status Badge */}
          <div className={`p-3 rounded-lg border font-mono text-sm flex items-center justify-between ${
            dfa.isValid ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300' : 'bg-rose-950/60 border-rose-600 text-rose-300'
          }`}>
            <span className="font-bold">
              {dfa.isValid ? 'ACCEPTED (State: q11)' : `REJECTED (State: ${dfa.finalState})`}
            </span>
            <span className="text-xs opacity-90">{dfa.errorReason || 'String in Language L'}</span>
          </div>

          {/* Transition Tape */}
          <div className="space-y-1.5">
            <span className="text-xs font-mono text-slate-400">Transition Tape: Step-by-Step State Progression</span>
            {dfa.trace.length === 0 ? (
              <p className="text-xs font-mono text-slate-500">Empty string ε — No transitions executed.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-2">
                {dfa.trace.map((t) => (
                  <div key={t.step} className={`p-2 rounded border font-mono text-xs text-center ${
                    t.status === 'error' ? 'bg-rose-950/40 border-rose-600 text-rose-300' : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}>
                    <div className="text-[10px] text-slate-500 font-bold">#{t.step}</div>
                    <div className="text-sm font-bold text-white my-0.5">'{t.symbol}'</div>
                    <div className="text-[11px] text-cyan-400">{t.fromState} &rarr; {t.toState}</div>
                    <div className="text-[10px] text-slate-400">{t.domain}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Catalog & Audit Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Asset Registration & Catalog */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold font-mono uppercase text-white">Catalog Inventory ({products.length})</h2>
              <button
                type="button"
                onClick={() => setInputCode(generateSampleCode(newCat))}
                className="text-xs font-mono text-emerald-400 hover:underline"
              >
                Auto-Generate Code
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="flex gap-2">
              <select
                value={newCat}
                onChange={(e) => { setNewCat(e.target.value); setInputCode(generateSampleCode(e.target.value)); }}
                className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-white outline-none"
              >
                {['IT', 'EL', 'PR', 'NW', 'OF'].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                type="text"
                placeholder="Asset Name (e.g. Workstation)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-white outline-none"
              />
              <button
                type="submit"
                disabled={!dfa.isValid || !newName.trim()}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-mono text-xs font-semibold rounded"
              >
                Save
              </button>
            </form>

            <div className="max-h-56 overflow-y-auto divide-y divide-slate-800 border border-slate-800 rounded-lg">
              {products.length === 0 ? (
                <p className="p-3 text-xs font-mono text-slate-500 text-center">No inventory assets recorded.</p>
              ) : (
                products.map((p) => (
                  <div key={p.id} className="p-2.5 flex items-center justify-between text-xs font-mono hover:bg-slate-800/40">
                    <div>
                      <span className="font-bold text-emerald-400">[{p.category}] {p.code}</span>
                      <span className="text-slate-300 ml-2 font-sans">{p.name}</span>
                    </div>
                    <button onClick={() => handleDeleteProduct(p.id)} className="text-rose-400 hover:text-rose-300 ml-2">
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Audit Log Table */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold font-mono uppercase text-white">Audit Log ({logs.length})</h2>
              {logs.length > 0 && (
                <button onClick={handleClearHistory} className="text-xs font-mono text-slate-400 hover:text-rose-400">
                  Clear History
                </button>
              )}
            </div>

            <div className="max-h-56 overflow-y-auto divide-y divide-slate-800 border border-slate-800 rounded-lg">
              {logs.length === 0 ? (
                <p className="p-3 text-xs font-mono text-slate-500 text-center">No audit attempts logged.</p>
              ) : (
                logs.map((l) => (
                  <div key={l.id} className="p-2.5 flex items-center justify-between text-xs font-mono hover:bg-slate-800/40">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        l.isValid ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                      }`}>
                        {l.isValid ? 'ACCEPTED' : 'REJECTED'}
                      </span>
                      <span className="text-white font-bold">{l.input || 'ε'}</span>
                      <span className="text-slate-500 text-[10px]">({l.state})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-500">{l.time}</span>
                      <button onClick={() => setInputCode(l.input)} className="text-cyan-400 hover:underline text-xs">
                        Replay
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
