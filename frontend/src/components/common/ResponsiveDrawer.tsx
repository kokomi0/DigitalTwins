import React, { useState } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { ChevronUp, ChevronDown, Activity, FileText, GitBranch, Wrench } from 'lucide-react';

interface ResponsiveDrawerProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  title?: string;
}

export function ResponsiveDrawer({
  children,
  activeTab = 'clinical',
  onTabChange,
  title = "肺部数字孪生临床控制台"
}: ResponsiveDrawerProps) {
  // 抽屉展开状态: 'collapsed' (仅露把手, 50px), 'half' (展开45vh), 'full' (展开85vh)
  const [snapState, setSnapState] = useState<'collapsed' | 'half' | 'full'>('half');

  const getHeightClass = () => {
    switch (snapState) {
      case 'collapsed': return 'h-14';
      case 'half': return 'h-[48vh]';
      case 'full': return 'h-[85vh]';
    }
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    const offset = info.offset.y;
    const velocity = info.velocity.y;

    if (offset < -80 || velocity < -300) {
      // 向上大幅拖拽或快速滑拂
      if (snapState === 'collapsed') setSnapState('half');
      else if (snapState === 'half') setSnapState('full');
    } else if (offset > 80 || velocity > 300) {
      // 向下大幅拖拽或快速滑拂
      if (snapState === 'full') setSnapState('half');
      else if (snapState === 'half') setSnapState('collapsed');
    }
  };

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.12}
      onDragEnd={handleDragEnd}
      className={`fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/80 rounded-t-2xl shadow-2xl flex flex-col transition-all duration-300 ease-out select-none ${getHeightClass()}`}
    >
      {/* 拖拽手柄条与顶部栏 */}
      <div className="w-full pt-2 pb-1.5 px-4 cursor-grab active:cursor-grabbing flex flex-col items-center shrink-0">
        <div className="w-12 h-1.5 bg-slate-600 rounded-full mb-1.5"></div>
        <div className="w-full flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-200">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>{title}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (snapState === 'collapsed') setSnapState('half');
                else if (snapState === 'half') setSnapState('full');
                else setSnapState('collapsed');
              }}
              className="p-1 rounded bg-slate-800 text-slate-400 hover:text-slate-200"
            >
              {snapState === 'full' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 抽屉导航标签 (在折叠或展开时方便切换面板) */}
      {snapState !== 'collapsed' && onTabChange && (
        <div className="px-4 py-1.5 flex gap-2 border-b border-slate-800/80 shrink-0 overflow-x-auto">
          <button
            onClick={() => onTabChange('clinical')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeTab === 'clinical'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-800/60 text-slate-400'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>临床指标与报告</span>
          </button>

          <button
            onClick={() => onTabChange('anatomy')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeTab === 'anatomy'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-800/60 text-slate-400'
            }`}
          >
            <GitBranch className="w-3 h-3" />
            <span>B1-B10解剖树</span>
          </button>

          <button
            onClick={() => onTabChange('controls')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeTab === 'controls'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-800/60 text-slate-400'
            }`}
          >
            <Wrench className="w-3 h-3" />
            <span>参数调优与态势</span>
          </button>
        </div>
      )}

      {/* 抽屉主滚动区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {children}
      </div>
    </motion.div>
  );
}
