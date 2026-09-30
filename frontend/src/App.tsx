import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResponsive } from './hooks/useResponsive';
import { useSocketSimulation } from './hooks/useSocketSimulation';
import { api } from './services/api';
import { INITIAL_USER, MOCK_PATIENT } from './services/mockData';
import { RoleCode, UserProfile, PatientMeta, AnatomyNode, AnatomyEdge, CTScanMeta, ClinicalCenter } from './types';
import { ROLE_NAVIGATION_CONFIGS } from './types/navigation';
import { Header, SubsystemType, getNavItemsByRole } from './components/common/Header';
import { SidebarNavigation } from './components/navigation/SidebarNavigation';
import { PatientBanner } from './components/clinical/PatientBanner';
import { CTImportModal } from './components/clinical/CTImportModal';
import { KnowledgeGraphModal } from './components/clinical/KnowledgeGraphModal';
import { EBUSModal } from './components/clinical/EBUSModal';
import { QRCodeModal } from './components/common/QRCodeModal';
import { ArchitectureModal } from './components/common/ArchitectureModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AuthPage } from './pages/AuthPage';
import { DoctorWorkbench } from './views/doctor/DoctorWorkbench';
import { EngineerWorkbench } from './views/engineer/EngineerWorkbench';
import { ReviewerWorkbench } from './views/reviewer/ReviewerWorkbench';
import { PatientWorkbench } from './views/patient/PatientWorkbench';
import { PhoneMockupContainer } from './views/mobile/PhoneMockupContainer';
import { KnowledgeRehabView } from './views/knowledge/KnowledgeRehabView';
import { HospitalCockpitView } from './views/research/HospitalCockpitView';
import { WestChinaBrainStudio } from './views/brain/WestChinaBrainStudio';
import { GlobalBenchmarkModal } from './views/common/GlobalBenchmarkModal';
import { Sparkles } from 'lucide-react';

/**
 * 依据用户角色返回默认激活的顶层子系统导航ID (Role-Based Navigation Default)
 */
const getDefaultSubsystemForRole = (role: RoleCode): string => {
  switch (role) {
    case 'patient_rep':
      return 'patient_app';
    case 'pulmonologist':
      return 'doctor_station';
    case 'twin_engineer':
      return 'engineer_studio';
    case 'reviewer':
      return 'reviewer_center';
    default:
      return 'doctor_station';
  }
};

export function App() {
  const responsive = useResponsive();
  const { frame, history } = useSocketSimulation();

  // 跨院区双中心器官数字孪生状态: 三亚市人民医院 (呼吸科/COPD) vs 四川大学华西医院 (脑肿瘤科)
  const [currentCenter, setCurrentCenter] = useState<ClinicalCenter>('SANYA_COPD');
  // 中美前沿仿真工具临床实用性对比与选型决策看板弹窗
  const [isBenchmarkModalOpen, setIsBenchmarkModalOpen] = useState<boolean>(false);

  // 认证与鉴权状态：默认检查本地是否已有会话缓存
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!api.getCurrentUser();
  });
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    return api.getCurrentUser() || INITIAL_USER;
  });

  // 角色专属核心子系统当前激活状态 (严格按角色 RBAC 隔离与初始化，坚决杜绝患者端默认展示医生工作站)
  const [activeSubsystem, setActiveSubsystem] = useState<string>(() => {
    const role = (api.getCurrentUser()?.role_code || 'pulmonologist') as RoleCode;
    return getDefaultSubsystemForRole(role);
  });

  // 四层三核与六步临床闭环架构弹窗
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState<boolean>(false);

  // 侧边栏折叠与激活菜单状态
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [activeMenuId, setActiveMenuId] = useState<string>(() => {
    const role = (api.getCurrentUser()?.role_code || 'pulmonologist') as RoleCode;
    return ROLE_NAVIGATION_CONFIGS[role]?.defaultMenuId || '3d_twin_viewer';
  });

  const [patient, setPatient] = useState<PatientMeta>(MOCK_PATIENT);
  const [nodes, setNodes] = useState<AnatomyNode[]>([]);
  const [edges, setEdges] = useState<AnatomyEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<AnatomyNode | null>(null);

  // 3D视口渲染控制
  const [isWireframe, setIsWireframe] = useState<boolean>(false);
  const [lodLevel, setLodLevel] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');

  // EBUS淋巴结弹窗
  const [ebusStation, setEbusStation] = useState<string | null>(null);
  const [ebusNode, setEbusNode] = useState<AnatomyNode | null>(null);

  // 手机端扫码弹窗
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);

  // CT导入与AI孪生体重建弹窗
  const [isCTModalOpen, setIsCTModalOpen] = useState<boolean>(false);

  // 知识图谱决策网络弹窗
  const [isKGModalOpen, setIsKGModalOpen] = useState<boolean>(false);
  const [kgFocusNodeId, setKgFocusNodeId] = useState<string | null>(null);

  // 重建完成粒子高光微提示
  const [reconstructNotice, setReconstructNotice] = useState<string | null>(null);

  // 全局弹窗状态检测(当任何临床CT/EBUS/架构弹窗打开时，自动压制 3D 浮动标签防止遮挡对话框)
  const isAnyModalOpen = Boolean(
    ebusStation ||
    isArchitectureModalOpen ||
    isQRModalOpen ||
    isCTModalOpen ||
    isKGModalOpen
  );

  // 监听当前用户角色变动，确保 activeSubsystem 严格在当前角色的白名单内
  useEffect(() => {
    const role = currentUser.role_code;
    const validNavs = getNavItemsByRole(role).map((n) => n.id);
    if (!validNavs.includes(activeSubsystem)) {
      setActiveSubsystem(getDefaultSubsystemForRole(role));
    }
  }, [currentUser.role_code]);

  // 初始化加载解剖图谱与病例
  useEffect(() => {
    const initData = async () => {
      const graph = await api.getAnatomyGraph();
      if (graph && graph.nodes) {
        setNodes(graph.nodes);
        setEdges(graph.edges);
        // 默认选中重点病变段 RB3
        const rb3 = graph.nodes.find((n) => n.id === 'RB3');
        if (rb3) setSelectedNode(rb3);
      }
      const patients = await api.getPatients();
      if (patients && patients.length > 0) {
        setPatient(patients[0]);
      }
    };
    initData();
  }, []);

  // 响应式自适应更新推荐LOD
  useEffect(() => {
    setLodLevel(responsive.recommendedLOD);
  }, [responsive.recommendedLOD]);

  // EBUS淋巴结点击触发
  const handleEbusClick = async (station: string) => {
    const detail = await api.getEbusDetail(station);
    setEbusStation(station);
    setEbusNode(detail || nodes.find((n) => n.station === station) || null);
  };

  const handleTuneParams = (params: Record<string, any>) => {
    api.tuneParams(params);
  };

  // 统一认证登录成功：锁定角色上下文并载入专属默认顶栏与菜单
  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    const defaultNav = getDefaultSubsystemForRole(user.role_code);
    setActiveSubsystem(defaultNav);
    const defaultMenu = ROLE_NAVIGATION_CONFIGS[user.role_code]?.defaultMenuId || '3d_twin_viewer';
    setActiveMenuId(defaultMenu);
    if (user.role_code === 'twin_engineer') {
      setIsWireframe(true);
    } else {
      setIsWireframe(false);
    }
  };

  // 退出登录：清除 Session，平滑立即退回登录门户
  const handleLogout = () => {
    api.logout();
    setIsAuthenticated(false);
    setCurrentUser(INITIAL_USER);
    setActiveMenuId('3d_twin_viewer');
    setActiveSubsystem('doctor_station');
    setIsCTModalOpen(false);
    setIsKGModalOpen(false);
    setIsQRModalOpen(false);
    setIsArchitectureModalOpen(false);
    setEbusStation(null);
    setReconstructNotice(null);
  };

  // CT 重建完成回调
  const handleReconstructComplete = (ctMeta: CTScanMeta) => {
    setPatient((prev) => ({
      ...prev,
      ct_series_id: ctMeta.series_id,
      laa_pct: ctMeta.laa_pct
    }));
    // 聚焦病变 RB3 段
    const rb3 = nodes.find((n) => n.id === 'RB3');
    if (rb3) setSelectedNode(rb3);

    setReconstructNotice(
      `🎉 患者薄层CT (${ctMeta.series_id}) 已完成多尺度 AI 分割，三维数字孪生模型已加载！`
    );
    setTimeout(() => {
      setReconstructNotice(null);
    }, 4500);
  };

  // 切换中心 (三亚 COPD vs 华西脑肿瘤)
  const handleToggleCenter = (center: ClinicalCenter) => {
    setCurrentCenter(center);
    if (center === 'HUAXI_BRAIN') {
      setActiveMenuId('brain_3d_pathfinder');
    } else {
      setActiveMenuId('3d_twin_viewer');
    }
  };

  // 顶栏导航切换事件：双向联动侧边栏与激活视图
  const handleSelectSubsystem = (navId: string) => {
    setActiveSubsystem(navId);

    // 状态驱动双向同步：顶栏切换自动联动菜单
    if (currentUser.role_code === 'patient_rep') {
      if (navId === 'patient_app') {
        if (activeMenuId === 'health_kg') {
          setActiveMenuId('my_3d_lung');
        }
      } else if (navId === 'education_kg') {
        setActiveMenuId('health_kg');
      }
    } else if (currentUser.role_code === 'pulmonologist') {
      if (navId === 'doctor_station') {
        if (activeMenuId === 'kg_inference') {
          setActiveMenuId('3d_twin_viewer');
        }
      } else if (navId === 'cdss_kg') {
        setActiveMenuId('kg_inference');
      }
    } else if (currentUser.role_code === 'twin_engineer') {
      if (navId === 'engineer_studio') {
        if (activeMenuId === 'dual_hpc' || activeMenuId === 'privacy_gateway') {
          setActiveMenuId('mesh_topology');
        }
      } else if (navId === 'hpc_pipeline') {
        setActiveMenuId('dual_hpc');
      }
    } else if (currentUser.role_code === 'reviewer') {
      if (navId === 'reviewer_center') {
        setActiveMenuId('double_blind');
      } else if (navId === 'gold_audit') {
        setActiveMenuId('gold_compliance');
      }
    }
  };

  // 左侧侧边栏菜单切换事件：双向联动顶栏活动高亮
  const handleSelectMenu = (menuId: string) => {
    setActiveMenuId(menuId);

    // 状态驱动双向同步：侧边栏切换自动同步顶栏活动高亮
    if (currentUser.role_code === 'patient_rep') {
      if (menuId === 'health_kg') {
        setActiveSubsystem('education_kg');
      } else {
        setActiveSubsystem('patient_app');
      }
    } else if (currentUser.role_code === 'pulmonologist') {
      if (menuId === 'kg_inference') {
        setActiveSubsystem('cdss_kg');
      } else {
        setActiveSubsystem('doctor_station');
      }
    } else if (currentUser.role_code === 'twin_engineer') {
      if (menuId === 'dual_hpc' || menuId === 'privacy_gateway') {
        setActiveSubsystem('hpc_pipeline');
      } else {
        setActiveSubsystem('engineer_studio');
      }
    } else if (currentUser.role_code === 'reviewer') {
      if (menuId === 'gold_compliance') {
        setActiveSubsystem('gold_audit');
      } else {
        setActiveSubsystem('reviewer_center');
      }
    }
  };

  // 未登录时渲染身份门户页 (支持 4 类专科身份一键快速切换)
  if (!isAuthenticated) {
    return (
      <div className="w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
        <AuthPage onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  // 是否处于主业务工作台视口
  const isWorkstationActive = 
    activeSubsystem === 'doctor_station' ||
    activeSubsystem === 'patient_app' ||
    activeSubsystem === 'engineer_studio' ||
    activeSubsystem === 'hpc_pipeline' ||
    activeSubsystem === 'reviewer_center' ||
    activeSubsystem === 'gold_audit';

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col bg-slate-950 text-slate-100 font-sans select-none">
      {/* 顶部官方全局品牌导航栏 */}
      <Header
        currentUser={currentUser}
        patient={patient}
        isMobile={responsive.isMobile}
        activeSubsystem={activeSubsystem}
        onSelectSubsystem={handleSelectSubsystem}
        onOpenArchitectureModal={() => setIsArchitectureModalOpen(true)}
        onOpenQR={() => setIsQRModalOpen(true)}
        onLogout={handleLogout}
        onOpenCTModal={
          currentUser.role_code === 'pulmonologist' ? () => setIsCTModalOpen(true) : undefined
        }
      />

      {/* 患者临床基线条 (仅在医生端工作站且三亚呼吸科展示) */}
      {activeSubsystem === 'doctor_station' && currentCenter === 'SANYA_COPD' && currentUser.role_code === 'pulmonologist' && (
        <div className="px-3 pt-2 shrink-0">
          <PatientBanner
            patient={patient}
            onOpenCTModal={() => setIsCTModalOpen(true)}
            onOpenKnowledgeGraph={() => {
              setKgFocusNodeId(null);
              setIsKGModalOpen(true);
            }}
            onLocateLesion={() => {
              const rb3 = nodes.find((n) => n.id === 'RB3');
              if (rb3) setSelectedNode(rb3);
            }}
          />
        </div>
      )}

      {/* 重建完成横幅微提示 */}
      {reconstructNotice && (
        <div className="mx-3 mt-2 p-2.5 rounded-xl bg-cyan-950/90 border border-cyan-400 text-cyan-200 text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 animate-in slide-in-from-top duration-300 z-20">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 animate-spin" />
          <span className="font-semibold">{reconstructNotice}</span>
        </div>
      )}

      {/* 主工作区：依据 activeSubsystem 渲染各角色专属业务视口 */}
      <div className="flex-1 flex overflow-hidden relative pb-14 lg:pb-0">
        {/* ================= 业务工作台视口 (含多角色左侧侧边栏) ================= */}
        {isWorkstationActive && (
          <>
            {/* 多端自适应侧边栏 (PC 220px / 移动端底部Tabbar + 抽屉) */}
            <SidebarNavigation
              currentRole={currentUser.role_code}
              activeMenuId={activeMenuId}
              onSelectMenu={handleSelectMenu}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              isMobile={responsive.isMobile}
              currentCenter={currentCenter}
              onToggleCenter={handleToggleCenter}
            />

            {/* 中心内容区：依据 activeMenuId 渲染业务视口 */}
            <main className="flex-1 h-full overflow-hidden flex flex-col min-w-0 bg-slate-950">
              <ErrorBoundary fallbackTitle="数字孪生业务工作台渲染保护">
                {currentCenter === 'HUAXI_BRAIN' ? (
                  <WestChinaBrainStudio
                    onOpenBenchmarkModal={() => setIsBenchmarkModalOpen(true)}
                    activeMenuId={activeMenuId}
                    onSelectMenu={handleSelectMenu}
                  />
                ) : (
                  <>
                    {currentUser.role_code === 'pulmonologist' && (
                      <DoctorWorkbench
                        activeMenuId={activeMenuId}
                        patient={patient}
                        nodes={nodes}
                        edges={edges}
                        selectedNode={selectedNode}
                        onSelectNode={setSelectedNode}
                        simulationFrame={frame}
                        history={history}
                        isWireframe={isWireframe}
                        lodLevel={lodLevel}
                        onEbusClick={handleEbusClick}
                        onOpenCTModal={() => setIsCTModalOpen(true)}
                        onOpenKnowledgeGraph={(nodeId) => {
                          setKgFocusNodeId(nodeId || null);
                          setIsKGModalOpen(true);
                        }}
                        onReconstructComplete={handleReconstructComplete}
                        isModalOpen={isAnyModalOpen}
                      />
                    )}

                    {currentUser.role_code === 'twin_engineer' && (
                      <EngineerWorkbench
                        activeMenuId={activeMenuId}
                        nodes={nodes}
                        edges={edges}
                        selectedNode={selectedNode}
                        onSelectNode={setSelectedNode}
                        simulationFrame={frame}
                        history={history}
                        isWireframe={isWireframe}
                        onToggleWireframe={() => setIsWireframe(!isWireframe)}
                        lodLevel={lodLevel}
                        onLodChange={setLodLevel}
                        onTuneParams={handleTuneParams}
                        isModalOpen={isAnyModalOpen}
                      />
                    )}

                    {currentUser.role_code === 'reviewer' && (
                      <ReviewerWorkbench activeMenuId={activeMenuId} patient={patient} />
                    )}

                    {currentUser.role_code === 'patient_rep' && (
                      <PatientWorkbench
                        activeMenuId={activeMenuId}
                        patient={patient}
                        nodes={nodes}
                        selectedNode={selectedNode}
                        onSelectNode={setSelectedNode}
                        simulationFrame={frame}
                        onOpenKnowledgeGraph={(nodeId) => {
                          setKgFocusNodeId(nodeId || null);
                          setIsKGModalOpen(true);
                        }}
                      />
                    )}
                  </>
                )}
              </ErrorBoundary>
            </main>
          </>
        )}

        {/* ================= 康复宣教知识库 / 临床知识图谱辅助决策 (CDSS) ================= */}
        {(activeSubsystem === 'education_kg' || activeSubsystem === 'cdss_kg') && (
          <main className="flex-1 h-full overflow-hidden flex flex-col bg-slate-950">
            <ErrorBoundary fallbackTitle="知识图谱与康复宣教服务渲染保护">
              <KnowledgeRehabView />
            </ErrorBoundary>
          </main>
        )}

        {/* ================= 全院态势与科研驾驶舱 ================= */}
        {activeSubsystem === 'hospital_stat' && (
          <main className="flex-1 h-full overflow-hidden flex flex-col bg-slate-950">
            <ErrorBoundary fallbackTitle="全院态势与科研驾驶舱渲染保护">
              <HospitalCockpitView />
            </ErrorBoundary>
          </main>
        )}
      </div>

      {/* 四层三核与六步临床闭环系统架构弹窗 */}
      <ArchitectureModal
        isOpen={isArchitectureModalOpen}
        onClose={() => setIsArchitectureModalOpen(false)}
      />

      {/* 超声支气管镜 (EBUS) 淋巴结探查弹窗 */}
      <EBUSModal
        station={ebusStation}
        node={ebusNode}
        onClose={() => setEbusStation(null)}
      />

      {/* 手机端触控扫码访问弹窗 */}
      <QRCodeModal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} />

      {/* 胸部 CT 导入与 AI 孪生体重建工作台弹窗 */}
      <CTImportModal
        isOpen={isCTModalOpen}
        onClose={() => setIsCTModalOpen(false)}
        onReconstructComplete={handleReconstructComplete}
      />

      {/* COPD 慢病知识图谱多维决策网络弹窗 */}
      <KnowledgeGraphModal
        isOpen={isKGModalOpen}
        onClose={() => setIsKGModalOpen(false)}
        selectedAnatomyId={kgFocusNodeId || selectedNode?.id}
        onSelectAnatomyNode={(anatomyId) => {
          const node = nodes.find((n) => n.id === anatomyId || n.station === anatomyId);
          if (node) {
            setSelectedNode(node);
          }
        }}
      />

      {/* 中美前沿仿真工具对比与选型评估论证方案弹窗 */}
      <GlobalBenchmarkModal
        isOpen={isBenchmarkModalOpen}
        onClose={() => setIsBenchmarkModalOpen(false)}
      />
    </div>
  );
}

export default App;
