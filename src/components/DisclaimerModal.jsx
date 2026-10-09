import { GraduationCap, CheckCircle2, X } from 'lucide-react';

export default function DisclaimerModal({ isOpen, onAcknowledge }) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="disclaimer-title"
      aria-describedby="disclaimer-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5 text-slate-800 dark:text-slate-100">
        <button
          type="button"
          onClick={onAcknowledge}
          aria-label="Dismiss disclaimer"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              CCAUTOMA — Automata Theory & Formal Languages Project
            </span>
            <h2 id="disclaimer-title" className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-0.5">
              Academic Demonstration & Scope Notice
            </h2>
          </div>
        </div>

        <div id="disclaimer-desc" className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
          <p>
            This application is an <span className="font-semibold text-slate-900 dark:text-white">academic prototype</span> developed strictly for requirement specification and academic validation of Deterministic Finite Automata (DFA).
          </p>
          <p>
            It demonstrates formal language recognition for the language <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">L = [A-Z]²-[0-9]⁴-[0-9]³ (|w|=11)</code> using an explicit 13-state automaton.
          </p>
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs">
            <p className="font-medium">
              Important: This application is not intended for commercial production inventory use. All catalog records and logs are maintained in a localized browser sandbox for evaluation purposes.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onAcknowledge}
            className="w-full py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-mono text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>I Understand</span>
          </button>
        </div>
      </div>
    </div>
  );
}
