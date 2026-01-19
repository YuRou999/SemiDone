import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Calendar, Flag, Type, AlignLeft, Clock, CheckCircle, Circle, Paperclip } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { useSettingsStore } from '../store/settingsStore';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import AttachmentUpload from '../components/AttachmentUpload';
import { toast } from 'sonner';
import type { Priority, UpdateTaskRequest, Attachment } from '../types';

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tasks, updateTask, deleteTask, toggleTaskComplete } = useTaskStore();
  const { settings } = useSettingsStore();
  
  const [task, setTask] = useState(() => tasks.find(t => t.id === id));
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDueDate, setTempDueDate] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  useEffect(() => {
    const foundTask = tasks.find(t => t.id === id);
    if (foundTask) {
      setTask(foundTask);
      setTitle(foundTask.title);
      setDescription(foundTask.description || '');
      setPriority(foundTask.priority);
      setDueDate(foundTask.dueDate || '');
      setTempDueDate(foundTask.dueDate || '');
      setAttachments(foundTask.attachments || []);
    } else if (id) {
      // 待办不存在，返回首页
      navigate('/');
    }
  }, [id, tasks, navigate]);

  if (!task) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <div className="text-lg text-muted-foreground mb-4">待办不存在</div>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!title.trim()) {
      return;
    }

    setIsSaving(true);
    
    const request: UpdateTaskRequest = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    try {
      await updateTask(task.id, request);
      setIsEditing(false);
    } catch (error) {
      console.error('Update task error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    setShowDeleteDialog(false);
    
    try {
      await deleteTask(task.id);
      navigate('/');
    } catch (error) {
      console.error('Delete task error:', error);
      setIsDeleting(false);
    }
  };

  const handleToggleComplete = async () => {
    try {
      await toggleTaskComplete(task.id);
    } catch (error) {
      console.error('Toggle task complete error:', error);
    }
  };

  const handleDateConfirm = () => {
    setDueDate(tempDueDate);
    setShowDatePicker(false);
  };

  const handleDateCancel = () => {
    setTempDueDate(dueDate);
    setShowDatePicker(false);
  };

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case 'high':
        return 'border-red-200 bg-red-50 text-red-700';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50 text-yellow-700';
      case 'low':
        return 'border-green-200 bg-green-50 text-green-700';
      default:
        return 'border-gray-200 bg-gray-50 text-gray-700';
    }
  };

  const getPriorityLabel = (p: Priority) => {
    switch (p) {
      case 'high':
        return '高优先级';
      case 'medium':
        return '中优先级';
      case 'low':
        return '低优先级';
      default:
        return '中优先级';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `已逾期 ${Math.abs(diffDays)} 天`;
    } else if (diffDays === 0) {
      return '今天到期';
    } else if (diffDays === 1) {
      return '明天到期';
    } else {
      return `${diffDays} 天后到期`;
    }
  };

  const getDateColor = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'text-red-600';
    } else if (diffDays === 0) {
      return 'text-orange-600';
    } else {
      return 'text-muted-foreground';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* 头部导航 */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回</span>
        </button>
        
        <div className="flex items-center space-x-3">
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  // 重置表单
                  setTitle(task.title);
                  setDescription(task.description || '');
                  setPriority(task.priority);
                  setDueDate(task.dueDate || '');
                  setTempDueDate(task.dueDate || '');
                  setShowDatePicker(false);
                  setAttachments(task.attachments || []);
                }}
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                取消
              </button>
              
              <button
                onClick={handleSave}
                disabled={!title.trim() || isSaving}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                    <span>保存中...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>保存</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                编辑
              </button>
              
              <button
                onClick={() => setShowDeleteDialog(true)}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>删除中...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>删除</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* 待办详情：两栏布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧主内容区域 */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-6">
          {/* 待办标题 */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center">
              <Type className="w-4 h-4 mr-2" />
              待办标题
            </label>
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-xl font-semibold"
                placeholder="输入待办标题..."
                maxLength={100}
              />
            ) : (
              <h1 className={`text-xl font-semibold ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {task.title}
              </h1>
            )}
          </div>

          {/* 待办描述 */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center">
              <AlignLeft className="w-4 h-4 mr-2" />
              待办描述
            </label>
            {isEditing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground resize-none"
                placeholder="添加待办描述..."
                rows={5}
                maxLength={500}
              />
            ) : (
              <div className="text-foreground whitespace-pre-wrap min-h-[6rem]">
                {task.description || (
                  <span className="text-muted-foreground italic">暂无描述</span>
                )}
              </div>
            )}
          </div>

          {/* 图片区域 */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center">
              <Paperclip className="w-4 h-4 mr-2" />
              图片 {task.attachments && task.attachments.length > 0 && `(${task.attachments.length})`}
            </label>
            {isEditing ? (
              <AttachmentUpload
                attachments={attachments}
                onChange={setAttachments}
              />
            ) : (
              <div>
                {task.attachments && task.attachments.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {task.attachments.map((attachment) => {
                      const isImage = attachment.type.startsWith('image/');
                      return (
                        <div
                          key={attachment.id}
                          className="flex items-center space-x-3 p-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors cursor-pointer"
                          onClick={async () => {
                            if (typeof window !== 'undefined' && (window as any).__TAURI__) {
                              try {
                                const { invoke } = await import('@tauri-apps/api/core');
                                const response = await invoke('open_file_with_system', {
                                  fileName: attachment.name,
                                  fileData: attachment.data,
                                  fileType: attachment.type,
                                });
                                
                                if (!(response as any).success) {
                                  toast.error((response as any).error || '打开文件失败');
                                }
                              } catch (error) {
                                console.error('Error opening file:', error);
                                toast.error('打开文件失败');
                              }
                            } else {
                              const byteCharacters = atob(attachment.data);
                              const byteNumbers = new Array(byteCharacters.length);
                              for (let i = 0; i < byteCharacters.length; i++) {
                                byteNumbers[i] = byteCharacters.charCodeAt(i);
                              }
                              const byteArray = new Uint8Array(byteNumbers);
                              const blob = new Blob([byteArray], { type: attachment.type });
                              const url = URL.createObjectURL(blob);
                              window.open(url, '_blank');
                              setTimeout(() => URL.revokeObjectURL(url), 100);
                            }
                          }}
                        >
                          {isImage ? (
                            <div className="w-12 h-12 rounded overflow-hidden bg-background flex-shrink-0">
                              <img
                                src={`data:${attachment.type};base64,${attachment.data}`}
                                alt={attachment.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded bg-background flex items-center justify-center flex-shrink-0">
                              <Paperclip className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">
                              {attachment.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {attachment.size < 1024
                                ? `${attachment.size} B`
                                : attachment.size < 1024 * 1024
                                ? `${(attachment.size / 1024).toFixed(1)} KB`
                                : `${(attachment.size / (1024 * 1024)).toFixed(1)} MB`}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-foreground whitespace-pre-wrap">
                    <span className="text-muted-foreground italic">暂无图片</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 右侧侧边栏 */}
        <div className="lg:col-span-1 space-y-4">
          {/* 详情模块 */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">详情</h3>
            
            {/* 优先级 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-foreground">
                <Flag className="w-4 h-4 mr-2 text-muted-foreground" />
                <span>优先级</span>
              </div>
              {isEditing ? (
                <div className="flex space-x-1 w-3/5">
                  {(['high', 'medium', 'low'] as Priority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 px-2 py-1 rounded-md border text-xs font-medium transition-colors ${priority === p ? getPriorityColor(p) : 'border-border bg-background text-muted-foreground hover:bg-muted'}`}>
                      {getPriorityLabel(p)}
                    </button>
                  ))}
                </div>
              ) : (
                <div className={`inline-flex px-3 py-1 rounded-full border text-sm font-medium ${getPriorityColor(task.priority)}`}>
                  {getPriorityLabel(task.priority)}
                </div>
              )}
            </div>

            {/* 截止日期 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-foreground">
                <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                <span>截止日期</span>
              </div>
              {isEditing ? (
                <div className="relative w-3/5">
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="w-full px-2 py-1 text-xs bg-background border border-border rounded-md hover:bg-muted transition-colors text-left"
                  >
                    {dueDate ? new Date(dueDate).toLocaleString() : '设置日期'}
                  </button>
                  
                  {showDatePicker && (
                    <>
                      <div className="fixed inset-0 z-[9998]" onClick={handleDateCancel} />
                      <div className="absolute bottom-full right-0 mb-1 p-4 bg-background border border-border rounded-lg shadow-xl z-[9999] min-w-[320px]">
                        <div className="space-y-4">
                          <div className="text-sm font-medium text-foreground">选择截止日期</div>
                          
                          {/* 日期选择 */}
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">日期</label>
                            <input
                              type="date"
                              value={tempDueDate ? tempDueDate.split('T')[0] : ''}
                              onChange={(e) => {
                                const dateValue = e.target.value;
                                const timeValue = tempDueDate ? tempDueDate.split('T')[1] || '09:00' : '09:00';
                                setTempDueDate(dateValue ? `${dateValue}T${timeValue}` : '');
                              }}
                              className="w-full px-3 py-2 text-sm bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                          
                          {/* 时间选择 */}
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">时间</label>
                            <input
                              type="time"
                              value={tempDueDate ? tempDueDate.split('T')[1] || '09:00' : '09:00'}
                              onChange={(e) => {
                                const timeValue = e.target.value;
                                const dateValue = tempDueDate ? tempDueDate.split('T')[0] : new Date().toISOString().split('T')[0];
                                setTempDueDate(`${dateValue}T${timeValue}`);
                              }}
                              className="w-full px-3 py-2 text-sm bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                          </div>
                          
                          {/* 确认按钮 */}
                          <div className="flex justify-end space-x-2 pt-2 border-t border-border">
                            <button 
                              type="button" 
                              onClick={handleDateCancel} 
                              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                            >
                              取消
                            </button>
                            <button 
                              type="button" 
                              onClick={() => { setTempDueDate(''); setDueDate(''); setShowDatePicker(false); }} 
                              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                            >
                              清除
                            </button>
                            <button 
                              type="button" 
                              onClick={handleDateConfirm} 
                              className="px-3 py-1.5 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded transition-colors font-medium"
                            >
                              确定
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-right">
                  {task.dueDate ? (
                    <div className="space-y-0.5">
                      <div className="text-sm font-medium text-foreground">{new Date(task.dueDate).toLocaleDateString()}</div>
                      <div className={`text-sm ${getDateColor(task.dueDate)}`}>{formatDate(task.dueDate)}</div>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">未设置</span>
                  )}
                </div>
              )}
            </div>

            {/* 创建时间 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-foreground">
                <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                <span>创建时间</span>
              </div>
              <div className="text-sm text-muted-foreground">{new Date(task.createdAt).toLocaleString()}</div>
            </div>

            {/* 更新时间 */}
            {task.updatedAt && (
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-foreground">
                  <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span>更新时间</span>
                </div>
                <div className="text-sm text-muted-foreground">{new Date(task.updatedAt).toLocaleString()}</div>
              </div>
            )}
          </div>

          {/* 状态模块 - 移到下面 */}
          <div className="bg-card border border-border rounded-lg p-4">
            <label className="block text-sm font-medium text-muted-foreground mb-3">状态</label>
            <button
              onClick={handleToggleComplete}
              className={`w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg transition-colors font-medium text-sm ${
                task.completed 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {task.completed ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
              <span>{task.completed ? '已完成' : '标记为完成'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        task={task}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  );
}