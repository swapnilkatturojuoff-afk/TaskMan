import React from 'react';
import { X, Play, Pause, RotateCcw, Coffee, Zap, Flame, Timer as TimerIcon } from 'lucide-react';
import { useBoard } from '../context/BoardContext';

export const PomodoroTimer = () => {
  const {
    pomodoro,
    pausePomodoro,
    resumePomodoro,
    resetPomodoro,
    setPomodoroMode,
    isPomodoroOpen,
    setIsPomodoroOpen,
  } = useBoard();

  if (!isPomodoroOpen) return null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalModeSeconds = pomodoro.mode === 'work' ? 25 * 60 : pomodoro.mode === 'short_break' ? 5 * 60 : 15 * 60;
  const progressPercent = Math.round(((totalModeSeconds - pomodoro.timeLeft) / totalModeSeconds) * 100);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
      <div className="w-80 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <TimerIcon className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Pomodoro Focus
            </span>
          </div>

          <button
            onClick={() => setIsPomodoroOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center">
          <div className="flex items-center gap-1.5 mb-4 bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setPomodoroMode('work')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                pomodoro.mode === 'work'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Focus
            </button>
            <button
              onClick={() => setPomodoroMode('short_break')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                pomodoro.mode === 'short_break'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Short Break
            </button>
            <button
              onClick={() => setPomodoroMode('long_break')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                pomodoro.mode === 'long_break'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Long Break
            </button>
          </div>

          {pomodoro.taskTitle && (
            <div className="mb-2 text-center max-w-[240px]">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Targeting Task</span>
              <span className="text-xs font-semibold text-indigo-300 truncate block">
                {pomodoro.taskTitle}
              </span>
            </div>
          )}

          <div className="relative my-2 flex items-center justify-center">
            <div className="text-4xl font-extrabold font-mono tracking-tighter text-slate-100">
              {formatTime(pomodoro.timeLeft)}
            </div>
          </div>

          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden my-3">
            <div
              className={`h-full transition-all duration-500 ${
                pomodoro.mode === 'work' ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center gap-3 mt-2">
            <button
              id="btn-pomodoro-reset"
              onClick={resetPomodoro}
              className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {pomodoro.isRunning ? (
              <button
                id="btn-pomodoro-pause"
                onClick={pausePomodoro}
                className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-600/30 transition-all active:scale-95"
              >
                <Pause className="w-4 h-4" /> Pause
              </button>
            ) : (
              <button
                id="btn-pomodoro-play"
                onClick={resumePomodoro}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all active:scale-95"
              >
                <Play className="w-4 h-4" /> Start Focus
              </button>
            )}

            <div className="flex items-center gap-1 text-slate-400 text-xs px-2 py-1 rounded-lg bg-slate-800 font-mono">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>{pomodoro.completedSessions}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
