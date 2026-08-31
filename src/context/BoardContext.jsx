import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import {
  subscribeBoards,
  subscribeTasks,
  createBoard,
  updateBoard,
  deleteBoard,
  createTask,
  updateTask,
  deleteTask,
  batchUpdateTasks
} from '../firebase/firestore';

const BoardContext = createContext(undefined);

const DEFAULT_COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'indigo', order: 0 },
  { id: 'in_progress', title: 'In Progress', color: 'amber', order: 1 },
  { id: 'review', title: 'In Review', color: 'purple', order: 2 },
  { id: 'done', title: 'Done', color: 'emerald', order: 3 },
];

const INITIAL_DEMO_BOARDS = [
  {
    id: 'board_work_main',
    userId: 'guest_user_demo',
    name: 'Product Launch Sprint',
    description: 'Q3 TaskMaster AI release roadmap and deliverables',
    columns: DEFAULT_COLUMNS,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date().toISOString(),
    isDefault: true,
  },
  {
    id: 'board_personal',
    userId: 'guest_user_demo',
    name: 'Personal & Wellness',
    description: 'Habits, reading lists, and weekend focus goals',
    columns: DEFAULT_COLUMNS,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'board_side_project',
    userId: 'guest_user_demo',
    name: 'Side Hustle Incubator',
    description: 'Next-gen SaaS prototypes and design systems',
    columns: DEFAULT_COLUMNS,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const INITIAL_DEMO_TASKS = [
  {
    id: 'task_1',
    boardId: 'board_work_main',
    userId: 'guest_user_demo',
    title: 'Architect multi-tier Firestore security rules',
    description: 'Enforce mathematical ABAC isolation and validate all path keys against unauthorized traversal',
    status: 'in_progress',
    priority: 'urgent',
    energyLevel: 'high',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    dueTime: '16:00',
    estimatedMinutes: 60,
    subtasks: [
      { id: 'st_1', title: 'Draft security spec and dirty dozen payloads', completed: true, estimatedMinutes: 20 },
      { id: 'st_2', title: 'Define isValidId and isValidEntity helpers', completed: true, estimatedMinutes: 20 },
      { id: 'st_3', title: 'Test user isolation with unauthenticated queries', completed: false, estimatedMinutes: 20 },
    ],
    order: 0,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task_2',
    boardId: 'board_work_main',
    userId: 'guest_user_demo',
    title: 'Implement Voice & Natural Language Quick-Add bar',
    description: 'Speech recognition engine with instant Gemini structured task JSON synthesis',
    status: 'todo',
    priority: 'high',
    energyLevel: 'medium',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    dueTime: '14:30',
    estimatedMinutes: 45,
    subtasks: [
      { id: 'st_4', title: 'Configure webkitSpeechRecognition hook', completed: true, estimatedMinutes: 15 },
      { id: 'st_5', title: 'Wire fallback model ladder to backend route', completed: false, estimatedMinutes: 15 },
      { id: 'st_6', title: 'Render responsive quick input chip preview', completed: false, estimatedMinutes: 15 },
    ],
    order: 1,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task_3',
    boardId: 'board_work_main',
    userId: 'guest_user_demo',
    title: 'Calibrate Eisenhower Auto-Prioritization matrix',
    description: 'Batch process all board tasks, calculate urgency & importance scores, and apply smart visual badges',
    status: 'todo',
    priority: 'medium',
    energyLevel: 'high',
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    estimatedMinutes: 30,
    subtasks: [],
    order: 2,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task_4',
    boardId: 'board_work_main',
    userId: 'guest_user_demo',
    title: 'Review production Cloud Run container build metrics',
    description: 'Inspect latency, cold start timings, and Secret Manager bindings',
    status: 'review',
    priority: 'medium',
    energyLevel: 'low',
    dueDate: new Date().toISOString().split('T')[0],
    estimatedMinutes: 25,
    subtasks: [
      { id: 'st_7', title: 'Verify dist/server.cjs bundling', completed: true, estimatedMinutes: 10 },
      { id: 'st_8', title: 'Confirm port 3000 ingress configuration', completed: true, estimatedMinutes: 15 },
    ],
    order: 0,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task_5',
    boardId: 'board_work_main',
    userId: 'guest_user_demo',
    title: 'Deploy polished light theme and typography system',
    description: 'Accessible WCAG AA contrast, fluid bento layout, and motion layout transitions',
    status: 'done',
    priority: 'low',
    energyLevel: 'low',
    completedAt: new Date().toISOString(),
    estimatedMinutes: 35,
    subtasks: [
      { id: 'st_9', title: 'Set up Tailwind color palette', completed: true, estimatedMinutes: 15 },
      { id: 'st_10', title: 'Implement Lucide icon integration', completed: true, estimatedMinutes: 20 },
    ],
    order: 0,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export const BoardProvider = ({ children }) => {
  const { user, incrementCompletedCount } = useAuth();
  const [boards, setBoards] = useState([]);
  const [activeBoardId, setActiveBoardId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);

  const [selectedEnergy, setSelectedEnergy] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiActionType, setAiActionType] = useState(null);

  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);
  const [pomodoro, setPomodoro] = useState({
    taskId: null,
    taskTitle: null,
    mode: 'work',
    timeLeft: 25 * 60,
    isRunning: false,
    completedSessions: 0,
  });

  const userId = user?.uid || 'guest_user_demo';

  useEffect(() => {
    setLoadingBoards(true);
    const unsubscribe = subscribeBoards(userId, (loadedBoards) => {
      if (loadedBoards.length === 0) {
        const initialWithUser = INITIAL_DEMO_BOARDS.map(b => ({ ...b, userId }));
        initialWithUser.forEach(b => createBoard(userId, b));
        setBoards(initialWithUser);
        setActiveBoardId(initialWithUser[0].id);
        INITIAL_DEMO_TASKS.forEach(t => createTask(userId, t.boardId, { ...t, userId }));
      } else {
        setBoards(loadedBoards);
        if (!activeBoardId || !loadedBoards.some(b => b.id === activeBoardId)) {
          setActiveBoardId(loadedBoards[0].id);
        }
      }
      setLoadingBoards(false);
    });

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    if (!activeBoardId) {
      setTasks([]);
      setLoadingTasks(false);
      return;
    }
    setLoadingTasks(true);
    const unsubscribe = subscribeTasks(userId, activeBoardId, (loadedTasks) => {
      setTasks(loadedTasks);
      setLoadingTasks(false);
    });

    return () => unsubscribe();
  }, [userId, activeBoardId]);

  useEffect(() => {
    let interval = null;
    if (pomodoro.isRunning && pomodoro.timeLeft > 0) {
      interval = setInterval(() => {
        setPomodoro(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1
        }));
      }, 1000);
    } else if (pomodoro.isRunning && pomodoro.timeLeft === 0) {
      handlePomodoroComplete();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pomodoro.isRunning, pomodoro.timeLeft]);

  const handlePomodoroComplete = async () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch {}

    if (pomodoro.mode === 'work') {
      await incrementCompletedCount();
      setPomodoro(prev => ({
        ...prev,
        mode: 'short_break',
        timeLeft: 5 * 60,
        isRunning: false,
        completedSessions: prev.completedSessions + 1
      }));
    } else {
      setPomodoro(prev => ({
        ...prev,
        mode: 'work',
        timeLeft: 25 * 60,
        isRunning: false
      }));
    }
  };

  const activeBoard = useMemo(() => {
    return boards.find(b => b.id === activeBoardId) || boards[0] || null;
  }, [boards, activeBoardId]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (selectedEnergy !== 'all' && task.energyLevel !== selectedEnergy) {
        return false;
      }
      if (selectedPriority !== 'all' && task.priority !== selectedPriority) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title?.toLowerCase().includes(q);
        const matchesDesc = task.description?.toLowerCase().includes(q);
        const matchesSubtask = task.subtasks?.some(st => st.title?.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesSubtask) return false;
      }
      return true;
    });
  }, [tasks, selectedEnergy, selectedPriority, searchQuery]);

  const createNewBoard = async (name, description, customColumns) => {
    const newBoardId = `board_${Date.now()}`;
    const newBoard = {
      id: newBoardId,
      userId,
      name,
      description: description || '',
      columns: customColumns && customColumns.length > 0 ? customColumns.map((c, i) => ({ ...c, order: i })) : DEFAULT_COLUMNS,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await createBoard(userId, newBoard);
    setActiveBoardId(newBoardId);
    return newBoardId;
  };

  const editBoard = async (boardId, updates) => {
    await updateBoard(userId, boardId, updates);
  };

  const removeBoard = async (boardId) => {
    if (boards.length <= 1) {
      return;
    }
    await deleteBoard(userId, boardId);
    const remaining = boards.filter(b => b.id !== boardId);
    if (remaining.length > 0) {
      setActiveBoardId(remaining[0].id);
    }
  };

  const addNewTask = async (taskData) => {
    if (!activeBoardId) throw new Error("No active board selected");
    const newTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      boardId: activeBoardId,
      userId,
      title: taskData.title?.trim() || 'New Task',
      description: taskData.description || '',
      status: taskData.status || activeBoard?.columns[0]?.id || 'todo',
      priority: taskData.priority || 'medium',
      energyLevel: taskData.energyLevel || 'medium',
      dueDate: taskData.dueDate,
      dueTime: taskData.dueTime,
      estimatedMinutes: taskData.estimatedMinutes || 30,
      subtasks: taskData.subtasks || [],
      order: tasks.filter(t => t.status === (taskData.status || 'todo')).length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await createTask(userId, activeBoardId, newTask);
    return newTask;
  };

  const editTask = async (taskId, updates) => {
    if (!activeBoardId) return;
    await updateTask(userId, activeBoardId, taskId, updates);
  };

  const removeTask = async (taskId) => {
    if (!activeBoardId) return;
    await deleteTask(userId, activeBoardId, taskId);
  };

  const moveTask = async (taskId, newStatus, newOrder) => {
    if (!activeBoardId) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const isCompleted = newStatus === 'done' && task.status !== 'done';
    const updates = {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    if (newOrder !== undefined) {
      updates.order = newOrder;
    }

    if (isCompleted) {
      updates.completedAt = new Date().toISOString();
      await incrementCompletedCount();
    } else if (newStatus !== 'done') {
      updates.completedAt = undefined;
    }

    await updateTask(userId, activeBoardId, taskId, updates);
  };

  const toggleSubtask = async (taskId, subtaskId) => {
    if (!activeBoardId) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedSubtasks = (task.subtasks || []).map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every(st => st.completed);
    const updates = {
      subtasks: updatedSubtasks,
    };
    if (allDone && task.status !== 'done') {
      updates.status = 'done';
      updates.completedAt = new Date().toISOString();
      await incrementCompletedCount();
    }

    await updateTask(userId, activeBoardId, taskId, updates);
  };

  const magicBreakdown = async (taskId) => {
    if (!activeBoardId) throw new Error("No active board");
    const task = tasks.find(t => t.id === taskId);
    if (!task) throw new Error("Task not found");

    setIsAiProcessing(true);
    setAiActionType('breakdown');
    try {
      const response = await fetch('/api/ai/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          energyLevel: task.energyLevel,
          priority: task.priority
        })
      });

      if (!response.ok) {
        throw new Error(`AI Request failed with status ${response.status}`);
      }

      const data = await response.json();
      const generatedSubtasks = (data.subtasks || []).map((st, idx) => ({
        id: `st_${Date.now()}_${idx}`,
        title: st.title,
        completed: false,
        estimatedMinutes: st.estimatedMinutes || 15
      }));

      const mergedSubtasks = [...(task.subtasks || []), ...generatedSubtasks];
      await updateTask(userId, activeBoardId, taskId, {
        subtasks: mergedSubtasks,
        aiReasoning: data.reasoning || task.aiReasoning
      });

      return { subtasks: generatedSubtasks, reasoning: data.reasoning || '' };
    } catch (error) {
      console.error('Magic Breakdown error:', error);
      const fallbackSubtasks = [
        { id: `st_${Date.now()}_1`, title: `Phase 1: Research & Blueprint for ${task.title.substring(0, 30)}`, completed: false, estimatedMinutes: 20 },
        { id: `st_${Date.now()}_2`, title: `Phase 2: Core Execution & Implementation`, completed: false, estimatedMinutes: 35 },
        { id: `st_${Date.now()}_3`, title: `Phase 3: Review, Polish & Verification`, completed: false, estimatedMinutes: 15 },
      ];
      const mergedSubtasks = [...(task.subtasks || []), ...fallbackSubtasks];
      await updateTask(userId, activeBoardId, taskId, {
        subtasks: mergedSubtasks,
        aiReasoning: 'Task decomposed into actionable execution milestones.'
      });
      return { subtasks: fallbackSubtasks, reasoning: 'Smart breakdown calculated via fallback engine.' };
    } finally {
      setIsAiProcessing(false);
      setAiActionType(null);
    }
  };

  const smartAutoPrioritize = async () => {
    if (!activeBoardId || tasks.length === 0) return [];

    setIsAiProcessing(true);
    setAiActionType('prioritize');
    try {
      const response = await fetch('/api/ai/prioritize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardName: activeBoard?.name,
          tasks: tasks.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
            priority: t.priority,
            energyLevel: t.energyLevel,
            status: t.status,
            dueDate: t.dueDate,
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`AI Request failed with status ${response.status}`);
      }

      const data = await response.json();
      return data.prioritizations || [];
    } catch (error) {
      console.error('Smart Prioritize error:', error);
      return tasks.map((t, i) => {
        let quad = 'q2_important_not_urgent';
        let prio = 'medium';
        if (t.priority === 'urgent' || t.status === 'in_progress') {
          quad = 'q1_urgent_important';
          prio = 'urgent';
        } else if (t.energyLevel === 'high') {
          quad = 'q2_important_not_urgent';
          prio = 'high';
        } else if (t.energyLevel === 'low') {
          quad = 'q3_urgent_not_important';
          prio = 'low';
        }
        return {
          taskId: t.id,
          title: t.title,
          quadrant: quad,
          suggestedPriority: prio,
          reasoning: `Categorized based on urgency signals and energy requirements (${t.energyLevel}).`,
          urgencyScore: 10 - (i % 5),
          importanceScore: 8
        };
      });
    } finally {
      setIsAiProcessing(false);
      setAiActionType(null);
    }
  };

  const applyPrioritization = async (results) => {
    if (!activeBoardId) return;
    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    const updatedTasks = [];

    for (const res of results) {
      const existing = taskMap.get(res.taskId);
      if (existing) {
        const updated = {
          id: existing.id,
          boardId: existing.boardId,
          userId: existing.userId,
          title: existing.title,
          description: existing.description,
          status: existing.status,
          priority: res.suggestedPriority,
          energyLevel: existing.energyLevel,
          dueDate: existing.dueDate,
          dueTime: existing.dueTime,
          subtasks: existing.subtasks,
          estimatedMinutes: existing.estimatedMinutes,
          eisenhowerQuadrant: res.quadrant,
          aiSuggestedPriority: res.suggestedPriority,
          aiReasoning: res.reasoning,
          completedAt: existing.completedAt,
          createdAt: existing.createdAt,
          updatedAt: new Date().toISOString(),
          order: existing.order,
        };
        updatedTasks.push(updated);
      }
    }

    await batchUpdateTasks(userId, activeBoardId, updatedTasks);
  };

  const parseQuickAddTask = async (input) => {
    setIsAiProcessing(true);
    setAiActionType('parse');
    try {
      const response = await fetch('/api/ai/parse-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input })
      });

      if (!response.ok) {
        throw new Error(`AI Request failed with status ${response.status}`);
      }

      const data = await response.json();
      return {
        title: data.title || input,
        description: data.description || '',
        priority: data.priority || 'medium',
        energyLevel: data.energyLevel || 'medium',
        dueDate: data.dueDate,
        dueTime: data.dueTime,
        estimatedMinutes: data.estimatedMinutes || 30,
        subtasks: (data.subtasks || []).map((st, idx) => ({
          id: `st_${Date.now()}_${idx}`,
          title: typeof st === 'string' ? st : st.title,
          completed: false,
          estimatedMinutes: typeof st === 'object' ? st.estimatedMinutes : 15
        }))
      };
    } catch (error) {
      console.error('Parse task error:', error);
      const isUrgent = /urgent|asap|critical/i.test(input);
      const isHigh = /high|important|tomorrow/i.test(input);
      const isLowEnergy = /quick|easy|low energy|5 min/i.test(input);
      return {
        title: input.replace(/(high priority|urgent|due tomorrow|today)/gi, '').trim(),
        priority: isUrgent ? 'urgent' : isHigh ? 'high' : 'medium',
        energyLevel: isLowEnergy ? 'low' : 'medium',
        estimatedMinutes: isLowEnergy ? 10 : 30,
        subtasks: []
      };
    } finally {
      setIsAiProcessing(false);
      setAiActionType(null);
    }
  };

  const getDailyBriefing = async () => {
    setIsAiProcessing(true);
    setAiActionType('briefing');
    try {
      const response = await fetch('/api/ai/daily-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardName: activeBoard?.name,
          tasks: tasks.map(t => ({
            id: t.id,
            title: t.title,
            status: t.status,
            priority: t.priority,
            energyLevel: t.energyLevel,
            dueDate: t.dueDate,
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`AI Request failed with status ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Daily briefing error:', error);
      const topTasks = tasks
        .filter(t => t.status !== 'done')
        .slice(0, 3)
        .map(t => ({
          id: t.id,
          title: t.title,
          reason: `High priority item in ${t.status.toUpperCase()} state.`,
          priority: t.priority
        }));

      return {
        date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
        greeting: "Good morning, Taskmaster! Here is your daily battle plan.",
        summary: `You have ${tasks.filter(t => t.status !== 'done').length} active tasks today across ${boards.length} workspace boards.`,
        topFocusTasks: topTasks,
        quickWinTask: tasks.find(t => t.energyLevel === 'low' && t.status !== 'done') ? {
          id: tasks.find(t => t.energyLevel === 'low' && t.status !== 'done').id,
          title: tasks.find(t => t.energyLevel === 'low' && t.status !== 'done').title,
          estimatedMinutes: 15
        } : undefined,
        productivityTip: "Eat the frog: Knock out your highest-energy task during your first Pomodoro cycle."
      };
    } finally {
      setIsAiProcessing(false);
      setAiActionType(null);
    }
  };

  const startPomodoro = (task) => {
    setPomodoro({
      taskId: task.id,
      taskTitle: task.title,
      mode: 'work',
      timeLeft: 25 * 60,
      isRunning: true,
      completedSessions: pomodoro.completedSessions,
    });
    setIsPomodoroOpen(true);
  };

  const pausePomodoro = () => {
    setPomodoro(prev => ({ ...prev, isRunning: false }));
  };

  const resumePomodoro = () => {
    setPomodoro(prev => ({ ...prev, isRunning: true }));
  };

  const resetPomodoro = () => {
    const defaultTime = pomodoro.mode === 'work' ? 25 * 60 : pomodoro.mode === 'short_break' ? 5 * 60 : 15 * 60;
    setPomodoro(prev => ({
      ...prev,
      timeLeft: defaultTime,
      isRunning: false
    }));
  };

  const setPomodoroMode = (mode) => {
    const time = mode === 'work' ? 25 * 60 : mode === 'short_break' ? 5 * 60 : 15 * 60;
    setPomodoro(prev => ({
      ...prev,
      mode,
      timeLeft: time,
      isRunning: false
    }));
  };

  return (
    <BoardContext.Provider
      value={{
        boards,
        activeBoard,
        tasks,
        filteredTasks,
        loadingBoards,
        loadingTasks,
        selectedEnergy,
        setSelectedEnergy,
        selectedPriority,
        setSelectedPriority,
        searchQuery,
        setSearchQuery,
        setActiveBoardId,
        createNewBoard,
        editBoard,
        removeBoard,
        addNewTask,
        editTask,
        removeTask,
        moveTask,
        toggleSubtask,
        isAiProcessing,
        aiActionType,
        magicBreakdown,
        smartAutoPrioritize,
        applyPrioritization,
        parseQuickAddTask,
        getDailyBriefing,
        pomodoro,
        startPomodoro,
        pausePomodoro,
        resumePomodoro,
        resetPomodoro,
        setPomodoroMode,
        isPomodoroOpen,
        setIsPomodoroOpen,
      }}
    >
      {children}
    </BoardContext.Provider>
  );
};

export const useBoard = () => {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoard must be used within a BoardProvider');
  }
  return context;
};
