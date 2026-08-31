import React from 'react';
import { X, ShieldAlert, ShieldCheck, Lock, Database, Key, Server, Terminal, CheckCircle2 } from 'lucide-react';

export const ThreatModelModal = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const threatZones = [
    {
      zone: '1. Input Surfaces',
      risks: 'Malicious task payloads, prompt injection via quick-add/voice strings, XSS injection through task descriptions.',
      countermeasures: 'Strict input sanitation, length bounds (title: 300, desc: 500), React escaped DOM rendering, null-safe payload parsing.',
      status: 'Protected',
    },
    {
      zone: '2. Planning & AI Reasoning',
      risks: 'System instruction bypass, hallucinated commands, model unavailability during critical workflows.',
      countermeasures: 'Structured JSON Schema enforcement (Gemini Type.OBJECT), 3-model fallback ladder (flash-lite -> flash-latest -> 3.7-flash), local heuristics fallback.',
      status: 'Protected',
    },
    {
      zone: '3. Tool & API Execution',
      risks: 'Gemini API key leakage to browser, SSRF, dynamic code execution vulnerabilities.',
      countermeasures: 'Server-side API routes (`/api/ai/*`) proxying all Gemini calls; zero browser-side LLM key exposure; express.json payload bounds; isolated stateless execution.',
      status: 'Protected',
    },
    {
      zone: '4. Memory & State Persistence',
      risks: 'Cross-tenant data exposure, unauthenticated Firestore overwrites, dirty undefined field crashes.',
      countermeasures: 'Owner-bound Firestore security rules (`request.auth.uid == userId`), undefined-stripping serializer before write, client-side localStorage fallback for resilience.',
      status: 'Protected',
    },
    {
      zone: '5. Inter-System Communication',
      risks: 'Man-in-the-middle sniffing, unencrypted tokens, unauthorized network ingress.',
      countermeasures: 'HTTPS transit, Google Cloud Secret Manager IAM accessor bindings, isolated Cloud Run ingress at port 3000.',
      status: 'Protected',
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                Agentic Threat Model & Security Specification
              </h2>
              <p className="text-xs text-slate-400">
                OWASP Top 10 Web & OWASP Top 10 for LLM Applications Compliance Matrix
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Threat Zone</th>
                  <th className="py-3 px-4">Identified Risks</th>
                  <th className="py-3 px-4">Implemented Countermeasures</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {threatZones.map((tz, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-indigo-300 whitespace-nowrap">
                      {tz.zone}
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs">
                      {tz.risks}
                    </td>
                    <td className="py-3 px-4 text-slate-200 max-w-sm">
                      {tz.countermeasures}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        {tz.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                <Database className="w-4 h-4" />
                <span>Firestore Isolation</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Rules enforce strict user ownership: <code className="text-indigo-300 font-mono">request.auth.uid == userId</code> on all collections and document mutations.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                <Key className="w-4 h-4" />
                <span>Secret Protection</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Zero API keys exist in client bundles. Runtime leverages Google Cloud Secret Manager accessor roles and secure server proxies.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                <Server className="w-4 h-4" />
                <span>Resilient Fallback</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Multi-tier AI fallback engine automatically retries transient upstream errors across 3 Gemini models before deploying deterministic heuristics.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
