import { useState, useEffect, useCallback } from 'react';
import { getTasks, createTask, updateTask, deleteTask, reorderTask } from '../api/client';

export function useTasks(projectId) {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchTasks = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const res = await getTasks(projectId);
      setTasks(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const addTask = useCallback(async (data) => {
    const res = await createTask({ ...data, project_id: projectId });
    setTasks((prev) => [...prev, res.data]);
    return res.data;
  }, [projectId]);

  const editTask = useCallback(async (id, data) => {
    const res = await updateTask(id, data);
    setTasks((prev) => prev.map((t) => (t.id === id ? res.data : t)));
    return res.data;
  }, []);

  const removeTask = useCallback(async (id) => {
    await deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Optimistic drag-drop reorder: update locally, sync to server
  const moveTask = useCallback(async (id, newStatus, newOrder) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: newStatus, sort_order: newOrder } : t
      )
    );
    try {
      await reorderTask(id, { status: newStatus, sort_order: newOrder });
    } catch {
      fetchTasks(); // rollback on failure
    }
  }, [fetchTasks]);

  return { tasks, loading, error, addTask, editTask, removeTask, moveTask, refetch: fetchTasks };
}
