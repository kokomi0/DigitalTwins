import React from 'react';
import { UserProfile, PatientMeta, RoleCode } from '../../types';
import { 
  Activity, 
  QrCode, 
  LogOut, 
  UploadCloud, 
  Network,
  User,
  ShieldCheck,
  Stethoscope,
  Wrench,
  ClipboardCheck,
  Heart,
  Layers,
  Sparkles,
  BookOpen,
  BarChart3,
  Smartphone,
  Cpu
} from 'lucide-react';

export type SubsystemType = 
  | 'DOCTOR_WORKSTATION' 
  | 'PATIENT_MOBILE_APP' 
  | 'KNOWLEDGE_REHAB' 
  | 'HOSPITAL_COCKPIT'
  | string;

export interface NavItemConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  title?: string;
  activeColor?: string;
}

/**
 * 依据用户角色动态过滤顶栏可访问业务导航 (RBAC Role-Based Navigation)
 * 严格杜绝患者端展示医生工作站或全院态势大屏
 */
export const getNavItemsByRole = (role: RoleCode): NavItemConfig[] => {
  switch (role) {
    case 'patient_rep':
      return [
        { 
          id: 'patient_app', 
          label: '我的健康管家 (移动端APP)', 
          icon: Smartphone, 
          title: '惠呼吸慢病健康管家移动端',
          activeColor: 'bg-teal-600 shadow-teal-950/60' 
        },
        { 
          id: 'education_kg', 
          label: '7×24h 康复宣教知识库', 
          icon: BookOpen, 
          title: 'COPD 康复宣教与通俗知识库',
          activeColor: 'bg-purple-600 shadow-purple-950/60' 
        }
      ];
    case 'pulmonologist':
      return [
        { 
          id: 'doctor_station', 
          label: '3D孪生临床工作站', 
          icon: Stethoscope, 
          title: '呼吸科临床高精3D肺数字孪生工作站',
          activeColor: 'bg-cyan-600 shadow-cyan-950/60' 
        },
        { 
          id: 'cdss_kg', 
          label: '临床知识图谱辅助决策 (CDSS)', 
          icon: Network, 
          title: '知识图谱辅助临床用药分级与指南推理决策',
          activeColor: 'bg-purple-600 shadow-purple-950/60' 
        },
        { 
          id: 'hospital_stat', 
          label: '全院 COPD 临床态势与科研', 
          icon: BarChart3, 
          title: '科研与全院管理端态势大屏',
          activeColor: 'bg-emerald-600 shadow-emerald-950/60' 
        }
      ];
    case 'twin_engineer':
      return [
        { 
          id: 'engineer_studio', 
          label: '数字孪生仿真工作室', 
          icon: Wrench, 
          title: '模型网格拓扑、PyBullet生物力学与CFD解算工作室',
          activeColor: 'bg-emerald-600 shadow-emerald-950/60' 
        },
        { 
          id: 'hpc_pipeline', 
          label: '双超算调度与脱敏管道', 
          icon: Cpu, 
          title: '双超算集群算力监控与隐私脱敏安全网关',
          activeColor: 'bg-teal-600 shadow-teal-950/60' 
        }
      ];
    case 'reviewer':
      return [
        { 
          id: 'reviewer_center', 
          label: '双盲方案复核中心', 
          icon: ClipboardCheck, 
          title: '双盲诊疗方案与一致性复核',
          activeColor: 'bg-blue-600 shadow-blue-950/60' 
        },
        { 
          id: 'gold_audit', 
          label: 'GOLD指南依从性审计', 
          icon: ShieldCheck, 
          title: 'GOLD 国际指南依从性自动校验',
          activeColor: 'bg-indigo-600 shadow-indigo-950/60' 
        }
      ];
    default:
      return [
        { 
          id: 'doctor_station', 
          label: '3D数字孪生工作站', 
          icon: Stethoscope, 
          activeColor: 'bg-cyan-600 shadow-cyan-950/60' 
        }
      ];
  }
};

interface HeaderProps {
  currentUser: UserProfile;
  patient: PatientMeta;
  isMobile: boolean;
  activeSubsystem: string;
  onSelectSubsystem: (subsystem: string) => void;
  onOpenArchitectureModal: () => void;
  onOpenQR?: () => void;
  onLogout?: () => void;
  onOpenCTModal?: () => void;
}

const ROLE_AVATAR_THEMES: Record<string, { bg: string; icon: React.ElementType; ring: string }> = {
  pulmonologist: { bg: 'from-cyan-600 to-blue-600', icon: Stethoscope, ring: 'ring-cyan-500/50' },
  twin_engineer: { bg: 'from-emerald-600 to-teal-600', icon: Wrench, ring: 'ring-emerald-500/50' },
  reviewer: { bg: 'from-blue-600 to-indigo-600', icon: ClipboardCheck, ring: 'ring-blue-500/50' },
  patient_rep: { bg: 'from-teal-600 to-rose-500', icon: Heart, ring: 'ring-teal-500/50' }
};

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  patient,
  isMobile,
  activeSubsystem,
  onSelectSubsystem,
  onOpenArchitectureModal,
  onOpenQR,
  onLogout,
  onOpenCTModal
}) => {
  const roleTheme = ROLE_AVATAR_THEMES[currentUser.role_code] || {
    bg: 'from-cyan-600 to-blue-600',
    icon: User,
    ring: 'ring-cyan-500/50'
  };
  const RoleIcon = roleTheme.icon;

  // 根据当前角色计算允许访问的顶层导航列表
  const navItems = getNavItemsByRole(currentUser.role_code);
  const isPatient = currentUser.role_code === 'patient_rep';

  return (
    <header className="h-15 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md px-3 md:px-5 py-1.5 flex items-center justify-between z-30 shrink-0 select-none">
      {/* 头部左侧：官方统一产品品牌与研发团队标识 */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-600 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-500/30 border border-cyan-400/50">
            <span className="text-xl">🫁</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs md:text-sm font-black tracking-wide text-white flex items-center gap-2">
                <span>基于人工智能技术的慢性阻塞性肺病智慧治疗与管理服务系统</span>
              </h1>
              <span className="hidden xl:inline-block text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/80 font-bold font-mono">
                USY 智慧医疗技术研究团队
              </span>
            </div>
            <p className="hidden md:flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
              <span>三亚市人民医院呼吸与危重症医学科 ✕ 智慧医疗协同创新</span>
              <span className="text-slate-600">|</span>
              <span className="text-cyan-400 font-mono">9.27-V2 国庆专家交流演示版</span>
            </p>
          </div>
        </div>
      </div>

      {/* 头部中央：依据用户角色 RBAC 权限严格动态渲染专属顶层导航 */}
      <div className="hidden lg:flex items-center p-1 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-inner gap-1">
        {navItems.map((item) => {
          const IconComp = item.icon;
          const isActive = activeSubsystem === item.id;
          const activeClass = item.activeColor || 'bg-cyan-600 shadow-cyan-950/60';
          return (
            <button
              key={item.id}
              onClick={() => onSelectSubsystem(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 ${
                isActive
                  ? `${activeClass} text-white shadow-md`
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title={item.title || item.label}
            >
              <IconComp className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* 头部右侧：全局架构图、扫码与当前用户信息 (患者端自动剔除管理/医生端调试入口) */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* 四层三核顶层架构弹窗按钮 (仅向医生、工程师、质控员开放，患者端隐藏) */}
        {!isPatient && (
          <button
            onClick={onOpenArchitectureModal}
            className="flex items-center gap-1.5 text-xs font-extrabold px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600/90 to-blue-600/90 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md border border-cyan-400/50 transition active:scale-95"
            title="查看“四层三核”架构与六步临床闭环流程全景设计"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-200" />
            <span className="hidden sm:inline">四层三核架构</span>
          </button>
        )}

        {/* 导入 CT 快捷按钮 (仅医生端开放) */}
        {!isPatient && onOpenCTModal && (
          <button
            onClick={onOpenCTModal}
            className="hidden md:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 transition active:scale-95"
            title="导入胸部薄层CT并一键启动AI数字孪生体重建"
          >
            <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
            <span>导入CT</span>
          </button>
        )}

        {/* 手机扫码访问快捷弹窗入口 (仅非患者端开放) */}
        {!isPatient && onOpenQR && (
          <button
            onClick={onOpenQR}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition active:scale-95"
            title="手机扫码在移动设备打开并体验3D触控"
          >
            <QrCode className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xl:inline">手机扫码</span>
          </button>
        )}

        {/* 角色与用户身份名片 */}
        <div className="flex items-center gap-2 pl-2 sm:pl-2.5 border-l border-slate-800">
          <div className="relative">
            <div
              className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${roleTheme.bg} flex items-center justify-center text-white ring-2 ${roleTheme.ring} shadow-md`}
              title={`${currentUser.real_name} (${currentUser.role_name})`}
            >
              <RoleIcon className="w-4 h-4 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
          </div>

          <div className="hidden md:flex flex-col text-left max-w-[140px] xl:max-w-[190px]">
            <div className="flex items-center gap-1.5 leading-tight">
              <span className="text-xs font-bold text-slate-100 truncate">
                {currentUser.real_name}
              </span>
              <span className="text-[10px] text-cyan-400 truncate hidden xl:inline">
                {currentUser.title?.split('/')[0] || (isPatient ? '慢病关爱' : '主任医师')}
              </span>
            </div>
            <div className="text-[9px] text-slate-400 truncate mt-0.5">
              {currentUser.department || (isPatient ? '慢病居家随访' : '呼吸与危重症医学科')}
            </div>
          </div>

          {/* 退出登录 */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 transition shadow-sm active:scale-95 ml-0.5"
              title="退出登录"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
