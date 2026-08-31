import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  Clock,
  Zap,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Loader2,
  AlertTriangle,
  Flame,
  Brain
} from 'lucide-react';
import { useBoard } from '../context/BoardContext';

export const TaskModal = ({
  isOpen,
  onClose,
  initialTask,
  defaultStatus,
}) => {
  const {
    activeBoard,
    addNewTask,
    editTask,
    removeTask,
    magicBreakdown,
    isAiProcessing,
    aiActionType,
  } = useBoard();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('medium');
  const [energyLevel, setEnergyLevel] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [aiTip, setAiTip] = useState('');

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title || '');
      setDescription(initialTask.description || '');
      setStatus(initialTask.status || 'todo');
      setPriority(initialTask.priority || 'medium');
      setEnergyLevel(initialTask.energyLevel || 'medium');
      setDueDate(initialTask.dueDate || '');
      setDueTime(initialTask.dueTime || '');
      setEstimatedMinutes(initialTask.estimatedMinutes || 30);
      setSubtasks(initialTask.subtasks || []);
      setAiTip(initialTask.aiReasoning || '');
    } else {
      setTitle('');
      setDescription('');
      setStatus(defaultStatus || activeBoard?.columns[0]?.id || 'todo');
      setPriority('medium');
      setEnergyLevel('medium');
      setDueDate(new Date().toISOString().split('T')[0]);
      setDueTime('');
      setEstimatedMinutes(30);
      setSubtasks([]);
      setAiTip('');
    }
  }, [initialTask, defaultStatus, isOpen, activeBoard]);

  if (!isOpen) return null;

  const handleAddSubtask = (e) => {
    e?.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const newSt = {
      id: `st_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      title: newSubtaskTitle.trim(),
      completed: false,
      estimatedMinutes: 15,
    };
    setSubtasks([...subtasks, newSt]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (id) => {
    setSubtasks(
      subtasks.map((st) => (st.id === id ? { ...st, completed: !st.completed } : st))
    );
  };

  const handleRemoveSubtask = (id) => {
    setSubtasks(subtasks.filter((st) => st.id !== id));
  };

  const handleDecomposeWithAI = async () => {
    if (!title.trim()) {
      alert('Please enter a task title first.');
      return;
    }
    setIsDecomposing(true);
    try {
      if (initialTask) {
        const result = await magicBreakdown(initialTask.id);
        setSubtasks([...subtasks, ...result.subtasks]);
        if (result.reasoning) setAiTip(result.reasoning);
      } else {
        const response = await fetch('/api/ai/breakdown', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description, energyLevel, priority })
        });
        if (!response.ok) throw new Error('AI breakdown request failed');
        const data = await response.json();
        const generated = (data.subtasks || []).map((st, idx) => ({
          id: `st_${Date.now()}_${idx}`,
          title: st.title,
          completed: false,
          estimatedMinutes: st.estimatedMinutes || 15
        }));
        setSubtasks([...subtasks, ...generated]);
        if (data.reasoning) setAiTip(data.reasoning);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDecomposing(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskPayload = {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      energyLevel,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      estimatedMinutes: Number(estimatedMinutes) || 30,
      subtasks,
      aiReasoning: aiTip || undefined,
    };

    if (initialTask) {
      await editTask(initialTask.id, taskPayload);
    } else {
      await addNewTask(taskPayload);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (initialTask && confirm('Are you sure you want to delete this task?')) {
      await removeTask(initialTask.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-100">
              {initialTask ? 'Edit Task' : 'Create New Task'}
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              in {activeBoard?.name}
            </span>
          </div>

          <button
            id="btn-close-task-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Task Title *
            </label>
            <input
              id="input-task-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement user authentication flow"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Description / Notes
            </label>
            <textarea
              id="input-task-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key context, links, or acceptance criteria..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Column Status
              </label>
              <select
                id="select-task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              >
                {activeBoard?.columns.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Priority
              </label>
              <select
                id="select-task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="urgent">🔴 Urgent</option>
                <option value="high">🟡 High</option>
                <option value="medium">🔵 Medium</option>
                <option value="low">⚪ Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> Energy Focus
              </label>
              <select
                id="select-task-energy"
                value={energyLevel}
                onChange={(e) => setEnergyLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="low">🌱 Low Energy (Quick Win)</option>
                <option value="medium">⚡ Medium (Standard)</option>
                <option value="high">🔥 High Energy (Deep Focus)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" /> Due Date
              </label>
              <input
                id="input-task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" /> Due Time
              </label>
              <input
                id="input-task-due-time"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Est. Duration (Mins)
              </label>
              <input
                id="input-task-duration"
                type="number"
                min="5"
                step="5"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Subtasks & Execution Steps ({subtasks.filter((s) => s.completed).length}/{subtasks.length})
                </span>
              </div>

              <button
                id="btn-ai-decompose-modal"
                type="button"
                onClick={handleDecomposeWithAI}
                disabled={isDecomposing || isAiProcessing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all hover:scale-105 active:scale-95"
              >
                {isDecomposing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                )}
                <span>AI Decompose</span>
              </button>
            </div>

            {aiTip && (
              <div className="mb-3 p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-start gap-2.5 text-xs text-indigo-200">
                <Brain className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-indigo-300">Strategic Strategy:</span> {aiTip}
                </div>
              </div>
            )}

            <div className="space-y-2 mb-3 max-h-48 overflow-y-auto pr-1">
              {subtasks.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:bg-slate-800 transition-colors text-xs"
                >
                  <div
                    onClick={() => handleToggleSubtask(st.id)}
                    className="flex items-center gap-2 flex-1 cursor-pointer truncate"
                  >
                    {st.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-500 shrink-0 hover:text-indigo-400" />
                    )}
                    <span className={`truncate ${st.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {st.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {st.estimatedMinutes && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {st.estimatedMinutes}m
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(st.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                id="input-new-subtask"
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="Add manual subtask step..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>
        </form>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/50">
          <div>
            {initialTask && (
              <button
                id="btn-delete-task-modal"
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete Task
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-save-task"
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {initialTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
