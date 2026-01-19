import React, { useEffect, useState } from 'react';
import { ArrowLeft, Clock, Timer, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUsageStore } from '../store/usageStore';
import UsageTimer from '../components/UsageTimer';
import UsageChart from '../components/UsageChart';

export default function UsageStats() {
  const navigate = useNavigate();
  const {
    stats,
    formatMinutes,
    loadUsageData,
    calculateStats,
    isTrackingEnabled
  } = useUsageStore();

  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  useEffect(() => {
    loadUsageData();
    calculateStats();

    // 每分钟更新一次
    const interval = setInterval(() => {
      calculateStats();
    }, 60000);

    return () => clearInterval(interval);
  }, [loadUsageData, calculateStats]);

  const getUsageHistory = () => {
    const weekData = JSON.parse(localStorage.getItem('weekly_usage') || '{}');
    const monthData = JSON.parse(localStorage.getItem('monthly_usage') || '{}');

    if (selectedPeriod === 'week') {
      const result = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        result.push({
          date: dateStr,
          minutes: weekData[dateStr] || 0,
          dayName: date.toLocaleDateString('zh-CN', { weekday: 'short' })
        });
      }
      return result;
    } else {
      // 月视图显示整个月的数据
      const result = [];
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = date.toISOString().split('T')[0];
        result.push({
          date: dateStr,
          minutes: monthData[dateStr] || 0
        });
      }
      return result;
    }
  };

  const usageHistory = getUsageHistory();
  const maxMinutes = Math.max(...usageHistory.map(h => h.minutes), 1);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 返回按钮 */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>返回</span>
        </button>

        {/* 页面标题 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">使用时长统计</h1>
          <p className="text-sm text-muted-foreground">
            追踪您的应用使用习惯，提升效率管理
          </p>
        </div>

        {/* 番茄钟组件 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">

            <UsageTimer />
          </div>
          {/* 统计概览 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                使用概览
              </h2>
              {/* 状态指示灯移到标题旁，更节省空间 */}
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-medium ${isTrackingEnabled
                  ? 'bg-green-50 border-green-100 text-green-600'
                  : 'bg-gray-50 border-gray-100 text-gray-500'
                }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isTrackingEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                  }`} />
                {isTrackingEnabled ? '记录中' : '静止'}
              </div>
            </div>

            {/* 改为 4 列布局，更加扁平化 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 今日使用 */}
              <div className="bg-blue-50/50 hover:bg-blue-50 transition-colors border border-blue-100/50 rounded-xl p-3">
                <p className="text-[11px] font-bold text-blue-600/80 uppercase tracking-tight mb-1">今日</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-blue-700">{formatMinutes(stats.today)}</span>
                </div>
              </div>

              {/* 平均每日 */}
              <div className="bg-green-50/50 hover:bg-green-50 transition-colors border border-green-100/50 rounded-xl p-3">
                <p className="text-[11px] font-bold text-green-600/80 uppercase tracking-tight mb-1">日均</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-green-700">{formatMinutes(stats.averageDaily)}</span>
                </div>
              </div>

              {/* 本周总计 */}
              <div className="bg-purple-50/50 hover:bg-purple-50 transition-colors border border-purple-100/50 rounded-xl p-3">
                <p className="text-[11px] font-bold text-purple-600/80 uppercase tracking-tight mb-1">本周</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-purple-700">{formatMinutes(stats.thisWeek)}</span>
                </div>
              </div>

              {/* 本月总计 */}
              <div className="bg-orange-50/50 hover:bg-orange-50 transition-colors border border-orange-100/50 rounded-xl p-3">
                <p className="text-[11px] font-bold text-orange-600/80 uppercase tracking-tight mb-1">本月</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-orange-700">{formatMinutes(stats.thisMonth)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 时间期间选择 */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="flex bg-accent rounded-lg p-1">
            <button
              onClick={() => setSelectedPeriod('week')}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${selectedPeriod === 'week'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              📅 周视图
            </button>
            <button
              onClick={() => setSelectedPeriod('month')}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${selectedPeriod === 'month'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              📊 月视图
            </button>
          </div>
        </div>

        {/* 使用趋势图表 */}
        <UsageChart
          data={usageHistory}
          chartType={chartType}
          onChartTypeChange={setChartType}
          formatMinutes={formatMinutes}
          period={selectedPeriod}
        />

        {/* 使用建议 */}
        {stats.today > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">💡 使用分析</h3>
            <div className="text-sm text-blue-700 space-y-1">
              {stats.today >= 120 && (
                <div>• 🎉 今日使用时间超过2小时，您对效率管理很重视！</div>
              )}
              {stats.averageDaily < 30 && stats.today > stats.averageDaily * 1.5 && (
                <div>• 📈 今日使用时间超过平均水平，保持这种积极性！</div>
              )}
              {stats.thisWeek > stats.thisMonth * 0.3 && (
                <div>• 🔥 本周使用频率很高，您正在培养良好的任务管理习惯</div>
              )}
              {stats.today > 60 && (
                <div>• ⏰ 建议结合番茄钟技术，让专注时间更高效</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
