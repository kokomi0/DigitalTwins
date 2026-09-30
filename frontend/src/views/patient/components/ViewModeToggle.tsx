import React from 'react';
import { Monitor, Smartphone, QrCode } from 'lucide-react';

export type PatientViewMode = 'desktop' | 'mobile';

interface ViewModeToggleProps {
  mode: PatientViewMode;
  onChange: (mode: PatientViewMode) => void;
  onOpenQR?: () => void;
  className?: string;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  mode,
  onChange,
  onOpenQR,
  className = ''
}) => {
  return (
    <div
      className={`inline-flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-xl backdrop-blur-md ${className}`}
    >
      <div className="flex items-center gap-1">
        {/* 电脑端全景看板按钮 */}
        <button
          type="button"
          onClick={() => onChange('desktop')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all duration-200 ${
            mode === 'desktop'
              ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-900/40 ring-1 ring-teal-400/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="展开为宽屏全景现代医疗健康看板"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>🖥️ 电脑端全景看板</span>
        </button>

        {/* 手机真机模拟按钮 */}
        <button
          type="button"
          onClick={() => onChange('mobile')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all duration-200 ${
            mode === 'mobile'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-900/40 ring-1 ring-cyan-400/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="使用真实手机拟态框体验 APP 交互"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>📱 手机真机模拟</span>
        </button>
      </div>

      {/* 真实真机扫码按钮 */}
      {onOpenQR && (
        <>
          <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />
          <button
            type="button"
            onClick={onOpenQR}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/90 text-cyan-300 font-semibold text-xs border border-cyan-800/60 transition shadow-sm"
            title="在手机微信/浏览器中扫码体验真实 APP"
          >
            <QrCode className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">真机扫码</span>
          </button>
        </>
      )}
    </div>
  );
};

export default ViewModeToggle;
