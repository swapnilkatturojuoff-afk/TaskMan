import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from './config';

export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
};

export function handleFirestoreError(error, operationType, path) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notification:', JSON.stringify(errInfo));
  return errInfo;
}

export function sanitizePayload(obj) {
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    return value === undefined ? null : value;
  }));
}

export async function getUserProfile(userId) {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    const local = localStorage.getItem(`taskmaster_user_${userId}`);
    return local ? JSON.parse(local) : null;
  }
}

export async function saveUserProfile(profile) {
  const path = `users/${profile.uid}`;
  const cleanData = sanitizePayload(profile);
  try {
    const docRef = doc(db, 'users', profile.uid);
    await setDoc(docRef, cleanData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
  localStorage.setItem(`taskmaster_user_${profile.uid}`, JSON.stringify(cleanData));
}

export async function getBoards(userId) {
  const path = `users/${userId}/boards`;
  try {
    const boardsRef = collection(db, 'users', userId, 'boards');
    const q = query(boardsRef, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    const boards = [];
    snapshot.forEach(docSnap => {
      boards.push({ id: docSnap.id, ...docSnap.data() });
    });
    return boards;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    const local = localStorage.getItem(`taskmaster_boards_${userId}`);
    return local ? JSON.parse(local) : [];
  }
}

export function subscribeBoards(userId, callback) {
  const path = `users/${userId}/boards`;
  try {
    const boardsRef = collection(db, 'users', userId, 'boards');
    const q = query(boardsRef, orderBy('createdAt', 'asc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const boards = [];
        snapshot.forEach(docSnap => {
          boards.push({ id: docSnap.id, ...docSnap.data() });
        });
        localStorage.setItem(`taskmaster_boards_${userId}`, JSON.stringify(boards));
        callback(boards);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        const local = localStorage.getItem(`taskmaster_boards_${userId}`);
        if (local) callback(JSON.parse(local));
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    const local = localStorage.getItem(`taskmaster_boards_${userId}`);
    if (local) callback(JSON.parse(local));
    return () => {};
  }
}

export async function createBoard(userId, board) {
  const path = `users/${userId}/boards/${board.id}`;
  const cleanData = sanitizePayload(board);
  try {
    const docRef = doc(db, 'users', userId, 'boards', board.id);
    await setDoc(docRef, cleanData);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  const local = localStorage.getItem(`taskmaster_boards_${userId}`);
  const boards = local ? JSON.parse(local) : [];
  const updated = [...boards.filter(b => b.id !== board.id), cleanData];
  localStorage.setItem(`taskmaster_boards_${userId}`, JSON.stringify(updated));
}

export async function updateBoard(userId, boardId, updates) {
  const path = `users/${userId}/boards/${boardId}`;
  const cleanData = sanitizePayload({
    ...updates,
    updatedAt: new Date().toISOString()
  });
  try {
    const docRef = doc(db, 'users', userId, 'boards', boardId);
    await updateDoc(docRef, cleanData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }

  const local = localStorage.getItem(`taskmaster_boards_${userId}`);
  if (local) {
    const boards = JSON.parse(local);
    const updated = boards.map(b => b.id === boardId ? { ...b, ...cleanData } : b);
    localStorage.setItem(`taskmaster_boards_${userId}`, JSON.stringify(updated));
  }
}

export async function deleteBoard(userId, boardId) {
  const path = `users/${userId}/boards/${boardId}`;
  try {
    const docRef = doc(db, 'users', userId, 'boards', boardId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }

  const local = localStorage.getItem(`taskmaster_boards_${userId}`);
  if (local) {
    const boards = JSON.parse(local);
    const updated = boards.filter(b => b.id !== boardId);
    localStorage.setItem(`taskmaster_boards_${userId}`, JSON.stringify(updated));
  }
  localStorage.removeItem(`taskmaster_tasks_${userId}_${boardId}`);
}

export function subscribeTasks(userId, boardId, callback) {
  const path = `users/${userId}/boards/${boardId}/tasks`;
  try {
    const tasksRef = collection(db, 'users', userId, 'boards', boardId, 'tasks');
    const q = query(tasksRef, orderBy('order', 'asc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const tasks = [];
        snapshot.forEach(docSnap => {
          tasks.push({ id: docSnap.id, ...docSnap.data() });
        });
        localStorage.setItem(`taskmaster_tasks_${userId}_${boardId}`, JSON.stringify(tasks));
        callback(tasks);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        const local = localStorage.getItem(`taskmaster_tasks_${userId}_${boardId}`);
        if (local) callback(JSON.parse(local));
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    const local = localStorage.getItem(`taskmaster_tasks_${userId}_${boardId}`);
    if (local) callback(JSON.parse(local));
    return () => {};
  }
}

export async function createTask(userId, boardId, task) {
  const path = `users/${userId}/boards/${boardId}/tasks/${task.id}`;
  const cleanData = sanitizePayload(task);
  try {
    const docRef = doc(db, 'users', userId, 'boards', boardId, 'tasks', task.id);
    await setDoc(docRef, cleanData);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  const local = localStorage.getItem(`taskmaster_tasks_${userId}_${boardId}`);
  const tasks = local ? JSON.parse(local) : [];
  const updated = [...tasks.filter(t => t.id !== task.id), cleanData];
  localStorage.setItem(`taskmaster_tasks_${userId}_${boardId}`, JSON.stringify(updated));
}

export async function updateTask(userId, boardId, taskId, updates) {
  const path = `users/${userId}/boards/${boardId}/tasks/${taskId}`;
  const cleanData = sanitizePayload({
    ...updates,
    updatedAt: new Date().toISOString()
  });
  try {
    const docRef = doc(db, 'users', userId, 'boards', boardId, 'tasks', taskId);
    await updateDoc(docRef, cleanData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }

  const local = localStorage.getItem(`taskmaster_tasks_${userId}_${boardId}`);
  if (local) {
    const tasks = JSON.parse(local);
    const updated = tasks.map(t => t.id === taskId ? { ...t, ...cleanData } : t);
    localStorage.setItem(`taskmaster_tasks_${userId}_${boardId}`, JSON.stringify(updated));
  }
}

export async function deleteTask(userId, boardId, taskId) {
  const path = `users/${userId}/boards/${boardId}/tasks/${taskId}`;
  try {
    const docRef = doc(db, 'users', userId, 'boards', boardId, 'tasks', taskId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }

  const local = localStorage.getItem(`taskmaster_tasks_${userId}_${boardId}`);
  if (local) {
    const tasks = JSON.parse(local);
    const updated = tasks.filter(t => t.id !== taskId);
    localStorage.setItem(`taskmaster_tasks_${userId}_${boardId}`, JSON.stringify(updated));
  }
}

export async function batchUpdateTasks(userId, boardId, tasksToUpdate) {
  for (const task of tasksToUpdate) {
    await updateTask(userId, boardId, task.id, task);
  }
}
