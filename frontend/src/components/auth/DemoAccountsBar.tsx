import React from 'react';
import { RoleCode } from '../../types';
import { ROLES_CONFIG } from '../../services/authService';
import { Zap, Stethoscope, Wrench, ClipboardCheck, HeartHandshake } from 'lucide-react';

interface DemoAccountsBarProps {
  onFillDemo: (role: RoleCode) => void;
  activeRole: RoleCode;
}

const ROLE_ICONS: Record<RoleCode, React.ComponentType<{ className?: string }>> = {
  pulmonologist: Stethoscope,
  twin_engineer: Wrench,
  reviewer: ClipboardCheck,
  patient_rep: HeartHandshake
};

export const DemoAccountsBar: React.FC<DemoAccountsBarProps> = ({ onFillDemo, activeRole }) => {
  const roles = Object.keys(ROLES_CONFIG) as RoleCode[];

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 rounded-xl p-2 shadow-lg shadow-cyan-950/40">
      <div className="flex items-center justify-between px-1 mb-1.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
          <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
          <span>演示专区 · 一键填入预设测试身份</span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
          免去手动输入 · 点击快速进入对应系统视角
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {roles.map(code => {
          const config = ROLES_CONFIG[code];
          const Icon = ROLE_ICONS[code];
          const isActive = activeRole === code;

          return (
            <button
              key={code}
              type="button"
              onClick={() => onFillDemo(code)}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-left transition-all duration-150 active:scale-95 group ${
                isActive
                  ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-500/30'
                  : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title={`点击快速填入 ${config.name} (${config.demoAccount.realName})`}
            >
              <div
                className={`p-1 rounded shrink-0 ${
                  isActive ? 'bg-cyan-500/30 text-cyan-300' : 'bg-slate-800 text-slate-400 group-hover:text-cyan-300'
                }`}
              >
                <Icon className="w-3 h-3" />
              </div>
              <div className="min-w-0 flex-1 truncate">
                <div className="text-[11px] font-semibold truncate leading-none mb-0.5">
                  {code === 'patient_rep'
                    ? '慢病患者'
                    : code === 'pulmonologist'
                    ? '主治医师'
                    : code === 'twin_engineer'
                    ? '算法专家'
                    : '质控专家'}
                </div>
                <div className="text-[9px] text-slate-400 font-mono truncate leading-none">
                  {code === 'patient_rep' ? '138****0001' : config.demoAccount.username}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
