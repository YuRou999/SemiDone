import React, { useState, useEffect } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { Settings, Palette, Save, Sun, Moon, Sparkles, Heart, ArrowLeft, Pin, Trash2, Database, Eye, Circle, FileDown, QrCode } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { useTaskStore } from '../store/taskStore';
import { toast } from 'sonner';
import ClearCacheDialog from '../components/ClearCacheDialog';
import ReportExportDialog from '../components/ReportExportDialog';
import type { Theme } from '../types';

export default function Other() {
  const { settings, updateSettings, toggleIsPinned, setTransparency, applyTransparency, toggleCapsuleMode } = useSettingsStore();
  const { loadTasks } = useTaskStore();
  const [appVersion, setAppVersion] = useState('');
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const version = await getVersion();
        setAppVersion(version);
      } catch (error) {
        console.error('Failed to get app version:', error);
        setAppVersion('N/A');
      }
    };
    fetchVersion();
  }, []);

  const handleThemeChange = async (theme: Theme) => {
    // 如果切换到非深色主题，自动关闭透明模式并重置透明度
    if (theme !== 'dark') {
      if (settings.transparentEnabled) {
        await setTransparency(false, 100);
        toast.info('已自动关闭透明模式', { duration: 3000 });
      }
      // 确保透明度重置为 100%
      document.documentElement.style.setProperty('--window-opacity', '1');
      document.body.classList.remove('transparent-mode');
    }
    updateSettings({ theme });
  };

  const handleNotificationsChange = (notifications: boolean) => {
    updateSettings({ notifications });
  };

  const handleAutoSaveChange = (autoSave: boolean) => {
    updateSettings({ autoSave });
  };

  const handleTransparencyToggle = async (enabled: boolean) => {
    // 只有深色模式才能开启透明
    if (enabled && settings.theme !== 'dark') {
      toast.error('透明模式仅支持在深色主题下开启', { duration: 3000 });
      return;
    }
    // 开启时从 100% 开始，关闭时恢复到 100%
    await setTransparency(enabled, 100);
  };

  const handleTransparencyLevelChange = async (level: number) => {
    // 实时预览透明度
    document.documentElement.style.setProperty('--window-opacity', String(level / 100));
    await setTransparency(true, level);
  };

  const handleClearCache = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).__TAURI__) {
        const { invoke } = await import('@tauri-apps/api/core');
        const response: any = await invoke('clear_all_data');
        if (response.success) {
          toast.success('缓存已清除，所有数据已删除');
          // 重新加载待办（应该为空）
          await loadTasks();
        } else {
          toast.error(response.error || '清除缓存失败');
        }
      } else {
        // 浏览器环境，清除 localStorage
        localStorage.clear();
        toast.success('缓存已清除');
        await loadTasks();
      }
    } catch (error) {
      console.error('Clear cache error:', error);
      toast.error('清除缓存失败');
    }
  };

  const getThemePreview = (theme: Theme) => {
    switch (theme) {
      case 'light':
        return 'bg-gradient-to-br from-blue-50 to-indigo-100 border border-gray-200';
      case 'dark':
        return 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700';
      case 'pink':
        return 'bg-gradient-to-br from-pink-50 via-rose-100 to-pink-200 border border-pink-300';
      default:
        return 'bg-gray-100';
    }
  }

  const getThemeName = (theme: Theme) => {
    switch (theme) {
      case 'light':
        return '明亮';
      case 'dark':
        return '深色';
      case 'pink':
        return '甜美粉';
      default:
        return '未知';
    }
  }

  const getThemeIcon = (theme: Theme) => {
    switch (theme) {
      case 'light':
        return <Sun className="w-6 h-6 text-yellow-500" />;
      case 'dark':
        return <Moon className="w-6 h-6 text-blue-400" />;
      case 'pink':
        return <Heart className="w-6 h-6 text-rose-500" />;
      default:
        return <Sun className="w-6 h-6" />;
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* 返回按钮 */}
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>返回</span>
        </button>

        {/* 页面标题 */}
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-foreground">设置</h1>
          <p className="text-sm text-muted-foreground mt-1">个性化您的待办事项体验</p>
        </div>

        <div className="space-y-2"> {/* 这里减少卡片间距 */}
          {/* 主题设置 */}
          <div className="card card-shadow hover-lift slide-up">
            <div className="card-header">
              <div className="flex items-center">
                <div className="p-2 bg-primary/10 rounded-lg mr-3">
                  <Palette className="w-5 h-5 icon-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">主题风格</h2>
                  <p className="card-description text-sm">选择您喜欢的界面风格</p>
                </div>
              </div>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-3 gap-3">
                {(['light', 'dark', 'pink'] as Theme[]).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => handleThemeChange(theme)}
                    className={`group relative p-3 rounded-lg border-2 transition-all duration-300 ease-in-out ${settings.theme === theme
                      ? 'border-primary bg-primary/5 scale-105'
                      : 'border-border hover:border-primary/50 hover:bg-accent/50'
                      }`}
                  >
                    <div className={`w-8 h-8 rounded-md ${getThemePreview(theme)} flex items-center justify-center mb-2 mx-auto group-hover:scale-110 transition-all duration-300 ease-in-out`}>
                      {React.cloneElement(getThemeIcon(theme), { className: 'w-4 h-4' })}
                    </div>
                    <div className="text-xs font-medium text-foreground">
                      {getThemeName(theme)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {theme === 'light' && '清新明亮'}
                      {theme === 'dark' && '专注护眼'}
                      {theme === 'pink' && '温暖优雅'}
                    </div>
                    {settings.theme === theme && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 透明模式设置 */}
          <div className="card card-shadow hover-lift slide-up">
            <div className="card-header">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <div className="p-2 bg-cyan-500/10 rounded-lg mr-3">
                    <Eye className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">透明模式</h2>
                    <p className="card-description text-sm">
                      {settings.theme === 'dark' ? '开启后窗口背景半透明' : '仅支持深色主题'}
                    </p>
                  </div>
                </div>

                {/* 开关按钮 */}
                <label className={`relative inline-flex items-center ${settings.theme === 'dark' ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                  <input
                    type="checkbox"
                    checked={settings.transparentEnabled ?? false}
                    onChange={(e) => handleTransparencyToggle(e.target.checked)}
                    className="sr-only peer"
                    disabled={settings.theme !== 'dark' && !settings.transparentEnabled}
                  />
                  <div className="w-11 h-6 bg-cyan-100 peer-focus:ring-cyan-200 rounded-full peer peer-checked:bg-cyan-500 after:bg-white after:border-cyan-200 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>
            </div>

            {/* 透明度滑块 */}
            {settings.transparentEnabled && (
              <div className="card-content pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">透明度</span>
                    <span className="text-sm font-medium text-foreground">
                      {settings.transparentLevel ?? 100}%
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      step="1"
                      value={settings.transparentLevel ?? 100}
                      onChange={(e) => handleTransparencyLevelChange(Number(e.target.value))}
                      className="w-full h-2 bg-cyan-100 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>透明</span>
                      <span>不透明</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 自动保存设置 */}
          <div className="card card-shadow hover-lift slide-up">
            <div className="card-header py-4">
              <div className="flex items-center justify-between w-full">
                {/* 左侧标题和描述 */}
                <div className="flex items-center">
                  <div className="p-2 bg-blue-500/10 rounded-lg mr-3">
                    <Save className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">自动保存</h2>
                    <p className="card-description text-sm">自动保存待办更改到本地</p>
                  </div>
                </div>

                {/* 右侧开关按钮 */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoSave}
                    onChange={(e) => handleAutoSaveChange(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-blue-100 peer-focus:ring-blue-200 rounded-full peer peer-checked:bg-blue-500 after:bg-white after:border-blue-200 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>
            </div>
          </div>

          {/* 胶囊折叠模式设置 */}
          <div className="card card-shadow hover-lift slide-up">
            <div className="card-header py-4">
              <div className="flex items-center justify-between w-full">
                {/* 左侧标题和描述 */}
                <div className="flex items-center">
                  <div className="p-2 bg-purple-500/10 rounded-lg mr-3">
                    <Circle className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">悬浮球模式</h2>
                    <p className="card-description text-sm">开启后折叠窗口变为悬浮球</p>
                  </div>
                </div>

                {/* 右侧开关按钮 */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.useCapsuleMode ?? false}
                    onChange={(e) => toggleCapsuleMode()}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-purple-100 peer-focus:ring-purple-200 rounded-full peer peer-checked:bg-purple-500 after:bg-white after:border-purple-200 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>
            </div>
          </div>

          {/* 报告导出卡片 */}
          <div className="card card-shadow slide-up">
            <div className="card-header">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-500/10 rounded-lg mr-3">
                    <FileDown className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">记录导出</h2>
                    <p className="card-description text-sm">导出待办记录为Markdown格式</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowExportDialog(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                >
                  <FileDown className="w-4 h-4" />
                  导出
                </button>
              </div>
            </div>
          
          </div>

          {/* 数据管理卡片 */}
          <div className="card card-shadow slide-up">
            <div className="card-header">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <div className="p-2 bg-red-500/10 rounded-lg mr-3">
                    <Database className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">数据管理</h2>
                    <p className="card-description text-sm">清除应用数据和缓存</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowClearDialog(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  清除缓存
                </button>
              </div>
            </div>
          </div>

          {/* 应用信息 */}
          <div className="card card-shadow slide-up">
            <div className="card-header">
              <div className="flex items-center">
                <div className="p-2 bg-gray-500/10 rounded-lg mr-3">
                  <Settings className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">关于</h2>
                  <p className="card-description text-sm">应用版本信息</p>
                </div>
              </div>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">版本</span>
                    <span className="text-sm font-medium text-foreground">{appVersion}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">作者</span>
                    <span className="text-sm font-medium text-foreground">魚肉</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">更新日期</span>
                    <span className="text-sm font-medium text-foreground">2026.01</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 公众号关注卡片 */}
          <div className="card card-shadow slide-up">
            <div className="card-header">
              <div className="flex items-center">
                <div className="p-2 bg-green-500/10 rounded-lg mr-3">
                  <QrCode className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">关注公众号</h2>
                  <p className="card-description text-sm">获取更多效率工具和使用技巧</p>
                </div>
              </div>
            </div>
            <div className="card-content">
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-border">
                  <img
                    src="/gzh.jpg"
                    alt="公众号二维码"
                    className="w-40 h-40 object-contain"
                  />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-foreground">扫码关注「事半」公众号</p>
                  <div className="text-xs text-muted-foreground space-y-1">

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 清除缓存确认对话框 */}
      <ClearCacheDialog
        isOpen={showClearDialog}
        onClose={() => setShowClearDialog(false)}
        onConfirm={handleClearCache}
      />

      {/* 导出报告对话框 */}
      <ReportExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
      />
    </div>
  );
}