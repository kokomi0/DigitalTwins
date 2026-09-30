import React, { useState } from 'react';
import { MobileHealthApp } from '../mobile/MobileHealthApp';
import { PatientMeta } from '../../types';
import { QRCodeModal } from '../../components/common/QRCodeModal';
import { Smartphone, QrCode, Sparkles } from 'lucide-react';

interface PatientMobileSimulatorProps {
  patient: PatientMeta;
  activeMenuId?: string;
  onOpenQR?: () => void;
}

export const PatientMobileSimulator: React.FC<PatientMobileSimulatorProps> = ({
  patient,
  activeMenuId,
  onOpenQR
}) => {
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  const handleOpenQR = () => {
    if (onOpenQR) {
      onOpenQR();
    } else {
      setIsQRModalOpen(true);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-3 sm:p-6 bg-slate-950 overflow-hidden relative select-none">
      {/* 顶部背景微发光氛围 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[750px] bg-gradient-to-tr from-cyan-900/15 via-blue-900/10 to-teal-900/15 rounded-full blur-3xl pointer-events-none" />

      {/* 拟态 iPhone 16 Pro 手机外壳 (带灵动岛、高精度金属拉丝边框、高质感多重阴影) */}
      <div className="relative w-[385px] sm:w-[395px] h-[780px] max-h-[92vh] rounded-[52px] p-3 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border-4 border-slate-700/80 shadow-[0_0_60px_-15px_rgba(6,182,212,0.35)] ring-1 ring-slate-500/40 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 z-10">
        {/* 金属拉丝高光边框内衬 */}
        <div className="relative w-full h-full rounded-[42px] overflow-hidden bg-white flex flex-col shadow-inner">
          {/* 灵动岛 (Dynamic Island) */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-40 flex items-center justify-between px-2.5 shadow-md">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 animate-pulse" />
          </div>

          {/* 手机内部应用视口 */}
          <div className="flex-1 w-full h-full pt-6">
            <MobileHealthApp
              patient={patient}
              isInsideMockup={true}
              activeMenuId={activeMenuId}
            />
          </div>
        </div>
      </div>

      {/* 底部设备状态与扫码提示 */}
      <div className="mt-3 flex items-center gap-3 text-xs text-slate-400 z-10">
        <span className="flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          <span>iPhone 16 Pro 手机真机模拟视口</span>
        </span>
        <span className="text-slate-600">·</span>
        <button
          type="button"
          onClick={handleOpenQR}
          className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition"
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>在真实手机中扫码打开 →</span>
        </button>
      </div>

      {/* 内部扫码弹窗 */}
      <QRCodeModal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} />
    </div>
  );
};

export default PatientMobileSimulator;
