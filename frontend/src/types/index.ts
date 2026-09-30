export * from './auth';
export * from './navigation';

export type RoleCode = 
  | 'pulmonologist' 
  | 'twin_engineer' 
  | 'reviewer' 
  | 'patient_rep';

export interface UserProfile {
  id: number;
  username: string;
  real_name: string;
  role_code: RoleCode;
  role_name: string;
  institution: string;
  department?: string;
  staff_id?: string;
  title?: string;
  permissions: string[];
}

export interface PatientMeta {
  id: number;
  patient_uid: string;
  anon_code: string;
  patient_name: string;
  gender: string;
  age: number;
  inpatient_no: string;
  bed_no: string;
  smoking_pack_years: number;
  gold_stage: string;
  fev1_pred: number;
  fvc_liters: number;
  fev1_fvc_ratio: number;
  airway_resistance: number;
  spo2_resting: number;
  aecopd_risk_prob: number;
  aecopd_risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  primary_lesion_segment: string;
  hospital_cluster_id: string;
  university_task_id: string;
  comorbidities: string[];
  laa_pct: number; // 肺气肿低衰减区占比 (LAA% < -950HU)
  ct_scan_date: string;
  ct_series_id: string;
  current_meds: string[];
}

export interface CTScanMeta {
  series_id: string;
  patient_uid: string;
  modality: 'HRCT' | 'SpiralCT';
  slice_count: number;
  thickness_mm: number;
  kvp: number;
  ma: number;
  window_width: number;
  window_level: number;
  laa_pct: number;
  stenosis_segment: string;
  stenosis_ratio: number;
  scan_time: string;
}

export interface AnatomyNode {
  id: string;
  label: 'Bronchus' | 'LymphNode' | 'Lobe';
  name_cn: string;
  name_en?: string;
  generation?: number;
  diameter?: number;
  coords: [number, number, number];
  lobe?: string;
  station?: string;
  ebus?: boolean;
  vessel?: string;
  ebus_desc?: string;
  status?: string;
  is_lesion?: boolean;
  stenosis_pct?: number;
  clinical_status?: string;
}

export interface AnatomyEdge {
  source: string;
  target: string;
  type: 'BRANCHES_TO' | 'ADJACENT_TO' | 'OCCLUDES';
}

export interface SimulationFrame {
  timestamp: number;
  phase: 'INSPIRATION' | 'EXPIRATION';
  metrics: {
    airway_pressure_kpa: number;
    airway_pressure_cmh2o: number;
    flow_rate_lps: number;
    tidal_volume_liters: number;
    expansion_ratio: number;
    flutter_displacement: number;
    stenosis_ratio: number;
    current_raw: number;
  };
  pressure_field: Array<{
    id: string;
    pressure_kpa: number;
    velocity_mps: number;
    critical?: boolean;
  }>;
}

export interface AuditLogItem {
  id: number;
  user_id: number;
  username: string;
  role_code: string;
  action: string;
  resource_target: string;
  client_ip: string;
  detail: any;
  prev_hash: string;
  curr_hash: string;
  created_at: string;
}

export interface PipelineTelemetry {
  channel_status: string;
  tunnel_type: string;
  source_cluster: string;
  target_cluster: string;
  total_packages_screened: number;
  blocked_privacy_leaks: number;
  average_latency_ms: number;
  throughput_mbps: number;
  last_handshake: string;
}

// 知识图谱相关语义节点与边定义
export type KGNodeType = 'disease' | 'symptom' | 'anatomy' | 'diagnostics' | 'medication' | 'rehabilitation';

export interface KnowledgeGraphNode {
  id: string;
  name: string;
  category: KGNodeType;
  level?: number;
  description: string;
  evidence_level?: 'A' | 'B' | 'C';
  guideline?: string;
  linked_anatomy_id?: string;
  badge?: string;
}

export interface KnowledgeGraphEdge {
  source: string;
  target: string;
  relation: string;
  desc?: string;
}

export interface KnowledgeGraphData {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
}

// ==========================================
// 双中心临床协同平台核心类型定义
// ==========================================
export type ClinicalCenter = 'SANYA_COPD' | 'HUAXI_BRAIN';

// 华西医院神经外科脑胶质瘤数字孪生患者元数据
export interface BrainTumorPatientMeta {
  id: number;
  patient_uid: string;
  anon_code: string;
  patient_name: string;
  gender: string;
  age: number;
  inpatient_no: string;
  bed_no: string;
  pathology: string;
  tumor_location: string;
  tumor_volume_cm3: number;
  edema_volume_cm3: number;
  kps_score: number;
  molecular_markers: {
    idh1: string;
    mgmt: string;
    tert: string;
    codeletion_1p19q: string;
  };
  surgery_status: '术前评估中' | '入路规划就绪' | '放疗随访期';
  rano_status: string;
  safety_margin_mm: number;
  primary_risks: string[];
}

// ATLAS Meditech 3D 虚拟手术路径规划参数
export interface SurgicalTrajectory {
  entryPoint: [number, number, number];
  targetPoint: [number, number, number];
  angleYaw: number;
  anglePitch: number;
  insertionDepthMm: number;
  distanceToTumorMm: number;
  distanceToVesselMm: number;
  distanceToFunctionMm: number;
  riskLevel: 'SAFE' | 'WARNING' | 'CRITICAL';
}

// Neosoma FDA 510(k) 纵向随访与真假进展数据
export interface NeosomaFollowupPoint {
  timepoint: string;
  label: string;
  date: string;
  gtv_cm3: number; // 肿瘤肉眼体积
  ctv_cm3: number; // 临床侵润区
  ptv_cm3: number; // 计划放疗靶区
  rcbv_ratio: number; // 相对脑血容量比值 (PWI)
  cho_naa_ratio: number; // 胆碱/N-乙酰天门冬氨酸比值 (MRS)
  pseudoprogression_prob: number; // 假性进展概率 %
  true_progression_prob: number; // 真实进展概率 %
  clinical_summary: string;
}

// 中美数字孪生仿真引擎对标工具
export interface BenchmarkTool {
  id: string;
  name: string;
  origin: string;
  specialty: 'COPD' | 'BRAIN_TUMOR';
  scorePracticality: number; // 临床实用性 0-100
  scoreFidelity: number; // 机理保真度 0-100
  scoreRealtime: number; // 实时性 0-100
  regulatoryStatus: string; // FDA / CE / NMPA
  coreTech: string;
  pros: string[];
  cons: string[];
  clinicalAdoptionStatus: string;
}

