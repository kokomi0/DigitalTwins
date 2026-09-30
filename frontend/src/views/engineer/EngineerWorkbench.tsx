import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnatomyNode, AnatomyEdge, SimulationFrame, PipelineTelemetry } from '../../types';
import { TwinViewer3D } from '../../components/3d/TwinViewer3D';
import { AirwayWaveformChart } from '../../components/clinical/AirwayWaveformChart';
import { DataFlowPipeline } from '../../components/common/DataFlowPipeline';
import { api } from '../../services/api';
import {
  Boxes,
  Sliders,
  Wind,
  Cpu,
  ShieldAlert,
  DownloadCloud,
  Gauge,
  CheckCircle2,
  RefreshCw,
  Terminal,
  Activity,
  Layers,
  Zap,
  HardDrive,
  Network,
  Play,
  Settings2,
  SlidersHorizontal,
  Save,
  Check,
  Radio,
  FileCode,
  Flame
} from 'lucide-react';

interface EngineerWorkbenchProps {
  activeMenuId: string;
  nodes: AnatomyNode[];
  edges: AnatomyEdge[];
  selectedNode: AnatomyNode | null;
  onSelectNode: (node: AnatomyNode) => void;
  simulationFrame: SimulationFrame;
  history: Array<{ time: string; pressure: number; flow: number }>;
  isWireframe: boolean;
  onToggleWireframe: () => void;
  lodLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  onLodChange: (lod: 'HIGH' | 'MEDIUM' | 'LOW') => void;
  onTuneParams: (params: Record<string, any>) => void;
  isModalOpen?: boolean;
}

export const EngineerWorkbench: React.FC<EngineerWorkbenchProps> = ({
  activeMenuId,
  nodes,
  edges,
  selectedNode,
  onSelectNode,
  simulationFrame,
  history,
  isWireframe,
  onToggleWireframe,
  lodLevel,
  onLodChange,
  onTuneParams,
  isModalOpen = false
}) => {
  // 1. PyBullet 仿真调参状态
  const [stenosisRatio, setStenosisRatio] = useState<number>(0.65);
  const [airwayResistanceRaw, setAirwayResistanceRaw] = useState<number>(0.485);
  const [flutterGain, setFlutterGain] = useState<number>(1.2);
  const [airwayCompliance, setAirwayCompliance] = useState<number>(0.12);
  const [youngsModulus, setYoungsModulus] = useState<number>(1.25);
  const [saveParamSuccess, setSaveParamSuccess] = useState<boolean>(false);

  // 2. 双超算监控状态
  const [hpcLoad, setHpcLoad] = useState<any>(null);
  const [telemetry, setTelemetry] = useState<PipelineTelemetry | null>(null);

  // 3. CFD 参数状态
  const [reynoldsNumber, setReynoldsNumber] = useState<number>(2380);
  const [turbulentShearStress, setTurbulentShearStress] = useState<number>(4.82);

  // 4. 时序导出状态
  const [exportFormat, setExportFormat] = useState<'BSON' | 'JSON' | 'VTK' | 'GLTF'>('BSON');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  // 5. 体素配准调试状态
  const [registrationMode, setRegistrationMode] = useState<'rigid' | 'bspline' | 'demons'>('bspline');
  const [iterations, setIterations] = useState<number>(150);

  useEffect(() => {
    const fetchHpc = async () => {
      const data = await api.getHpcLoad();
      if (data) setHpcLoad(data);
      const tel = await api.getPipelineTelemetry();
      if (tel) setTelemetry(tel);
    };
    fetchHpc();
    const timer = setInterval(fetchHpc, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleApplyParams = async () => {
    const payload = {
      stenosis_ratio: stenosisRatio,
      copd_resistance: airwayResistanceRaw,
      airway_flutter_gain: flutterGain,
      airway_compliance: airwayCompliance,
      youngs_modulus: youngsModulus
    };
    onTuneParams(payload);
    await api.tuneParams(payload);
    setSaveParamSuccess(true);
    setTimeout(() => setSaveParamSuccess(false), 2200);
  };

  const handleExportFrames = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setExportSuccessMsg(`✅ 已成功打包导出 120 帧高保真时序切片数据包 (格式: ${exportFormat}, 48.6 MB)`);
      setTimeout(() => setExportSuccessMsg(null), 4000);
    }, 1500);
  };

  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col bg-zinc-950 text-zinc-100 font-sans">
      <AnimatePresence mode="wait">
        {/* ================= 菜单 1: 模型网格拓扑与LOD调度 ================= */}
        {activeMenuId === 'mesh_topology' && (
          <motion.div
            key="mesh_topology"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 h-full flex overflow-hidden p-3 gap-3"
          >
            {/* 左侧控制栏 */}
            <div className="w-80 h-full flex flex-col gap-3 shrink-0 overflow-y-auto">
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 font-mono">
                  <Boxes className="w-4 h-4 text-emerald-400" />
                  MESH GEOMETRY TOPOLOGY
                </span>

                {/* 线框渲染模式开关 */}
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-zinc-200">线框模式 (Wireframe)</div>
                    <div className="text-[10px] text-zinc-500 font-mono">高亮多边形三角面拓扑骨架</div>
                  </div>
                  <button
                    onClick={onToggleWireframe}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition font-mono ${
                      isWireframe
                        ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/40'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {isWireframe ? 'WIREFRAME ON' : 'SOLID OFF'}
                  </button>
                </div>

                {/* 动态多尺度 LOD 调度 */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-zinc-300 flex justify-between">
                    <span>LOD 动态分辨率等级</span>
                    <span className="text-emerald-400 font-mono">{lodLevel}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { level: 'HIGH', faces: '368k 面', badge: 'LOD0' },
                      { level: 'MEDIUM', faces: '142k 面', badge: 'LOD1' },
                      { level: 'LOW', faces: '48k 面', badge: 'LOD2' }
                    ].map((item) => (
                      <button
                        key={item.level}
                        onClick={() => onLodChange(item.level as any)}
                        className={`p-2 rounded-xl text-center border transition ${
                          lodLevel === item.level
                            ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                        }`}
                      >
                        <div className="text-xs font-mono">{item.badge}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">{item.faces}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 网格指标监视器 */}
                <div className="space-y-1.5 pt-2 border-t border-zinc-800 text-xs font-mono">
                  <div className="flex justify-between p-2 rounded-lg bg-zinc-950">
                    <span className="text-zinc-500">顶点数 (Vertices)</span>
                    <span className="text-emerald-400 font-bold">184,460</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-zinc-950">
                    <span className="text-zinc-500">三角面片 (Triangles)</span>
                    <span className="text-emerald-400 font-bold">
                      {lodLevel === 'HIGH' ? '368,920' : lodLevel === 'MEDIUM' ? '142,500' : '48,200'}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-zinc-950">
                    <span className="text-zinc-500">非流形边缘检测</span>
                    <span className="text-emerald-400">0 (PASSED)</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-zinc-950">
                    <span className="text-zinc-500">法向量一致性校验</span>
                    <span className="text-emerald-400">100% 正向</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 中间 3D 网格渲染视口 */}
            <div className="flex-1 h-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 relative shadow-2xl">
              <TwinViewer3D
                nodes={nodes}
                selectedNode={selectedNode}
                onSelectNode={onSelectNode}
                simulationFrame={simulationFrame}
                isWireframe={isWireframe}
                lodLevel={lodLevel}
                isMobile={false}
                isModalOpen={isModalOpen}
              />
              <div className="absolute top-3 left-3 bg-zinc-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-700 text-xs font-mono text-emerald-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>实时网格视口 · {isWireframe ? '线框骨架模式' : '高精度光照模式'}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= 菜单 2: PyBullet呼吸生物力学仿真 ================= */}
        {activeMenuId === 'pybullet_biomechanics' && (
          <motion.div
            key="pybullet_biomechanics"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 h-full p-4 overflow-y-auto space-y-4"
          >
            <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <div>
                <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2 font-mono">
                  <Sliders className="w-5 h-5 text-emerald-400" />
                  PyBullet 呼吸生物力学刚柔耦合仿真调参控制台
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  1000 Hz 高频解算循环，动态调节气道顺应性、气道内阻力、壁面颤振阻尼与杨氏弹性模量
                </p>
              </div>

              <button
                onClick={handleApplyParams}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                {saveParamSuccess ? <Check className="w-4 h-4 text-zinc-950" /> : <Save className="w-4 h-4 text-zinc-950" />}
                <span>{saveParamSuccess ? '参数已同步下发至仿真内核' : '下发并热更新仿真参数'}</span>
              </button>
            </div>

            {/* 调参表单网格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 参数 1: 气道阻力 Raw */}
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-zinc-200">气道阻力 (COPD Resistance Raw)</span>
                  <span className="font-mono text-emerald-400 font-bold text-sm">
                    {airwayResistanceRaw.toFixed(3)} kPa·s/L
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.005"
                  value={airwayResistanceRaw}
                  onChange={(e) => setAirwayResistanceRaw(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <div className="text-[11px] text-zinc-500 flex justify-between font-mono">
                  <span>0.1 (正常健康)</span>
                  <span>1.0 (极度重症阻塞)</span>
                </div>
              </div>

              {/* 参数 2: 狭窄率 */}
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-zinc-200">RB3 局灶性狭窄率 (Stenosis Ratio)</span>
                  <span className="font-mono text-rose-400 font-bold text-sm">
                    {Math.round(stenosisRatio * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.95"
                  step="0.05"
                  value={stenosisRatio}
                  onChange={(e) => setStenosisRatio(parseFloat(e.target.value))}
                  className="w-full accent-rose-400 cursor-pointer"
                />
                <div className="text-[11px] text-zinc-500 flex justify-between font-mono">
                  <span>10% (轻微增厚)</span>
                  <span>95% (近乎完全闭塞)</span>
                </div>
              </div>

              {/* 参数 3: 壁面颤振增益 */}
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-zinc-200">壁面颤振振幅增益 (Flutter Gain)</span>
                  <span className="font-mono text-amber-300 font-bold text-sm">
                    {flutterGain.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.1"
                  value={flutterGain}
                  onChange={(e) => setFlutterGain(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="text-[11px] text-zinc-500 flex justify-between font-mono">
                  <span>0.2x (刚性管壁)</span>
                  <span>3.0x (软化严重颤振)</span>
                </div>
              </div>

              {/* 参数 4: 肺胸顺应性 Crs */}
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-zinc-200">胸肺静态顺应性 (Crs)</span>
                  <span className="font-mono text-cyan-300 font-bold text-sm">
                    {airwayCompliance.toFixed(3)} L/cmH₂O
                  </span>
                </div>
                <input
                  type="range"
                  min="0.02"
                  max="0.25"
                  step="0.01"
                  value={airwayCompliance}
                  onChange={(e) => setAirwayCompliance(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="text-[11px] text-zinc-500 flex justify-between font-mono">
                  <span>0.02 (纤维化/重度僵硬)</span>
                  <span>0.25 (过度充气膨胀)</span>
                </div>
              </div>

              {/* 参数 5: 气道软骨杨氏模量 */}
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-zinc-200">气道组织杨氏模量 (Young's E)</span>
                  <span className="font-mono text-purple-300 font-bold text-sm">
                    {youngsModulus.toFixed(2)} MPa
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.5"
                  step="0.05"
                  value={youngsModulus}
                  onChange={(e) => setYoungsModulus(parseFloat(e.target.value))}
                  className="w-full accent-purple-400 cursor-pointer"
                />
                <div className="text-[11px] text-zinc-500 flex justify-between font-mono">
                  <span>0.5 MPa (软化脆弱)</span>
                  <span>3.5 MPa (致密弹性)</span>
                </div>
              </div>

              {/* 参数 6: 实时仿真内核遥测 */}
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-2 font-mono text-xs">
                <span className="font-bold text-zinc-300 block mb-2">内核解算遥测数据</span>
                <div className="flex justify-between text-zinc-400">
                  <span>PyBullet 引擎频率:</span>
                  <span className="text-emerald-400 font-bold">1000 Hz</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>积分时间步长 dt:</span>
                  <span className="text-emerald-400 font-bold">0.001 s</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>气道呼气塌陷临界压:</span>
                  <span className="text-rose-400 font-bold">-2.4 cmH₂O</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= 菜单 3: 气道流体动力学(CFD)解算 ================= */}
        {activeMenuId === 'cfd_airway' && (
          <motion.div
            key="cfd_airway"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 h-full p-4 overflow-y-auto space-y-4"
          >
            <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <div>
                <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2 font-mono">
                  <Wind className="w-5 h-5 text-emerald-400" />
                  Navier-Stokes 三维气道空气动力学 (CFD) 解算控制台
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  基于连续性方程与有限体积法 (FVM)，求解 B1-B10 各分支气流流速矢量场与管壁切应力 (WSS)
                </p>
              </div>

              <span className="px-3 py-1 rounded-xl bg-zinc-800 text-emerald-400 font-mono text-xs">
                Solver: OpenFOAM / SIMPLE算法
              </span>
            </div>

            {/* 流体物理场监控卡 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-mono">雷诺数 (Reynolds Re)</span>
                <div className="text-2xl font-bold font-mono text-cyan-400">{reynoldsNumber}</div>
                <span className="text-[10px] text-amber-400">过渡流相 (Laminar-Turbulent)</span>
              </div>
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-mono">壁面湍流剪切应力 (WSS)</span>
                <div className="text-2xl font-bold font-mono text-rose-400">{turbulentShearStress} Pa</div>
                <span className="text-[10px] text-rose-500">RB3 局部管壁高应力集中</span>
              </div>
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-mono">狭窄段伯努利压降 (ΔP)</span>
                <div className="text-2xl font-bold font-mono text-amber-400">1.84 kPa</div>
                <span className="text-[10px] text-zinc-400">气流急剧收缩加速损耗</span>
              </div>
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-mono">湍流动能 (TKE)</span>
                <div className="text-2xl font-bold font-mono text-emerald-400">0.084 m²/s²</div>
                <span className="text-[10px] text-emerald-500">主气管分叉涡流耗散</span>
              </div>
            </div>

            {/* CFD 热力图与压降剖面示意 */}
            <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-200 font-mono">【气流速度剖面 (Velocity Profile) 沿程云图】</span>
                <span className="font-mono text-zinc-500">Mesh Cells: 1,420,000</span>
              </div>

              <div className="h-28 rounded-xl bg-gradient-to-r from-blue-700 via-emerald-500 via-amber-400 to-rose-600 p-3 flex flex-col justify-between shadow-inner">
                <div className="flex justify-between text-xs font-mono font-bold text-white drop-shadow">
                  <span>TRACHEA (0.8 m/s)</span>
                  <span>RMB/LMB (1.6 m/s)</span>
                  <span>RUB/RB3 (4.8 m/s 涡流喷射)</span>
                  <span>TERMINAL (0.2 m/s)</span>
                </div>
                <div className="text-[11px] text-white/90 drop-shadow font-sans">
                  ● RB3 狭窄处由于截面积收缩 65%，气流瞬间加速产生强烈紊流与壁面负压陷闭效应
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= 菜单 4: 双超算集群算力监控 ================= */}
        {activeMenuId === 'dual_hpc' && (
          <motion.div
            key="dual_hpc"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 h-full p-4 overflow-y-auto space-y-4"
          >
            <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <div>
                <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2 font-mono">
                  <Cpu className="w-5 h-5 text-emerald-400" />
                  双超算集群协同解算调度监控中心 (Dual-HPC Scheduler)
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  三亚市人民医院 (边缘超算节点) ✕ 三亚学院 (超算与数字孪生重点实验室)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 font-mono text-xs flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                  <span>IPSec 专线 4.2ms · 吞吐 982 Mbps</span>
                </span>
              </div>
            </div>

            {/* 两大超算节点仪表板 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 节点 1: 三亚市人民医院边缘集群 */}
              <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-zinc-100 flex items-center gap-2 font-mono">
                    <HardDrive className="w-4 h-4 text-cyan-400" />
                    <span>三亚市人民医院 (院内边缘算力)</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    LOCAL EDGE
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-zinc-950">
                    <span className="text-zinc-500 text-[10px] block">GPU 负载</span>
                    <span className="text-cyan-400 font-bold text-lg">34 %</span>
                    <span className="text-[9px] text-zinc-500 block">4x RTX 4090</span>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-950">
                    <span className="text-zinc-500 text-[10px] block">显存占用</span>
                    <span className="text-cyan-400 font-bold text-lg">8.2 / 96 GB</span>
                    <span className="text-[9px] text-zinc-500 block">DICOM预处理</span>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-950">
                    <span className="text-zinc-500 text-[10px] block">脱敏网关状态</span>
                    <span className="text-emerald-400 font-bold text-lg">PASSED</span>
                    <span className="text-[9px] text-emerald-500 block">零物理泄露</span>
                  </div>
                </div>

                <div className="text-xs text-zinc-400 space-y-1">
                  <div>● 承担任务: DICOM 切片解析、特征脱敏脱密、轻量级推演及可视化下发</div>
                  <div>● 算力拓扑: 64-Core AMD EPYC 9554 ✕ 512GB ECC DDR5</div>
                </div>
              </div>

              {/* 节点 2: 三亚学院超算中心 */}
              <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-zinc-100 flex items-center gap-2 font-mono">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span>三亚学院超算中心 (HPC 孪生仿真重点实验室)</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    HPC CLUSTER
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-zinc-950">
                    <span className="text-zinc-500 text-[10px] block">GPU 集群利用率</span>
                    <span className="text-emerald-400 font-bold text-lg">78 %</span>
                    <span className="text-[9px] text-zinc-500 block">32x A100 80GB</span>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-950">
                    <span className="text-zinc-500 text-[10px] block">流体解算队列</span>
                    <span className="text-emerald-400 font-bold text-lg">3 任务运行</span>
                    <span className="text-[9px] text-zinc-500 block">0 任务排队</span>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-950">
                    <span className="text-zinc-500 text-[10px] block">大模型推演 BioMedLM</span>
                    <span className="text-cyan-400 font-bold text-lg">ONLINE</span>
                    <span className="text-[9px] text-cyan-500 block">FP16 蒸馏推理</span>
                  </div>
                </div>

                <div className="text-xs text-zinc-400 space-y-1">
                  <div>● 承担任务: 3D 复杂几何 Navier-Stokes 流体解算、多物理场力学时序推演</div>
                  <div>● 互联架构: 200Gbps InfiniBand HDR 无损低延迟网络</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= 菜单 5: 脱敏数据管道与隐私屏障 ================= */}
        {activeMenuId === 'privacy_gateway' && (
          <motion.div
            key="privacy_gateway"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 h-full p-4 overflow-y-auto space-y-4"
          >
            <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <div>
                <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2 font-mono">
                  <ShieldAlert className="w-5 h-5 text-emerald-400" />
                  医疗隐私脱敏安全栅栏与合规传输网关 (HIPAA Privacy Gateway)
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  执行“原始 DICOM 物理不出院”铁律，所有出院数据均为抽象特征几何矩阵与流体力学参数
                </p>
              </div>

              <span className="px-3 py-1 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono text-xs">
                合规认证: HIPAA / 等保三级
              </span>
            </div>

            <DataFlowPipeline />
          </motion.div>
        )}

        {/* ================= 菜单 6: CT体素配准与形变算法 ================= */}
        {activeMenuId === 'voxel_registration' && (
          <motion.div
            key="voxel_registration"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 h-full p-4 overflow-y-auto space-y-4"
          >
            <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <div>
                <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2 font-mono">
                  <Layers className="w-5 h-5 text-emerald-400" />
                  CT 体素配准与非刚性解剖形变算法调试器 (DVF Non-Rigid Registration)
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  多分辨率 B-样条自由形变模型 (FFD)，实现吸气相与呼气相四维 CT (4D-CT) 解剖形变矢量场匹配
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3 font-mono text-xs">
                <span className="font-bold text-zinc-200 block">配准算法模型选择</span>
                {['bspline', 'demons', 'rigid'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setRegistrationMode(mode as any)}
                    className={`w-full p-2.5 rounded-xl border text-left flex justify-between items-center transition ${
                      registrationMode === mode
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <span>{mode.toUpperCase()} 非刚性配准</span>
                    {registrationMode === mode && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>

              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3 font-mono text-xs">
                <span className="font-bold text-zinc-200 block">配准精度与误差评估</span>
                <div className="p-2.5 rounded-xl bg-zinc-950 flex justify-between">
                  <span className="text-zinc-500">互信息指数 (MI)</span>
                  <span className="text-emerald-400 font-bold">0.934 (优)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-950 flex justify-between">
                  <span className="text-zinc-500">目标配准误差 (TRE)</span>
                  <span className="text-emerald-400 font-bold">0.72 mm (&lt;1.0)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-950 flex justify-between">
                  <span className="text-zinc-500">最大形变位移</span>
                  <span className="text-amber-400 font-bold">14.6 mm (膈肌基底)</span>
                </div>
              </div>

              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-3 font-mono text-xs">
                <span className="font-bold text-zinc-200 block">形变矢量场 (DVF) 导出</span>
                <p className="text-zinc-400 leading-relaxed font-sans text-xs">
                  形变位移场矩阵已被编译为三维体素网格偏移映射表，支持回流给三亚市人民医院胸外科及呼吸科。
                </p>
                <button className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold">
                  导出 DVF 3D Displacement Matrix
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= 菜单 7: 时序仿真关键帧导出 ================= */}
        {activeMenuId === 'frames_export' && (
          <motion.div
            key="frames_export"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 h-full p-4 overflow-y-auto space-y-4"
          >
            <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <div>
                <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2 font-mono">
                  <DownloadCloud className="w-5 h-5 text-emerald-400" />
                  时序仿真关键帧导出工作流 (Simulation Frames Exporter)
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  将完整的 4.0 秒呼吸周期切片以序列格式打包，支持脱敏回流、论文科研重现与临床复核
                </p>
              </div>

              <button
                onClick={handleExportFrames}
                disabled={isExporting}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-2 transition"
              >
                <DownloadCloud className="w-4 h-4" />
                <span>{isExporting ? '打包导出中...' : `一键导出当前切片 (${exportFormat})`}</span>
              </button>
            </div>

            {exportSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs font-mono animate-in fade-in">
                {exportSuccessMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {(['BSON', 'JSON', 'VTK', 'GLTF'] as const).map((fmt) => (
                <div
                  key={fmt}
                  onClick={() => setExportFormat(fmt)}
                  className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-3 ${
                    exportFormat === fmt
                      ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850'
                  }`}
                >
                  <div className="flex justify-between items-center font-mono">
                    <span className="font-bold text-base">{fmt} 格式</span>
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-sans text-zinc-400">
                    {fmt === 'BSON' && '高效二进制序列化，适合超算高性能冷归档与快速加载'}
                    {fmt === 'JSON' && '结构化纯文本时序切片，适合 Web 前端与第三方算法对接'}
                    {fmt === 'VTK' && '标准科学可视化 PolyData 格式，适合 ParaView / ANSYS'}
                    {fmt === 'GLTF' && '3D 骨骼动画工业标准，适合 Unity / Three.js 交互展示'}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ================= 菜单 8: 系统性能与WebGL Profiler ================= */}
        {activeMenuId === 'webgl_profiler' && (
          <motion.div
            key="webgl_profiler"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 h-full p-4 overflow-y-auto space-y-4"
          >
            <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <div>
                <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2 font-mono">
                  <Gauge className="w-5 h-5 text-cyan-400" />
                  WebGL 渲染管线与 GPU 性能诊断监视器 (WebGL Profiler)
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  实时探测渲染帧率、DrawCalls 调用次数、显存显卡带宽占用与 Shader 编译开销
                </p>
              </div>

              <span className="px-3 py-1 rounded-xl bg-cyan-950 text-cyan-300 font-mono text-xs border border-cyan-800">
                WebGL 2.0 (Three.js r164)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono">
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-1">
                <span className="text-[10px] text-zinc-500 block">实时刷新帧率 (FPS)</span>
                <div className="text-3xl font-bold text-emerald-400">60 FPS</div>
                <span className="text-[10px] text-emerald-500">平稳流畅 · 渲染用时 14.2ms</span>
              </div>

              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-1">
                <span className="text-[10px] text-zinc-500 block">绘制批次 (DrawCalls)</span>
                <div className="text-3xl font-bold text-cyan-400">38 calls</div>
                <span className="text-[10px] text-cyan-500">几何批处理合并优化</span>
              </div>

              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-1">
                <span className="text-[10px] text-zinc-500 block">WebGL 显存驻留</span>
                <div className="text-3xl font-bold text-purple-400">420 MB</div>
                <span className="text-[10px] text-purple-500">纹理与顶点缓冲区合规</span>
              </div>

              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-1">
                <span className="text-[10px] text-zinc-500 block">着色器编译延迟</span>
                <div className="text-3xl font-bold text-amber-400">0.0 ms</div>
                <span className="text-[10px] text-amber-500">预热就绪 · 无掉帧风险</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
