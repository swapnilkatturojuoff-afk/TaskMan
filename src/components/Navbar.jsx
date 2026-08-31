import React, { useState } from 'react';
import {
  Sparkles,
  Timer,
  Flame,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Zap,
  BarChart3,
  ShieldAlert,
  User as UserIcon,
  ChevronDown,
  LayoutGrid,
  Target,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBoard } from '../context/BoardContext';

export const Navbar = ({
  onOpenNewBoard,
  onOpenDailyBriefing,
  onOpenPrioritize,
  onOpenStats,
  onOpenThreatModel,
  onOpenAuth,
  onOpenNewTask,
}) => {
  const { userProfile, isGuest, logout } = useAuth();
  const {
    boards,
    activeBoard,
    setActiveBoardId,
    selectedEnergy,
    setSelectedEnergy,
    selectedPriority,
    setSelectedPriority,
    searchQuery,
    setSearchQuery,
    pomodoro,
    setIsPomodoroOpen,
    isAiProcessing,
    aiActionType,
  } = useBoard();

  const [isBoardDropdownOpen, setIsBoardDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <LayoutGrid className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
                  TaskMan <span className="text-indigo-400 font-extrabold text-xs uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30 ml-0.5">AI</span>
                </span>
              </div>
            </div>

            <div className="relative">
              <button
                id="btn-board-switcher"
                onClick={() => setIsBoardDropdownOpen(!isBoardDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-sm font-medium transition-all text-slate-200"
              >
                <span className="truncate max-w-[140px] sm:max-w-[200px]">
                  {activeBoard ? activeBoard.name : 'Select Board'}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {isBoardDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsBoardDropdownOpen(false)}
                  />
                  <div className="absolute left-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Workspaces ({boards.length})
                    </div>
                    <div className="max-h-60 overflow-y-auto mt-1">
                      {boards.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => {
                            setActiveBoardId(b.id);
                            setIsBoardDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-slate-800 transition-colors ${
                            b.id === activeBoard?.id
                              ? 'text-indigo-400 font-medium bg-indigo-500/10'
                              : 'text-slate-300'
                          }`}
                        >
                          <span className="truncate">{b.name}</span>
                          {b.id === activeBoard?.id && (
                            <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-slate-800 mt-2 pt-2 px-2">
                      <button
                        onClick={() => {
                          setIsBoardDropdownOpen(false);
                          onOpenNewBoard();
                        }}
                        className="w-full text-left px-2 py-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Create New Board
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <button
              id="btn-daily-briefing"
              onClick={onOpenDailyBriefing}
              disabled={isAiProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-xs font-semibold text-indigo-300 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className={`w-3.5 h-3.5 text-indigo-400 ${isAiProcessing && aiActionType === 'briefing' ? 'animate-spin' : ''}`} />
              Daily Briefing
            </button>

            <button
              id="btn-auto-prioritize"
              onClick={onOpenPrioritize}
              disabled={isAiProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-xs font-semibold text-purple-300 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Target className={`w-3.5 h-3.5 text-purple-400 ${isAiProcessing && aiActionType === 'prioritize' ? 'animate-spin' : ''}`} />
              Auto-Prioritize
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              id="btn-pomodoro-pill"
              onClick={() => setIsPomodoroOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-medium transition-all ${
                pomodoro.isRunning
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title="Open Pomodoro Timer"
            >
              <Timer className={`w-3.5 h-3.5 ${pomodoro.isRunning ? 'text-rose-400' : 'text-slate-400'}`} />
              <span>{formatTime(pomodoro.timeLeft)}</span>
            </button>

            <button
              id="btn-streak-stats"
              onClick={onOpenStats}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors"
              title="Productivity Streak and Analytics"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
              <span>{userProfile?.currentStreak || 1}d</span>
            </button>

            <button
              id="btn-add-task-header"
              onClick={onOpenNewTask}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Task</span>
            </button>

            <button
              id="btn-threat-model-trigger"
              onClick={onOpenThreatModel}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              title="Security & Threat Model Review"
            >
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
            </button>

            <div className="relative">
              <button
                id="btn-user-avatar-menu"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200 transition-colors"
              >
                {userProfile?.displayName ? (
                  userProfile.displayName.charAt(0).toUpperCase()
                ) : (
                  <UserIcon className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-slate-800">
                      <div className="text-sm font-semibold text-slate-200 truncate">
                        {userProfile?.displayName || 'Taskmaster User'}
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        {userProfile?.email || (isGuest ? 'Guest Mode' : 'Connected')}
                      </div>
                      {isGuest && (
                        <div className="mt-1 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Offline / Guest Mode
                        </div>
                      )}
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenStats();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                      >
                        <BarChart3 className="w-4 h-4 text-slate-400" />
                        Performance Analytics
                      </button>
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenThreatModel();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                      >
                        <ShieldAlert className="w-4 h-4 text-emerald-400" />
                        Threat Model & Security Spec
                      </button>
                    </div>

                    <div className="border-t border-slate-800 pt-1">
                      {isGuest ? (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenAuth();
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/10 flex items-center gap-2"
                        >
                          <UserIcon className="w-4 h-4" />
                          Sign In / Sync Cloud
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            logout();
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="py-2.5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/60 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-slate-400 font-medium flex items-center gap-1 mr-1">
              <Zap className="w-3 h-3 text-amber-400" /> Energy:
            </span>
            {['all', 'low', 'medium', 'high'].map((energy) => (
              <button
                key={energy}
                id={`filter-energy-${energy}`}
                onClick={() => setSelectedEnergy(energy)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  selectedEnergy === energy
                    ? energy === 'high'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                      : energy === 'medium'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : energy === 'low'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {energy === 'all' ? 'All' : energy === 'low' ? 'Low (Easy)' : energy === 'medium' ? 'Med (Focused)' : 'High (Deep)'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-1 bg-slate-800/80 rounded-lg px-2 py-1 border border-slate-700/60">
              <Filter className="w-3 h-3 text-slate-400" />
              <select
                id="filter-priority-select"
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-slate-200">All Priorities</option>
                <option value="urgent" className="bg-slate-900 text-rose-400">Urgent</option>
                <option value="high" className="bg-slate-900 text-amber-400">High</option>
                <option value="medium" className="bg-slate-900 text-indigo-400">Medium</option>
                <option value="low" className="bg-slate-900 text-slate-400">Low</option>
              </select>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-task-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-36 sm:w-48 pl-8 pr-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
