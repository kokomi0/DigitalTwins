import React, { useState } from 'react';
import { RoleCode, UserProfile } from '../../types';
import { UserCheck, ChevronDown, Wrench, Stethoscope, ClipboardCheck, HeartHandshake } from 'lucide-react';

interface RoleSwitcherProps {
  currentUser: UserProfile;
  onSwitchRole: (role: RoleCode) => void;
}

const ROLES_INFO: Array<{ code: RoleCode; name: string; title: string; icon: React.ComponentType<{ className?: string }> }> = [
  { code: 'pulmonologist', name: '呼吸科临床主治医师', title: '王主任 (CT导入与知识图谱决策)', icon: Stethoscope },
  { code: 'twin_engineer', name: '数字孪生算法工程师', title: '张工 (网格细化与CFD流体仿真)', icon: Wrench },
  { code: 'reviewer', name: '临床诊疗质控员', title: '李专家 (双盲复核与指南依从性)', icon: ClipboardCheck },
  { code: 'patient_rep', name: '慢病患者及家属', title: '张老伯 (7x24h预警与康复打卡)', icon: HeartHandshake }
];

export function RoleSwitcher({ currentUser, onSwitchRole }: RoleSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentRole = ROLES_INFO.find(r => r.code === currentUser.role_code) || ROLES_INFO[0];
  const IconComponent = currentRole.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/40 hover:border-cyan-400 text-slate-100 transition shadow-lg shadow-cyan-950/40"
      >
        <span className="p-1 rounded-md bg-cyan-500/20 text-cyan-400">
          <IconComponent className="w-3.5 h-3.5" />
        </span>
        <div className="text-left">
          <div className="text-xs font-bold flex items-center gap-1.5 text-cyan-300">
            {currentRole.name}
            <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
          <div className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
            {currentUser.real_name} · 演示器
          </div>
        </div>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              一键切换4大商业角色交互视角
            </div>
            <div className="mt-1 space-y-1">
              {ROLES_INFO.map(item => {
                const ItemIcon = item.icon;
                const isSelected = item.code === currentUser.role_code;
                return (
                  <button
                    key={item.code}
                    onClick={() => {
                      onSwitchRole(item.code);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs transition ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className={`p-1 rounded ${isSelected ? 'bg-cyan-500/30 text-cyan-300' : 'bg-slate-800 text-slate-400'}`}>
                      <ItemIcon className="w-3.5 h-3.5" />
                    </span>
                    <div className="flex-1 truncate">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-[10px] text-slate-500">{item.title}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
