import React from 'react';
import { RoleCode } from '../../types';
import { ROLES_CONFIG } from '../../services/authService';
import { 
  HeartHandshake, 
  Stethoscope, 
  Wrench, 
  ClipboardCheck, 
  ShieldCheck, 
  KeyRound, 
  SmartphoneNfc 
} from 'lucide-react';

interface RoleSelectorProps {
  selectedRole: RoleCode;
  onSelectRole: (role: RoleCode) => void;
}

const ROLE_ICONS: Record<RoleCode, React.ComponentType<{ className?: string }>> = {
  pulmonologist: Stethoscope,
  twin_engineer: Wrench,
  reviewer: ClipboardCheck,
  patient_rep: HeartHandshake
};

export const RoleSelector: React.FC<RoleSelectorProps> = ({ selectedRole, onSelectRole }) => {
  const roleKeys = Object.keys(ROLES_CONFIG) as RoleCode[];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
          <span>选择业务身份体系</span>
          <span className="text-[10px] text-cyan-400/80 font-normal">（鉴权模式自适应联动）</span>
        </label>
        <span className="text-[10px] text-slate-400 font-mono">
          当前权限: <span className="text-cyan-300 font-semibold">{ROLES_CONFIG[selectedRole].securityLevel}</span>
        </span>
      </div>

      {/* 4大商业角色弹性滚轮网格 (手机端可水平滑动，电脑端平铺4列) */}
      <div className="flex sm:grid sm:grid-cols-4 gap-2 overflow-x-auto pb-1.5 sm:pb-0 scrollbar-none snap-x snap-mandatory">
        {roleKeys.map(code => {
          const config = ROLES_CONFIG[code];
          const Icon = ROLE_ICONS[code];
          const isSelected = selectedRole === code;
          const isPatient = code === 'patient_rep';

          return (
            <button
              key={code}
              type="button"
              onClick={() => onSelectRole(code)}
              className={`min-w-[125px] sm:min-w-0 flex-1 snap-start relative flex flex-col items-center text-center p-2.5 rounded-xl border transition-all duration-200 select-none group ${
                isSelected
                  ? 'bg-gradient-to-b from-cyan-950/80 to-slate-900/90 border-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.35)] scale-[1.02]'
                  : 'bg-slate-900/50 hover:bg-slate-800/60 border-slate-800/80 hover:border-slate-700 text-slate-400'
              }`}
            >
              {/* 选中高光光斑 */}
              {isSelected && (
                <div className="absolute inset-0 rounded-xl bg-cyan-500/10 pointer-events-none"></div>
              )}

              {/* 顶部安全等级 / 快速模式微标 */}
              <div className="w-full flex items-center justify-between mb-1.5">
                <span
                  className={`text-[9px] font-mono px-1 py-0.2 rounded border font-semibold ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700'
                  }`}
                >
                  {config.securityLevel}
                </span>

                {isPatient ? (
                  <span className="text-[9px] text-emerald-400 flex items-center gap-0.5">
                    <SmartphoneNfc className="w-2.5 h-2.5" />
                    <span>免密</span>
                  </span>
                ) : (
                  <span className="text-[9px] text-cyan-400/80 flex items-center gap-0.5">
                    <KeyRound className="w-2.5 h-2.5" />
                    <span>专线</span>
                  </span>
                )}
              </div>

              {/* 角色图标 */}
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center mb-1.5 transition-colors ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 shadow-inner'
                    : 'bg-slate-800/60 text-slate-400 group-hover:text-slate-300 group-hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>

              {/* 角色名称 */}
              <div
                className={`text-xs font-bold leading-tight mb-1 truncate max-w-full ${
                  isSelected ? 'text-cyan-200' : 'text-slate-300'
                }`}
              >
                {config.name}
              </div>

              {/* 机构标签 (脱敏精简) */}
              <div className="text-[9px] text-slate-500 truncate max-w-full font-sans scale-95">
                {code === 'patient_rep'
                  ? '慢病关爱中心'
                  : code === 'pulmonologist'
                  ? '三亚人民医院'
                  : code === 'twin_engineer'
                  ? '三亚学院超算'
                  : '胸部质控专委'}
              </div>

              {/* 选中态底部小灯 */}
              {isSelected && (
                <div className="mt-1.5 w-6 h-0.5 bg-gradient-to-r from-cyan-500 via-sky-400 to-cyan-500 rounded-full animate-pulse"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
