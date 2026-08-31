# 📘 TaskMan — Beginner Developer & Architecture Guide

Welcome to the **TaskMan** codebase! This guide is written specifically for beginners and developers exploring this project for the first time. It breaks down how the frontend, state management, backend APIs, and AI integrations connect together in clear, simple terms.

---

## 🗺️ System Map: How Everything Fits Together

```
                  ┌─────────────────────────────────────────┐
                  │          React Frontend (Vite)          │
                  │  - Kanban Board UI (BoardView)          │
                  │  - Voice & NLP Quick-Add (QuickAddBar)  │
                  │  - Pomodoro Focus Timer (PomodoroTimer) │
                  └────────────────────┬────────────────────┘
                                       │
                     State & Persistence Synchronization
                                       ▼
        ┌─────────────────────────────────────────────────────────────┐
        │  React Contexts:                                            │
        │  1. AuthContext: Manages user login & guest demo mode       │
        │  2. BoardContext: Manages boards, columns, tasks & drag/drop│
        └──────────────┬───────────────────────────────┬──────────────┘
                       │                               │
            Local & Cloud Storage                 API Requests
                       ▼                               ▼
        ┌────────────────────────────┐  ┌─────────────────────────────┐
        │  Firestore & LocalStorage  │  │  Express Backend (server.ts)│
        │  - User data isolation     │  │  - /api/ai/breakdown        │
        │  - Offline-first cache     │  │  - /api/ai/prioritize       │
        └────────────────────────────┘  │  - /api/ai/parse-task       │
                                        │  - /api/ai/daily-briefing   │
                                        └──────────────┬──────────────┘
                                                       │
                                          Secure Server-Side AI
                                                       ▼
                                        ┌─────────────────────────────┐
                                        │   Google Gemini API         │
                                        │   (gemini-3.1-flash-lite)   │
                                        └─────────────────────────────┘
```

---

## 📂 Directory Structure Explained

| Directory / File | What it does | Beginner Tip |
| :--- | :--- | :--- |
| `src/types.ts` | Defines the data shapes (Task, Board, Subtask, Priority) | **Start here!** Look at what properties a `Task` has before editing UI. |
| `src/context/BoardContext.tsx` | The central state hub for all tasks and boards | Contains helper functions like `addNewTask`, `moveTask`, `deleteTask`. |
| `src/context/AuthContext.tsx` | Handles user authentication and guest demo state | Allows anyone to use the app immediately without forced login. |
| `src/components/` | Reusable UI building blocks | Modular components that render tasks, modals, timers, and boards. |
| `server.ts` | The Express backend proxy for AI routes | Protects your `GEMINI_API_KEY` from being exposed in browser code. |
| `src/firebase/` | Firebase configuration and Firestore helper functions | Handles database reads/writes with owner-bound security paths. |

---

## 💡 Key Concepts Explained Simply

### 1. What is React Context? (`BoardContext.tsx`)
Instead of passing props through 5 levels of components (called "prop drilling"), `BoardContext` holds the master list of tasks and boards in one place. Any component can simply call:
```tsx
const { tasks, addNewTask, moveTask } = useBoard();
```

### 2. How Drag-and-Drop Works (`BoardView.tsx`)
TaskMan uses standard HTML5 Drag and Drop events:
1. `onDragStart`: Attaches the task's ID to `dataTransfer`.
2. `onDragOver`: Highlights the destination column.
3. `onDrop`: Grabs the task ID and calls `moveTask(taskId, newColumnId)`.

### 3. How AI Integration Works Safely (`server.ts`)
1. The frontend asks the backend: `POST /api/ai/breakdown { title: "Build website" }`.
2. `server.ts` takes the request, checks its local memory cache (to avoid duplicate costs), and queries **Google Gemini Flash-Lite**.
3. Gemini returns structured JSON (e.g. 3 subtasks with estimated minutes).
4. `server.ts` sends this back to the frontend, which updates the task state.
5. **Security Benefit**: The `GEMINI_API_KEY` never touches the user's browser.

---

## 🛠️ Step-by-Step: Adding a New Feature (Beginner Exercise)

Want to practice adding a custom feature? Try adding a **Task Tag / Label** (e.g., `"Frontend"`, `"Bug"`, `"Design"`):

### Step 1: Update the Type (`src/types.ts`)
Add `tags?: string[];` to the `Task` interface:
```typescript
export interface Task {
  id: string;
  title: string;
  tags?: string[]; // 👈 Add this line!
  // ...other existing properties
}
```

### Step 2: Display Tags in the Task Card (`src/components/TaskCard.tsx`)
Render small chips inside the card:
```tsx
{task.tags && task.tags.length > 0 && (
  <div className="flex flex-wrap gap-1 mt-2">
    {task.tags.map(tag => (
      <span key={tag} className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
        #{tag}
      </span>
    ))}
  </div>
)}
```

### Step 3: Add Tag Input to the Task Modal (`src/components/TaskModal.tsx`)
Add an input field for tags when creating or editing a task!

---

## ❓ Frequently Asked Questions (FAQ)

- **Q: Can I run this without a Gemini API key?**
  - **A: Yes!** `server.ts` includes intelligent algorithmic heuristics that generate smart subtasks and prioritization automatically if no API key is set.
- **Q: Where is my data saved if I don't sign in?**
  - **A: In your browser's `localStorage`.** Your boards and tasks will remain saved in your browser even if you refresh.
- **Q: How do I change the color themes?**
  - **A: Using Tailwind CSS classes.** The colors are defined in `src/components/BoardView.tsx` (e.g., `bg-indigo-500`, `bg-emerald-500`).
