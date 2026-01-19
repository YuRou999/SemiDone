import { invoke } from '@tauri-apps/api/core';
import type { Task, Settings, CreateTaskRequest, UpdateTaskRequest, TaskStats, ApiResponse } from '../types';
import * as localStorageApi from './localStorage';

// 检测Tauri是否可用
let isTauriAvailable = false;

try {
  // 尝试检测Tauri环境
  if (typeof window !== 'undefined' && (window as any).__TAURI__) {
    isTauriAvailable = true;
  }
} catch {
  isTauriAvailable = false;
}

// 如果Tauri不可用，使用localStorage API
if (!isTauriAvailable) {
  console.log('Tauri不可用，使用localStorage作为fallback存储');
}

// 待办相关API
export const taskApi = {
  // 获取所有待办
  async getTasks(): Promise<ApiResponse<Task[]>> {
    if (isTauriAvailable) {
      try {
        return await invoke('get_tasks');
      } catch (error) {
        console.warn('Tauri API调用失败，使用localStorage fallback:', error);
        return await localStorageApi.taskApi.getTasks();
      }
    }
    return await localStorageApi.taskApi.getTasks();
  },

  // 创建新待办
  async createTask(request: CreateTaskRequest): Promise<ApiResponse<Task>> {
    if (isTauriAvailable) {
      try {
        return await invoke('create_task', { request });
      } catch (error) {
        console.warn('Tauri API调用失败，使用localStorage fallback:', error);
        return await localStorageApi.taskApi.createTask(request);
      }
    }
    return await localStorageApi.taskApi.createTask(request);
  },

  // 更新待办
  async updateTask(id: string, updates: UpdateTaskRequest): Promise<ApiResponse<Task | null>> {
    if (isTauriAvailable) {
      try {
        return await invoke('update_task', { id, updates });
      } catch (error) {
        console.warn('Tauri API调用失败，使用localStorage fallback:', error);
        return await localStorageApi.taskApi.updateTask(id, updates);
      }
    }
    return await localStorageApi.taskApi.updateTask(id, updates);
  },

  // 删除待办
  async deleteTask(id: string): Promise<ApiResponse<boolean>> {
    if (isTauriAvailable) {
      try {
        return await invoke('delete_task', { id });
      } catch (error) {
        console.warn('Tauri API调用失败，使用localStorage fallback:', error);
        return await localStorageApi.taskApi.deleteTask(id);
      }
    }
    return await localStorageApi.taskApi.deleteTask(id);
  },

  // 获取待办统计
  async getTaskStats(): Promise<ApiResponse<TaskStats>> {
    if (isTauriAvailable) {
      try {
        return await invoke('get_task_stats');
      } catch (error) {
        console.warn('Tauri API调用失败，使用localStorage fallback:', error);
        return await localStorageApi.taskApi.getTaskStats();
      }
    }
    return await localStorageApi.taskApi.getTaskStats();
  },
};

// 设置相关API
export const settingsApi = {
  // 获取设置
  async getSettings(): Promise<ApiResponse<Settings>> {
    if (isTauriAvailable) {
      try {
        return await invoke('get_settings');
      } catch (error) {
        console.warn('Tauri API调用失败，使用localStorage fallback:', error);
        return await localStorageApi.settingsApi.getSettings();
      }
    }
    return await localStorageApi.settingsApi.getSettings();
  },

  // 更新设置
  async updateSettings(settings: Settings): Promise<ApiResponse<boolean>> {
    if (isTauriAvailable) {
      try {
        return await invoke('update_settings', { settings });
      } catch (error) {
        console.warn('Tauri API调用失败，使用localStorage fallback:', error);
        return await localStorageApi.settingsApi.updateSettings(settings);
      }
    }
    return await localStorageApi.settingsApi.updateSettings(settings);
  },
};

// 数据管理API
export const dataApi = {
  // 导出数据
  async exportData(): Promise<ApiResponse<string>> {
    if (isTauriAvailable) {
      try {
        return await invoke('export_data');
      } catch (error) {
        console.warn('Tauri API调用失败，使用localStorage fallback:', error);
        return await localStorageApi.dataApi.exportData();
      }
    }
    return await localStorageApi.dataApi.exportData();
  },

  // 导入数据
  async importData(jsonData: string): Promise<ApiResponse<boolean>> {
    if (isTauriAvailable) {
      try {
        return await invoke('import_data', { jsonData });
      } catch (error) {
        console.warn('Tauri API调用失败，使用localStorage fallback:', error);
        return await localStorageApi.dataApi.importData(jsonData);
      }
    }
    return await localStorageApi.dataApi.importData(jsonData);
  },

  // 清空所有数据
  async clearAllData(): Promise<ApiResponse<boolean>> {
    if (isTauriAvailable) {
      try {
        return await invoke('clear_all_data');
      } catch (error) {
        console.warn('Tauri API调用失败，使用localStorage fallback:', error);
        return await localStorageApi.dataApi.clearAllData();
      }
    }
    return await localStorageApi.dataApi.clearAllData();
  },
};

// 统一的API对象
export const api = {
  tasks: taskApi,
  settings: settingsApi,
  data: dataApi,
};

export default api;