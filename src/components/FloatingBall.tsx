import React, { useState, useEffect, useRef } from 'react';
import { useSettingsStore } from '../store/settingsStore';

interface FloatingBallProps {
  onExpand: () => void;
  onClose: () => void;
  isTransparent?: boolean; // 添加透明模式支持
}

export default function FloatingBall({ onExpand, onClose, isTransparent }: FloatingBallProps) {
  const { settings, setEdgeSnap } = useSettingsStore();

  // 应用透明效果
  useEffect(() => {
    // 保存原始设置
    const originalTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const wasTransparent = document.body.classList.contains('transparent-mode');
    const originalOpacity = document.documentElement.style.getPropertyValue('--window-opacity');
    
    // 始终应用深色主题和100%透明效果
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.style.setProperty('--window-opacity', '0');
    document.body.classList.add('transparent-mode');
    
    // 组件卸载时恢复原始设置
    return () => {
      document.documentElement.setAttribute('data-theme', originalTheme);
      if (wasTransparent) {
        document.documentElement.style.setProperty('--window-opacity', originalOpacity);
      } else {
        document.documentElement.style.setProperty('--window-opacity', '1');
        document.body.classList.remove('transparent-mode');
      }
    };
  }, []);

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const ballRef = useRef<HTMLDivElement>(null);
  const [isNearEdge, setIsNearEdge] = useState(false);

  // 检测是否接近屏幕边缘
  const checkEdgeProximity = (x: number, screenWidth: number) => {
    const threshold = 50;
    return x < threshold || x > screenWidth - threshold;
  };

  // 鼠标按下开始拖拽（仅左键）
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;

    setIsDragging(true);
    const rect = ballRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
    e.preventDefault();
  };

  // 拖拽 & 边缘吸附
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!ballRef.current) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      ballRef.current.style.left = `${newX}px`;
      ballRef.current.style.top = `${newY}px`;

      const screenWidth = window.screen.width;
      const ballWidth = ballRef.current.offsetWidth;
      const ballCenterX = newX + ballWidth / 2;

      setIsNearEdge(checkEdgeProximity(ballCenterX, screenWidth));
    };

    const handleMouseUp = async () => {
      setIsDragging(false);

      if (!ballRef.current || !isNearEdge) {
        setIsNearEdge(false);
        return;
      }

      try {
        const screenWidth = window.screen.width;
        const ballWidth = ballRef.current.offsetWidth;
        const currentX = parseInt(ballRef.current.style.left) || 0;
        const ballCenterX = currentX + ballWidth / 2;

        const position = ballCenterX < screenWidth / 2 ? 'left' : 'right';
        await setEdgeSnap(true, position);
      } catch (error) {
        console.error('边缘吸附失败:', error);
      } finally {
        setIsNearEdge(false);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, isNearEdge, setEdgeSnap]);

  // 点击展开
  const handleClick = () => {
    if (settings.isEdgeSnapped) {
      setEdgeSnap(false);
    } else {
      onExpand();
    }
  };

  const isSnapped = settings.isEdgeSnapped;

  return (
    <div
      ref={ballRef}
      onContextMenu={(e) => e.preventDefault()}
      className={`
        fixed top-0 left-0 z-50 select-none cursor-pointer overflow-hidden
        flex items-center justify-center p-0 m-0
        ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'}
      `}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      style={{
        width: isSnapped ? '30px' : '55px', 
        height: isSnapped ? '30px' : '55px',
        WebkitAppRegion: 'drag',
      } as React.CSSProperties}
    >
      <img
        src="/Logo3D.png"
        alt="事半·SemiDone"
        // 核心修复：w-full h-full 铺满容器，object-cover 确保无边距填充
        className="w-full h-full object-cover block p-0 m-0"
        draggable={false}
      />
    </div>
  );
}