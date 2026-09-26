import React from 'react';
import { RoleCode, UserProfile, PatientMeta } from '../../types';
import { RoleSwitcher } from './RoleSwitcher';
import { 
  Activity, 
  ShieldCheck, 
  Smartphone, 
  Monitor, 
  QrCode, 
  LogOut, 
  UploadCloud, 
  Network,
  Radio
} from 'lucide-react';

interface HeaderProps {
  currentUser: UserProfile;
  onSwitchRole: (role: RoleCode) => void;
  patient: PatientMeta;
  isMobile: boolean;
  lodLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  onLodChange?: (lod: 'HIGH' | 'MEDIUM' | 'LOW') => void;
  onOpenQR?: () => void;
  onLogout?: () => void;
  onOpenCTModal?: () => void;
  onOpenKnowledgeGraph?: () => void;
}

export function Header({
  currentUser,
  onSwitchRole,
  patient,
  isMobile,
  lodLevel,
  onOpenQR,
  onLogout,
  onOpenCTModal,
  onOpenKnowledgeGraph
}: HeaderProps) {
  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-3 md:px-5 flex items-center justify-between z-30 shrink-0 select-none">
      {/* 头部左侧：商业医疗品牌与系统标头 */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 border border-cyan-400/40">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xs md:text-sm font-extrabold tracking-wide text-slate-100 flex items-center gap-2">
              <span>肺部数字孪生交互系统</span>
              <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-mono font-normal">
                B1-B10 · IASLC 1R-12L v2.6
              </span>
            </h1>
            <p className="hidden md:block text-[10px] text-slate-400">
              三亚市人民医院 (临床) ✕ 三亚学院 (超算仿真重点实验室)
            </p>
          </div>
        </div>

        {/* 双超算专线在线指示 */}
        <div className="hidden 2xl:flex items-center gap-1.5 pl-3 border-l border-slate-800 text-[11px] font-mono text-emerald-400">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>双超算专线 4.2ms</span>
        </div>
      </div>

      {/* 头部右侧：快捷操作入口与角色切换栏 */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        
        {/* 商业级快捷动作：导入患者 CT */}
        {onOpenCTModal && (
          <button
            onClick={onOpenCTModal}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600/90 to-blue-600/90 hover:from-cyan-500 hover:to-blue-500 text-white shadow-sm border border-cyan-400/40 transition active:scale-95"
            title="导入胸部薄层CT并一键启动AI数字孪生体重建"
          >
            <UploadCloud className="w-3.5 h-3.5 text-cyan-200" />
            <span className="hidden md:inline">导入患者 CT</span>
          </button>
        )}

        {/* 商业级快捷动作：COPD 知识图谱 */}
        {onOpenKnowledgeGraph && (
          <button
            onClick={onOpenKnowledgeGraph}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-700/60 shadow-sm transition active:scale-95"
            title="打开《COPD慢病知识图谱》诊疗决策网络"
          >
            <Network className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">慢病知识图谱</span>
          </button>
        )}

        {/* 手机扫码访问快捷弹窗入口 */}
        <button
          onClick={onOpenQR}
          className="flex items-center gap-1.5 text-[11px] font-medium px-2 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition active:scale-95"
          title="手机扫码在移动设备打开并体验3D触控"
        >
          <QrCode className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden lg:inline">手机端</span>
        </button>

        {/* 一键切换 4 大角色体验演示器 */}
        <RoleSwitcher currentUser={currentUser} onSwitchRole={onSwitchRole} />

        {/* 当前登录身份徽标与退出登录 */}
        <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-800">
          <div className="hidden xl:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-200 leading-none truncate max-w-[100px]">
              {currentUser.real_name}
            </span>
            <span className="text-[9px] text-cyan-400 font-mono mt-0.5">
              {currentUser.role_name}
            </span>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-200 border border-rose-800/40 hover:border-rose-600 transition text-xs font-medium active:scale-95"
              title="退出登录并返回统一鉴权认证门户"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">退出</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
