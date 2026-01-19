import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Task, TaskStats, CreateTaskRequest, UpdateTaskRequest, TaskFilter, Priority } from '../types';
import { api } from '../api/tauri';
import { toast } from 'sonner';

interface TaskState {
  // 状态
  tasks: Task[];
  stats: TaskStats;
  loading: boolean;
  filter: TaskFilter;
  searchQuery: string;
  selectedTask: Task | null;
  filteredTasks: Task[];
  celebration: {
    show: boolean;
    message: string;
    isAllComplete: boolean;
  };
  editingTaskId: string | null;
  
  // 操作
  loadTasks: () => Promise<void>;
  createTask: (request: CreateTaskRequest) => Promise<void>;
  updateTask: (id: string, updates: UpdateTaskRequest) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskComplete: (id: string) => Promise<void>;
  setFilter: (filter: TaskFilter) => void;
  setSearchQuery: (query: string) => void;
  setSelectedTask: (task: Task | null) => void;
  refreshStats: () => Promise<void>;
  showCelebration: (message: string, isAllComplete?: boolean) => void;
  hideCelebration: () => void;
  setEditingTaskId: (id: string | null) => void;
}

// 计算过滤后的待办列表
const getFilteredTasks = (tasks: Task[], filter: TaskFilter, searchQuery: string): Task[] => {
  let filtered = tasks;
  
  // 按状态筛选
  switch (filter) {
    case 'pending':
      filtered = tasks.filter(task => !task.completed);
      break;
    case 'completed':
      filtered = tasks.filter(task => task.completed);
      break;
    case 'overdue':
      filtered = tasks.filter(task => {
        if (task.completed || !task.dueDate) return false;
        return new Date(task.dueDate) < new Date();
      });
      break;
    case 'today':
      filtered = tasks.filter(task => {
        if (!task.dueDate) return false;
        const today = new Date().toDateString();
        return new Date(task.dueDate).toDateString() === today;
      });
      break;
    default:
      filtered = tasks;
  }
  
  // 按搜索关键词筛选
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(task => 
      task.title.toLowerCase().includes(query) ||
      (task.description && task.description.toLowerCase().includes(query))
    );
  }
  
  // 排序：未完成的在前，按优先级和创建时间排序
  return filtered.sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    
    // 按优先级排序
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const aPriority = priorityOrder[a.priority || 'medium'];
    const bPriority = priorityOrder[b.priority || 'medium'];
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }
    
    // 按创建时间排序
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};

export const useTaskStore = create<TaskState>()(devtools(
  (set, get) => ({
    // 初始状态
    tasks: [],
    stats: {
      total: 0,
      completed: 0,
      pending: 0,
      overdue: 0,
    },
    loading: false,
    filter: 'pending',
    searchQuery: '',
    selectedTask: null,
    filteredTasks: [],
    celebration: {
      show: false,
      message: '',
      isAllComplete: false
    },
    editingTaskId: null,
    
    // 操作
    loadTasks: async () => {
      set({ loading: true });
      try {
        const response = await api.tasks.getTasks();
        if (response.success) {
          const state = get();
          const filteredTasks = getFilteredTasks(response.data, state.filter, state.searchQuery);
          set({ tasks: response.data, filteredTasks });
          get().refreshStats();
        } else {
          toast.error(response.error || '加载待办失败');
        }
      } catch (error) {
        console.error('Load tasks error:', error);
        toast.error('加载待办失败');
      } finally {
        set({ loading: false });
      }
    },
    
    createTask: async (request: CreateTaskRequest) => {
      try {
        const response = await api.tasks.createTask(request);
        if (response.success) {
          set(state => {
            const newTasks = [...state.tasks, response.data];
            const filteredTasks = getFilteredTasks(newTasks, state.filter, state.searchQuery);
            return { tasks: newTasks, filteredTasks };
          });
          get().refreshStats();
          toast.success('待办创建成功');
        } else {
          toast.error(response.error || '创建待办失败');
        }
      } catch (error) {
        console.error('Create task error:', error);
        toast.error('创建待办失败');
      }
    },
    
    updateTask: async (id: string, updates: UpdateTaskRequest) => {
      try {
        const response = await api.tasks.updateTask(id, updates);
        if (response.success && response.data) {
          set(state => {
            const newTasks = state.tasks.map(task => 
              task.id === id ? response.data! : task
            );
            const filteredTasks = getFilteredTasks(newTasks, state.filter, state.searchQuery);
            return { tasks: newTasks, filteredTasks };
          });
          get().refreshStats();
          toast.success('待办更新成功');
        } else {
          toast.error(response.error || '更新待办失败');
        }
      } catch (error) {
        console.error('Update task error:', error);
        toast.error('更新待办失败');
      }
    },
    
    deleteTask: async (id: string) => {
      try {
        const response = await api.tasks.deleteTask(id);
        if (response.success) {
          set(state => {
            const newTasks = state.tasks.filter(task => task.id !== id);
            const filteredTasks = getFilteredTasks(newTasks, state.filter, state.searchQuery);
            return {
              tasks: newTasks,
              filteredTasks,
              selectedTask: state.selectedTask?.id === id ? null : state.selectedTask
            };
          });
          get().refreshStats();
          toast.success('待办删除成功');
        } else {
          toast.error(response.error || '删除待办失败');
        }
      } catch (error) {
        console.error('Delete task error:', error);
        toast.error('删除待办失败');
      }
    },
    
    toggleTaskComplete: async (id: string) => {
      const task = get().tasks.find(t => t.id === id);
      if (!task) return;
      
      const wasCompleted = task.completed;
      await get().updateTask(id, { completed: !task.completed });
      
      // Show celebration when completing a task
      if (!wasCompleted) {
        // Check if this will be the last task to complete
        const currentTasks = get().tasks;
        const pendingTasks = currentTasks.filter(t => !t.completed && t.id !== id);
        
        if (pendingTasks.length === 0 && currentTasks.length > 0) {
          // This is the last task - show only all complete animation
          get().showCelebration('🏅 恭喜！所有待办都完成了！🏅', true);
        } else {
          // Regular task completion
          const celebrationMessages = [
            '太棒了！又完成一个待办 🎉',
            '干得漂亮！继续保持 ✨',
            '待办完成！你真厉害 🌟',
            '又一个目标达成！👏',
            '完成得很好！加油 💪',
            '高效收尾！待办清单又轻了一步 📉',
            '待办搞定！离目标又近一截 🚀',
            '利落完成！这份执行力超赞 👍',
            '又清一项！节奏把握得刚刚好 ⏱️'
          ];
          const randomMessage = celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)];
          get().showCelebration(randomMessage);
        }
      }
    },
    
    setFilter: (filter: TaskFilter) => {
      set(state => {
        const filteredTasks = getFilteredTasks(state.tasks, filter, state.searchQuery);
        return { filter, filteredTasks };
      });
    },
    
    setSearchQuery: (searchQuery: string) => {
      set(state => {
        const filteredTasks = getFilteredTasks(state.tasks, state.filter, searchQuery);
        return { searchQuery, filteredTasks };
      });
    },
    
    setSelectedTask: (selectedTask: Task | null) => {
      set({ selectedTask });
    },
    
    refreshStats: async () => {
      try {
        const response = await api.tasks.getTaskStats();
        if (response.success) {
          set({ stats: response.data });
        }
      } catch (error) {
        console.error('Refresh stats error:', error);
      }
    },

    showCelebration: (message: string, isAllComplete = false) => {
      set({ celebration: { show: true, message, isAllComplete } });
    },

    hideCelebration: () => {
      set({ celebration: { show: false, message: '', isAllComplete: false } });
    },

    setEditingTaskId: (editingTaskId: string | null) => {
      set({ editingTaskId });
    },
  }),
  {
    name: 'task-store',
  }
));