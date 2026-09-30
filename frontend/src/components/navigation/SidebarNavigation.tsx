import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RoleCode } from '../../types';
import { ROLE_NAVIGATION_CONFIGS, MenuItem } from '../../types/navigation';
import {
  Layers,
  ScanLine,
  Activity,
  Network,
  TrendingUp,
  Share2,
  AlertTriangle,
  FileText,
  Boxes,
  Sliders,
  Wind,
  Cpu,
  ShieldAlert,
  DownloadCloud,
  Gauge,
  CheckCheck,
  Award,
  GitBranch,
  BarChart2,
  FileCheck,
  ShieldCheck,
  HeartHandshake,
  BellRing,
  Pill,
  Sparkles,
  HelpCircle,
  ListChecks,
  CloudRain,
  PhoneCall,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Stethoscope,
  Wrench,
  ClipboardCheck,
  Heart,
  Compass
} from 'lucide-react';

interface SidebarNavigationProps {
  currentRole: RoleCode;
  activeMenuId: string;
  onSelectMenu: (menuId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobile?: boolean;
  currentCenter?: 'SANYA_COPD' | 'HUAXI_BRAIN';
  onToggleCenter?: (center: 'SANYA_COPD' | 'HUAXI_BRAIN') => void;
}

// 华西医院脑肿瘤专科专属业务菜单
const HUAXI_BRAIN_MENUS = [
  {
    id: 'brain_3d_pathfinder',
    name: '3D虚拟脑手术预演',
    shortName: '手术预演',
    description: 'ATLAS Meditech 翼点入路规划与 Willis 环避障',
    iconName: 'View3D',
    badge: 'ATLAS',
    badgeColor: 'bg-purple-950 text-purple-300 border border-purple-800'
  },
  {
    id: 'brain_neosoma_volumetric',
    name: 'Neosoma 靶区纵向随访',
    shortName: '靶区随访',
    description: '体素级 GTV/CTV/PTV 勾画与 78.4% 假性进展鉴别',
    iconName: 'ScanLine',
    badge: 'FDA',
    badgeColor: 'bg-indigo-950 text-indigo-300 border border-indigo-800'
  },
  {
    id: 'brain_dti_tracts',
    name: 'DTI 白质传导束示踪',
    shortName: 'DTI示踪',
    description: '弓状束与皮质脊髓束示踪，Broca 语言区保护',
    iconName: 'Activity',
    badge: 'DTI',
    badgeColor: 'bg-emerald-950 text-emerald-300 border border-emerald-800'
  },
  {
    id: 'brain_mdt_decision',
    name: '华西神外 MDT 决议',
    shortName: 'MDT决议',
    description: '神经外科、放疗科、病理科多学科联合方案',
    iconName: 'FileText',
    badge: 'MDT',
    badgeColor: 'bg-slate-800 text-slate-300'
  }
];

// 图标字典映射
const ICON_MAP: Record<string, React.ElementType> = {
  View3D: Layers,
  ScanLine: ScanLine,
  Activity: Activity,
  Network: Network,
  TrendingUp: TrendingUp,
  Share2: Share2,
  AlertTriangle: AlertTriangle,
  FileText: FileText,
  Boxes: Boxes,
  Sliders: Sliders,
  Wind: Wind,
  Cpu: Cpu,
  ShieldAlert: ShieldAlert,
  DownloadCloud: DownloadCloud,
  Gauge: Gauge,
  CheckCheck: CheckCheck,
  Award: Award,
  GitBranch: GitBranch,
  BarChart2: BarChart2,
  FileCheck: FileCheck,
  ShieldCheck: ShieldCheck,
  HeartHandshake: HeartHandshake,
  BellRing: BellRing,
  Pill: Pill,
  Sparkles: Sparkles,
  HelpCircle: HelpCircle,
  ListChecks: ListChecks,
  CloudRain: CloudRain,
  PhoneCall: PhoneCall
};

const ROLE_BADGE_ICONS: Record<RoleCode, React.ElementType> = {
  pulmonologist: Stethoscope,
  twin_engineer: Wrench,
  reviewer: ClipboardCheck,
  patient_rep: Heart
};

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  currentRole,
  activeMenuId,
  onSelectMenu,
  isCollapsed = false,
  onToggleCollapse,
  isMobile = false,
  currentCenter = 'SANYA_COPD',
  onToggleCenter
}) => {
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const config = ROLE_NAVIGATION_CONFIGS[currentRole] || ROLE_NAVIGATION_CONFIGS.pulmonologist;
  const RoleIcon = ROLE_BADGE_ICONS[currentRole] || Stethoscope;

  const isHuaxi = currentCenter === 'HUAXI_BRAIN';
  const displayMenus = isHuaxi ? HUAXI_BRAIN_MENUS : config.menus;
  const displayRoleName = isHuaxi ? '华西 · 脑肿瘤中心' : config.roleName;
  const displayGradient = isHuaxi ? 'from-purple-600 to-indigo-600' : config.theme.gradient;
  const DisplayIcon = isHuaxi ? Compass : RoleIcon;

  const renderIcon = (iconName: string, className = 'w-4 h-4 shrink-0') => {
    const IconComponent = ICON_MAP[iconName] || Layers;
    return <IconComponent className={className} />;
  };

  // 手机端精选前4个高频菜单
  const mobileTopMenus = displayMenus.slice(0, 4);

  // 桌面端垂直侧边栏
  if (!isMobile) {
    return (
      <aside
        className={`h-full border-r border-slate-800/90 bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between shrink-0 transition-all duration-300 z-20 select-none ${
          isCollapsed ? 'w-16' : 'w-[220px]'
        }`}
      >
        {/* 顶部角色专属工作台标识 */}
        <div className="p-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${displayGradient} flex items-center justify-center text-white shadow-lg shrink-0 border border-white/20`}
            >
              <DisplayIcon className="w-5 h-5 text-white" />
            </div>

            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-100 truncate flex items-center gap-1.5">
                  <span>{displayRoleName}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                  {displayMenus.length} 项专属业务
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 中间 6~8 个独立业务功能菜单项列表 */}
        <div className="flex-1 overflow-y-auto py-2.5 px-2 space-y-1.5 scrollbar-thin">
          {!isCollapsed && (
            <div className="px-2 pt-1 pb-1.5 text-[10px] uppercase tracking-wider font-semibold text-slate-500 font-mono">
              {isHuaxi ? '华西神经外科业务' : '业务功能工作台'}
            </div>
          )}

          {displayMenus.map((item, index) => {
            const isActive = activeMenuId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectMenu(item.id)}
                title={isCollapsed ? `${item.name}: ${item.description}` : undefined}
                className={`group relative w-full flex items-center gap-2.5 rounded-xl transition-all text-left ${
                  isCollapsed ? 'p-2.5 justify-center' : 'px-3 py-2.5'
                } ${
                  isActive
                    ? `${isHuaxi ? 'bg-purple-950/70 border-purple-500' : `${config.theme.activeBg} border ${config.theme.borderActive}`} shadow-sm`
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                {/* 选中高亮左指示条 */}
                {isActive && (
                  <motion.div
                    layoutId="activeSidebarIndicator"
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r shadow-lg ${
                      isHuaxi ? 'bg-purple-400 shadow-purple-400/50' : 'bg-cyan-400 shadow-cyan-400/50'
                    }`}
                  />
                )}

                <div
                  className={`transition-colors shrink-0 ${
                    isActive ? (isHuaxi ? 'text-purple-300 font-bold' : config.theme.activeText) : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  {renderIcon(item.iconName, 'w-4 h-4')}
                </div>

                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-xs truncate block ${
                          isActive ? (isHuaxi ? 'text-purple-200 font-bold' : config.theme.activeText) : 'font-medium'
                        }`}
                      >
                        {item.name}
                      </span>
                      {item.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-mono shrink-0 ${
                            item.badgeColor || (isHuaxi ? 'bg-purple-950 text-purple-300 border border-purple-800' : config.theme.badgeBg)
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 truncate block mt-0.5">
                      {item.description}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>


        {/* 底部折叠/展开按钮 */}
        {onToggleCollapse && (
          <div className="p-2 border-t border-slate-800/80 flex items-center justify-between">
            {!isCollapsed && (
              <span className="text-[10px] text-slate-500 pl-2 font-mono">
                RBAC 硬隔离 v2.6
              </span>
            )}
            <button
              onClick={onToggleCollapse}
              className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition ${
                isCollapsed ? 'mx-auto' : ''
              }`}
              title={isCollapsed ? '展开导航侧边栏' : '折叠导航侧边栏'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <div className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200">
                  <ChevronLeft className="w-4 h-4" />
                  <span>折叠侧栏</span>
                </div>
              )}
            </button>
          </div>
        )}
      </aside>
    );
  }

  // 手机端底部 Tabbar (前 4 项 + 更多)
  return (
    <>
      {/* 底部 Tabbar */}
      <nav className="fixed bottom-0 inset-x-0 h-14 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-lg flex items-center justify-around z-40 px-1 safe-area-bottom select-none">
        {mobileTopMenus.map((item) => {
          const isActive = activeMenuId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectMenu(item.id)}
              className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-0.5 transition ${
                isActive ? config.theme.activeText : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                {renderIcon(item.iconName, `w-4 h-4 ${isActive ? 'scale-110' : ''}`)}
                {item.badge && (
                  <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-cyan-500" />
                )}
              </div>
              <span className="text-[10px] font-medium leading-none truncate max-w-[64px]">
                {item.shortName}
              </span>
            </button>
          );
        })}

        {/* 更多功能抽屉入口 */}
        <button
          onClick={() => setMobileMoreOpen(true)}
          className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-0.5 text-slate-400 hover:text-slate-200 transition ${
            !mobileTopMenus.some((m) => m.id === activeMenuId) ? config.theme.activeText : ''
          }`}
        >
          <Menu className="w-4 h-4" />
          <span className="text-[10px] font-medium leading-none">全部菜单</span>
        </button>
      </nav>

      {/* 手机端“全部功能”上拉抽屉 */}
      <AnimatePresence>
        {mobileMoreOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="bg-slate-950 border-t border-slate-800 rounded-t-3xl max-h-[80vh] flex flex-col p-4 shadow-2xl safe-area-bottom"
            >
              {/* 抽屉头部 */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${config.theme.gradient} flex items-center justify-center text-white`}
                  >
                    <RoleIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{config.roleName}</h3>
                    <p className="text-[10px] text-slate-400 font-mono">专属功能全景导航 (共 {config.menus.length} 项)</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMoreOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 bg-slate-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 菜单宫格 */}
              <div className="grid grid-cols-2 gap-2.5 py-4 overflow-y-auto max-h-[60vh]">
                {config.menus.map((item) => {
                  const isActive = activeMenuId === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectMenu(item.id);
                        setMobileMoreOpen(false);
                      }}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-2 transition ${
                        isActive
                          ? `${config.theme.activeBg} ${config.theme.borderActive}`
                          : 'bg-slate-900/80 border-slate-800 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={`p-1.5 rounded-lg bg-slate-950/80 ${
                            isActive ? config.theme.activeText : 'text-slate-300'
                          }`}
                        >
                          {renderIcon(item.iconName, 'w-4 h-4')}
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                              item.badgeColor || config.theme.badgeBg
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <div>
                        <div
                          className={`text-xs font-semibold leading-tight ${
                            isActive ? config.theme.activeText : 'text-slate-200'
                          }`}
                        >
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                          {item.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
