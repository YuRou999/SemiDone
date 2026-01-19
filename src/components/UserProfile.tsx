import React, { useState, useRef } from 'react';
import { User, Edit3, Upload, X } from 'lucide-react';
import { useUserStore } from '../store/userStore';

interface UserProfileProps {
  showEditModal?: boolean;
  onEditModalChange?: (show: boolean) => void;
}

export default function UserProfile({ showEditModal = false, onEditModalChange }: UserProfileProps) {
  const { username, avatar, setUsername, setAvatar } = useUserStore();
  const [isEditing, setIsEditing] = useState(showEditModal);
  const [tempUsername, setTempUsername] = useState(username);
  const [tempAvatar, setTempAvatar] = useState(avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEditClick = () => {
    setIsEditing(true);
    setTempUsername(username);
    setTempAvatar(avatar);
    onEditModalChange?.(true);
  };

  const handleSave = () => {
    setUsername(tempUsername.trim() || '用户');
    setAvatar(tempAvatar);
    setIsEditing(false);
    onEditModalChange?.(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 检查文件大小（限制为2MB）
      if (file.size > 2 * 1024 * 1024) {
        alert('文件大小不能超过2MB');
        return;
      }
      
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
      }
      
      // 读取文件并转换为base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setTempAvatar(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleCancel = () => {
    setTempUsername(username);
    setTempAvatar(avatar);
    setIsEditing(false);
    onEditModalChange?.(false);
  };



  return (
    <>
      {/* 用户头像显示 */}
      <div className="flex items-center space-x-3 cursor-pointer" onClick={handleEditClick}>
        <div className="relative group">
          <img
            src={avatar}
            alt={username}
            className="w-8 h-8 rounded-full object-cover border-2 border-border group-hover:border-primary transition-colors"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20avatar%20simple%20friendly%20person%20icon%20minimalist%20style&image_size=square';
            }}
          />
          <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Edit3 className="w-3 h-3 text-white" />
          </div>
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-medium text-foreground truncate max-w-20">{username}</p>
          <p className="text-xs text-muted-foreground">点击编辑</p>
        </div>
      </div>

      {/* 编辑弹窗 */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">编辑个人信息</h3>
              <button
                onClick={handleCancel}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* 头像编辑 */}
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <img
                    src={tempAvatar}
                    alt="预览头像"
                    className="w-20 h-20 rounded-full object-cover border-4 border-border"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20avatar%20simple%20friendly%20person%20icon%20minimalist%20style&image_size=square';
                    }}
                  />
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={triggerFileUpload}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center space-x-2 mx-auto"
                >
                  <Upload className="w-4 h-4" />
                  <span>上传头像</span>
                </button>
                <p className="text-xs text-muted-foreground mt-2">支持JPG、PNG格式，文件大小不超过2MB</p>
              </div>

              {/* 用户名编辑 */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <User className="inline w-4 h-4 mr-1" />
                  用户名
                </label>
                <input
                  type="text"
                  value={tempUsername}
                  onChange={(e) => setTempUsername(e.target.value)}
                  placeholder="请输入用户名"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground"
                  maxLength={20}
                />
                <div className="mt-1 text-xs text-muted-foreground text-right">
                  {tempUsername.length}/20
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}