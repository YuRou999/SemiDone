import React, { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import type { Attachment } from '../types';
import { toast } from 'sonner';

interface AttachmentUploadProps {
  attachments: Attachment[];
  onChange: (attachments: Attachment[]) => void;
  maxSize?: number; // in bytes, default 10MB
}

export default function AttachmentUpload({ 
  attachments, 
  onChange, 
  maxSize = 10 * 1024 * 1024 // 10MB
}: AttachmentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newAttachments: Attachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        toast.error(`文件 "${file.name}" 不是图片格式`);
        continue;
      }

      // Check file size
      if (file.size > maxSize) {
        toast.error(`图片 "${file.name}" 超过 ${maxSize / (1024 * 1024)}MB 限制`);
        continue;
      }

      try {
        // Read file as base64
        const base64 = await readFileAsBase64(file);
        
        const attachment: Attachment = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          data: base64,
          createdAt: new Date().toISOString(),
        };

        newAttachments.push(attachment);
      } catch (error) {
        console.error('Error reading file:', error);
        toast.error(`读取图片 "${file.name}" 失败`);
      }
    }

    if (newAttachments.length > 0) {
      onChange([...attachments, ...newAttachments]);
      toast.success(`成功添加 ${newAttachments.length} 张图片`);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get pure base64
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachment = (id: string) => {
    onChange(attachments.filter(att => att.id !== id));
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 设置 dropEffect 以显示正确的拖拽光标
    e.dataTransfer.dropEffect = 'copy';
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 只有当离开整个拖拽区域时才取消高亮
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    // 获取拖拽的文件
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 现在只支持图片，所以不需要这些函数了
  // const getFileIcon = (type: string) => ImageIcon;
  const isImage = (type: string) => type.startsWith('image/');

  const handleOpenFile = async (attachment: Attachment) => {
    // 检查是否在 Tauri 环境中
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
      // 浏览器环境：使用 blob URL 在新标签页打开
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
  };

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
          transition-colors
          ${isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary hover:bg-muted/50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          accept="image/*"
        />
        
        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <div className="text-sm text-foreground mb-1">
          点击或拖拽图片到此处上传
        </div>
        <div className="text-xs text-muted-foreground">
          支持 JPG、PNG、GIF 等图片格式，单张不超过 {maxSize / (1024 * 1024)}MB
        </div>
      </div>

      {/* Attachment List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-foreground">
            已添加图片 ({attachments.length})
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {attachments.map((attachment) => {
              return (
                <div
                  key={attachment.id}
                  className="flex items-center space-x-3 p-2 bg-muted rounded-lg group hover:bg-muted/80 transition-colors"
                >
                  {/* Image Preview */}
                  <div className="flex-shrink-0">
                    <div 
                      className="w-12 h-12 rounded overflow-hidden bg-background cursor-pointer"
                      onClick={() => handleOpenFile(attachment)}
                    >
                      <img
                        src={`data:${attachment.type};base64,${attachment.data}`}
                        alt={attachment.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* File Info */}
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleOpenFile(attachment)}
                  >
                    <div className="text-sm font-medium text-foreground truncate">
                      {attachment.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.size)}
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveAttachment(attachment.id);
                    }}
                    className="flex-shrink-0 p-1 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
