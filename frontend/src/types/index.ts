export * from './auth';

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
