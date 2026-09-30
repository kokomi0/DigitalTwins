import React, { useState } from 'react';
import { MobileHealthApp } from './MobileHealthApp';
import { PatientMeta } from '../../types';
import { Smartphone, Monitor, QrCode, Sparkles } from 'lucide-react';
import { QRCodeModal } from '../../components/common/QRCodeModal';

interface PhoneMockupContainerProps {
  patient: PatientMeta;
  isMobileDevice?: boolean;
  hideModeSwitch?: boolean;
  activeMenuId?: string;
}

export const PhoneMockupContainer: React.FC<PhoneMockupContainerProps> = ({
  patient,
  isMobileDevice = false,
  hideModeSwitch = false,
  activeMenuId
}) => {
  // 在电脑端允许切换：拟态手机框 vs 宽屏卡片视图 (患者端默认锁定纯净精致手机拟态框，隐藏技术测试工具条)
  const [viewMode, setViewMode] = useState<'PHONE_FRAME' | 'FULL_WIDTH'>(
    isMobileDevice ? 'FULL_WIDTH' : 'PHONE_FRAME'
  );
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  // 如果是在真实移动端设备下，直接全屏渲染
  if (isMobileDevice) {
    return <MobileHealthApp patient={patient} isInsideMockup={false} activeMenuId={activeMenuId} />;
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-3 md:p-6 bg-slate-950 overflow-hidden relative select-none">
      {/* 顶部体验切换工具条 (非患者端/医生管理端调试时展示，患者端隐藏以保持界面纯净温馨) */}
      {!hideModeSwitch && (
        <div className="absolute top-3 right-6 z-30 flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-2xl shadow-xl backdrop-blur-md text-xs">
          <span className="text-slate-400 font-medium hidden sm:inline">移动端视口展示模式:</span>

          <button
            onClick={() => setViewMode('PHONE_FRAME')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-bold transition ${
              viewMode === 'PHONE_FRAME'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="使用 iPhone 16 Pro 商业级真实手机边框拟态体验"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>手机拟态框</span>
          </button>

          <button
            onClick={() => setViewMode('FULL_WIDTH')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-bold transition ${
              viewMode === 'FULL_WIDTH'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="展开为宽屏全貌卡片视图"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>宽屏自适应</span>
          </button>

          <button
            onClick={() => setIsQRModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold border border-cyan-800/60 transition"
            title="扫码在真实手机上立即打开体验"
          >
            <QrCode className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">真机扫码</span>
          </button>
        </div>
      )}

      {viewMode === 'PHONE_FRAME' ? (
        // 拟态 iPhone 16 Pro 手机外壳 (带灵动岛、金属高光拉丝边框、高质感投影)
        <div className="relative w-[390px] h-[780px] max-h-[92vh] rounded-[52px] p-3 bg-slate-900 border-4 border-slate-700/80 shadow-[0_0_60px_-15px_rgba(6,182,212,0.3)] ring-1 ring-slate-600/40 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
          {/* 金属拉丝外边框外壳 */}
          <div className="relative w-full h-full rounded-[42px] overflow-hidden bg-white flex flex-col shadow-inner">
            {/* 灵动岛 (Dynamic Island) */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-40 flex items-center justify-between px-2.5 shadow-md">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 animate-pulse" />
            </div>

            {/* 手机内部应用 */}
            <div className="flex-1 w-full h-full pt-6">
              <MobileHealthApp patient={patient} isInsideMockup={true} activeMenuId={activeMenuId} />
            </div>
          </div>
        </div>
      ) : (
        // 宽屏模式自适应
        <div className="w-full max-w-4xl h-full max-h-[92vh] rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-white">
          <MobileHealthApp patient={patient} isInsideMockup={false} activeMenuId={activeMenuId} />
        </div>
      )}

      {/* 手机扫码弹窗 */}
      <QRCodeModal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} />
    </div>
  );
};

export default PhoneMockupContainer;
