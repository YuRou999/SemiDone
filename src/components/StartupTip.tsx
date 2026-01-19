import React, { useEffect, useState } from 'react';
import { X, Sparkles, BarChart3, Timer, TrendingUp, Zap, Pin, ChevronsUpDown, Settings, Target } from 'lucide-react';

const APP_VERSION = '3.0.0';

const StartupTip: React.FC = () => {
  const [show, setShow] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const STORAGE_KEY = `welcome_shown_${APP_VERSION}`;

  useEffect(() => {
    // 每个新版本都显示一次
    const hasShown = localStorage.getItem(STORAGE_KEY);
    if (!hasShown) {
      setTimeout(() => {
        setShow(true);
      }, 800);
    }
  }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    setShow(false);
  };

  const handleDismiss = () => {
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-[460px] max-h-[85vh] rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-scale-in flex flex-col">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">欢迎使用 SemiDone</h3>
              <p className="text-white/80 text-sm">事半功倍，高效待办 · v{APP_VERSION}</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* 内容区域 - 可滚动 */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* 新版本更新 */}
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <span className="text-lg">🎉</span> v{APP_VERSION} 更新内容
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                <span>独立统计页面</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Timer className="w-4 h-4 text-teal-500" />
                <span>番茄钟聚焦模式</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <TrendingUp className="w-4 h-4 text-cyan-500" />
                <span>图表趋势分析</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>状态持久化</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Target className="w-4 h-4 text-blue-500" />
                <span>月视图优化</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>界面体验升级</span>
              </div>
            </div>
          </div>

          {/* 使用说明 */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">📖 使用说明</h4>
            <div className="space-y-2.5 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <X className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                </div>
                <span>完全关闭应用</span>
              </div>           
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <Pin className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <span>窗口置顶：保持在最前端</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <ChevronsUpDown className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <span>窗口折叠：只显示标题栏</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <Settings className="w-3.5 h-3.5 text-purple-500" />
                </div>
                <span>设置页面：主题/透明/缓存</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              💡 个人制作水平有限，如果遇到问题欢迎留言反馈!
            </p>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="px-5 py-4 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200">
              本版本不再显示
            </span>
          </label>
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white rounded-lg font-medium hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
          >
            开始使用
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartupTip;
