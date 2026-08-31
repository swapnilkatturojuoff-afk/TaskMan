import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, LayoutGrid, Check } from 'lucide-react';
import { useBoard } from '../context/BoardContext';

export const BoardModal = ({
  isOpen,
  onClose,
  initialBoard,
}) => {
  const { createNewBoard, editBoard, removeBoard, boards } = useBoard();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [columns, setColumns] = useState([
    { id: 'todo', title: 'To Do', color: 'indigo' },
    { id: 'in_progress', title: 'In Progress', color: 'amber' },
    { id: 'review', title: 'In Review', color: 'purple' },
    { id: 'done', title: 'Done', color: 'emerald' },
  ]);
  const [newColTitle, setNewColTitle] = useState('');
  const [newColColor, setNewColColor] = useState('indigo');

  useEffect(() => {
    if (initialBoard) {
      setName(initialBoard.name || '');
      setDescription(initialBoard.description || '');
      setColumns(initialBoard.columns || []);
    } else {
      setName('');
      setDescription('');
      setColumns([
        { id: 'todo', title: 'To Do', color: 'indigo' },
        { id: 'in_progress', title: 'In Progress', color: 'amber' },
        { id: 'review', title: 'In Review', color: 'purple' },
        { id: 'done', title: 'Done', color: 'emerald' },
      ]);
    }
  }, [initialBoard, isOpen]);

  if (!isOpen) return null;

  const handleAddColumn = (e) => {
    e?.preventDefault();
    if (!newColTitle.trim()) return;
    const colId = `col_${Date.now()}`;
    setColumns([
      ...columns,
      { id: colId, title: newColTitle.trim(), color: newColColor }
    ]);
    setNewColTitle('');
  };

  const handleRemoveColumn = (colId) => {
    if (columns.length <= 1) {
      alert('A board must have at least one column.');
      return;
    }
    setColumns(columns.filter(c => c.id !== colId));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (initialBoard) {
      await editBoard(initialBoard.id, {
        name: name.trim(),
        description: description.trim(),
        columns,
      });
    } else {
      await createNewBoard(name.trim(), description.trim(), columns);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (initialBoard) {
      if (boards.length <= 1) {
        alert('You cannot delete your only board workspace.');
        return;
      }
      if (confirm(`Are you sure you want to delete board "${initialBoard.name}"?`)) {
        await removeBoard(initialBoard.id);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-100">
              {initialBoard ? 'Workspace Board Settings' : 'Create New Workspace Board'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Board Name *
            </label>
            <input
              id="input-board-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mobile App Sprint, Marketing Hub"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Board Purpose & Description
            </label>
            <textarea
              id="input-board-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are the key goals or milestones for this board?"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Workflow Columns ({columns.length})
            </label>

            <div className="space-y-2 mb-3">
              {columns.map((col, idx) => (
                <div
                  key={col.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-slate-500 font-mono text-[10px] w-4">{idx + 1}</span>
                    <input
                      type="text"
                      value={col.title}
                      onChange={(e) => {
                        const updated = columns.map(c => c.id === col.id ? { ...c, title: e.target.value } : c);
                        setColumns(updated);
                      }}
                      className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={col.color}
                      onChange={(e) => {
                        const updated = columns.map(c => c.id === col.id ? { ...c, color: e.target.value } : c);
                        setColumns(updated);
                      }}
                      className="bg-slate-900 border border-slate-700 rounded-md px-1.5 py-0.5 text-[10px] text-slate-300 focus:outline-none"
                    >
                      <option value="indigo">Indigo</option>
                      <option value="amber">Amber</option>
                      <option value="purple">Purple</option>
                      <option value="emerald">Emerald</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveColumn(col.id)}
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
                type="text"
                value={newColTitle}
                onChange={(e) => setNewColTitle(e.target.value)}
                placeholder="New Column Title (e.g. Testing, Backlog)..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <select
                value={newColColor}
                onChange={(e) => setNewColColor(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="indigo">Indigo</option>
                <option value="amber">Amber</option>
                <option value="purple">Purple</option>
                <option value="emerald">Emerald</option>
              </select>
              <button
                type="button"
                onClick={handleAddColumn}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>
        </form>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/50">
          <div>
            {initialBoard && boards.length > 1 && (
              <button
                id="btn-delete-board-modal"
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete Board
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
              id="btn-save-board"
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {initialBoard ? 'Update Board' : 'Create Board'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
