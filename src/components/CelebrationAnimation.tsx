import React, { useEffect, useState } from 'react';

interface CelebrationAnimationProps {
  show: boolean;
  message: string;
  onComplete: () => void;
  isAllComplete?: boolean;
}

export default function CelebrationAnimation({ show, message, onComplete, isAllComplete = false }: CelebrationAnimationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onComplete, 300); // Wait for fade out
      }, isAllComplete ? 2000 : 1500);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show && !visible) return null;

  return (
    <div className={`
      fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none
      transition-opacity duration-300
      ${visible ? 'opacity-100' : 'opacity-0'}
    `}>
      <div className="relative">
        {/* Fireworks particles */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Main firework ring */}
          {[...Array(isAllComplete ? 12 : 8)].map((_, i) => (
            <div
              key={i}
              className={`
                absolute ${isAllComplete ? 'w-4 h-4' : 'w-3 h-3'} bg-yellow-400 rounded-full
                animate-ping
              `}
              style={{
                transform: `rotate(${i * (360 / (isAllComplete ? 12 : 8))}deg) translateX(${isAllComplete ? 80 : 60}px)`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: isAllComplete ? '1.2s' : '0.8s'
              }}
            />
          ))}
          {/* Secondary sparkles */}
          {[...Array(isAllComplete ? 16 : 6)].map((_, i) => (
            <div
              key={`spark-${i}`}
              className={`
                absolute ${isAllComplete ? 'w-2 h-2' : 'w-1.5 h-1.5'} bg-blue-400 rounded-full
                animate-ping
              `}
              style={{
                transform: `rotate(${i * (360 / (isAllComplete ? 16 : 6))}deg) translateX(${isAllComplete ? 120 : 80}px)`,
                animationDelay: `${i * 0.08}s`,
                animationDuration: isAllComplete ? '1.5s' : '1s'
              }}
            />
          ))}
          {/* Extra outer ring for all complete */}
          {isAllComplete && [...Array(20)].map((_, i) => (
            <div
              key={`outer-${i}`}
              className="absolute w-1 h-1 bg-pink-400 rounded-full animate-ping"
              style={{
                transform: `rotate(${i * 18}deg) translateX(150px)`,
                animationDelay: `${i * 0.05}s`,
                animationDuration: '2s'
              }}
            />
          ))}
        </div>
        
        {/* Central celebration message */}
        <div className={`
          bg-card/95 dark:bg-gray-800/95 backdrop-blur-sm border border-border rounded-xl shadow-2xl
          transform transition-all duration-500
          ${visible ? 'scale-100' : 'scale-75'}
          ${isAllComplete ? 'p-8' : 'p-4'}
        `}>
          <div className="text-center">
            <div className={`${isAllComplete ? 'text-6xl mb-4' : 'text-3xl mb-2'} animate-bounce`}>
              {isAllComplete ? '🎊' : '🎉'}
            </div>
            <p className={`${isAllComplete ? 'text-xl' : 'text-sm'} font-bold text-foreground dark:text-gray-100 ${isAllComplete ? 'mb-2' : ''}`}>
              {message}
            </p>
            {isAllComplete && (
              <div className="flex justify-center space-x-2 text-2xl animate-pulse">
                <span>✨</span>
                <span>🌟</span>
                <span>💫</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
