import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Settings, Theme } from '../types';
import { api } from '../api/tauri';
import { toast } from 'sonner';

interface SettingsState {
  // 状态
  settings: Settings;
  loading: boolean;
  
  // 操作
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
  toggleAutoSave: () => Promise<void>;
  toggleIsPinned: () => Promise<void>;
  toggleIsCollapsed: () => Promise<void>;
  toggleCapsuleMode: () => Promise<void>;  // 切换胶囊模式开关
  setEdgeSnap: (snapped: boolean, position?: 'left' | 'right') => Promise<void>;
  resetSettings: () => Promise<void>;
  setTransparency: (enabled: boolean, level?: number) => Promise<void>;
  applyTransparency: () => Promise<void>;
}

const defaultSettings: Settings = {
  theme: 'light',
  notifications: true,
  autoSave: true,
  isPinned: false,
  isCollapsed: false,
  collapseMode: 'expanded',
  useCapsuleMode: false,
  transparentEnabled: false,
  transparentLevel: 100,
  isEdgeSnapped: false,
  edgePosition: 'right',
};

export const useSettingsStore = create<SettingsState>()(devtools(
  persist(
    (set, get) => ({
      // 初始状态
      settings: defaultSettings,
      loading: false,
      
      // 操作
      loadSettings: async () => {
        set({ loading: true });
        try {
          const response = await api.settings.getSettings();
          if (response.success) {
            const loadedSettings = { ...defaultSettings, ...response.data };
            set({ settings: loadedSettings });
            
            // 应用主题
            if (loadedSettings.theme) {
              document.documentElement.setAttribute('data-theme', loadedSettings.theme);
            }
            
            // 恢复置顶状态
            if (loadedSettings.isPinned) {
              try {
                const { getCurrentWindow } = await import('@tauri-apps/api/window');
                const appWindow = getCurrentWindow();
                await appWindow.setAlwaysOnTop(true);
                console.log('Window pinned state restored');
              } catch (error) {
                console.warn('Failed to restore pin state:', error);
              }
            }
            
            // 恢复透明度状态
            if (loadedSettings.transparentEnabled) {
              try {
                const { getCurrentWindow } = await import('@tauri-apps/api/window');
                const appWindow = getCurrentWindow();
                const level = loadedSettings.transparentLevel ?? 100;
                
                // 清除系统特效，只用 CSS 透明度
                await appWindow.clearEffects();
                
                // 设置透明度样式
                document.documentElement.style.setProperty('--window-opacity', String(level / 100));
                document.body.classList.add('transparent-mode');
                console.log('Window transparency restored:', level);
              } catch (error) {
                console.warn('Failed to restore transparency:', error);
              }
            }
            
            // 初始化窗口尺寸和折叠模式
            try {
              const { getCurrentWindow, LogicalSize } = await import('@tauri-apps/api/window');
              const appWindow = getCurrentWindow();
              
              // 确保collapseMode字段存在，如果不存在则根据isCollapsed设置默认值
              let finalSettings = { ...loadedSettings };
              if (!finalSettings.collapseMode) {
                finalSettings.collapseMode = finalSettings.isCollapsed ? 'bar' : 'expanded';
                console.log('🔧 初始化collapseMode为:', finalSettings.collapseMode);
              }
              
              // 每次启动都重置为展开状态
              if (finalSettings.isCollapsed || finalSettings.collapseMode !== 'expanded') {
                // 重置为展开状态
                finalSettings = { 
                  ...finalSettings, 
                  isCollapsed: false, 
                  collapseMode: 'expanded',
                  isEdgeSnapped: false 
                };
                set({ settings: finalSettings });
                await api.settings.updateSettings(finalSettings);
                console.log('🔄 重置为展开状态');
              }
              
              // 保存默认尺寸（如果还没有保存）
              if (!localStorage.getItem('expandedWindowSize')) {
                const defaultSize = { width: 550, height: 1000 };
                localStorage.setItem('expandedWindowSize', JSON.stringify(defaultSize));
                console.log('📏 初始窗口尺寸已保存 (默认):', defaultSize.width, 'x', defaultSize.height);
              }
            } catch (error) {
              console.warn('Failed to initialize window state:', error);
            }
          } else {
            console.warn('Load settings failed:', response.error);
            set({ settings: defaultSettings });
          }
        } catch (error) {
          console.error('Load settings error:', error);
          set({ settings: defaultSettings });
        } finally {
          set({ loading: false });
        }
      },
      
      updateSettings: async (updates: Partial<Settings>) => {
        const currentSettings = get().settings;
        const newSettings = { ...currentSettings, ...updates };
        
        try {
          const response = await api.settings.updateSettings(newSettings);
          if (response.success) {
            set({ settings: newSettings });
            
            // 应用主题变化
            if (updates.theme) {
              document.documentElement.setAttribute('data-theme', updates.theme);
            }
            
            toast.success('设置已保存');
          } else {
            toast.error(response.error || '保存设置失败');
          }
        } catch (error) {
          console.error('Update settings error:', error);
          toast.error('保存设置失败');
        }
      },
      
      setTheme: async (theme: Theme) => {
        await get().updateSettings({ theme });
      },
      
      toggleAutoSave: async () => {
        const currentSettings = get().settings;
        await get().updateSettings({ autoSave: !currentSettings.autoSave });
      },
      
      toggleIsPinned: async () => {
        const currentSettings = get().settings;
        const newPinnedState = !currentSettings.isPinned;
        try {
          // 直接使用Tauri的窗口API设置置顶
          const { getCurrentWindow } = await import('@tauri-apps/api/window');
          const appWindow = getCurrentWindow();
          await appWindow.setAlwaysOnTop(newPinnedState);
          
          // 先更新本地状态，再保存到后端
          set({ settings: { ...currentSettings, isPinned: newPinnedState } });
          
          // 应用主题变化（如果需要）
          document.documentElement.setAttribute('data-theme', currentSettings.theme);
          
          toast.success(newPinnedState ? '已置顶窗口' : '已取消置顶');
          
          // 异步保存到后端，不阻塞UI
          try {
            await api.settings.updateSettings({ ...currentSettings, isPinned: newPinnedState });
          } catch (saveError) {
            console.warn('Failed to save pin state to backend:', saveError);
          }
        } catch (error) {
          console.error('Failed to toggle pinned state:', error);
          toast.error('切换置顶状态失败');
        }
      },
      
      toggleIsCollapsed: async () => {
        const currentSettings = get().settings;
        const newCollapsedState = !currentSettings.isCollapsed;
        
        try {
          const { getCurrentWindow, LogicalSize } = await import('@tauri-apps/api/window');
          const appWindow = getCurrentWindow();
          
          let newCollapseMode: import('../types').CollapseMode;
          
          if (newCollapsedState) {
            // 折叠前先保存当前窗口尺寸（如果是展开状态）
            if (currentSettings.collapseMode === 'expanded') {
              try {
                const physicalSize = await appWindow.innerSize();
                const scaleFactor = await appWindow.scaleFactor();
                const logicalSize = physicalSize.toLogical(scaleFactor);
                const currentSize = { 
                  width: Math.round(logicalSize.width), 
                  height: Math.round(logicalSize.height) 
                };
                localStorage.setItem('expandedWindowSize', JSON.stringify(currentSize));
                console.log('💾 折叠前保存窗口尺寸:', currentSize);
              } catch (error) {
                console.error('保存当前尺寸失败:', error);
              }
            }
            
            // 根据胶囊模式设置选择折叠方式
            newCollapseMode = currentSettings.useCapsuleMode ? 'floating' : 'bar';
            
            if (currentSettings.useCapsuleMode) {
              // 圆球模式：60x60正方形尺寸
              console.log('🔵 切换到圆球模式: 60x60');
              await appWindow.setSize(new LogicalSize(60, 60));
            } else {
              // 条状模式：原有逻辑
              const savedSize = localStorage.getItem('expandedWindowSize');
              let targetWidth = 550;
              if (savedSize) {
                const { width } = JSON.parse(savedSize);
                targetWidth = width;
              }
              console.log('📏 切换到条状模式:', targetWidth, 'x 65');
              await appWindow.setSize(new LogicalSize(targetWidth, 65));
            }
            await appWindow.setResizable(false);
          } else {
            // 展开模式：恢复保存的尺寸
            newCollapseMode = 'expanded';
            const savedSize = localStorage.getItem('expandedWindowSize');
            if (savedSize) {
              const { width, height } = JSON.parse(savedSize);
              console.log('🔼 恢复到保存的尺寸:', width, 'x', height);
              await appWindow.setSize(new LogicalSize(width, height));
            } else {
              console.log('🔼 使用默认尺寸: 550 x 1000');
              await appWindow.setSize(new LogicalSize(550, 1000));
            }
            await appWindow.setResizable(true);
          }
          
          // 更新状态
          const newSettings = { 
            ...currentSettings, 
            isCollapsed: newCollapsedState,
            collapseMode: newCollapseMode,
            isEdgeSnapped: false // 重置吸附状态
          };
          set({ settings: newSettings });
          
          const modeText = newCollapseMode === 'floating' ? '圆球模式' : 
                          newCollapseMode === 'bar' ? '条状模式' : '展开窗口';
          toast.success(`已切换到${modeText}`);
          
          // 异步保存到后端
          try {
            await api.settings.updateSettings(newSettings);
          } catch (saveError) {
            console.warn('Failed to save collapse state to backend:', saveError);
          }
        } catch (error) {
          console.error('Failed to toggle collapsed state:', error);
          toast.error('切换折叠状态失败');
        }
      },
      
      toggleCapsuleMode: async () => {
        const currentSettings = get().settings;
        const newCapsuleMode = !currentSettings.useCapsuleMode;
        
        try {
          const newSettings = {
            ...currentSettings,
            useCapsuleMode: newCapsuleMode
          };
          
          set({ settings: newSettings });
          toast.success(newCapsuleMode ? '已启用胶囊折叠模式' : '已禁用胶囊折叠模式');
          
          // 异步保存到后端
          try {
            await api.settings.updateSettings(newSettings);
          } catch (saveError) {
            console.warn('Failed to save capsule mode to backend:', saveError);
          }
        } catch (error) {
          console.error('Failed to toggle capsule mode:', error);
          toast.error('切换胶囊模式失败');
        }
      },
      
      setEdgeSnap: async (snapped: boolean, position?: 'left' | 'right') => {
        const currentSettings = get().settings;
        const newSettings = {
          ...currentSettings,
          isEdgeSnapped: snapped,
          edgePosition: position || currentSettings.edgePosition || 'right'
        };
        
        try {
          const { getCurrentWindow } = await import('@tauri-apps/api/window');
          const appWindow = getCurrentWindow();
          
          if (snapped && position) {
            // 吸附到边缘：移动到屏幕边缘并调整为半圆形状
            const { availableMonitors, LogicalPosition, LogicalSize } = await import('@tauri-apps/api/window');
            const monitors = await availableMonitors();
            const currentMonitor = monitors[0]; // 使用主显示器
            
            if (currentMonitor) {
              const { size: monitorSize } = currentMonitor;
              const windowWidth = 30; // 半圆宽度
              const windowHeight = 30;
              
              const x = position === 'left' ? 0 : monitorSize.width - windowWidth;
              const y = Math.floor((monitorSize.height - windowHeight) / 2); // 垂直居中
              
              await appWindow.setPosition(new LogicalPosition(x, y));
              await appWindow.setSize(new LogicalSize(windowWidth, windowHeight));
            }
          } else if (!snapped && currentSettings.collapseMode === 'floating') {
            // 取消吸附：恢复为完整圆球形状
            const { LogicalSize } = await import('@tauri-apps/api/window');
            await appWindow.setSize(new LogicalSize(60, 60));
          }
          
          set({ settings: newSettings });
          
          // 异步保存到后端
          try {
            await api.settings.updateSettings(newSettings);
          } catch (saveError) {
            console.warn('Failed to save edge snap state to backend:', saveError);
          }
        } catch (error) {
          console.error('Failed to set edge snap:', error);
          toast.error('设置边缘吸附失败');
        }
      },
      
      resetSettings: async () => {
        await get().updateSettings(defaultSettings);
        toast.success('设置已重置为默认值');
      },
      
      setTransparency: async (enabled: boolean, level?: number) => {
        const currentSettings = get().settings;
        // 关闭时强制设为 100%，开启时使用传入的 level 或 100%
        const newLevel = enabled ? (level ?? 100) : 100;
        
        try {
          // 更新状态
          const newSettings = {
            ...currentSettings,
            transparentEnabled: enabled,
            transparentLevel: newLevel,
          };
          set({ settings: newSettings });
          
          // 应用透明效果
          await get().applyTransparency();
          
          // 保存到后端（静默保存，不显示 toast）
          await api.settings.updateSettings(newSettings);
          
          // 只在开关切换时显示提示，调整透明度时不显示
          if (level === 100 || level === undefined) {
            toast.success(enabled ? '已开启透明模式' : '已关闭透明模式');
          }
        } catch (error) {
          console.error('Failed to set transparency:', error);
          toast.error('设置透明度失败');
        }
      },
      
      applyTransparency: async () => {
        const settings = get().settings;
        try {
          if (settings.transparentEnabled && settings.theme === 'dark') {
            // 开启透明效果
            const { getCurrentWindow } = await import('@tauri-apps/api/window');
            const appWindow = getCurrentWindow();
            
            try {
              await appWindow.clearEffects();
            } catch (e) {
              console.warn('Failed to clear effects:', e);
            }
            
            const level = settings.transparentLevel ?? 100;
            document.documentElement.style.setProperty('--window-opacity', String(level / 100));
            document.body.classList.add('transparent-mode');
          } else {
            // 关闭透明效果
            const { getCurrentWindow } = await import('@tauri-apps/api/window');
            const appWindow = getCurrentWindow();
            
            try {
              await appWindow.clearEffects();
            } catch (e) {
              console.warn('Failed to clear effects:', e);
            }
            
            document.documentElement.style.setProperty('--window-opacity', '1');
            document.body.classList.remove('transparent-mode');
          }
        } catch (error) {
          console.error('Failed to apply transparency:', error);
        }
      },
    }),
    {
      name: 'settings-store',
      // 只持久化设置数据，不持久化loading状态
      partialize: (state) => ({ settings: state.settings }),
      // 在加载时合并默认设置
      merge: (persistedState, currentState) => ({
        ...currentState,
        settings: { ...defaultSettings, ...(persistedState as any)?.settings },
      }),
    }
  ),
  {
    name: 'settings-store',
  }
));

// 初始化主题
export const initializeTheme = () => {
  const settings = useSettingsStore.getState().settings;
  document.documentElement.setAttribute('data-theme', settings.theme);
};

// 监听主题变化
useSettingsStore.subscribe(
  (state) => {
    document.documentElement.setAttribute('data-theme', state.settings.theme);
  }
);