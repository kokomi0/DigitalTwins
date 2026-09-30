import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PatientMeta, AnatomyNode, AnatomyEdge, SimulationFrame, CTScanMeta } from '../../types';
import { TwinViewer3D } from '../../components/3d/TwinViewer3D';
import { AnatomyTree } from '../../components/clinical/AnatomyTree';
import { AirwayWaveformChart } from '../../components/clinical/AirwayWaveformChart';
import { DataFlowPipeline } from '../../components/common/DataFlowPipeline';
import { Activity, Share2, AlertCircle } from 'lucide-react';

// 8 大子业务高阶 3D 沉浸式视口视图
import { DoctorTwinStationView } from './DoctorTwinStationView';
import { CTImportView } from './CTImportView';
import { EndoscopyView } from './EndoscopyView';
import { EBUSMappingView } from './EBUSMappingView';
import { ProgressionView } from './ProgressionView';
import { KnowledgeGraphView } from './KnowledgeGraphView';
import { AECOPDAlertView } from './AECOPDAlertView';
import { PatientEHRView } from './PatientEHRView';

interface DoctorWorkbenchProps {
  activeMenuId: string;
  patient: PatientMeta;
  nodes: AnatomyNode[];
  edges: AnatomyEdge[];
  selectedNode: AnatomyNode | null;
  onSelectNode: (node: AnatomyNode) => void;
  simulationFrame: SimulationFrame;
  history: Array<{ time: string; pressure: number; flow: number }>;
  isWireframe: boolean;
  lodLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  onEbusClick: (station: string) => void;
  onOpenCTModal: () => void;
  onOpenKnowledgeGraph: (nodeId?: string) => void;
  onReconstructComplete?: (ctMeta: CTScanMeta) => void;
  isModalOpen?: boolean;
}

export const DoctorWorkbench: React.FC<DoctorWorkbenchProps> = ({
  activeMenuId,
  patient,
  nodes,
  edges,
  selectedNode,
  onSelectNode,
  simulationFrame,
  history,
  isWireframe,
  lodLevel,
  onEbusClick,
  onOpenCTModal,
  onOpenKnowledgeGraph,
  onReconstructComplete,
  isModalOpen = false
}) => {
  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col bg-slate-950 text-slate-100">
      <AnimatePresence mode="wait">
        {/* ================= 菜单 1: 3D肺部孪生阅片 (一屏一患者，一屏全貌可视化工作站) ================= */}
        {activeMenuId === '3d_twin_viewer' && (
          <motion.div
            key="3d_twin_viewer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 h-full overflow-hidden"
          >
            <DoctorTwinStationView
              patient={patient}
              nodes={nodes}
              selectedNode={selectedNode}
              onSelectNode={onSelectNode}
              simulationFrame={simulationFrame}
              history={history}
              isWireframe={isWireframe}
              lodLevel={lodLevel}
              onEbusClick={onEbusClick}
              onOpenKnowledgeGraph={onOpenKnowledgeGraph}
              isModalOpen={isModalOpen}
            />
          </motion.div>
        )}

        {/* ================= 菜单 2: CT影像导入与重建 (3D MPR & LAA-950点云) ================= */}
        {activeMenuId === 'ct_reconstruction' && (
          <motion.div
            key="ct_reconstruction"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 h-full overflow-hidden"
          >
            <CTImportView
              patient={patient}
              onOpenCTModal={onOpenCTModal}
              onReconstructComplete={onReconstructComplete}
            />
          </motion.div>
        )}

        {/* ================= 菜单 3: 支气管树B1-B10腔内探查 (3D 虚拟支气管镜漫游) ================= */}
        {activeMenuId === 'bronchial_endoscopy' && (
          <motion.div
            key="bronchial_endoscopy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 h-full overflow-hidden"
          >
            <EndoscopyView
              patient={patient}
              initialSegment={selectedNode?.id || 'RB3'}
              onOpenKnowledgeGraph={onOpenKnowledgeGraph}
            />
          </motion.div>
        )}

        {/* ================= 菜单 4: IASLC 1R-12L 淋巴结超声分站 (3D 拓扑与超声扇面) ================= */}
        {activeMenuId === 'ebus_tbna' && (
          <motion.div
            key="ebus_tbna"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 h-full overflow-hidden"
          >
            <EBUSMappingView
              patient={patient}
              onEbusClick={onEbusClick}
              onOpenKnowledgeGraph={onOpenKnowledgeGraph}
              isModalOpen={isModalOpen}
            />
          </motion.div>
        )}

        {/* ================= 菜单 5: COPD全生命周期病情推演 (3D 双孪生形变对比时空滑块) ================= */}
        {activeMenuId === 'disease_trajectory' && (
          <motion.div
            key="disease_trajectory"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 h-full overflow-hidden"
          >
            <ProgressionView
              patient={patient}
              onOpenKnowledgeGraph={onOpenKnowledgeGraph}
            />
          </motion.div>
        )}

        {/* ================= 菜单 6: 临床知识图谱辅助决策 (3D 悬浮星轨知识星云) ================= */}
        {activeMenuId === 'clinical_kg' && (
          <motion.div
            key="clinical_kg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 h-full overflow-hidden"
          >
            <KnowledgeGraphView
              patient={patient}
              initialNodeId="copd_core"
              onOpenKnowledgeGraphModal={() => onOpenKnowledgeGraph()}
            />
          </motion.div>
        )}

        {/* ================= 菜单 7: AECOPD急性加重早期预警 (3D 气流湍流危象与炎症热力图) ================= */}
        {activeMenuId === 'aecopd_alert' && (
          <motion.div
            key="aecopd_alert"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 h-full overflow-hidden"
          >
            <AECOPDAlertView
              patient={patient}
              onOpenKnowledgeGraph={onOpenKnowledgeGraph}
            />
          </motion.div>
        )}

        {/* ================= 菜单 8: 患者全景电子健康档案 (3D 全息数字人站立投影) ================= */}
        {activeMenuId === 'patient_ehr' && (
          <motion.div
            key="patient_ehr"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 h-full overflow-hidden"
          >
            <PatientEHRView
              patient={patient}
              onOpenKnowledgeGraph={onOpenKnowledgeGraph}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
