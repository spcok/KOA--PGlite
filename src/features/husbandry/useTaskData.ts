import { useLiveQuery } from '@electric-sql/pglite-react';
import { Task } from '../../types';
import { tasksCollection } from '../../lib/database';

export const useTaskData = () => {
  const res = useLiveQuery(`SELECT * FROM tasks ORDER BY due_date ASC;`);

  return { 
    data: res?.rows || [],
    tasks: (res?.rows || []).filter((t: any) => !t.is_deleted), 
    isLoading: res === undefined,
    isError: !!res?.error,
    error: res?.error || null,
    addTask: async (newTask: Partial<Task>) => {
      const task = { ...newTask, id: newTask.id || crypto.randomUUID(), isDeleted: false };
      await tasksCollection.insert(task);
    }, 
    completeTask: async (taskId: string) => {
      await tasksCollection.update(taskId, { completed: true });
    },
    deleteTask: async (taskId: string) => {
      await tasksCollection.delete(taskId);
    }
  };
};
