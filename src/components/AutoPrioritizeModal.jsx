import React, { useState, useEffect } from 'react';
import { X, Target, Brain, ArrowRight, CheckCircle2, RefreshCw, Loader2, Sparkles } from 'lucide-react';
import { useBoard } from '../context/BoardContext';

export const AutoPrioritizeModal = ({
  isOpen,
  onClose,
}) => {
  const { smartAutoPrioritize, applyPrioritization, isAiProcessing, activeBoard, tasks } = useBoard();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      runPrioritization();
    }
  }, [isOpen]);

  const runPrioritization = async () => {
    setLoading(true);
    try {
      const data = await smartAutoPrioritize();
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAll = async () => {
    if (results.length === 0) return;
    setIsApplying(true);
    try {
      await applyPrioritization(results);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen) return null;

  const quadrantStats = {
    q1: results.filter(r => r.quadrant === 'q1_urgent_important').length,
    q2: results.filter(r => r.quadrant === 'q2_important_not_urgent').length,
    q3: results.filter(r => r.quadrant === 'q3_urgent_not_important').length,
    q4: results.filter(r => r.quadrant === 'q4_neither').length,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                Eisenhower Smart Prioritization Matrix
              </h2>
              <span className="text-xs text-slate-400">
                AI calibrated classification for {activeBoard?.name} ({tasks.length} tasks)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runPrioritization}
              disabled={loading || isAiProcessing}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Recalculate Matrix"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-slate-300">Evaluating urgency vs. long-term importance...</p>
              <p className="text-xs text-slate-500">Mapping tasks across the 4 Eisenhower Matrix quadrants.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30">
                  <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Q1: Do First</div>
                  <div className="text-xl font-extrabold text-rose-200 mt-1">{quadrantStats.q1}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Urgent & Important</div>
                </div>

                <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/30">
                  <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Q2: Schedule</div>
                  <div className="text-xl font-extrabold text-indigo-200 mt-1">{quadrantStats.q2}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Important (High ROI)</div>
                </div>

                <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30">
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Q3: Delegate</div>
                  <div className="text-xl font-extrabold text-amber-200 mt-1">{quadrantStats.q3}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Urgent (Low Value)</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Q4: Eliminate</div>
                  <div className="text-xl font-extrabold text-slate-300 mt-1">{quadrantStats.q4}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Neither</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Calculated Task Classifications ({results.length})
                </h4>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {results.map((res) => (
                    <div
                      key={res.taskId}
                      className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            res.quadrant === 'q1_urgent_important' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                            res.quadrant === 'q2_important_not_urgent' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                            res.quadrant === 'q3_urgent_not_important' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            'bg-slate-700/40 text-slate-400 border border-slate-700'
                          }`}>
                            {res.quadrant.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="font-semibold text-slate-200">
                            {res.title}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          {res.reasoning}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          res.suggestedPriority === 'urgent' ? 'bg-rose-500/20 text-rose-300' :
                          res.suggestedPriority === 'high' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-indigo-500/20 text-indigo-300'
                        }`}>
                          Set: {res.suggestedPriority}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          U:{res.urgencyScore}/10 • I:{res.importanceScore}/10
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            id="btn-apply-priorities-confirm"
            type="button"
            onClick={handleApplyAll}
            disabled={isApplying || loading || results.length === 0}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isApplying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Apply Recommended Priorities</span>
          </button>
        </div>
      </div>
    </div>
  );
};
