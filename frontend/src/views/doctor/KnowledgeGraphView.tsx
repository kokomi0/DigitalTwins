import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  Share2,
  Sparkles,
  Network,
  Activity,
  CheckCircle2,
  FileText,
  Pill,
  ShieldAlert,
  Search,
  Maximize2,
  Layers,
  RotateCcw,
  Zap,
  Info
} from 'lucide-react';
import { PatientMeta } from '../../types';

interface KnowledgeGraphViewProps {
  patient: PatientMeta;
  initialNodeId?: string;
  onOpenKnowledgeGraphModal?: () => void;
}

// 知识图谱三维节点接口
interface KG3DNode {
  id: string;
  name: string;
  category: 'DISEASE' | 'DIAGNOSTIC' | 'PATHOLOGY' | 'DRUG' | 'INTERVENTION' | 'EXACERBATION';
  pos: [number, number, number];
  size: number;
  color: string;
  emissive: string;
  evidence: string;
  level: 'Level A' | 'Level B' | 'Level C' | 'Expert';
  guideline: string;
  details: string;
}

// 知识图谱三维连线
interface KG3DEdge {
  from: string;
  to: string;
  relation: string;
  color: string;
}

// 3D 悬浮星轨力导向知识星云节点数据
const KG_NODES: KG3DNode[] = [
  // 核心主疾病
  {
    id: 'copd_core',
    name: '慢阻肺 (COPD)',
    category: 'DISEASE',
    pos: [0, 0, 0],
    size: 0.55,
    color: '#06b6d4',
    emissive: '#0891b2',
    evidence: 'GOLD 2026 全球慢阻肺防治创议核心疾病实体',
    level: 'Level A',
    guideline: 'GOLD 2026 Report · WHO Global Alliance against CRD',
    details: '以持续存在的气流受限为特征的常见、可防可治的慢性气道疾病，伴随小气道重塑与肺泡破坏。'
  },

  // 轨道 1: 临床表型与诊断 (DIAGNOSTIC)
  {
    id: 'diag_gold3',
    name: 'GOLD 3级 (重度气流受限)',
    category: 'DIAGNOSTIC',
    pos: [1.8, 0.8, 0.6],
    size: 0.28,
    color: '#fbbf24',
    emissive: '#f59e0b',
    evidence: '支气管舒张后 FEV1%pred 处于 30% ~ 49% 区间',
    level: 'Level A',
    guideline: '中华医学会呼吸病学分会慢阻肺诊治指南 (2021年修订版)',
    details: '当前患者实测 FEV1%pred 为 46.2%，处于重度气道通气功能损害。'
  },
  {
    id: 'diag_laa',
    name: 'HRCT LAA-950 (肺气肿)',
    category: 'DIAGNOSTIC',
    pos: [1.9, -0.6, -0.7],
    size: 0.26,
    color: '#fbbf24',
    emissive: '#f59e0b',
    evidence: '吸气末 CT 低衰减容积 (<-950HU) 达 32.4%',
    level: 'Level A',
    guideline: 'Fleischner Society: CT Quantitation of Emphysema',
    details: '提示双肺小叶中心型重度肺气肿，右上叶 (RUL) 破坏最显著。'
  },
  {
    id: 'diag_rb3',
    name: 'RB3 支气管重塑狭窄',
    category: 'DIAGNOSTIC',
    pos: [1.4, -1.5, 0.4],
    size: 0.26,
    color: '#f87171',
    emissive: '#ef4444',
    evidence: '电子气管镜直视管腔有效截面积缩小 65%',
    level: 'Level B',
    guideline: 'ATS/ERS Bronchoscopy Diagnostic Consensus',
    details: '右上叶前段支气管黏膜肉芽增生充血，为主要呼吸阻力来源。'
  },

  // 轨道 2: 病理机理 (PATHOLOGY)
  {
    id: 'path_inflam',
    name: '小气道中性粒细胞性炎症',
    category: 'PATHOLOGY',
    pos: [-1.6, 1.2, -0.5],
    size: 0.26,
    color: '#c084fc',
    emissive: '#9333ea',
    evidence: 'IL-8, TNF-α 及白三烯 B4 介导的管壁重塑与纤维化',
    level: 'Level A',
    guideline: 'Lancet Respiratory Medicine 2024; 12: 189-204',
    details: '香烟烟雾刺激巨噬细胞释放趋化因子，引起不可逆小气道狭窄。'
  },
  {
    id: 'path_hypox',
    name: '慢性低氧血症 (I型呼衰)',
    category: 'PATHOLOGY',
    pos: [-1.8, -0.5, 0.8],
    size: 0.26,
    color: '#c084fc',
    emissive: '#9333ea',
    evidence: 'PaO2 62 mmHg · 通气/血流比例失调 (V/Q mismatch)',
    level: 'Level A',
    guideline: 'Clinical Practice Guideline on Long-Term Oxygen Therapy',
    details: '肺泡毛细血管床毁损导致气体弥散功能下降，伴代偿性肺动脉高压风险。'
  },

  // 轨道 3: 药物循证 (DRUG)
  {
    id: 'drug_lama',
    name: 'LAMA (噻托溴铵)',
    category: 'DRUG',
    pos: [0.6, 2.1, -1.0],
    size: 0.32,
    color: '#34d399',
    emissive: '#059669',
    evidence: '选择性 M3 胆碱受体拮抗，长效松弛支气管平滑肌',
    level: 'Level A',
    guideline: 'UPLIFT Trial (N=5,993) · GOLD 2026 首选基石用药',
    details: '改善 FEV1 峰值达 140ml，延缓肺功能年下降速率，显著减少急性加重。'
  },
  {
    id: 'drug_laba',
    name: 'LABA (福莫特罗/茚达特罗)',
    category: 'DRUG',
    pos: [-0.7, 2.2, 0.8],
    size: 0.3,
    color: '#34d399',
    emissive: '#059669',
    evidence: '长效 β2 肾上腺素能受体激动剂，迅速舒张小气道',
    level: 'Level A',
    guideline: 'TORCH Study · Cochrane Review 2023',
    details: '与 LAMA 具有协同互补机制，双联使用可额外降低气道阻力 24%。'
  },
  {
    id: 'drug_ics',
    name: 'ICS (布地奈德)',
    category: 'DRUG',
    pos: [0.0, 2.4, 0.2],
    size: 0.3,
    color: '#34d399',
    emissive: '#059669',
    evidence: '吸入糖皮质激素，抑制气道黏膜局部炎性水肿渗出',
    level: 'Level A',
    guideline: 'ETHOS Trial (N=8,509) · IMPACT Study',
    details: '适用于高嗜酸性粒细胞或频繁急性加重患者，降低加重住院率 25%。'
  },

  // 轨道 4: 非药物与康复 (INTERVENTION)
  {
    id: 'inter_rehab',
    name: '缩唇腹式呼吸康复',
    category: 'INTERVENTION',
    pos: [-2.1, -1.5, -0.6],
    size: 0.26,
    color: '#38bdf8',
    emissive: '#0284c7',
    evidence: '延缓呼气流速，形成呼气末气道内生正压，防小气道过早闭合',
    level: 'Level A',
    guideline: 'ATS/ERS Statement on Pulmonary Rehabilitation',
    details: '训练膈肌代偿活动，降低呼吸做功耗氧量，改善 6 分钟步行距离 (6MWD)。'
  },
  {
    id: 'inter_bipap',
    name: '家庭无创正压通气 (BiPAP)',
    category: 'INTERVENTION',
    pos: [-0.8, -2.1, 0.9],
    size: 0.28,
    color: '#38bdf8',
    emissive: '#0284c7',
    evidence: '夜间双水平正压通气，有效克服内源性 PEEP (PEEPi)',
    level: 'Level A',
    guideline: 'HOT-HMV Trial · ERS Task Force Guidelines 2025',
    details: '使重度高碳酸血症或呼吸肌疲劳患者再住院风险降低 51%。'
  },

  // 轨道 5: 急性加重危象 (EXACERBATION)
  {
    id: 'exac_alert',
    name: 'AECOPD 72h 加重预警',
    category: 'EXACERBATION',
    pos: [2.3, 1.5, -0.2],
    size: 0.3,
    color: '#f43f5e',
    emissive: '#be123c',
    evidence: '静息血氧走低 + 气道阻抗波动 + 冷空气突变综合预警',
    level: 'Level A',
    guideline: 'Lancet Digital Health: AI Early Warning for COPD Exacerbations',
    details: '提前 72 小时干预，阻断急性加重发展为 II 型呼吸衰竭需插管危机。'
  }
];

// 连线拓扑
const KG_EDGES: KG3DEdge[] = [
  { from: 'copd_core', to: 'diag_gold3', relation: '分级标准', color: '#fbbf24' },
  { from: 'copd_core', to: 'diag_laa', relation: '影像标志', color: '#fbbf24' },
  { from: 'copd_core', to: 'diag_rb3', relation: '解剖病灶', color: '#f87171' },
  { from: 'copd_core', to: 'path_inflam', relation: '核心病理', color: '#c084fc' },
  { from: 'copd_core', to: 'path_hypox', relation: '生理改变', color: '#c084fc' },
  { from: 'copd_core', to: 'drug_lama', relation: '首选药物', color: '#34d399' },
  { from: 'copd_core', to: 'drug_laba', relation: '联合舒张', color: '#34d399' },
  { from: 'copd_core', to: 'drug_ics', relation: '强化抗炎', color: '#34d399' },
  { from: 'copd_core', to: 'inter_rehab', relation: '非药物治疗', color: '#38bdf8' },
  { from: 'copd_core', to: 'inter_bipap', relation: '器械支持', color: '#38bdf8' },
  { from: 'copd_core', to: 'exac_alert', relation: '高危预警', color: '#f43f5e' },

  // 跨节点关联
  { from: 'diag_gold3', to: 'drug_lama', relation: '指南推荐', color: '#10b981' },
  { from: 'diag_gold3', to: 'drug_laba', relation: '双联协同', color: '#10b981' },
  { from: 'exac_alert', to: 'drug_ics', relation: '抗炎指征', color: '#34d399' },
  { from: 'path_hypox', to: 'inter_bipap', relation: '机械通气', color: '#38bdf8' },
  { from: 'diag_rb3', to: 'path_inflam', relation: '组织重构', color: '#c084fc' }
];

// ==========================================
// 1. 3D 星轨与能量连线组件
// ==========================================
function GalaxyOrbitsAndLines({
  selectedNodeId,
  onSelectNode
}: {
  selectedNodeId: string;
  onSelectNode: (node: KG3DNode) => void;
}) {
  const nodeMap = useMemo(() => {
    const map = new Map<string, KG3DNode>();
    KG_NODES.forEach((n) => map.set(n.id, n));
    return map;
  }, []);

  const edgeLines = useMemo(() => {
    return KG_EDGES.map((edge) => {
      const src = nodeMap.get(edge.from);
      const dst = nodeMap.get(edge.to);
      if (!src || !dst) return null;

      const p1 = new THREE.Vector3(...src.pos);
      const p2 = new THREE.Vector3(...dst.pos);
      const points = [p1, p2];

      const isConnected = selectedNodeId === edge.from || selectedNodeId === edge.to;

      return {
        id: `${edge.from}-${edge.to}`,
        points,
        color: isConnected ? '#38bdf8' : edge.color,
        opacity: isConnected ? 0.9 : 0.28,
        width: isConnected ? 2 : 1
      };
    }).filter(Boolean);
  }, [nodeMap, selectedNodeId]);

  return (
    <group>
      {/* 核心同心轨道圆环 (Orbiting Rings) */}
      {[1.9, 2.4, 2.9].map((radius, idx) => (
        <mesh key={idx} rotation={[Math.PI / 2 + idx * 0.2, idx * 0.3, 0]}>
          <ringGeometry args={[radius - 0.015, radius + 0.015, 64]} />
          <meshBasicMaterial
            color="#0891b2"
            transparent
            opacity={0.18 - idx * 0.03}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* 能量连线 */}
      {edgeLines.map((edge) => {
        if (!edge) return null;
        const lineGeo = new THREE.BufferGeometry().setFromPoints(edge.points);
        const lineMat = new THREE.LineBasicMaterial({
          color: edge.color,
          transparent: true,
          opacity: edge.opacity,
          linewidth: edge.width
        });
        const lineObj = new THREE.Line(lineGeo, lineMat);
        return <primitive key={edge.id} object={lineObj} />;
      })}

      {/* 3D 节点球体与悬浮标签 */}
      {KG_NODES.map((node) => {
        const isSelected = selectedNodeId === node.id;
        const isCore = node.id === 'copd_core';

        return (
          <group key={node.id} position={node.pos}>
            {/* 实体发光球 */}
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                onSelectNode(node);
              }}
            >
              <sphereGeometry args={[node.size, isCore ? 32 : 20, isCore ? 32 : 20]} />
              <meshPhysicalMaterial
                color={isSelected ? '#38bdf8' : node.color}
                emissive={isSelected ? '#0284c7' : node.emissive}
                emissiveIntensity={isSelected ? 0.9 : isCore ? 0.6 : 0.4}
                roughness={0.2}
                clearcoat={0.6}
              />
            </mesh>

            {/* 核心主球外围脉冲光环 (Corona Ring) */}
            {isCore && (
              <mesh scale={[1.4, 1.4, 1.4]}>
                <sphereGeometry args={[node.size, 16, 16]} />
                <meshBasicMaterial color="#06b6d4" transparent opacity={0.25} wireframe />
              </mesh>
            )}

            {/* 选中光晕 */}
            {isSelected && !isCore && (
              <mesh scale={[1.35, 1.35, 1.35]}>
                <sphereGeometry args={[node.size, 16, 16]} />
                <meshBasicMaterial color="#38bdf8" transparent opacity={0.4} wireframe />
              </mesh>
            )}

            {/* 3D 悬浮节点标签 */}
            <Html distanceFactor={8} position={[0, node.size + 0.14, 0]}>
              <div
                onClick={() => onSelectNode(node)}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap cursor-pointer transition shadow-lg ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 font-bold scale-110 shadow-cyan-500/50'
                    : 'bg-slate-900/90 text-slate-200 border border-slate-700/80 hover:border-cyan-400'
                }`}
              >
                {node.name}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

// ==========================================
// 2. 主知识图谱工作台
// ==========================================
export const KnowledgeGraphView: React.FC<KnowledgeGraphViewProps> = ({
  patient,
  initialNodeId = 'drug_lama',
  onOpenKnowledgeGraphModal
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>(initialNodeId);

  const currentNode = useMemo(() => {
    return KG_NODES.find((n) => n.id === selectedNodeId) || KG_NODES[0];
  }, [selectedNodeId]);

  return (
    <div className="flex-1 h-full p-4 overflow-y-auto space-y-4 flex flex-col bg-slate-950 text-slate-100 select-none">
      {/* 顶栏控制 */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-cyan-400" />
            3D 悬浮星轨力导向慢阻肺知识图谱 (3D Galaxy Knowledge Graph)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            以 COPD 为引力核心，沿空间星轨环绕表型诊断、病理分子机制、吸入药物指南与肺康复处方语义网络
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono text-cyan-400 px-3 py-1 rounded-xl bg-cyan-950 border border-cyan-800">
            选中实体: {currentNode.name}
          </span>
          {onOpenKnowledgeGraphModal && (
            <button
              onClick={onOpenKnowledgeGraphModal}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>全屏 2D/3D 混合检索</span>
            </button>
          )}
        </div>
      </div>

      {/* 3D 知识星云视口与临床循证证据卡 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-[580px]">
        {/* 左侧 2 列: 3D 知识星轨视口 */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 relative shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between text-xs px-2 text-slate-300 z-10">
            <div className="flex items-center gap-2 font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-bold text-slate-200">3D CLINICAL SEMANTIC SPACE</span>
              <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                12 核心实体 · 16 循证边
              </span>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> 诊断表型
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> 药物治疗
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-400" /> 病理机理
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-400" /> 加重危象
              </span>
            </div>
          </div>

          {/* Three.js 3D 星云 Canvas */}
          <div className="flex-1 w-full rounded-xl bg-slate-950/95 border border-slate-800 relative overflow-hidden min-h-[380px]">
            <Canvas camera={{ position: [0, 2.5, 6.2], fov: 48 }}>
              <ambientLight intensity={1.0} />
              <pointLight position={[8, 8, 8]} intensity={1.5} />
              <pointLight position={[-8, -8, -8]} color="#06b6d4" intensity={0.8} />

              <GalaxyOrbitsAndLines
                selectedNodeId={selectedNodeId}
                onSelectNode={(node) => setSelectedNodeId(node.id)}
              />

              <OrbitControls
                enableDamping
                dampingFactor={0.06}
                rotateSpeed={0.8}
                zoomSpeed={1.0}
                panSpeed={0.8}
                minDistance={3.5}
                maxDistance={12.0}
              />
            </Canvas>

            {/* 底部交互提示 */}
            <div className="absolute bottom-3 right-3 pointer-events-none text-[10px] text-slate-400 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
              点击任意 3D 实体球体可调阅循证指南 · 左键旋转视口
            </div>
          </div>

          {/* 快捷实体分类过滤标签 */}
          <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-slate-950/90 border border-slate-800">
            {KG_NODES.map((node) => (
              <button
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  selectedNodeId === node.id
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-850'
                }`}
              >
                {node.name}
              </button>
            ))}
          </div>
        </div>

        {/* 右侧：临床循证指南依据与处方依据卡片 */}
        <div className="space-y-4 flex flex-col">
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3 flex-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-100 flex items-center gap-1.5 text-sm">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                {currentNode.name}
              </span>
              <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700">
                {currentNode.level}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] block font-mono">权威指南溯源</span>
                <span className="text-cyan-300 font-semibold leading-relaxed">
                  {currentNode.guideline}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] block font-mono">循证医学证据 (Clinical Evidence)</span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {currentNode.evidence}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] block font-mono">临床机理与处方指引</span>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  {currentNode.details}
                </p>
              </div>

              {/* 针对患者张*民的个体化匹配研判 */}
              <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-800/50 space-y-1.5">
                <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  患者个体化决策校验结论
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  患者当前 FEV1 46.2% (GOLD 3级 C组)，伴有频繁急性加重高危特征与 RB3 重塑狭窄，符合 GOLD 2026 方案 C (三联强化)，目前处方依从性良好，推荐持续巩固。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
