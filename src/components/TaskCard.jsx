import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Zap,
  CheckCircle2,
  Circle,
  Sparkles,
  Timer,
  MoreVertical,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Brain
} from 'lucide-react';
import { useBoard } from '../context/BoardContext';

export const TaskCard = ({
  task,
  onOpenEdit,
  onDragStart,
}) => {
  const { toggleSubtask, moveTask, removeTask, magicBreakdown, startPomodoro, isAiProcessing, aiActionType } = useBoard();
  const [isSubtasksExpanded, setIsSubtasksExpanded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBreakingDown, setIsBreakingDown] = useState(false);

  const completedSubtasks = task.subtasks?.filter((st) => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const progressPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const handleMagicBreakdown = async (e) => {
    e.stopPropagation();
    setIsBreakingDown(true);
    try {
      await magicBreakdown(task.id);
      setIsSubtasksExpanded(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsBreakingDown(false);
    }
  };

  const getPriorityBadge = (prio) => {
    switch (prio) {
      case 'urgent':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'high':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'medium':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      case 'low':
      default:
        return 'bg-slate-700/40 text-slate-400 border-slate-700';
    }
  };

  const getEnergyBadge = (energy) => {
    switch (energy) {
      case 'high':
        return { label: 'High Focus', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
      case 'medium':
        return { label: 'Medium', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
      case 'low':
      default:
        return { label: 'Quick Win', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    }
  };

  const energyInfo = getEnergyBadge(task.energyLevel);

  return (
    <div
      id={`task-card-${task.id}`}
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      className="group relative bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-xl p-3.5 shadow-sm hover:shadow-md transition-all duration-150 cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold border ${getPriorityBadge(task.priority)}`}>
            {task.priority}
          </span>
          <span className={`flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-medium border ${energyInfo.color}`}>
            <Zap className="w-2.5 h-2.5" />
            {energyInfo.label}
          </span>
        </div>

        <div className="relative">
          <button
            id={`btn-task-menu-${task.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
              <div className="absolute right-0 mt-1 w-40 rounded-xl bg-slate-900 border border-slate-700 shadow-xl py-1 z-50 animate-in fade-in zoom-in-95">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    onOpenEdit(task);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Details
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    startPomodoro(task);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Timer className="w-3.5 h-3.5 text-rose-400" /> Start Pomodoro
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    removeTask(task.id);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Task
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div onClick={() => onOpenEdit(task)} className="mt-2.5 cursor-pointer">
        <h4 className={`text-sm font-semibold tracking-tight text-slate-100 leading-snug ${task.status === 'done' ? 'line-through text-slate-400' : ''}`}>
          {task.title}
        </h4>
        {task.description && (
          <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {task.eisenhowerQuadrant && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">
          <Brain className="w-3 h-3 text-purple-400" />
          <span className="font-semibold uppercase tracking-wider">
            {task.eisenhowerQuadrant === 'q1_urgent_important' ? 'Q1: Do First' :
             task.eisenhowerQuadrant === 'q2_important_not_urgent' ? 'Q2: Schedule' :
             task.eisenhowerQuadrant === 'q3_urgent_not_important' ? 'Q3: Delegate' : 'Q4: Eliminate'}
          </span>
        </div>
      )}

      {totalSubtasks > 0 && (
        <div className="mt-3 pt-2.5 border-t border-slate-700/50">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsSubtasksExpanded(!isSubtasksExpanded);
              }}
              className="flex items-center gap-1 hover:text-slate-200 transition-colors"
            >
              <span>Subtasks ({completedSubtasks}/{totalSubtasks})</span>
              {isSubtasksExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <span className="text-[10px] font-semibold text-slate-300">{progressPercent}%</span>
          </div>

          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                progressPercent === 100 ? 'bg-emerald-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {isSubtasksExpanded && (
            <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto pr-1 animate-in fade-in">
              {task.subtasks?.map((st) => (
                <div
                  key={st.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSubtask(task.id, st.id);
                  }}
                  className="flex items-center justify-between gap-2 p-1.5 rounded-md hover:bg-slate-750 text-xs text-slate-300 cursor-pointer group/st"
                >
                  <div className="flex items-center gap-2 truncate">
                    {st.completed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-slate-500 shrink-0 group-hover/st:text-indigo-400" />
                    )}
                    <span className={`truncate text-xs ${st.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {st.title}
                    </span>
                  </div>
                  {st.estimatedMinutes && (
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
                      {st.estimatedMinutes}m
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-3 pt-2.5 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <div className="flex items-center gap-1 text-[11px] text-slate-300">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{task.dueDate}</span>
            </div>
          )}
          {task.estimatedMinutes && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{task.estimatedMinutes}m</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {totalSubtasks === 0 && task.status !== 'done' && (
            <button
              id={`btn-magic-breakdown-${task.id}`}
              onClick={handleMagicBreakdown}
              disabled={isBreakingDown || isAiProcessing}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold transition-all hover:scale-105 active:scale-95"
              title="Decompose task into actionable subtasks"
            >
              <Sparkles className={`w-3 h-3 ${isBreakingDown ? 'animate-spin' : ''}`} />
              <span>Breakdown</span>
            </button>
          )}

          {task.status !== 'done' && (
            <button
              id={`btn-pomodoro-start-${task.id}`}
              onClick={(e) => {
                e.stopPropagation();
                startPomodoro(task);
              }}
              className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Start Pomodoro Focus"
            >
              <Timer className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
