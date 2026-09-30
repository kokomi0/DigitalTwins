import React, { useState, useEffect } from 'react';
import { PatientMeta, AnatomyNode, SimulationFrame } from '../../types';
import { ViewModeToggle, PatientViewMode } from './components/ViewModeToggle';
import { PatientDesktopPortal } from './PatientDesktopPortal';
import { PatientMobileSimulator } from './PatientMobileSimulator';
import { QRCodeModal } from '../../components/common/QRCodeModal';

interface PatientWorkbenchProps {
  activeMenuId?: string;
  patient: PatientMeta;
  nodes?: AnatomyNode[];
  selectedNode?: AnatomyNode | null;
  onSelectNode?: (node: AnatomyNode) => void;
  simulationFrame?: SimulationFrame;
  onOpenKnowledgeGraph?: (nodeId?: string) => void;
}

export const PatientWorkbench: React.FC<PatientWorkbenchProps> = ({
  patient,
  activeMenuId,
  simulationFrame,
  onOpenKnowledgeGraph
}) => {
  // 依据屏幕宽度初始化：宽屏 (>=1024px) 默认全景看板，窄屏移动端默认手机模拟器
  const [viewMode, setViewMode] = useState<PatientViewMode>(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      return 'desktop';
    }
    return 'mobile';
  });

  // 扫码弹窗
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 overflow-hidden relative">
      {/* 视口右上角悬浮：高质感显示模式切换器 (ViewModeToggle) */}
      <div className="absolute top-3.5 right-6 z-40 flex items-center gap-2">
        <ViewModeToggle
          mode={viewMode}
          onChange={setViewMode}
          onOpenQR={() => setIsQRModalOpen(true)}
        />
      </div>

      {/* 主视图区：在电脑端宽屏全景看板与手机真机模拟之间无缝自由切换 */}
      <div className="flex-1 w-full h-full overflow-hidden">
        {viewMode === 'desktop' ? (
          <PatientDesktopPortal
            patient={patient}
            activeMenuId={activeMenuId}
            simulationFrame={simulationFrame}
            onOpenKnowledgeGraph={onOpenKnowledgeGraph}
          />
        ) : (
          <PatientMobileSimulator
            patient={patient}
            activeMenuId={activeMenuId}
            onOpenQR={() => setIsQRModalOpen(true)}
          />
        )}
      </div>

      {/* 真机扫码弹窗 */}
      <QRCodeModal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} />
    </div>
  );
};

export default PatientWorkbench;
