import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronsRight, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';

interface SecuritySliderProps {
  isVerified: boolean;
  onVerifyChange: (verified: boolean) => void;
}

export const SecuritySlider: React.FC<SecuritySliderProps> = ({ isVerified, onVerifyChange }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [sliderPosition, setSliderPosition] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const startXRef = useRef<number>(0);
  const maxDragRef = useRef<number>(200);

  const updateMaxDrag = useCallback(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const thumbWidth = 44; // w-11
      maxDragRef.current = Math.max(containerWidth - thumbWidth - 4, 100);
    }
  }, []);

  useEffect(() => {
    updateMaxDrag();
    window.addEventListener('resize', updateMaxDrag);
    return () => window.removeEventListener('resize', updateMaxDrag);
  }, [updateMaxDrag]);

  // 重置滑块
  const handleReset = () => {
    setSliderPosition(0);
    setIsDragging(false);
    onVerifyChange(false);
  };

  // 鼠标 / 触控开始
  const handleStart = (clientX: number) => {
    if (isVerified) return;
    setIsDragging(true);
    startXRef.current = clientX - sliderPosition;
  };

  // 移动中
  const handleMove = useCallback((clientX: number) => {
    if (!isDragging || isVerified) return;
    const newPos = Math.max(0, Math.min(clientX - startXRef.current, maxDragRef.current));
    setSliderPosition(newPos);

    // 拖动达到 94% 以上判定成功
    if (newPos >= maxDragRef.current * 0.94) {
      setSliderPosition(maxDragRef.current);
      setIsDragging(false);
      onVerifyChange(true);
    }
  }, [isDragging, isVerified, onVerifyChange]);

  // 拖动结束
  const handleEnd = useCallback(() => {
    if (!isDragging || isVerified) return;
    setIsDragging(false);
    if (sliderPosition < maxDragRef.current * 0.94) {
      // 没到底，弹性回弹
      setSliderPosition(0);
    }
  }, [isDragging, isVerified, sliderPosition]);

  // 全局移动监听
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) handleMove(e.touches[0].clientX);
    };
    const onMouseUp = () => handleEnd();
    const onTouchEnd = () => handleEnd();

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>安全防刷校验</span>
        </label>
        {isVerified && (
          <button
            type="button"
            onClick={handleReset}
            className="text-[10px] text-slate-500 hover:text-cyan-400 flex items-center gap-1 transition"
          >
            <RefreshCw className="w-3 h-3" />
            <span>重新核验</span>
          </button>
        )}
      </div>

      <div
        ref={containerRef}
        className={`relative h-11 rounded-xl border select-none overflow-hidden transition-colors flex items-center ${
          isVerified
            ? 'bg-emerald-950/40 border-emerald-500/50 shadow-sm shadow-emerald-950/40'
            : 'bg-slate-950/80 border-slate-700/80 hover:border-slate-600'
        }`}
      >
        {/* 背景滑行进度高光条 */}
        <div
          className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-cyan-950/60 to-cyan-600/30 transition-all pointer-events-none"
          style={{ width: `${sliderPosition + 22}px` }}
        ></div>

        {/* 提示文案 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs font-medium">
          {isVerified ? (
            <span className="text-emerald-300 font-bold flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>专线环境安全核验已通过</span>
            </span>
          ) : (
            <span className="text-slate-400 flex items-center gap-1 font-mono">
              <span>向右滑动完成专线安全验证</span>
              <ChevronsRight className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            </span>
          )}
        </div>

        {/* 可拖动滑块 */}
        <div
          onMouseDown={e => handleStart(e.clientX)}
          onTouchStart={e => {
            if (e.touches.length > 0) handleStart(e.touches[0].clientX);
          }}
          className={`absolute left-0 top-0.5 bottom-0.5 w-11 rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing transition-transform duration-75 shadow-md ${
            isVerified
              ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/40'
              : 'bg-gradient-to-tr from-cyan-600 to-cyan-400 text-slate-950 shadow-cyan-500/40 hover:scale-105'
          }`}
          style={{
            transform: `translateX(${sliderPosition}px)`,
            cursor: isVerified ? 'default' : 'grab'
          }}
          title={isVerified ? '已通过核验' : '拖动滑块至最右端'}
        >
          {isVerified ? (
            <CheckCircle2 className="w-5 h-5 text-slate-950" />
          ) : (
            <ChevronsRight className="w-5 h-5 text-slate-950" />
          )}
        </div>
      </div>
    </div>
  );
};
