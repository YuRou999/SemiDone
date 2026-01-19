import React from 'react';
import { Search, Filter, CheckCircle, Circle, Clock, AlertTriangle } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { useSettingsStore } from '../store/settingsStore';
import type { TaskFilter as TaskFilterType } from '../types';

export default function TaskFilter() {
  const { filter, searchQuery, setFilter, setSearchQuery, stats } = useTaskStore();
  const { settings } = useSettingsStore();

  const filterOptions: { value: TaskFilterType; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      value: 'all',
      label: '全部',
      icon: <Filter className="w-4 h-4" />,
      count: stats.total
    },
    {
      value: 'pending',
      label: '待完成',
      icon: <Circle className="w-4 h-4" />,
      count: stats.pending
    },
    {
      value: 'today',
      label: '今日到期',
      icon: <Clock className="w-4 h-4" />,
      count: stats.today
    },
    {
      value: 'overdue',
      label: '已逾期',
      icon: <AlertTriangle className="w-4 h-4" />,
      count: stats.overdue
    },
    {
      value: 'completed',
      label: '已完成',
      icon: <CheckCircle className="w-4 h-4" />,
      count: stats.completed
    }
  ];

  const getFilterButtonClass = (filterValue: TaskFilterType) => {
    const isActive = filter === filterValue;
    const baseClass = "flex items-center space-x-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200";
    
    if (isActive) {
      return `${baseClass} bg-primary text-primary-foreground shadow-sm`;
    }
    
    return `${baseClass} text-muted-foreground hover:text-foreground hover:bg-muted`;
  };

  const getCountBadgeClass = (filterValue: TaskFilterType, count: number) => {
    if (count === 0) return "hidden";
    
    const isActive = filter === filterValue;
    
    if (isActive) {
      return "ml-1 px-1.5 py-0.5 bg-primary-foreground/20 text-primary-foreground text-xs rounded-full";
    }
    
    // 特殊颜色处理
    if (filterValue === 'overdue' && count > 0) {
      return "ml-1 px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded-full";
    }
    
    if (filterValue === 'today' && count > 0) {
      return "ml-1 px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full";
    }
    
    return "ml-1 px-1.5 py-0.5 bg-muted text-muted-foreground text-xs rounded-full";
  };

  return (
    <div className="space-y-2">
      {/* 筛选按钮 */}
      <div className="flex flex-wrap gap-1">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={getFilterButtonClass(option.value)}
          >
            <span className="flex items-center">
              {option.icon}
              <span className="ml-1.5">{option.label}</span>
            </span>
            
            {option.count !== undefined && (
              <span className={getCountBadgeClass(option.value, option.count)}>
                {option.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 搜索结果提示 */}
      {searchQuery && (
        <div className="text-sm text-muted-foreground">
          搜索 "{searchQuery}" 的结果
        </div>
      )}

      {/* 筛选结果统计 */}
      {filter !== 'all' && (
        <div className="text-sm text-muted-foreground">
          {filterOptions.find(opt => opt.value === filter)?.label} · {filterOptions.find(opt => opt.value === filter)?.count || 0} 个待办
        </div>
      )}
    </div>
  );
}