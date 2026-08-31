import React from 'react';
import { X, Flame, CheckCircle2, Trophy, Zap, BarChart3, Calendar, Layers, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBoard } from '../context/BoardContext';

export const StatsDrawer = ({
  isOpen,
  onClose,
}) => {
  const { userProfile } = useAuth();
  const { tasks, boards } = useBoard();

  if (!isOpen) return null;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalEstimatedMins = tasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);
  const totalCompletedMins = tasks.filter(t => t.status === 'done').reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100">Productivity Intelligence</h2>
                <p className="text-xs text-slate-400">Personal performance analytics</p>
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
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex flex-col">
                <div className="flex items-center justify-between text-amber-400 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">Current Streak</span>
                  <Flame className="w-4 h-4 fill-amber-400/20" />
                </div>
                <div className="text-3xl font-extrabold text-amber-200 mt-auto">
                  {userProfile?.currentStreak || 1} <span className="text-sm font-normal text-amber-400">days</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Longest: {userProfile?.longestStreak || 1} days
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col">
                <div className="flex items-center justify-between text-emerald-400 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">All-Time Done</span>
                  <Trophy className="w-4 h-4" />
                </div>
                <div className="text-3xl font-extrabold text-emerald-200 mt-auto">
                  {userProfile?.completedTasksCount || 0}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Milestone tier: Pro Achiever
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Active Board Velocity</span>
                <span className="text-xs font-bold text-indigo-400">{completionRate}% Completed</span>
              </div>

              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-lg font-bold text-slate-200">{completedTasks}</div>
                  <div className="text-[10px] text-slate-400">Done</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-lg font-bold text-amber-300">{inProgressTasks}</div>
                  <div className="text-[10px] text-slate-400">In Progress</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-lg font-bold text-rose-300">{urgentTasks}</div>
                  <div className="text-[10px] text-slate-400">Urgent Open</div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/60 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                Time & Focus Allocation
              </span>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/50">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    <span>Estimated Board Workload</span>
                  </div>
                  <span className="font-mono font-semibold text-slate-200">
                    {Math.round(totalEstimatedMins / 60)} hrs {totalEstimatedMins % 60}m
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/50">
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Completed Focus Time</span>
                  </div>
                  <span className="font-mono font-semibold text-emerald-300">
                    {Math.round(totalCompletedMins / 60)} hrs {totalCompletedMins % 60}m
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/50">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span>Total Workspace Boards</span>
                  </div>
                  <span className="font-mono font-semibold text-slate-200">
                    {boards.length} Workspaces
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
