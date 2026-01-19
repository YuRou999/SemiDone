import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, BarChart3, TrendingUp, Trophy } from 'lucide-react';
import { useUsageStore } from '../store/usageStore';

interface UsageDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UsageDetailsModal({ isOpen, onClose }: UsageDetailsModalProps) {
  const { stats, getUsageDetails, formatMinutes, loadUsageData } = useUsageStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
  const [usageDetails, setUsageDetails] = useState<ReturnType<typeof getUsageDetails>>([]);

  useEffect(() => {
    if (isOpen) {
      loadUsageData();
      const details = getUsageDetails(selectedPeriod === 'week' ? 7 : 30);
      setUsageDetails(details);
    }
  }, [isOpen, selectedPeriod, getUsageDetails, loadUsageData]);

  if (!isOpen) return null;

  const totalDaysWithUsage = usageDetails.filter(d => d.totalMinutes > 0).length;
  const averageUsage = totalDaysWithUsage > 0 
    ? Math.round(usageDetails.reduce((sum, d) => sum + d.totalMinutes, 0) / totalDaysWithUsage)
    : 0;
  const maxDayUsage = Math.max(...usageDetails.map(d => d.totalMinutes), 0);
  const totalSessions = usageDetails.reduce((sum, d) => sum + d.sessions, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">使用详情统计</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 时间期间选择 */}
          <div className="flex items-center gap-4">
            <div className="flex bg-accent rounded-lg p-1">
              <button
                onClick={() => setSelectedPeriod('week')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedPeriod === 'week' 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                最近7天
              </button>
              <button
                onClick={() => setSelectedPeriod('month')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedPeriod === 'month' 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                最近30天
              </button>
            </div>
          </div>

          {/* 总览统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">今日使用</span>
              </div>
              <div className="text-2xl font-bold text-blue-700">{formatMinutes(stats.today)}</div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">平均每日</span>
              </div>
              <div className="text-2xl font-bold text-green-700">{formatMinutes(averageUsage)}</div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">最高单日</span>
              </div>
              <div className="text-2xl font-bold text-purple-700">{formatMinutes(maxDayUsage)}</div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-600">总会话数</span>
              </div>
              <div className="text-2xl font-bold text-orange-700">{totalSessions}</div>
            </div>
          </div>

          {/* 使用趋势图表 */}
          <div className="bg-accent/30 rounded-lg p-4">
            <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              使用趋势
            </h3>
            
            <div className="space-y-2">
              {usageDetails.slice().reverse().map((detail, index) => {
                const date = new Date(detail.date);
                const isToday = detail.date === new Date().toISOString().split('T')[0];
                const percentage = maxDayUsage > 0 ? (detail.totalMinutes / maxDayUsage) * 100 : 0;
                
                return (
                  <div key={detail.date} className="flex items-center gap-4 py-2">
                    <div className="w-20 text-sm text-muted-foreground">
                      {isToday ? '今天' : `${date.getMonth() + 1}/${date.getDate()}`}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            detail.totalMinutes > 0 ? 'bg-blue-500' : 'bg-gray-200'
                          }`}
                          style={{ width: `${Math.max(percentage, 2)}%` }}
                        />
                        <span className="text-sm font-medium text-foreground min-w-0">
                          {formatMinutes(detail.totalMinutes)}
                        </span>
                      </div>
                      
                      {detail.sessions > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {detail.sessions} 次会话
                          {detail.firstUse && detail.lastUse && (
                            <span className="ml-2">
                              {detail.firstUse} - {detail.lastUse}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 使用习惯分析 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-background border border-border rounded-lg p-4">
              <h3 className="font-medium text-foreground mb-3">使用习惯</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">活跃天数:</span>
                  <span className="font-medium">{totalDaysWithUsage}/{selectedPeriod === 'week' ? 7 : 30} 天</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">最长会话:</span>
                  <span className="font-medium">{formatMinutes(stats.longestSession)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">会话平均:</span>
                  <span className="font-medium">
                    {totalSessions > 0 ? formatMinutes(Math.round(usageDetails.reduce((sum, d) => sum + d.totalMinutes, 0) / totalSessions)) : '0 分钟'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-background border border-border rounded-lg p-4">
              <h3 className="font-medium text-foreground mb-3">效率指标</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">使用一致性:</span>
                  <span className="font-medium">
                    {totalDaysWithUsage > 0 ? `${Math.round((totalDaysWithUsage / (selectedPeriod === 'week' ? 7 : 30)) * 100)}%` : '0%'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">专注程度:</span>
                  <span className="font-medium">
                    {stats.longestSession >= 60 ? '高' : stats.longestSession >= 30 ? '中' : '低'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">使用频率:</span>
                  <span className="font-medium">
                    {totalSessions >= 20 ? '频繁' : totalSessions >= 10 ? '适中' : '较少'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 建议和提示 */}
          {totalDaysWithUsage > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">💡 使用建议</h3>
              <div className="text-sm text-blue-700 space-y-1">
                {averageUsage < 30 && (
                  <div>• 可以尝试增加每日使用时长，养成良好的任务管理习惯</div>
                )}
                {stats.longestSession < 25 && (
                  <div>• 建议尝试番茄钟功能，提高专注时长</div>
                )}
                {totalDaysWithUsage < (selectedPeriod === 'week' ? 5 : 20) && (
                  <div>• 保持每日使用，让效率工具真正帮助您的工作生活</div>
                )}
                {averageUsage >= 60 && (
                  <div>• 很好的使用习惯！您已经充分利用了这个效率工具</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
