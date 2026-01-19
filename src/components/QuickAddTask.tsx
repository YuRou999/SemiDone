import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Calendar, Flag, Type, AlignLeft, Paperclip } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { useSettingsStore } from '../store/settingsStore';
import AttachmentUpload from './AttachmentUpload';
import type { Priority, CreateTaskRequest, Attachment } from '../types';

interface QuickAddTaskProps {
  onClose: () => void;
}

export default function QuickAddTask({ onClose }: QuickAddTaskProps) {
  const { createTask } = useTaskStore();
  const { settings } = useSettingsStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDueDate, setTempDueDate] = useState('');

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      titleInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);

    const request: CreateTaskRequest = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    try {
      await createTask(request);

      // 重置表单
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      setShowAdvanced(false);
      setAttachments([]);
      setShowDatePicker(false);
      setTempDueDate('');

      onClose();
    } catch (error) {
      console.error('Create task error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit(e as any);
    }
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

  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-6 quick-add-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
            <Plus className="w-4 h-4 text-primary-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            {settings.theme === 'light' ? '新建待办' : '添加待办'}
          </h2>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
        {/* 待办标题 */}
        <div className="mb-4">
          <div className="relative">
            <Type className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={titleInputRef}
              type="text"
              placeholder={settings.theme === 'light' ? '输入待办标题...' : '今天要做什么呢？'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground"
              maxLength={100}
            />
          </div>
          <div className="mt-1 text-xs text-muted-foreground text-right">
            {title.length}/100
          </div>
        </div>

        {/* 高级选项切换 */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            {showAdvanced ? '隐藏高级选项' : '显示高级选项'}
          </button>
        </div>

        {/* 高级选项 */}
        {showAdvanced && (
          <div className="space-y-4 mb-4">
            {/* 待办描述 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <AlignLeft className="inline w-4 h-4 mr-1" />
                描述
              </label>
              <textarea
                placeholder="添加待办描述..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground resize-none"
                rows={3}
                maxLength={500}
              />
              <div className="mt-1 text-xs text-muted-foreground text-right">
                {description.length}/500
              </div>
            </div>

            {/* 优先级 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Flag className="inline w-4 h-4 mr-1" />
                优先级
              </label>
              <div className="flex space-x-2">
                {(['high', 'medium', 'low'] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`
                      flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors
                      ${priority === p
                        ? getPriorityColor(p)
                        : 'border-border bg-background text-muted-foreground hover:bg-muted'
                      }
                    `}
                  >
                    {getPriorityLabel(p)}
                  </button>
                ))}
              </div>
            </div>

            {/* 截止日期 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                截止日期
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setTempDueDate(dueDate);
                    setShowDatePicker(!showDatePicker);
                  }}
                  className="w-full px-3 py-2 text-left bg-background border border-border rounded-lg hover:bg-muted transition-colors text-foreground"
                >
                  {dueDate ? new Date(dueDate).toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : '设置截止日期'}
                </button>
                
                {showDatePicker && (
                  <>
                    <div className="fixed inset-0 z-[9998]" onClick={() => {
                      setTempDueDate(dueDate);
                      setShowDatePicker(false);
                    }} />
                    <div className="absolute top-full left-0 mt-1 p-4 bg-card border border-border rounded-lg shadow-xl z-[9999] min-w-[320px]">
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
                            onClick={() => {
                              setTempDueDate(dueDate);
                              setShowDatePicker(false);
                            }} 
                            className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                          >
                            取消
                          </button>
                          <button 
                            type="button" 
                            onClick={() => {
                              setTempDueDate('');
                              setDueDate('');
                              setShowDatePicker(false);
                            }} 
                            className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                          >
                            清除
                          </button>
                          <button 
                            type="button" 
                            onClick={() => {
                              setDueDate(tempDueDate);
                              setShowDatePicker(false);
                            }} 
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
            </div>

            {/* 图片上传 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Paperclip className="inline w-4 h-4 mr-1" />
                图片
              </label>
              <AttachmentUpload
                attachments={attachments}
                onChange={setAttachments}
              />
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            按 Ctrl+Enter 快速创建
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              取消
            </button>
            
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="px-6 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                  <span>创建中...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>创建待办</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}