import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CheckCircle, Clock, AlertTriangle, Calendar, TrendingUp, Settings, Search } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { useSettingsStore } from '../store/settingsStore';
import type { TaskFilter as TaskFilterType } from '../types';
import TaskItem from '../components/TaskItem';
import TaskStats from '../components/TaskStats';
import TaskFilter from '../components/TaskFilter';
import QuickAddTask from '../components/QuickAddTask';
import UserProfile from '../components/UserProfile';
import CelebrationAnimation from '../components/CelebrationAnimation';
import UsageButton from '../components/UsageButton';

export default function Home() {
  const navigate = useNavigate();
  const { 
    filteredTasks, 
    loading, 
    filter, 
    searchQuery,
    loadTasks,
    celebration,
    hideCelebration
  } = useTaskStore();
  
  const { settings, loadSettings } = useSettingsStore();
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  useEffect(() => {
    loadSettings();
    loadTasks();
  }, [loadSettings, loadTasks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getEmptyStateMessage = () => {
    if (searchQuery) {
      return `没有找到包含 "${searchQuery}" 的待办`;
    }
    
    switch (filter) {
      case 'completed':
        return '还没有完成的待办';
      case 'pending':
        return '没有待完成的待办';
      case 'overdue':
        return '没有逾期的待办';
      case 'today':
        return '今天没有到期的待办';
      default:
        return settings.theme === 'light' ? '暂无待办，点击添加新待办' : '还没有待办哦，要不要添加一个？';
    }
  };

  const getEmptyStateIcon = () => {
    if (settings.theme === 'pink') {
      return '🌸';
    }
    return '📋';
  };

  return (
    <div className="flex flex-col h-full p-2 bg-transparent text-foreground">
      {/* Stats */}
      <div className="flex-shrink-0 mb-2">
        <TaskStats />
      </div>

      {/* Usage Button */}
      <div className="flex-shrink-0 mb-2">
        <UsageButton />
      </div>

      {/* Search and Add Task Row */}
      <div className="flex-shrink-0 flex gap-2 mb-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={settings.theme === 'light' ? '搜索待办...' : '搜索待办...'}
            value={searchQuery}
            onChange={(e) => useTaskStore.getState().setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => useTaskStore.getState().setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <button
          onClick={() => setShowQuickAdd(true)}
          className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center space-x-1 shadow-sm text-sm flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{settings.theme === 'pink' ? '新建待办' : '添加待办'}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex-shrink-0 mb-2">
        <TaskFilter />
      </div>

      {/* Task List */}
      <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30 pr-1">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">{getEmptyStateIcon()}</div>
            <p className="text-muted-foreground mb-3">
              {getEmptyStateMessage()}
            </p>
            {!searchQuery && filter === 'all' && (
              <button
                onClick={() => setShowQuickAdd(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm text-sm"
              >
                {settings.theme === 'light' ? '创建第一个待办' : '开始添加待办吧'}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>

      {/* 快速添加待办弹窗 */}
      {showQuickAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg">
            <QuickAddTask onClose={() => setShowQuickAdd(false)} />
          </div>
        </div>
      )}

      {/* 庆祝动画 */}
      <CelebrationAnimation 
        show={celebration.show}
        message={celebration.message}
        onComplete={hideCelebration}
        isAllComplete={celebration.isAllComplete}
      />

    </div>
  );
}

function getEmptyStateTitle(filter: TaskFilterType): string {
  switch (filter) {
    case 'pending':
      return '没有待办待办';
    case 'completed':
      return '没有已完成待办';
    case 'overdue':
      return '没有逾期待办';
    case 'today':
      return '今天没有待办';
    default:
      return '还没有待办';
  }
}

function getEmptyStateDescription(filter: TaskFilterType): string {
  switch (filter) {
    case 'pending':
      return '所有待办都已完成，干得漂亮！';
    case 'completed':
      return '还没有完成任何待办，加油！';
    case 'overdue':
      return '没有逾期待办，时间管理很棒！';
    case 'today':
      return '今天可以休息一下了';
    default:
      return '开始创建你的第一个待办吧';
  }
}