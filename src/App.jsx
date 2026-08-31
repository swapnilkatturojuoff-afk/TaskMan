import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { BoardProvider, useBoard } from './context/BoardContext';
import { Navbar } from './components/Navbar';
import { QuickAddBar } from './components/QuickAddBar';
import { BoardView } from './components/BoardView';
import { TaskModal } from './components/TaskModal';
import { BoardModal } from './components/BoardModal';
import { DailyBriefingModal } from './components/DailyBriefingModal';
import { AutoPrioritizeModal } from './components/AutoPrioritizeModal';
import { PomodoroTimer } from './components/PomodoroTimer';
import { StatsDrawer } from './components/StatsDrawer';
import { AuthModal } from './components/AuthModal';
import { ThreatModelModal } from './components/ThreatModelModal';

function MainApp() {
  const { tasks } = useBoard();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [defaultTaskStatus, setDefaultTaskStatus] = useState('todo');

  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState(null);

  const [isBriefingModalOpen, setIsBriefingModalOpen] = useState(false);
  const [isPrioritizeModalOpen, setIsPrioritizeModalOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isThreatModelOpen, setIsThreatModelOpen] = useState(false);

  const handleOpenNewTask = (status = 'todo') => {
    setSelectedTask(null);
    setDefaultTaskStatus(status);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleOpenNewBoard = () => {
    setSelectedBoard(null);
    setIsBoardModalOpen(true);
  };

  const handleOpenEditBoard = () => {
    setSelectedBoard(null);
    setIsBoardModalOpen(true);
  };

  const handleSelectTaskFromBriefing = (taskId) => {
    const target = tasks.find(t => t.id === taskId);
    if (target) {
      handleOpenEditTask(target);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar
        onOpenNewBoard={handleOpenNewBoard}
        onOpenDailyBriefing={() => setIsBriefingModalOpen(true)}
        onOpenPrioritize={() => setIsPrioritizeModalOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenThreatModel={() => setIsThreatModelOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenNewTask={() => handleOpenNewTask('todo')}
      />

      <QuickAddBar />

      <main className="flex-1 flex flex-col">
        <BoardView
          onOpenNewTask={() => handleOpenNewTask('todo')}
          onOpenEditTask={handleOpenEditTask}
          onOpenEditBoard={handleOpenEditBoard}
        />
      </main>

      <PomodoroTimer />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        initialTask={selectedTask}
        defaultStatus={defaultTaskStatus}
      />

      <BoardModal
        isOpen={isBoardModalOpen}
        onClose={() => setIsBoardModalOpen(false)}
        initialBoard={selectedBoard}
      />

      <DailyBriefingModal
        isOpen={isBriefingModalOpen}
        onClose={() => setIsBriefingModalOpen(false)}
        onSelectTask={handleSelectTaskFromBriefing}
      />

      <AutoPrioritizeModal
        isOpen={isPrioritizeModalOpen}
        onClose={() => setIsPrioritizeModalOpen(false)}
      />

      <StatsDrawer
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <ThreatModelModal
        isOpen={isThreatModelOpen}
        onClose={() => setIsThreatModelOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BoardProvider>
        <MainApp />
      </BoardProvider>
    </AuthProvider>
  );
}
