import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResponsive } from './hooks/useResponsive';
import { useSocketSimulation } from './hooks/useSocketSimulation';
import { api } from './services/api';
import { INITIAL_USER, MOCK_PATIENT } from './services/mockData';
import { RoleCode, UserProfile, PatientMeta, AnatomyNode, AnatomyEdge, CTScanMeta } from './types';
import { Header } from './components/common/Header';
import { PatientBanner } from './components/clinical/PatientBanner';
import { CTImportModal } from './components/clinical/CTImportModal';
import { KnowledgeGraphModal } from './components/clinical/KnowledgeGraphModal';
import { DataFlowPipeline } from './components/common/DataFlowPipeline';
import { ResponsiveDrawer } from './components/common/ResponsiveDrawer';
import { AnatomyTree } from './components/clinical/AnatomyTree';
import { AirwayWaveformChart } from './components/clinical/AirwayWaveformChart';
import { ClinicalPanel } from './components/clinical/ClinicalPanel';
import { EBUSModal } from './components/clinical/EBUSModal';
import { QRCodeModal } from './components/common/QRCodeModal';
import { TwinViewer3D } from './components/3d/TwinViewer3D';
import { AuthPage } from './pages/AuthPage';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export function App() {
  const responsive = useResponsive();
  const { frame, history } = useSocketSimulation();

  // 认证与鉴权状态：默认检查本地是否已有会话缓存
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!api.getCurrentUser();
  });
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    return api.getCurrentUser() || INITIAL_USER;
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

  // 移动端抽屉活动标签 ('clinical' | 'anatomy' | 'controls')
  const [mobileDrawerTab, setMobileDrawerTab] = useState<string>('clinical');

  // 初始化加载解剖图谱与病例
  useEffect(() => {
    const initData = async () => {
      const graph = await api.getAnatomyGraph();
      if (graph && graph.nodes) {
        setNodes(graph.nodes);
        setEdges(graph.edges);
        // 默认选中重点病变段 RB3
        const rb3 = graph.nodes.find(n => n.id === 'RB3');
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

  // 角色切换处理器
  const handleSwitchRole = async (roleCode: RoleCode) => {
    const user = await api.switchRole(roleCode);
    setCurrentUser(user);
    if (roleCode === 'twin_engineer') {
      setIsWireframe(true);
    } else {
      setIsWireframe(false);
    }
  };

  // EBUS淋巴结点击触发
  const handleEbusClick = async (station: string) => {
    const detail = await api.getEbusDetail(station);
    setEbusStation(station);
    setEbusNode(detail || nodes.find(n => n.station === station) || null);
  };

  const handleTuneParams = (params: Record<string, any>) => {
    api.tuneParams(params);
  };

  // 统一认证登录成功
  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    if (user.role_code === 'twin_engineer') {
      setIsWireframe(true);
    } else {
      setIsWireframe(false);
    }
  };

  // 退出登录，安全返回认证门户
  const handleLogout = () => {
    api.logout();
    setIsAuthenticated(false);
  };

  // CT 重建完成回调
  const handleReconstructComplete = (ctMeta: CTScanMeta) => {
    setPatient(prev => ({
      ...prev,
      ct_series_id: ctMeta.series_id,
      laa_pct: ctMeta.laa_pct
    }));
    // 聚焦病变 RB3 段
    const rb3 = nodes.find(n => n.id === 'RB3');
    if (rb3) setSelectedNode(rb3);

    setReconstructNotice(`✅ 患者薄层 CT (${ctMeta.series_id}) 已完成多尺度 AI 分割，三维数字孪生模型已高光加载！`);
    setTimeout(() => {
      setReconstructNotice(null);
    }, 4500);
  };

  return (
    <AnimatePresence mode="wait">
      {!isAuthenticated ? (
        <motion.div
          key="auth-view"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3 }}
          className="w-screen h-screen overflow-hidden"
        >
          <AuthPage onLoginSuccess={handleLoginSuccess} />
        </motion.div>
      ) : (
        <motion.div
          key="workbench-view"
          initial={{ opacity: 0, scale: 1.01 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.35 }}
          className="w-screen h-screen flex flex-col bg-twin-bg text-slate-100 overflow-hidden font-sans"
        >
          {/* 顶部全局导航栏 */}
          <Header
            currentUser={currentUser}
            onSwitchRole={handleSwitchRole}
            patient={patient}
            isMobile={responsive.isMobile}
            lodLevel={lodLevel}
            onLodChange={setLodLevel}
            onOpenQR={() => setIsQRModalOpen(true)}
            onLogout={handleLogout}
            onOpenCTModal={() => setIsCTModalOpen(true)}
            onOpenKnowledgeGraph={() => {
              setKgFocusNodeId(null);
              setIsKGModalOpen(true);
            }}
          />

          {/* 全景患者基本信息与临床基线看板 (顶部显著呈现) */}
          <div className="px-3 pt-2.5 shrink-0">
            <PatientBanner
              patient={patient}
              onOpenCTModal={() => setIsCTModalOpen(true)}
              onOpenKnowledgeGraph={() => {
                setKgFocusNodeId(null);
                setIsKGModalOpen(true);
              }}
              onLocateLesion={() => {
                const rb3 = nodes.find(n => n.id === 'RB3');
                if (rb3) setSelectedNode(rb3);
              }}
            />
          </div>

          {/* 重建完成横幅微提示 */}
          {reconstructNotice && (
            <div className="mx-3 mt-2 p-2.5 rounded-xl bg-cyan-950/90 border border-cyan-400 text-cyan-200 text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 animate-in slide-in-from-top duration-300 z-20">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 animate-spin" />
              <span className="font-semibold">{reconstructNotice}</span>
            </div>
          )}

          {/* 主工作台自适应布局 */}
          {responsive.isDesktop ? (
            /* ================= PC端 (≥1024px) 三栏临床工作台 ================= */
            <div className="flex-1 flex overflow-hidden p-3 gap-3">
              {/* 左栏：气道解剖树 B1-B10 与 1R-12L 淋巴分站导航 */}
              <div className="w-80 h-full flex flex-col shrink-0">
                <AnatomyTree
                  nodes={nodes}
                  selectedNode={selectedNode}
                  onSelectNode={setSelectedNode}
                  onEbusClick={handleEbusClick}
                />
              </div>

              {/* 中栏：三维肺部数字孪生交互视口 + 实时流体波形 + 双超算态势 */}
              <div className="flex-1 h-full flex flex-col gap-3 min-w-0">
                {/* 3D数字孪生视口 */}
                <div className="flex-1 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative min-h-[360px]">
                  <TwinViewer3D
                    nodes={nodes}
                    selectedNode={selectedNode}
                    onSelectNode={setSelectedNode}
                    simulationFrame={frame}
                    isWireframe={isWireframe}
                    lodLevel={lodLevel}
                    onEbusClick={handleEbusClick}
                    isMobile={false}
                  />
                </div>

                {/* 底部联动仪表：流体波形 (ECharts) 与 双超算专线态势 */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 shrink-0">
                  <AirwayWaveformChart
                    history={history}
                    currentPressure={frame.metrics.airway_pressure_cmh2o}
                    currentFlow={frame.metrics.flow_rate_lps}
                  />
                  <DataFlowPipeline />
                </div>
              </div>

              {/* 右栏：多角色临床控制台 (主治医师/算法工程师/质控员/慢病患者) */}
              <div className="w-96 h-full flex flex-col shrink-0 overflow-y-auto pr-1">
                <ClinicalPanel
                  currentUser={currentUser}
                  patient={patient}
                  selectedNode={selectedNode}
                  isWireframe={isWireframe}
                  onToggleWireframe={() => setIsWireframe(!isWireframe)}
                  lodLevel={lodLevel}
                  onLodChange={setLodLevel}
                  onTuneParams={handleTuneParams}
                  onAnnotateSuccess={() => {
                    const rb3 = nodes.find(n => n.id === 'RB3');
                    if (rb3) setSelectedNode(rb3);
                  }}
                  onOpenCTModal={() => setIsCTModalOpen(true)}
                  onOpenKnowledgeGraph={(nodeId) => {
                    setKgFocusNodeId(nodeId || null);
                    setIsKGModalOpen(true);
                  }}
                />
              </div>
            </div>
          ) : (
            /* ================= 手机端 (<1024px) 全屏触控与抽屉 ================= */
            <div className="relative flex-1 w-full h-full overflow-hidden">
              {/* 全屏 3D 触控交互视口 */}
              <div className="absolute inset-0 z-0">
                <TwinViewer3D
                  nodes={nodes}
                  selectedNode={selectedNode}
                  onSelectNode={setSelectedNode}
                  simulationFrame={frame}
                  isWireframe={isWireframe}
                  lodLevel={lodLevel}
                  onEbusClick={handleEbusClick}
                  isMobile={true}
                />
              </div>

              {/* 底部可拖拽多功能抽屉面板 (Bottom Sheet) */}
              <ResponsiveDrawer
                activeTab={mobileDrawerTab}
                onTabChange={setMobileDrawerTab}
                title={currentUser.role_name}
              >
                {mobileDrawerTab === 'clinical' && (
                  <div className="space-y-3">
                    <AirwayWaveformChart
                      history={history}
                      currentPressure={frame.metrics.airway_pressure_cmh2o}
                      currentFlow={frame.metrics.flow_rate_lps}
                    />
                    <ClinicalPanel
                      currentUser={currentUser}
                      patient={patient}
                      selectedNode={selectedNode}
                      isWireframe={isWireframe}
                      onToggleWireframe={() => setIsWireframe(!isWireframe)}
                      lodLevel={lodLevel}
                      onLodChange={setLodLevel}
                      onTuneParams={handleTuneParams}
                      onOpenCTModal={() => setIsCTModalOpen(true)}
                      onOpenKnowledgeGraph={(nodeId) => {
                        setKgFocusNodeId(nodeId || null);
                        setIsKGModalOpen(true);
                      }}
                    />
                  </div>
                )}

                {mobileDrawerTab === 'anatomy' && (
                  <div className="h-80">
                    <AnatomyTree
                      nodes={nodes}
                      selectedNode={selectedNode}
                      onSelectNode={setSelectedNode}
                      onEbusClick={handleEbusClick}
                    />
                  </div>
                )}

                {mobileDrawerTab === 'controls' && (
                  <div className="space-y-3">
                    <DataFlowPipeline />
                  </div>
                )}
              </ResponsiveDrawer>
            </div>
          )}

          {/* 超声支气管镜 (EBUS) 淋巴结探查弹窗 */}
          <EBUSModal
            station={ebusStation}
            node={ebusNode}
            onClose={() => setEbusStation(null)}
          />

          {/* 手机端触控扫码访问弹窗 */}
          <QRCodeModal
            isOpen={isQRModalOpen}
            onClose={() => setIsQRModalOpen(false)}
          />

          {/* 胸部 CT 导入与 AI 孪生重建工作台弹窗 */}
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
              const node = nodes.find(n => n.id === anatomyId || n.station === anatomyId);
              if (node) {
                setSelectedNode(node);
              }
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;
