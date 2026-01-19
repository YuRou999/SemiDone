// 待办优先级枚举
export type Priority = 'high' | 'medium' | 'low';

// 主题类型枚举
export type Theme = 'light' | 'dark' | 'pink';

// 折叠模式类型枚举
export type CollapseMode = 'expanded' | 'bar' | 'floating';

// 待办状态筛选类型
export type TaskFilter = 'all' | 'pending' | 'completed' | 'overdue' | 'today';

// 待办筛选类型（用于组件）
export type TaskFilterType = TaskFilter;

// 附件数据结构
export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  data: string; // Base64 encoded file data
  createdAt: string;
}

// 待办数据结构
export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  attachments?: Attachment[];
}

// 设置数据结构
export interface Settings {
  theme: Theme;
  notifications: boolean;
  autoSave: boolean;
  isPinned: boolean;
  isCollapsed: boolean;
  collapseMode: CollapseMode;    // 折叠模式：展开/条状/悬浮球
  useCapsuleMode: boolean;       // 是否启用胶囊模式
  username?: string;
  avatar?: string;
  transparentEnabled?: boolean;  // 是否开启透明模式
  transparentLevel?: number;     // 透明度级别 0-100 (100为完全不透明)
  isEdgeSnapped?: boolean;       // 是否吸附到边缘
  edgePosition?: 'left' | 'right'; // 吸附边缘位置
}

// 创建待办的请求参数
export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: string;
  attachments?: Attachment[];
}

// 更新待办的请求参数
export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: Priority;
  dueDate?: string;
  attachments?: Attachment[];
}

// 待办统计信息
export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  today: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
}

// API响应基础结构
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// 使用时长记录
export interface UsageRecord {
  id: string;
  date: string; // YYYY-MM-DD格式
  startTime: number; // 时间戳
  endTime: number; // 时间戳
  duration: number; // 持续时长（分钟）
  type: 'active' | 'background'; // 使用类型
}

// 使用时长统计
export interface UsageStats {
  today: number; // 今日使用分钟数
  thisWeek: number; // 本周使用分钟数
  thisMonth: number; // 本月使用分钟数
  averageDaily: number; // 日平均使用分钟数
  totalSessions: number; // 总使用次数
  longestSession: number; // 最长单次使用分钟数
}

// 使用详情数据
export interface UsageDetail {
  date: string;
  totalMinutes: number;
  sessions: number;
  firstUse?: string; // 首次使用时间
  lastUse?: string; // 最后使用时间
}

// 番茄钟状态
export interface PomodoroState {
  isActive: boolean;
  currentMode: 'work' | 'break' | 'longBreak';
  timeLeft: number; // 剩余秒数
  cycle: number; // 当前循环次数
  workDuration: number; // 工作时长（分钟）
  breakDuration: number; // 短休息时长（分钟）
  longBreakDuration: number; // 长休息时长（分钟）
  cyclesBeforeLongBreak: number; // 长休息前的循环次数
}

// Tauri命令响应类型
export interface TasksResponse extends ApiResponse<Task[]> {}
export interface TaskResponse extends ApiResponse<Task> {}
export interface SettingsResponse extends ApiResponse<Settings> {}
export interface StatsResponse extends ApiResponse<TaskStats> {}
export interface UsageResponse extends ApiResponse<UsageRecord[]> {}
export interface UsageStatsResponse extends ApiResponse<UsageStats> {}