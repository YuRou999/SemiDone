import React, { useEffect } from 'react';
import { Clock, Timer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUsageStore } from '../store/usageStore';

export default function UsageButton() {
  const navigate = useNavigate();
  const {
    stats,
    isTrackingEnabled,
    formatMinutes,
    loadUsageData,
    calculateStats,
    pomodoro,
    formatTime
  } = useUsageStore();

  useEffect(() => {
    loadUsageData();
    calculateStats();
    
    // 每分钟更新一次
    const interval = setInterval(() => {
      calculateStats();
    }, 60000);

    return () => clearInterval(interval);
  }, [loadUsageData, calculateStats]);

  // 番茄钟状态变化时强制更新
  useEffect(() => {
    // 这个effect确保番茄钟状态变化时组件重新渲染
  }, [pomodoro.isActive, pomodoro.timeLeft, pomodoro.currentMode]);

  const handleClick = () => {
    navigate('/usage-stats');
  };

  const getModeText = () => {
    switch (pomodoro.currentMode) {
      case 'work': return '专注时间';
      case 'break': return '短休息';
      case 'longBreak': return '长休息';
      default: return '待开始';
    }
  };

  const getModeColor = () => {
    switch (pomodoro.currentMode) {
      case 'work': return 'text-blue-600 bg-blue-50';
      case 'break': return 'text-green-600 bg-green-50';
      case 'longBreak': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // 番茄钟启动时显示聚焦模式
  if (pomodoro.isActive) {
    return (
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg hover:bg-accent transition-colors shadow-sm text-sm w-full"
        title="番茄钟聚焦模式 - 点击查看详情"
      >
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <Timer className="w-4 h-4 text-red-500" />
        </div>
        
        <div className="flex-1 text-left">
          <div className="font-medium text-foreground flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${getModeColor()}`}>
              {getModeText()}
            </span>
            <span className="font-mono text-lg">
              {formatTime(pomodoro.timeLeft)}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            第 {pomodoro.cycle + 1} 个番茄钟 | 聚焦模式
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-xs text-muted-foreground">🍅</div>
        </div>
      </button>
    );
  }

  // 普通模式显示使用时长
  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg hover:bg-accent transition-colors shadow-sm text-sm w-full"
      title="查看使用时长统计"
    >
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${
          isTrackingEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
        }`} />
        <Clock className="w-4 h-4 text-muted-foreground" />
      </div>
      
      <div className="flex-1 text-left">
        <div className="font-medium text-foreground">
          今日: {formatMinutes(stats.today)}
        </div>
        <div className="text-xs text-muted-foreground">
          {isTrackingEnabled ? '正在记录' : '未启动'} | 点击查看详情
        </div>
      </div>
      
      <Timer className="w-4 h-4 text-muted-foreground" />
    </button>
  );
}
