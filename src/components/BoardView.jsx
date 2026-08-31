import React, { useState } from 'react';
import { Plus, MoreHorizontal, Sparkles, Layers, ListFilter } from 'lucide-react';
import { useBoard } from '../context/BoardContext';
import { TaskCard } from './TaskCard';

export const BoardView = ({
  onOpenNewTask,
  onOpenEditTask,
  onOpenEditBoard,
}) => {
  const { activeBoard, filteredTasks, moveTask } = useBoard();
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverColumnId, setDragOverColumnId] = useState(null);

  if (!activeBoard) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-400">
        <div>
          <Layers className="w-12 h-12 mx-auto mb-3 text-slate-600 animate-pulse" />
          <h3 className="text-lg font-semibold text-slate-200">No Active Board</h3>
          <p className="text-sm text-slate-500 mt-1">Create or select a board to begin managing tasks.</p>
        </div>
      </div>
    );
  }

  const columns = activeBoard.columns || [];

  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumnId !== columnId) {
      setDragOverColumnId(columnId);
    }
  };

  const handleDragLeave = (e, columnId) => {
    if (dragOverColumnId === columnId) {
      setDragOverColumnId(null);
    }
  };

  const handleDrop = async (e, columnId) => {
    e.preventDefault();
    setDragOverColumnId(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      await moveTask(taskId, columnId);
      setDraggedTaskId(null);
    }
  };

  const getColumnBadgeColor = (color) => {
    switch (color) {
      case 'amber':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'purple':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'emerald':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      case 'indigo':
      default:
        return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';
    }
  };

  return (
    <div className="flex-1 overflow-x-auto p-4 sm:p-6 lg:p-8 bg-slate-950">
      <div className="max-w-7xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {activeBoard.name}
            </h1>
            <button
              id="btn-edit-board-settings"
              onClick={onOpenEditBoard}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Board Settings & Custom Columns"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
          {activeBoard.description && (
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              {activeBoard.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-add-task-board-header"
            onClick={onOpenNewTask}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
        {columns.map((col) => {
          const columnTasks = filteredTasks.filter((t) => t.status === col.id);
          const isOver = dragOverColumnId === col.id;

          return (
            <div
              key={col.id}
              id={`column-container-${col.id}`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={(e) => handleDragLeave(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`flex flex-col bg-slate-900/90 rounded-2xl border transition-all duration-150 p-3.5 min-h-[500px] ${
                isOver
                  ? 'border-indigo-500 bg-indigo-950/20 ring-2 ring-indigo-500/20 shadow-xl'
                  : 'border-slate-800/80 shadow-md'
              }`}
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${getColumnBadgeColor(col.color)}`}>
                    {col.title}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {columnTasks.length}
                  </span>
                </div>

                <button
                  id={`btn-add-task-col-${col.id}`}
                  onClick={onOpenNewTask}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  title={`Add task to ${col.title}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto pr-0.5 min-h-[120px]">
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onOpenEdit={onOpenEditTask}
                    onDragStart={handleDragStart}
                  />
                ))}

                {columnTasks.length === 0 && (
                  <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-800/60 rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-500">No tasks in {col.title}</p>
                    <button
                      onClick={onOpenNewTask}
                      className="mt-2 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300"
                    >
                      + Add New
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
