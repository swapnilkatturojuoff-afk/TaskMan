import React, { useState, useEffect } from 'react';
import { X, Sparkles, Target, Zap, Clock, Lightbulb, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';
import { useBoard } from '../context/BoardContext';

export const DailyBriefingModal = ({
  isOpen,
  onClose,
  onSelectTask,
}) => {
  const { getDailyBriefing, isAiProcessing, activeBoard } = useBoard();
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadBriefing();
    }
  }, [isOpen]);

  const loadBriefing = async () => {
    setLoading(true);
    try {
      const data = await getDailyBriefing();
      setBriefing(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-purple-950/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                Executive Daily Briefing
              </h2>
              <span className="text-xs text-slate-400">
                {briefing?.date || 'Today\'s Agenda'} • {activeBoard?.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadBriefing}
              disabled={loading || isAiProcessing}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Regenerate Briefing"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
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
              <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-slate-300">Synthesizing personalized daily action plan...</p>
              <p className="text-xs text-slate-500">Evaluating task priorities, energy requirements, and focus windows.</p>
            </div>
          ) : briefing ? (
            <>
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <h3 className="text-sm font-bold text-indigo-300 mb-1">
                  {briefing.greeting}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {briefing.summary}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-rose-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Top 3 Critical Focus Objectives
                  </h4>
                </div>

                <div className="space-y-2.5">
                  {briefing.topFocusTasks?.map((task, idx) => (
                    <div
                      key={task.id || idx}
                      onClick={() => {
                        onSelectTask(task.id);
                        onClose();
                      }}
                      className="group p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/50 transition-all cursor-pointer flex items-start justify-between gap-3 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <h5 className="text-xs sm:text-sm font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
                            {task.title}
                          </h5>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {task.reason}
                          </p>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold shrink-0 ${
                        task.priority === 'urgent' ? 'bg-rose-500/20 text-rose-300' :
                        task.priority === 'high' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-indigo-500/20 text-indigo-300'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {briefing.quickWinTask && (
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Recommended Quick Win (Instant Momentum)</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h5 className="text-xs sm:text-sm font-semibold text-slate-100">
                        {briefing.quickWinTask.title}
                      </h5>
                      <span className="text-xs text-slate-400">
                        Estimated ~{briefing.quickWinTask.estimatedMinutes} minutes
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        onSelectTask(briefing.quickWinTask.id);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <span>Jump to Task</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-0.5">
                    Productivity Habit of the Day
                  </h5>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {briefing.productivityTip}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">
              No briefing available. Click refresh to generate.
            </div>
          )}
        </div>

        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
          >
            Let's Get to Work
          </button>
        </div>
      </div>
    </div>
  );
};
